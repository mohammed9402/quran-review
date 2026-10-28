import { useState } from "react";
import { useStore, setState } from "../store.js";
import { startNewPlan } from "../schedule.js";
import { today } from "../date.js";
import { surahs, surahPages } from "../quran.js";
import { useI18n } from "../i18n.js";
import MemorizedPicker from "./MemorizedPicker.jsx";
import DailyPicker from "./DailyPicker.jsx";

// خطوات قصيرة: المحفوظ ← مقدار الورد ← نقطة البداية
export default function NewPlan({ nav }) {
  const state = useStore();
  const { t, n, pages, arrows, lang } = useI18n();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(new Set(state.memorized));
  const [daily, setDaily] = useState(state.settings.dailyPages);
  const [startPage, setStartPage] = useState(null);

  const mem = [...selected].sort((a, b) => a - b);
  // السور التي فيها صفحات محفوظة، لاختيار البداية منها
  const startSurahs = surahs().filter((s) => surahPages(s.n).some((p) => selected.has(p)));
  const start = startPage ?? mem[0];

  const finish = () => {
    setState((s) => startNewPlan(s, { memorized: mem, dailyPages: daily, startPage: start }, today()));
    nav.tab("home");
  };

  return (
    <div className="screen">
      <header className="bar">
        <button className="icon" onClick={() => (step ? setStep(step - 1) : nav.back())}>{arrows.back}</button>
        <h2>{t("new_plan")}</h2>
        <span className="muted">{n(step + 1)}/{n(3)}</span>
      </header>
      <div className="content">
        {step === 0 && (
          <>
            <h3>{t("setup_what")}</h3>
            <MemorizedPicker selected={selected} onChange={setSelected} />
            <button className="primary big" disabled={!selected.size} onClick={() => setStep(1)}>{t("next")}</button>
          </>
        )}
        {step === 1 && (
          <>
            <h3>{t("setup_daily")}</h3>
            <DailyPicker value={daily} onChange={setDaily} memorizedCount={selected.size} />
            <button className="primary big" onClick={() => setStep(2)}>{t("next")}</button>
          </>
        )}
        {step === 2 && (
          <>
            <h3>{t("plan_start")}</h3>
            <p className="muted">{t("plan_start_hint")}</p>
            <ul className="list start-list">
              {startSurahs.map((s) => {
                const first = surahPages(s.n).find((p) => selected.has(p));
                return (
                  <li key={s.n} className={start === first ? "chosen" : ""} onClick={() => setStartPage(first)}>
                    <span className="num">{n(s.n)}</span>
                    <span className="grow">
                      <b className="ar-name">{s.name}</b>
                      {lang !== "ar" && <small className="muted">{s.tr}</small>}
                    </span>
                    <span className="muted">{t("p_short", { n: first })}</span>
                  </li>
                );
              })}
            </ul>
            <p className="note">{t("plan_summary", { pages: pages(daily), page: start })}</p>
            <p className="muted small">{t("plan_keeps")}</p>
            <button className="primary big" onClick={finish}>{t("plan_begin")}</button>
          </>
        )}
      </div>
    </div>
  );
}
