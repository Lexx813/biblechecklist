import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useActivityFeed, useSuggestedUsers, useToggleFollowDynamic } from "../../hooks/useFollows";
import { useFriends, type FriendProfile } from "../../hooks/useFriends";
import { ONLINE_THRESHOLD_MS } from "../../hooks/useOnlineMembers";
import { useCreatePost } from "../../hooks/usePosts";
import { useFullProfile } from "../../hooks/useAdmin";
import { sanitizeRich } from "../../lib/sanitize";
import CreatePostModal from "../../components/CreatePostModal";
import "../../styles/social.css";

const LEVEL_EMOJIS: Array<string | null> = [null, "📖","📚","🌱","👨‍👩‍👦","🏺","⚔️","🎵","📯","🕊️","🌍","🔮","👑"];

// 11 distinct gradients for avatar fallbacks
const AVATAR_GRADIENTS: Array<[string, string]> = [
  ["#7c3aed","#3b0764"], ["#1d4ed8","#1e3a8a"], ["#059669","#064e3b"],
  ["#ea580c","#7c2d12"], ["#db2777","#831843"], ["#0891b2","#164e63"],
  ["#16a34a","#14532d"], ["#d97706","#78350f"], ["#dc2626","#7f1d1d"],
  ["#0284c7","#0c4a6e"], ["#9333ea","#581c87"],
];

