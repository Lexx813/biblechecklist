import { useTranslation } from "react-i18next";

// Admin is English-only regardless of the viewer's UI language. `lng` pins
// the returned `t` to English (always loaded as the fallback language).
export function useAdminTranslation() {
  return useTranslation(undefined, { lng: "en" });
}
