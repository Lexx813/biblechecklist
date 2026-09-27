// Holds a friend-invite token from the /invite landing page until the visitor
// is signed in. localStorage (not sessionStorage) so it survives the Google
// OAuth round-trip and email-confirmation links that open in a new tab.

const KEY = "nwt:pending-invite";
const LEGACY_KEY = "invite_token"; // sessionStorage key used before 2026-09

export function storePendingInvite(token: string): void {
  try { localStorage.setItem(KEY, token); } catch { /* storage blocked */ }
}

export function getPendingInvite(): string | null {
  try {
    return localStorage.getItem(KEY) ?? sessionStorage.getItem(LEGACY_KEY);
  } catch {
    return null;
  }
}

export function clearPendingInvite(): void {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(LEGACY_KEY);
  } catch { /* storage blocked */ }
}
