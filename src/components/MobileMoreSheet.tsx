import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useFullProfile } from "../hooks/useAdmin";
import { useFriendRequests } from "../hooks/useFriends";

type SpaItem = { kind: "spa"; key: string; labelKey: string; icon: ReactNode; badge?: number };
type LinkItem = { kind: "link"; href: string; labelKey: string; fallbackLabel: string; icon: ReactNode };
type MoreItem = SpaItem | LinkItem;
type Section = { title: string; items: MoreItem[] };

const backdropClassName =
  "fixed inset-0 z-[220] flex items-end justify-center bg-black/50";

const sheetClassName =
  "flex max-h-[min(86dvh,720px)] w-full max-w-[560px] flex-col overflow-y-auto rounded-t-lg bg-[var(--card-bg)] px-4 pt-2 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.45)]";

const handleClassName =
  "mx-auto mb-3 mt-1.5 h-1 w-9 flex-shrink-0 rounded-sm bg-[var(--border)]";

const profileButtonClassName =
  "mb-3 flex w-full cursor-pointer items-center gap-3 rounded-lg border border-[rgba(124,58,237,0.18)] bg-[rgba(124,58,237,0.06)] p-3 font-[inherit] text-[var(--text-primary)] transition-colors hover:bg-[rgba(124,58,237,0.10)]";

const avatarClassName =
  "flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-base font-extrabold text-white";

const quickGridClassName = "mb-4 grid grid-cols-2 gap-2";

const quickButtonClassName =
  "relative flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5 font-[inherit] text-[13px] font-semibold text-[var(--text-primary)] transition-colors hover:border-[rgba(124,58,237,0.3)] hover:bg-[rgba(124,58,237,0.06)]";

const sectionClassName = "mb-4";
const sectionTitleClassName = "px-1 pb-2 text-[11px] font-extrabold uppercase tracking-[0.06em] text-[var(--text-muted)]";
const sectionGridClassName = "grid grid-cols-2 gap-2";

const itemClassName =
  "relative flex min-h-[54px] cursor-pointer items-center justify-start gap-[9px] rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5 text-left font-[inherit] text-[13px] font-semibold text-[var(--text-primary)] no-underline transition hover:border-[rgba(124,58,237,0.3)] hover:bg-[rgba(124,58,237,0.06)] active:scale-[0.97]";

const itemIconClassName =
  "flex h-8 w-8 flex-[0_0_32px] items-center justify-center rounded-md bg-[rgba(124,58,237,0.12)] text-brand-400";

const itemLabelClassName = "min-w-0 leading-tight";

const badgeClassName =
  "absolute right-2 top-2 h-4 min-w-4 rounded-full bg-[#e03c3c] px-1 text-center text-[10px] font-extrabold leading-4 text-white";

const footerClassName = "flex items-center justify-center gap-2 pt-2 text-xs text-[var(--text-muted)]";
const footerLinkClassName = "text-[var(--text-muted)] no-underline hover:text-[var(--text-secondary)] hover:underline";

interface Props {
  open: boolean;
  onClose: () => void;
  navigate: (page: string) => void;
  userId?: string;
  isAdmin?: boolean;
  isModerator?: boolean;
}

