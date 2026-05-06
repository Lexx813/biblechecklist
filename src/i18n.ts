import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import enTranslation from "./locales/en/translation.json";

// Add a new language here — one entry is all that's needed.
// Set `beta: true` for languages whose translations have not yet been
// reviewed by a native speaker (drives the in-app beta notice banner).
export const LANGUAGES: Array<{ code: string; label: string; beta?: boolean }> = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "tl", label: "Tagalog" },
  { code: "fr", label: "Français" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語", beta: true },
  { code: "ko", label: "한국어", beta: true },
  { code: "yo", label: "Yorùbá" },
  { code: "sw", label: "Kiswahili", beta: true },
  { code: "ha", label: "Hausa", beta: true },
  { code: "ar", label: "العربية", beta: true },
];

export const BETA_LANGS: readonly string[] = LANGUAGES.filter(l => l.beta).map(l => l.code);

const RTL_LANGS = new Set(["ar"]);

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // English is bundled inline — no HTTP fetch needed for the majority of users.
    // Non-English languages still load on demand via HttpBackend.
    initImmediate: false,
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

// Keep <html lang="..."> and dir in sync so screen readers, crawlers, and RTL layouts behave correctly
i18n.on("languageChanged", (lng) => {
  const code = lng.split("-")[0];
  document.documentElement.lang = code;
  document.documentElement.dir = RTL_LANGS.has(code) ? "rtl" : "ltr";
});

export default i18n;
