import { useState } from "react";
import { surahs, juzPages, surahPages, range } from "../quran.js";
import { useI18n } from "../i18n.js";

// اختيار المحفوظ بالأجزاء أو بالسور؛ selected مجموعة أرقام الصفحات
export default function MemorizedPicker({ selected, onChange }) {
  const { t, n, pages: pagesLabel, lang } = useI18n();
  const [tab, setTab] = useState("juz");

  const toggle = (pages) => {
    const all = pages.every((p) => selected.has(p));
    const next = new Set(selected);
    pages.forEach((p) => (all ? next.delete(p) : next.add(p)));
    onChange(next);
  };

  const status = (pages) => {
    const count = pages.filter((p) => selected.has(p)).length;
    return count === 0 ? "" : count === pages.length ? "full" : "partial";
  };

  return (
    <div className="picker">
      <div className="segmented">
        <button className={tab === "juz" ? "active" : ""} onClick={() => setTab("juz")}>{t("by_juz")}</button>
        <button className={tab === "surah" ? "active" : ""} onClick={() => setTab("surah")}>{t("by_surah")}</button>
      </div>
      <div className="picker-actions">
        <span className="muted">
          {selected.size ? t("selected", { pages: pagesLabel(selected.size), total: 604 }) : t("selected_none")}
        </span>
        <button className="link" onClick={() => onChange(new Set(range(1, 604)))}>{t("all")}</button>
        <button className="link" onClick={() => onChange(new Set())}>{t("none")}</button>
      </div>
      {tab === "juz" ? (
        <div className="juz-grid">
          {range(1, 30).map((j) => {
            const pages = juzPages(j);
            return (
              <button key={j} className={"juz-cell " + status(pages)} onClick={() => toggle(pages)}>
                <small>{t("juz")}</small>
                <b>{n(j)}</b>
              </button>
            );
          })}
        </div>
      ) : (
        <ul className="surah-pick">
          {[...surahs()].reverse().map((s) => {
            const pages = surahPages(s.n);
            const st = status(pages);
            return (
              <li key={s.n} className={st} onClick={() => toggle(pages)}>
                <span className="check">{st === "full" ? "✓" : st === "partial" ? "–" : ""}</span>
                <span className="num">{n(s.n)}</span>
                <span className="grow">
                  <span className="ar-name">{s.name}</span>
                  {lang !== "ar" && <small className="muted">{s.tr}</small>}
                </span>
                <span className="muted">{pagesLabel(pages.length)}</span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="hint">{t("picker_hint")}</p>
    </div>
  );
}
