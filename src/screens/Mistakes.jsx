import { useEffect, useState } from "react";
import { useStore, setState } from "../store.js";
import { loadPages, surahs, fontClass } from "../quran.js";
import { useI18n } from "../i18n.js";

export default function Mistakes({ nav }) {
  const state = useStore();
  const { t } = useI18n();
  const [data, setData] = useState(null);
  useEffect(() => {
    loadPages().then(setData);
  }, []);

  const items = Object.entries(state.mistakes)
    .map(([key, m]) => {
      const [s, num] = key.split(":").map(Number);
      return { key, s, num, ...m };
    })
    .sort((a, b) => b.count - a.count || a.page - b.page);

  const textOf = (it) => data?.[it.page - 1].find((a) => a[0] === it.s && a[1] === it.num)?.[2];
  const pages = [...new Set(items.map((i) => i.page))].sort((a, b) => a - b);

  const remove = (key) =>
    setState((st) => {
      const mistakes = { ...st.mistakes };
      delete mistakes[key];
      return { ...st, mistakes };
    });

  return (
    <div className="screen">
      <header className="bar">
        <h2>{t("mistakes_title")}</h2>
        {pages.length > 0 && (
          <button className="primary small" onClick={() => nav.push({ name: "review", mode: "browse", pages, index: 0 })}>
            {t("review_them")}
          </button>
        )}
      </header>
      <div className="content">
        {!items.length ? (
          <div className="empty">
            <p>{t("no_mistakes")}</p>
            <p className="muted">{t("no_mistakes_hint")}</p>
          </div>
        ) : (
          <ul className="mistakes">
            {items.map((it) => (
              <li key={it.key}>
                <div className="mistake-head">
                  <b>
                    <span className="ar-name">{surahs()[it.s - 1].name}</span> · {t("ayah_n", { n: it.num })}
                  </b>
                  <span className="badge">{t("times", { n: it.count })}</span>
                </div>
                <p className={"quran-text " + fontClass()} dir="rtl" lang="ar">{textOf(it) || "…"}</p>
                <div className="mistake-actions">
                  <button className="link" onClick={() => nav.push({ name: "review", mode: "browse", pages: [it.page], index: 0 })}>
                    {t("open_page", { n: it.page })}
                  </button>
                  <button className="link danger" onClick={() => remove(it.key)}>
                    {t("mastered")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
