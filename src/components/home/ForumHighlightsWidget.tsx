import { useTranslation } from "react-i18next";
import EmptyState from "../EmptyState";
import { authorName, formatDate, formatNum } from "../../utils/formatters";

const widgetCls = "rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.03] [html[data-theme=light]_&]:bg-white";
const feedLinkCls = "text-sm font-semibold text-[var(--accent)] cursor-pointer border-none bg-transparent px-2.5 py-1 rounded-[var(--radius-sm)] transition-colors duration-100 hover:bg-brand-600/[0.12] font-[inherit]";
const metaCls = "text-xs text-[rgba(240,234,255,0.6)] [html[data-theme=light]_&]:text-[rgba(30,16,53,0.68)]";

interface Thread {
  id: string;
  title: string;
  category_id: string;
  updated_at: string;
  forum_replies?: { count: number }[];
  profiles?: { display_name?: string; email?: string };
  [key: string]: any;
}

interface Props {
  threads: Thread[];
  loading: boolean;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  navigate: (page: string, params?: Record<string, any>) => void;
}

function ThreadSkeleton() {
  return (
    <div className="flex flex-col">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="flex flex-col gap-2 border-b border-brand-600/[0.08] px-4 py-3.5">
          <div className="skeleton" style={{ height: 14, width: "70%", borderRadius: 6 }}>&nbsp;</div>
          <div className="skeleton" style={{ height: 11, width: "40%", borderRadius: 6 }}>&nbsp;</div>
        </div>
      ))}
    </div>
  );
}

export default function ForumHighlightsWidget({ threads, loading, expanded, setExpanded, navigate }: Props) {
  const { t } = useTranslation();

  return (
    <div className={widgetCls}>
      <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
        <span className="text-base font-bold text-[var(--text-primary)]">{t("home.forumTitle")}</span>
        <button className={feedLinkCls} onClick={() => navigate("forum")}>{t("home.forumViewAll")}</button>
      </div>
      {loading ? <ThreadSkeleton /> : threads.length === 0 ? (
        <EmptyState
          icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
          title="No discussions yet" sub="Start the first conversation."
          btnLabel="Start a thread \u2192" onBtn={() => navigate("forum")}
        />
      ) : (
        <>
          {(expanded ? threads : threads.slice(0, 1)).map(thread => (
            <div
              key={thread.id}
              className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 transition-colors duration-100 hover:bg-brand-600/[0.06]"
              onClick={() => navigate("forum", { categoryId: thread.category_id, threadId: thread.id })}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white/[0.06] text-[12px] font-bold text-[var(--accent)]">
                {(authorName(thread) || "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold leading-snug text-[var(--text-primary)]">{thread.title}</div>
                <div className={metaCls}>{authorName(thread)} · {formatDate(thread.updated_at)}</div>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-[11px] text-[rgba(240,234,255,0.5)] [html[data-theme=light]_&]:text-[rgba(30,16,53,0.5)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {formatNum(thread.forum_replies?.[0]?.count ?? 0)}
              </span>
            </div>
          ))}
          <button
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-b-[var(--radius)] border-none bg-brand-600/10 py-2.5 text-xs font-semibold text-[var(--accent)] transition-colors duration-100 hover:bg-brand-600/20 [html[data-theme=light]_&]:bg-brand-600/[0.07] [html[data-theme=light]_&]:hover:bg-brand-600/[0.12]"
            onClick={() => threads.length > 1 && !expanded ? setExpanded(true) : navigate("forum")}
          >
            {expanded ? "View all threads" : threads.length > 1 ? `Show ${threads.length - 1} more` : "View all threads"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 200ms" }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </>
      )}
    </div>
  );
}
