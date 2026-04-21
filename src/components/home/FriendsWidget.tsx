import type { FriendProfile } from "../../hooks/useFriends";
import { avatarGradient } from "../../lib/avatarGradient";
import { fmtDiff } from "../../lib/timeFormat";

const ONLINE_THRESHOLD_MS = 10 * 60 * 1000;

const widgetCls = "rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.03] [html[data-theme=light]_&]:bg-white";
const feedLinkCls = "text-sm font-semibold text-[var(--accent)] cursor-pointer border-none bg-transparent px-2.5 py-1 rounded-[var(--radius-sm)] transition-colors duration-100 hover:bg-brand-600/[0.12] font-[inherit]";
const metaCls = "text-xs text-[rgba(240,234,255,0.6)] [html[data-theme=light]_&]:text-[rgba(30,16,53,0.68)]";

interface Props {
  friends: FriendProfile[];
  shownFriends: FriendProfile[];
  onlineCount: number;
  loading: boolean;
  now: number;
  navigate: (page: string, params?: Record<string, any>) => void;
}

export default function FriendsWidget({ friends, shownFriends, onlineCount, loading, now, navigate }: Props) {
  return (
    <div className={widgetCls}>
      <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[var(--text-primary)]">Friends</span>
          {onlineCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-400">
              <span className="inline-block size-1.5 rounded-full bg-green-400" />
              {onlineCount}
            </span>
          )}
        </div>
        <button className={feedLinkCls} onClick={() => navigate("friends")}>See all</button>
      </div>
      {loading ? (
        <div className="flex flex-col gap-2 py-1 pb-3">
          {[0,1,2].map(i => (
            <div key={i} className="flex items-center gap-3 px-4">
              <div className="skeleton size-9 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="skeleton h-3 w-[50%] rounded" />
                <div className="skeleton h-2.5 w-[30%] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : friends.length === 0 ? (
        <div className="px-4 pb-4 pt-1">
          <p className="mb-2 text-[13px] text-[var(--text-muted)]">Connect with fellow Bible students to see their activity here.</p>
          <button className="cursor-pointer border-none bg-none p-0 font-[inherit] text-xs font-bold text-[#a78bfa]" style={{ background: "none" }} onClick={() => navigate("friends")}>Find friends →</button>
        </div>
      ) : (
        <div className="pb-2">
          {shownFriends.map(f => {
            const isOnline = !!f.last_active_at && now - new Date(f.last_active_at).getTime() < ONLINE_THRESHOLD_MS;
            const diff = f.last_active_at ? now - new Date(f.last_active_at).getTime() : null;
            const when = fmtDiff(isOnline ? 0 : diff);
            const [g1, g2] = avatarGradient(f.id);
            return (
              <div key={f.id} className="flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors duration-100 hover:bg-brand-600/[0.07]" onClick={() => navigate("publicProfile", { userId: f.id })}>
                <span className="relative shrink-0">
                  <span className="flex size-9 items-center justify-center overflow-hidden rounded-full text-[13px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
                    {f.avatar_url ? <img src={f.avatar_url} alt={f.display_name ?? ""} className="h-full w-full object-cover" width={36} height={36} loading="lazy" /> : (f.display_name || "?")[0].toUpperCase()}
                  </span>
                  {isOnline && <span className="absolute -bottom-px -right-px size-3 rounded-full border-2 border-[var(--card-bg,var(--bg))] bg-green-400" />}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{f.display_name || "Unknown"}</span>
                  <span className={`text-xs ${isOnline ? "font-semibold text-green-400" : metaCls}`}>{when}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
