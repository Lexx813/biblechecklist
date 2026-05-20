import { useEffect } from "react";

/**
 * Lock body scroll while a modal/sheet is open. Without this, iOS Safari
 * lets the underlying page scroll through the backdrop the moment the user
 * touch-drags inside the modal — and the scroll position has shifted by the
 * time they dismiss it. Restores the previous `overflow` on cleanup so we
 * don't trample a parent that already set it.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}
