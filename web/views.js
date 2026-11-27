// Các trang và thành phần giao diện. Mọi dữ liệu người dùng đều đi qua esc().
import QR from 'qrcode';
import { entries, career } from './profile.js';
import { avatarUrl } from './avatar.js';
import { fields, demo, normalize } from './data.js';
import { $, esc, ico, btn, link, brand, initials, frame, flow } from './ui.js';
import { state, needsBackup } from './state.js';

export const shareUrl = (id) => location.href.split('#')[0] + '#p/' + id;

export function entry(row, isDemo = false) {
  const name = isDemo ? demo.name : row.name;
  const detail = isDemo
    ? 'Nhà sáng lập · Mộc Studio'
    : [row.role, row.company].filter(Boolean).join(' · ') || 'Hồ sơ nghề nghiệp';
  const badge = isDemo ? 'Hồ sơ mẫu' : row.shared ? 'Đã chia sẻ' : 'Bản nháp';
  return `<button class="entry" data-act="${isDemo ? 'demo' : 'open'}" data-id="${esc(row.id)}"><div class="person">${esc(initials(name))}</div><div class="details"><strong>${esc(name)}</strong><small>${esc(detail)}</small></div><span class="badge ${isDemo ? 'demo' : ''}">${badge}</span>${ico('next')}</button>`;
}

// Nhắc sao lưu mã khi không gian đã có hồ sơ mà mã chưa được lưu ra ngoài trình duyệt.
export function renderBackupNote() {
  const slot = $('#backupslot');
  if (!slot) return;
  const show = needsBackup() && (state.rows.length > 0 || state.record);
  slot.innerHTML = show
    ? `<section class="panel backupnote" role="note"><strong>${ico('key')} Sao lưu mã không gian</strong><p>Hồ sơ chỉ mở được bằng mã lưu trong trình duyệt này. Nếu xóa dữ liệu trình duyệt hoặc đổi máy mà chưa sao lưu, bạn sẽ mất quyền quản lý hồ sơ.</p><div class="actions">${btn('backupfile', 'Tải tệp sao lưu', 'download')}${link('key', 'Xem mã không gian', 'key')}</div></section>`
    : '';
}

function cards() {
  return [
    ['upload', 'Tải tài liệu', 'Tệp TXT, DOCX hoặc PDF', ''],
    ['url', 'Nhập liên kết', 'LinkedIn hoặc website', 'blue'],
    ['text', 'Dán văn bản', 'Tiểu sử và kinh nghiệm', 'sand'],
  ]
    .map(
      ([type, title, hint, color]) =>
        `<button class="method" data-act="start" data-type="${type}"><span class="iconbox ${color}">${ico(type)}</span><span><strong>${title}</strong><small>${hint}</small></span></button>`,
    )
    .join('');
}

const brandArt = () => $('#heroart').innerHTML;
export function home() {
  const today = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  frame(
    'home',
    'Tổng quan',
    `<div class="titleline"><h1>Tổng quan</h1><span class="date">${esc(today)}</span></div><section class="hero"><div><div class="over">Hồ sơ doanh nhân số</div><h2>Hồ sơ của bạn.<br><em>Sẵn sàng kết nối.</em></h2><p>Tập hợp hành trình sự nghiệp thành một hồ sơ trực quan để chia sẻ với đối tác qua mã QR.</p><div class="actions">${btn('start', 'Tạo hồ sơ', 'plus', 'light')}${btn('demo', 'Xem hồ sơ mẫu', 'eye', 'ghost')}</div></div>${brandArt()}</section><div class="sectionhead"><div><h2>Thêm nguồn hồ sơ</h2><p>Chọn cách bạn muốn nhập thông tin.</p></div></div><div class="methods">${cards()}</div><div class="sectionhead"><h2>Hồ sơ gần đây</h2><a class="linkbtn" href="#list">Xem tất cả ${ico('next')}</a></div><div class="listbox" id="recent">${entry({}, true)}</div><div id="msg" role="status" class="msg"></div>`,
  );
}
export function homeRecent() {
  $('#recent').innerHTML =
    state.rows
      .slice(0, 3)
      .map((x) => entry(x))
      .join('') + entry({}, true);
}

