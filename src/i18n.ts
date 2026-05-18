import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

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
    // All languages — including English — load via HttpBackend from
    // /locales/{lng}/translation.json. Bundling en inline used to add
    // ~100KB gzip to the initial JS chunk; offloading to a parallel HTTP
    // request lets the browser fetch it alongside the JS chunks instead
    // of waiting for them. app/layout.tsx preloads the en JSON for first paint.
    fallbackLng: "en",
    // `load: "languageOnly"` strips region codes (pt-BR → pt) so the backend
    // never tries to fetch a 404'd /locales/pt-BR/translation.json before
    // falling back. We only ship base-code JSON files.
    load: "languageOnly",
    supportedLngs: LANGUAGES.map(l => l.code),
    // Don't fetch en when the user is on a non-en language — render
    // missing keys lazily once translations load.
    partialBundledLanguages: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "nwt-lang",
    },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
      requestOptions: { cache: "force-cache" },
    },
  });

// Keep <html lang="..."> and dir in sync so screen readers, crawlers, and RTL layouts behave correctly
i18n.on("languageChanged", (lng) => {
  const code = lng.split("-")[0];
  document.documentElement.lang = code;
  document.documentElement.dir = RTL_LANGS.has(code) ? "rtl" : "ltr";
});

export default i18n;
