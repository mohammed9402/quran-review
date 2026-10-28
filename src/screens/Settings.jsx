import { useRef, useState } from "react";
import { useStore, setState, getState, initialState, normalize, saveNow } from "../store.js";
import { cycleDays, rebuildToday } from "../schedule.js";
import { today } from "../date.js";
import { scheduleReminder, exportBackup } from "../native.js";
import { ar, pagesLabel } from "../quran.js";
import DailyPicker from "./DailyPicker.jsx";

const pad = (n) => String(n).padStart(2, "0");

export default function Settings({ nav }) {
  const state = useStore();
  const { settings } = state;
  const fileRef = useRef();
  const [msg, setMsg] = useState("");

  const totalReviews = Object.values(state.history).reduce((a, b) => a + b, 0);
  const weak = state.memorized.filter((p) => state.cards[p]?.weakDue).length;

  const setDaily = (n) =>
    setState((s) => rebuildToday({ ...s, settings: { ...s.settings, dailyPages: n } }, today()));

  const setFont = (d) =>
    setState((s) => ({ ...s, settings: { ...s.settings, fontSize: Math.max(18, Math.min(44, s.settings.fontSize + d)) } }));

  const setReminder = async (patch) => {
    const reminder = { ...settings.reminder, ...patch };
    const ok = await scheduleReminder(reminder);
    if (!ok) {
      setMsg("لم يُسمح بالإشعارات. فعّلها من إعدادات الهاتف ثم حاول مرة أخرى.");
      reminder.enabled = false;
    } else setMsg("");
    setState((s) => ({ ...s, settings: { ...s.settings, reminder } }));
  };

  const doImport = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.memorized) || !data.cards) throw new Error();
      if (!confirm("ستُستبدل بياناتك الحالية بمحتوى النسخة الاحتياطية. متابعة؟")) return;
      setState(rebuildToday(normalize(data), today()));
      await saveNow();
      await scheduleReminder(getState().settings.reminder);
      setMsg("تمت استعادة النسخة الاحتياطية بنجاح");
    } catch {
      setMsg("الملف غير صالح");
    }
  };

  const reset = () => {
    if (!confirm("سيُحذف كل تقدمك وأخطاؤك المسجلة نهائيًا. هل أنت متأكد؟")) return;
    scheduleReminder({ enabled: false });
    setState(initialState);
  };

  return (
    <div className="screen">
      <header className="bar">
        <h2>المزيد</h2>
      </header>
      <div className="content">
        <section className="card">
          <h3>إحصاءات</h3>
          <div className="kv"><span>المحفوظ</span><b>{pagesLabel(state.memorized.length)} (≈ {ar(Math.round((state.memorized.length / 20) * 10) / 10)} جزء)</b></div>
          <div className="kv"><span>ختمة المراجعة</span><b>كل {ar(cycleDays(state))} يومًا</b></div>
          <div className="kv"><span>ختمات المراجعة المكتملة</span><b>{ar(state.cycle?.count || 0)}</b></div>
          <div className="kv"><span>صفحات قيد التثبيت</span><b>{ar(weak)}</b></div>
          <div className="kv"><span>مجموع الصفحات المراجَعة</span><b>{ar(totalReviews)}</b></div>
          <div className="kv"><span>أيام المراجعة</span><b>{ar(Object.keys(state.history).length)}</b></div>
        </section>

        <section className="card">
          <h3>المحفوظ</h3>
          <button className="ghost full" onClick={() => nav.push({ name: "picker" })}>تعديل الأجزاء والسور المحفوظة</button>
        </section>

        <section className="card">
          <h3>مقدار الورد اليومي</h3>
          <DailyPicker value={settings.dailyPages} onChange={setDaily} memorizedCount={state.memorized.length} />
        </section>

        <section className="card">
          <h3>حجم خط المصحف</h3>
          <div className="stepper">
            <button className="ghost" onClick={() => setFont(-2)}>أصغر</button>
            <span className="quran-text" style={{ fontSize: settings.fontSize }}>ٱلۡحَمۡدُ لِلَّهِ</span>
            <button className="ghost" onClick={() => setFont(2)}>أكبر</button>
          </div>
        </section>

        <section className="card">
          <h3>التذكير اليومي</h3>
          <label className="switch-row">
            <span>ذكّرني بالمراجعة كل يوم</span>
            <input type="checkbox" checked={settings.reminder.enabled} onChange={(e) => setReminder({ enabled: e.target.checked })} />
          </label>
          {settings.reminder.enabled && (
            <label className="switch-row">
              <span>وقت التذكير</span>
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
          <h3>النسخ الاحتياطي</h3>
          <p className="muted">بياناتك محفوظة على هاتفك فقط. احفظ نسخة احتياطية قبل تغيير الهاتف أو حذف التطبيق.</p>
          <div className="row">
            <button className="ghost" onClick={() => exportBackup(JSON.stringify(getState()))}>تصدير نسخة</button>
            <button className="ghost" onClick={() => fileRef.current.click()}>استعادة نسخة</button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={doImport} />
          </div>
        </section>

        {msg && <p className="note">{msg}</p>}

        <section className="card about">
          <h3>عن التطبيق</h3>
          <p>
            <b>رفيق المراجعة</b> — وقفٌ لله تعالى، لا إعلانات فيه ولا يجمع أي بيانات.
          </p>
          <p className="muted">
            نص المصحف: الرسم العثماني برواية حفص عن عاصم من موسوعة القرآن الكريم (QuranEnc). حدود الصفحات وفق مصحف المدينة النبوية.
          </p>
          <p className="muted">اللهم اجعله خالصًا لوجهك الكريم، وانفع به، واغفر لمن عمل فيه ولوالديه.</p>
          <p className="muted small">الإصدار {import.meta.env.VITE_APP_VERSION || "تجريبي"}</p>
        </section>

        <button className="link danger full" onClick={reset}>حذف كل البيانات والبدء من جديد</button>
      </div>
    </div>
  );
}
