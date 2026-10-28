import { useStore, setState } from "../store.js";
import { addExtra, streak, toRanges, cycleProgress, WEAK, GOOD, EXCELLENT } from "../schedule.js";
import { today } from "../date.js";
import { pageTitle, juzOfPage, ar, pagesLabel } from "../quran.js";

const RATING_CLASS = { [WEAK]: "weak", [GOOD]: "good", [EXCELLENT]: "excellent" };

export default function Home({ nav }) {
  const state = useStore();
  const day = today();
  const t = state.today?.date === day ? state.today : null;

  if (!state.memorized.length) {
    return (
      <div className="screen">
        <div className="content empty">
          <p>لم تحدد محفوظك بعد.</p>
          <button className="primary" onClick={() => nav.push({ name: "picker" })}>حدّد المحفوظ</button>
        </div>
      </div>
    );
  }
  if (!t) return null;

  const all = [...t.pages, ...t.weak];
  const done = all.filter((p) => t.done[p] != null).length;
  const finished = done === all.length;
  const days = streak(state.history, day);
  const progress = cycleProgress(state);

  const start = (page) => nav.push({ name: "review", mode: "wird", pages: all, index: all.indexOf(page) });
  const firstUndone = all.find((p) => t.done[p] == null);

  const chips = (pages) => (
    <div className="page-chips">
      {pages.map((p) => (
        <button key={p} className={"page-chip " + (RATING_CLASS[t.done[p]] || "")} onClick={() => start(p)}>
          {ar(p)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="screen">
      <header className="hero">
        <p className="date">{new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p>
        <h1>ورد المراجعة</h1>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${all.length ? (done / all.length) * 100 : 0}%` }} />
        </div>
        <p className="progress-text">{finished ? "أتممت ورد اليوم، تقبّل الله منك" : `${ar(done)} من ${pagesLabel(all.length)}`}</p>
      </header>

      <div className="content">
        <section className="card">
          <h3>ورد اليوم</h3>
          {t.carried.length > 0 && <p className="note">بدأ وردك بما لم تراجعه في المرة السابقة ({pagesLabel(t.carried.length)}).</p>}
          {toRanges(t.pages).map(([a, b]) => (
            <div key={a} className="range">
              <div className="range-title">
                <b>{pageTitle(a)}</b>
                <span className="muted">
                  {a === b ? `صفحة ${ar(a)}` : `الصفحات ${ar(a)} – ${ar(b)}`} · الجزء {ar(juzOfPage(a))}
                </span>
              </div>
              {chips(Array.from({ length: b - a + 1 }, (_, i) => a + i))}
            </div>
          ))}
        </section>

        {t.weak.length > 0 && (
          <section className="card weak-card">
            <h3>صفحات للتثبيت</h3>
            <p className="muted small">قيّمتها «ضعيفة» في مراجعة سابقة، فأعدها اليوم حتى تثبت.</p>
            {chips(t.weak)}
          </section>
        )}

        {finished ? (
          <button className="primary big" onClick={() => setState((s) => addExtra(s, Math.min(5, s.settings.dailyPages)))}>
            زدني صفحات
          </button>
        ) : (
          <button className="primary big" onClick={() => start(firstUndone)}>
            {done ? "أكمل المراجعة" : "ابدأ المراجعة"}
          </button>
        )}

        <section className="card khatma">
          <div className="kv">
            <span>الختمة الحالية</span>
            <b>
              {ar(progress)} من {pagesLabel(state.memorized.length)}
            </b>
          </div>
          <div className="progress small-bar">
            <div className="progress-fill" style={{ width: `${(progress / state.memorized.length) * 100}%` }} />
          </div>
        </section>

        <section className="stats">
          <div>
            <b>{ar(days)}</b>
            <span>{days === 1 ? "يوم متتالٍ" : "أيام متتالية"}</span>
          </div>
          <div>
            <b>{ar(state.memorized.length)}</b>
            <span>صفحة محفوظة</span>
          </div>
          <div>
            <b>{ar(state.cycle?.count || 0)}</b>
            <span>ختمة مراجعة</span>
          </div>
        </section>
      </div>
    </div>
  );
}
