import { RIWAYAT } from "../quran.js";
import { useI18n } from "../i18n.js";

export default function RiwayaPicker({ value, onChange }) {
  const { t, lang } = useI18n();
  return (
    <div className="options">
      {RIWAYAT.map((r) => (
        <button
          key={r.id}
          className={"option " + (value === r.id ? "active" : "")}
          disabled={r.disabled}
          onClick={() => onChange(r.id)}
        >
          <span className="radio" />
          <span className="grow">
            <b>{r.name[lang]}</b>
            {r.disabled && <small className="muted">{t("soon")} — {t("asbahani_note")}</small>}
          </span>
        </button>
      ))}
    </div>
  );
}