function gradientFor(id: string): [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

interface NavigateFn {
  (page: string, params?: Record<string, unknown>): void;
}

interface UserShape {
  id: string;
  email?: string;
}

interface AuthorShape {
  display_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

// Supabase joins can return either an object or an array depending on the relationship cardinality
function pickAuthor(author: unknown): AuthorShape | null {
  if (!author) return null;
  if (Array.isArray(author)) return (author[0] ?? null) as AuthorShape | null;
  return author as AuthorShape;
}

type TranslateFn = (k: string, opts?: { count?: number }) => string;

function timeAgo(iso: string, t: TranslateFn): string {
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

function FeedAvatar({ author }: { author?: AuthorShape | null }) {
  const initial = (author?.display_name || author?.email || "?")[0].toUpperCase();
  if (author?.avatar_url) {
    return <img className="feed-avatar" src={author.avatar_url} alt="" width={36} height={36} loading="lazy" />;
  }
  return <div className="feed-avatar feed-avatar--fallback">{initial}</div>;
}

function authorName(author?: AuthorShape | null): string {
  return author?.display_name || author?.email?.split("@")[0] || "Someone";
}

// ── Friends scroll row ──────────────────────────────────────────────────────

function FriendsRow({ userId, navigate }: { userId: string; navigate: NavigateFn }) {
  const { data: friends = [] } = useFriends(userId);
  if ((friends as FriendProfile[]).length === 0) return null;
  return (
    <div className="feed-friends-row">
      <button
        type="button"
        className="feed-friends-add"
        onClick={() => navigate("friends")}
        aria-label="Manage friends"
      >
        <span className="feed-friends-add-circle" aria-hidden="true">+</span>
        <span className="feed-friends-name">Friends</span>
      </button>
      {(friends as FriendProfile[]).slice(0, 12).map(f => {
        const isOnline = f.last_active_at != null
          && Date.now() - new Date(f.last_active_at).getTime() < ONLINE_THRESHOLD_MS;
        const [g1, g2] = gradientFor(f.id);
        const name = f.display_name ?? "?";
        return (
          <button
            type="button"
            key={f.id}
            className="feed-friend"
            onClick={() => navigate("publicProfile", { userId: f.id })}
            aria-label={name}
          >
            <span
              className="feed-friend-avatar"
              style={{ ["--grad-from" as string]: g1, ["--grad-to" as string]: g2 }}
            >
              {f.avatar_url
                ? <img src={f.avatar_url} alt="" width={48} height={48} loading="lazy" />
                : name[0].toUpperCase()}
              {isOnline && <span className="feed-friend-online" aria-label="Online" />}
            </span>
            <span className="feed-friends-name">{name.length > 10 ? `${name.slice(0, 9)}…` : name}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Composer (opens CreatePostModal) ────────────────────────────────────────

function ComposerTrigger({ user, displayName, avatarUrl }: { user: UserShape; displayName: string; avatarUrl?: string | null }) {
  const [open, setOpen] = useState(false);
  const createPost = useCreatePost(user.id);

  function handleSubmit(content: string, visibility: "public" | "friends", imageUrl?: string) {
    createPost.mutate(
      { content, visibility, imageUrl },
      { onSuccess: () => setOpen(false) }
    );
  }

  const initial = (displayName || user.email || "?")[0].toUpperCase();
  return (
    <>
      <button type="button" className="feed-composer" onClick={() => setOpen(true)}>
        {avatarUrl
          ? <img src={avatarUrl} alt="" width={40} height={40} className="feed-composer-avatar" loading="lazy" />
          : <span className="feed-composer-avatar feed-composer-avatar--fallback">{initial}</span>}
        <span className="feed-composer-placeholder">What&apos;s on your mind?</span>
      </button>
      {open && (
        <CreatePostModal
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
          isPending={createPost.isPending}
          userId={user.id}
          avatarUrl={avatarUrl ?? undefined}
          displayName={displayName}
        />
      )}
    </>
  );
}

// ── People you may know ─────────────────────────────────────────────────────

function PeopleYouMayKnow({ userId, navigate }: { userId: string; navigate: NavigateFn }) {
  const { data: suggested = [], isLoading } = useSuggestedUsers(userId);
  const toggleFollow = useToggleFollowDynamic(userId);
  if (isLoading || suggested.length === 0) return null;
  return (
    <div className="feed-suggestions">
      <h3 className="feed-suggestions-title">People you may know</h3>
      <div className="feed-suggestions-list">
        {suggested.map(person => (
          <div key={person.id} className="feed-suggestion-row">
            <button className="feed-suggestion-avatar-btn" onClick={() => navigate("publicProfile", { userId: person.id })}>
              {person.avatar_url
                ? <img className="feed-avatar" src={person.avatar_url} alt={person.display_name ?? ""} width={36} height={36} loading="lazy" />
                : <div className="feed-avatar feed-avatar--fallback">{(person.display_name ?? "?")[0].toUpperCase()}</div>}
            </button>
            <button className="feed-suggestion-name" onClick={() => navigate("publicProfile", { userId: person.id })}>
              {person.display_name}
            </button>
            <button className="feed-suggestion-follow-btn" onClick={() => toggleFollow.mutate(person.id)} disabled={toggleFollow.isPending}>
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feed list skeleton ──────────────────────────────────────────────────────

function ActivityFeedSkeleton() {
  return (
    <div className="activity-feed">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="feed-item-skeleton">
          <div className="skeleton feed-item-skeleton-avatar" />
          <div className="feed-item-skeleton-body">
            <div className="skeleton" style={{ height: 15, width: `${55 + i * 4}%`, marginBottom: 7 }} />
            <div className="skeleton" style={{ height: 12, width: "20%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

interface Props {
  user: UserShape;
  navigate: NavigateFn;
}

export default function ActivityFeedInline({ user, navigate }: Props) {
  const { t } = useTranslation();
  const { data: items = [], isLoading } = useActivityFeed(user.id);
  const { data: profile } = useFullProfile(user.id);
  const displayName = profile?.display_name || user.email?.split("@")[0] || "You";

  return (
    <div className="feed-inner">
      <FriendsRow userId={user.id} navigate={navigate} />
      <ComposerTrigger user={user} displayName={displayName} avatarUrl={profile?.avatar_url} />

      {isLoading ? (
        <ActivityFeedSkeleton />
      ) : items.length === 0 ? (
        <div className="feed-empty">
          <div className="feed-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3>{t("feed.empty")}</h3>
          <p>{t("feed.emptySub")}</p>
          <PeopleYouMayKnow userId={user.id} navigate={navigate} />
        </div>
      ) : (
        <div className="feed-list">
          {items.map((item, i) => {
            const isThread = item.type === "thread";
            const itemId = (item as { id?: string }).id ?? item.authorId;
            const author = pickAuthor("author" in item ? item.author : null);
            return (
              <div
                key={`${item.type}-${itemId}-${item.ts}-${i}`}
                className={`feed-item feed-item--${item.type}${isThread ? " feed-item--clickable" : ""}`}
                onClick={isThread && "id" in item ? () => navigate("forum", { threadId: item.id }) : undefined}
              >
                <button className="feed-item-avatar-btn" onClick={e => { e.stopPropagation(); navigate("publicProfile", { userId: item.authorId }); }}>
                  <FeedAvatar author={author} />
                </button>
                <div className="feed-item-body">
                  <div className="feed-item-meta">
                    <button className="feed-item-name" onClick={e => { e.stopPropagation(); navigate("publicProfile", { userId: item.authorId }); }}>
                      {authorName(author)}
                    </button>
                    {item.type === "thread" && (
                      <span className="feed-item-action"> {t("feed.startedThread")} <span className="feed-item-detail">&ldquo;{item.title}&rdquo;</span></span>
                    )}
                    {item.type === "badge" && (
                      <span className="feed-item-action"> {t("feed.earnedBadge")} <span className="feed-item-badge">{LEVEL_EMOJIS[item.level]} {t("feed.levelLabel", { level: item.level })}</span></span>
                    )}
                    {item.type === "post" && (
                      <span className="feed-item-action"> {t("feed.sharedUpdate")}</span>
                    )}
                  </div>
                  {item.type === "post" && <p className="feed-post-content" dangerouslySetInnerHTML={{ __html: sanitizeRich(item.content ?? "") }} />}
                  <span className="feed-item-time">{timeAgo(item.ts, t)}</span>
                </div>
              </div>
            );
          })}

          <PeopleYouMayKnow userId={user.id} navigate={navigate} />
        </div>
      )}
    </div>
  );
}
