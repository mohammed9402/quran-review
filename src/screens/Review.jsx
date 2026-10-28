import { useEffect, useState } from "react";
import { useStore, setState } from "../store.js";
import { reviewPage, WEAK, GOOD, EXCELLENT } from "../schedule.js";
import { today } from "../date.js";
import { loadPages, pageTitle, juzOfPage, surahs, ar } from "../quran.js";

const BASMALA = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ";
const HINT_WORDS = 2;

// mode = "wird": مراجعة ورد اليوم، mode = "browse": تصفح المصحف
export default function Review({ nav, mode, pages, index = 0 }) {
  const state = useStore();
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
    const t = state.today;
    // الانتقال لأول صفحة لم تُراجع بعد هذه الصفحة، ثم من البداية
    const order = [...pages.slice(idx + 1), ...pages.slice(0, idx)];
    const next = order.find((p) => t.done[p] == null && p !== page);
    if (next == null) nav.back();
    else go(pages.indexOf(next));
  };

  const toggleTest = () => {
    setTest(!test);
    setRevealed(new Set());
    setState((s) => ({ ...s, settings: { ...s.settings, testMode: !test } }));
  };

  const ayahs = data ? data[page - 1] : [];
  const nextHidden = ayahs.findIndex((a) => !revealed.has(a[0] + ":" + a[1]));

  const onAyah = (a) => {
    const key = a[0] + ":" + a[1];
    if (marking) {
      setState((s) => toggleMistake(s, a, page, day));
    } else if (test) {
      const next = new Set(revealed);
      next.has(key) ? next.delete(key) : next.add(key);
      setRevealed(next);
    }
  };

  return (
    <div className="screen review">
      <header className="bar">
        <button className="icon" onClick={nav.back}>→</button>
        <div className="bar-title">
          <h2>{pageTitle(page)}</h2>
          <span className="muted">
            صفحة {ar(page)} · الجزء {ar(juzOfPage(page))}
            {mode === "wird" && ` · ${ar(idx + 1)}/${ar(pages.length)}`}
          </span>
        </div>
        <div className="bar-tools">
          <button className={"tool " + (test ? "on" : "")} onClick={toggleTest}>
            {test ? "تسميع" : "قراءة"}
          </button>
          <button className={"tool " + (marking ? "on warn" : "")} onClick={() => setMarking(!marking)}>
            ✎ خطأ
          </button>
        </div>
      </header>

      {marking && <div className="banner">اضغط على الآية التي أخطأت فيها لتسجيلها، واضغط مرة أخرى للإلغاء</div>}

      <div className="mushaf-page" style={{ fontSize: state.settings.fontSize }}>
        {!data && <p className="muted center">جارٍ التحميل…</p>}
        {ayahs.map((a) => {
          const [s, n, text] = a;
          const key = s + ":" + n;
          const hidden = test && !revealed.has(key);
          const mistake = state.mistakes[key];
          return (
            <span key={key}>
              {n === 1 && <SurahHeader n={s} />}
              <span className={"ayah" + (mistake ? " mistake" : "") + (hidden ? " hidden" : "")} onClick={() => onAyah(a)}>
                {hidden ? <Hidden text={text} /> : text}
                <span className="ayah-num"> ﴿{ar(n)}﴾ </span>
              </span>
            </span>
          );
        })}
      </div>

      {test && data && nextHidden >= 0 && (
        <div className="reveal-row">
          <button className="ghost" onClick={() => setRevealed(new Set([...revealed, ayahs[nextHidden][0] + ":" + ayahs[nextHidden][1]]))}>
            أظهر الآية التالية
          </button>
          <button className="link" onClick={() => setRevealed(new Set(ayahs.map((a) => a[0] + ":" + a[1])))}>
            أظهر الكل
          </button>
        </div>
      )}

      <footer className="review-footer">
        {memorized ? (
          <>
            <p className="muted center">
              {doneRating ? "راجعتها اليوم — يمكنك تغيير التقييم" : "كيف كانت مراجعتك لهذه الصفحة؟"}
            </p>
            <div className="ratings">
              <button className={"rate weak" + (doneRating === WEAK ? " chosen" : "")} onClick={() => rate(WEAK)}>
                ضعيفة<small>تُعاد غدًا</small>
              </button>
              <button className={"rate good" + (doneRating === GOOD ? " chosen" : "")} onClick={() => rate(GOOD)}>
                جيدة<small>مع الختمة</small>
              </button>
              <button className={"rate excellent" + (doneRating === EXCELLENT ? " chosen" : "")} onClick={() => rate(EXCELLENT)}>
                متقنة<small>مع الختمة</small>
              </button>
            </div>
          </>
        ) : (
          <p className="muted center">هذه الصفحة ليست ضمن محفوظك</p>
        )}
        <div className="pager">
          <button className="ghost" disabled={idx <= 0} onClick={() => go(idx - 1)}>
            → السابقة
          </button>
          <button className="ghost" disabled={idx >= pages.length - 1} onClick={() => go(idx + 1)}>
            التالية ←
          </button>
        </div>
      </footer>
    </div>
  );
}

function SurahHeader({ n }) {
  return (
    <span className="surah-header">
      <span className="surah-name">سورة {surahs[n - 1].name}</span>
      {n !== 1 && n !== 9 && <span className="basmala">{BASMALA}</span>}
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
