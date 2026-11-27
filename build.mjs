import { build } from 'esbuild';
import { mkdir, cp, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const item of ['assets', 'config.js']) await cp('web/' + item, 'dist/' + item, { recursive: true });
await build({
  entryPoints: ['web/app.js'],
  bundle: true,
  splitting: true,
  format: 'esm',
  outdir: 'dist',
  target: 'es2022',
  external: ['url'],
  minify: true,
  legalComments: 'eof',
  chunkNames: 'assets/[name]-[hash]',
});
await cp('node_modules/pdfjs-dist/build/pdf.worker.min.mjs', 'dist/assets/pdf.worker.min.mjs');
// Mã phiên bản theo nội dung để trình duyệt không giữ app.js/app.css cũ sau mỗi lần triển khai.
const hash = createHash('sha256');
for (const file of ['dist/app.js', 'dist/app.css']) hash.update(await readFile(file));
const version = hash.digest('hex').slice(0, 10);
await writeFile('dist/index.html', (await readFile('web/index.html', 'utf8')).replaceAll('__BUILD__', version));
await writeFile('dist/.nojekyll', '');
