import { useState, useEffect, useRef } from "react";
import { EMOJI_CATEGORIES } from "../lib/emojiData";
import "../styles/emoji-picker.css";

/**
 * A floating emoji picker popup.
 * Position it with a wrapping element that has `position: relative`.
 *
 * Props:
 *   onSelect(emoji: string) — called when user picks an emoji
 *   onClose()               — called when user clicks outside
 *   align                   — "left" | "right" (default "left")
 */

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  align?: "left" | "right";
}

export default function EmojiPickerPopup({ onSelect, onClose, align = "left" }: Props) {
  const [tab, setTab] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className={`ep-popup ep-popup--${align}`} ref={ref}>
      <div className="ep-tabs">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={i}
            type="button"
            className={`ep-tab${tab === i ? " ep-tab--active" : ""}`}
            onMouseDown={e => { e.preventDefault(); setTab(i); }}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="ep-grid">
        {EMOJI_CATEGORIES[tab].emojis.map(em => (
          <button
            key={em}
            type="button"
            className="ep-btn"
            onMouseDown={e => { e.preventDefault(); onSelect(em); }}
          >
            {em}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Utility: insert emoji into a textarea/input at cursor position.
 * Returns the new value.
 */
export function insertEmojiAtCursor(el: HTMLTextAreaElement | HTMLInputElement | null, currentValue: string, emoji: string): string {
  if (!el) return currentValue + emoji;
  const start = el.selectionStart ?? currentValue.length;
  const end = el.selectionEnd ?? currentValue.length;
  return currentValue.slice(0, start) + emoji + currentValue.slice(end);
}
