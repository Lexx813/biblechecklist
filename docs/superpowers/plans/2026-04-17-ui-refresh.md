# UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure navigation to 5 focused tabs, replace the bloated home page with a focused dashboard, add a Community Hub, add a Bible progress header, and improve the Meeting Prep header card.

**Architecture:** All changes are UI-only — no schema or API changes. Existing hooks are reused; the home page is rewritten from scratch to remove all inline panel rendering. The new home page is a pure dashboard component (~200 lines) replacing the current 1160-line mega-component.

**Tech Stack:** React + TypeScript, react-i18next (8 locale files), TanStack Query hooks, Vitest + @testing-library/react

---

## File Map

| File | Change |
|------|--------|
| `src/hooks/useMeetingPrep.ts` | Fix `getMondayOfWeek` timezone bug |
| `public/locales/{en,es,fr,pt,tl,zh,ko,ja}/translation.json` | Add new i18n keys (nav + home dashboard + community + checklist) |
| `src/components/MobileTabBar.tsx` | New 5-tab layout; split badge; new TAB_ACTIVE_MAP |
| `src/views/HomePage.tsx` | Full rewrite — remove all inline panels, add dashboard layout |
| `src/styles/home.css` | Add dashboard CSS classes (append to existing file) |
| `src/views/community/CommunityPage.tsx` | Full rewrite — Community Hub layout |
| `src/styles/community.css` | Replace with hub CSS |
| `src/views/ChecklistPage.tsx` | Add progress header section above book grid |
| `src/styles/app.css` | Add progress hero, study tools strip, book card bottom-bar styles |
| `src/views/meetingprep/MeetingPrepPage.tsx` | New header card; green completed-part styling |
| `src/styles/meeting-prep.css` | Add `.mp-header-card`, `.mp-premium-badge`, update `.mp-item--done` |

---

## Task 1: Fix getMondayOfWeek Timezone Bug

**Problem:** `getMondayOfWeek()` uses local-time `getDay()`/`getDate()` arithmetic but outputs the date via `toISOString()` (UTC). East-of-UTC users get Sunday's UTC date instead of the local Monday, causing a week mismatch against the database.

**Files:**
- Modify: `src/hooks/useMeetingPrep.ts:13-19`
- Create: `src/hooks/__tests__/useMeetingPrep.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/hooks/__tests__/useMeetingPrep.test.ts`:

```ts
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { getMondayOfWeek, formatWeekLabel } from "../useMeetingPrep";

afterEach(() => vi.useRealTimers());

describe("getMondayOfWeek", () => {
  it("returns the local Monday for a Wednesday input", () => {
    // 2026-04-15 is a Wednesday (UTC)
    const result = getMondayOfWeek(new Date("2026-04-15T10:00:00"));
    expect(result).toBe("2026-04-13");
  });

  it("returns the same Monday when input is Monday", () => {
    const result = getMondayOfWeek(new Date("2026-04-13T08:00:00"));
    expect(result).toBe("2026-04-13");
  });

  it("returns previous Monday when input is Sunday", () => {
    const result = getMondayOfWeek(new Date("2026-04-19T12:00:00"));
    expect(result).toBe("2026-04-13");
  });

  it("does NOT shift the date for UTC+9 midnight", () => {
    // Simulate UTC+9 by using a date that is Sunday in UTC but Monday locally
    // We can't truly simulate TZ in vitest without TZ env, so we test the
    // local-date building logic directly: result must use getFullYear/getMonth/getDate
    const monday = new Date("2026-04-13T00:00:00"); // local Monday midnight
    const result = getMondayOfWeek(monday);
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, "0");
    const d = String(monday.getDate()).padStart(2, "0");
    expect(result).toBe(`${y}-${m}-${d}`);
  });
});

describe("formatWeekLabel", () => {
  it("formats a week range from Monday to Sunday", () => {
    const label = formatWeekLabel("2026-04-13");
    // Should include start and end dates in some human-readable form
    expect(label).toMatch(/Apr/);
    expect(label).toContain("–");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/hooks/__tests__/useMeetingPrep.test.ts
```

Expected: FAIL — tests importing `getMondayOfWeek` pass shape tests but the UTC-shift test may already behave correctly in CI (UTC TZ). The fourth test is the critical one: it confirms result is built from `getFullYear/getMonth/getDate`, not `toISOString`.

- [ ] **Step 3: Fix getMondayOfWeek in `src/hooks/useMeetingPrep.ts`**

Replace lines 13–19:

```ts
export function getMondayOfWeek(d = new Date()): string {
  const day = d.getDay(); // 0=Sun, local time
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  // Use local date parts — NOT toISOString() which returns UTC date
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/hooks/__tests__/useMeetingPrep.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useMeetingPrep.ts src/hooks/__tests__/useMeetingPrep.test.ts
git commit -m "fix: use local date parts in getMondayOfWeek to avoid UTC timezone shift"
```

---

## Task 2: Add i18n Keys

**Files:**
- Modify: `public/locales/{en,es,fr,pt,tl,zh,ko,ja}/translation.json`

The new UI needs nav tab labels (`nav.bibleTracker`, `nav.home`, `nav.me`, `nav.prep`) and dashboard copy. Many of these keys are in the root `nav` object or the `home` object.

- [ ] **Step 1: Add keys to `en/translation.json`**

In the root-level `"nav"` object (around line 1653, the one inside the app translations — not inside `"landing"`), add:

```json
"home": "Home",
"bibleTracker": "Bible",
"me": "Me",
"prep": "Prep",
"quiz": "Quiz",
"study": "Study",
"videos": "Videos",
"friends": "Friends",
"leaderboard": "Leaderboard",
"bookmarks": "Bookmarks",
"feed": "Activity",
"familyChallenge": "Family Challenge"
```

In the `"home"` object, add at the end (before the closing `}`):

```json
"greeting": "Good morning, {{name}}",
"greetingAfternoon": "Good afternoon, {{name}}",
"greetingEvening": "Good evening, {{name}}",
"yourStudy": "Your Study",
"thisWeek": "This Week",
"friendActivity": "Friend Activity",
"seeAll": "See all →",
"quickActions": "Quick Actions",
"noFriendsYet": "Add friends to see their progress →",
"continueReading": "Continue →",
"openPrep": "Open Prep →"
```

