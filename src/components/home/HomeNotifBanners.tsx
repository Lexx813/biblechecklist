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

  // home-notif-banner-bg: a small CSS class in home.css owns the theme-conditional background
  // (dark vs light) since Tailwind variants can't target an ancestor [data-theme] attribute.
  const bannerCls =
    "home-notif-banner-bg fixed left-1/2 z-[300] -translate-x-1/2 flex items-center gap-3 rounded-xl border border-(--border) px-[18px] py-[14px] shadow-[var(--shadow-md)] max-w-[500px] w-[calc(100vw-48px)] backdrop-blur-md " +
    "[bottom:max(24px,calc(16px+env(safe-area-inset-bottom,0px)))]";
  const iconCls = "text-[20px] shrink-0 text-[#a78bfa]";
  const textCls = "flex-1 min-w-0 [&_strong]:block [&_strong]:text-sm [&_strong]:font-bold [&_strong]:text-(--text-primary) [&_span]:text-[13px] [&_span]:text-(--text-secondary)";
  const enableCls =
    "shrink-0 whitespace-nowrap rounded-md border-0 bg-linear-to-br from-[#7c3aed] to-[#6d28d9] px-3.5 py-1.5 text-[13px] font-semibold text-white cursor-pointer shadow-[0_2px_8px_rgba(124,58,237,0.35)] transition-all hover:brightness-110 hover:shadow-[0_4px_14px_rgba(124,58,237,0.5)] disabled:opacity-60 disabled:cursor-not-allowed";
  const dismissCls =
    "shrink-0 cursor-pointer border-0 bg-transparent p-1 text-base rounded text-(--text-muted) transition-colors hover:text-(--text-primary)";

  return (
    <>
      {showStreakPrompt && (
        <div className={bannerCls} role="status">
          <span className={iconCls}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
          </span>
          <div className={textCls}>
            <strong>{t("home.streakBannerTitle", "{{count}}-day streak!", { count: streakCurrent })}</strong>
            <span>{t("home.streakBannerSub", "Check out reading plans to keep the momentum going.")}</span>
          </div>
          <button className={enableCls} onClick={() => { onDismissStreak(); navigate("readingPlans"); }}>
            {t("home.streakBannerCta", "View Plans")}
          </button>
          <button className={dismissCls} onClick={onDismissStreak} aria-label={t("common.dismiss", "Dismiss")}>{"\u2715"}</button>
        </div>
      )}

      {showNotifBanner && (
        <div className={bannerCls} role="status">
          <span className={iconCls}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
          </span>
          <div className={textCls}>
            <strong>{t("home.notifBannerTitle")}</strong>
            <span>{t("home.notifBannerSub")}</span>
          </div>
          <button className={enableCls} onClick={onEnableNotif} disabled={updateProfilePending}>{t("home.notifEnable")}</button>
          <button className={dismissCls} onClick={onDismissNotif} aria-label={t("common.dismiss", "Dismiss")}>{"\u2715"}</button>
        </div>
      )}
    </>
  );
}
