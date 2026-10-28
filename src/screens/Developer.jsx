import { DEVELOPER } from "../developer.js";
import { useI18n } from "../i18n.js";

const ICONS = { email: "✉", whatsapp: "☏", phone: "☏", telegram: "✈", website: "🌐", facebook: "f", x: "𝕏", instagram: "◎" };

function linkOf({ type, value }) {
  switch (type) {
    case "email":
      return `mailto:${value}`;
    case "whatsapp":
      return `https://wa.me/${value.replace(/[^\d]/g, "")}`;
    case "phone":
      return `tel:${value.replace(/\s/g, "")}`;
    case "telegram":
      return `https://t.me/${value.replace(/^@/, "")}`;
    default:
      return value;
  }
}

export default function Developer({ nav }) {
  const { t, lang, arrows } = useI18n();
  const bio = DEVELOPER.bio[lang] || DEVELOPER.bio.ar;
  return (
    <div className="screen">
      <header className="bar">
        <button className="icon" onClick={nav.back}>{arrows.back}</button>
        <h2>{t("developer")}</h2>
      </header>
      <div className="content">
        <section className="card dev-card">
          <div className="logo">۞</div>
          {DEVELOPER.name && <h2>{DEVELOPER.name}</h2>}
          {bio && <p className="muted">{bio}</p>}
          <p className="small">{t("dev_message")}</p>
        </section>
        <section className="card">
          <h3>{t("contact")}</h3>
          <ul className="contacts">
            {DEVELOPER.contacts.map((c) => (
              <li key={c.type + c.value}>
                <a href={linkOf(c)} target="_blank" rel="noreferrer">
                  <span className="contact-icon">{ICONS[c.type] || "•"}</span>
                  <span dir="ltr">{c.value}</span>
                </a>
              </li>
            ))}
            <li>
              <a href={DEVELOPER.repo + "/issues"} target="_blank" rel="noreferrer">
                <span className="contact-icon">⌥</span>
                <span>{t("source_code")} — GitHub</span>
              </a>
            </li>
          </ul>
        </section>
        <p className="muted center small">{t("dua")}</p>
      </div>
    </div>
  );
}
