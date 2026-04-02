// @ts-nocheck
import { useState, useEffect } from "react";
import "../styles/toast.css";

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function handler(e) {
      const { message, type } = e.detail;
      const id = Date.now() + Math.random();
      setToasts(t => [...t, { id, message, type }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
    }
    window.addEventListener("nwt-toast", handler);
    return () => window.removeEventListener("nwt-toast", handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type || "success"}`}>
          <span className="toast-icon">{ICONS[t.type] ?? ICONS.success}</span>
          <span className="toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

const ICONS = {
  success: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>,
  error:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  info:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  warning: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};
