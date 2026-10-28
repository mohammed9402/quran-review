import { useEffect, useState } from "react";
import { useStore, setState } from "../store.js";
import { reviewPage, WEAK, GOOD, EXCELLENT } from "../schedule.js";
import { today } from "../date.js";
import { loadPages, pageTitle, juzOfPage, surahs, basmala, basmalaBefore, fontClass, quranFont } from "../quran.js";
import { useI18n, makeI18n } from "../i18n.js";

const HINT_WORDS = 2;
const arNum = makeI18n("ar").n;

// mode = "wird": مراجعة ورد اليوم، mode = "browse": تصفح المصحف
export default function Review({ nav, mode, pages, index = 0 }) {
  const state = useStore();
  const { t, n, arrows } = useI18n();
  const [data, setData] = useState(null);
  const [idx, setIdx] = useState(index);
  const [test, setTest] = useState(mode === "wird" && state.settings.testMode !== false);
  const [revealed, setRevealed] = useState(new Set());
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    loadPages().then(setData);
  }, []);

  const page = pages[idx];
  const day = today();
  const memorized = state.memorized.includes(page);
  const doneRating = state.today?.date === day ? state.today.done[page] : null;

  const go = (i) => {
    setIdx(i);
    setRevealed(new Set());
    setMarking(false);
    document.querySelector("main")?.scrollTo(0, 0);
  };

  const rate = (rating) => {
    setState((s) => reviewPage(s, page, rating, day));
    if (mode !== "wird") {
      if (idx < pages.length - 1) go(idx + 1);
      return;
    }
    // الانتقال لأول صفحة لم تُراجع بعد هذه الصفحة، ثم من البداية
    const done = state.today.done;
    const order = [...pages.slice(idx + 1), ...pages.slice(0, idx)];
    const next = order.find((p) => done[p] == null && p !== page);
    if (next == null) nav.back();
    else go(pages.indexOf(next));
  };

  const toggleTest = () => {
    setTest(!test);
    setRevealed(new Set());
    setState((s) => ({ ...s, settings: { ...s.settings, testMode: !test } }));
  };

  const ayahs = data ? data[page - 1] : [];
  const keyOf = (a) => a[0] + ":" + a[1];
  const nextHidden = ayahs.findIndex((a) => !revealed.has(keyOf(a)));

  const onAyah = (a) => {
    if (marking) setState((s) => toggleMistake(s, a, page, day));
    else if (test) {
      const next = new Set(revealed);
      next.has(keyOf(a)) ? next.delete(keyOf(a)) : next.add(keyOf(a));
      setRevealed(next);
    }
  };

  const RATINGS = [
    [WEAK, "weak"],
    [GOOD, "good"],
    [EXCELLENT, "excellent"],
  ];

  return (
    <div className="screen review">
      <header className="bar">
        <button className="icon" onClick={nav.back}>{arrows.back}</button>
        <div className="bar-title">
          <h2 className="ar-name">{pageTitle(page)}</h2>
          <span className="muted">
            {t("page_n", { n: page })} · {t("juz_n", { n: juzOfPage(page) })}
            {mode === "wird" && ` · ${n(idx + 1)}/${n(pages.length)}`}
          </span>
        </div>
        <div className="bar-tools">
          <button className={"tool " + (test ? "on" : "")} onClick={toggleTest}>
            {test ? t("test_mode") : t("read_mode")}
          </button>
          <button className={"tool " + (marking ? "on warn" : "")} onClick={() => setMarking(!marking)}>
            {t("mark_mistake")}
          </button>
        </div>
      </header>

      {marking && <div className="banner">{t("mark_banner")}</div>}

      <div className={"mushaf-page " + fontClass()} dir="rtl" lang="ar" style={{ fontSize: state.settings.fontSize }}>
        {!data && <p className="muted center">{t("loading")}</p>}
        {ayahs.map((a) => {
          const [s, num, text] = a;
          const key = keyOf(a);
          const hidden = test && !revealed.has(key);
          return (
            <span key={key}>
              {num === 1 && <SurahHeader n={s} />}
              <span
                className={"ayah" + (state.mistakes[key] ? " mistake" : "") + (hidden ? " hidden" : "")}
                onClick={() => onAyah(a)}
              >
                {hidden ? <Hidden text={text} /> : text}
                <AyahNumber n={num} />
              </span>
            </span>
          );
        })}
      </div>

      {test && data && nextHidden >= 0 && (
        <div className="reveal-row">
          <button className="ghost" onClick={() => setRevealed(new Set([...revealed, keyOf(ayahs[nextHidden])]))}>
            {t("reveal_next")}
          </button>
          <button className="link" onClick={() => setRevealed(new Set(ayahs.map(keyOf)))}>
            {t("reveal_all")}
          </button>
        </div>
      )}

      <footer className="review-footer">
        {memorized ? (
          <>
            <p className="muted center">{doneRating ? t("reviewed_today") : t("how_was")}</p>
            <div className="ratings">
              {RATINGS.map(([value, name]) => (
                <button key={name} className={`rate ${name}` + (doneRating === value ? " chosen" : "")} onClick={() => rate(value)}>
                  {t(name)}
                  <small>{t(name + "_sub")}</small>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="muted center">{t("not_memorized")}</p>
        )}
        <div className="pager">
          <button className="ghost" disabled={idx <= 0} onClick={() => go(idx - 1)}>
            {arrows.back} {t("prev_page")}
          </button>
          <button className="ghost" disabled={idx >= pages.length - 1} onClick={() => go(idx + 1)}>
            {t("next_page")} {arrows.forward}
          </button>
        </div>
      </footer>
    </div>
  );
}

// في خط المجمع تتحول الأرقام بعد المسافة غير المنكسرة إلى علامة آية مزخرفة كما في المصحف المطبوع
function AyahNumber({ n }) {
  if (quranFont() === "uthmani") return <span className="ayah-end">{"\u00a0" + arNum(n) + " "}</span>;
  return <span className="ayah-num"> ﴿{arNum(n)}﴾ </span>;
}

function SurahHeader({ n }) {
  return (
    <span className="surah-header">
      <span className="surah-name">سورة {surahs()[n - 1].name}</span>
      {basmalaBefore(n) && <span className="basmala">{basmala()}</span>}
    </span>
  );
}

// في وضع التسميع تظهر أول كلمتين فقط تذكيرًا ببداية الآية
function Hidden({ text }) {
  const words = text.split(" ");
  return (
    <>
      <span className="hint">{words.slice(0, HINT_WORDS).join(" ")}</span>
      {words.length > HINT_WORDS && <span className="mask"> …</span>}
    </>
  );
}

// تسجيل الخطأ: الضغطة الأولى في اليوم تزيد عدد مرات الخطأ، والثانية في اليوم نفسه تلغيها
function toggleMistake(state, [s, n], page, day) {
  const key = s + ":" + n;
  const old = state.mistakes[key];
  const mistakes = { ...state.mistakes };
  if (old && old.last === day) {
    if (old.count > 1) mistakes[key] = { ...old, count: old.count - 1, last: old.prev || old.last };
    else delete mistakes[key];
  } else {
    mistakes[key] = { page, count: (old?.count || 0) + 1, last: day, prev: old?.last || null };
  }
  return { ...state, mistakes };
}
