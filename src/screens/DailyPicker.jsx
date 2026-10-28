import { useI18n } from "../i18n.js";

const CHOICES = [1, 2, 3, 5, 10, 20, 40];

export default function DailyPicker({ value, onChange, memorizedCount }) {
  const { t, n, pages, days } = useI18n();
  const cycle = memorizedCount ? Math.ceil(memorizedCount / value) : 0;
  return (
    <div>
      <div className="chips">
        {CHOICES.map((c) => (
          <button key={c} className={"chip " + (value === c ? "active" : "")} onClick={() => onChange(c)}>
            {n(c)}
          </button>
        ))}
        <label className="chip custom">
          <input
            type="number"
            min="1"
            max="604"
            inputMode="numeric"
            placeholder={t("other_number")}
            value={CHOICES.includes(value) ? "" : value}
            onChange={(e) => {
              const v = Math.max(1, Math.min(604, parseInt(e.target.value) || 0));
              if (e.target.value) onChange(v);
            }}
          />
        </label>
      </div>
      <p className="muted center">
        {t("per_day", { pages: pages(value) })}
        {cycle > 0 && <> · {t("cycle_every", { days: days(cycle) })}</>}
      </p>
    </div>
  );
}
