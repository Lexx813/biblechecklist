import type { KeyboardEvent } from "react";

/**
 * Build an onKeyDown handler for a WAI-ARIA tablist with roving tabindex.
 *
 * ArrowLeft/ArrowRight move selection between tabs (wrapping), Home/End jump to
 * the first/last tab. The newly-selected tab is both activated (`onSelect`) and
 * focused, so keyboard users land on the tab they just moved to.
 *
 * @param keys     ordered list of tab keys/ids matching the rendered tabs
 * @param current  the currently-active tab key
 * @param onSelect called with the next tab key when navigation occurs
 */
export function makeTablistKeyHandler<K extends string>(
  keys: readonly K[],
  current: K,
  onSelect: (key: K) => void
) {
  return (e: KeyboardEvent<HTMLElement>) => {
    const idx = keys.indexOf(current);
    if (idx === -1) return;
    let nextIdx: number | null = null;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIdx = (idx + 1) % keys.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIdx = (idx - 1 + keys.length) % keys.length;
        break;
      case "Home":
        nextIdx = 0;
        break;
      case "End":
        nextIdx = keys.length - 1;
        break;
      default:
        return;
    }

    if (nextIdx === null) return;
    e.preventDefault();
    const nextKey = keys[nextIdx];
    onSelect(nextKey);

    // Move DOM focus to the newly-active tab. The tab elements carry
    // id={`<prefix>${key}`} — but since prefixes vary per widget we instead
    // focus via the tablist's own children by matching the role="tab" order.
    const tablist = e.currentTarget.closest('[role="tablist"]') ?? e.currentTarget;
    const tabEls = tablist.querySelectorAll<HTMLElement>('[role="tab"]');
    tabEls[nextIdx]?.focus();
  };
}
