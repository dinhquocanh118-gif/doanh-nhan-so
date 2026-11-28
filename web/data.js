import {localRpc} from './localstore.js';
export const fields={name:'Họ và tên',role:'Chức danh',company:'Doanh nghiệp',bio:'Giới thiệu',skills:'Năng lực',experience:'Kinh nghiệm',projects:'Dự án',goals:'Nhu cầu hợp tác',contact:'Liên hệ'};
export const empty=()=>Object.fromEntries(Object.keys(fields).map(k=>[k,'']));
export const demo={
 name:'Trần Minh Anh',role:'Nhà sáng lập',company:'Mộc Studio',
 bio:'Tôi phát triển các sản phẩm nội thất từ vật liệu tái sử dụng. Tại Mộc Studio, tôi phụ trách thiết kế sản phẩm và xây dựng mạng lưới đối tác sản xuất.',
 skills:'Thiết kế sản phẩm, Phát triển đối tác, Vật liệu bền vững',
 experience:'2021 - nay | Nhà sáng lập, Mộc Studio\n2017 - 2021 | Phụ trách phát triển sản phẩm tại xưởng thiết kế nội thất',
 projects:'Dòng nội thất Gỗ Mới | Phát triển bộ bàn ghế mô-đun từ gỗ thu hồi.\nXưởng Mở | Tổ chức chương trình trải nghiệm thiết kế cho sinh viên.',
 goals:'Kết nối với đối tác phân phối nội thất và các xưởng cung cấp gỗ thu hồi tại Việt Nam.',contact:''};
export const normalize=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
const aliases={name:['họ và tên','họ tên','tên','full name','name'],role:['chức danh','chức vụ','vai trò','job title','title','position'],company:['doanh nghiệp','công ty','company','organization'],bio:['giới thiệu','tóm tắt','about','summary','profile'],skills:['kỹ năng','năng lực','skills','chuyên môn','expertise'],experience:['kinh nghiệm làm việc','kinh nghiệm','quá trình công tác','work experience','experience'],projects:['dự án tiêu biểu','dự án','projects'],goals:['nhu cầu hợp tác','mục tiêu kết nối','hợp tác','mục tiêu','goals'],contact:['liên hệ','email','contact']};
const aliasMap=new Map(Object.entries(aliases).flatMap(([key,names])=>names.map(s=>[normalize(s),key])));
export function extract(sources){
 const draft=empty(), free=[];
 for(const src of sources){
  let section='';
  for(const raw of src.text.split(/\r?\n/)){
   const line=raw.trim().replace(/^#{1,6}\s*/, '').replace(/\*\*/g,'');
   if(!line)continue;
   const colon=line.search(/[:：]/), label=colon>=0?line.slice(0,colon):line;
   const key=aliasMap.get(normalize(label.trim()));
   if(key){section=key;const v=colon<0?'':line.slice(colon+1).trim(); if(v)add(key,v);continue}
   if(section){if(['name','role','company'].includes(section)&&draft[section])section='';else {add(section,line);continue}}
   free.push(line);
  }
 }
 function add(k,s){if(!draft[k])draft[k]=s;else if(!['name','role','company'].includes(k)&&!draft[k].split('\n').includes(s))draft[k]+='\n'+s;}
 if(!draft.name){const n=free.find(s=>s.length<=65&&/^[\p{Lu}][\p{L}'’-]+(?:\s+[\p{Lu}][\p{L}'’-]+){1,5}$/u.test(s)&&!/(curriculum|resume|hồ sơ|lý lịch)/i.test(s));if(n)draft.name=n;}
 if(!draft.role)draft.role=free.find(s=>s.length<130&&/founder|giám đốc|quản lý|nhà sáng lập|chuyên viên|manager|director|CEO/i.test(s))||'';
 if(!draft.bio)draft.bio=free.filter(s=>s!==draft.name&&s!==draft.role&&s.length>35&&!/@/.test(s)).slice(0,3).join(' ').slice(0,900);
 if(!draft.experience)draft.experience=free.filter(x=>/\b(?:19|20)\d{2}\b/.test(x)).slice(0,12).join('\n');
 if(!draft.contact)draft.contact=sources.map(s=>s.text).join('\n').match(/[\w.%+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0]||'';
 return draft;
}
const stop=new Set('toi la cua va ho so nguoi nay co gi hay cho biet ve can tim voi muon mot duoc khong the nao nhung trong da dang anh chi ban ay xin hoi'.split(' '));
const tokens=t=>[...new Set(normalize(t).replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(x=>x.length>1&&!stop.has(x)))];
export function lookup(draft,q,match=false){
 const query=tokens(q); if(!query.length)return [];
 return Object.entries(draft).filter(([k,v])=>v&&fields[k]&&(!match||['skills','goals','experience','projects','bio','company'].includes(k))).map(([k,v])=>{
 const terms=tokens([fields[k],...(aliases[k]||[]),v].join(' '));
 const overlap=query.filter(t=>terms.includes(t));
 const strong=normalize(q).includes(normalize(fields[k]))||aliases[k].some(s=>normalize(q).includes(normalize(s)));
 return {key:k,label:fields[k],text:v,overlap,score:overlap.length+(strong&&!match?3:0)};
 }).filter(x=>x.score>0&&(!match||x.overlap.length>=Math.min(2,query.length))).sort((a,b)=>b.score-a.score).slice(0,match?3:2);
}
// Chế độ dữ liệu: 'local' (mặc định, demo chạy ngay trong trình duyệt) hoặc 'remote' (Supabase).
// Đổi bằng ?mode=remote hoặc ?mode=local; lựa chọn được nhớ trong trình duyệt.
export function mode(){
 try{const q=new URLSearchParams(location.search).get('mode');if(q==='local'||q==='remote')localStorage.setItem('dns.mode',q);const m=localStorage.getItem('dns.mode');if(m==='local'||m==='remote')return m}catch{}
 return window.DNS_CONFIG?.mode||'local';
}
export async function rpc(name,args){
 if(mode()==='local'){const v=localRpc(name,args);if(v!==undefined)return v;}
 const {projectUrl,publishableKey}=window.DNS_CONFIG;
 const res=await fetch(projectUrl+'/rest/v1/rpc/dns_'+name,{method:'POST',headers:{apikey:publishableKey,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(20000),cache:'no-store'});
 const value=await res.json();if(!res.ok)throw Error(value.message||'Không kết nối được database.');return value;
}
