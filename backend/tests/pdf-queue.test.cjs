const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'tanbox-queue-test-'));
process.chdir(sandbox);
const { PdfGenerationQueue } = require(path.join(root, 'dist/services/pdfQueue.service'));
let index = 0;
const queue = n => new PdfGenerationQueue(n, path.join(sandbox, `${++index}.json`));
const tick = () => new Promise(resolve => setImmediate(resolve));

test('queue rejects excess waiting jobs instead of retaining an unbounded backlog', async () => {
  const q = queue(1); let finish;
  const first = q.enqueue('capacity-first', 'first', () => new Promise(resolve => { finish = resolve; }));
  const waiting = [];
  for (let i = 0; i < 8; i++) waiting.push(q.enqueue('capacity-' + i, 'waiting', async () => i));
  await assert.rejects(q.enqueue('excess', 'excess', async () => 99), error => error.status === 429);
  finish(0); await first; await Promise.all(waiting);
});
after(() => {
  process.chdir(root);
  assert.ok(path.resolve(sandbox).startsWith(path.resolve(os.tmpdir()) + path.sep));
  fs.rmSync(sandbox, { recursive: true, force: true });
});

test('cancel keeps an execution slot occupied until the worker actually stops', async () => {
  const q = queue(1); let finish; let secondStarted = false; let aborts = 0;
  const first = q.enqueue('first', 'first', () => new Promise(resolve => { finish = resolve; }), () => { aborts++; });
  const rejected = assert.rejects(first, /отменена/);
  const second = q.enqueue('second', 'second', async () => { secondStarted = true; return 2; });
  assert.equal(q.cancelTask('first'), true);
  assert.equal(q.cancelTask('first'), false);
  await rejected;
  assert.equal(aborts, 1);
  assert.equal(secondStarted, false);
  assert.equal(q.getStats().activeJobs, 1);
  finish(1);
  assert.equal(await second, 2);
  assert.deepEqual(q.getStats(), { activeJobs: 0, waitingJobs: 0, maxConcurrency: 1, totalCompleted: 1, totalFailed: 1 });
});

test('deduplication also works when a task throws synchronously', async () => {
  const q = queue(1);
  await assert.rejects(q.enqueue('key', 'key', () => { throw new Error('boom'); }), /boom/);
  assert.equal(await q.enqueue('key', 'key', async () => 7), 7);
  assert.equal(q.getStats().activeJobs, 0);
  assert.equal(q.getStats().totalFailed, 1);
});

test('clearAll rejects waiting tasks without releasing live workers twice', async () => {
  const q = queue(1); let finish;
  const first = q.enqueue('first', 'first', () => new Promise(resolve => { finish = resolve; }));
  const second = q.enqueue('second', 'second', async () => assert.fail('cancelled queued task ran'));
  const rejected = [assert.rejects(first), assert.rejects(second)];
  assert.equal(q.clearAll(), 2);
  await Promise.all(rejected);
  assert.equal(q.getStats().activeJobs, 1);
  finish(); await tick();
  assert.equal(q.getStats().activeJobs, 0);
  assert.equal(q.getStats().totalFailed, 2);
});
