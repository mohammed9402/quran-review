import { useState } from "react";
import { surahs, juzPages, surahPages, range, ar, pagesLabel } from "../quran.js";

// اختيار المحفوظ بالأجزاء أو بالسور؛ selected مجموعة أرقام الصفحات
export default function MemorizedPicker({ selected, onChange }) {
  const [tab, setTab] = useState("juz");

  const toggle = (pages) => {
    const all = pages.every((p) => selected.has(p));
    const next = new Set(selected);
    pages.forEach((p) => (all ? next.delete(p) : next.add(p)));
    onChange(next);
  };

  const status = (pages) => {
    const n = pages.filter((p) => selected.has(p)).length;
    return n === 0 ? "" : n === pages.length ? "full" : "partial";
  };

  return (
    <div className="picker">
      <div className="segmented">
        <button className={tab === "juz" ? "active" : ""} onClick={() => setTab("juz")}>بالأجزاء</button>
        <button className={tab === "surah" ? "active" : ""} onClick={() => setTab("surah")}>بالسور</button>
      </div>
      <div className="picker-actions">
        <span className="muted">المحدد: {selected.size ? pagesLabel(selected.size) : "لا شيء"} من ٦٠٤</span>
        <button className="link" onClick={() => onChange(new Set(range(1, 604)))}>الكل</button>
        <button className="link" onClick={() => onChange(new Set())}>لا شيء</button>
      </div>
      {tab === "juz" ? (
        <div className="juz-grid">
          {range(1, 30).map((j) => {
            const pages = juzPages(j);
            return (
              <button key={j} className={"juz-cell " + status(pages)} onClick={() => toggle(pages)}>
                <small>الجزء</small>
                <b>{ar(j)}</b>
              </button>
            );
          })}
        </div>
      ) : (
        <ul className="surah-pick">
          {[...surahs].reverse().map((s) => {
            const pages = surahPages(s.n);
            const st = status(pages);
            return (
              <li key={s.n} className={st} onClick={() => toggle(pages)}>
                <span className="check">{st === "full" ? "✓" : st === "partial" ? "–" : ""}</span>
                <span className="num">{ar(s.n)}</span>
                <span className="grow">{s.name}</span>
                <span className="muted">{ar(pages.length)} ص</span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="hint">
        الأجزاء والسور تُحسب بالصفحات، فالصفحة المشتركة بين سورتين تُعدّ محفوظة إذا حددت إحداهما.
      </p>
    </div>
  );
}
