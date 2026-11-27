import {build} from 'esbuild';
import {mkdir,cp,writeFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const item of ['index.html','assets','config.js']) await cp('web/'+item,'dist/'+item,{recursive:true});
await build({entryPoints:['web/app.js'],bundle:true,splitting:true,format:'esm',outdir:'dist',target:'es2022',external:['url'],minify:true,legalComments:'eof',chunkNames:'assets/[name]-[hash]'});
await cp('node_modules/pdfjs-dist/build/pdf.worker.min.mjs','dist/assets/pdf.worker.min.mjs');
await writeFile('dist/.nojekyll','');
