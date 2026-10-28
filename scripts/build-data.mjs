// يولّد بيانات المصحف لكل رواية في src/data/<رواية>/ (pages.json و meta.json)
// النصوص وحدود الصفحات من مجمع الملك فهد لطباعة المصحف الشريف:
// حفص عن عاصم (الإصدار 18، مصحف المدينة النبوية) وورش عن نافع من طريق الأزرق (الإصدار 10، مصحف ورش).
// أسماء السور ونوعها (مكية/مدنية) والنطق اللاتيني من quran-json.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const quran = JSON.parse(readFileSync(require.resolve("quran-json/dist/quran.json"), "utf8"));
const KFGQPC = "https://raw.githubusercontent.com/thetruetruth/quran-data-kfgqpc/main";
const SOURCES = {
  hafs: { url: `${KFGQPC}/hafs/data/hafsData_v18.json`, ayahs: 6236 },
  warsh: { url: `${KFGQPC}/warsh/data/warshData_v10.json`, ayahs: 6214 },
};

// pages: مصفوفة 604 صفحة، كل صفحة مصفوفة آيات [سورة، آية، نص]
function buildMeta(pages, juzStartPages) {
  const surahs = quran.map((s) => {
    const page = pages.findIndex((pg) => pg.some((a) => a[0] === s.id)) + 1;
    const ayahs = pages.flat().filter((a) => a[0] === s.id).length;
    return { n: s.id, name: s.name, tr: s.transliteration, ayahs, type: s.type, page };
  });
  const pageStart = pages.map((pg) => [pg[0][0], pg[0][1]]);
  return { surahs, juz: juzStartPages, pageStart };
}

function write(riwaya, pages, meta, extra = {}) {
  mkdirSync(`src/data/${riwaya}`, { recursive: true });
  writeFileSync(`src/data/${riwaya}/pages.json`, JSON.stringify(pages));
  writeFileSync(`src/data/${riwaya}/meta.json`, JSON.stringify({ ...meta, ...extra }));
  console.log(riwaya, "pages:", pages.length, "ayahs:", pages.flat().length, "juz:", meta.juz.join(","));
}

async function download(riwaya) {
  const { url, ayahs } = SOURCES[riwaya];
  const res = await fetch(url);
  if (!res.ok) throw new Error(`تعذّر تنزيل نص ${riwaya}: ${res.status}`);
  const data = await res.json();
  if (data.length !== ayahs) throw new Error(`عدد آيات ${riwaya} غير صحيح: ${data.length}`);
  return data;
}

// رقم الآية مكتوب في آخر النص بعد مسافة غير منكسرة، والتطبيق يرسمه بنفسه
const cleanText = (text) => text.replace(/[\u200f]/g, "").replace(/\u00a0[\u0660-\u0669]+\s*$/, "").trim();

function paginate(data) {
  const pages = Array.from({ length: 604 }, () => []);
  const juz = Array(30).fill(0);
  for (const a of data) {
    // الآية الممتدة على صفحتين ("85-86") تُحسب على صفحة بدايتها
    const page = parseInt(String(a.page).split("-")[0]);
    pages[page - 1].push([a.sura_no ?? a.sora, a.aya_no, cleanText(a.aya_text)]);
    if (!juz[a.jozz - 1] || page < juz[a.jozz - 1]) juz[a.jozz - 1] = page;
  }
  return { pages, juz };
}

async function hafs() {
  const { pages, juz } = paginate(await download("hafs"));
  // في حفص البسملة هي الآية الأولى من الفاتحة، فتُعرض فوق باقي السور بنصها نفسه
  write("hafs", pages, buildMeta(pages, juz), { basmala: pages[0][0][2] });
}

async function warsh() {
  const data = await download("warsh");
  const { pages, juz } = paginate(data);
  // البسملة في ورش ليست آية من الفاتحة؛ نأخذ نصها من الآية 30 من سورة النمل بضبط ورش نفسه
  const naml30 = cleanText(data.find((a) => a.sura_no === 27 && a.aya_no === 30).aya_text);
  write("warsh", pages, buildMeta(pages, juz), { basmala: naml30.slice(naml30.indexOf("بِسْمِ")), basmalaInFatiha: true });
}

await hafs();
await warsh();
