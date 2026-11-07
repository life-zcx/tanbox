import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadEnv } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await build({
  entryPoints: [path.join(root, 'scripts/generate-ssg.ts')],
  outfile: path.join(root, 'scripts/run-ssg.mjs'),
  bundle: true, platform: 'node', format: 'esm', packages: 'external',
  jsx: 'automatic',
  define: { 'import.meta.env': JSON.stringify({ ...loadEnv('production', root, 'VITE_'), PROD: true }) },
});
await import('./run-ssg.mjs?build=' + Date.now());
