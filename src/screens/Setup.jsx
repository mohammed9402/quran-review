import { useState } from "react";
import { setState, switchRiwaya, useStore } from "../store.js";
import { addMemorized, ensureToday } from "../schedule.js";
import { today } from "../date.js";
import { useI18n, LANGS } from "../i18n.js";
import MemorizedPicker from "./MemorizedPicker.jsx";
import DailyPicker from "./DailyPicker.jsx";
import RiwayaPicker from "./RiwayaPicker.jsx";

export default function Setup() {
  const state = useStore();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [daily, setDaily] = useState(5);

  const setLang = (lang) => setState((s) => ({ ...s, settings: { ...s.settings, lang } }));

  const finish = () => {
    const day = today();
    setState((s) => {
      let next = { ...s, settings: { ...s.settings, dailyPages: daily } };
      next = addMemorized(next, [...selected]);
      return ensureToday({ ...next, setupDone: true }, day);
    });
  };

  const footer = (prev, nextStep, disabled, label = t("next")) => (
    <div className="step-footer">
      <button className="ghost" onClick={() => setStep(prev)}>{t("back")}</button>
      <button className="primary" disabled={disabled} onClick={nextStep}>{label}</button>
    </div>
  );

  return (
    <div className="setup">
      {step === 0 && (
        <div className="welcome">
          <div className="segmented langs">
            {LANGS.map((l) => (
              <button key={l.code} className={state.settings.lang === l.code ? "active" : ""} onClick={() => setLang(l.code)}>
                {l.name}
              </button>
            ))}
          </div>
          <div className="logo">۞</div>
          <h1>{t("app_name")}</h1>
          <p className="lead">{t("tagline")}</p>
          <p className="waqf">{t("waqf")}</p>
          <button className="primary big" onClick={() => setStep(1)}>{t("start")}</button>
        </div>
      )}
      {step === 1 && (
        <div className="step">
          <h2>{t("setup_riwaya")}</h2>
          <p className="muted">{t("setup_riwaya_hint")}</p>
          <RiwayaPicker value={state.riwaya} onChange={(id) => setState((s) => switchRiwaya(s, id))} />
          {footer(0, () => setStep(2), false)}
        </div>
      )}
      {step === 2 && (
        <div className="step">
          <h2>{t("setup_what")}</h2>
          <p className="muted">{t("setup_what_hint")}</p>
          <MemorizedPicker selected={selected} onChange={setSelected} />
          {footer(1, () => setStep(3), !selected.size)}
        </div>
      )}
      {step === 3 && (
        <div className="step">
          <h2>{t("setup_daily")}</h2>
          <p className="muted">{t("setup_daily_hint")}</p>
          <DailyPicker value={daily} onChange={setDaily} memorizedCount={selected.size} />
          {footer(2, finish, false, t("setup_finish"))}
        </div>
      )}
    </div>
  );
}
