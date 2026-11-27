// Điểm vào: điều hướng theo hash và gắn sự kiện toàn trang.
import './profile.css';
import { demo, rpc } from './data.js';
import { $, esc, link, frame, msg, nice, busy } from './ui.js';
import { state, r, resetEditor } from './state.js';
import * as view from './views.js';
import { handle, submit, addFiles, loadBackupFile, pickProject } from './actions.js';

async function showProfile(target, id, run) {
  if (target === 'profile') frame('list', 'Hồ sơ', '<p>Đang tải hồ sơ…</p>');
  else $('#layout').innerHTML = '<main class="wrap"><p>Đang tải hồ sơ…</p></main>';
  const rec = target === 'p' ? await rpc('public', { p_share: id }) : await r('read', { p_id: id });
  if (state.seq !== run) return;
  if (!rec) throw Error('Hồ sơ không tồn tại, liên kết đã được thu hồi hoặc bạn chưa có quyền xem.');
  if (target === 'p') view.publicPage(rec, false);
  else await view.ownerPage(rec);
}

async function route() {
  const run = ++state.seq;
  const [target, id] = (location.hash.slice(1) || 'home').split('/');
  $('#dialog').close();
  window.scrollTo(0, 0);
  try {
    if (target === 'home' || target === 'list') {
      target === 'home' ? view.home() : view.list();
      const rows = await r('list');
      if (state.seq !== run) return;
      state.rows = rows;
      if (target === 'home') view.homeRecent();
      else view.listResults();
      view.renderBackupNote();
    } else if (target === 'guide') view.guide();
    else if (target === 'key') view.keys();
    else if (target === 'new') {
      if (!state.editSession) resetEditor();
      view.importPage();
    } else if (target === 'review' && state.editSession) view.editPage();
    else if (target === 'demo') view.publicPage({ ...demo }, true);
    else if ((target === 'p' || target === 'profile') && /^[a-f0-9-]{36}$/i.test(id)) await showProfile(target, id, run);
    else location.replace('#home');
  } catch (e) {
    if (state.seq !== run) return;
    if ($('#msg')) msg(nice(e), true);
    else
      frame(
        'list',
        'Hồ sơ',
        `<section class="panel stack"><h2>Không thể mở hồ sơ</h2><p>${esc(nice(e))}</p>${link('home', 'Về tổng quan', 'home')}</section>`,
      );
  }
}

document.addEventListener(
  'error',
  (e) => {
    if (e.target.matches?.('img.portrait')) e.target.remove();
  },
  true,
);
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  e.preventDefault();
  busy(el, () => handle(el.dataset.act, el));
});
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.name === 'projects') {
    const select = $('#pickproject');
    if (select) select.innerHTML = view.projectOptions(t.value);
  }
  if (t.id === 'search') view.listResults();
  if (t.closest('#editform')) {
    state.dirty = true;
    view.collect();
    if (t.name === 'avatar') document.querySelector('.formgrid .avatar-person').outerHTML = view.avatarMarkup(state.model);
  }
});
document.addEventListener('change', async (e) => {
  const input = e.target;
  if (input.id === 'pickproject' && input.value) pickProject(input.value);
  else if (input.id === 'files') {
    const files = [...input.files];
    await busy(input, () => addFiles(files));
    input.value = '';
  } else if (input.id === 'restorefile' && input.files[0]) await busy(input, () => loadBackupFile(input.files[0]));
});
document.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  const button = f.querySelector('button[type=submit]') || f.querySelector('button:last-child');
  if (f.id === 'urlform') {
    button?.click();
    return;
  }
  busy(button, () => submit(f));
});
window.addEventListener('beforeunload', (e) => {
  if (state.dirty && state.editSession) {
    e.preventDefault();
    e.returnValue = '';
  }
});
window.addEventListener('hashchange', route);
route();
