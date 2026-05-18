import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface Props {
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  label: string;
}

interface Section {
  title: string;
  items: Shortcut[];
}

export default function KeyboardShortcutsModal({ onClose }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sections: Section[] = [
    {
      title: t("shortcuts.section.global", "Global"),
      items: [
        { keys: ["?"], label: t("shortcuts.help", "Show this help") },
        { keys: ["⌘", "K"], label: t("shortcuts.search", "Search and jump anywhere") },
        { keys: ["Esc"], label: t("shortcuts.close", "Close any modal or panel") },
      ],
    },
    {
      title: t("shortcuts.section.navigate", "Quick navigate"),
      items: [
        { keys: ["g", "h"], label: t("shortcuts.goHome", "Home") },
        { keys: ["g", "b"], label: t("shortcuts.goBooks", "Bible reading tracker") },
        { keys: ["g", "q"], label: t("shortcuts.goQuiz", "Bible quiz") },
        { keys: ["g", "n"], label: t("shortcuts.goNotes", "Study notes") },
        { keys: ["g", "m"], label: t("shortcuts.goMeeting", "Meeting prep") },
      ],
    },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="w-full max-w-md rounded-md border border-(--border) bg-(--card-bg) shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-(--border) px-5 py-4">
          <h2 id="shortcuts-title" className="text-base font-bold text-(--text-primary)">
            {t("shortcuts.title", "Keyboard shortcuts")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close", "Close")}
            className="flex size-11 items-center justify-center rounded-md text-(--text-muted) transition-colors hover:bg-violet-50 hover:text-(--text-primary) [html[data-theme=dark]_&]:hover:bg-violet-600/10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">
          {sections.map((section) => (
            <section key={section.title} className="mb-4 last:mb-0">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-(--text-muted)">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {section.items.map((s) => (
                  <li key={s.label} className="flex items-center justify-between gap-3 py-1">
                    <span className="text-sm text-(--text-primary)">{s.label}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {s.keys.map((k, i) => (
                        <kbd
                          key={i}
                          className="inline-flex h-6 min-w-6 items-center justify-center rounded-sm border border-(--border) bg-(--bg) px-1.5 font-mono text-[11px] font-semibold text-(--text-secondary) shadow-[0_1px_0_var(--border)]"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
