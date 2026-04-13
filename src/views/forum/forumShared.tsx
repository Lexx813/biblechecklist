// Shared helpers, icons, and small components for forum split files.
import React from "react";
import { useTranslation } from "react-i18next";
import { useThreadReactions, useToggleReaction } from "../../hooks/useForum";

// ── Constants ─────────────────────────────────────────────────────────────────

export const REACTION_EMOJIS = ["🙏", "❤️", "💡"];
export const LEVEL_EMOJIS = [null,"📖","📚","🌱","👨‍👩‍👦","🏺","⚔️","🎵","📯","🕊️","🌍","🔮","👑"];

// ── Helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function displayName(profile: any) {
  return profile?.display_name || profile?.email?.split("@")[0] || "Anonymous";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initial(profile: any) {
  return (profile?.display_name || profile?.email || "A")[0].toUpperCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function timeAgo(iso: string, t: any) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return t("forum.timeJustNow");
  if (m < 60) return t("forum.timeMinutes", { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("forum.timeHours", { count: h });
  const d = Math.floor(h / 24);
  if (d < 30) return t("forum.timeDays", { count: d });
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const IC = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": "true" as const };
export function IconPin()      { return <svg {...IC} width="12" height="12"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17H19V15L17 11V4H7V11L5 15V17Z"/></svg>; }
export function IconLock()     { return <svg {...IC} width="12" height="12"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
export function IconEye()      { return <svg {...IC} width="13" height="13"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
export function IconLink()     { return <svg {...IC} width="13" height="13"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>; }
export function IconBell()     { return <svg {...IC} width="13" height="13"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
export function IconBellOff()  { return <svg {...IC} width="13" height="13"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
export function IconThumbsUp() { return <svg {...IC} width="13" height="13"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>; }
export function IconFlag()     { return <svg {...IC} width="13" height="13"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>; }
export function IconBan()      { return <svg {...IC} width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>; }
export function IconQuote()    { return <svg {...IC} width="13" height="13"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
export function IconShield()   { return <svg {...IC} width="12" height="12"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
export function IconSettings() { return <svg {...IC} width="12" height="12"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>; }

// ── Shared components ─────────────────────────────────────────────────────────

export const AVATAR_PX: Record<string, number> = { lg: 40, md: 36, sm: 28 };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Avatar({ profile, size = "md", onClick = undefined }: { profile: any; size?: string; onClick?: any }) {
  const cls = `forum-avatar forum-avatar--${size}${onClick ? " forum-avatar--clickable" : ""}`;
  const px = AVATAR_PX[size] ?? 36;
  if (profile?.avatar_url) {
    return <img className={cls} src={profile.avatar_url} alt={displayName(profile)} width={px} height={px} loading="lazy" onClick={onClick} />;
  }
  return <div className={`${cls} forum-avatar--fallback`} onClick={onClick}>{initial(profile)}</div>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BadgeChip({ level }: { level: any }) {
  if (!level || level < 1) return null;
  return (
    <span className="forum-badge-chip" data-tooltip={`Level ${level}`} title={`Level ${level}`}>
      {LEVEL_EMOJIS[Math.min(level, 12)]}
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ModBadge({ profile }: { profile: any }) {
  if (profile?.is_admin) return <span className="forum-role-chip forum-role-chip--admin" data-tooltip="Admin" title="Admin"><IconSettings /></span>;
  if (profile?.is_moderator) return <span className="forum-role-chip forum-role-chip--mod" data-tooltip="Moderator" title="Moderator"><IconShield /></span>;
  return null;
}

export function ReactionsBar({ contentType, contentId, reactions, onToggle }: {
  contentType: string;
  contentId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reactions: any;
  onToggle: (ct: string, cid: string, emoji: string) => void;
}) {
  const key = (emoji: string) => `${contentType}:${contentId}:${emoji}`;
  return (
    <div className="forum-reactions">
      {REACTION_EMOJIS.map(emoji => {
        const k = key(emoji);
        const count = reactions?.counts?.[k] ?? 0;
        const active = reactions?.mine?.includes(k) ?? false;
        return (
          <button
            key={emoji}
            className={`forum-reaction-btn${active ? " forum-reaction-btn--active" : ""}`}
            onClick={() => onToggle(contentType, contentId, emoji)}
            title={emoji}
            aria-label={`${emoji}${count > 0 ? ` ${count}` : ""}`}
            aria-pressed={active}
          >
            {emoji} {count > 0 && <span className="forum-reaction-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
