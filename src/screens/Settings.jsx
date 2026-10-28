import { useRef, useState } from "react";
import { useStore, setState, getState, initialState, normalize, saveNow, switchRiwaya } from "../store.js";
import { cycleDays, rebuildToday, ensureToday } from "../schedule.js";
import { today } from "../date.js";
import { scheduleReminder, exportBackup } from "../native.js";
import { checkForUpdate, currentVersion } from "../updates.js";
import { riwayaName, fontClass } from "../quran.js";
import { useI18n, makeI18n, LANGS } from "../i18n.js";
import DailyPicker from "./DailyPicker.jsx";
import RiwayaPicker from "./RiwayaPicker.jsx";

const pad = (x) => String(x).padStart(2, "0");
const THEMES = ["light", "dark", "auto"];

const reminderText = (lang) => {
  const { t } = makeI18n(lang);
  return { title: t("notif_title"), body: t("notif_body") };
};

export default function Settings({ nav }) {
  const state = useStore();
  const { settings } = state;
  const { t, n, pages, days, lang } = useI18n();
  const fileRef = useRef();
  const [msg, setMsg] = useState("");
  const [updateMsg, setUpdateMsg] = useState("");

  const checkNow = async () => {
    setUpdateMsg(t("checking"));
    const r = await checkForUpdate({ force: true });
    setUpdateMsg(r === "error" ? t("update_error") : r ? t("update_available", { v: r.version }) : t("up_to_date"));
  };

  const totalReviews = Object.values(state.history).reduce((a, b) => a + b, 0);
  const weak = state.memorized.filter((p) => state.cards[p]?.weakDue).length;
  const setSetting = (patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  const setLang = (code) => {
    setSetting({ lang: code });
    // نص التذكير يُعاد جدولته باللغة الجديدة
    if (settings.reminder.enabled) scheduleReminder(settings.reminder, reminderText(code));
  };

  const setRiwaya = (id) => {
    const hadProfile = state.profiles[id]?.memorized?.length;
    setState((s) => {
      const next = switchRiwaya(s, id);
      return next.memorized.length ? ensureToday(next, today()) : next;
    });
    setMsg(hadProfile ? "" : t("riwaya_switched", { name: riwayaName(id, lang) }));
  };

  const setDaily = (v) => setState((s) => rebuildToday({ ...s, settings: { ...s.settings, dailyPages: v } }, today()));
  const setFont = (d) => setSetting({ fontSize: Math.max(18, Math.min(44, settings.fontSize + d)) });

  const setReminder = async (patch) => {
    const reminder = { ...settings.reminder, ...patch };
    const ok = await scheduleReminder(reminder, reminderText(lang));
    if (!ok) {
      setMsg(t("reminder_denied"));
      reminder.enabled = false;
    } else setMsg("");
    setSetting({ reminder });
  };

  const doImport = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.memorized) || !data.cards) throw new Error();
      if (!confirm(t("import_confirm"))) return;
      setState(rebuildToday(normalize(data), today()));
      await saveNow();
      const s = getState();
      await scheduleReminder(s.settings.reminder, reminderText(s.settings.lang));
      setMsg(t("import_ok"));
    } catch {
      setMsg(t("import_bad"));
    }
  };

  const reset = () => {
    if (!confirm(t("reset_confirm"))) return;
    scheduleReminder({ enabled: false });
    setState({ ...initialState, settings: { ...initialState.settings, lang: settings.lang, theme: settings.theme } });
  };

  return (
    <div className="screen">
      <header className="bar">
        <h2>{t("more")}</h2>
      </header>
      <div className="content">
        <section className="card">
          <h3>{t("stats")}</h3>
          <div className="kv"><span>{t("riwaya")}</span><b>{riwayaName(state.riwaya, lang)}</b></div>
          <div className="kv"><span>{t("stat_memorized")}</span><b>{pages(state.memorized.length)}</b></div>
          <div className="kv"><span>{t("stat_cycle")}</span><b>{t("stat_cycle_val", { days: days(cycleDays(state)) })}</b></div>
          <div className="kv"><span>{t("stat_khatmas")}</span><b>{n(state.cycle?.count || 0)}</b></div>
          <div className="kv"><span>{t("stat_weak")}</span><b>{n(weak)}</b></div>
          <div className="kv"><span>{t("stat_total")}</span><b>{n(totalReviews)}</b></div>
          <div className="kv"><span>{t("stat_days")}</span><b>{n(Object.keys(state.history).length)}</b></div>
        </section>

        <section className="card">
          <h3>{t("appearance")}</h3>
          <div className="segmented">
            {THEMES.map((th) => (
              <button key={th} className={settings.theme === th ? "active" : ""} onClick={() => setSetting({ theme: th })}>
                {t("theme_" + th)}
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>{t("language")}</h3>
          <div className="segmented">
            {LANGS.map((l) => (
              <button key={l.code} className={lang === l.code ? "active" : ""} onClick={() => setLang(l.code)}>
                {l.name}
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>{t("riwaya")}</h3>
          <RiwayaPicker value={state.riwaya} onChange={setRiwaya} />
        </section>

        {msg && <p className="note">{msg}</p>}

        <section className="card">
          <h3>{t("memorized")}</h3>
          <button className="ghost full" onClick={() => nav.push({ name: "picker" })}>{t("edit_memorized")}</button>
          <button className="primary full gap" onClick={() => nav.push({ name: "newplan" })}>{t("new_plan_btn")}</button>
        </section>

        <section className="card">
          <h3>{t("daily_amount")}</h3>
          <DailyPicker value={settings.dailyPages} onChange={setDaily} memorizedCount={state.memorized.length} />
        </section>

        <section className="card">
          <h3>{t("quran_font")}</h3>
          <div className="segmented">
            {["uthmani", "amiri"].map((f) => (
              <button key={f} className={settings.quranFont === f ? "active" : ""} onClick={() => setSetting({ quranFont: f })}>
                {t("font_" + f)}
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>{t("font_size")}</h3>
          <div className="stepper">
            <button className="ghost" onClick={() => setFont(-2)}>{t("smaller")}</button>
            <span className={"quran-text " + fontClass()} dir="rtl" style={{ fontSize: settings.fontSize }}>
              {state.riwaya === "warsh" ? "اِ۬لْحَمْدُ لِلهِ" : "ٱلۡحَمۡدُ لِلَّهِ"}
            </span>
            <button className="ghost" onClick={() => setFont(2)}>{t("bigger")}</button>
          </div>
        </section>

        <section className="card">
          <h3>{t("reminder")}</h3>
          <label className="switch-row">
            <span>{t("reminder_on")}</span>
            <input type="checkbox" checked={settings.reminder.enabled} onChange={(e) => setReminder({ enabled: e.target.checked })} />
          </label>
          {settings.reminder.enabled && (
            <label className="switch-row">
              <span>{t("reminder_time")}</span>
              <input
                type="time"
                value={`${pad(settings.reminder.hour)}:${pad(settings.reminder.minute)}`}
                onChange={(e) => {
                  const [hour, minute] = e.target.value.split(":").map(Number);
                  if (!isNaN(hour)) setReminder({ hour, minute });
                }}
              />
            </label>
          )}
        </section>

        <section className="card">
          <h3>{t("backup")}</h3>
          <p className="muted">{t("backup_hint")}</p>
          <div className="row">
            <button className="ghost" onClick={() => exportBackup(JSON.stringify(getState()))}>{t("export")}</button>
            <button className="ghost" onClick={() => fileRef.current.click()}>{t("import")}</button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={doImport} />
          </div>
        </section>

        <section className="card">
          <h3>{t("updates")}</h3>
          <label className="switch-row">
            <span>{t("check_updates_auto")}</span>
            <input type="checkbox" checked={settings.checkUpdates} onChange={(e) => setSetting({ checkUpdates: e.target.checked })} />
          </label>
          <button className="ghost full" onClick={checkNow}>{t("check_now")}</button>
          {updateMsg && <p className="muted small center gap">{updateMsg}</p>}
          {state.update && updateMsg === t("update_available", { v: state.update.version }) && (
            <a className="primary full center gap" href={state.update.url} target="_blank" rel="noreferrer">{t("update_download")}</a>
          )}
        </section>

        <section className="card about">
          <h3>{t("about")}</h3>
          <p>
            <b>{t("app_name")}</b> — {t("about_text")}
          </p>
          <p className="muted small">
            <b>{t("about_sources")}:</b> {t("source_hafs")} {t("source_warsh")}
          </p>
          <p className="muted">{t("dua")}</p>
          <p className="muted small">{t("version", { v: currentVersion })}</p>
          <button className="ghost full" onClick={() => nav.push({ name: "developer" })}>{t("developer")}</button>
        </section>

        <button className="link danger full" onClick={reset}>{t("reset")}</button>
      </div>
    </div>
  );
}
