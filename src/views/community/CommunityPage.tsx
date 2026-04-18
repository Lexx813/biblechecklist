import { useTranslation } from "react-i18next";
import { useMeta } from "../../hooks/useMeta";
import { useOnlineMembers, ONLINE_THRESHOLD_MS } from "../../hooks/useOnlineMembers";
import { useTopThreads } from "../../hooks/useForum";
import { useFriendPosts, usePublicFeed } from "../../hooks/usePosts";
import { useFriends, type FriendProfile } from "../../hooks/useFriends";
import { useUnreadMessageCount } from "../../hooks/useMessages";
import "../../styles/community.css";

interface Props {
  navigate: (page: string, params?: Record<string, unknown>) => void;
  userId?: string;
}

const AVATAR_GRADIENTS: [string, string][] = [
  ["#7c3aed","#3b0764"], ["#1d4ed8","#1e3a8a"], ["#059669","#064e3b"],
  ["#ea580c","#7c2d12"], ["#db2777","#831843"], ["#0891b2","#164e63"],
  ["#7c3aed","#4c1d95"], ["#16a34a","#14532d"], ["#d97706","#78350f"],
  ["#dc2626","#7f1d1d"], ["#0284c7","#0c4a6e"], ["#9333ea","#581c87"],
];
function avatarGradient(id: string): [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

export default function CommunityPage({ navigate, userId }: Props) {
  useMeta({ title: "Community", path: "/community" });
  const { t } = useTranslation();

  const { totalOnline, isLoading: membersLoading } = useOnlineMembers(50);
  const { data: threads = [] } = useTopThreads(5);
  const { data: friendPosts = [] } = useFriendPosts(userId);
  const { data: publicFeed = [] } = usePublicFeed();
  const { data: friends = [] } = useFriends(userId!);
  const { data: unreadMessages = 0 } = useUnreadMessageCount();

  const newForumPosts = (threads as any[]).filter((thread: any) => {
    const created = new Date(thread.created_at ?? 0).getTime();
    return Date.now() - created < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const recentActivity = [...new Map(
    [...(friendPosts as any[]), ...(publicFeed as any[])].map(p => [p.id, p])
  ).values()]
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 3);

  const TILES = [
    {
      key: "forum",
      labelKey: "nav.forum",
      emoji: "📋",
      badge: newForumPosts > 0 ? t("community.newPosts", { count: newForumPosts }) : null,
    },
    {
      key: "messages",
      labelKey: "nav.messages",
      emoji: "💬",
      badge: (unreadMessages as number) > 0 ? String(unreadMessages) : null,
    },
    {
      key: "groups",
      labelKey: "nav.studyGroups",
      emoji: "👥",
      badge: null,
    },
    {
      key: "leaderboard",
      labelKey: "nav.leaderboard",
      emoji: "🏆",
      badge: null,
    },
  ];

  return (
    <div className="ch-wrap">
      {/* Header */}
      <header className="ch-header">
        <h1 className="ch-title">{t("community.title")}</h1>
        {!membersLoading && (totalOnline as number) > 0 && (
          <span className="ch-online-pill">
            <span className="ch-online-dot" aria-hidden="true" />
            {t("community.onlineNow", { count: totalOnline })}
          </span>
        )}
      </header>

      {/* 2×2 tile grid */}
      <div className="ch-tiles">
        {TILES.map(tile => (
          <button key={tile.key} className="ch-tile" onClick={() => navigate(tile.key)}>
            <span className="ch-tile-emoji" aria-hidden="true">{tile.emoji}</span>
            <span className="ch-tile-label">{t(tile.labelKey, tile.key)}</span>
            {tile.badge && <span className="ch-tile-badge">{tile.badge}</span>}
          </button>
        ))}
      </div>

      {/* Friends row */}
      <div className="ch-friends-section">
        <div className="ch-friends-header">
          <span className="ch-friends-title">{t("nav.friends", "Friends")}</span>
          <button className="ch-manage-link" onClick={() => navigate("friends")}>{t("community.manage")}</button>
        </div>
        <div className="ch-friends-scroll">
          {(friends as FriendProfile[]).slice(0, 8).map(f => {
            const isOnline = f.last_active_at != null &&
              Date.now() - new Date(f.last_active_at).getTime() < ONLINE_THRESHOLD_MS;
            const [g1, g2] = avatarGradient(f.id);
            return (
              <button
                key={f.id}
                className="ch-friend-av-wrap"
                onClick={() => navigate("publicProfile", { userId: f.id })}
                aria-label={f.display_name ?? "Friend"}
              >
                <span className="ch-friend-av" style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
                  {f.avatar_url
                    ? <img src={f.avatar_url} alt={f.display_name ?? ""} width={40} height={40} loading="lazy" />
                    : (f.display_name ?? "?")[0].toUpperCase()}
                </span>
                {isOnline && <span className="ch-friend-dot" aria-label="Online" />}
              </button>
            );
          })}
          <button className="ch-add-friend" onClick={() => navigate("friends")} aria-label="Add friends">+</button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="ch-activity-section">
        <div className="ch-activity-header">
          <span className="ch-activity-title">{t("community.recentActivity")}</span>
          <button className="ch-see-all" onClick={() => navigate("feed")}>{t("home.seeAll")}</button>
        </div>
        {recentActivity.length === 0 ? (
          <p className="ch-activity-empty">No recent activity yet.</p>
        ) : (
          <div className="ch-activity-list">
            {recentActivity.map((item: any) => {
              const [g1, g2] = avatarGradient(item.profiles?.id ?? item.id ?? "x");
              const plainText = item.content ? (() => { const d = document.createElement("div"); d.innerHTML = item.content; return d.textContent ?? ""; })() : "";
              return (
                <div key={item.id} className="ch-activity-item" onClick={() => navigate("feed")} style={{ cursor: "pointer" }}>
                  <span className="ch-av" style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
                    {item.profiles?.avatar_url
                      ? <img src={item.profiles.avatar_url} alt={item.profiles.display_name ?? ""} width={32} height={32} loading="lazy" />
                      : (item.profiles?.display_name ?? "?")[0].toUpperCase()}
                  </span>
                  <div className="ch-activity-text">
                    <span className="ch-activity-name">{item.profiles?.display_name ?? "Someone"}</span>
                    <span className="ch-activity-body">{plainText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
