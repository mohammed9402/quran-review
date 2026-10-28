import { useState } from "react";
import { useStore } from "../store.js";
import { surahs, juzStarts, range } from "../quran.js";
import { useI18n } from "../i18n.js";

const ALL_PAGES = range(1, 604);

export default function Mushaf({ nav }) {
  const state = useStore();
  const { t, n, lang } = useI18n();
  const [tab, setTab] = useState("surah");
  const [goto, setGoto] = useState("");
  const memorized = new Set(state.memorized);
  const open = (page) => nav.push({ name: "review", mode: "browse", pages: ALL_PAGES, index: page - 1 });

  return (
    <div className="screen">
      <header className="bar">
        <h2>{t("mushaf")}</h2>
        <form
          className="goto"
          onSubmit={(e) => {
            e.preventDefault();
            const p = parseInt(goto);
            if (p >= 1 && p <= 604) open(p);
          }}
        >
          <input type="number" inputMode="numeric" min="1" max="604" placeholder={t("page_number")} value={goto} onChange={(e) => setGoto(e.target.value)} />
          <button className="primary small">{t("go")}</button>
        </form>
      </header>
      <div className="content">
        <div className="segmented">
          <button className={tab === "surah" ? "active" : ""} onClick={() => setTab("surah")}>{t("surahs")}</button>
          <button className={tab === "juz" ? "active" : ""} onClick={() => setTab("juz")}>{t("juzs")}</button>
        </div>
        {tab === "surah" ? (
          <ul className="list">
            {surahs().map((s) => (
              <li key={s.n} onClick={() => open(s.page)}>
                <span className="num">{n(s.n)}</span>
                <span className="grow">
                  <b className="ar-name">{s.name}</b>
                  <small className="muted">
                    {lang !== "ar" && <>{s.tr} · </>}
                    {t(s.type === "meccan" ? "meccan" : "medinan")} · {t("ayahs_n", { n: s.ayahs })}
                  </small>
                </span>
                {memorized.has(s.page) && <span className="dot" />}
                <span className="muted">{t("p_short", { n: s.page })}</span>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="list">
            {juzStarts().map((p, i) => (
              <li key={i} onClick={() => open(p)}>
                <span className="num">{n(i + 1)}</span>
                <span className="grow">
                  <b>{t("juz_n", { n: i + 1 })}</b>
                </span>
                {memorized.has(p) && <span className="dot" />}
                <span className="muted">{t("p_short", { n: p })}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
