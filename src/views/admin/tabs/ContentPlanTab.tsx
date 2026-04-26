import { useState, useMemo, useCallback, Fragment } from "react";
import { CONTENT_PLAN } from "../../../data/contentPlan";
import { useAllAdminPosts, useUpdatePost } from "../../../hooks/useBlog";
import "../../../styles/content-plan.css";

type Status = "not_started" | "draft" | "published";

interface PostInfo { id: string; published: boolean; }

function buildPrompt(article: typeof CONTENT_PLAN[number]) {
  return `Write a ~${article.estWords}-word blog article for JW Study on the following topic:

Title: "${article.title}"
Target keywords: ${article.keywords.join(", ")}
Search intent: ${article.searchIntent}
Estimated length: ~${article.estWords} words
JW / WOL sources to reference: ${article.wolSources.join(", ")}
TikTok hook idea: "${article.tiktokHook}"

Audience: Jehovah's Witnesses and sincere Bible students
Tone: Warm, spiritually encouraging, grounded in scripture and JW publications
Format: SEO-optimised blog post, H2 subheadings, short paragraphs
Use NWT terminology throughout (Jehovah, Hebrew/Christian Greek Scriptures, pure worship, God's Kingdom, etc.)
Do not reference outside commentaries or other denominations.

CTA / closing section, IMPORTANT:
Always close the article by pointing the reader to jw.org as the primary source for deeper study. Do NOT use phrases like "Start Your Free Study Journey," "Free Bible Study," or any wording that positions this blog (jwstudy.org) as the source of spiritual study. That framing belongs exclusively to jw.org and its official resources. Our blog is a companion, jw.org is the authoritative source.

Close with a short paragraph that:
1. Recommends jw.org as the primary place for deeper Bible teaching on this topic
2. Links to https://hub.jw.org/request-visit/en/request so the reader can request a free personal Bible study
3. Links to https://hub.jw.org/meetings/en?q=%7B%22meetingType%22%3A%22meetings%22%2C%22location%22%3A%22%22%7D so the reader can find a local meeting
Keep the tone reverent toward Jehovah's organization and its official materials.`;
}

