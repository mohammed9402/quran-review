// يولّد ملفات البيانات في src/data من الحزمتين quran-json (النص العثماني) و quran-meta (حدود صفحات مصحف المدينة)
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { PageList, JuzList, HizbQuarterList, findSurahAyahByAyahId } from "quran-meta/hafs";

const require = createRequire(import.meta.url);
const quran = JSON.parse(readFileSync(require.resolve("quran-json/dist/quran.json"), "utf8"));

// رقم الآية المطلق (1..6236) -> [سورة، آية، نص]
const ayahs = [null];
for (const s of quran) for (const v of s.verses) ayahs.push([s.id, v.id, v.text]);
if (ayahs.length !== 6237) throw new Error("عدد الآيات غير صحيح: " + (ayahs.length - 1));

// PageList فيها عنصر وهمي في البداية والنهاية: الصفحة p تبدأ عند PageList[p] وتنتهي قبل PageList[p+1]
const pages = [];
for (let p = 1; p <= 604; p++) {
  const page = [];
  for (let id = PageList[p]; id < PageList[p + 1]; id++) page.push(ayahs[id]);
  pages.push(page);
}

const pageOfAyah = (id) => {
  let lo = 1, hi = 604;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (PageList[mid] <= id) lo = mid; else hi = mid - 1;
  }
  return lo;
};

const surahs = quran.map((s) => {
  const firstId = ayahs.findIndex((a) => a && a[0] === s.id && a[1] === 1);
  return { n: s.id, name: s.name, ayahs: s.total_verses, type: s.type, page: pageOfAyah(firstId) };
});

const juz = [];
for (let j = 1; j <= 30; j++) juz.push(pageOfAyah(JuzList[j]));

// بداية كل حزب (60 حزبًا) = كل رابع ربع
const hizb = [];
for (let h = 0; h < 60; h++) {
  const [s, a] = findSurahAyahByAyahId(HizbQuarterList[h * 4 + 1]);
  hizb.push({ s, a, page: pageOfAyah(HizbQuarterList[h * 4 + 1]) });
}

writeFileSync("src/data/pages.json", JSON.stringify(pages));
// أول آية في كل صفحة [سورة، آية] لعنوان الصفحة
const pageStart = pages.map((pg) => [pg[0][0], pg[0][1]]);

writeFileSync("src/data/meta.json", JSON.stringify({ surahs, juz, hizb, pageStart }));
console.log("pages:", pages.length, "surahs:", surahs.length, "juz:", juz.join(","));
