// Trạng thái phiên làm việc và mã không gian (quyền quản lý hồ sơ).
import { empty, rpc } from './data.js';

const KEY = 'dns.workspace.v1';
const BACKUP = 'dns.backup.v1';
const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};

const randomKey = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), (x) => x.toString(16).padStart(2, '0')).join('');
let key = store.get(KEY);
if (!/^[a-f0-9]{64}$/.test(key || '')) {
  key = randomKey();
  store.set(KEY, key);
}

export const state = {
  rows: [],
  record: null,
  model: empty(),
  sources: [],
  tab: 'upload',
  seq: 0,
  dirty: false,
  editSession: false,
  reviewNotice: '',
};

export const workspaceKey = () => key;
export function setWorkspaceKey(next) {
  key = next;
  store.set(KEY, key);
  markBackedUp();
}
export const needsBackup = () => store.get(BACKUP) !== key;
export const markBackedUp = () => store.set(BACKUP, key);
export async function keyHash() {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, '0')).join('');
}
export const backupText = () =>
  [
    'Danhfolio · Mã không gian',
    '',
    key,
    '',
    'Mã này cho phép mở, sửa và xóa mọi hồ sơ trong không gian của bạn.',
    'Giữ tệp ở nơi an toàn và không gửi cho người khác. Không có cách khôi phục nếu mất mã.',
    'Để mở trên thiết bị khác: vào mục Mã không gian, chọn tệp này hoặc dán mã.',
    'Tạo lúc: ' + new Date().toLocaleString('vi-VN'),
    '',
  ].join('\n');

// Gọi RPC với quyền chủ sở hữu.
export const r = (name, params = {}) => rpc(name, { p_key: key, ...params });

export function resetEditor(tab = state.tab) {
  Object.assign(state, { record: null, model: empty(), sources: [], tab, editSession: true, dirty: false });
}
