// Chạy website đã build trong Chromium, chuyển RPC Supabase sang PGlite với đúng các migration.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { chromium } from 'playwright';
import { migratedDb } from './helpers/db.mjs';

const origin = 'http://app.test';
const { projectUrl } = (() => {
  const src = execFileSync('node', [
    '-e',
    "global.window={};require('./web/config.js');console.log(JSON.stringify(window.DNS_CONFIG))",
  ]);
  return JSON.parse(src);
})();
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
};
const toSql = (k, v) =>
  k === 'p_fields' && Array.isArray(v)
    ? '{' + v.map((s) => '"' + String(s).replace(/["\\]/g, '\\$&') + '"').join(',') + '}'
    : v !== null && typeof v === 'object'
      ? JSON.stringify(v)
      : v;

async function setup() {
  execFileSync('node', ['build.mjs']);
  const db = await migratedDb();
  await db.exec('set role anon');
  const browser = await chromium.launch();
  const root = resolve('dist');
  async function wire(context) {
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === origin) {
        const file = resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
        if (!file.startsWith(root + sep)) return route.fulfill({ status: 404 });
        try {
          return route.fulfill({ body: await readFile(file), contentType: mime[extname(file)] || 'application/octet-stream' });
        } catch {
          return route.fulfill({ status: 404 });
        }
      }
      if (url.href.startsWith(projectUrl + '/rest/v1/rpc/dns_')) {
        const name = url.pathname.split('/').pop();
        const args = route.request().postDataJSON();
        const keys = Object.keys(args);
        try {
          await db.query("select set_config('request.headers', $1, false)", [JSON.stringify({ 'x-forwarded-for': '192.0.2.1' })]);
          const sql = `select public.${name}(${keys.map((k, i) => `${k} => $${i + 1}`).join(', ')}) as result`;
          const { rows } = await db.query(
            sql,
            keys.map((k) => toSql(k, args[k])),
          );
          return route.fulfill({ json: rows[0].result });
        } catch (e) {
          return route.fulfill({ status: e.code === 'PT429' ? 429 : 400, json: { message: e.message, code: e.code } });
        }
      }
      return route.abort();
    });
  }
  return { db, browser, wire };
}

test('create, review, save, publish, view as partner and revoke', { timeout: 120000 }, async (t) => {
  const { db, browser, wire } = await setup();
  t.after(async () => {
    await browser.close();
    await db.close();
  });
  const owner = await browser.newContext({ acceptDownloads: true });
  await wire(owner);
  const page = await owner.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());

  await page.goto(origin + '/');
  await page.getByRole('heading', { name: 'Tổng quan' }).waitFor();

  await page.locator('[data-act=start][data-type=text]').click();
  await page.waitForURL(/#new$/);
  await page
    .locator('#paste')
    .fill(
      'Họ và tên: Phạm Thu Hà\nChức danh: Giám đốc\nCông ty: Hạt Mộc\nKinh nghiệm\n2019 - nay | Giám đốc phân phối nội thất\nLiên hệ: ha@example.vn',
    );
  await page.locator('[data-act=textadd]').click();
  await page.locator('#sources .source').waitFor();
  await page.locator('[data-act=review]').click();
  await page.waitForURL(/#review$/);
  assert.equal(await page.locator('[name=name]').inputValue(), 'Phạm Thu Hà');
  assert.equal(await page.locator('[name=company]').inputValue(), 'Hạt Mộc');
  await page.locator('[name=goals]').fill('Tìm đối tác phân phối nội thất');
  await page.locator('#editform button[type=submit]').click();
  await page.waitForURL(/#profile\/[0-9a-f-]{36}$/);
  await page.getByRole('heading', { name: 'Phạm Thu Hà' }).first().waitFor();

  await page.locator('[data-act=publish]').click();
  const shareLink = page.locator('.qrbox a[href*="#p/"]');
  await shareLink.waitFor();
  const shareUrl = await shareLink.getAttribute('href');
  await page.waitForFunction(() => document.querySelector('#qr')?.src.startsWith('data:image/png'));

  const partnerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await wire(partnerContext);
  const partner = await partnerContext.newPage();
  partner.on('pageerror', (e) => errors.push(e.message));
  await partner.goto(shareUrl);
  await partner.getByRole('heading', { name: 'Phạm Thu Hà' }).waitFor();
  assert.equal(await partner.locator('#s-contact').count(), 0, 'contact is private by default');
  assert.ok(await partner.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal scroll on phone');
  await partner.locator('[data-act=discover]').click();
  await partner.locator('#question').fill('phân phối nội thất');
  await partner.locator('#askbtn').click();
  await partner.locator('#answer .evidencelink').first().waitFor();

  await page.locator('[data-act=revoke]').click();
  await page.locator('[data-act=publish]').filter({ hasText: 'Công bố hồ sơ' }).waitFor();
  await partner.reload();
  await partner.getByText('Hồ sơ không tồn tại').waitFor();

  await page.goto(origin + '/#list');
  await page.locator('#results .entry').first().waitFor();
  assert.equal(await page.locator('#results .entry').count(), 1);
  assert.deepEqual(errors, []);
});

test('workspace key can be downloaded as a backup and restored on another device', { timeout: 120000 }, async (t) => {
  const { db, browser, wire } = await setup();
  t.after(async () => {
    await browser.close();
    await db.close();
  });
  const first = await browser.newContext({ acceptDownloads: true });
  await wire(first);
  const page = await first.newPage();
  await page.goto(origin + '/#new');
  await page.locator('[data-act=review]').click();
  await page.locator('[name=name]').fill('Đỗ Minh');
  await page.locator('#editform button[type=submit]').click();
  await page.waitForURL(/#profile\//);
  await page.locator('.backupnote').waitFor();

  await page.goto(origin + '/#key');
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-act=backupfile]').click()]);
  const text = await readFile(await download.path(), 'utf8');
  const key = text.match(/\b[0-9a-f]{64}\b/)?.[0];
  assert.equal(key, await page.evaluate(() => localStorage.getItem('dns.workspace.v1')));
  await page.goto(origin + '/#list');
  assert.equal(await page.locator('.backupnote').count(), 0, 'reminder disappears after backup');

  const second = await browser.newContext();
  await wire(second);
  const other = await second.newPage();
  await other.goto(origin + '/#key');
  await other.locator('#restorekey').fill(key);
  await other.locator('#restore button').click();
  await other.waitForURL(/#list$/);
  await other.getByText('Đỗ Minh').waitFor();
});
