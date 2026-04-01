import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "../styles/celebration.css";

const CONFETTI_COLORS = ["#9B59B6", "#6A3DAA", "#C084FC", "#F59E0B", "#10B981", "#3B82F6", "#EC4899"];

function createConfetti(container) {
  for (let i = 0; i < 60; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]};
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      animation-delay: ${Math.random() * 0.6}s;
      animation-duration: ${1.2 + Math.random() * 0.8}s;
      border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
    `;
    container.appendChild(el);
  }
}

export default function BookCelebration({ bookName, bookIcon, chaptersCount, totalDoneBooks, onClose }) {
  const { t } = useTranslation();

  useEffect(() => {
    const container = document.querySelector(".celebrate-confetti");
    if (container) createConfetti(container);
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div className="celebrate-overlay" onClick={onClose}>
      <div className="celebrate-confetti" />
      <div className="celebrate-modal" onClick={e => e.stopPropagation()}>
        <div className="celebrate-icon">{bookIcon || <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>}</div>
        <h2 className="celebrate-title">{t("celebrate.title")}</h2>
        <p className="celebrate-book">{bookName}</p>
        <p className="celebrate-sub">
          {t("celebrate.chapters", { count: chaptersCount })}
          {" · "}
          {t("celebrate.booksTotal", { count: totalDoneBooks })}
        </p>
        <button className="celebrate-close" onClick={onClose}>{t("celebrate.continue")}</button>
      </div>
    </div>,
    document.body
  );
}
