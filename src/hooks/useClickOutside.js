import { useEffect } from "react";

/**
 * Calls `onClose` when a mousedown event fires outside of `ref`.
 * Only attaches the listener when `enabled` is true.
 */
export function useClickOutside(ref, enabled, onClose) {
  useEffect(() => {
    if (!enabled) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, enabled, onClose]);
}
