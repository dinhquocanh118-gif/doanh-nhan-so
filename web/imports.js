const limit=45000;
export function checkedText(text){
 text=text.replace(/\u0000/g,'').trim();
 if(text.length<12)throw Error('Không đủ văn bản để tạo hồ sơ. Với PDF scan, hãy dùng bản có lớp chữ hoặc dán văn bản đã OCR.');
 if(text.length>limit)throw Error('Nguồn dài hơn 45.000 ký tự. Hãy chia nhỏ hoặc chỉ nhập phần tiểu sử liên quan.');
 return text;
}
export async function readFile(file){
 if(file.size>8*1024*1024)throw Error('Mỗi tệp tối đa 8 MB.');
 const ext=file.name.split('.').pop().toLowerCase();
 let content='';
 if(ext==='txt'||ext==='md'){const buf=await file.arrayBuffer();const v=new Uint8Array(buf);content=new TextDecoder(v[0]===255&&v[1]===254?'utf-16le':v[0]===254&&v[1]===255?'utf-16be':'utf-8').decode(buf);}
 else if(ext==='docx'){const buf=await file.arrayBuffer();const dv=new DataView(buf);let total=0;
 for(let i=0;i+46<=dv.byteLength;i++){if(dv.getUint32(i,true)===0x02014b50){total+=dv.getUint32(i+24,true);if(total>45e6)throw Error('Tệp DOCX quá lớn sau giải nén.');i+=45+dv.getUint16(i+28,true)+dv.getUint16(i+30,true)+dv.getUint16(i+32,true);}}
 const m=await import('mammoth/mammoth.browser');content=(await m.default.extractRawText({arrayBuffer:buf})).value;}
 else if(ext==='pdf'){const pdf=await import('pdfjs-dist/build/pdf.mjs');pdf.GlobalWorkerOptions.workerSrc=new URL('./assets/pdf.worker.min.mjs',document.baseURI).href;
 const doc=await pdf.getDocument({data:await file.arrayBuffer(),isEvalSupported:false,useSystemFonts:true}).promise;
 try{if(doc.numPages>100)throw Error('Hãy chọn PDF có tối đa 100 trang.');
 for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i),block=await page.getTextContent();content+=block.items.map(x=>(x.str||'')+(x.hasEOL?'\n':' ')).join('')+'\n';if(content.length>limit)break;}}finally{await doc.destroy();}}
 else throw Error('Hãy chọn TXT, DOCX hoặc PDF.');
 return {label:file.name,kind:ext.toUpperCase(),text:checkedText(content)};
}
export async function readUrl(raw){
 const u=new URL(raw);if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port||!u.hostname.includes('.')||/^[\d.]+$/.test(u.hostname)||u.hostname.includes(':')||/\.(local|internal|localhost)$/i.test(u.hostname))throw Error('Hãy dùng liên kết web công khai.');
 const blocked='Trang yêu cầu đăng nhập hoặc chưa cho phép đọc. Hãy xuất PDF từ LinkedIn hoặc dán phần giới thiệu vào mục Văn bản.';
 const res=await fetch('https://r.jina.ai/'+u.href,{headers:{Accept:'text/plain'},credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(22000)});
 if(!res.ok)throw Error(blocked);let text=await res.text();
 text=text.split('Markdown Content:').at(-1).trim();
 if(text.length<80||/authwall|just a moment\.\.\.|sign in to (view|continue)|checking your browser|security checkpoint|robots\.txt denied/i.test(text.slice(0,1500)))throw Error(blocked);
 return {label:u.href,kind:'URL',text:checkedText(text)};
}
