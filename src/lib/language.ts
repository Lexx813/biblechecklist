import i18n from "../i18n";
import { supabase } from "./supabase";

/**
 * Change the UI language AND persist it to the user's profile.
 *
 * The i18next language detector already caches the choice in localStorage
 * (`nwt-lang`), but server-side features — the daily brief, email campaigns,
 * the daily-brief push reminder — read `profiles.preferred_language`. Without
 * this sync that column stays at its 'en' default forever, so those surfaces
 * always render in English regardless of what the user picked.
 *
 * Safe to call when logged out: the profile update is skipped if there's no
 * session, and any failure is swallowed (language still changes locally).
 */
export async function setLanguage(code: string): Promise<void> {
  i18n.changeLanguage(code);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase
      .from("profiles")
      .update({ preferred_language: code })
      .eq("id", session.user.id);
  } catch {
    /* non-critical — local language already changed */
  }
}
