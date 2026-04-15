// src/components/NoteTemplatePicker.tsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { NOTE_TEMPLATES } from "../data/noteTemplates";
import "../styles/note-templates.css";

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

export default function NoteTemplatePicker({ userId, onSelect, onDismiss }: Props) {
  const { t } = useTranslation();
  const [selectedKey, setSelectedKey] = useState("blank");

  function handleCardClick(template: NoteTemplate) {
    setSelectedKey(template.key);
  }

  function handleContinue() {
    const template = NOTE_TEMPLATES.find((t) => t.key === selectedKey) ?? NOTE_TEMPLATES[0];
    onSelect(template.content);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="ntp-overlay"
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div className="ntp-sheet" role="dialog" aria-modal="true" aria-label="Choose a note template">
        <h2 className="ntp-title">
          {t("noteTemplates.title", "Choose a Template")}
        </h2>
        <p className="ntp-subtitle">
          {t("noteTemplates.subtitle", "Pick a structure to get started")}
        </p>

        <div className="ntp-grid">
          {NOTE_TEMPLATES.map((template) => {
            return (
              <button
                key={template.key}
                className={[
                  "ntp-card",
                  selectedKey === template.key ? "ntp-card--selected" : "",
                ].join(" ")}
                onClick={() => handleCardClick(template)}
                aria-pressed={selectedKey === template.key}
                aria-label={template.name}
              >
                <span className="ntp-card-name">
                  {template.name}
                </span>
                <ul className="ntp-card-preview" aria-hidden="true">
                  {template.previewLines.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                  {template.previewLines.length === 0 && (
                    <li style={{ fontStyle: "italic" }}>Empty note</li>
                  )}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="ntp-actions">
          <button className="ntp-continue-btn" onClick={handleContinue}>
            {t("noteTemplates.continue", "Continue →")}
          </button>
          <button className="ntp-skip-btn" onClick={() => onSelect("")}>
            {t("noteTemplates.skip", "Skip — start blank")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
