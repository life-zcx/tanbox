const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { Readable } = require('node:stream');
const { EventEmitter } = require('node:events');
const Module = require('node:module');
const initial = process.cwd(), directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tanbox-backup-'));
process.chdir(directory);
let contents, exitCode;
const original = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'child_process' && parent.filename.endsWith('backup.service.js')) return { spawn: () => {
    const child = new EventEmitter(); child.stdout = Readable.from([contents]); child.stderr = Readable.from([]); child.kill = () => {};
    child.stdout.on('end', () => process.nextTick(() => child.emit('close', exitCode)));
    return child;
  } };
  return original.call(this, request, parent, isMain);
};
const backup = require('../dist/services/backup.service');
Module._load = original;
beforeEach(() => { contents = '-- PostgreSQL database dump\n-- fixture\n-- PostgreSQL database dump complete\n'; exitCode = 0; });
after(() => { process.chdir(initial); assert.equal(path.dirname(directory), os.tmpdir()); fs.rmSync(directory, { recursive: true, force: true }); });

test('completed dump is atomically published, while failed or truncated files never become backups', async () => {
  const complete = await backup.createDatabaseBackup();
  assert.ok(fs.existsSync(complete.filePath)); assert.equal((await backup.getBackupsList()).length, 1);
  contents = '-- partial dump'; exitCode = 1;
  await assert.rejects(backup.createDatabaseBackup());
  assert.equal((await backup.getBackupsList()).length, 1);
  assert.ok(!fs.readdirSync(backup.backupsDir).some(name => name.endsWith('.part')));
  exitCode = 0;
  await assert.rejects(backup.createDatabaseBackup(), /incomplete/);
  fs.writeFileSync(path.join(backup.backupsDir, 'tanbox_legacy.sql'), contents);
  assert.equal((await backup.getBackupsList()).length, 1);
});
