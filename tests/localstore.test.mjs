import test from 'node:test';
import assert from 'node:assert/strict';
const mem=new Map();
globalThis.localStorage={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)};
const {localRpc,resetDemo}=await import('../web/localstore.js');
const {SEED}=await import('../web/seed.js');
const A='a'.repeat(64),B='b'.repeat(64);

test('demo store seeds six shared profiles and keeps user-created profiles private to a workspace',()=>{
 const rows=localRpc('list',{p_key:A});
 assert.equal(rows.length,SEED.length);
 assert.ok(rows.every(r=>r.shared&&r.sourceCount===1));
 const mine=localRpc('save',{p_key:A,p_id:null,p_revision:0,p_draft:{name:'Hồ sơ riêng'},p_sources:[]});
 assert.equal(localRpc('read',{p_key:B,p_id:mine.id}),null);
 assert.equal(localRpc('list',{p_key:B}).some(r=>r.id===mine.id),false);
});

test('public lookup serves seed profiles without a workspace key and hides unshared ones',()=>{
 const pub=localRpc('public',{p_share:SEED[0].share});
 assert.equal(pub.name,'Trần Minh Anh');
 assert.equal(localRpc('public',{p_share:'00000000-0000-4000-8000-000000000000'}),undefined);
});

test('save, publish, revision conflicts and revoke behave like the SQL functions',()=>{
 const k='c'.repeat(64);
 const rec=localRpc('save',{p_key:k,p_id:null,p_revision:0,p_draft:{name:'Người Thử',role:'Quản lý',contact:'x@example.com'},p_sources:[]});
 assert.equal(rec.revision,1);assert.equal(rec.share,null);
 assert.throws(()=>localRpc('save',{p_key:k,p_id:rec.id,p_revision:99,p_draft:{name:'Người Thử'},p_sources:[]}),/đã thay đổi/);
 assert.throws(()=>localRpc('save',{p_key:k,p_id:null,p_revision:0,p_draft:{name:'  '},p_sources:[]}),/thiếu tên/);
 assert.throws(()=>localRpc('save',{p_key:k,p_id:null,p_revision:0,p_draft:{name:'A',secret:'x'},p_sources:[]}),/không hợp lệ/);
 const shared=localRpc('share',{p_key:k,p_id:rec.id,p_revision:1,p_fields:['name','role']});
 assert.deepEqual(localRpc('public',{p_share:shared.share}),{name:'Người Thử',role:'Quản lý',_meta:{sources:0,verified:{}}});
 assert.throws(()=>localRpc('share',{p_key:B,p_id:rec.id,p_revision:2,p_fields:['name']}),/không có quyền/);
 const revoked=localRpc('share',{p_key:k,p_id:rec.id,p_revision:shared.revision,p_fields:null});
 assert.equal(revoked.share,null);
 assert.equal(localRpc('public',{p_share:shared.share}),undefined);
 assert.equal(localRpc('delete',{p_key:k,p_id:rec.id,p_revision:revoked.revision}),true);
});

test('resetDemo restores edited seed profiles',()=>{
 const rec=localRpc('read',{p_key:A,p_id:localRpc('list',{p_key:A}).find(r=>r.name==='Trần Minh Anh').id});
 localRpc('save',{p_key:A,p_id:rec.id,p_revision:rec.revision,p_draft:{...rec.draft,name:'Đã sửa'},p_sources:rec.sources});
 resetDemo(A);
 const names=localRpc('list',{p_key:A}).map(r=>r.name);
 assert.ok(!names.includes('Đã sửa'));
 assert.ok(names.includes('Trần Minh Anh'));
 assert.ok(names.includes('Hồ sơ riêng'),'user-created profiles survive a demo reset');
});

const {ORG}=await import('../web/seed.js');
const code=ORG.code;

test('organisation verification needs the admin code and is bound to the verified value',()=>{
 assert.throws(()=>localRpc('org_login',{p_code:'sai'}),/không đúng/);
 assert.throws(()=>localRpc('org_members',{p_code:'sai'}),/không đúng/);
 const k='d'.repeat(64);
 const rec=localRpc('save',{p_key:k,p_id:null,p_revision:0,p_draft:{name:'Thành Viên Mới',role:'Giám đốc',company:'Công ty Thử'},p_sources:[]});
 const shared=localRpc('share',{p_key:k,p_id:rec.id,p_revision:1,p_fields:['name','role','company']});
 assert.deepEqual(localRpc('public',{p_share:shared.share})._meta.verified,{});
 const member=localRpc('org_members',{p_code:code}).find(m=>m.id===rec.id);
 assert.deepEqual(member.fields.map(f=>f.key),['role','company']);
 assert.throws(()=>localRpc('org_verify',{p_code:code,p_id:rec.id,p_field:'projects',p_on:true}),/chưa được chủ hồ sơ công bố/);
 localRpc('org_verify',{p_code:code,p_id:rec.id,p_field:'role',p_on:true});
 const v=localRpc('public',{p_share:shared.share})._meta.verified;
 assert.deepEqual(Object.keys(v),['role']);
 assert.equal(v.role.by,ORG.name);
 // Chủ hồ sơ sửa chức danh và công bố lại: xác nhận cũ không còn hiệu lực.
 const edited=localRpc('save',{p_key:k,p_id:rec.id,p_revision:shared.revision,p_draft:{name:'Thành Viên Mới',role:'Chủ tịch',company:'Công ty Thử'},p_sources:[]});
 const again=localRpc('share',{p_key:k,p_id:rec.id,p_revision:edited.revision,p_fields:['name','role','company']});
 assert.deepEqual(localRpc('public',{p_share:again.share})._meta.verified,{});
 localRpc('org_verify',{p_code:code,p_id:rec.id,p_field:'role',p_on:true});
 localRpc('org_verify',{p_code:code,p_id:rec.id,p_field:'role',p_on:false});
 assert.deepEqual(localRpc('public',{p_share:again.share})._meta.verified,{});
});

test('seed profiles carry a mix of verified and unverified items for the live demo',()=>{
 const pub=i=>localRpc('public',{p_share:SEED[i].share})._meta;
 assert.deepEqual(Object.keys(pub(1).verified).sort(),['company','experience','projects','role']);
 assert.deepEqual(pub(5).verified,{});
 assert.equal(pub(0).sources,1);
});
