import { useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useClickOutside } from "../hooks/useClickOutside";
import "../styles/upgrade-modal.css";

export default function UpgradeModal({ onClose, onSubscribe, loading }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  useClickOutside(ref, true, onClose);

  const FEATURES = [
    { icon: "✨", label: t("upm.feat.aiLabel"), desc: t("upm.feat.aiDesc") },
    { icon: "📅", label: t("upm.feat.plansLabel"), desc: t("upm.feat.plansDesc") },
    { icon: "📝", label: t("upm.feat.notesLabel"), desc: t("upm.feat.notesDesc") },
    { icon: "💬", label: t("upm.feat.dmLabel"), desc: t("upm.feat.dmDesc") },
    { icon: "👥", label: t("upm.feat.groupsLabel"), desc: t("upm.feat.groupsDesc") },
  ];

  return createPortal(
    <div className="upm-overlay" role="dialog" aria-modal="true" aria-labelledby="upm-title">
      <div className="upm-modal" ref={ref}>
        {/* Header */}
        <div className="upm-header">
          <div className="upm-badge">{t("upm.badge")}</div>
          <h2 className="upm-title" id="upm-title">{t("upm.title")}</h2>
          <p className="upm-price">
            <span className="upm-amount">$3</span>
            <span className="upm-period">&nbsp;{t("upm.period")}</span>
          </p>
          <button className="upm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Feature list */}
        <ul className="upm-features">
          {FEATURES.map(f => (
            <li key={f.label} className="upm-feature">
              <span className="upm-feature-icon">{f.icon}</span>
              <div>
                <span className="upm-feature-label">{f.label}</span>
                <span className="upm-feature-desc">{f.desc}</span>
              </div>
            </li>
          ))}
        </ul>

        {/* Transparency */}
        <div className="upm-transparency">
          <p className="upm-transparency-heading">{t("upm.transparency.heading")}</p>
          <ul className="upm-cost-list">
            <li><span className="upm-cost-icon">🖥️</span><span>{t("upm.transparency.hosting")}</span></li>
            <li><span className="upm-cost-icon">🗄️</span><span>{t("upm.transparency.db")}</span></li>
            <li><span className="upm-cost-icon">✨</span><span>{t("upm.transparency.ai")}</span></li>
            <li><span className="upm-cost-icon">🌐</span><span>{t("upm.transparency.domain")}</span></li>
          </ul>
          <p className="upm-transparency-surplus">{t("upm.transparency.surplus")}</p>
          <p className="upm-hardship">
            {t("upm.transparency.hardship")}{" "}
            <a href="mailto:luaq777@gmail.com" className="upm-hardship-link">{t("upm.transparency.hardshipLink")}</a>
            {t("upm.transparency.hardshipSuffix")}
          </p>
        </div>

        {/* CTA */}
        <div className="upm-footer">
          <button className="upm-cta" onClick={onSubscribe} disabled={loading}>
            {loading ? t("upm.ctaLoading") : t("upm.cta")}
          </button>
          <p className="upm-note">{t("upm.note")}</p>
          <button className="upm-cancel" onClick={onClose}>{t("upm.cancel")}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
