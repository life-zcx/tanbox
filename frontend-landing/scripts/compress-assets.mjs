import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
async function compress(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) await compress(file);
    else if (/\.(svg|js|css|html)$/.test(entry.name)) {
      const input = await readFile(file);
      if (input.length >= 1024) await writeFile(file + '.gz', gzipSync(input, { level: 9 }));
    }
  }
}
await compress('dist');
