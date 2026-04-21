import { useTranslation } from "react-i18next";

interface Props {
  showStreakPrompt: boolean;
  streakMilestone: number | null;
  streakCurrent: number;
  showNotifBanner: boolean;
  navigate: (page: string, params?: Record<string, any>) => void;
  onEnableNotif: () => void;
  onDismissNotif: () => void;
  onDismissStreak: () => void;
  updateProfilePending: boolean;
}

export default function HomeNotifBanners({
  showStreakPrompt, streakMilestone, streakCurrent,
  showNotifBanner, navigate,
  onEnableNotif, onDismissNotif, onDismissStreak, updateProfilePending,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      {showStreakPrompt && (
        <div className="home-notif-banner">
          <span className="home-notif-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
          </span>
          <div className="home-notif-text">
            <strong>{t("home.streakBannerTitle", "{{count}}-day streak!", { count: streakCurrent })}</strong>
            <span>{t("home.streakBannerSub", "Check out reading plans to keep the momentum going.")}</span>
          </div>
          <button className="home-notif-enable" onClick={() => { onDismissStreak(); navigate("readingPlans"); }}>
            {t("home.streakBannerCta", "View Plans")}
          </button>
          <button className="home-notif-dismiss" onClick={onDismissStreak} aria-label={t("common.dismiss", "Dismiss")}>{"\u2715"}</button>
        </div>
      )}

      {showNotifBanner && (
        <div className="home-notif-banner">
          <span className="home-notif-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
          </span>
          <div className="home-notif-text">
            <strong>{t("home.notifBannerTitle")}</strong>
            <span>{t("home.notifBannerSub")}</span>
          </div>
          <button className="home-notif-enable" onClick={onEnableNotif} disabled={updateProfilePending}>{t("home.notifEnable")}</button>
          <button className="home-notif-dismiss" onClick={onDismissNotif} aria-label={t("common.dismiss", "Dismiss")}>{"\u2715"}</button>
        </div>
      )}
    </>
  );
}
