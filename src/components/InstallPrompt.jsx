import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("nwt-install-dismissed") === "1"
  );

  useEffect(() => {
    function handler(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  function handleInstall() {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
  }

  function handleDismiss() {
    localStorage.setItem("nwt-install-dismissed", "1");
    setDismissed(true);
  }

  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
      background: "rgba(30, 13, 60, 0.97)", border: "1px solid rgba(138,75,255,0.35)",
      borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center",
      gap: 12, zIndex: 1000, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      fontFamily: "Nunito, sans-serif", maxWidth: "calc(100vw - 32px)", width: 360,
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>📖</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f0eaff" }}>{t("install.title")}</div>
        <div style={{ fontSize: 12, color: "rgba(240,234,255,0.55)", marginTop: 2 }}>{t("install.subtitle")}</div>
      </div>
      <button
        onClick={handleInstall}
        style={{
          background: "linear-gradient(135deg, #7c3aed, #5b21b6)", border: "none",
          color: "#fff", borderRadius: 8, padding: "7px 14px", fontSize: 12,
          fontWeight: 700, cursor: "pointer", flexShrink: 0, fontFamily: "inherit",
        }}
      >
        {t("install.install")}
      </button>
      <button
        onClick={handleDismiss}
        style={{
          background: "none", border: "none", color: "rgba(240,234,255,0.4)",
          cursor: "pointer", fontSize: 16, padding: "4px", flexShrink: 0, lineHeight: 1,
        }}
        aria-label={t("install.dismiss")}
      >
        ✕
      </button>
    </div>
  );
}
