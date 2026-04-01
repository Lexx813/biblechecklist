import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { referralApi } from "../api/referral";
import "../styles/referral.css";

export default function ReferralPanel({ userId }) {
  const { t } = useTranslation();
  const [code, setCode] = useState(null);
  const [referrals, setReferrals] = useState([]);
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
        setReferrals(r);
      } catch (err) {
        console.error("Referral load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const shareUrl = code ? `https://nwtprogress.com?ref=${code}` : "";

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Track your Bible reading progress with me on NWT Progress! ${shareUrl}`)}`,
      "_blank"
    );
  }

  if (loading) return <div className="ref-loading">Loading...</div>;

  return (
    <div className="ref-panel">
      <div className="ref-header">
        <span className="ref-icon">🎁</span>
        <h3 className="ref-title">Invite Friends</h3>
        <p className="ref-desc">Share your link and study together. When they sign up, they'll be linked to your profile.</p>
      </div>

      <div className="ref-link-box">
        <input className="ref-link-input" value={shareUrl} readOnly onClick={copyLink} />
        <button className="ref-copy-btn" onClick={copyLink}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="ref-share-row">
        <button className="ref-share-btn ref-share-btn--wa" onClick={shareWhatsApp}>
          WhatsApp
        </button>
        <button className="ref-share-btn ref-share-btn--x" onClick={() => {
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm tracking my Bible reading on NWT Progress — join me! ${shareUrl}`)}`,
            "_blank"
          );
        }}>
          Share on X
        </button>
      </div>

      {referrals.length > 0 && (
        <div className="ref-list">
          <h4 className="ref-list-title">Your Referrals ({referrals.length})</h4>
          {referrals.map(r => (
            <div key={r.id} className="ref-item">
              <span className="ref-item-name">{r.profiles?.display_name || "User"}</span>
              <span className={`ref-item-status ref-item-status--${r.status}`}>
                {r.status === "converted" ? "Subscribed" : r.status === "rewarded" ? "Rewarded" : "Signed up"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
