import { useStore, setState } from "../store.js";
import { addExtra, streak, toRanges, cycleProgress, WEAK, GOOD, EXCELLENT } from "../schedule.js";
import { today } from "../date.js";
import { pageTitle, juzOfPage, riwayaName } from "../quran.js";
import { useI18n } from "../i18n.js";

const RATING_CLASS = { [WEAK]: "weak", [GOOD]: "good", [EXCELLENT]: "excellent" };

export default function Home({ nav }) {
  const state = useStore();
  const { t, n, pages: pagesLabel, locale, lang } = useI18n();
  const day = today();
  const tday = state.today?.date === day ? state.today : null;

  if (!state.memorized.length) {
    return (
      <div className="screen">
        <div className="content empty">
          <p className="muted">{riwayaName(state.riwaya, lang)}</p>
          <p>{t("no_memorized")}</p>
          <button className="primary" onClick={() => nav.push({ name: "picker" })}>{t("choose_memorized")}</button>
        </div>
      </div>
    );
  }
  if (!tday) return null;

  const all = [...tday.pages, ...tday.weak];
  const done = all.filter((p) => tday.done[p] != null).length;
  const finished = done === all.length;
  const days = streak(state.history, day);
  const progress = cycleProgress(state);

  const start = (page) => nav.push({ name: "review", mode: "wird", pages: all, index: all.indexOf(page) });
  const firstUndone = all.find((p) => tday.done[p] == null);

  const chips = (pages) => (
    <div className="page-chips">
      {pages.map((p) => (
        <button key={p} className={"page-chip " + (RATING_CLASS[tday.done[p]] || "")} onClick={() => start(p)}>
          {n(p)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="screen">
      <header className="hero">
        <p className="date">
          {new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
        </p>
        <h1>{t("wird_title")}</h1>
        <p className="hero-riwaya">{riwayaName(state.riwaya, lang)}</p>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${all.length ? (done / all.length) * 100 : 0}%` }} />
        </div>
        <p className="progress-text">{finished ? t("wird_finished") : t("done_of", { done, pages: pagesLabel(all.length) })}</p>
      </header>

      <div className="content">
        <section className="card">
          <h3>{t("wird_today")}</h3>
          {tday.carried.length > 0 && <p className="note">{t("carried", { pages: pagesLabel(tday.carried.length) })}</p>}
          {toRanges(tday.pages).map(([a, b]) => (
            <div key={a} className="range">
              <div className="range-title">
                <b className="ar-name">{pageTitle(a)}</b>
                <span className="muted">
                  {a === b ? t("page_n", { n: a }) : t("pages_range", { a, b })} · {t("juz_n", { n: juzOfPage(a) })}
                </span>
              </div>
              {chips(Array.from({ length: b - a + 1 }, (_, i) => a + i))}
            </div>
          ))}
        </section>

        {tday.weak.length > 0 && (
          <section className="card weak-card">
            <h3>{t("weak_title")}</h3>
            <p className="muted small">{t("weak_hint")}</p>
            {chips(tday.weak)}
          </section>
        )}

        {finished ? (
          <button className="primary big" onClick={() => setState((s) => addExtra(s, Math.min(5, s.settings.dailyPages)))}>
            {t("more_pages")}
          </button>
        ) : (
          <button className="primary big" onClick={() => start(firstUndone)}>
            {done ? t("continue_review") : t("start_review")}
          </button>
        )}

        <section className="card khatma">
          <div className="kv">
            <span>{t("khatma_current")}</span>
            <b>{t("of", { a: progress, b: pagesLabel(state.memorized.length) })}</b>
          </div>
          <div className="progress small-bar">
            <div className="progress-fill" style={{ width: `${(progress / state.memorized.length) * 100}%` }} />
          </div>
        </section>

        <section className="stats">
          <div>
            <b>{n(days)}</b>
            <span>{t("streak")}</span>
          </div>
          <div>
            <b>{n(state.memorized.length)}</b>
            <span>{t("memorized_pages")}</span>
          </div>
          <div>
            <b>{n(state.cycle?.count || 0)}</b>
            <span>{t("khatmas")}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
