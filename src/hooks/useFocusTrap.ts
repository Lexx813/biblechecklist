import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

interface FocusTrapOptions {
  /** Called when the user presses Escape inside the trapped dialog. */
  onClose?: () => void;
}

/**
 * Focus-trap hook for modal dialogs.
 *
 * On mount it stores the currently-focused element, moves focus to the first
 * focusable element inside `ref` (falling back to the container itself), and
 * keeps Tab / Shift+Tab cycling within the dialog. Escape calls `onClose`.
 * On unmount, focus is restored to the previously-focused element.
 *
 * Works with createPortal: it queries within the live `ref` node, which lives
 * inside the portal, not the React tree position.
 */
export function useFocusTrap<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { onClose }: FocusTrapOptions = {}
): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const node = ref.current;
    if (!node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = (): HTMLElement[] =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        el => el.offsetParent !== null || el === document.activeElement
      );

    // Move focus inside the dialog on mount.
    const focusables = getFocusable();
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      if (!node.hasAttribute("tabindex")) node.setAttribute("tabindex", "-1");
      node.focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;

      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !node.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !node.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);
}
