import { useTranslation } from "react-i18next";

const baseStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "60vh",
};

const fullscreenStyle: React.CSSProperties = {
  ...baseStyle,
  minHeight: "100dvh",
  background: "var(--bg, #0a0514)",
};

const spinnerStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "3px solid var(--border, rgba(124,58,237,0.18))",
  borderTopColor: "var(--violet-600, #7c3aed)",
  animation: "spin 0.7s linear infinite",
};

export default function LoadingSpinner({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const isFullscreen = className.includes("fullscreen");
  return (
    <div style={isFullscreen ? fullscreenStyle : baseStyle} role="status" aria-label={t("a11y.loading")}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={spinnerStyle} />
      <span className="sr-only">{t("a11y.loading")}</span>
    </div>
  );
}
