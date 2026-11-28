import test from 'node:test';
import assert from 'node:assert/strict';
const mem=new Map();
globalThis.localStorage={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)};
const {localRpc}=await import('../web/localstore.js');
const {SEED}=await import('../web/seed.js');
const {fit,ROLE_PRESETS}=await import('../web/fit.js');
const P=Object.fromEntries(SEED.map(s=>[s.draft.name,localRpc('public',{p_share:s.share})]));
const [DESIGNER,RETAIL,DELIVERY,INVESTOR,AGRI]=ROLE_PRESETS;
const run=(name,role)=>fit(P[name],role);

test('complementary supplier and designer score high, with evidence on both sides',()=>{
 const r=run('Lê Quốc Hưng',DESIGNER);
 assert.ok(r.score>=75,'score '+r.score);
 assert.equal(r.tone,'hi');
 assert.ok(r.pairs.some(p=>p.type==='need'&&['skills','projects'].includes(p.chunk.key)));
 assert.ok(r.pairs.some(p=>p.type==='offer'&&p.chunk.key==='goals'));
 assert.deepEqual(r.gaps,[]);
 assert.ok(r.evidence.total>=1&&r.evidence.verified<=r.evidence.total);
 assert.ok(r.scenarios.length>=2&&r.scenarios.length<=3);
 assert.ok(r.score<=96,'never claims a perfect match');
});

test('each sample profile fits its natural counterpart and not unrelated roles',()=>{
 assert.ok(run('Nguyễn Thu Hà',RETAIL).score>=75);
 assert.ok(run('Phạm Đức Long',DELIVERY).score>=75);
 assert.ok(run('Võ Ngọc Lan',INVESTOR).score>=50);
 assert.ok(run('Đặng Thị Mai',AGRI).score>=50);
 assert.equal(run('Lê Quốc Hưng',DELIVERY).score,0);
 assert.equal(run('Lê Quốc Hưng',INVESTOR).score,0);
 assert.equal(run('Đặng Thị Mai',DESIGNER).score,0);
});

test('an investor profile is not matched as a delivery operator just because it mentions logistics',()=>{
 const lan=run('Võ Ngọc Lan',{need:'khách hàng cần giao hàng chặng cuối',offer:''});
 const long=run('Phạm Đức Long',{need:'khách hàng cần giao hàng chặng cuối',offer:''});
 assert.ok(long.score>=75,'delivery operator '+long.score);
 assert.equal(lan.score,0);
 assert.equal(lan.tone,'none');
 assert.ok(lan.gaps.length>0);
});

test('partial coverage is reported as partial and names what is missing',()=>{
 const r=run('Trần Minh Anh',{need:'thiết kế nội thất và nguồn vốn đầu tư',offer:''});
 assert.ok(r.score>0&&r.score<75,'score '+r.score);
 assert.ok(r.gaps.includes('Vốn / đầu tư'));
 assert.ok(r.scenarios.some(s=>s.includes('Vốn / đầu tư')));
});

test('unrelated needs get no score instead of a made-up match',()=>{
 const r=run('Lê Quốc Hưng',{need:'tư vấn thuế quốc tế',offer:''});
 assert.equal(r.score,0);assert.deepEqual(r.pairs,[]);
 assert.equal(fit(P['Lê Quốc Hưng'],{}).empty,true);
});

test('only an offer is enough: score comes from what the viewer can contribute',()=>{
 const r=run('Lê Quốc Hưng',{need:'',offer:'thiết kế nội thất'});
 assert.ok(r.score>0);
 assert.ok(r.pairs.every(p=>p.type==='offer'));
});
