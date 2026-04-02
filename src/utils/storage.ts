const STORAGE_KEY = "nwt_bible_checklist_v2";

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function saveState(s: Record<string, unknown>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}
