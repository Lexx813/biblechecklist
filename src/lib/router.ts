export type NavState =
  | { page: "home" }
  | { page: "main" }
  | { page: "admin" }
  | { page: "profile" }
  | { page: "settings" }
  | { page: "blogDash" }
  | { page: "blog"; slug: string | null }
  | { page: "forum"; categoryId: string | null; threadId: string | null }
  | { page: "quiz" }
  | { page: "quizLevel"; level: number }
  | { page: "publicProfile"; userId: string }
  | { page: "search" }
  | { page: "bookmarks" }
  | { page: "history" }
  | { page: "feed" }
  | { page: "messages"; conversationId?: string }
  | { page: "groups" }
  | { page: "groupDetail"; groupId: string }
  | { page: "readingPlans" }
  | { page: "studyNotes"; tab?: string }
  | { page: "aiTools" }
  | { page: "studyTopics" }
  | { page: "studyTopicDetail"; slug: string }
  | { page: "familyQuiz"; challengeId?: string }
  | { page: "leaderboard" }
  | { page: "about" }
  | { page: "terms" }
  | { page: "privacy" }
  | { page: "friends" }
  | { page: "friendRequests" }
  | { page: "invite"; token: string }
  | { page: "notFound" };

export function parsePath(): NavState {
  const h = window.location.pathname.slice(1).replace(/^\//, "");
  if (!h) return { page: "home" };
  if (h === "checklist") return { page: "main" };
  if (h === "admin") return { page: "admin" };
  if (h === "profile") return { page: "profile" };
  if (h === "settings") return { page: "settings" };
  if (h === "blog-dash") return { page: "blogDash" };
  if (h === "blog") return { page: "blog", slug: null };
  if (h.startsWith("blog/")) return { page: "blog", slug: decodeURIComponent(h.slice(5)) };
  if (h === "forum") return { page: "forum", categoryId: null, threadId: null };
  if (h.startsWith("forum/")) {
    const parts = h.slice(6).split("/");
    return { page: "forum", categoryId: parts[0] || null, threadId: parts[1] || null };
  }
  if (h === "quiz") return { page: "quiz" };
  if (h.startsWith("quiz/")) return { page: "quizLevel", level: parseInt(h.slice(5)) };
  if (h.startsWith("user/")) return { page: "publicProfile", userId: h.slice(5) };
  if (h === "search") return { page: "search" };
  if (h === "bookmarks") return { page: "bookmarks" };
  if (h === "history") return { page: "history" };
  if (h === "feed") return { page: "feed" };
  if (h === "messages") {
    const conv = new URLSearchParams(window.location.search).get("conv");
    return conv ? { page: "messages", conversationId: conv } : { page: "messages" };
  }
  if (h.startsWith("messages/")) return { page: "messages", conversationId: h.slice(9) };
  if (h === "groups") return { page: "groups" };
  if (h.startsWith("groups/")) return { page: "groupDetail", groupId: h.slice(7) };
  if (h === "reading-plans") return { page: "readingPlans" };
  if (h === "study-notes")            return { page: "studyNotes" };
  if (h === "study-notes/community")  return { page: "studyNotes", tab: "public" };
  if (h === "ai-tools")      return { page: "aiTools" };
  if (h === "study-topics")  return { page: "studyTopics" };
  if (h.startsWith("study-topics/")) return { page: "studyTopicDetail", slug: decodeURIComponent(h.slice(13)) };
  if (h === "family-quiz")   return { page: "familyQuiz" };
  if (h.startsWith("family-quiz/")) return { page: "familyQuiz", challengeId: h.slice(12) };
  if (h === "leaderboard")   return { page: "leaderboard" };
  if (h === "about") return { page: "about" };
  if (h === "terms") return { page: "terms" };
  if (h === "privacy") return { page: "privacy" };
  if (h === "friends") return { page: "friends" };
  if (h === "friends/requests") return { page: "friendRequests" };
  if (h.startsWith("invite/")) return { page: "invite", token: h.slice(7) };
  return { page: "notFound" };
}

export function buildPath(page: string, params: Record<string, unknown> = {}): string {
  switch (page) {
    case "admin":         return "/admin";
    case "profile":       return "/profile";
    case "settings":      return "/settings";
    case "blogDash":      return "/blog-dash";
    case "blog":          return params.slug ? `/blog/${encodeURIComponent(params.slug as string)}` : "/blog";
    case "forum":         return params.categoryId
      ? (params.threadId ? `/forum/${params.categoryId}/${params.threadId}` : `/forum/${params.categoryId}`)
      : "/forum";
    case "quiz":          return "/quiz";
    case "quizLevel":     return "/quiz/" + params.level;
    case "publicProfile": return "/user/" + params.userId;
    case "search":        return "/search";
    case "bookmarks":     return "/bookmarks";
    case "history":       return "/history";
    case "feed":          return "/feed";
    case "messages":     return params.conversationId ? "/messages/" + params.conversationId : "/messages";
    case "groups":       return "/groups";
    case "groupDetail":  return "/groups/" + params.groupId;
    case "readingPlans": return "/reading-plans";
    case "studyNotes":   return params.tab === "public" ? "/study-notes/community" : "/study-notes";
    case "aiTools":           return "/ai-tools";
    case "studyTopics":       return "/study-topics";
    case "studyTopicDetail":  return "/study-topics/" + encodeURIComponent(params.slug as string);
    case "familyQuiz":        return params.challengeId ? `/family-quiz/${params.challengeId}` : "/family-quiz";
    case "leaderboard":       return "/leaderboard";
    case "about":         return "/about";
    case "terms":         return "/terms";
    case "privacy":       return "/privacy";
    case "friends":        return "/friends";
    case "friendRequests": return "/friends/requests";
    case "invite":         return `/invite/${(params.token as string) ?? ""}`;
    case "main":          return "/checklist";
    default:              return "/";
  }
}
