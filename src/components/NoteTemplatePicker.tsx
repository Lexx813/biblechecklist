// @ts-nocheck
// src/components/NoteTemplatePicker.jsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { NOTE_TEMPLATES } from "../data/noteTemplates";
import { useSubscription } from "../hooks/useSubscription";
import "../styles/note-templates.css";

export default function NoteTemplatePicker({ userId, onSelect, onDismiss, onUpgrade }) {
  const { t } = useTranslation();
  const { isPremium } = useSubscription(userId);
  const [selectedKey, setSelectedKey] = useState("blank");

  function handleCardClick(template) {
    if (template.isPremium && !isPremium) {
      onUpgrade?.();
      return;
    }
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
            const locked = template.isPremium && !isPremium;
            return (
              <button
                key={template.key}
                className={[
                  "ntp-card",
                  selectedKey === template.key ? "ntp-card--selected" : "",
                  locked ? "ntp-card--locked" : "",
                ].join(" ")}
                onClick={() => handleCardClick(template)}
                aria-pressed={selectedKey === template.key}
                aria-label={`${template.name}${locked ? " (Premium)" : ""}`}
              >
                {template.isPremium && (
                  <span className="ntp-premium-badge" aria-hidden="true">✦</span>
                )}
                <span className="ntp-card-name">
                  {template.name}
                  {locked && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  )}
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