export default function MobileMoreSheet({ open, onClose, navigate, userId, isAdmin, isModerator }: Props) {
  const { t } = useTranslation();
  const { data: profile } = useFullProfile(userId);
  const { incoming } = useFriendRequests(userId);
  const pendingRequests = incoming.data?.length ?? 0;
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  function go(page: string) { onClose(); navigate(page); }

  const sections: Section[] = [
    { title: t("nav.study", "Study"), items: [
      { kind: "spa", key: "readingPlans", labelKey: "nav.readingPlans", icon: <IconCalendar /> },
      { kind: "spa", key: "studyNotes", labelKey: "nav.studyNotes", icon: <IconNote /> },
      { kind: "spa", key: "studyTopics", labelKey: "nav.studyTopics", icon: <IconBooks /> },
      { kind: "spa", key: "meetingPrep", labelKey: "nav.meetingPrep", icon: <IconCheck /> },
      { kind: "spa", key: "bookmarks", labelKey: "nav.bookmarks", icon: <IconBookmark /> },
      { kind: "spa", key: "quiz", labelKey: "nav.bibleQuiz", icon: <IconQuiz /> },
      { kind: "spa", key: "familyQuiz", labelKey: "nav.familyChallenge", icon: <IconFamily /> },
      { kind: "spa", key: "trivia", labelKey: "nav.triviaBattle", icon: <IconTrivia /> },
    ]},
    { title: t("nav.community", "Community"), items: [
      { kind: "spa", key: "feed", labelKey: "nav.feed", icon: <IconFeed /> },
      { kind: "spa", key: "messages", labelKey: "nav.messages", icon: <IconMail /> },
      { kind: "spa", key: "forum", labelKey: "nav.forum", icon: <IconChat /> },
      { kind: "spa", key: "friends", labelKey: "nav.friends", icon: <IconUsers />, badge: pendingRequests },
      { kind: "spa", key: "groups", labelKey: "nav.studyGroups", icon: <IconGroup /> },
      { kind: "spa", key: "leaderboard", labelKey: "nav.leaderboard", icon: <IconLeaderboard /> },
    ]},
    { title: t("nav.explore", "Explore"), items: [
      { kind: "spa", key: "blog", labelKey: "nav.blog", icon: <IconBlog /> },
      { kind: "spa", key: "videos", labelKey: "nav.videos", icon: <IconVideo /> },
      { kind: "link", href: "/songs", labelKey: "topbar.songs", fallbackLabel: "Songs", icon: <IconMusic /> },
      { kind: "link", href: "/messianic-prophecies", labelKey: "nav.messianicProphecies", fallbackLabel: "Messianic Prophecies", icon: <IconStar /> },
      { kind: "link", href: "/ai", labelKey: "topbar.aiCompanion", fallbackLabel: "AI Companion", icon: <IconSpark /> },
    ]},
  ];

  return createPortal(
    <div className={backdropClassName} onClick={onClose} role="dialog" aria-modal="true" aria-label={t("mobileMore.dialogLabel")}>
      <div
        ref={sheetRef}
        className={sheetClassName}
        onClick={e => e.stopPropagation()}
      >
        <div className={handleClassName} />

        {/* Profile row */}
        <button className={profileButtonClassName} onClick={() => go("profile")}>
          <span className={avatarClassName}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={profile.display_name ?? ""} width={44} height={44} className="h-full w-full object-cover" />
              : <span>{(profile?.display_name || "?")[0].toUpperCase()}</span>}
          </span>
          <span className="flex min-w-0 flex-1 flex-col text-left">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-bold">{profile?.display_name || t("nav.profile")}</span>
            <span className="text-xs text-[var(--text-muted)]">{t("nav.viewProfile", "View profile")}</span>
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        <div className={quickGridClassName}>
          <button className={quickButtonClassName} onClick={() => go("settings")}>
            <IconSettings />
            <span>{t("nav.settings", "Settings")}</span>
          </button>
          <button className={quickButtonClassName} onClick={() => go("friendRequests")}>
            <IconUserPlus />
            <span>{t("nav.requests", "Requests")}</span>
            {pendingRequests > 0 && <span className={badgeClassName}>{pendingRequests}</span>}
          </button>
        </div>

        {sections.map(section => (
          <div key={section.title} className={sectionClassName}>
            <div className={sectionTitleClassName}>{section.title}</div>
            <div className={sectionGridClassName}>
              {section.items.map(item => item.kind === "spa" ? (
                <button
                  key={item.key}
                  className={itemClassName}
                  onClick={() => go(item.key)}
                >
                  <span className={itemIconClassName}>{item.icon}</span>
                  <span className={itemLabelClassName}>{t(item.labelKey)}</span>
                  {item.badge && item.badge > 0 ? <span className={badgeClassName}>{item.badge}</span> : null}
                </button>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className={itemClassName}
                  onClick={onClose}
                >
                  <span className={itemIconClassName}>{item.icon}</span>
                  <span className={itemLabelClassName}>{t(item.labelKey, item.fallbackLabel)}</span>
                </a>
              ))}
            </div>
          </div>
        ))}

        {(isAdmin || isModerator) && (
          <div className={sectionClassName}>
            <div className={sectionTitleClassName}>{isAdmin ? t("mobileMore.admin") : t("mobileMore.moderation")}</div>
            <div className={sectionGridClassName}>
              <button className={itemClassName} onClick={() => go("admin")}>
                <span className={itemIconClassName}><IconShield /></span>
                <span className={itemLabelClassName}>{isAdmin ? t("mobileMore.admin") : t("mobileMore.moderation")}</span>
              </button>
            </div>
          </div>
        )}

        <div className={footerClassName}>
          <a href="/privacy" className={footerLinkClassName}>{t("mobileMore.privacy")}</a>
          <span aria-hidden="true">·</span>
          <a href="/terms" className={footerLinkClassName}>{t("mobileMore.terms")}</a>
          <span aria-hidden="true">·</span>
          <a href="https://www.jw.org" target="_blank" rel="noopener noreferrer" className={footerLinkClassName}>JW.org</a>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Tiny inline icons (kept simple to avoid bundle bloat) ──────────────────────
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function IconCalendar() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function IconNote() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; }
function IconBooks() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>; }
function IconCheck() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>; }
function IconFeed() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><circle cx="5" cy="19" r="2"/><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/></svg>; }
function IconChat() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function IconUsers() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconMail() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></svg>; }
function IconGroup() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><circle cx="9" cy="7" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><circle cx="17.5" cy="8" r="3"/><path d="M14 21a5.5 5.5 0 0 1 9 0"/></svg>; }
function IconBookmark() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>; }
function IconBlog() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function IconLeaderboard() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function IconVideo() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>; }
function IconMusic() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>; }
function IconStar() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function IconSpark() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z"/></svg>; }
function IconQuiz() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>; }
function IconTrivia() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function IconFamily() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><circle cx="9" cy="7" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><circle cx="17.5" cy="8" r="3"/><path d="M14 21a5.5 5.5 0 0 1 9 0"/></svg>; }
function IconSettings() { return <svg width="18" height="18" viewBox="0 0 24 24" {...stroke} aria-hidden><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function IconUserPlus() { return <svg width="18" height="18" viewBox="0 0 24 24" {...stroke} aria-hidden><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>; }
function IconShield() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
