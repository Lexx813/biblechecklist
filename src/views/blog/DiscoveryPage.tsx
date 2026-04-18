import { useState, useDeferredValue } from "react";
import {
  usePublishedPosts,
  useFeaturedPost,
  useTrendingPosts,
  useActiveWriters,
  useSearchPosts,
} from "../../hooks/useBlog";
import { formatDate } from "../../utils/formatters";
import "../../styles/blog-discovery.css";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1455541504462-57ebb2a9cec1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=800&q=80",
];

function hashId(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function fallbackImage(id: string) {
  return FALLBACK_IMAGES[hashId(id) % FALLBACK_IMAGES.length];
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
      {/* Hero */}
      <div className="disc-hero">
        <h1 className="disc-hero-title">Explore JW Study Articles</h1>
        <p className="disc-hero-sub">Written by the community, for the community</p>
        <div className="disc-search-bar">
          <span className="disc-search-icon">🔍</span>
          <input
            className="disc-search-input"
            placeholder="Search articles, topics, authors…"
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
                  >View</button>
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
            <div
              className="disc-featured"
              onClick={() => navigate("blog", { slug: (featuredPost as unknown as Post).slug })}
            >
              <img
                className="disc-featured-img"
                src={(featuredPost as unknown as Post).cover_url || fallbackImage((featuredPost as unknown as Post).id)}
                alt={(featuredPost as unknown as Post).title}
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
            </div>
          )}

          {/* Post grid */}
          {isLoading ? (
            <div className="disc-empty">Loading…</div>
          ) : visiblePosts.length === 0 ? (
            <div className="disc-empty">No articles found.</div>
          ) : (
            <div className="disc-grid">
              {visiblePosts.map(post => (
                <div
                  key={post.id}
                  className="disc-card"
                  onClick={() => navigate("blog", { slug: post.slug })}
                >
                  <img
                    className="disc-card-img"
                    src={post.cover_url || fallbackImage(post.id)}
                    alt={post.title}
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
                </div>
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
                <div
                  key={post.id}
                  className="disc-trending-item"
                  onClick={() => navigate("blog", { slug: post.slug })}
                >
                  <span className="disc-trending-num">{i + 1}</span>
                  <span className="disc-trending-title">{post.title}</span>
                </div>
              ))}
            </div>
          )}

        </aside>
      </div>
    </div>
  );
}
