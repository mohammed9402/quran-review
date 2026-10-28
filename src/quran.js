import meta from "./data/meta.json";

export const { surahs, juz, hizb, pageStart } = meta;

let pagesPromise;
// نص المصحف كبير نسبيًا فيُحمَّل عند الحاجة فقط
export function loadPages() {
  if (!pagesPromise) pagesPromise = import("./data/pages.json").then((m) => m.default);
  return pagesPromise;
}

export function juzOfPage(page) {
  let j = 1;
  while (j < 30 && juz[j] <= page) j++;
  return j;
}

export function juzPages(j) {
  const start = juz[j - 1];
  const end = j === 30 ? 604 : juz[j] - 1;
  return range(start, end);
}

// السورة تمتد حتى صفحة بداية السورة التالية، إلا إذا بدأت التالية في أعلى تلك الصفحة
export function surahPages(n) {
  const start = surahs[n - 1].page;
  if (n === 114) return [start];
  const next = surahs[n].page;
  const nextAtTop = pageStart[next - 1][0] === n + 1;
  return range(start, Math.max(start, nextAtTop ? next - 1 : next));
}

// اسم السورة التي تبدأ بها الصفحة
export function pageTitle(page) {
  return surahs[pageStart[page - 1][0] - 1].name;
}

export function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

const digits = "٠١٢٣٤٥٦٧٨٩";
export function ar(n) {
  return String(n).replace(/\d/g, (d) => digits[d]).replace(".", "٫");
}

// تمييز العدد: ١ صفحة، ٢ صفحتان، ٣–١٠ صفحات، ١١+ صفحة
export function pagesLabel(n) {
  if (n === 1) return "صفحة واحدة";
  if (n === 2) return "صفحتان";
  const mod = n % 100;
  return `${ar(n)} ${mod >= 3 && mod <= 10 ? "صفحات" : "صفحة"}`;
}