export function list() {
  frame(
    'list',
    'Hồ sơ của tôi',
    `<div class="titleline"><div><h1>Hồ sơ của tôi</h1><p>Quản lý bản nháp và các hồ sơ đang chia sẻ.</p></div>${btn('start', 'Tạo hồ sơ', 'plus')}</div><div class="sectionhead"><input class="text search" id="search" placeholder="Tìm theo tên hoặc doanh nghiệp" aria-label="Tìm hồ sơ"></div><div id="results" class="listbox">Đang tải…</div><div id="msg" role="status" class="msg"></div>`,
  );
}
export function listResults() {
  const q = normalize($('#search')?.value || '');
  const shown = state.rows.filter((x) => normalize(x.name + ' ' + x.company).includes(q));
  $('#results').innerHTML =
    shown.map((x) => entry(x)).join('') ||
    `<div class="blank">${q ? 'Chưa có hồ sơ khớp từ khóa.' : 'Bạn chưa tạo hồ sơ nào.'}</div>`;
}

function importInput(tab) {
  if (tab === 'upload')
    return `<label class="drop">${ico('upload')}<strong>Kéo thả hoặc chọn tài liệu</strong><span class="fine">TXT, DOCX, PDF có lớp chữ · Tối đa 8 MB mỗi tệp</span><input id="files" type="file" multiple accept=".txt,.docx,.pdf,.md" aria-label="Chọn tài liệu"></label>`;
  if (tab === 'url')
    return `<form id="urlform" class="stack"><label class="field">Đường link công khai<input required type="url" id="url" placeholder="https://www.linkedin.com/in/..."></label><p class="fine">Khi chọn Đọc liên kết, URL sẽ được gửi đến Jina Reader để đọc nội dung công khai. Với trang cần đăng nhập, bạn có thể tải bản PDF hoặc dán nội dung.</p>${btn('urladd', 'Đọc liên kết', 'url')}</form>`;
  return `<div class="stack"><label class="field">Nội dung văn bản<textarea id="paste" rows="6" placeholder="Họ tên, chức danh, quá trình làm việc, dự án..." maxlength="45000"></textarea></label>${btn('textadd', 'Thêm văn bản', 'plus', 'secondary')}</div>`;
}
export function importPage() {
  const tabs = [
    ['upload', 'Tệp tài liệu'],
    ['url', 'Liên kết'],
    ['text', 'Văn bản'],
  ]
    .map(([k, l]) => `<button class="${k === state.tab ? 'on' : ''}" data-act="tab" data-type="${k}">${ico(k)}${l}</button>`)
    .join('');
  frame(
    'list',
    'Tạo hồ sơ',
    `<div class="titleline"><div><h1>Thêm nguồn hồ sơ</h1><p>Nhập tài liệu của bạn, sau đó kiểm tra từng mục trước khi lưu.</p></div></div>${flow(1)}<section class="panel"><div class="tabs">${tabs}</div>${importInput(state.tab)}<div id="msg" role="status" class="msg"></div><div id="sources"></div></section><div class="sectionhead"><p class="fine">${ico('lock')} Khi chọn OpenAI, văn bản trích từ nguồn được gửi đến OpenAI để nhận diện hồ sơ.</p><div class="actions">${btn('review', 'Trích xuất cơ bản', 'edit', 'secondary')}${btn('extractapi', 'Nhận diện bằng OpenAI', 'edit')}</div></div>`,
  );
  renderSources();
}
export function renderSources() {
  const el = $('#sources');
  if (!el) return;
  el.innerHTML = state.sources
    .map(
      (s, i) =>
        `<div class="source">${ico('file')}<span>${esc(s.label)} <small class="fine">· ${s.text.length.toLocaleString('vi-VN')} ký tự</small></span><button class="iconbtn" data-act="remove" data-i="${i}" aria-label="Bỏ nguồn">${ico('x')}</button></div>`,
    )
    .join('');
  const b = $('[data-act=review]');
  if (b) b.innerHTML = ico('edit') + ' ' + (state.sources.length ? 'Trích xuất cơ bản' : 'Nhập thủ công');
  const ai = $('[data-act=extractapi]');
  if (ai) ai.hidden = !state.sources.length;
}

function evidence() {
  return (
    state.sources
      .map((s) => `<details><summary>${esc(s.label)}</summary><pre class="previewtext">${esc(s.text)}</pre></details>`)
      .join('') || '<p>Hồ sơ nhập thủ công.</p>'
  );
}
export function avatarMarkup(d) {
  const url = avatarUrl(d.avatar);
  return `<div class="person avatar-person"><span>${esc(initials(d.name))}</span>${url ? `<img class="portrait" src="${esc(url)}" alt="" referrerpolicy="no-referrer">` : ''}</div>`;
}
export const projectOptions = (text) =>
  '<option value="">Chọn từ danh sách dự án</option>' +
  entries(text)
    .map((v) => '<option>' + esc(v) + '</option>')
    .join('');
export const jobInput = (v, i) => `<label class="field">Vị trí ${i + 1}<textarea data-job rows="2">${esc(v)}</textarea></label>`;

