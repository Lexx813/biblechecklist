import { useTranslation } from "react-i18next";
import EmptyState from "../EmptyState";
import { BOOKS } from "../../data/books";
import { formatDate } from "../../utils/formatters";

const widgetCls = "rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.03] [html[data-theme=light]_&]:bg-white";
const feedLinkCls = "text-sm font-semibold text-[var(--accent)] cursor-pointer border-none bg-transparent px-2.5 py-1 rounded-[var(--radius-sm)] transition-colors duration-100 hover:bg-brand-600/[0.12] font-[inherit]";
const metaCls = "text-xs text-[rgba(240,234,255,0.6)] [html[data-theme=light]_&]:text-[rgba(30,16,53,0.68)]";

interface PublicNote {
  id: string;
  title: string | null;
  user_id: string;
  book_index: number | null;
  chapter: number | null;
  updated_at: string;
  like_count: number;
  user_has_liked: boolean;
  author: { display_name: string | null; avatar_url: string | null } | null;
}

interface Props {
  notes: PublicNote[];
  loading: boolean;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  navigate: (page: string, params?: Record<string, any>) => void;
}

function NoteSkeleton() {
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

export default function CommunityNotesWidget({ notes, loading, expanded, setExpanded, navigate }: Props) {
  const { t } = useTranslation();

  return (
    <div className={widgetCls}>
      <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
        <span className="text-base font-bold text-[var(--text-primary)]">{t("home.notesTitle")}</span>
        <button className={feedLinkCls} onClick={() => navigate("studyNotes", { tab: "public" })}>{t("home.notesViewAll")}</button>
      </div>
      {loading ? <NoteSkeleton /> : notes.length === 0 ? (
        <EmptyState
          icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>}
          title={t("home.notesEmpty")} sub={t("home.notesEmptySub")}
          btnLabel={t("home.notesWriteBtn")} onBtn={() => navigate("studyNotes", { tab: "public" })}
        />
      ) : (
        <>
          {(expanded ? notes : notes.slice(0, 1)).map(note => {
            const passage = note.book_index != null
              ? `${BOOKS[note.book_index]?.name ?? ""} ${note.chapter ?? ""}`.trim()
              : null;
            return (
              <div key={note.id} className="flex cursor-pointer items-start gap-2.5 px-4 py-2.5 transition-colors duration-100 hover:bg-brand-600/[0.06]" onClick={() => navigate("studyNotes", { tab: "public" })}>
                <button
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#2e1a5c] to-brand-800 text-[12px] font-bold text-white"
                  onClick={e => { e.stopPropagation(); navigate("publicProfile", { userId: note.user_id }); }}
                  title={note.author?.display_name ?? "Anonymous"}
                >
                  {note.author?.avatar_url
                    ? <img src={note.author.avatar_url} alt={note.author.display_name ?? ""} className="h-full w-full object-cover" width={32} height={32} loading="lazy" />
                    : (note.author?.display_name ?? "A")[0].toUpperCase()}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold leading-snug text-[var(--text-primary)]">{note.title || "Untitled"}</div>
                  <div className={metaCls}>
                    {note.author?.display_name ?? "Anonymous"}
                    {passage && <> · {passage}</>}
                    {" · "}{formatDate(note.updated_at)}
                  </div>
                </div>
                <span
                  className={`shrink-0 self-center text-[13px] ${note.user_has_liked ? "text-fuchsia-400" : "text-[rgba(240,234,255,0.5)] [html[data-theme=light]_&]:text-[rgba(30,16,53,0.4)]"}`}
                >
                  {note.user_has_liked ? "\u2665" : "\u2661"}{note.like_count > 0 ? ` ${note.like_count}` : ""}
                </span>
              </div>
            );
          })}
          <button
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-b-[var(--radius)] border-none bg-brand-600/10 py-2.5 text-xs font-semibold text-[var(--accent)] transition-colors duration-100 hover:bg-brand-600/20 [html[data-theme=light]_&]:bg-brand-600/[0.07] [html[data-theme=light]_&]:hover:bg-brand-600/[0.12]"
            onClick={() => notes.length > 1 && !expanded ? setExpanded(true) : navigate("studyNotes", { tab: "public" })}
          >
            {expanded ? "View all notes" : notes.length > 1 ? `Show ${notes.length - 1} more` : "View all notes"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 200ms" }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </>
      )}
    </div>
  );
}
