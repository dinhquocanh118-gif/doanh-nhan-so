// Tiện ích DOM dùng chung: biểu tượng, nút, khung trang, thông báo.
import {
  createElement,
  LayoutDashboard,
  ContactRound,
  BookOpen,
  KeyRound,
  PanelLeft,
  ChevronRight,
  Plus,
  Upload,
  Link as LinkIcon,
  AlignLeft,
  FileText,
  Layers,
  ArrowUpRight,
  ScanLine,
  Eye,
  Trash2,
  Save,
  Check,
  Copy,
  ChevronLeft,
  FolderOpen,
  Building2,
  Search,
  Download,
  LockKeyhole,
  Globe,
  BriefcaseBusiness,
  Menu,
  Compass,
  SquarePen,
  MessageCircle,
  X,
  ShieldCheck,
} from 'lucide/dist/esm/lucide/src/lucide.js';

export const $ = (s) => document.querySelector(s);
export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const glyph = {
  home: LayoutDashboard,
  list: ContactRound,
  guide: BookOpen,
  key: KeyRound,
  crumb: PanelLeft,
  next: ChevronRight,
  plus: Plus,
  upload: Upload,
  url: LinkIcon,
  text: AlignLeft,
  file: FileText,
  layers: Layers,
  external: ArrowUpRight,
  qr: ScanLine,
  eye: Eye,
  trash: Trash2,
  save: Save,
  check: Check,
  copy: Copy,
  back: ChevronLeft,
  folder: FolderOpen,
  company: Building2,
  search: Search,
  download: Download,
  lock: LockKeyhole,
  globe: Globe,
  work: BriefcaseBusiness,
  menu: Menu,
  compass: Compass,
  edit: SquarePen,
  chat: MessageCircle,
  x: X,
  shield: ShieldCheck,
};
const icons = {};
export function ico(n) {
  return (icons[n] ??= createElement(glyph[n], { class: 'ico', 'aria-hidden': 'true' }).outerHTML);
}
export const btn = (action, label, icon, style = '') =>
  `<button type="button" class="btn ${style}" data-act="${action}">${ico(icon)} ${label}</button>`;
export const link = (hash, label, icon, style = 'secondary') =>
  `<a class="button ${style}" href="#${hash}">${ico(icon)} ${label}</a>`;
export const brand = `<a class="brand" href="#home"><img src="./assets/logo.svg" alt=""><span>Danhfolio<small>DOANH NHÂN SỐ</small></span></a>`;
export const initials = (s) =>
  (s || '?')
    .split(/\s+/)
    .filter(Boolean)
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .map((x) => x[0])
    .join('')
    .toUpperCase();

let timer;
export function toast(text) {
  clearTimeout(timer);
  $('#toast').textContent = text;
  timer = setTimeout(() => ($('#toast').textContent = ''), 4200);
}
export function msg(t, error = false) {
  const el = $('#msg');
  if (el) {
    el.className = 'msg hint' + (error ? ' error' : '');
    el.textContent = t;
  } else toast(t);
}
export function nice(e) {
  return /Failed to fetch|network|timeout|aborted/i.test(e?.message)
    ? 'Chưa kết nối được dịch vụ. Hãy kiểm tra mạng rồi thử lại.'
    : e?.message || 'Thao tác chưa hoàn tất.';
}
export function dialog(title, body) {
  $('#inside').innerHTML =
    `<div class="rowhead"><h2>${title}</h2><button class="iconbtn" data-act="close" aria-label="Đóng">${ico('x')}</button></div><div class="stack" style="margin-top:15px">${body}</div>`;
  if (!$('#dialog').open) $('#dialog').showModal();
}

const navNames = { home: 'Tổng quan', list: 'Hồ sơ của tôi', guide: 'Hướng dẫn', key: 'Mã không gian' };
export function frame(current, title, content) {
  const nav = Object.entries(navNames)
    .map(
      ([n, label]) =>
        `<a href="#${n}" title="${label}" aria-label="${label}" class="${n === current ? 'active' : ''}" ${n === current ? 'aria-current="page"' : ''}>${ico(n)}<span>${label}</span></a>`,
    )
    .join('');
  $('#layout').innerHTML =
    `<div class="frame"><aside class="side">${brand}<div><div class="navlabel">Không gian làm việc</div><nav class="nav">${nav}</nav></div><div class="sidefoot"><button data-act="about">${ico('shield')} Quyền riêng tư</button></div></aside><div class="main"><header class="top"><div class="bread">${ico('crumb')} Không gian cá nhân ${ico('next')} <b>${title}</b></div><div class="topright">Workspace<div class="avatar">DN</div></div></header><main id="main" tabindex="-1" class="wrap"><div id="backupslot"></div>${content}</main></div></div>`;
}
export const flow = (n) => {
  const step = (i, label) => (i === n ? `<strong>${label}</strong>` : `<span>${label}</span>`);
  return `<div class="flow">${step(1, '1. Thêm nguồn')}${ico('next')}${step(2, '2. Duyệt hồ sơ')}${ico('next')}<span>3. Chia sẻ</span></div>`;
};

export async function busy(el, fn) {
  if (el.disabled) return;
  el.disabled = true;
  el.setAttribute('aria-busy', 'true');
  try {
    await fn();
  } catch (e) {
    msg(nice(e), true);
  } finally {
    el.disabled = false;
    el.removeAttribute('aria-busy');
  }
}
export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Đã sao chép.');
  } catch {
    dialog('Sao chép nội dung', `<textarea readonly class="text">${esc(text)}</textarea>`);
  }
}
export function download(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
