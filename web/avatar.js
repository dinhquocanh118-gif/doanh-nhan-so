// Only accept explicit HTTPS image links. A page's social preview may be a logo.
export function avatarUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password && url.href.length <= 2000) return url.href;
  } catch {}
  return '';
}

export function findAvatar(sources) {
  for (const { text } of sources) {
    const explicit = text.match(/^\s*(?:ảnh đại diện|ảnh chân dung|avatar|profile (?:photo|picture)|headshot)\s*:\s*(https:\/\/[^\s<>]+)/im)?.[1];
    const labeled = text.match(/!\[[^\]\n]*(?:ảnh đại diện|ảnh chân dung|profile (?:photo|picture)|headshot)[^\]\n]*\]\((https:\/\/[^\s)]+)\)/i)?.[1];
    const image = avatarUrl(explicit || labeled);
    if (image) return image;
  }
  return '';
}
