// بيانات المصحف للرواية المختارة حاليًا (حفص أو ورش). نصوص الصفحات كبيرة فتُحمَّل عند الحاجة فقط.
import hafsMeta from "./data/hafs/meta.json";
import warshMeta from "./data/warsh/meta.json";
import { getState } from "./store.js";

export const RIWAYAT = [
  { id: "hafs", name: { ar: "حفص عن عاصم", fr: "Hafs d'après 'Âsim", en: "Hafs from 'Asim" } },
  { id: "warsh", name: { ar: "ورش عن نافع (طريق الأزرق)", fr: "Warsh d'après Nâfi' (voie d'al-Azraq)", en: "Warsh from Nafi' (al-Azraq route)" } },
  { id: "asbahani", disabled: true, name: { ar: "ورش عن نافع (طريق الأصبهاني)", fr: "Warsh d'après Nâfi' (voie d'al-Asbahânî)", en: "Warsh from Nafi' (al-Asbahani route)" } },
];

const METAS = { hafs: hafsMeta, warsh: warshMeta };
const LOADERS = {
  hafs: () => import("./data/hafs/pages.json"),
  warsh: () => import("./data/warsh/pages.json"),
};
const cache = {};

export const riwaya = () => (METAS[getState().riwaya] ? getState().riwaya : "hafs");
const meta = () => METAS[riwaya()];

export function riwayaName(id, lang) {
  return RIWAYAT.find((r) => r.id === id)?.name[lang] || id;
}

export function loadPages(r = riwaya()) {
  if (!cache[r]) cache[r] = LOADERS[r]().then((m) => m.default);
  return cache[r];
}

export const surahs = () => meta().surahs;
export const juzStarts = () => meta().juz;
export const basmala = () => meta().basmala;
// في ورش البسملة ليست آية من الفاتحة فتُعرض عنوانًا فوقها كباقي السور
export const basmalaBefore = (surah) => surah !== 9 && (surah !== 1 || meta().basmalaInFatiha);

export function juzOfPage(page) {
  const juz = juzStarts();
  let j = 1;
  while (j < 30 && juz[j] <= page) j++;
  return j;
}

export function juzPages(j) {
  const juz = juzStarts();
  const end = j === 30 ? 604 : juz[j] - 1;
  return range(juz[j - 1], end);
}

// السورة تمتد حتى صفحة بداية السورة التالية، إلا إذا بدأت التالية في أعلى تلك الصفحة
export function surahPages(n) {
  const list = surahs();
  const start = list[n - 1].page;
  if (n === 114) return [start];
  const next = list[n].page;
  const nextAtTop = meta().pageStart[next - 1][0] === n + 1;
  return range(start, Math.max(start, nextAtTop ? next - 1 : next));
}

// اسم السورة التي تبدأ بها الصفحة
export function pageTitle(page) {
  return surahs()[meta().pageStart[page - 1][0] - 1].name;
}

export function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}
