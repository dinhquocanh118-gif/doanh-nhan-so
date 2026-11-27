import { normalize } from './data.js';
export const entries = (text) =>
  String(text || '')
    .split(/\r?\n|;\s*(?=[\p{Lu}\d])/u)
    .map((s) => s.trim())
    .filter(Boolean);
export function career(text) {
  return entries(text).map((line) => {
    const date = line.match(
      /(?:\d{1,2}[/.])?(?:19|20)\d{2}(?:\s*[-–—]\s*(?:(?:\d{1,2}[/.])?(?:19|20)\d{2}|hiện tại|nay|present|now))?/i,
    );
    const title = date
      ? line
          .replace(date[0], '')
          .replace(/\(\s*\)/g, '')
          .replace(/^[\s|:–-]+|[\s|:–-]+$/g, '')
      : line;
    return { date: date?.[0] || '', title: title || line };
  });
}
const terms = [
  ['tuyen dung', 'talent acquisition', 'recruitment', 'recruiting'],
  ['nhan su', 'human resources', 'human resource'],
  ['noi that', 'furniture'],
  ['phan phoi', 'distribution'],
  ['tri tue nhan tao', 'artificial intelligence', 'ai'],
  ['thiet ke', 'design'],
  ['ban dan', 'semiconductor'],
  ['quan ly du an', 'project management'],
];
const words = (s) =>
  normalize(s)
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
export function matchEvidence(d, query) {
  const q = words(query),
    phrase = q.join(' '),
    has = (s, t) => (' ' + s + ' ').includes(' ' + t + ' ');
  const pairs = q
    .slice(1)
    .map((w, i) => q[i] + ' ' + w)
    .filter((t) => !['toi can', 'dang tim', 'doi tac', 'ho tro', 'co the', 'cho toi', 'toi muon', 'nguoi co'].includes(t));
  const concepts = terms.filter((group) => group.some((t) => has(phrase, t)));
  const out = [];
  for (const [key, label] of [
    ['experience', 'Kinh nghiệm'],
    ['projects', 'Dự án'],
    ['skills', 'Năng lực'],
    ['goals', 'Nhu cầu hợp tác'],
    ['bio', 'Giới thiệu'],
  ]) {
    entries(d[key]).forEach((v, i) => {
      const source = words(v).join(' ');
      const score =
        pairs.filter((t) => has(source, t)).length * 2 +
        concepts.filter((g) => g.some((t) => has(source, t))).length * 3 +
        (q.length === 1 && q[0].length > 2 && has(source, q[0]) ? 1 : 0);
      if (score) out.push({ key, label, text: v, index: i, score });
    });
  }
  return out
    .sort(
      (a, b) =>
        Number(['projects', 'experience'].includes(b.key)) - Number(['projects', 'experience'].includes(a.key)) ||
        b.score - a.score,
    )
    .slice(0, 3);
}
export function vcard(d) {
  const escape = (s) =>
    String(s || '')
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n|\r/g, '\\n')
      .replace(/([;,])/g, '\\$1');
  const c = d.contact || '',
    email = c.match(/[\w.%+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0],
    phone = c.match(/\+?\d[\d ().-]{6,}\d/)?.[0];
  return (
    [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:' + escape(d.name),
      'N:' + escape(d.name) + ';;;;',
      d.company && 'ORG:' + escape(d.company),
      d.role && 'TITLE:' + escape(d.role),
      email && 'EMAIL:' + escape(email),
      phone && 'TEL:' + escape(phone),
      'NOTE:' + escape(c),
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\r\n') + '\r\n'
  );
}
