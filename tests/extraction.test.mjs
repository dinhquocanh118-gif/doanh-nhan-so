import test from 'node:test';
import assert from 'node:assert/strict';
import {extract,lookup,demo} from '../web/data.js';
test('extracts Vietnamese fields from mixed sources without inventing facts',()=>{
 const d=extract([{text:'Họ và tên: Nguyễn Quỳnh Mai\nChức danh: Giám đốc\nCông ty: Hạt Mộc'},{text:'Kinh nghiệm\n2020 - nay | Xây dựng vùng nguyên liệu\nNăng lực: Thiết kế'}]);
 assert.equal(d.name,'Nguyễn Quỳnh Mai');assert.equal(d.company,'Hạt Mộc');assert.match(d.experience,/2020/);assert.equal(d.contact,'');
});
test('lookup uses published fields and returns no evidence for unrelated queries',()=>{
 assert.equal(lookup(demo,'Kinh nghiệm của người này?')[0].key,'experience');
 assert.deepEqual(lookup({name:demo.name},'số điện thoại'),[]);
 assert.ok(lookup(demo,'phân phối nội thất',true).some(x=>x.key==='goals'));
});

test('the demo sample text is extracted into a complete, accurate draft',async()=>{
 const {SAMPLE_TEXT}=await import('../web/seed.js');
 const d=extract([{text:SAMPLE_TEXT}]);
 assert.equal(d.name,'Trương Quốc Bảo');
 assert.equal(d.role,'Nhà sáng lập');
 assert.equal(d.company,'Cà Phê Cao Nguyên Xanh');
 assert.match(d.experience,/2014 - 2020/);
 assert.match(d.projects,/Vùng cà phê hữu cơ/);
 assert.match(d.skills,/Rang xay/);
 assert.match(d.goals,/phân phối/);
 assert.equal(d.contact,'bao@example.com');
});
