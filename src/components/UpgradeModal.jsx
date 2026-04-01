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
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/></svg>, label: t("upm.feat.aiLabel"), desc: t("upm.feat.aiDesc") },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label: t("upm.feat.plansLabel"), desc: t("upm.feat.plansDesc") },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, label: t("upm.feat.notesLabel"), desc: t("upm.feat.notesDesc") },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label: t("upm.feat.dmLabel"), desc: t("upm.feat.dmDesc") },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: t("upm.feat.groupsLabel"), desc: t("upm.feat.groupsDesc") },
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
          <button className="upm-close" onClick={onClose} aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>

        {/* Feature list */}
        <ul className="upm-features">
          {FEATURES.map(f => (
            <li key={f.label} className="upm-feature">
              <span className="upm-feature-icon" style={{color:"#7c3aed"}}>{f.icon}</span>
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
            <li><span className="upm-cost-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></span><span>{t("upm.transparency.hosting")}</span></li>
            <li><span className="upm-cost-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg></span><span>{t("upm.transparency.db")}</span></li>
            <li><span className="upm-cost-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span><span>{t("upm.transparency.ai")}</span></li>
            <li><span className="upm-cost-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span><span>{t("upm.transparency.domain")}</span></li>
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
