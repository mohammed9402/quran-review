import { useState } from "react";
import { setState } from "../store.js";
import { addMemorized, ensureToday } from "../schedule.js";
import { today } from "../date.js";
import MemorizedPicker from "./MemorizedPicker.jsx";
import DailyPicker from "./DailyPicker.jsx";

export default function Setup() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [daily, setDaily] = useState(5);

  const finish = () => {
    const day = today();
    setState((s) => {
      let next = { ...s, settings: { ...s.settings, dailyPages: daily } };
      next = addMemorized(next, [...selected]);
      next = ensureToday({ ...next, setupDone: true }, day);
      return next;
    });
  };

  return (
    <div className="setup">
      {step === 0 && (
        <div className="welcome">
          <div className="logo">۞</div>
          <h1>رفيق المراجعة</h1>
          <p className="lead">تطبيق يعينك على تثبيت حفظك للقرآن الكريم بورد مراجعة يومي منظَّم.</p>
          <p className="waqf">وقفٌ لله تعالى — نسأل الله أن يجعله صدقة جارية</p>
          <button className="primary big" onClick={() => setStep(1)}>ابدأ</button>
        </div>
      )}
      {step === 1 && (
        <div className="step">
          <h2>ما الذي تحفظه؟</h2>
          <p className="muted">حدّد الأجزاء أو السور التي تحفظها، ويمكنك تعديلها لاحقًا.</p>
          <MemorizedPicker selected={selected} onChange={setSelected} />
          <div className="step-footer">
            <button className="ghost" onClick={() => setStep(0)}>رجوع</button>
            <button className="primary" disabled={!selected.size} onClick={() => setStep(2)}>التالي</button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="step">
          <h2>كم صفحة تراجع يوميًا؟</h2>
          <p className="muted">اختر مقدارًا تستطيع المداومة عليه، فأحبّ الأعمال إلى الله أدومها وإن قلّ.</p>
          <DailyPicker value={daily} onChange={setDaily} memorizedCount={selected.size} />
          <div className="step-footer">
            <button className="ghost" onClick={() => setStep(1)}>رجوع</button>
            <button className="primary" onClick={finish}>توكلت على الله</button>
          </div>
        </div>
      )}
    </div>
  );
}