export function ContentPlanTab({ navigate }: { navigate: (page: string, params?: Record<string, unknown>) => void }) {
  const { data: allPosts = [], isLoading } = useAllAdminPosts();
  const updatePost = useUpdatePost(undefined);
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const postMap = useMemo(() => {
    const map = new Map<string, PostInfo>();
    for (const p of allPosts) map.set(p.slug, { id: p.id, published: p.published });
    return map;
  }, [allPosts]);

  function getStatus(slug: string): Status {
    const p = postMap.get(slug);
    if (!p) return "not_started";
    return p.published ? "published" : "draft";
  }

  function handlePublish(slug: string) {
    const p = postMap.get(slug);
    if (!p) return;
    setPublishing(slug);
    updatePost.mutate(
      { postId: p.id, updates: { published: true } },
      { onSettled: () => setPublishing(null) }
    );
  }

  const handleCopy = useCallback((article: typeof CONTENT_PLAN[number]) => {
    navigator.clipboard.writeText(buildPrompt(article));
    setCopied(article.id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const published  = CONTENT_PLAN.filter(a => getStatus(a.slug) === "published").length;
  const drafts     = CONTENT_PLAN.filter(a => getStatus(a.slug) === "draft").length;
  const notStarted = CONTENT_PLAN.filter(a => getStatus(a.slug) === "not_started").length;
  const pct        = Math.round((published / CONTENT_PLAN.length) * 100);

  if (isLoading) {
    return (
      <div className="cp-wrap">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8, marginBottom: 8 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="cp-wrap">
      {/* Progress summary */}
      <div className="cp-progress">
        <div className="cp-progress-stat">
          <span style={{ color: "#22c55e" }}>✓</span>
          <strong>{published}</strong> Published
        </div>
        <div className="cp-progress-stat">
          <span style={{ color: "#f59e0b" }}>✎</span>
          <strong>{drafts}</strong> {drafts === 1 ? "Draft" : "Drafts"}
        </div>
        <div className="cp-progress-stat">
          <span style={{ color: "#9ca3af" }}>○</span>
          <strong>{notStarted}</strong> Not Started
        </div>
        <div className="cp-progress-bar-wrap">
          <div className="cp-progress-bar-fill" style={{ width: pct + "%" }} />
        </div>
        <div className="cp-progress-pct">{pct}%</div>
      </div>

      {/* Table */}
      <div className="cp-table-wrap">
        <table className="cp-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Title</th>
              <th style={{ width: 80 }}>Priority</th>
              <th>Keywords</th>
              <th style={{ width: 72, textAlign: "right" }}>Words</th>
              <th style={{ width: 110 }}>Status</th>
              <th style={{ width: 72, textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {CONTENT_PLAN.map(article => {
              const status = getStatus(article.slug);
              const isOpen = openRow === article.id;
              return (
                <Fragment key={article.id}>
                  <tr
                    className={`cp-row${isOpen ? " cp-row--open" : ""}`}
                    onClick={e => {
                      if ((e.target as HTMLElement).closest("button, a")) return;
                      setOpenRow(isOpen ? null : article.id);
                    }}
                  >
                    <td className="cp-num">{article.id}</td>
                    <td className="cp-title-cell">{article.title}</td>
                    <td>
                      <span className={`cp-pill cp-pill--${article.priority.toLowerCase()}`}>
                        {article.priority}
                      </span>
                    </td>
                    <td className="cp-keywords">{article.keywords.slice(0, 2).join(", ")}</td>
                    <td style={{ textAlign: "right", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                      {article.estWords.toLocaleString()}
                    </td>
                    <td>
                      <span className={`cp-status cp-status--${status.replace(/_/g, "-")}`}>
                        {status === "not_started" ? "Not Started" : status === "draft" ? "Draft" : "Published"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }} onClick={e => e.stopPropagation()}>
                      {status === "published" && (
                        <a
                          className="cp-action-btn cp-action-btn--view"
                          href={`/blog/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      )}
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="cp-expand-row">
                      <td colSpan={7}>
                        <div className="cp-expand-inner">
                          {/* Meta details */}
                          <div>
                            <div className="cp-expand-label">Search Intent</div>
                            <div className="cp-expand-value">{article.searchIntent}</div>
                          </div>
                          <div>
                            <div className="cp-expand-label">TikTok Hook</div>
                            <div className="cp-expand-value cp-expand-value--muted">"{article.tiktokHook}"</div>
                          </div>
                          <div>
                            <div className="cp-expand-label">WOL Sources</div>
                            <div className="cp-expand-value">{article.wolSources.join(" · ")}</div>
                          </div>
                          <div>
                            <div className="cp-expand-label">Internal Links</div>
                            <div className="cp-expand-value">
                              {article.internalLinks.map(id => `#${id}`).join(", ")}
                            </div>
                          </div>
                          <div>
                            <div className="cp-expand-label">All Keywords</div>
                            <div className="cp-expand-value">{article.keywords.join(", ")}</div>
                          </div>

                          {/* Writing prompt */}
                          {status !== "published" && (
                            <div style={{ gridColumn: "1 / -1" }}>
                              <div className="cp-expand-label" style={{ marginBottom: 6 }}>AI Writing Prompt</div>
                              <div className="cp-prompt-box">
                                <pre className="cp-prompt-text">{buildPrompt(article)}</pre>
                                <button
                                  className="cp-prompt-copy"
                                  onClick={() => handleCopy(article)}
                                >
                                  {copied === article.id ? "✓ Copied!" : "Copy"}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Actions inside expanded row */}
                          {status !== "published" && (
                            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, paddingTop: 4 }}>
                              {status === "not_started" && (
                                <button
                                  className="cp-action-btn cp-action-btn--write"
                                  onClick={() => navigate("blogNew", { prefillTitle: article.title })}
                                >
                                  Write Post →
                                </button>
                              )}
                              {status === "draft" && (
                                <button
                                  className="cp-action-btn cp-action-btn--publish"
                                  disabled={publishing === article.slug}
                                  onClick={() => handlePublish(article.slug)}
                                >
                                  {publishing === article.slug ? "Publishing…" : "Mark Published"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
