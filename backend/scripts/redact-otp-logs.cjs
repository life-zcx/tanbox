// Run with the application stopped so no writer holds a stale file descriptor.
// Preserves journal entries and timestamps, replacing only sensitive values.
const fs = require('node:fs');
const path = require('node:path');
const { redactLogText } = require('../dist/utils/redact');
const dir = path.resolve(process.cwd(), 'logs');
let files = 0, lines = 0;
for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
  if (!entry.isFile() || !/^(access|error|frontend)\.log(?:\.\d+)?$/.test(entry.name)) continue;
  const file = path.join(dir, entry.name);
  const text = fs.readFileSync(file, 'utf8');
  const updated = text.split('\n').map(line => {
    const safe = redactLogText(line);
    if (safe !== line) lines++;
    return safe;
  }).join('\n');
  if (updated !== text) { fs.writeFileSync(file, updated, { mode: 0o600 }); files++; }
}
console.log(JSON.stringify({ redactedFiles: files, redactedLines: lines }));
