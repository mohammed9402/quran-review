// يولّد بيانات المصحف لكل رواية في src/data/<رواية>/ (pages.json و meta.json)
// حفص: النص العثماني من quran-json (موسوعة القرآن الكريم QuranEnc) وحدود الصفحات من quran-meta.
// ورش عن نافع من طريق الأزرق: نص مجمع الملك فهد لطباعة المصحف الشريف (الإصدار 10) مع صفحات مصحف ورش.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { PageList, JuzList } from "quran-meta/hafs";

const require = createRequire(import.meta.url);
const quran = JSON.parse(readFileSync(require.resolve("quran-json/dist/quran.json"), "utf8"));
const WARSH_URL = "https://raw.githubusercontent.com/thetruetruth/quran-data-kfgqpc/main/warsh/data/warshData_v10.json";

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

function hafs() {
  const ayahs = [null];
  for (const s of quran) for (const v of s.verses) ayahs.push([s.id, v.id, v.text]);
  if (ayahs.length !== 6237) throw new Error("عدد آيات حفص غير صحيح");
  // PageList فيها عنصر وهمي في البداية والنهاية: الصفحة p تبدأ عند PageList[p] وتنتهي قبل PageList[p+1]
  const pages = [];
  for (let p = 1; p <= 604; p++) pages.push(ayahs.slice(PageList[p], PageList[p + 1]));
  const juz = [];
  const pageOfAyah = (id) => {
    let p = 1;
    while (p < 604 && PageList[p + 1] <= id) p++;
    return p;
  };
  for (let j = 1; j <= 30; j++) juz.push(pageOfAyah(JuzList[j]));
  // في حفص البسملة هي الآية الأولى من الفاتحة، فتُعرض فوق باقي السور بنصها نفسه
  write("hafs", pages, buildMeta(pages, juz), { basmala: ayahs[1][2] });
}

async function warsh() {
  const res = await fetch(WARSH_URL);
  if (!res.ok) throw new Error("تعذّر تنزيل نص ورش: " + res.status);
  const data = await res.json();
  if (data.length !== 6214) throw new Error("عدد آيات ورش غير صحيح: " + data.length);
  const pages = Array.from({ length: 604 }, () => []);
  const juz = Array(30).fill(0);
  for (const a of data) {
    // الآية الممتدة على صفحتين ("85-86") تُحسب على صفحة بدايتها
    const page = parseInt(String(a.page).split("-")[0]);
    // رقم الآية مكتوب في آخر النص بعد مسافة غير منكسرة، والتطبيق يرسمه بنفسه
    const text = a.aya_text.replace(/[‏]/g, "").replace(/ [٠-٩]+\s*$/, "").trim();
    pages[page - 1].push([a.sura_no, a.aya_no, text]);
    if (!juz[a.jozz - 1] || page < juz[a.jozz - 1]) juz[a.jozz - 1] = page;
  }
  // البسملة في ورش ليست آية من الفاتحة؛ نأخذ نصها من الآية 30 من سورة النمل بضبط ورش نفسه
  const naml30 = data.find((a) => a.sura_no === 27 && a.aya_no === 30).aya_text;
  const basmala = naml30.slice(naml30.indexOf("بِسْمِ")).replace(/ [٠-٩]+\s*$/, "").trim();
  write("warsh", pages, buildMeta(pages, juz), { basmala, basmalaInFatiha: true });
}

hafs();
await warsh();
