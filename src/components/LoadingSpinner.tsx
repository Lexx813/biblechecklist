const baseStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "60vh",
};

const fullscreenStyle: React.CSSProperties = {
  ...baseStyle,
  minHeight: "100vh",
  background: "var(--bg, #0a0514)",
};

const spinnerStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "3px solid rgba(255,255,255,0.15)",
  borderTopColor: "rgba(255,255,255,0.6)",
  animation: "spin 0.7s linear infinite",
};

export default function LoadingSpinner({ className = "" }: { className?: string }) {
  const isFullscreen = className.includes("fullscreen");
  return (
    <div style={isFullscreen ? fullscreenStyle : baseStyle} role="status" aria-label="Loading">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={spinnerStyle} />
    </div>
  );
}
