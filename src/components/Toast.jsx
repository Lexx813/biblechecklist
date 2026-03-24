import { useState, useEffect } from "react";

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function handler(e) {
      const { message, type } = e.detail;
      const id = Date.now();
      setToasts(t => [...t, { id, message, type }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    }
    window.addEventListener("nwt-toast", handler);
    return () => window.removeEventListener("nwt-toast", handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      display: "flex", flexDirection: "column", gap: 8, zIndex: 9999, pointerEvents: "none",
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === "error" ? "rgba(220,38,38,0.92)" : "rgba(34,197,94,0.92)",
          color: "#fff", padding: "10px 20px", borderRadius: 10,
          fontSize: 13, fontWeight: 600, fontFamily: "Nunito, sans-serif",
          boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
          animation: "toast-in 0.2s ease-out",
          whiteSpace: "nowrap",
        }}>
          {t.message}
        </div>
      ))}
      <style>{`@keyframes toast-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
