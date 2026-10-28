import { useState } from "react";
import { useStore } from "../store.js";
import { surahs, juz, range, ar } from "../quran.js";

const ALL_PAGES = range(1, 604);

export default function Mushaf({ nav }) {
  const state = useStore();
  const [tab, setTab] = useState("surah");
  const [goto, setGoto] = useState("");
  const memorized = new Set(state.memorized);
  const open = (page) => nav.push({ name: "review", mode: "browse", pages: ALL_PAGES, index: page - 1 });

  return (
    <div className="screen">
      <header className="bar">
        <h2>المصحف</h2>
        <form
          className="goto"
          onSubmit={(e) => {
            e.preventDefault();
            const p = parseInt(goto);
            if (p >= 1 && p <= 604) open(p);
          }}
        >
          <input type="number" inputMode="numeric" min="1" max="604" placeholder="رقم الصفحة" value={goto} onChange={(e) => setGoto(e.target.value)} />
          <button className="primary small">اذهب</button>
        </form>
      </header>
      <div className="content">
        <div className="segmented">
          <button className={tab === "surah" ? "active" : ""} onClick={() => setTab("surah")}>السور</button>
          <button className={tab === "juz" ? "active" : ""} onClick={() => setTab("juz")}>الأجزاء</button>
        </div>
        {tab === "surah" ? (
          <ul className="list">
            {surahs.map((s) => (
              <li key={s.n} onClick={() => open(s.page)}>
                <span className="num">{ar(s.n)}</span>
                <span className="grow">
                  <b>{s.name}</b>
                  <small className="muted">
                    {s.type === "meccan" ? "مكية" : "مدنية"} · {ar(s.ayahs)} آية
                  </small>
                </span>
                {memorized.has(s.page) && <span className="dot" title="محفوظة" />}
                <span className="muted">ص {ar(s.page)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="list">
            {juz.map((p, i) => (
              <li key={i} onClick={() => open(p)}>
                <span className="num">{ar(i + 1)}</span>
                <span className="grow">
                  <b>الجزء {ar(i + 1)}</b>
                </span>
                {memorized.has(p) && <span className="dot" />}
                <span className="muted">ص {ar(p)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