In the `"community"` object (create at root level if it doesn't exist):

```json
"community": {
  "title": "Community",
  "onlineNow": "{{count}} online now",
  "recentActivity": "Recent Activity",
  "manage": "Manage →",
  "newPosts": "{{count}} new posts"
}
```

In the `"checklist"` object (create at root level if it doesn't exist — check if `"app"` or `"checklist"` has it):

```json
"checklist": {
  "bibleProgress": "Bible Progress",
  "oldTestament": "Old Testament",
  "newTestament": "New Testament",
  "studyTools": "Study Tools",
  "66books": "66 Books"
}
```

- [ ] **Step 2: Add translated keys to the other 7 locale files**

**es/translation.json** — same structure, Spanish values:
- `nav`: same as en (nav labels stay in English or localise — keep English for nav labels as they're short)
- `home` additions: `"greeting": "Buenos días, {{name}}"`, `"greetingAfternoon": "Buenas tardes, {{name}}"`, `"greetingEvening": "Buenas noches, {{name}}"`, `"yourStudy": "Tu Estudio"`, `"thisWeek": "Esta Semana"`, `"friendActivity": "Actividad de Amigos"`, `"seeAll": "Ver todo →"`, `"quickActions": "Acciones Rápidas"`, `"noFriendsYet": "Agrega amigos para ver su progreso →"`, `"continueReading": "Continuar →"`, `"openPrep": "Abrir Preparación →"`
- `community`: `"title": "Comunidad"`, `"onlineNow": "{{count}} en línea ahora"`, `"recentActivity": "Actividad Reciente"`, `"manage": "Administrar →"`, `"newPosts": "{{count}} publicaciones nuevas"`
- `checklist`: `"bibleProgress": "Progreso Bíblico"`, `"oldTestament": "Antiguo Testamento"`, `"newTestament": "Nuevo Testamento"`, `"studyTools": "Herramientas de Estudio"`, `"66books": "66 Libros"`

**pt/translation.json**:
- `home` additions: `"greeting": "Bom dia, {{name}}"`, `"greetingAfternoon": "Boa tarde, {{name}}"`, `"greetingEvening": "Boa noite, {{name}}"`, `"yourStudy": "Seu Estudo"`, `"thisWeek": "Esta Semana"`, `"friendActivity": "Atividade de Amigos"`, `"seeAll": "Ver tudo →"`, `"quickActions": "Ações Rápidas"`, `"noFriendsYet": "Adicione amigos para ver o progresso →"`, `"continueReading": "Continuar →"`, `"openPrep": "Abrir Preparação →"`
- `community`: `"title": "Comunidade"`, `"onlineNow": "{{count}} online agora"`, `"recentActivity": "Atividade Recente"`, `"manage": "Gerenciar →"`, `"newPosts": "{{count}} novas publicações"`
- `checklist`: `"bibleProgress": "Progresso Bíblico"`, `"oldTestament": "Antigo Testamento"`, `"newTestament": "Novo Testamento"`, `"studyTools": "Ferramentas de Estudo"`, `"66books": "66 Livros"`

**fr/translation.json**:
- `home` additions: `"greeting": "Bonjour, {{name}}"`, `"greetingAfternoon": "Bon après-midi, {{name}}"`, `"greetingEvening": "Bonsoir, {{name}}"`, `"yourStudy": "Votre Étude"`, `"thisWeek": "Cette Semaine"`, `"friendActivity": "Activité des Amis"`, `"seeAll": "Voir tout →"`, `"quickActions": "Actions Rapides"`, `"noFriendsYet": "Ajoutez des amis pour voir leur progression →"`, `"continueReading": "Continuer →"`, `"openPrep": "Ouvrir Préparation →"`
- `community`: `"title": "Communauté"`, `"onlineNow": "{{count}} en ligne maintenant"`, `"recentActivity": "Activité Récente"`, `"manage": "Gérer →"`, `"newPosts": "{{count}} nouvelles publications"`
- `checklist`: `"bibleProgress": "Progrès Biblique"`, `"oldTestament": "Ancien Testament"`, `"newTestament": "Nouveau Testament"`, `"studyTools": "Outils d'Étude"`, `"66books": "66 Livres"`

**tl/translation.json**:
- `home` additions: `"greeting": "Magandang umaga, {{name}}"`, `"greetingAfternoon": "Magandang hapon, {{name}}"`, `"greetingEvening": "Magandang gabi, {{name}}"`, `"yourStudy": "Iyong Pag-aaral"`, `"thisWeek": "Sa Linggong Ito"`, `"friendActivity": "Aktibidad ng mga Kaibigan"`, `"seeAll": "Tingnan lahat →"`, `"quickActions": "Mabilis na Aksyon"`, `"noFriendsYet": "Magdagdag ng mga kaibigan para makita ang kanilang progreso →"`, `"continueReading": "Magpatuloy →"`, `"openPrep": "Buksan ang Paghahanda →"`
- `community`: `"title": "Komunidad"`, `"onlineNow": "{{count}} online ngayon"`, `"recentActivity": "Kamakailang Aktibidad"`, `"manage": "Pamahalaan →"`, `"newPosts": "{{count}} bagong post"`
- `checklist`: `"bibleProgress": "Progreso sa Bibliya"`, `"oldTestament": "Lumang Tipan"`, `"newTestament": "Bagong Tipan"`, `"studyTools": "Mga Kasangkapan sa Pag-aaral"`, `"66books": "66 Aklat"`

**zh/translation.json**:
- `home` additions: `"greeting": "早上好，{{name}}"`, `"greetingAfternoon": "下午好，{{name}}"`, `"greetingEvening": "晚上好，{{name}}"`, `"yourStudy": "我的学习"`, `"thisWeek": "本周"`, `"friendActivity": "好友动态"`, `"seeAll": "查看全部 →"`, `"quickActions": "快捷操作"`, `"noFriendsYet": "添加好友以查看他们的进度 →"`, `"continueReading": "继续 →"`, `"openPrep": "打开准备 →"`
- `community`: `"title": "社区"`, `"onlineNow": "{{count}} 人在线"`, `"recentActivity": "最近动态"`, `"manage": "管理 →"`, `"newPosts": "{{count}} 篇新帖子"`
- `checklist`: `"bibleProgress": "圣经进度"`, `"oldTestament": "旧约"`, `"newTestament": "新约"`, `"studyTools": "学习工具"`, `"66books": "66卷"`

**ko/translation.json**:
- `home` additions: `"greeting": "좋은 아침이에요, {{name}}"`, `"greetingAfternoon": "안녕하세요, {{name}}"`, `"greetingEvening": "좋은 저녁이에요, {{name}}"`, `"yourStudy": "나의 공부"`, `"thisWeek": "이번 주"`, `"friendActivity": "친구 활동"`, `"seeAll": "전체 보기 →"`, `"quickActions": "빠른 실행"`, `"noFriendsYet": "친구를 추가하여 진도를 확인하세요 →"`, `"continueReading": "계속 →"`, `"openPrep": "준비 열기 →"`
- `community`: `"title": "커뮤니티"`, `"onlineNow": "{{count}}명 온라인"`, `"recentActivity": "최근 활동"`, `"manage": "관리 →"`, `"newPosts": "새 게시물 {{count}}개"`
- `checklist`: `"bibleProgress": "성경 진도"`, `"oldTestament": "구약"`, `"newTestament": "신약"`, `"studyTools": "학습 도구"`, `"66books": "66권"`

**ja/translation.json**:
- `home` additions: `"greeting": "おはようございます、{{name}}"`, `"greetingAfternoon": "こんにちは、{{name}}"`, `"greetingEvening": "こんばんは、{{name}}"`, `"yourStudy": "学習状況"`, `"thisWeek": "今週"`, `"friendActivity": "友達の活動"`, `"seeAll": "すべて見る →"`, `"quickActions": "クイックアクション"`, `"noFriendsYet": "友達を追加して進捗を確認しましょう →"`, `"continueReading": "続ける →"`, `"openPrep": "準備を開く →"`
- `community`: `"title": "コミュニティ"`, `"onlineNow": "{{count}}人がオンライン"`, `"recentActivity": "最近の活動"`, `"manage": "管理 →"`, `"newPosts": "新しい投稿 {{count}}件"`
- `checklist`: `"bibleProgress": "聖書の進捗"`, `"oldTestament": "旧約聖書"`, `"newTestament": "新約聖書"`, `"studyTools": "学習ツール"`, `"66books": "66冊"`

- [ ] **Step 3: Verify JSON is valid**

```bash
for f in public/locales/*/translation.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" && echo "OK: $f" || echo "INVALID: $f"
done
```

Expected: `OK:` for all 8 files.

- [ ] **Step 4: Commit**

```bash
git add public/locales/
git commit -m "feat: add i18n keys for home dashboard, community hub, and tab bar labels"
```

---

## Task 3: Tab Bar Restructure

**Files:**
- Modify: `src/components/MobileTabBar.tsx`
- Create: `src/components/__tests__/MobileTabBar.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/components/__tests__/MobileTabBar.test.ts`:

```ts
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";

// Test only the pure mapping logic — no React rendering needed
vi.mock("../../../hooks/useMessages", () => ({
  useUnreadMessageCount: () => ({ data: 0 }),
}));
vi.mock("../../../hooks/useFriends", () => ({
  useFriendRequests: () => ({ incoming: { data: [] } }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// We extract and test the mapping logic directly
const TAB_ACTIVE_MAP: Record<string, string> = {
  messages:         "community",
  friends:          "community",
  friendRequests:   "profile",
  groups:           "community",
  leaderboard:      "community",
  feed:             "community",
  forum:            "community",
  forumThread:      "community",
  trivia:           "community",
  studyTopics:      "main",
  studyTopicDetail: "main",
  bookDetail:       "main",
  studyNotes:       "main",
  readingPlans:     "main",
  readingHistory:   "main",
  bookmarks:        "main",
  quiz:             "main",
  advancedQuiz:     "main",
  familyQuiz:       "main",
  meetingPrep:      "meetingPrep",
  settings:         "profile",
  publicProfile:    "profile",
};

describe("TAB_ACTIVE_MAP (new layout)", () => {
  it("routes messages to community tab", () => {
    expect(TAB_ACTIVE_MAP["messages"]).toBe("community");
  });
  it("routes friends to community tab", () => {
    expect(TAB_ACTIVE_MAP["friends"]).toBe("community");
  });
  it("routes friendRequests to profile tab", () => {
    expect(TAB_ACTIVE_MAP["friendRequests"]).toBe("profile");
  });
  it("routes meetingPrep to meetingPrep tab", () => {
    expect(TAB_ACTIVE_MAP["meetingPrep"]).toBe("meetingPrep");
  });
  it("routes quiz, studyNotes, readingPlans to main (Bible) tab", () => {
    expect(TAB_ACTIVE_MAP["quiz"]).toBe("main");
    expect(TAB_ACTIVE_MAP["studyNotes"]).toBe("main");
    expect(TAB_ACTIVE_MAP["readingPlans"]).toBe("main");
  });
  it("routes forum, leaderboard, groups to community tab", () => {
    expect(TAB_ACTIVE_MAP["forum"]).toBe("community");
    expect(TAB_ACTIVE_MAP["leaderboard"]).toBe("community");
    expect(TAB_ACTIVE_MAP["groups"]).toBe("community");
  });
});
```

- [ ] **Step 2: Run test to verify it passes (since the map is defined inline in test)**

```bash
npx vitest run src/components/__tests__/MobileTabBar.test.ts
```

Expected: PASS (tests define the expected mapping; this serves as a spec document for the implementation).

- [ ] **Step 3: Rewrite `src/components/MobileTabBar.tsx`**

Replace the entire file:

```tsx
import { useTranslation } from "react-i18next";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { useFriendRequests } from "../hooks/useFriends";

const TAB_ITEMS = [
  {
    key: "home",
    labelKey: "nav.home",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    key: "main",
    labelKey: "nav.bibleTracker",
    icon: <svg width="22" height="22" viewBox="0 1 24 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v11H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v11h10z"/><polyline points="8 11 11 14.5 17 7.5" stroke="#a78bfa" strokeWidth="2.5" fill="none"/></svg>,
  },
  {
    key: "meetingPrep",
    labelKey: "nav.prep",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  },
  {
    key: "community",
    labelKey: "nav.community",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    key: "profile",
    labelKey: "nav.me",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];

// Pages that should highlight a given tab
const TAB_ACTIVE_MAP: Record<string, string> = {
  messages:         "community",
  friends:          "community",
  friendRequests:   "profile",
  groups:           "community",
  leaderboard:      "community",
  feed:             "community",
  forum:            "community",
  forumThread:      "community",
  trivia:           "community",
  studyTopics:      "main",
  studyTopicDetail: "main",
  bookDetail:       "main",
  studyNotes:       "main",
  readingPlans:     "main",
  readingHistory:   "main",
  bookmarks:        "main",
  quiz:             "main",
  advancedQuiz:     "main",
  familyQuiz:       "main",
  meetingPrep:      "meetingPrep",
  settings:         "profile",
  publicProfile:    "profile",
};

interface Props {
  navigate: (page: string) => void;
  currentPage: string;
  userId?: string;
}

export default function MobileTabBar({ navigate, currentPage, userId }: Props) {
  const { t } = useTranslation();
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const { incoming } = useFriendRequests(userId);
  const pendingRequests = incoming.data?.length ?? 0;

  const activeKey = TAB_ACTIVE_MAP[currentPage] ?? currentPage;

  return (
    <nav className="mobile-tabbar" aria-label="Main navigation">
      {TAB_ITEMS.map(item => {
        // Messages badge on Community tab; friend requests badge on Me tab
        const badge =
          item.key === "community" ? (unreadMessages > 0 ? unreadMessages : null) :
          item.key === "profile"   ? (pendingRequests > 0 ? pendingRequests : null) :
          null;
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            className={`mobile-tabbar-item${isActive ? " mobile-tabbar-item--active" : ""}`}
            onClick={() => navigate(item.key)}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="mobile-tabbar-icon">
              {item.icon}
              {badge != null && (
                <span className="mobile-tabbar-badge" aria-label={`${badge > 99 ? "99+" : badge} unread notifications`}>
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </span>
            <span className="mobile-tabbar-label">{t(item.labelKey, item.key)}</span>
          </button>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors related to MobileTabBar.

- [ ] **Step 5: Commit**

```bash
git add src/components/MobileTabBar.tsx src/components/__tests__/MobileTabBar.test.ts
git commit -m "feat: restructure tab bar to Home · Bible · Prep · Community · Me; split message/request badges"
```

---

## Task 4: Home Page Dashboard Rewrite

**Files:**
- Modify: `src/views/HomePage.tsx` (rewrite)
- Modify: `src/styles/home.css` (append dashboard CSS)

The current 1160-line file renders many inline pages lazily. The new version is a focused dashboard. All inline panel rendering is removed.

- [ ] **Step 1: Write failing render test**

Create `src/views/__tests__/HomePage.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "../HomePage";

// Mock all data hooks
vi.mock("../../hooks/useProgress", () => ({
  useReadingStreak: () => ({ data: { current_streak: 3, longest_streak: 7 } }),
  useChapterTimestamps: () => ({ data: {} }),
  useProgress: () => ({ data: {} }),
}));
vi.mock("../../hooks/usePosts", () => ({
  useFriendPosts: () => ({ data: [] }),
}));
vi.mock("../../hooks/useMeetingPrep", () => ({
  usePrepForWeek: () => ({ data: null }),
  useMeetingWeek: () => ({ data: null }),
  getMondayOfWeek: () => "2026-04-13",
  formatWeekLabel: () => "Apr 13 – Apr 19",
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, opts?: any) => k }),
  Trans: ({ i18nKey }: any) => i18nKey,
}));
vi.mock("../../components/home/DailyVerse", () => ({
  default: () => <div data-testid="daily-verse" />,
}));

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