function editField(k, label) {
  const m = state.model;
  if (k === 'projects')
    return `<div class="wide stack"><label class="field">Dự án<textarea name="projects" rows="4" maxlength="5500">${esc(m.projects)}</textarea></label><label class="field">Đưa dự án lên đầu trang<select id="pickproject">${projectOptions(m.projects)}</select></label><p class="fine">Dự án đầu tiên sẽ được giới thiệu trên đầu trang nếu mục Dự án được chia sẻ.</p></div>`;
  if (k === 'experience') {
    const jobs = entries(m[k]).length ? entries(m[k]) : [''];
    return `<section class="wide careeredit"><h3>Kinh nghiệm</h3><div id="jobs">${jobs.map(jobInput).join('')}</div>${btn('jobadd', 'Thêm vị trí', 'plus', 'secondary')}</section>`;
  }
  const control = ['name', 'role', 'company', 'contact', 'skills'].includes(k)
    ? `<input name="${k}" maxlength="${k === 'name' ? 120 : 2000}" value="${esc(m[k])}" ${k === 'name' ? 'required' : ''}>`
    : `<textarea name="${k}" rows="3" maxlength="5500">${esc(m[k])}</textarea>`;
  return `<label class="field ${['role', 'company'].includes(k) ? '' : 'wide'}">${label}${k === 'name' ? ' *' : ''}${control}</label>`;
}
export function editPage() {
  const m = state.model;
  const notice = state.reviewNotice ? '<p class="hint">' + esc(state.reviewNotice) + '</p>' : '';
  frame(
    'list',
    'Duyệt hồ sơ',
    `<h1>Duyệt hồ sơ</h1><p>Đối chiếu thông tin với nguồn và chỉnh sửa những mục còn thiếu.</p>${flow(2)}${notice}<details class="panel"><summary>${ico('file')} Nguồn đối chiếu (${state.sources.length})</summary>${evidence()}</details><form id="editform" class="panel stack"><div class="formgrid"><div class="wide"><label class="field">Ảnh đại diện (URL HTTPS)<input name="avatar" type="url" maxlength="2000" value="${esc(m.avatar || '')}"></label><p class="fine">Kiểm tra ảnh từ nguồn, thay URL hoặc xóa nếu ảnh không đúng.</p>${avatarMarkup(m)}</div>${Object.entries(
      fields,
    )
      .map(([k, l]) => editField(k, l))
      .join(
        '',
      )}</div><div id="msg" role="status" class="msg"></div><div class="actions">${state.sources.length ? btn('aibio', 'Gợi ý giới thiệu bằng AI', 'edit', 'secondary') : ''}${btn('sources', 'Quay lại nguồn', 'back', 'secondary')}<button class="btn" type="submit">${ico('save')} Lưu bản nháp</button></div></form>`,
  );
}
// Đọc lại form duyệt hồ sơ vào state.model.
export function collect() {
  const form = $('#editform');
  if (!form) return;
  state.model = Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v).trim()]));
  state.model.experience = [...form.querySelectorAll('[data-job]')]
    .map((n) => n.value.trim())
    .filter(Boolean)
    .join('\n');
}

function careers(text) {
  const items = career(text)
    .map((j, i) => `<li id="e-experience-${i}">${j.date ? '<time>' + esc(j.date) + '</time>' : ''}<p>${esc(j.title)}</p></li>`)
    .join('');
  return '<ol class="careerlog">' + items + '</ol>';
}
export function matchPanel(hits, q) {
  const found = hits.length
    ? hits
        .map((h) => {
          const target = ['experience', 'projects'].includes(h.key) ? 'e-' + h.key + '-' + h.index : 's-' + h.key;
          return `<div class="hint"><button class="evidencelink" data-act="evidence" data-id="${target}">${esc(h.label)}</button><p>${esc(h.text)}</p></div>`;
        })
        .join('')
    : '<p>Chưa thấy kinh nghiệm hay dự án liên quan trong phần hồ sơ được chia sẻ.</p>';
  return `<h3>Căn cứ trong hồ sơ</h3>${found}<h3>Điểm cần làm rõ</h3><p>Phạm vi công việc, kết quả kỳ vọng và khả năng tham gia cần được hai bên xác nhận.</p><h3>Câu hỏi mở đầu</h3><p>Với nhu cầu “${esc(q)}”, anh/chị có thể chia sẻ một công việc tương tự, vai trò cụ thể và kết quả đạt được không?</p>`;
}
export function lookupPanel(hits, match) {
  return hits.length
    ? hits
        .map(
          (h) =>
            `<div class="hint"><strong>${esc(h.label)}</strong><p class="prose">${esc(h.text)}</p>${match ? `<small>Từ khóa trùng: ${esc(h.overlap.join(', '))}</small>` : ''}</div>`,
        )
        .join('')
    : '<p>Chưa tìm thấy thông tin phù hợp trong phần hồ sơ đang hiển thị.</p>';
}

