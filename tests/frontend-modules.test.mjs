import test from 'node:test';
import assert from 'node:assert/strict';
import { entries, career, matchEvidence, vcard } from '../web/profile.js';
import { avatarUrl, findAvatar } from '../web/avatar.js';
import { checkedText, readFile, readUrl } from '../web/imports.js';
import { demo } from '../web/data.js';

test('entries and career split lines and pull out date ranges', () => {
  assert.deepEqual(entries('A\n\n B \r\nC; Dự án mới'), ['A', 'B', 'C', 'Dự án mới']);
  assert.deepEqual(career('2021 - nay | Nhà sáng lập, Mộc Studio\nCố vấn tự do'), [
    { date: '2021 - nay', title: 'Nhà sáng lập, Mộc Studio' },
    { date: '', title: 'Cố vấn tự do' },
  ]);
  assert.equal(career('Trưởng phòng (03/2019 – 2022)')[0].date, '03/2019 – 2022');
  assert.equal(career('Trưởng phòng (03/2019 – 2022)')[0].title, 'Trưởng phòng');
});

test('matchEvidence ranks experience and projects first and ignores unrelated needs', () => {
  const hits = matchEvidence(demo, 'Tìm đối tác phân phối nội thất');
  assert.ok(hits.length > 0);
  assert.ok(['projects', 'experience', 'goals'].includes(hits[0].key));
  assert.ok(hits.some((h) => h.key === 'goals'));
  assert.deepEqual(matchEvidence(demo, 'bán dẫn'), []);
  assert.ok(matchEvidence({ skills: 'Semiconductor packaging' }, 'cần chuyên gia bán dẫn').length === 1);
});

test('vcard escapes separators and extracts email and phone', () => {
  const card = vcard({ name: 'Lê; Hoa', company: 'A, B', role: '', contact: 'hoa@example.vn\n+84 912 345 678' });
  assert.match(card, /^BEGIN:VCARD\r\n/);
  assert.match(card, /FN:Lê\\; Hoa\r\n/);
  assert.match(card, /ORG:A\\, B\r\n/);
  assert.match(card, /EMAIL:hoa@example.vn\r\n/);
  assert.match(card, /TEL:\+84 912 345 678\r\n/);
  assert.doesNotMatch(card, /TITLE:/);
  assert.match(card, /END:VCARD\r\n$/);
});

test('avatarUrl only accepts plain HTTPS links', () => {
  assert.equal(avatarUrl('https://example.test/a.jpg'), 'https://example.test/a.jpg');
  for (const bad of [
    'http://example.test/a.jpg',
    'javascript:alert(1)',
    'https://u:p@example.test/a',
    'data:image/png;base64,AA',
    '',
    undefined,
  ])
    assert.equal(avatarUrl(bad), '');
  assert.equal(avatarUrl('https://example.test/' + 'a'.repeat(2000)), '');
});

test('findAvatar uses labelled portraits only, never generic images', () => {
  assert.equal(findAvatar([{ text: 'Ảnh đại diện: https://cdn.test/me.jpg' }]), 'https://cdn.test/me.jpg');
  assert.equal(findAvatar([{ text: '![Profile photo of Lan](https://cdn.test/lan.png)' }]), 'https://cdn.test/lan.png');
  assert.equal(findAvatar([{ text: '![Company logo](https://cdn.test/logo.png)' }]), '');
  assert.equal(findAvatar([{ text: 'Avatar: http://cdn.test/me.jpg' }]), '');
});

test('checkedText enforces minimum and maximum length', () => {
  assert.equal(checkedText('  Xin chào thế giới\u0000  '), 'Xin chào thế giới');
  assert.throws(() => checkedText('ngắn'), /Không đủ văn bản/);
  assert.throws(() => checkedText('a'.repeat(45001)), /45.000/);
});

test('readFile decodes UTF-8 and UTF-16 text and rejects bad files', async () => {
  const utf8 = await readFile(new File(['Họ và tên: Nguyễn Văn An'], 'cv.txt'));
  assert.deepEqual(utf8, { label: 'cv.txt', kind: 'TXT', text: 'Họ và tên: Nguyễn Văn An' });
  const text = 'Chức danh: Giám đốc điều hành';
  const utf16 = new Uint8Array([0xff, 0xfe, ...new Uint8Array(new Uint16Array([...text].map((c) => c.charCodeAt(0))).buffer)]);
  assert.equal((await readFile(new File([utf16], 'cv.md'))).text, text);
  await assert.rejects(readFile(new File(['x'], 'cv.exe')), /TXT, DOCX hoặc PDF/);
  await assert.rejects(readFile(new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'big.txt')), /8 MB/);
});

test('readFile refuses DOCX files that expand beyond the safe size', async () => {
  const entry = new Uint8Array(46);
  const view = new DataView(entry.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint32(24, 46e6, true);
  await assert.rejects(readFile(new File([entry], 'bomb.docx')), /quá lớn sau giải nén/);
});

test('readUrl blocks private addresses and login walls', async (t) => {
  for (const bad of [
    'ftp://example.com',
    'http://localhost/a',
    'http://10.0.0.1',
    'https://user:pw@example.com',
    'https://printer.local',
    'https://example.com:8443',
  ])
    await assert.rejects(readUrl(bad), /công khai/);
  const original = globalThis.fetch;
  t.after(() => (globalThis.fetch = original));
  const seen = [];
  globalThis.fetch = async (url, init) => {
    seen.push({ url, init });
    return new Response(
      url.includes('wall')
        ? 'Sign in to view this profile'
        : 'Title: x\nMarkdown Content:\n' + 'Nguyễn Văn An là nhà sáng lập. '.repeat(5),
    );
  };
  const src = await readUrl('https://example.com/an');
  assert.equal(src.kind, 'URL');
  assert.match(src.text, /^Nguyễn Văn An/);
  assert.equal(seen[0].url, 'https://r.jina.ai/https://example.com/an');
  assert.equal(seen[0].init.credentials, 'omit');
  await assert.rejects(readUrl('https://example.com/wall'), /đăng nhập/);
});
