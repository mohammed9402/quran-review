import { useEffect, useState } from "react";
import { useStore, setState } from "../store.js";
import { loadPages, surahs, ar } from "../quran.js";

export default function Mistakes({ nav }) {
  const state = useStore();
  const [data, setData] = useState(null);
  useEffect(() => {
    loadPages().then(setData);
  }, []);

  const items = Object.entries(state.mistakes)
    .map(([key, m]) => {
      const [s, n] = key.split(":").map(Number);
      return { key, s, n, ...m };
    })
    .sort((a, b) => b.count - a.count || a.page - b.page);

  const textOf = (it) => data?.[it.page - 1].find((a) => a[0] === it.s && a[1] === it.n)?.[2];
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
        <h2>مواضع الأخطاء</h2>
        {pages.length > 0 && (
          <button className="primary small" onClick={() => nav.push({ name: "review", mode: "browse", pages, index: 0 })}>
            راجعها
          </button>
        )}
      </header>
      <div className="content">
        {!items.length ? (
          <div className="empty">
            <p>لا توجد أخطاء مسجّلة بعد.</p>
            <p className="muted">أثناء المراجعة اضغط زر «✎ خطأ» ثم اضغط على الآية التي أخطأت فيها، لتجدها هنا وتركّز عليها.</p>
          </div>
        ) : (
          <ul className="mistakes">
            {items.map((it) => (
              <li key={it.key}>
                <div className="mistake-head">
                  <b>
                    {surahs[it.s - 1].name} · الآية {ar(it.n)}
                  </b>
                  <span className="badge">{ar(it.count)} {it.count === 1 ? "مرة" : "مرات"}</span>
                </div>
                <p className="quran-text">{textOf(it) || "…"}</p>
                <div className="mistake-actions">
                  <button className="link" onClick={() => nav.push({ name: "review", mode: "browse", pages: [it.page], index: 0 })}>
                    افتح الصفحة {ar(it.page)}
                  </button>
                  <button className="link danger" onClick={() => remove(it.key)}>
                    أتقنتها، احذفها
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
