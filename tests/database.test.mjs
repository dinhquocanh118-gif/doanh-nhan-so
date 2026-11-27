import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
test('owner isolation, snapshot boundaries, revision conflicts, revocation and deletion', async()=>{
 const db=new PGlite();
 try {
 await db.exec('create role anon; create role authenticated;');
 await db.exec(await readFile('supabase/migrations/001_profiles.sql','utf8'));
 await db.exec('set role anon');
 const rpc=async(sql,args)=>(await db.query('select public.'+sql+' as result',args)).rows[0].result;
 const owner='1'.repeat(64), stranger='2'.repeat(64);
 const data={name:'Test',bio:'Published',contact:'private@example.test'};
 const sources=[{label:'private.txt',text:'Confidential'}];
 const row=await rpc('dns_save($1,null,0,$2,$3)',[owner,JSON.stringify(data),JSON.stringify(sources)]);
 assert.equal(row.revision,1);
 assert.deepEqual(await rpc('dns_list($1)',[stranger]),[]);
 assert.equal(await rpc('dns_read($1,$2)',[stranger,row.id]),null);
 await assert.rejects(db.query('select * from dns_private.profiles'));
 await assert.rejects(rpc('dns_share($1,$2,1,$3)',[stranger,row.id,['name']]));
 const pub=await rpc('dns_share($1,$2,1,$3)',[owner,row.id,['name','bio']]);
 assert.deepEqual(await rpc('dns_public($1)',[pub.share]),{name:'Test',bio:'Published'});
 await assert.rejects(rpc('dns_delete($1,$2,1)',[owner,row.id]));
 await rpc('dns_save($1,$2,2,$3,$4)',[owner,row.id,JSON.stringify({...data,bio:'Draft'}),JSON.stringify(sources)]);
 assert.equal((await rpc('dns_public($1)',[pub.share])).bio,'Published');
 await rpc('dns_share($1,$2,3,null)',[owner,row.id]);
 assert.equal(await rpc('dns_public($1)',[pub.share]),null);
 const again=await rpc('dns_share($1,$2,4,$3)',[owner,row.id,['name']]);
 assert.notEqual(again.share,pub.share);
 await rpc('dns_delete($1,$2,5)',[owner,row.id]);
 assert.equal(await rpc('dns_public($1)',[again.share]),null);
 } finally {await db.close();}
});
