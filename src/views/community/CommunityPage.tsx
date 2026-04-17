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

  const recentActivity = [
    ...(friendPosts as any[]),
    ...(publicFeed as any[]),
  ]
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
            return (
              <button
                key={f.id}
                className="ch-friend-av-wrap"
                onClick={() => navigate("publicProfile", { userId: f.id })}
                aria-label={f.display_name ?? "Friend"}
              >
                <span className="ch-friend-av">
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
            {recentActivity.map((item: any) => (
              <div key={item.id} className="ch-activity-item">
                <span className="ch-av">
                  {item.profiles?.avatar_url
                    ? <img src={item.profiles.avatar_url} alt={item.profiles.display_name ?? ""} width={32} height={32} loading="lazy" />
                    : (item.profiles?.display_name ?? "?")[0].toUpperCase()}
                </span>
                <div className="ch-activity-text">
                  <span className="ch-activity-name">{item.profiles?.display_name ?? "Someone"}</span>
                  <span className="ch-activity-body"> {item.content}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
