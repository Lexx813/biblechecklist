const STORAGE_KEY = "learn_progress_v1";
const EVENT_NAME = "learn-progress-changed";

export interface LearnProgress {
  completed: string[];
}

export function readLearnProgress(): LearnProgress {
  if (typeof window === "undefined") return { completed: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: [] };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.completed)) return { completed: parsed.completed };
    return { completed: [] };
  } catch {
    return { completed: [] };
  }
}

export function writeLearnProgress(p: LearnProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {}
}

export function subscribeLearnProgress(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}
