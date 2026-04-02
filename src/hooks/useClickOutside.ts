import { useEffect, RefObject } from "react";

/**
 * Calls `onClose` when a mousedown event fires outside of `ref`.
 * Only attaches the listener when `enabled` is true.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  onClose: () => void
): void {
  useEffect(() => {
    if (!enabled) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, enabled, onClose]);
}
