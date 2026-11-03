// Run after building all frontends. Uses an isolated browser profile and local API fixtures.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webm': 'video/webm', '.mp4': 'video/mp4', '.ico': 'image/x-icon' };
const csp = fs.readFileSync(path.join(root, 'Caddyfile'), 'utf8').match(/Content-Security-Policy "([^"]+)"/)[1];

async function run() {
  const executable = process.env.CHROME_PATH || [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
  ].find(file => fs.existsSync(file));
  if (!executable) throw new Error('Set CHROME_PATH to a Chromium browser executable.');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tanbox-smoke-'));
  const chrome = spawn(executable, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--no-first-run', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  const servers = []; let ws; let authStatus = 503;
  try {
    for (let i = 0; i < 100 && !fs.existsSync(path.join(profile, 'DevToolsActivePort')); i++) await sleep(100);
    const port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0];
    const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let id = 0; const pending = new Map(); const exceptions = [];
    ws.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id); }
      else if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    };
    const command = (method, params = {}) => new Promise((resolve, reject) => {
      const n = ++id;
      const timer = setTimeout(() => { pending.delete(n); reject(new Error('Browser timeout: ' + method)); }, 10000);
      pending.set(n, message => { clearTimeout(timer); message.error ? reject(new Error(message.error.message)) : resolve(message.result); });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
    const evaluate = async expression => (await command('Runtime.evaluate', { expression, returnByValue: true })).result.value;
    const waitFor = async expression => {
      for (let i = 0; i < 50; i++) { if (await evaluate(expression)) return; await sleep(100); }
      throw new Error('Browser condition failed: ' + expression);
    };
    await command('Page.enable'); await command('Runtime.enable'); await command('Network.enable');
    await command('Network.setBlockedURLs', { urls: ['*://*.google*/*', '*://mc.yandex.*/*', '*://static.cloudflareinsights.com/*'] });
    for (const project of ['frontend-landing', 'frontend-lk', 'frontend-admin']) {
      const dist = path.join(root, project, 'dist');
      const server = http.createServer((req, res) => {
        const pathname = new URL(req.url, 'http://localhost').pathname;
        if (pathname.startsWith('/api/')) {
          res.setHeader('Content-Type', 'application/json');
          if (pathname === '/api/auth/me') { res.statusCode = authStatus; res.end(JSON.stringify({ message: 'fixture' })); }
          else if (pathname === '/api/health') res.end(JSON.stringify({ status: 'ok', maintenance: false }));
          else if (pathname === '/api/tariffs') res.end(JSON.stringify({ tariffs: [], pricingSettings: {} }));
          else res.end('{}');
          return;
        }
        let file = path.resolve(dist, '.' + decodeURIComponent(pathname));
        if (!file.startsWith(dist + path.sep) && file !== dist) { res.writeHead(403); res.end(); return; }
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        if (!fs.existsSync(file)) {
          if (project === 'frontend-landing') { res.statusCode = 404; file = path.join(dist, '404.html'); }
          else file = path.join(dist, 'index.html');
        }
        res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
        res.setHeader('Content-Security-Policy', csp);
        fs.createReadStream(file).pipe(res);
      });
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); servers.push(server);
      const base = `http://127.0.0.1:${server.address().port}`;
      await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
      await command('Page.navigate', { url: base + (project === 'frontend-landing' ? '/' : '/login') });
      await waitFor('document.readyState === "complete" && document.body.innerText.length > 100');
      await sleep(1200);
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), project + ' overflows mobile viewport');
      if (project === 'frontend-landing') {
        await waitFor('!!document.getElementById("cookie-banner")');
        const overlaps = await evaluate(`(() => {
          const banner = document.getElementById('cookie-banner').getBoundingClientRect();
          const widget = [...document.querySelectorAll('button')].find(button => (button.getAttribute('aria-label') || '').includes('WhatsApp'))?.getBoundingClientRect();
          return widget && widget.bottom > banner.top && widget.top < banner.bottom;
        })()`);
        assert.equal(overlaps, false, 'WhatsApp overlaps cookie consent');
        for (const route of ['/kz/payments', '/en/payment', '/en/cookie-policy', '/kz/cookie-policy']) assert.equal((await fetch(base + route)).status, 200, route);
        const article = fs.readdirSync(path.join(dist, 'articles'), { withFileTypes: true }).find(entry => entry.isDirectory());
        assert.ok(article, 'article fixture missing');
        assert.equal((await fetch(base + '/en/blog/' + article.name)).status, 200, 'localized article alias');
        console.log('PASS landing: mobile, cookie consent and localized direct routes');
      } else {
        const key = project === 'frontend-lk' ? 'tanbox_token' : 'tanbox_admin_token';
        await evaluate(`localStorage.setItem('${key}', 'smoke-session')`);
        authStatus = 503;
        await command('Page.navigate', { url: base + '/login' });
        await waitFor('document.body.innerText.includes("Сессия сохранена")');
        assert.equal(await evaluate(`localStorage.getItem('${key}')`), 'smoke-session');
        authStatus = 401;
        await evaluate('document.querySelector("button").click()');
        await waitFor(`localStorage.getItem('${key}') === null`);
        console.log('PASS ' + project + ': transient failure retains session; 401 revokes it');
      }
    }
    assert.deepEqual(exceptions, [], 'Uncaught browser errors');
  } finally {
    ws?.close(); chrome.kill();
    await Promise.all(servers.map(server => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); })));
    // The OS may retain browser profile files briefly; only this isolated profile is removed.
    if (!path.resolve(profile).startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(profile).startsWith('tanbox-smoke-')) throw new Error('Unexpected profile cleanup path');
    for (let i = 0; i < 10; i++) { try { fs.rmSync(profile, { recursive: true, force: true }); break; } catch { await sleep(200); } }
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
