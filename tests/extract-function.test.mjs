import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createHandler } from '../supabase/functions/extract-profile/handler.ts';

const workspace = 'f'.repeat(64);
const hash = createHash('sha256').update(workspace).digest('hex');
const env = (extra = {}) => {
  const values = {
    OPENAI_API_KEY: 'sk-test',
    SUPABASE_URL: 'https://db.example.test',
    SUPABASE_SERVICE_ROLE_KEY: 'service',
    ...extra,
  };
  return (name) => values[name];
};
const profile = {
  name: 'Lan',
  role: 'CEO',
  company: '',
  bio: '',
  skills: '',
  experience: '',
  projects: '',
  goals: '',
  contact: '',
};
function fakeFetch({ quota = 200, openai = 200 } = {}) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
    if (url.includes('dns_ai_quota')) return new Response('true', { status: quota });
    return new Response(
      JSON.stringify({
        choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ ...profile, name: '  Lan  ' }) } }],
      }),
      { status: openai },
    );
  };
  fn.calls = calls;
  return fn;
}
const post = (body, origin = 'https://dinhquocanh118-gif.github.io', ip = '203.0.113.9') =>
  new Request('https://fn.example.test', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json', 'x-forwarded-for': ip + ', 10.0.0.1' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

test('extracts a profile after taking a database-backed quota', async () => {
  const fetcher = fakeFetch();
  const res = await createHandler(env(), fetcher)(post({ workspace, text: 'Tên: Lan, CEO công ty A' }));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).name, 'Lan');
  assert.deepEqual(fetcher.calls[0].body, { p_hash: hash, p_client: createHash('sha256').update('203.0.113.9').digest('hex') });
  assert.equal(fetcher.calls[0].headers.Authorization, 'Bearer service');
  assert.ok(fetcher.calls[1].url.includes('openai.com'));
});

test('quota exhaustion and missing quota config never reach OpenAI', async () => {
  let fetcher = fakeFetch({ quota: 429 });
  let res = await createHandler(env(), fetcher)(post({ workspace, text: 'Tên: Lan, CEO công ty A' }));
  assert.equal(res.status, 429);
  assert.equal(fetcher.calls.length, 1);
  fetcher = fakeFetch();
  res = await createHandler(
    env({ SUPABASE_SERVICE_ROLE_KEY: undefined }),
    fetcher,
  )(post({ workspace, text: 'Tên: Lan, CEO công ty A' }));
  assert.equal(res.status, 503);
  assert.equal(fetcher.calls.length, 0);
});

test('any device and workspace can use the shared key; bad input is rejected', async () => {
  const fetcher = fakeFetch();
  const handler = createHandler(env(), fetcher);
  assert.equal((await handler(post({ workspace: 'not-a-key', text: 'Tên: Lan, CEO công ty A' }))).status, 403);
  assert.equal((await handler(post('{not json'))).status, 400);
  assert.equal((await handler(post({ workspace, text: 'x'.repeat(200000) }))).status, 413);
  assert.equal((await handler(post({ workspace, text: 'ngắn' }))).status, 400);
  assert.equal(fetcher.calls.length, 0);
  assert.equal((await handler(post({ workspace: 'e'.repeat(64), text: 'Tên: Lan, CEO công ty A' }))).status, 200);
  assert.equal(fetcher.calls[0].body.p_hash, createHash('sha256').update('e'.repeat(64)).digest('hex'));
});

test('missing OpenAI key is reported as not configured', async () => {
  const res = await createHandler(
    env({ OPENAI_API_KEY: undefined }),
    fakeFetch(),
  )(post({ workspace, text: 'Tên: Lan, CEO công ty A' }));
  assert.equal(res.status, 503);
});

test('CORS allows the site and local development', async () => {
  const handler = createHandler(env(), fakeFetch());
  const local = await handler(
    new Request('https://fn.example.test', { method: 'OPTIONS', headers: { origin: 'http://localhost:5173' } }),
  );
  assert.equal(local.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  const evil = await handler(
    new Request('https://fn.example.test', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } }),
  );
  assert.equal(evil.headers.get('access-control-allow-origin'), 'https://dinhquocanh118-gif.github.io');
  assert.equal((await handler(post({ workspace, text: 'Tên: Lan, CEO công ty A' }, 'http://localhost:5173'))).status, 200);
});
