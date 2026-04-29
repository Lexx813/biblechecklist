import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { referralApi } from "../api/referral";
import "../styles/referral.css";

interface Referral {
  id: string;
  status: string;
  profiles?: { display_name?: string };
}

interface Props {
  userId: string;
}

export default function ReferralPanel({ userId }: Props) {
  const { t } = useTranslation();
  const [code, setCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    async function load() {
      try {
        const [c, r] = await Promise.all([
          referralApi.getMyCode(userId),
          referralApi.getMyReferrals(userId),
        ]);
        setCode(c);
        setReferrals(r as any);
      } catch (err) {
        console.error("Referral load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const shareUrl = code ? `https://jwstudy.org?ref=${code}` : "";

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(t("referral.shareWhatsAppText", { url: shareUrl }))}`,
      "_blank"
    );
  }

  if (loading) return <div className="ref-loading">{t("referral.loading")}</div>;

  return (
    <div className="ref-panel">
      <div className="ref-header">
        <span className="ref-icon">🎁</span>
        <h3 className="ref-title">{t("referral.inviteFriends")}</h3>
        <p className="ref-desc">{t("referral.shareDesc")}</p>
      </div>

      <div className="ref-link-box">
        <input className="ref-link-input" value={shareUrl} readOnly onClick={copyLink} aria-label={t("referral.referralLinkAria")} />
        <button className="ref-copy-btn" onClick={copyLink}>
          {copied ? t("referral.copied") : t("referral.copy")}
        </button>
      </div>

      <div className="ref-share-row">
        <button className="ref-share-btn ref-share-btn--wa" onClick={shareWhatsApp}>
          {t("referral.whatsapp")}
        </button>
        <button className="ref-share-btn ref-share-btn--x" onClick={() => {
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(t("referral.tweetText", { url: shareUrl }))}`,
            "_blank"
          );
        }}>
          {t("referral.shareOnX")}
        </button>
      </div>

      {referrals.length > 0 && (
        <div className="ref-list">
          <h4 className="ref-list-title">{t("referral.yourReferrals", { count: referrals.length })}</h4>
          {referrals.map(r => (
            <div key={r.id} className="ref-item">
              <span className="ref-item-name">{r.profiles?.display_name || t("referral.user")}</span>
              <span className={`ref-item-status ref-item-status--${r.status}`}>
                {r.status === "converted" ? t("referral.subscribed") : r.status === "rewarded" ? t("referral.rewarded") : t("referral.signedUp")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
