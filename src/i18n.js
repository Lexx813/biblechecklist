import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import enTranslation from "../public/locales/en/translation.json";

// Add a new language here — one entry is all that's needed
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "tl", label: "Tagalog" },
  { code: "fr", label: "Français" },
  { code: "zh", label: "中文" },
];

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // English is bundled inline — no HTTP fetch needed for the majority of users.
    // Non-English languages still load on demand via HttpBackend.
    fallbackLng: "en",
    supportedLngs: LANGUAGES.map(l => l.code),
    interpolation: { escapeValue: false },
    partialBundledLanguages: true,
    resources: {
      en: { translation: enTranslation },
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "nwt-lang",
    },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
    },
  });

// Keep <html lang="..."> in sync so screen readers and crawlers see the correct language
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng.split("-")[0];
});

export default i18n;