function section(d, k) {
  let body;
  if (k === 'skills')
    body = `<div class="chips">${d[k]
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `<span>${esc(s)}</span>`)
      .join('')}</div>`;
  else if (k === 'experience') body = careers(d[k]);
  else if (k === 'projects')
    body = entries(d[k])
      .map((v, i) => `<p class="projectitem" id="e-projects-${i}">${esc(v)}</p>`)
      .join('');
  else body = `<p class="prose">${esc(d[k])}</p>`;
  return `<section id="s-${k}" class="panel"><h2>${fields[k]}</h2>${body}</section>`;
}
export function profileBody(d) {
  const featured = entries(d.projects)[0];
  const actions =
    btn('discover', 'Trao đổi hợp tác', 'chat', 'light') +
    (featured
      ? `<button class="btn ghost" data-act="evidence" data-id="e-projects-0">${ico('work')} ${esc(featured.split('|')[0].slice(0, 64))}</button>`
      : '') +
    (d.contact ? btn('vcard', 'Lưu liên hệ', 'download', 'ghost') : '');
  const sections =
    ['bio', 'experience', 'projects', 'skills', 'goals', 'contact']
      .filter((k) => d[k])
      .map((k) => section(d, k))
      .join('') || '<section class="panel"><p>Chủ hồ sơ chưa bổ sung các mục khác.</p></section>';
  return `<div class="profilehero">${avatarMarkup(d)}<h1>${esc(d.name)}</h1><p>${esc([d.role, d.company].filter(Boolean).join(' · '))}</p>${d.bio ? '<p class="intro">' + esc(d.bio.split(/(?<=[.!?])\s/)[0]) + '</p>' : ''}<div class="actions">${actions}</div></div><div class="profilegrid"><div>${sections}</div><section class="panel stack"><h2>Khám phá hồ sơ</h2><div class="tabs"><button data-act="asktab" data-type="qa" class="on">Hỏi đáp</button><button data-act="asktab" data-type="match">Hợp tác</button></div><form id="askform" class="stack" data-mode="qa"><label class="field"><span id="asklabel">Bạn muốn biết điều gì?</span><textarea id="question" required placeholder="Người này có kinh nghiệm gì?" maxlength="450"></textarea></label><button class="btn" id="askbtn">${ico('search')} Tra cứu</button></form><div id="answer" aria-live="polite" class="answer"></div><div id="aiarea"></div></section></div>`;
}

function sharePanel(rec) {
  const current = rec.published || {};
  const checks = Object.entries({ ...fields, avatar: 'Ảnh đại diện' })
    .filter(([k]) => rec.draft[k])
    .map(([k, l]) => {
      const on =
        k === 'name'
          ? 'checked disabled'
          : (rec.share ? Object.hasOwn(current, k) : !['contact', 'avatar'].includes(k))
            ? 'checked'
            : '';
      return `<label class="check"><input type="checkbox" name="publishField" value="${k}" ${on}>${l}</label>`;
    })
    .join('');
  const qr = rec.share
    ? `<div class="qrbox"><img id="qr" alt="Mã QR mở bản hồ sơ đã công bố"><div class="stack"><strong>Liên kết dành cho đối tác</strong><p><a target="_blank" rel="noopener noreferrer" href="${esc(shareUrl(rec.share))}">${esc(shareUrl(rec.share))}</a></p><div class="actions">${btn('copyurl', 'Sao chép', 'copy', 'secondary')}<a download="danhfolio-qr.png" id="qrdown" class="button secondary">${ico('download')} Tải QR</a></div></div></div>`
    : '';
  return `<div class="panel stack"><h2>Chia sẻ với đối tác</h2><p>Chọn các mục được phép xem qua liên kết hoặc mã QR. Bạn có thể ghi cùng liên kết lên thẻ NFC.</p><div class="checkgrid">${checks}</div><div class="actions">${btn('publish', rec.share ? 'Cập nhật bản chia sẻ' : 'Công bố hồ sơ', 'globe')}${rec.share ? btn('revoke', 'Thu hồi liên kết', 'lock', 'secondary') : ''}</div>${qr}</div>`;
}
export async function ownerPage(rec) {
  Object.assign(state, { record: rec, model: rec.draft, sources: rec.sources, editSession: false, dirty: false });
  frame(
    'list',
    'Quản lý hồ sơ',
    `<div class="actions">${link('list', 'Hồ sơ của tôi', 'back')}${btn('edit', 'Chỉnh sửa', 'edit', 'secondary')}<button data-act="delete" class="iconbtn alignend" aria-label="Xóa hồ sơ">${ico('trash')}</button></div><div class="profile">${sharePanel(rec)}<div id="msg" role="status" class="msg"></div><div class="sectionhead"><h2>Bản riêng của bạn</h2><span class="badge">${ico('lock')} Chủ hồ sơ</span></div>${profileBody(rec.draft)}</div>`,
  );
  renderBackupNote();
  if (rec.share) {
    const src = await QR.toDataURL(shareUrl(rec.share), { width: 420, margin: 4, errorCorrectionLevel: 'M' });
    const qr = $('#qr'),
      a = $('#qrdown');
    if (qr) qr.src = src;
    if (a) a.href = src;
  }
}
export function publicPage(d, sample) {
  state.model = d;
  $('#layout').innerHTML =
    `<header class="publicbar">${brand}${sample ? link('new', 'Tạo hồ sơ', 'plus') : link('home', 'Không gian của tôi', 'home')}</header><main id="main" class="publicmain"><div class="profile"><span class="badge">${ico(sample ? 'eye' : 'globe')} ${sample ? 'Hồ sơ minh họa · Dữ liệu giả định' : 'Hồ sơ được chủ sở hữu chia sẻ'}</span>${profileBody(d)}</div></main>`;
}

