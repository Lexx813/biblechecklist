# Content Plan Admin Tab — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only "Content Plan" tab to the AdminPage that displays the 20-article editorial plan as a polished table with live published status and per-row write/publish/view actions.

**Architecture:** Static article data lives in `src/data/contentPlan.ts`. A new `useAllAdminPosts` hook fetches all blog posts (regardless of published state) so the tab can derive per-article status by matching slugs. A `ContentPlanTab` component renders the table with expandable rows, status pills, and action buttons. AdminPage gets one new import, one new tab button, and one new content render.

**Tech Stack:** React, TanStack Query, Supabase JS client, existing admin CSS classes

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/data/contentPlan.ts` | Static 20-article data |
| Modify | `src/api/blog.ts` | Add `listAll()` admin query |
| Modify | `src/hooks/useBlog.ts` | Add `useAllAdminPosts()` hook |
| Create | `src/views/admin/tabs/ContentPlanTab.tsx` | Tab component |
| Create | `src/styles/content-plan.css` | Tab-scoped styles |
| Modify | `src/views/admin/AdminPage.tsx` | Wire tab button + content |
| Modify | `src/views/blog/WriterPage.tsx` | Accept `prefillTitle` navigate param |

---

## Task 1: Static Data File

**Files:**
- Create: `src/data/contentPlan.ts`

- [ ] **Step 1: Create the file**

```ts
export interface ContentPlanArticle {
  id: number;
  title: string;
  slug: string;
  priority: "High" | "Medium";
  searchIntent: string;
  keywords: string[];
  estWords: number;
  wolSources: string[];
  internalLinks: number[];
  tiktokHook: string;
}

