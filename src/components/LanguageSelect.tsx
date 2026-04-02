// @ts-nocheck
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../i18n";
import CustomSelect from "./CustomSelect";

export default function LanguageSelect({ style }) {
  const { i18n } = useTranslation();
  const current = LANGUAGES.find(l => i18n.language?.split("-")[0]?.startsWith(l.code))?.code ?? "en";

  return (
    <div style={style}>
      <CustomSelect
        value={current}
        onChange={val => i18n.changeLanguage(val)}
        options={LANGUAGES.map(l => ({ value: l.code, label: l.label }))}
      />
    </div>
  );
}
