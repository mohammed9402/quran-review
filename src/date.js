// التواريخ تُخزَّن كنص YYYY-MM-DD بالتوقيت المحلي
export function today() {
  return toKey(new Date());
}

export function toKey(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  return toKey(new Date(y, m - 1, d + n));
}

export function diffDays(a, b) {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}
