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

// ── Group invite links: /groups/<id>?join=<code> ─────────────────────────────

const GROUP_KEY = "nwt:pending-group-invite";

// Stashes ?join=<code> and strips it from the address bar so the code isn't
// left in screenshots or re-shared by accident. Returns the code, if any.
export function captureGroupInviteFromUrl(): string | null {
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("join");
    if (!code || !/^[0-9a-f]{32}$/i.test(code)) return null;
    localStorage.setItem(GROUP_KEY, code);
    url.searchParams.delete("join");
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
    return code;
  } catch {
    return null;
  }
}

export function getPendingGroupInvite(): string | null {
  try { return localStorage.getItem(GROUP_KEY); } catch { return null; }
}

export function clearPendingGroupInvite(): void {
  try { localStorage.removeItem(GROUP_KEY); } catch { /* storage blocked */ }
}
