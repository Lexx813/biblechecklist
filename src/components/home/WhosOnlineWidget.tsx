import type { OnlineMember } from "../../hooks/useOnlineMembers";
import { ONLINE_THRESHOLD_MS } from "../../hooks/useOnlineMembers";
import { avatarGradient } from "../../lib/avatarGradient";
import { fmtDiff } from "../../lib/timeFormat";

const widgetCls = "rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.03] [html[data-theme=light]_&]:bg-white";
const feedLinkCls = "text-sm font-semibold text-[var(--accent)] cursor-pointer border-none bg-transparent px-2.5 py-1 rounded-[var(--radius-sm)] transition-colors duration-100 hover:bg-brand-600/[0.12] font-[inherit]";
const metaCls = "text-xs text-[rgba(240,234,255,0.6)] [html[data-theme=light]_&]:text-[rgba(30,16,53,0.68)]";

interface Props {
  members: OnlineMember[];
  totalOnline: number;
  loading: boolean;
  error: boolean;
  now: number;
  navigate: (page: string, params?: Record<string, any>) => void;
}

export default function WhosOnlineWidget({ members, totalOnline, loading, error, now, navigate }: Props) {
  return (
    <div className={widgetCls}>
      <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[var(--text-primary)]">Who's Online</span>
          {totalOnline > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-400">
              <span className="inline-block size-1.5 rounded-full bg-green-400" />
              {totalOnline}
            </span>
          )}
        </div>
        <button className={feedLinkCls} onClick={() => navigate("community")}>See all →</button>
      </div>
      {loading ? (
        <div className="flex flex-col gap-2.5 py-1 pb-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-2.5 px-4">
              <div className="skeleton size-8 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-[5px]">
                <div className="skeleton h-3 w-[55%] rounded-md">&nbsp;</div>
                <div className="skeleton h-2.5 w-[35%] rounded-md">&nbsp;</div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 16px", textAlign: "center", margin: 0 }}>
          Could not load members
        </p>
      ) : members.length === 0 ? (
        <div style={{ padding: "8px 16px 12px", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 4px" }}>No one active right now</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, opacity: 0.7 }}>Share your reading progress to show up here</p>
        </div>
      ) : (
        <>
          {members.slice(0, 6).map(m => {
            const isOnline = m.last_active_at != null &&
              now - new Date(m.last_active_at).getTime() < ONLINE_THRESHOLD_MS;
            const diff = m.last_active_at ? now - new Date(m.last_active_at).getTime() : null;
            const when = fmtDiff(isOnline ? 0 : diff);
            const [g1, g2] = avatarGradient(m.id);
            return (
              <div
                key={m.id}
                className="flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors duration-100 hover:bg-brand-600/[0.07]"
                onClick={() => navigate("publicProfile", { userId: m.id })}
              >
                <span className="relative shrink-0">
                  <span className="flex size-9 items-center justify-center overflow-hidden rounded-full text-[13px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
                    {m.avatar_url
                      ? <img src={m.avatar_url} alt={m.display_name ?? ""} loading="lazy" className="h-full w-full object-cover" width={36} height={36} />
                      : (m.display_name || "?")[0].toUpperCase()}
                  </span>
                  {isOnline && <span className="absolute -bottom-px -right-px size-3 rounded-full border-2 border-[var(--card-bg,var(--bg))] bg-green-400" />}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{m.display_name || "Anonymous"}</span>
                  <span className={`text-xs ${isOnline ? "font-semibold text-green-400" : metaCls}`}>{when}</span>
                </div>
              </div>
            );
          })}
          <div className="h-2" />
        </>
      )}
    </div>
  );
}