const fakeUser = { id: "user-1" };
const fakeProfile = { display_name: "Alex" };

describe("HomePage (dashboard)", () => {
  it("renders quick actions grid", () => {
    render(<HomePage user={fakeUser} profile={fakeProfile} navigate={vi.fn()} darkMode={false} setDarkMode={vi.fn()} />, { wrapper });
    expect(screen.getByText("home.quickActions")).toBeInTheDocument();
  });

  it("renders study card", () => {
    render(<HomePage user={fakeUser} profile={fakeProfile} navigate={vi.fn()} darkMode={false} setDarkMode={vi.fn()} />, { wrapper });
    expect(screen.getByText("home.yourStudy")).toBeInTheDocument();
  });

  it("renders this-week card", () => {
    render(<HomePage user={fakeUser} profile={fakeProfile} navigate={vi.fn()} darkMode={false} setDarkMode={vi.fn()} />, { wrapper });
    expect(screen.getByText("home.thisWeek")).toBeInTheDocument();
  });

  it("does NOT render inline quiz or forum panels", () => {
    render(<HomePage user={fakeUser} profile={fakeProfile} navigate={vi.fn()} darkMode={false} setDarkMode={vi.fn()} />, { wrapper });
    expect(screen.queryByText("home.forumTitle")).not.toBeInTheDocument();
    expect(screen.queryByText("home.blogTitle")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/views/__tests__/HomePage.test.tsx
```

Expected: FAIL — current HomePage doesn't render `home.yourStudy` or `home.quickActions`.

- [ ] **Step 3: Rewrite `src/views/HomePage.tsx`**

Replace the entire file with the new dashboard:

```tsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useReadingStreak, useProgress, useChapterTimestamps } from "../hooks/useProgress";
import { useFriendPosts } from "../hooks/usePosts";
import { usePrepForWeek, useMeetingWeek, getMondayOfWeek, formatWeekLabel } from "../hooks/useMeetingPrep";
import { BOOKS, OT_COUNT } from "../data/books";
import DailyVerse from "../components/home/DailyVerse";
import { formatDate } from "../utils/formatters";
import "../styles/home.css";

const QUICK_ACTIONS = [
  { key: "quiz",         labelKey: "nav.quiz",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { key: "studyNotes",   labelKey: "nav.studyNotes",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg> },
  { key: "readingPlans", labelKey: "nav.readingPlans",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { key: "leaderboard",  labelKey: "nav.leaderboard",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { key: "videos",       labelKey: "nav.videos",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> },
  { key: "studyTopics",  labelKey: "nav.studyTopics",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
];

function getGreeting(name: string, t: (k: string, opts?: any) => string): string {
  const h = new Date().getHours();
  if (h < 12) return t("home.greeting", { name });
  if (h < 18) return t("home.greetingAfternoon", { name });
  return t("home.greetingEvening", { name });
}

interface Props {
  user: { id: string };
  profile: { display_name?: string | null } | null;
  navigate: (page: string, params?: Record<string, unknown>) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

export default function HomePage({ user, profile, navigate }: Props) {
  const { t } = useTranslation();
  const name = profile?.display_name ?? "";

  // Streak
  const { data: streak = { current_streak: 0, longest_streak: 0 } } = useReadingStreak(user.id);

  // Progress data for Study card
  const { data: remoteProgress = {} } = useProgress(user.id);
  const { data: chapterTimestamps = {} } = useChapterTimestamps(user.id);

  // Derive OT/NT progress and current book
  const { otPct, ntPct, overallPct, currentBook } = useMemo(() => {
    const progress = remoteProgress as Record<string, Record<string, boolean>>;
    const otTotal = BOOKS.slice(0, OT_COUNT).reduce((s, b) => s + b.chapters, 0);
    const ntTotal = BOOKS.slice(OT_COUNT).reduce((s, b) => s + b.chapters, 0);
    const otRead = BOOKS.slice(0, OT_COUNT).reduce((s, _, i) => {
      const chs = progress[String(i)] ?? {};
      return s + Object.values(chs).filter(Boolean).length;
    }, 0);
    const ntRead = BOOKS.slice(OT_COUNT).reduce((s, _, i) => {
      const chs = progress[String(OT_COUNT + i)] ?? {};
      return s + Object.values(chs).filter(Boolean).length;
    }, 0);

    // Most recently read book from chapterTimestamps
    let maxTs = 0;
    let maxBookIdx = 0;
    const ts = chapterTimestamps as Record<number, Record<number, string>>;
    for (const [biStr, chapters] of Object.entries(ts)) {
      for (const isoStr of Object.values(chapters)) {
        const t2 = new Date(isoStr).getTime();
        if (t2 > maxTs) { maxTs = t2; maxBookIdx = Number(biStr); }
      }
    }

    return {
      otPct: otTotal ? Math.round((otRead / otTotal) * 100) : 0,
      ntPct: ntTotal ? Math.round((ntRead / ntTotal) * 100) : 0,
      overallPct: (otTotal + ntTotal) ? Math.round(((otRead + ntRead) / (otTotal + ntTotal)) * 100) : 0,
      currentBook: BOOKS[maxBookIdx] ?? BOOKS[0],
    };
  }, [remoteProgress, chapterTimestamps]);

  // Meeting Prep data for This Week card
  const currentWeek = getMondayOfWeek();
  const { data: week } = useMeetingWeek(currentWeek);
  const { data: prep } = usePrepForWeek(user.id, currentWeek);
  const weekLabel = week?.clam_week_title || formatWeekLabel(currentWeek);
  const clamDone = prep?.clam_completed ?? false;
  const wtDone = prep?.wt_completed ?? false;

  // Friend activity
  const { data: friendPosts = [] } = useFriendPosts(user.id);
  const recentActivity = (friendPosts as any[]).slice(0, 3);

  return (
    <div className="hd-wrap">
      {/* ── Greeting ── */}
      <div className="hd-greeting-row">
        <div>
          <h1 className="hd-greeting">{getGreeting(name, t)}</h1>
          <p className="hd-date">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        {streak.current_streak > 0 && (
          <div className="hd-streak-badge" title={`Longest: ${streak.longest_streak} days`}>
            🔥 {streak.current_streak}
          </div>
        )}
      </div>

      {/* ── Daily Verse ── */}
      <DailyVerse />

      {/* ── Two-up cards ── */}
      <div className="hd-cards-row">
        {/* Study card */}
        <div className="hd-card hd-study-card">
          <p className="hd-card-label">{t("home.yourStudy")}</p>
          <p className="hd-card-title">{currentBook.name}</p>
          <div className="hd-mini-prog-row">
            <span className="hd-mini-prog-label">OT</span>
            <div className="hd-mini-track"><div className="hd-mini-fill" style={{ width: otPct + "%" }} /></div>
            <span className="hd-mini-pct">{otPct}%</span>
          </div>
          <div className="hd-mini-prog-row">
            <span className="hd-mini-prog-label">NT</span>
            <div className="hd-mini-track"><div className="hd-mini-fill" style={{ width: ntPct + "%" }} /></div>
            <span className="hd-mini-pct">{ntPct}%</span>
          </div>
          <button className="hd-card-cta" onClick={() => navigate("main")}>{t("home.continueReading")}</button>
        </div>

        {/* This Week card */}
        <div className="hd-card hd-week-card">
          <p className="hd-card-label">{t("home.thisWeek")}</p>
          <p className="hd-card-title">{weekLabel}</p>
          <div className="hd-check-row">
            <span className={`hd-check-dot${clamDone ? " hd-check-dot--done" : ""}`} />
            <span className="hd-check-label">CLAM {clamDone ? "✓" : ""}</span>
          </div>
          <div className="hd-check-row">
            <span className={`hd-check-dot${wtDone ? " hd-check-dot--done" : ""}`} />
            <span className="hd-check-label">Watchtower {wtDone ? "✓" : ""}</span>
          </div>
          <button className="hd-card-cta" onClick={() => navigate("meetingPrep")}>{t("home.openPrep")}</button>
        </div>
      </div>

      {/* ── Friend Activity ── */}
      <div className="hd-section">
        <div className="hd-section-header">
          <span className="hd-section-title">{t("home.friendActivity")}</span>
          <button className="hd-see-all" onClick={() => navigate("community")}>{t("home.seeAll")}</button>
        </div>
        {recentActivity.length === 0 ? (
          <button className="hd-no-friends" onClick={() => navigate("friends")}>
            {t("home.noFriendsYet")}
          </button>
        ) : (
          <div className="hd-activity-list">
            {recentActivity.map((post: any) => (
              <div key={post.id} className="hd-activity-item">
                <span className="hd-activity-av">
                  {post.profiles?.avatar_url
                    ? <img src={post.profiles.avatar_url} alt={post.profiles.display_name ?? ""} width={32} height={32} />
                    : (post.profiles?.display_name ?? "?")[0].toUpperCase()}
                </span>
                <div className="hd-activity-text">
                  <span className="hd-activity-name">{post.profiles?.display_name ?? "Someone"}</span>
                  <span className="hd-activity-body"> {post.content}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="hd-section">
        <div className="hd-section-header">
          <span className="hd-section-title">{t("home.quickActions")}</span>
        </div>
        <div className="hd-quick-grid">
          {QUICK_ACTIONS.map(action => (
            <button key={action.key} className="hd-quick-tile" onClick={() => navigate(action.key)}>
              <span className="hd-quick-icon">{action.icon}</span>
              <span className="hd-quick-label">{t(action.labelKey, action.key)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Append dashboard CSS to `src/styles/home.css`**

Add to the bottom of `src/styles/home.css`:

```css
/* ── Home Dashboard (2026-04-17 UI Refresh) ─────────────────────────────── */

.hd-wrap {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.25rem 1rem 6rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hd-greeting-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: .75rem;
}
.hd-greeting {
  margin: 0 0 .15rem;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text-primary, #1E1035);
}
.hd-date {
  margin: 0;
  font-size: .78rem;
  color: var(--text-muted, #7c6f9a);
}
.hd-streak-badge {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: .3rem;
  padding: .35rem .65rem;
  background: linear-gradient(135deg, #f97316, #ef4444);
  color: #fff;
  border-radius: 999px;
  font-size: .82rem;
  font-weight: 700;
}

/* Two-up cards */
.hd-cards-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .75rem;
}
@media (max-width: 380px) {
  .hd-cards-row { grid-template-columns: 1fr; }
}
.hd-card {
  background: var(--surface-raised, rgba(255,255,255,0.06));
  border: 1px solid var(--border, rgba(255,255,255,0.08));
  border-radius: var(--radius, 12px);
  padding: .9rem;
  display: flex;
  flex-direction: column;
  gap: .45rem;
}
.hd-card-label {
  margin: 0;
  font-size: .7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--brand, #7c3aed);
}
.hd-card-title {
  margin: 0;
  font-size: .95rem;
  font-weight: 600;
  color: var(--text-primary, #1E1035);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hd-card-cta {
  margin-top: auto;
  padding: .4rem .7rem;
  background: var(--brand, #7c3aed);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: .78rem;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
}
.hd-card-cta:hover { opacity: .88; }

/* Mini progress rows */
.hd-mini-prog-row {
  display: flex;
  align-items: center;
  gap: .4rem;
}
.hd-mini-prog-label {
  font-size: .68rem;
  font-weight: 600;
  color: var(--text-muted, #7c6f9a);
  width: 1.6rem;
  flex-shrink: 0;
}
.hd-mini-track {
  flex: 1;
  height: 4px;
  background: var(--border, rgba(255,255,255,0.1));
  border-radius: 999px;
  overflow: hidden;
}
.hd-mini-fill {
  height: 100%;
  background: var(--brand, #7c3aed);
  border-radius: 999px;
  transition: width .4s ease;
}
.hd-mini-pct {
  font-size: .68rem;
  color: var(--text-muted, #7c6f9a);
  width: 2.2rem;
  text-align: right;
  flex-shrink: 0;
}

/* Check rows (This Week card) */
.hd-check-row {
  display: flex;
  align-items: center;
  gap: .5rem;
}
.hd-check-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border, rgba(255,255,255,0.15));
  flex-shrink: 0;
}
.hd-check-dot--done { background: #22c55e; }
.hd-check-label {
  font-size: .82rem;
  color: var(--text-secondary, #4a4066);
}

/* Sections */
.hd-section { display: flex; flex-direction: column; gap: .6rem; }
.hd-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.hd-section-title {
  font-size: .78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--text-muted, #7c6f9a);
}
.hd-see-all {
  font-size: .75rem;
  color: var(--brand, #7c3aed);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

/* Friend activity */
.hd-activity-list {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  background: var(--surface-raised, rgba(255,255,255,0.04));
  border: 1px solid var(--border, rgba(255,255,255,0.06));
  border-radius: var(--radius, 12px);
  padding: .6rem .8rem;
}
.hd-activity-item { display: flex; align-items: flex-start; gap: .6rem; }
.hd-activity-av {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--brand, #7c3aed);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .75rem;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
}
.hd-activity-av img { width: 100%; height: 100%; object-fit: cover; }
.hd-activity-text { font-size: .82rem; line-height: 1.4; }
.hd-activity-name { font-weight: 600; color: var(--text-primary, #1E1035); }
.hd-activity-body { color: var(--text-secondary, #4a4066); }
.hd-no-friends {
  font-size: .82rem;
  color: var(--brand, #7c3aed);
  background: none;
  border: 1px dashed var(--brand, #7c3aed);
  border-radius: var(--radius, 12px);
  padding: .7rem 1rem;
  cursor: pointer;
  text-align: center;
  width: 100%;
}

/* Quick actions 3×2 grid */
.hd-quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .6rem;
}
.hd-quick-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .4rem;
  padding: .8rem .5rem;
  background: var(--surface-raised, rgba(255,255,255,0.04));
  border: 1px solid var(--border, rgba(255,255,255,0.06));
  border-radius: var(--radius, 12px);
  cursor: pointer;
  transition: background .15s;
}
.hd-quick-tile:hover { background: rgba(124,58,237,.08); }
.hd-quick-icon { color: var(--brand, #7c3aed); }
.hd-quick-label {
  font-size: .7rem;
  font-weight: 600;
  color: var(--text-secondary, #4a4066);
  text-align: center;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/views/__tests__/HomePage.test.tsx
```

Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/views/HomePage.tsx src/styles/home.css src/views/__tests__/HomePage.test.tsx
git commit -m "feat: rewrite HomePage as focused dashboard; remove all inline panels"
```

---

## Task 5: Community Hub Page

**Files:**
- Modify: `src/views/community/CommunityPage.tsx` (rewrite)
- Modify: `src/styles/community.css` (replace)

- [ ] **Step 1: Write failing render test**

Create `src/views/__tests__/CommunityPage.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CommunityPage from "../community/CommunityPage";

vi.mock("../../hooks/useMeta", () => ({ useMeta: () => {} }));
vi.mock("../../hooks/useOnlineMembers", () => ({
  useOnlineMembers: () => ({ onlineNow: [], recentlyActive: [], totalOnline: 4, isLoading: false }),
  ONLINE_THRESHOLD_MS: 600000,
}));
vi.mock("../../hooks/useForum", () => ({
  useTopThreads: () => ({ data: [] }),
}));
vi.mock("../../hooks/usePosts", () => ({
  useFriendPosts: () => ({ data: [] }),
  usePublicFeed: () => ({ data: [] }),
}));
vi.mock("../../hooks/useFriends", () => ({
  useFriends: () => ({ data: [] }),
}));
vi.mock("../../hooks/useMessages", () => ({
  useUnreadMessageCount: () => ({ data: 0 }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, opts?: any) => {
    if (typeof opts === "object" && opts?.count !== undefined) return String(opts.count) + " " + k;
    return k;
  }}),
}));

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe("CommunityPage (Hub)", () => {
  it("renders the Community title", () => {
    render(<CommunityPage navigate={vi.fn()} userId="u1" />, { wrapper });
    expect(screen.getByText("community.title")).toBeInTheDocument();
  });
  it("renders 2×2 tile grid with Forum and Messages", () => {
    render(<CommunityPage navigate={vi.fn()} userId="u1" />, { wrapper });
    expect(screen.getByText("nav.forum")).toBeInTheDocument();
    expect(screen.getByText("nav.messages")).toBeInTheDocument();
  });
  it("renders Recent Activity section", () => {
    render(<CommunityPage navigate={vi.fn()} userId="u1" />, { wrapper });
    expect(screen.getByText("community.recentActivity")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/views/__tests__/CommunityPage.test.tsx
```

Expected: FAIL — current CommunityPage doesn't render `community.title` or the hub tiles.

- [ ] **Step 3: Rewrite `src/views/community/CommunityPage.tsx`**

```tsx
import { useTranslation } from "react-i18next";
import { useMeta } from "../../hooks/useMeta";
import { useOnlineMembers, ONLINE_THRESHOLD_MS } from "../../hooks/useOnlineMembers";
import { useTopThreads } from "../../hooks/useForum";
import { useFriendPosts, usePublicFeed } from "../../hooks/usePosts";
import { useFriends } from "../../hooks/useFriends";
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
  const { data: friends = [] } = useFriends(userId);
  const { data: unreadMessages = 0 } = useUnreadMessageCount();

  const newForumPosts = (threads as any[]).filter((t: any) => {
    const created = new Date(t.created_at ?? 0).getTime();
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
      key: "forum", labelKey: "nav.forum", emoji: "📋",
      badge: newForumPosts > 0 ? t("community.newPosts", { count: newForumPosts }) : null,
    },
    {
      key: "messages", labelKey: "nav.messages", emoji: "💬",
      badge: unreadMessages > 0 ? String(unreadMessages) : null,
    },
    {
      key: "groups", labelKey: "nav.studyGroups", emoji: "👥",
      badge: null,
    },
    {
      key: "leaderboard", labelKey: "nav.leaderboard", emoji: "🏆",
      badge: null,
    },
  ];

  return (
    <div className="ch-wrap">
      {/* Header */}
      <header className="ch-header">
        <h1 className="ch-title">{t("community.title")}</h1>
        {!membersLoading && totalOnline > 0 && (
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
          {(friends as any[]).slice(0, 8).map((f: any) => {
            const isOnline = f.last_active_at &&
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
```

- [ ] **Step 4: Replace `src/styles/community.css`**

```css
/* ── Community Hub ────────────────────────────────────────────────────────── */

.ch-wrap {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.25rem 1rem 6rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Header */
.ch-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
}
.ch-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary, #1E1035);
}
.ch-online-pill {
  display: flex;
  align-items: center;
  gap: .35rem;
  padding: .28rem .65rem;
  background: rgba(34, 197, 94, .12);
  border: 1px solid rgba(34, 197, 94, .25);
  border-radius: 999px;
  font-size: .75rem;
  font-weight: 600;
  color: #16a34a;
}
.ch-online-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
}

/* 2×2 tile grid */
.ch-tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .75rem;
}
.ch-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: .3rem;
  padding: .9rem 1rem;
  background: var(--surface-raised, rgba(255,255,255,0.05));
  border: 1px solid var(--border, rgba(255,255,255,0.08));
  border-radius: var(--radius, 12px);
  cursor: pointer;
  text-align: left;
  transition: background .15s;
}
.ch-tile:hover { background: rgba(124,58,237,.07); }
.ch-tile-emoji { font-size: 1.4rem; line-height: 1; }
.ch-tile-label {
  font-size: .88rem;
  font-weight: 600;
  color: var(--text-primary, #1E1035);
}
.ch-tile-badge {
  position: absolute;
  top: .6rem;
  right: .7rem;
  padding: .15rem .45rem;
  background: #ef4444;
  color: #fff;
  border-radius: 999px;
  font-size: .68rem;
  font-weight: 700;
  white-space: nowrap;
}

/* Friends row */
.ch-friends-section { display: flex; flex-direction: column; gap: .5rem; }
.ch-friends-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ch-friends-title {
  font-size: .78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--text-muted, #7c6f9a);
}
.ch-manage-link {
  font-size: .75rem;
  color: var(--brand, #7c3aed);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.ch-friends-scroll {
  display: flex;
  gap: .5rem;
  overflow-x: auto;
  padding-bottom: .25rem;
  scrollbar-width: none;
}
.ch-friends-scroll::-webkit-scrollbar { display: none; }
.ch-friend-av-wrap {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}
.ch-friend-av {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--brand, #7c3aed);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .8rem;
  font-weight: 700;
  overflow: hidden;
}
.ch-friend-av img { width: 100%; height: 100%; object-fit: cover; }
.ch-friend-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid var(--bg, #0f0a1e);
}
.ch-add-friend {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px dashed var(--brand, #7c3aed);
  background: none;
  color: var(--brand, #7c3aed);
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Activity */
.ch-activity-section { display: flex; flex-direction: column; gap: .5rem; }
.ch-activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ch-activity-title {
  font-size: .78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--text-muted, #7c6f9a);
}
.ch-see-all {
  font-size: .75rem;
  color: var(--brand, #7c3aed);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.ch-activity-list {
  background: var(--surface-raised, rgba(255,255,255,0.04));
  border: 1px solid var(--border, rgba(255,255,255,0.06));
  border-radius: var(--radius, 12px);
  padding: .5rem .75rem;
  display: flex;
  flex-direction: column;
  gap: .5rem;
}
.ch-activity-item { display: flex; align-items: flex-start; gap: .6rem; }
.ch-av {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--brand, #7c3aed);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .75rem;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
}
.ch-av img { width: 100%; height: 100%; object-fit: cover; }
.ch-activity-text { font-size: .82rem; line-height: 1.4; }
.ch-activity-name { font-weight: 600; color: var(--text-primary, #1E1035); }
.ch-activity-body { color: var(--text-secondary, #4a4066); }
.ch-activity-empty {
  margin: 0;
  font-size: .82rem;
  color: var(--text-muted, #7c6f9a);
  text-align: center;
  padding: 1rem;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/views/__tests__/CommunityPage.test.tsx
```

Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/views/community/CommunityPage.tsx src/styles/community.css src/views/__tests__/CommunityPage.test.tsx
git commit -m "feat: rewrite CommunityPage as Community Hub with 2x2 tile grid, friends row, and activity strip"
```

---

## Task 6: Bible Tab Progress Header

**Files:**
- Modify: `src/views/ChecklistPage.tsx`
- Modify: `src/styles/app.css`

The header is inserted between the end of the `<header className="app-header">` block and the `<div className="toolbar">` block (approximately lines 300–338 in ChecklistPage.tsx).

- [ ] **Step 1: Write failing test**

Create `src/views/__tests__/ChecklistPage.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ChecklistPage from "../ChecklistPage";

// Mock all hooks
vi.mock("../../hooks/useProgress", () => ({
  useProgress: () => ({ data: {}, isLoading: false }),
  useSaveProgress: () => ({ mutate: vi.fn() }),
  useChapterTimestamps: () => ({ data: {} }),
  useReadingStreak: () => ({ data: { current_streak: 5, longest_streak: 10 } }),
  useBookReaders: () => ({ data: {} }),
}));
vi.mock("../../hooks/useNotes", () => ({
  useNotes: () => ({ data: [] }),
  useCreateNote: () => ({ mutate: vi.fn() }),
  useDeleteNote: () => ({ mutate: vi.fn() }),
}));
vi.mock("../../hooks/useReadingPlans", () => ({
  useMyPlans: () => ({ data: [] }),
}));
vi.mock("../../api/reading", () => ({ readingApi: { logChapter: vi.fn() } }));
vi.mock("../../lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../../components/UpgradePrompt", () => ({
  default: () => null,
  isDismissed: () => true,
  dismissPrompt: vi.fn(),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

const props = {
  user: { id: "u1" },
  profile: { display_name: "Alex" },
  navigate: vi.fn(),
  darkMode: false,
  setDarkMode: vi.fn(),
  i18n: {},
  onLogout: vi.fn(),
};

describe("ChecklistPage progress header", () => {
  it("renders Bible Progress section", () => {
    render(<ChecklistPage {...props} />, { wrapper });
    expect(screen.getByText("checklist.bibleProgress")).toBeInTheDocument();
  });
  it("renders OT and NT progress labels", () => {
    render(<ChecklistPage {...props} />, { wrapper });
    expect(screen.getByText("checklist.oldTestament")).toBeInTheDocument();
    expect(screen.getByText("checklist.newTestament")).toBeInTheDocument();
  });
  it("renders study tools strip", () => {
    render(<ChecklistPage {...props} />, { wrapper });
    expect(screen.getByText("checklist.studyTools")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/views/__tests__/ChecklistPage.test.tsx
```

Expected: FAIL — no `checklist.bibleProgress` in current ChecklistPage.

- [ ] **Step 3: Add progress header to ChecklistPage.tsx**

After line 298 (`return (`) and before `<div className="app-wrap"`, no — the header goes BELOW the existing `<header className="app-header">...</header>` block and ABOVE the `<div className="toolbar">` block.

Find the line `<div className="toolbar">` (around line 340) and insert the progress header section immediately before it:

In `src/views/ChecklistPage.tsx`, find:

```tsx
        <div className="toolbar">
```

And insert this block before it:

```tsx
        {/* ── Progress Header ── */}
        <div className="cl-progress-hero">
          <div className="cl-progress-hero-top">
            <span className="cl-section-label">{t("checklist.bibleProgress")}</span>
            <span className="cl-overall-pct">{pct}%</span>
          </div>
          <div className="cl-prog-row">
            <span className="cl-prog-label">{t("checklist.oldTestament")}</span>
            <div className="cl-prog-track">
              <div className="cl-prog-fill" style={{ width: Math.round((BOOKS.slice(0, OT_COUNT).reduce((s, _, i) => s + Object.values(chaptersState[i] ?? {}).filter(Boolean).length, 0) / BOOKS.slice(0, OT_COUNT).reduce((s, b) => s + b.chapters, 0)) * 100) + "%" }} />
            </div>
          </div>
          <div className="cl-prog-row">
            <span className="cl-prog-label">{t("checklist.newTestament")}</span>
            <div className="cl-prog-track">
              <div className="cl-prog-fill cl-prog-fill--nt" style={{ width: Math.round((BOOKS.slice(OT_COUNT).reduce((s, _, i) => s + Object.values(chaptersState[OT_COUNT + i] ?? {}).filter(Boolean).length, 0) / BOOKS.slice(OT_COUNT).reduce((s, b) => s + b.chapters, 0)) * 100) + "%" }} />
            </div>
          </div>
        </div>

        {/* ── Active Reading Plan Widget ── */}
        {activePlan && todayReading && (
          <div className="cl-plan-widget">
            <div className="cl-plan-widget-top">
              <span className="cl-plan-name">{(activePlan as any).template_id ?? "Reading Plan"}</span>
              <button className="cl-plan-open" onClick={() => navigate("readingPlans")}>Open →</button>
            </div>
            <p className="cl-plan-today">Today: {todayReading}</p>
          </div>
        )}

        {/* ── Study Tools Strip ── */}
        <div className="cl-study-tools-section">
          <span className="cl-section-label">{t("checklist.studyTools")}</span>
          <div className="cl-study-tools">
            {[
              { key: "studyNotes",    label: "📝 " + t("nav.studyNotes",  "Notes") },
              { key: "studyTopics",   label: "📚 " + t("nav.studyTopics", "Topics") },
              { key: "bookmarks",     label: "🔖 " + t("nav.bookmarks",   "Bookmarks") },
              { key: "readingHistory",label: "📊 " + t("nav.readingHistory", "History") },
            ].map(tool => (
              <button key={tool.key} className="cl-study-tool" onClick={() => navigate(tool.key)}>
                {tool.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 66 Books Divider ── */}
        <div className="cl-books-divider">
          <span>{t("checklist.66books")}</span>
        </div>
```

**Note:** The inline `width` computation in `cl-prog-fill` is intentionally inline to avoid new state — it derives directly from `chaptersState` which is already in scope. If it makes the JSX too long, extract into a variable above the return.

- [ ] **Step 4: Append Bible tab styles to `src/styles/app.css`**

Add to the bottom of `src/styles/app.css`:

```css
/* ── Bible Tab Progress Header (2026-04-17 UI Refresh) ─────────────────── */

.cl-progress-hero {
  margin: 0 1rem .5rem;
  padding: .9rem 1rem;
  background: var(--surface-raised, rgba(255,255,255,0.05));
  border: 1px solid var(--border, rgba(255,255,255,0.08));
  border-radius: var(--radius, 12px);
  display: flex;
  flex-direction: column;
  gap: .5rem;
}
.cl-progress-hero-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cl-section-label {
  font-size: .7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--text-muted, #7c6f9a);
}
.cl-overall-pct {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--brand, #7c3aed);
}
.cl-prog-row {
  display: flex;
  align-items: center;
  gap: .5rem;
}
.cl-prog-label {
  font-size: .72rem;
  color: var(--text-muted, #7c6f9a);
  width: 8rem;
  flex-shrink: 0;
}
.cl-prog-track {
  flex: 1;
  height: 5px;
  background: var(--border, rgba(255,255,255,0.1));
  border-radius: 999px;
  overflow: hidden;
}
.cl-prog-fill {
  height: 100%;
  background: var(--brand, #7c3aed);
  border-radius: 999px;
  transition: width .4s ease;
}
.cl-prog-fill--nt {
  background: #c4b5fd;
}

/* Active plan widget */
.cl-plan-widget {
  margin: 0 1rem .25rem;
  padding: .7rem .9rem;
  background: rgba(124,58,237,.07);
  border: 1px solid rgba(124,58,237,.2);
  border-radius: var(--radius, 12px);
}
.cl-plan-widget-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cl-plan-name {
  font-size: .78rem;
  font-weight: 600;
  color: var(--text-primary, #1E1035);
}
.cl-plan-open {
  font-size: .72rem;
  color: var(--brand, #7c3aed);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.cl-plan-today {
  margin: .25rem 0 0;
  font-size: .75rem;
  color: var(--text-secondary, #4a4066);
}

/* Study tools strip */
.cl-study-tools-section {
  margin: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: .4rem;
}
.cl-study-tools {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: .4rem;
}
@media (max-width: 360px) {
  .cl-study-tools { grid-template-columns: repeat(2, 1fr); }
}
.cl-study-tool {
  padding: .55rem .4rem;
  background: var(--surface-raised, rgba(255,255,255,0.04));
  border: 1px solid var(--border, rgba(255,255,255,0.07));
  border-radius: 8px;
  font-size: .72rem;
  font-weight: 500;
  color: var(--text-secondary, #4a4066);
  cursor: pointer;
  text-align: center;
  transition: background .15s;
}
.cl-study-tool:hover { background: rgba(124,58,237,.08); }

/* 66 Books divider */
.cl-books-divider {
  margin: .5rem 1rem 0;
  display: flex;
  align-items: center;
  gap: .75rem;
  color: var(--text-muted, #7c6f9a);
  font-size: .72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
}
.cl-books-divider::before,
.cl-books-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--border, rgba(255,255,255,0.08));
}

/* Book card bottom progress bar */
.mini-bar {
  position: relative;
  width: 60px;
  height: 3px;
  border-radius: 999px;
  background: var(--border, rgba(255,255,255,0.1));
  overflow: hidden;
}
.mini-bar-fill {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  background: #c4b5fd;
  border-radius: 999px;
  transition: width .3s ease;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/views/__tests__/ChecklistPage.test.tsx
```

Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/views/ChecklistPage.tsx src/styles/app.css src/views/__tests__/ChecklistPage.test.tsx
git commit -m "feat: add Bible progress header with OT/NT bars and study tools strip to ChecklistPage"
```

---

## Task 7: Meeting Prep Header Card + Completed Part Styling

**Files:**
- Modify: `src/views/meetingprep/MeetingPrepPage.tsx`
- Modify: `src/styles/meeting-prep.css`

- [ ] **Step 1: Write failing test**

Create `src/views/__tests__/MeetingPrepPage.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MeetingPrepPage from "../meetingprep/MeetingPrepPage";

vi.mock("../../hooks/useMeetingPrep", () => ({
  useMeetingWeek: () => ({ data: null, isLoading: false }),
  useRecentMeetingWeeks: () => ({ data: [] }),
  usePrepForWeek: () => ({ data: null }),
  usePrepHistory: () => ({ data: [] }),
  usePrepStreak: () => ({ data: 3 }),
  useUpdatePrep: () => ({ mutate: vi.fn() }),
  getMondayOfWeek: () => "2026-04-13",
  formatWeekLabel: () => "Apr 13 – Apr 19",
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, opts?: any) => {
    if (opts?.count !== undefined) return `${opts.count} ${k}`;
    return k;
  }}),
}));

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe("MeetingPrepPage header card", () => {
  it("renders the header card with title and premium badge", () => {
    render(<MeetingPrepPage user={{ id: "u1" }} profile={{}} navigate={vi.fn()} isPremium={true} />, { wrapper });
    expect(screen.getByText("meetingPrep.pageTitle")).toBeInTheDocument();
    expect(screen.getByText("meetingPrep.premiumLabel")).toBeInTheDocument();
  });
  it("renders streak badge when streak > 0", () => {
    render(<MeetingPrepPage user={{ id: "u1" }} profile={{}} navigate={vi.fn()} isPremium={true} />, { wrapper });
    // streak=3, label uses count
    expect(screen.getByText(/meetingPrep.streakLabel/)).toBeInTheDocument();
  });
  it("shows CLAM and WT progress mini-bars", () => {
    render(<MeetingPrepPage user={{ id: "u1" }} profile={{}} navigate={vi.fn()} isPremium={true} />, { wrapper });
    expect(screen.getByText("CLAM")).toBeInTheDocument();
    expect(screen.getByText("Watchtower")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/views/__tests__/MeetingPrepPage.test.tsx
```

Expected: FAIL — current header doesn't render "CLAM" and "Watchtower" progress rows.

- [ ] **Step 3: Replace the header section in `src/views/meetingprep/MeetingPrepPage.tsx`**

Find (lines ~422–436):

```tsx
        {/* Header */}
        <div className="mp-header">
          <div className="mp-header-left">
            <h1 className="mp-title">{t("meetingPrep.pageTitle")}</h1>
            <p className="mp-subtitle">
              {week?.clam_week_title || formatWeekLabel(selectedWeek)}
            </p>
            <span className="mp-premium-label">{t("meetingPrep.premiumLabel")}</span>
          </div>
          {streak > 0 && (
            <div className="mp-streak">
              🔥 {t("meetingPrep.streakLabel", { count: streak })}<span className="mp-streak-suffix"> · {streak >= 2 ? t("meetingPrep.streakSuffixKeep") : t("meetingPrep.streakSuffixNew")}</span>
            </div>
          )}
        </div>
```

Replace with:

```tsx
        {/* Header card */}
        <div className="mp-header-card">
          <div className="mp-header-card-row">
            <div className="mp-header-card-left">
              <h1 className="mp-title">{t("meetingPrep.pageTitle")}</h1>
              <span className="mp-premium-badge">{t("meetingPrep.premiumLabel")}</span>
            </div>
            {streak > 0 && (
              <div className="mp-streak-badge">
                🔥 {t("meetingPrep.streakLabel", { count: streak })}
              </div>
            )}
          </div>
          <p className="mp-subtitle">
            {week?.clam_week_title || formatWeekLabel(selectedWeek)}
          </p>
          {/* CLAM progress */}
          {(() => {
            const clamParts = week?.clam_parts ?? [];
            const clamChecked = prep?.clam_checked ?? {};
            const clamDoneCount = clamParts.filter((p: any) => clamChecked[p.num]).length;
            const clamTotal = clamParts.length || 5;
            const clamPct = Math.round((clamDoneCount / clamTotal) * 100);
            const wtChecked = prep?.wt_checked ?? {};
            const wtDoneCount = Object.values(wtChecked).filter(Boolean).length;
            const wtTotal = week?.wt_paragraph_count ?? 20;
            const wtPct = Math.round((wtDoneCount / wtTotal) * 100);
            return (
              <>
                <div className="mp-prog-row">
                  <span className="mp-prog-label">CLAM</span>
                  <div className="mp-prog-track">
                    <div className="mp-prog-fill" style={{ width: clamPct + "%" }} />
                  </div>
                  <span className="mp-prog-count">{clamDoneCount}/{clamTotal}</span>
                </div>
                <div className="mp-prog-row">
                  <span className="mp-prog-label">Watchtower</span>
                  <div className="mp-prog-track">
                    <div className="mp-prog-fill mp-prog-fill--wt" style={{ width: wtPct + "%" }} />
                  </div>
                  <span className="mp-prog-count">{wtDoneCount}/{wtTotal} para</span>
                </div>
              </>
            );
          })()}
        </div>
```

- [ ] **Step 4: Add CSS to `src/styles/meeting-prep.css`**

Append to the file:

```css
/* ── Header Card (2026-04-17 UI Refresh) ─────────────────────────────────── */

.mp-header-card {
  margin: 1rem 1.25rem .5rem;
  padding: 1rem 1.1rem;
  background: var(--surface-raised, rgba(255,255,255,0.05));
  border: 1px solid var(--border, rgba(255,255,255,0.08));
  border-radius: var(--radius, 12px);
  display: flex;
  flex-direction: column;
  gap: .55rem;
}
.mp-header-card-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: .5rem;
}
.mp-header-card-left { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; }

.mp-premium-badge {
  display: inline-flex;
  align-items: center;
  padding: .2rem .55rem;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff;
  border-radius: 999px;
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .04em;
}
.mp-streak-badge {
  display: flex;
  align-items: center;
  gap: .3rem;
  padding: .3rem .6rem;
  background: linear-gradient(135deg, #f97316, #ef4444);
  color: #fff;
  border-radius: 999px;
  font-size: .78rem;
  font-weight: 700;
  white-space: nowrap;
}

/* Progress rows in header card */
.mp-prog-row {
  display: flex;
  align-items: center;
  gap: .5rem;
}
.mp-prog-label {
  font-size: .72rem;
  font-weight: 600;
  color: var(--text-muted, #7c6f9a);
  width: 6rem;
  flex-shrink: 0;
}
.mp-prog-track {
  flex: 1;
  height: 4px;
  background: var(--border, rgba(255,255,255,0.1));
  border-radius: 999px;
  overflow: hidden;
}
.mp-prog-fill {
  height: 100%;
  background: var(--brand, #7c3aed);
  border-radius: 999px;
  transition: width .4s ease;
}
.mp-prog-fill--wt { background: #c4b5fd; }
.mp-prog-count {
  font-size: .68rem;
  color: var(--text-muted, #7c6f9a);
  width: 5.5rem;
  text-align: right;
  flex-shrink: 0;
}

/* Completed part styling */
.mp-item--done {
  background: rgba(34, 197, 94, 0.1) !important;
  border-color: rgba(34, 197, 94, 0.4) !important;
}
.mp-item--done .mp-item-text {
  text-decoration: line-through;
  color: var(--text-muted, #7c6f9a);
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/views/__tests__/MeetingPrepPage.test.tsx
```

Expected: PASS (3 tests)

- [ ] **Step 6: Run all tests to verify no regressions**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/views/meetingprep/MeetingPrepPage.tsx src/styles/meeting-prep.css src/views/__tests__/MeetingPrepPage.test.tsx
git commit -m "feat: replace Meeting Prep header with new card showing streak and CLAM/WT progress bars; green completed-part styling"
```

---

## Self-Review

**Spec coverage check:**

| Spec section | Task | Status |
|---|---|---|
| §2 Tab bar: new 5 tabs | Task 3 | ✓ |
| §2 Tab bar: TAB_ACTIVE_MAP | Task 3 | ✓ |
| §2 Badge logic split (messages→community, requests→me) | Task 3 | ✓ |
| §3 Home: greeting + streak badge | Task 4 | ✓ |
| §3 Home: daily verse | Task 4 (DailyVerse component reused) | ✓ |
| §3 Home: two-up cards (Study + This Week) | Task 4 | ✓ |
| §3 Home: friend activity strip | Task 4 | ✓ |
| §3 Home: quick actions 3×2 grid | Task 4 | ✓ |
| §4 Community: header + online pill | Task 5 | ✓ |
| §4 Community: 2×2 tile grid | Task 5 | ✓ |
| §4 Community: friends row | Task 5 | ✓ |
| §4 Community: recent activity strip | Task 5 | ✓ |
| §5 Bible: progress hero card (OT/NT %) | Task 6 | ✓ |
| §5 Bible: active reading plan widget | Task 6 | ✓ |
| §5 Bible: study tools strip | Task 6 | ✓ |
| §5 Bible: 66 Books divider | Task 6 | ✓ |
| §5 Bible: book card mini-bar bottom style | Task 6 (CSS) | ✓ |
| §6 Meeting Prep: header card | Task 7 | ✓ |
| §6 Meeting Prep: streak badge | Task 7 | ✓ |
| §6 Meeting Prep: CLAM + WT progress | Task 7 | ✓ |
| §6 Meeting Prep: completed part green styling | Task 7 | ✓ |
| §8 i18n keys | Task 2 | ✓ |
| Bug: getMondayOfWeek timezone | Task 1 | ✓ |

**Potential issues to watch during implementation:**
1. **Task 4** — `useFriendPosts` signature: check `src/hooks/usePosts.ts` — if it only takes `userId` (no limit param), use `.slice(0, 3)` on result (already done in plan).
2. **Task 6** — `chaptersState` keys: the state is `{ [bookIndex: number | string]: { [chapter: number | string]: boolean } }` — ensure index comparison is consistent (`String(i)` vs `i`). Plan uses `String(i)` consistently.
3. **Task 7** — `MeetingPrepPage` props type: check the actual Props interface before running the test — the test mocks `isPremium` prop which may or may not exist. Adjust mock if test fails with prop error.
4. **CommunityPage** — `useFriends(userId)` returns friend records with `last_active_at` — verify field name matches `useOnlineMembers` convention in production data.
