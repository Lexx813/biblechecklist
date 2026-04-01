import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "../../styles/progress-share.css";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function draw(canvas, stats, t) {
  const dpr = window.devicePixelRatio || 1;
  const W = 540, H = 820;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#120829");
  bg.addColorStop(0.55, "#341C5C");
  bg.addColorStop(1, "#6A3DAA");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Decorative blobs
  ctx.beginPath();
  ctx.arc(W - 60, 60, 140, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(192,132,252,0.07)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(60, H - 80, 180, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(106,61,170,0.12)";
  ctx.fill();

  // Brand
  ctx.font = "600 14px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "left";
  ctx.fillText("📖  NWT Progress", 40, 52);

  // Name / headline
  const headline = stats.name
    ? `${stats.name}'s ${t("share.journeyLabel")}`
    : t("share.myJourney");
  ctx.font = "700 24px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.textAlign = "left";
  ctx.fillText(headline, 40, 98);

  // Big percentage
  ctx.font = "800 108px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#C084FC";
  ctx.textAlign = "center";
  ctx.fillText(stats.pct + "%", W / 2, 250);

  ctx.font = "500 18px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText(t("share.ofBibleRead"), W / 2, 285);

  // Progress bar
  const bX = 50, bY = 318, bW = W - 100, bH = 10;
  roundRect(ctx, bX, bY, bW, bH, 5);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fill();

  const filled = bW * (parseFloat(stats.pct) / 100);
  const barGrad = ctx.createLinearGradient(bX, 0, bX + bW, 0);
  barGrad.addColorStop(0, "#9B59B6");
  barGrad.addColorStop(1, "#C084FC");
  roundRect(ctx, bX, bY, Math.max(filled, 5), bH, 5);
  ctx.fillStyle = barGrad;
  ctx.fill();

  // Stat cards (2x2 grid)
  const cards = [
    { label: t("share.booksRead"),    value: `${stats.doneBooks}/66` },
    { label: t("share.chaptersRead"), value: `${stats.doneCh}/${stats.totalCh}` },
    { label: t("share.hebrew"),       value: `${stats.otDone}/39` },
    { label: t("share.greek"),        value: `${stats.ntDone}/27` },
  ];

  const colW = (W - 100) / 2;
  const colGap = 20;

  cards.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 40 + col * (colW + colGap);
    const y = 358 + row * 110;

    roundRect(ctx, x, y, colW, 92, 14);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.13)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "800 32px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(card.value, x + colW / 2, y + 50);

    ctx.font = "500 11px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(card.label.toUpperCase(), x + colW / 2, y + 74);
  });

  // Streak row
  if (stats.streak > 0) {
    roundRect(ctx, 40, 596, W - 80, 56, 12);
    ctx.fillStyle = "rgba(234,88,12,0.15)";
    ctx.fill();
    ctx.strokeStyle = "rgba(234,88,12,0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "700 20px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#fb923c";
    ctx.textAlign = "center";
    ctx.fillText(`🔥 ${stats.streak}-day reading streak`, W / 2, 631);
  }

  // Divider
  ctx.beginPath();
  ctx.moveTo(50, stats.streak > 0 ? 668 : 600);
  ctx.lineTo(W - 50, stats.streak > 0 ? 668 : 600);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Motivational text
  let motiveLine = t("share.motiveLine0");
  const p = parseFloat(stats.pct);
  if (p >= 100) motiveLine = t("share.motiveLine100");
  else if (p >= 75) motiveLine = t("share.motiveLine75");
  else if (p >= 50) motiveLine = t("share.motiveLine50");
  else if (p >= 25) motiveLine = t("share.motiveLine25");

  ctx.font = "600 17px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.textAlign = "center";
  ctx.fillText(motiveLine, W / 2, stats.streak > 0 ? 714 : 648);

  // Date + CTA
  const today = new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  ctx.font = "400 13px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillText(today, W / 2, H - 42);

  // Signup link
  ctx.font = "600 12px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(192,132,252,0.6)";
  ctx.fillText("nwtprogress.com", W / 2, H - 18);
}

export default function ProgressShare({ stats, onClose }) {
  const canvasRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (canvasRef.current) draw(canvasRef.current, stats, t);
  }, [stats, t]);

  const download = () => {
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image/png");
    a.download = "bible-progress.png";
    a.click();
  };

  const webShare = async () => {
    if (!navigator.share || !navigator.canShare) return download();
    try {
      const blob = await new Promise(res => canvasRef.current.toBlob(res, "image/png"));
      const file = new File([blob], "bible-progress.png", { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Bible Reading Progress", text: `I've read ${stats.pct}% of the Bible on NWT Progress! Track yours at nwtprogress.com` });
      } else {
        download();
      }
    } catch { download(); }
  };

  return createPortal(
    <div className="share-overlay" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <div className="share-modal-header">
          <span className="share-modal-title">{t("share.title")}</span>
          <button className="share-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="share-canvas-wrap">
          <canvas ref={canvasRef} className="share-canvas" />
        </div>
        <div className="share-modal-actions">
          {"share" in navigator ? (
            <button className="share-download-btn" onClick={webShare}>
              ↗ {t("share.shareBtn")}
            </button>
          ) : null}
          <button className="share-download-btn" onClick={download} style={{ background: "rgba(255,255,255,0.08)" }}>
            ⬇ {t("share.download")}
          </button>
          <p className="share-hint">{t("share.hint")}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