export const CONTENT_PLAN: ContentPlanArticle[] = [
  {
    id: 1,
    title: "Does John 1:1 prove Jesus is God?",
    slug: "john-1-1-jesus-god",
    priority: "High",
    searchIntent: "Apologetic answer to Trinitarian claim",
    keywords: ["john 1:1 trinity", "jesus is god john 1:1", "nwt john 1:1"],
    estWords: 3500,
    wolSources: ["NWT appendix", "Insight (Word, Logos)", "Reasoning book"],
    internalLinks: [6, 7, 12],
    tiktokHook: "The Greek word Trinitarians don't want you to understand",
  },
  {
    id: 2,
    title: "Is Jesus the same as Jehovah?",
    slug: "is-jesus-same-as-jehovah",
    priority: "High",
    searchIntent: "Core identity question, high search volume",
    keywords: ["jesus is jehovah", "jesus and god same", "jw view jesus"],
    estWords: 3000,
    wolSources: ["Insight (Jesus Christ, Jehovah)", "Reasoning book"],
    internalLinks: [1, 3, 4],
    tiktokHook: "If Jesus is God, why did He pray to Himself?",
  },
  {
    id: 3,
    title: "Who is the archangel Michael in the Bible?",
    slug: "archangel-michael-bible",
    priority: "High",
    searchIntent: "Educational, connects to Jesus identity",
    keywords: ["michael archangel jesus", "michael in bible", "daniel 12"],
    estWords: 2800,
    wolSources: ["Insight (Michael)", "Daniel's Prophecy (dp)"],
    internalLinks: [2, 4, 10],
    tiktokHook: "The angel with the same voice as Jesus — who is he?",
  },
  {
    id: 4,
    title: "Why do Jehovah's Witnesses not celebrate Christmas?",
    slug: "jehovahs-witnesses-christmas",
    priority: "High",
    searchIntent: "Explanatory, addresses common question from non-JWs",
    keywords: ["jw christmas", "witnesses no christmas", "pagan christmas origins"],
    estWords: 2500,
    wolSources: ["Reasoning book (Holidays)", "Insight (Festivals)"],
    internalLinks: [11, 15],
    tiktokHook: "The real reason I stopped celebrating Christmas",
  },
  {
    id: 5,
    title: "What does the Bible really teach about hell?",
    slug: "bible-truth-about-hell",
    priority: "High",
    searchIntent: "Doctrinal contrast with mainstream Christianity",
    keywords: ["hell fire truth", "what is sheol hades", "bible teach hellfire"],
    estWords: 3200,
    wolSources: ["Reasoning book (Hell)", "Insight (Hell, Sheol, Gehenna)"],
    internalLinks: [14, 16],
    tiktokHook: "Hell isn't what your pastor told you it was",
  },
  {
    id: 6,
    title: "Is the New World Translation accurate?",
    slug: "new-world-translation-accurate",
    priority: "High",
    searchIntent: "Defensive, high-value for doubting readers",
    keywords: ["nwt accuracy", "new world translation legitimate", "nwt scholars"],
    estWords: 4000,
    wolSources: ["NWT references", "Insight (Bible)", "Scholars' comments"],
    internalLinks: [1, 7, 17],
    tiktokHook: "Why scholars attack the NWT and what they won't admit",
  },
  {
    id: 7,
    title: "Where did the Trinity doctrine actually come from?",
    slug: "trinity-doctrine-history",
    priority: "High",
    searchIntent: "Historical, strong for silent readers",
    keywords: ["trinity history", "council of nicaea", "trinity invented"],
    estWords: 3500,
    wolSources: ["Reasoning book (Trinity)", "Should You Believe in the Trinity brochure"],
    internalLinks: [1, 2, 12],
    tiktokHook: "The Trinity wasn't in the Bible — here's when it was invented",
  },
  {
    id: 8,
    title: "Who are the 144,000 in Revelation?",
    slug: "144000-revelation-jehovahs-witnesses",
    priority: "Medium",
    searchIntent: "Distinctive JW teaching, high curiosity topic",
    keywords: ["144000 jehovah witnesses", "144000 revelation", "great crowd"],
    estWords: 2800,
    wolSources: ["Revelation Climax (re)", "Insight (One Hundred Forty-Four Thousand)"],
    internalLinks: [9, 13],
    tiktokHook: "Only 144,000 go to heaven — what happens to everyone else?",
  },
  {
    id: 9,
    title: "Will everyone go to heaven after they die?",
    slug: "will-everyone-go-to-heaven",
    priority: "Medium",
    searchIntent: "Doctrinal, addresses afterlife beliefs",
    keywords: ["everyone goes heaven", "earthly paradise", "jw afterlife"],
    estWords: 2500,
    wolSources: ["Reasoning book (Heaven, Earth)", "Insight (Paradise)"],
    internalLinks: [5, 8, 13],
    tiktokHook: "Heaven was never God's plan for humanity",
  },
  {
    id: 10,
    title: "Is Jesus really God's firstborn creation?",
    slug: "jesus-firstborn-creation",
    priority: "Medium",
    searchIntent: "Christology, pairs with Trinity articles",
    keywords: ["jesus firstborn", "colossians 1:15", "proverbs 8 wisdom"],
    estWords: 3000,
    wolSources: ["Insight (Jesus Christ, Firstborn)", "Reasoning book"],
    internalLinks: [2, 3, 7],
    tiktokHook: "Colossians 1:15 says Jesus was created — yes, really",
  },
  {
    id: 11,
    title: "Why don't Jehovah's Witnesses vote or join the military?",
    slug: "jehovahs-witnesses-neutrality-voting",
    priority: "Medium",
    searchIntent: "Lifestyle apologetic, explains neutrality",
    keywords: ["jw neutrality", "witnesses military", "jw politics voting"],
    estWords: 2500,
    wolSources: ["Reasoning book (Neutrality)", "Insight (Neutrality)"],
    internalLinks: [4, 15, 18],
    tiktokHook: "Why I'll never vote — and it's not what you think",
  },
  {
    id: 12,
    title: "Does the Bible say the Holy Spirit is a person?",
    slug: "holy-spirit-person-or-force",
    priority: "High",
    searchIntent: "Pneumatology, core Trinity sub-topic",
    keywords: ["holy spirit person or force", "holy spirit jw", "acts 2 pentecost"],
    estWords: 3000,
    wolSources: ["Reasoning book (Spirit)", "Insight (Holy Spirit)"],
    internalLinks: [1, 7],
    tiktokHook: "The Holy Spirit is NOT a person — here's the proof",
  },
  {
    id: 13,
    title: "What is God's Kingdom and when did it begin?",
    slug: "gods-kingdom-1914",
    priority: "Medium",
    searchIntent: "Central JW teaching, 1914 doctrine",
    keywords: ["gods kingdom 1914", "kingdom of god", "jw kingdom hope"],
    estWords: 3200,
    wolSources: ["Pure Worship (rr)", "Daniel's Prophecy (dp)", "Insight (Kingdom)"],
    internalLinks: [8, 9],
    tiktokHook: "1914 — the year everything changed and nobody noticed",
  },
  {
    id: 14,
    title: "Why do Witnesses refuse blood transfusions?",
    slug: "jehovahs-witnesses-blood-transfusions",
    priority: "Medium",
    searchIntent: "Controversial topic, needs careful treatment",
    keywords: ["jw blood transfusion", "why no blood", "acts 15 blood"],
    estWords: 3500,
    wolSources: ["Insight (Blood)", "Reasoning book (Blood)"],
    internalLinks: [11, 15],
    tiktokHook: "The Bible command most Christians ignore completely",
  },
  {
    id: 15,
    title: "Are Jehovah's Witnesses a cult?",
    slug: "are-jehovahs-witnesses-a-cult",
    priority: "High",
    searchIntent: "Highest-value apologetic, addresses common accusation",
    keywords: ["jw cult", "bite model witnesses", "jehovah witness mind control"],
    estWords: 4500,
    wolSources: ["Proclaimers (jv)", "Organized (od)", "Insight"],
    internalLinks: [4, 11, 16],
    tiktokHook: "Answering the 'cult' accusation without getting defensive",
  },
  {
    id: 16,
    title: "Why do Witnesses practice disfellowshipping?",
    slug: "jehovahs-witnesses-disfellowshipping",
    priority: "High",
    searchIntent: "Explains shunning practice, high search volume",
    keywords: ["jw disfellowshipping", "witnesses shunning", "1 corinthians 5"],
    estWords: 3500,
    wolSources: ["Organized (od)", "Shepherd the Flock (ks)", "Insight (Expelling)"],
    internalLinks: [5, 15],
    tiktokHook: "The biblical case for shunning — and why it's actually loving",
  },
  {
    id: 17,
    title: "Who founded the Jehovah's Witnesses and when?",
    slug: "jehovahs-witnesses-history-founded",
    priority: "Medium",
    searchIntent: "Historical origin, beats competitor sites",
    keywords: ["charles taze russell", "jw history", "watchtower founded"],
    estWords: 3000,
    wolSources: ["Proclaimers (jv)"],
    internalLinks: [6, 13],
    tiktokHook: "The Bible student who started it all — and the lie about him",
  },
  {
    id: 18,
    title: "Do Jehovah's Witnesses believe in Jesus?",
    slug: "do-jehovahs-witnesses-believe-in-jesus",
    priority: "Medium",
    searchIntent: "Corrects common misconception from outsiders",
    keywords: ["jw believe in jesus", "witnesses jesus christ", "jw christian"],
    estWords: 2500,
    wolSources: ["Reasoning book (Jesus Christ)", "Insight"],
    internalLinks: [2, 4, 10],
    tiktokHook: "Yes, we believe in Jesus — here's what that actually means",
  },
  {
    id: 19,
    title: "What does the Bible say about the end of the world?",
    slug: "bible-end-of-world-last-days",
    priority: "Medium",
    searchIntent: "Eschatology, evergreen high search volume",
    keywords: ["end of world bible", "last days signs", "armageddon bible"],
    estWords: 3500,
    wolSources: ["Pure Worship (rr)", "Revelation Climax (re)", "Insight (Last Days)"],
    internalLinks: [13, 20],
    tiktokHook: "The end of the world is closer than your pastor admits",
  },
  {
    id: 20,
    title: "Why do Witnesses preach door-to-door?",
    slug: "why-jehovahs-witnesses-preach-door-to-door",
    priority: "Medium",
    searchIntent: "Explains ministry, addresses irritation pushback",
    keywords: ["jw door to door", "why witnesses preach", "matthew 24:14"],
    estWords: 2500,
    wolSources: ["Reasoning book (Preaching)", "Insight (Preaching)"],
    internalLinks: [11, 15],
    tiktokHook: "The real reason we knock on your door — it's not what you think",
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/data/contentPlan.ts
git commit -m "feat(content-plan): add static editorial content plan data"
```

---

## Task 2: Admin API Method + Hook

**Files:**
- Modify: `src/api/blog.ts`
- Modify: `src/hooks/useBlog.ts`

- [ ] **Step 1: Add `listAll` to `src/api/blog.ts`**

Find the `blogApi` object and add this method after `listMine`:

```ts
listAll: async (): Promise<{ id: string; slug: string; published: boolean }[]> => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, slug, published")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; slug: string; published: boolean }[];
},
```

- [ ] **Step 2: Add `useAllAdminPosts` to `src/hooks/useBlog.ts`**

Add after `useMyPosts`:

```ts
export function useAllAdminPosts() {
  return useQuery({
    queryKey: ["blog", "all-admin"],
    queryFn: () => blogApi.listAll(),
    staleTime: 30 * 1000,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/api/blog.ts src/hooks/useBlog.ts
git commit -m "feat(content-plan): add listAll admin API and useAllAdminPosts hook"
```

---

## Task 3: ContentPlanTab Component

**Files:**
- Create: `src/views/admin/tabs/ContentPlanTab.tsx`
- Create: `src/styles/content-plan.css`

- [ ] **Step 1: Create the CSS file at `src/styles/content-plan.css`**

```css
/* ── Content Plan Tab ─────────────────────────────────────── */
.cp-wrap { padding: 24px; }

.cp-progress {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: var(--color-surface-raised, rgba(255,255,255,0.04));
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.cp-progress-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
}
.cp-progress-stat strong { color: var(--text-primary); font-weight: 600; }
.cp-progress-bar-wrap {
  flex: 1;
  min-width: 120px;
  height: 6px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
}
.cp-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6A3DAA, #9333ea);
  border-radius: 999px;
  transition: width 0.4s ease;
}
.cp-progress-pct {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 36px;
  text-align: right;
}

/* Table */
.cp-table-wrap {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.cp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.cp-table thead th {
  background: var(--color-surface-raised, rgba(255,255,255,0.04));
  padding: 10px 12px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.cp-table thead th:last-child { text-align: right; }
.cp-row {
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.1s;
}
.cp-row:last-child { border-bottom: none; }
.cp-row:hover { background: var(--color-surface-raised, rgba(255,255,255,0.03)); }
.cp-row.cp-row--open { background: var(--color-surface-raised, rgba(255,255,255,0.03)); }
.cp-row td { padding: 12px 12px; vertical-align: middle; }
.cp-row td:last-child { text-align: right; }

.cp-num { color: var(--text-muted); font-weight: 600; width: 40px; }
.cp-title { font-weight: 600; color: var(--text-primary); max-width: 280px; }
.cp-keywords { color: var(--text-muted); font-size: 12px; max-width: 200px; }

/* Priority pills */
.cp-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  white-space: nowrap;
}
.cp-pill--high { background: rgba(139,92,246,0.15); color: #a855f7; }
.cp-pill--medium { background: rgba(20,184,166,0.15); color: #14b8a6; }

/* Status pills */
.cp-status { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.cp-status--not-started { background: rgba(156,163,175,0.12); color: #9ca3af; }
.cp-status--draft { background: rgba(245,158,11,0.12); color: #f59e0b; }
.cp-status--published { background: rgba(34,197,94,0.12); color: #22c55e; }

/* Action buttons */
.cp-action-btn {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
}
.cp-action-btn:disabled { opacity: 0.5; cursor: default; }
.cp-action-btn--write { background: linear-gradient(135deg, #6A3DAA, #9333ea); color: #fff; }
.cp-action-btn--publish { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
.cp-action-btn--view { background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.25); text-decoration: none; display: inline-flex; align-items: center; }
.cp-action-btn:hover:not(:disabled) { opacity: 0.82; }

/* Expand row */
.cp-expand-row td {
  padding: 0;
  border-bottom: 1px solid var(--border);
}
.cp-expand-inner {
  padding: 16px 52px 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 32px;
  background: var(--color-surface-raised, rgba(255,255,255,0.02));
}
.cp-expand-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 4px;
}
.cp-expand-value { font-size: 13px; color: var(--text-primary); line-height: 1.5; }
.cp-expand-value--muted { color: var(--text-muted); font-style: italic; }

@media (max-width: 768px) {
  .cp-wrap { padding: 12px; }
  .cp-table thead th:nth-child(4),
  .cp-table .cp-keywords,
  .cp-table thead th:nth-child(5),
  .cp-table td:nth-child(5) { display: none; }
  .cp-expand-inner { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Create `src/views/admin/tabs/ContentPlanTab.tsx`**

```tsx
import { useState, useMemo } from "react";
import { CONTENT_PLAN } from "../../../data/contentPlan";
import { useAllAdminPosts } from "../../../hooks/useBlog";
import { useUpdatePost } from "../../../hooks/useBlog";
import "../../../styles/content-plan.css";

type Status = "not_started" | "draft" | "published";

interface PostInfo { id: string; published: boolean; }

export function ContentPlanTab({ navigate }: { navigate: (page: string, params?: Record<string, unknown>) => void }) {
  const { data: allPosts = [], isLoading } = useAllAdminPosts();
  const updatePost = useUpdatePost(undefined);
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

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

  const published = CONTENT_PLAN.filter(a => getStatus(a.slug) === "published").length;
  const drafts = CONTENT_PLAN.filter(a => getStatus(a.slug) === "draft").length;
  const notStarted = CONTENT_PLAN.filter(a => getStatus(a.slug) === "not_started").length;
  const pct = Math.round((published / CONTENT_PLAN.length) * 100);

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
              <th style={{ width: 100 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {CONTENT_PLAN.map(article => {
              const status = getStatus(article.slug);
              const isOpen = openRow === article.id;
              return (
                <>
                  <tr
                    key={article.id}
                    className={`cp-row${isOpen ? " cp-row--open" : ""}`}
                    onClick={e => {
                      if ((e.target as HTMLElement).closest("button, a")) return;
                      setOpenRow(isOpen ? null : article.id);
                    }}
                  >
                    <td className="cp-num">{article.id}</td>
                    <td className="cp-title">{article.title}</td>
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
                      <span className={`cp-status cp-status--${status.replace("_", "-")}`}>
                        {status === "not_started" ? "Not Started" : status === "draft" ? "Draft" : "Published"}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      {status === "not_started" && (
                        <button
                          className="cp-action-btn cp-action-btn--write"
                          onClick={() => navigate("blogNew", { prefillTitle: article.title })}
                        >
                          Write
                        </button>
                      )}
                      {status === "draft" && (
                        <button
                          className="cp-action-btn cp-action-btn--publish"
                          disabled={publishing === article.slug}
                          onClick={() => handlePublish(article.slug)}
                        >
                          {publishing === article.slug ? "…" : "Publish"}
                        </button>
                      )}
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
                    <tr key={`${article.id}-expand`} className="cp-expand-row">
                      <td colSpan={7}>
                        <div className="cp-expand-inner">
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
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/views/admin/tabs/ContentPlanTab.tsx src/styles/content-plan.css
git commit -m "feat(content-plan): add ContentPlanTab component and styles"
```

---

## Task 4: Wire Into AdminPage

**Files:**
- Modify: `src/views/admin/AdminPage.tsx`

- [ ] **Step 1: Add import at the top of `AdminPage.tsx`** (after the existing imports)

```tsx
import { ContentPlanTab } from "./tabs/ContentPlanTab";
```

- [ ] **Step 2: Add tab button** — insert after the `campaigns` button block (before the closing `</div>` of `.admin-tabs`):

```tsx
          {isCurrentUserAdmin && (
            <button className={`admin-tab${tab === "contentPlan" ? " admin-tab--active" : ""}`} onClick={() => setTab("contentPlan")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Content Plan
            </button>
          )}
```

- [ ] **Step 3: Add tab content** — insert after the `campaigns` content line (before the closing `</div>` of `.admin-content`):

```tsx
        {tab === "contentPlan" && isCurrentUserAdmin && <ContentPlanTab navigate={navigate} />}
```

- [ ] **Step 4: Commit**

```bash
git add src/views/admin/AdminPage.tsx
git commit -m "feat(content-plan): wire ContentPlanTab into AdminPage"
```

---

## Task 5: WriterPage Prefill Support

**Files:**
- Modify: `src/views/blog/WriterPage.tsx`

The "Write" button calls `navigate("blogNew", { prefillTitle: article.title })`. WriterPage needs to read this param and pre-fill the title field.

- [ ] **Step 1: Check how WriterPage receives navigate params**

Read `src/views/blog/WriterPage.tsx` lines 1–80 to find how props are received and what the initial `EditPost` state looks like (look for `useState` initializing `title`).

- [ ] **Step 2: Add `prefillTitle` prop and wire to initial state**

`WriterPage` receives its props from the parent navigate system. The exact prop name depends on what the navigate call threads through — check `src/AuthedApp.tsx` for how `blogNew` is rendered and what props it passes to `WriterPage`.

If `WriterPage` is rendered like:
```tsx
<WriterPage user={user} navigate={navigate} params={currentParams} ... />
```

Then add to `WriterPage`'s initial state:
```tsx
const [post, setPost] = useState<EditPost>({
  title: (params?.prefillTitle as string) ?? "",
  // ... rest of existing initial state unchanged
});
```

If the component initializes title differently (e.g. a separate `useState`), apply the same `params?.prefillTitle ?? ""` pattern to that state initializer.

- [ ] **Step 3: Commit**

```bash
git add src/views/blog/WriterPage.tsx
git commit -m "feat(content-plan): prefill WriterPage title from navigate params"
```

---

## Self-Review

**Spec coverage:**
- ✓ `src/data/contentPlan.ts` with all 20 articles — Task 1
- ✓ `useAllAdminPosts` hook — Task 2
- ✓ Status derivation (not_started / draft / published) — Task 3 `getStatus()`
- ✓ Progress summary bar — Task 3 progress section
- ✓ Full-width table with #, Title, Priority, Keywords, Est. Words, Status, Action — Task 3
- ✓ Expandable rows (Search intent, WOL sources, internal links, TikTok hook) — Task 3
- ✓ Priority pills (High = purple, Medium = teal) — Task 3 CSS + JSX
- ✓ Status pills (gray / amber / green) — Task 3 CSS + JSX
- ✓ Write → navigate("blogNew") with prefillTitle — Task 3 + Task 5
- ✓ Publish → updatePost mutation — Task 3
- ✓ View → new tab link — Task 3
- ✓ Admin-only tab in AdminPage — Task 4
- ✓ `listAll` API method — Task 2

**Placeholder scan:** No TBDs. Task 5 Step 2 has a conditional note because the exact prop shape requires reading WriterPage — the instruction covers both cases.

**Type consistency:** `ContentPlanArticle` defined in Task 1 and imported in Task 3. `useAllAdminPosts` returns `{ id, slug, published }[]` matching what `postMap` consumes. `useUpdatePost` called with `{ postId, updates: { published: true } }` matching its signature from `src/hooks/useBlog.ts`.
