import { useState, useDeferredValue } from "react";
import { useTranslation } from "react-i18next";
import {
  usePublishedPosts,
  useFeaturedPost,
  useTrendingPosts,
  useActiveWriters,
  useSearchPosts,
} from "../../hooks/useBlog";
import { formatDate } from "../../utils/formatters";
import "../../styles/blog-discovery.css";

/* Branded violet SVG placeholders — replaced stock Unsplash photography that
   read as cheap/generic. Each post gets a stable gradient from its id, encoded
   as a data URI so existing <img src=...> consumers don't change. */
const VIOLET_GRADIENTS: ReadonlyArray<readonly [string, string]> = [
  ["#7c3aed", "#5b21b6"],
  ["#a78bfa", "#6d28d9"],
  ["#6d28d9", "#4c1d95"],
  ["#8b5cf6", "#5b21b6"],
  ["#c4b5fd", "#7c3aed"],
];

function hashId(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function fallbackImage(id: string): string {
  const [from, to] = VIOLET_GRADIENTS[hashId(id) % VIOLET_GRADIENTS.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs><rect width='800' height='450' fill='url(%23g)'/></svg>`;
  return `data:image/svg+xml;utf8,${svg.replace(/#/g, "%23")}`;
}

const TOPICS = [
  "All",
  "Faith & Trust",
  "Bible Study",
  "Family",
  "New World",
  "Ministry",
  "Meeting Prep",
  "Endurance",
  "Creation",
  "Jehovah's Kingdom",
  "Comfort & Hope",
];

const PAGE_SIZE = 8;

function authorInitial(name: string | null | undefined) {
  return (name ?? "A")[0].toUpperCase();
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
  created_at: string;
  author_id: string;
  like_count: number;
  read_time_minutes: number;
  tags: string[];
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

interface Writer {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  post_count: number;
}

interface Props {
  navigate: (page: string, params?: Record<string, unknown>) => void;
  user: { id: string } | null;
}

export default function DiscoveryPage({ navigate, user }: Props) {
  const { t } = useTranslation();
  const [activeTopic, setActiveTopic] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(searchQuery);

  const { data: featuredPost } = useFeaturedPost();
  const { data: trendingPosts = [] } = useTrendingPosts();
  const { data: activeWriters = [] } = useActiveWriters();

  const isFiltering = deferredQuery.length > 1 || activeTopic !== "All";
  const { data: searchResults = [], isLoading: searchLoading } = useSearchPosts(
    deferredQuery.length > 1 ? deferredQuery : "",
    activeTopic !== "All" ? activeTopic : null,
  );
  const { data: allPosts = [], isLoading: allLoading } = usePublishedPosts();

  const displayPosts = (isFiltering ? searchResults : allPosts) as unknown as Post[];
  const isLoading = isFiltering ? searchLoading : allLoading;
  const visiblePosts = displayPosts.slice(0, page * PAGE_SIZE);
  const hasMore = displayPosts.length > visiblePosts.length;

  const handleTopicClick = (topic: string) => {
    setActiveTopic(topic);
    setPage(1);
  };

  return (
    <div className="disc-wrap">
      {!user && (
        <div className="disc-back-bar">
          <button
            className="disc-back-btn"
            onClick={() => { history.pushState(null, "", "/"); window.dispatchEvent(new PopStateEvent("popstate")); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Home
          </button>
        </div>
      )}
      {/* Hero */}
      <div className="disc-hero">
        <h1 className="disc-hero-title">Explore JW Study Articles</h1>
        <p className="disc-hero-sub">Written by the community, for the community</p>
        <div className="disc-search-bar">
          <span className="disc-search-icon">🔍</span>
          <input
            className="disc-search-input"
            placeholder={t("blog.searchPlaceholder")}
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Topic pills */}
      <div className="disc-pills-wrap">
        {TOPICS.map(topic => (
          <button
            key={topic}
            className={`disc-pill${activeTopic === topic ? " active" : ""}`}
            onClick={() => handleTopicClick(topic)}
          >{topic}</button>
        ))}
      </div>

      {/* Top strip: write + active writers */}
      {(user || (activeWriters as unknown as Writer[]).length > 0) && (
        <div className="disc-top-strip">
          {user && (
            <div className="disc-sidebar-widget disc-top-strip-write">
              <div className="disc-sidebar-label">Share your thoughts</div>
              <button
                className="btn btn-primary"
                style={{ width: "100%", padding: "10px", fontSize: 14, marginBottom: 8 }}
                onClick={() => navigate("blogNew")}
              >✍️ Write an article</button>
              <button
                className="btn btn-secondary"
                style={{ width: "100%", padding: "9px", fontSize: 13 }}
                onClick={() => navigate("myPosts")}
              >📄 My Posts</button>
            </div>
          )}
          {(activeWriters as unknown as Writer[]).length > 0 && (
            <div className="disc-sidebar-widget disc-top-strip-writers">
              <div className="disc-sidebar-label">Active Writers</div>
              {(activeWriters as unknown as Writer[]).map(writer => (
                <div key={writer.id} className="disc-writer-row">
                  <div className="disc-writer-avatar">
                    {writer.avatar_url
                      ? <img src={writer.avatar_url} alt="" />
                      : authorInitial(writer.display_name)
                    }
                  </div>
                  <div>
                    <div className="disc-writer-name">{writer.display_name ?? "Anonymous"}</div>
                    <div className="disc-writer-count">
                      {writer.post_count} post{writer.post_count !== 1 ? "s" : ""} this month
                    </div>
                  </div>
                  <button
                    className="disc-writer-view"
                    onClick={() => navigate("publicProfile", { userId: writer.id })}
                  >{t("blog.viewBtn")}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="disc-layout">
        <div>
          {/* Featured post */}
          {featuredPost && !isFiltering && (
            <button
              type="button"
              className="disc-featured w-full text-left bg-transparent p-0 border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
              onClick={() => navigate("blog", { slug: (featuredPost as unknown as Post).slug })}
              aria-label={(featuredPost as unknown as Post).title}
            >
              <img
                className="disc-featured-img"
                src={(featuredPost as unknown as Post).cover_url || fallbackImage((featuredPost as unknown as Post).id)}
                alt={(featuredPost as unknown as Post).title}
                width={1200}
                height={525}
                fetchPriority="high"
                onError={e => { e.currentTarget.src = fallbackImage((featuredPost as unknown as Post).id); }}
              />
              <div className="disc-featured-body">
                {(featuredPost as unknown as Post).tags?.[0] && (
                  <div className="disc-featured-tag">{(featuredPost as unknown as Post).tags[0]}</div>
                )}
                <div className="disc-featured-title">{(featuredPost as unknown as Post).title}</div>
                {(featuredPost as unknown as Post).excerpt && (
                  <div className="disc-featured-excerpt">{(featuredPost as unknown as Post).excerpt}</div>
                )}
                <div className="disc-featured-meta">
                  <div className="disc-featured-avatar">
                    {(featuredPost as unknown as Post).profiles?.avatar_url
                      ? <img src={(featuredPost as unknown as Post).profiles!.avatar_url!} alt="" />
                      : authorInitial((featuredPost as unknown as Post).profiles?.display_name)
                    }
                  </div>
                  <span>{(featuredPost as unknown as Post).profiles?.display_name ?? "Anonymous"}</span>
                  <span className="disc-card-dot">·</span>
                  <span>{formatDate((featuredPost as unknown as Post).created_at, "short")}</span>
                  {(featuredPost as unknown as Post).read_time_minutes > 0 && (
                    <><span className="disc-card-dot">·</span><span>{(featuredPost as unknown as Post).read_time_minutes} min</span></>
                  )}
                </div>
              </div>
            </button>
          )}

          {/* Post grid */}
          {isLoading ? (
            <div className="disc-empty">{t("blog.loading")}</div>
          ) : visiblePosts.length === 0 ? (
            <div className="disc-empty">{t("blog.noArticlesFound")}</div>
          ) : (
            <div className="disc-grid">
              {visiblePosts.map(post => (
                <button
                  key={post.id}
                  type="button"
                  className="disc-card w-full text-left bg-transparent p-0 border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                  onClick={() => navigate("blog", { slug: post.slug })}
                  aria-label={post.title}
                >
                  <img
                    className="disc-card-img"
                    src={post.cover_url || fallbackImage(post.id)}
                    alt={post.title}
                    width={1200}
                    height={675}
                    loading="lazy"
                    onError={e => { e.currentTarget.src = fallbackImage(post.id); }}
                  />
                  <div className="disc-card-body">
                    {post.tags?.[0] && <div className="disc-card-tag">{post.tags[0]}</div>}
                    <div className="disc-card-title">{post.title}</div>
                    {post.excerpt && <div className="disc-card-excerpt">{post.excerpt}</div>}
                    <div className="disc-card-foot">
                      <div className="disc-card-avatar">
                        {post.profiles?.avatar_url
                          ? <img src={post.profiles.avatar_url} alt="" />
                          : authorInitial(post.profiles?.display_name)
                        }
                      </div>
                      <span>{post.profiles?.display_name ?? "Anonymous"}</span>
                      <span className="disc-card-dot">·</span>
                      <span>{formatDate(post.created_at, "short")}</span>
                      {post.read_time_minutes > 0 && (
                        <><span className="disc-card-dot">·</span><span>{post.read_time_minutes} min</span></>
                      )}
                      <span className="disc-card-dot">·</span>
                      <span>❤️ {post.like_count}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {hasMore && (
            <button className="disc-load-more" onClick={() => setPage(p => p + 1)}>
              Load more articles
            </button>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="disc-sidebar">
          {(trendingPosts as unknown as Post[]).length > 0 && (
            <div className="disc-sidebar-widget">
              <div className="disc-sidebar-label">Trending This Week</div>
              {(trendingPosts as unknown as Post[]).map((post, i) => (
                <button
                  key={post.id}
                  type="button"
                  className="disc-trending-item w-full text-left bg-transparent border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                  onClick={() => navigate("blog", { slug: post.slug })}
                  aria-label={post.title}
                >
                  <span className="disc-trending-num">{i + 1}</span>
                  <span className="disc-trending-title">{post.title}</span>
                </button>
              ))}
            </div>
          )}

        </aside>
      </div>
    </div>
  );
}
