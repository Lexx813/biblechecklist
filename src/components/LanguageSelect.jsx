import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../i18n";

export default function LanguageSelect({ style }) {
  const { i18n } = useTranslation();
  const current = i18n.language.split("-")[0];

  return (
    <select
      className="lang-select"
      value={LANGUAGES.find(l => current.startsWith(l.code))?.code ?? "en"}
      onChange={e => i18n.changeLanguage(e.target.value)}
      aria-label="Select language"
      style={style}
    >
      {LANGUAGES.map(l => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}
