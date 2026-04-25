import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { NOTE_TEMPLATES } from "../data/noteTemplates";

interface NoteTemplate {
  key: string;
  name: string;
  content: string;
  previewLines: string[];
}

interface Props {
  userId?: string;
  onSelect: (content: string) => void;
  onDismiss: () => void;
}

export default function NoteTemplatePicker({ onSelect, onDismiss }: Props) {
  const { t } = useTranslation();
  const [selectedKey, setSelectedKey] = useState("blank");

  function handleContinue() {
    const template = NOTE_TEMPLATES.find((t) => t.key === selectedKey) ?? NOTE_TEMPLATES[0];
    onSelect(template.content);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div
        className="w-full max-w-130 rounded-t-3xl p-6 shadow-2xl sm:rounded-2xl sm:p-7"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          animation: "ntpSlideUp 0.2s ease-out both",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Choose a note template"
      >
        {/* Header */}
        <h2 className="mb-1 text-center text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
          {t("noteTemplates.title", "Choose a Template")}
        </h2>
        <p className="mb-5 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
          {t("noteTemplates.subtitle", "Pick a structure to get started")}
        </p>

        {/* Template grid */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          {NOTE_TEMPLATES.map((template: NoteTemplate) => {
            const selected = selectedKey === template.key;
            return (
              <button
                key={template.key}
                onClick={() => setSelectedKey(template.key)}
                aria-pressed={selected}
                aria-label={template.name}
                className="relative min-h-27 rounded-xl p-4 text-left transition-all duration-150"
                style={{
                  background: selected
                    ? "color-mix(in srgb, var(--accent) 14%, var(--bg))"
                    : "var(--bg)",
                  border: selected
                    ? "2px solid var(--accent)"
                    : "2px solid var(--border)",
                  boxShadow: selected
                    ? "0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent)"
                    : "none",
                }}
              >
                <span className="mb-2 block text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>
                  {template.name}
                </span>
                <ul className="m-0 list-none p-0 space-y-0.5">
                  {template.previewLines.map((line, i) => (
                    <li key={i} className="truncate text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {line}
                    </li>
                  ))}
                  {template.previewLines.length === 0 && (
                    <li className="text-[11px] italic" style={{ color: "var(--text-muted)" }}>
                      Empty note
                    </li>
                  )}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleContinue}
            className="w-full rounded-xl py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--accent)", border: "none" }}
          >
            {t("noteTemplates.continue", "Continue →")}
          </button>
          <button
            onClick={() => onSelect("")}
            className="cursor-pointer border-none bg-transparent py-1 text-[13px] underline underline-offset-2 transition-colors hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            {t("noteTemplates.skip", "Skip: start blank")}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ntpSlideUp {
          from { transform: translateY(18px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-modal="true"] { animation: none !important; }
        }
      `}</style>
    </div>,
    document.body
  );
}
