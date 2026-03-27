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
  success: "✓",
  error:   "✕",
  info:    "ℹ",
  warning: "⚠",
};
