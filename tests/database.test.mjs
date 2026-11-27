import test from 'node:test';
import assert from 'node:assert/strict';
import { migratedDb } from './helpers/db.mjs';

const owner = '1'.repeat(64),
  stranger = '2'.repeat(64);
const rpcOf = (db) => async (sql, args) => (await db.query('select public.' + sql + ' as result', args)).rows[0].result;
const asClient = (db, ip) =>
  db.query("select set_config('request.headers', $1, false)", [JSON.stringify({ 'x-forwarded-for': ip + ', 10.0.0.1' })]);

test('owner isolation, snapshot boundaries, revision conflicts, revocation and deletion', async () => {
  const db = await migratedDb();
  try {
    await db.exec('set role anon');
    const rpc = rpcOf(db);
    const data = { name: 'Test', bio: 'Published', contact: 'private@example.test' };
    const sources = [{ label: 'private.txt', text: 'Confidential' }];
    const row = await rpc('dns_save($1,null,0,$2,$3)', [owner, JSON.stringify(data), JSON.stringify(sources)]);
    assert.equal(row.revision, 1);
    assert.deepEqual(await rpc('dns_list($1)', [stranger]), []);
    assert.equal(await rpc('dns_read($1,$2)', [stranger, row.id]), null);
    await assert.rejects(db.query('select * from dns_private.profiles'));
    await assert.rejects(db.query('select * from dns_private.rate_events'));
    await assert.rejects(rpc('dns_share($1,$2,1,$3)', [stranger, row.id, ['name']]));
    const pub = await rpc('dns_share($1,$2,1,$3)', [owner, row.id, ['name', 'bio']]);
    assert.deepEqual(await rpc('dns_public($1)', [pub.share]), { name: 'Test', bio: 'Published' });
    await assert.rejects(rpc('dns_delete($1,$2,1)', [owner, row.id]));
    await rpc('dns_save($1,$2,2,$3,$4)', [owner, row.id, JSON.stringify({ ...data, bio: 'Draft' }), JSON.stringify(sources)]);
    assert.equal((await rpc('dns_public($1)', [pub.share])).bio, 'Published');
    await rpc('dns_share($1,$2,3,null)', [owner, row.id]);
    assert.equal(await rpc('dns_public($1)', [pub.share]), null);
    const again = await rpc('dns_share($1,$2,4,$3)', [owner, row.id, ['name']]);
    assert.notEqual(again.share, pub.share);
    await rpc('dns_delete($1,$2,5)', [owner, row.id]);
    assert.equal(await rpc('dns_public($1)', [again.share]), null);
  } finally {
    await db.close();
  }
});

test('field list is shared by save and share, avatar can be published', async () => {
  const db = await migratedDb();
  try {
    await db.exec('set role anon');
    const rpc = rpcOf(db);
    const draft = { name: 'Ảnh', avatar: 'https://example.test/a.jpg' };
    const row = await rpc('dns_save($1,null,0,$2,$3)', [owner, JSON.stringify(draft), '[]']);
    const pub = await rpc('dns_share($1,$2,1,$3)', [owner, row.id, ['name', 'avatar']]);
    assert.deepEqual(await rpc('dns_public($1)', [pub.share]), draft);
    await assert.rejects(
      rpc('dns_save($1,null,0,$2,$3)', [owner, JSON.stringify({ name: 'X', secret: 'y' }), '[]']),
      /Trường hồ sơ/,
    );
    await assert.rejects(rpc('dns_share($1,$2,2,$3)', [owner, row.id, ['name', 'secret']]), /Hãy chọn tên/);
    await assert.rejects(rpc('dns_save($1,null,0,$2,$3)', [owner, JSON.stringify({ name: 'X', bio: 1 }), '[]']), /Trường hồ sơ/);
  } finally {
    await db.close();
  }
});

test('profile creation is rate limited per client address, not per workspace', async () => {
  const db = await migratedDb();
  try {
    await db.exec('set role anon');
    const rpc = rpcOf(db);
    await asClient(db, '203.0.113.5');
    for (let i = 0; i < 20; i++) {
      const k = (i % 16).toString(16).repeat(63) + (i < 16 ? 'a' : 'b');
      await rpc('dns_save($1,null,0,$2,$3)', [k, JSON.stringify({ name: 'P' + i }), '[]']);
    }
    await assert.rejects(
      rpc('dns_save($1,null,0,$2,$3)', ['c'.repeat(64), JSON.stringify({ name: 'Too many' }), '[]']),
      (e) => e.code === 'PT429' && /quá nhanh/.test(e.message),
    );
    await asClient(db, '198.51.100.7');
    const other = await rpc('dns_save($1,null,0,$2,$3)', ['c'.repeat(64), JSON.stringify({ name: 'Other IP' }), '[]']);
    assert.equal(other.revision, 1);
    await db.exec('reset role');
    const buckets = (await db.query('select distinct bucket from dns_private.rate_events')).rows.map((r) => r.bucket);
    assert.ok(
      buckets.every((b) => !b.includes('203.0.113.5')),
      'IP addresses are stored hashed',
    );
  } finally {
    await db.close();
  }
});

test('AI quota is only callable by service_role and throttles each workspace', async () => {
  const db = await migratedDb();
  try {
    const hash = 'a'.repeat(64);
    await db.exec('set role anon');
    await assert.rejects(db.query('select public.dns_ai_quota($1)', [hash]));
    await db.exec('reset role; set role service_role');
    assert.equal((await db.query('select public.dns_ai_quota($1) as ok', [hash])).rows[0].ok, true);
    await assert.rejects(db.query('select public.dns_ai_quota($1)', [hash]), (e) => e.code === 'PT429');
    assert.equal((await db.query('select public.dns_ai_quota($1) as ok', ['b'.repeat(64)])).rows[0].ok, true);
    await assert.rejects(db.query('select public.dns_ai_quota($1)', ['not-a-hash']));
  } finally {
    await db.close();
  }
});