export function guide() {
  const steps = [
    [
      'Nhập thông tin',
      'Tải tối đa 8 tệp hoặc nguồn văn bản cho mỗi hồ sơ. Với LinkedIn yêu cầu đăng nhập, hãy xuất PDF hoặc dán phần giới thiệu. PDF scan cần được OCR trước.',
    ],
    [
      'Duyệt và lưu',
      'Đối chiếu bản nháp với nguồn ngay trong trình chỉnh sửa. Công cụ trích xuất dựa trên tiêu đề, ngày và từ khóa. Bạn có thể bổ sung hoặc sửa mọi mục.',
    ],
    [
      'Chia sẻ và thu hồi',
      'Chọn các trường muốn công bố, sao chép liên kết hoặc tải mã QR. Sau khi sửa bản nháp, chọn Cập nhật bản chia sẻ để thay đổi nội dung đối tác thấy. Thu hồi sẽ vô hiệu hóa liên kết cũ.',
    ],
    [
      'Chuyển sang thiết bị mới',
      'Tải tệp sao lưu trong mục Mã không gian. Trên trình duyệt khác, chọn tệp đó hoặc dán mã để mở lại hồ sơ.',
    ],
  ];
  frame(
    'guide',
    'Hướng dẫn',
    `<h1>Hướng dẫn sử dụng</h1>${steps.map(([t, d]) => `<div class="step"><strong>${t}</strong><p>${d}</p></div>`).join('')}${link('new', 'Bắt đầu tạo hồ sơ', 'plus', '')}`,
  );
}
export function keys() {
  const status = needsBackup()
    ? '<p class="hint error">Mã của không gian này chưa được sao lưu.</p>'
    : '<p class="hint">Bạn đã sao lưu mã của không gian này.</p>';
  frame(
    'key',
    'Mã không gian',
    `<h1>Mã không gian</h1><section class="panel stack"><h2>Sao lưu quyền quản lý</h2><p>Mã riêng cho phép mở, chỉnh sửa và xóa hồ sơ trên thiết bị khác. Không có cách khôi phục nếu mất mã, nên hãy lưu ở nơi an toàn trước khi xóa dữ liệu trình duyệt.</p>${status}<div class="actions">${btn('backupfile', 'Tải tệp sao lưu', 'download')}${btn('backup', 'Sao chép mã riêng', 'key', 'secondary')}${btn('aihash', 'Sao chép mã băm để bật OpenAI', 'copy', 'secondary')}</div></section><form id="restore" class="panel stack"><h2>Mở không gian đã có</h2><label class="field">Tệp sao lưu<input id="restorefile" type="file" accept=".txt,text/plain"></label><label class="field">Hoặc dán mã riêng<input id="restorekey" type="password" required minlength="64" maxlength="64" autocomplete="off" spellcheck="false"></label><p class="fine">Sao lưu mã hiện tại trước khi chuyển không gian.</p><button class="btn secondary">${ico('folder')} Mở không gian</button></form><div id="msg" role="status" class="msg"></div>`,
  );
}
