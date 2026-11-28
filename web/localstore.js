// Kho dữ liệu cục bộ cho chế độ demo. Mô phỏng các hàm dns_* của Supabase (cùng tên, tham số, kiểu trả về)
// để giao diện không phải đổi cách gọi và demo chạy được khi không có mạng hoặc không có database.
import {SEED,ORG,VERIFIABLE,published,seedByShare} from './seed.js';
const KEY='dns.local.v1',SEED_VERSION=2; // tăng số này khi đổi bộ hồ sơ mẫu để trình duyệt cũ tự nạp lại
const FIELDS=['name','role','company','bio','skills','experience','projects','goals','contact','avatar'];
const load=()=>{try{const v=JSON.parse(localStorage.getItem(KEY));if(v&&Array.isArray(v.rows))return v}catch{}return {rows:[],seeded:{}}};
const store=db=>localStorage.setItem(KEY,JSON.stringify(db));
const fail=m=>{throw Error(m)};
const owned=(db,key,id)=>db.rows.find(r=>r.id===id&&r.owner===key);
// Xác nhận gắn với đúng giá trị đã được duyệt: nếu chủ hồ sơ sửa nội dung thì xác nhận không còn hiệu lực.
const valid=(vs,values)=>Object.fromEntries(Object.entries(vs||{}).filter(([k,v])=>values&&values[k]===v.value).map(([k,v])=>[k,{by:v.by,at:v.at}]));
const view=r=>({id:r.id,draft:r.draft,sources:r.sources,revision:r.revision,share:r.share,published:r.published,updated:r.updated,verified:valid(r.verifications,r.draft)});
const seedVerifs=s=>Object.fromEntries(s.verified.map(f=>[f,{by:ORG.name,at:'2026-11-20T09:00:00.000Z',value:s.draft[f]}]));
const admin=code=>{if(code!==ORG.code)fail('Mã quản trị tổ chức không đúng.')};
const conflict='Hồ sơ đã thay đổi hoặc không có quyền truy cập. Hãy mở lại hồ sơ.';

export function seedDemo(key,db=load()){
 db.rows=db.rows.filter(r=>!(r.owner===key&&r.seed));
 const now=Date.now();
 SEED.forEach((s,i)=>db.rows.push({id:crypto.randomUUID(),seed:s.id,owner:key,draft:{...s.draft},sources:s.sources.map(x=>({...x})),revision:1,share:s.share,published:published(s),verifications:seedVerifs(s),updated:new Date(now-i*60000).toISOString()}));
 db.seeded={...db.seeded,[key]:SEED_VERSION};store(db);return db;
}
export const resetDemo=key=>seedDemo(key);

const api={
 list({p_key:key}){
  let db=load();if(db.seeded?.[key]!==SEED_VERSION)db=seedDemo(key,db);
  return db.rows.filter(r=>r.owner===key).sort((a,b)=>b.updated.localeCompare(a.updated)).map(r=>({id:r.id,name:r.draft.name,role:r.draft.role,company:r.draft.company,updated:r.updated,shared:!!r.share,sourceCount:r.sources.length}));
 },
 read({p_key:key,p_id:id}){const r=owned(load(),key,id);return r?view(r):null},
 save({p_key:key,p_id:id,p_revision:rev,p_draft:d,p_sources:s}){
  const name=String(d?.name??'').trim();
  if(!d||typeof d!=='object'||Array.isArray(d)||!Array.isArray(s)||name.length<1||name.length>120||JSON.stringify(d).length>60000||JSON.stringify(s).length>500000||s.length>8)fail('Dữ liệu hồ sơ vượt giới hạn hoặc thiếu tên');
  if(Object.entries(d).some(([k,v])=>!FIELDS.includes(k)||typeof v!=='string'))fail('Trường hồ sơ không hợp lệ');
  if(s.some(x=>!x||typeof x.text!=='string'||typeof x.label!=='string'))fail('Nguồn không hợp lệ');
  const db=load(),now=new Date().toISOString();let r;
  if(id==null){
   if(db.rows.filter(x=>x.owner===key).length>=25)fail('Mỗi không gian chứa tối đa 25 hồ sơ');
   r={id:crypto.randomUUID(),owner:key,draft:d,sources:s,revision:1,share:null,published:null,updated:now};db.rows.push(r);
  }else{
   r=owned(db,key,id);if(!r||r.revision!==rev)fail(conflict);
   Object.assign(r,{draft:d,sources:s,revision:r.revision+1,updated:now});
  }
  store(db);return view(r);
 },
 share({p_key:key,p_id:id,p_revision:rev,p_fields:f}){
  const db=load(),r=owned(db,key,id);
  if(f!=null&&(!f.includes('name')||!f.every(k=>FIELDS.includes(k))))fail('Hãy chọn tên và các mục muốn công bố');
  if(!r||r.revision!==rev)fail(conflict);
  const snap=f==null?null:Object.fromEntries(Object.entries(r.draft).filter(([k])=>f.includes(k)));
  Object.assign(r,{published:snap,share:snap?(r.share||crypto.randomUUID()):null,revision:r.revision+1,updated:new Date().toISOString()});
  store(db);return view(r);
 },
 // Trả về undefined khi không tìm thấy để lớp gọi có thể thử database thật.
 public({p_share:share}){
  const meta=(pub,vs,n)=>({...pub,_meta:{sources:n,verified:valid(vs,pub)}});
  const r=load().rows.find(x=>x.share===share);
  if(r)return meta(r.published,r.verifications,r.sources.length);
  const s=seedByShare(share);return s?meta(published(s),seedVerifs(s),s.sources.length):undefined;
 },
 org_login({p_code:code}){admin(code);return {id:ORG.id,name:ORG.name}},
 org_members({p_code:code}){
  admin(code);const seen=new Set(),wk=localStorage.getItem('dns.workspace.v1');if(wk&&load().seeded?.[wk]!==SEED_VERSION)seedDemo(wk);
  return load().rows.filter(r=>r.share&&!seen.has(r.share)&&seen.add(r.share)).map(r=>{
   const v=valid(r.verifications,r.published);
   return {id:r.id,name:r.published.name,role:r.published.role||'',company:r.published.company||'',share:r.share,
    fields:VERIFIABLE.filter(k=>r.published[k]).map(k=>({key:k,value:r.published[k],verified:!!v[k],at:v[k]?.at||null}))};
  });
 },
 org_verify({p_code:code,p_id:id,p_field:field,p_on:on}){
  admin(code);const db=load(),r=db.rows.find(x=>x.id===id&&x.share);
  if(!r||!VERIFIABLE.includes(field)||!r.published[field])fail('Mục này chưa được chủ hồ sơ công bố.');
  r.verifications={...r.verifications};
  if(on)r.verifications[field]={by:ORG.name,at:new Date().toISOString(),value:r.published[field]};else delete r.verifications[field];
  store(db);return true;
 },
 delete({p_key:key,p_id:id,p_revision:rev}){
  const db=load(),r=owned(db,key,id);if(!r||r.revision!==rev)fail('Hồ sơ đã thay đổi hoặc không có quyền truy cập');
  db.rows=db.rows.filter(x=>x!==r);store(db);return true;
 }
};
export const localRpc=(name,args)=>api[name]?.(args);
