import { ar, pagesLabel } from "../quran.js";

const CHOICES = [1, 2, 3, 5, 10, 20, 40];

export default function DailyPicker({ value, onChange, memorizedCount }) {
  const cycle = memorizedCount ? Math.ceil(memorizedCount / value) : 0;
  return (
    <div>
      <div className="chips">
        {CHOICES.map((n) => (
          <button key={n} className={"chip " + (value === n ? "active" : "")} onClick={() => onChange(n)}>
            {ar(n)}
          </button>
        ))}
        <label className="chip custom">
          <input
            type="number"
            min="1"
            max="604"
            inputMode="numeric"
            placeholder="عدد آخر"
            value={CHOICES.includes(value) ? "" : value}
            onChange={(e) => {
              const n = Math.max(1, Math.min(604, parseInt(e.target.value) || 0));
              if (e.target.value) onChange(n);
            }}
          />
        </label>
      </div>
      <p className="muted center">
        {pagesLabel(value)} يوميًا
        {cycle > 0 && <> · تمرّ على كل محفوظك مرة كل {ar(cycle)} {cycle <= 10 && cycle > 2 ? "أيام" : "يومًا"} تقريبًا</>}
      </p>
    </div>
  );
}
