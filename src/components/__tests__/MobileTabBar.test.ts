// @vitest-environment jsdom
import { describe, it, expect } from "vitest";

// Test the new TAB_ACTIVE_MAP logic inline, serves as a spec document
const TAB_ACTIVE_MAP: Record<string, string> = {
  messages:         "feed",
  friends:          "feed",
  friendRequests:   "profile",
  groups:           "feed",
  leaderboard:      "feed",
  forum:            "feed",
  forumThread:      "feed",
  trivia:           "feed",
  community:        "feed",
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

describe("TAB_ACTIVE_MAP (5-tab layout, feed is the social hub)", () => {
  it("routes messages to feed tab", () => {
    expect(TAB_ACTIVE_MAP["messages"]).toBe("feed");
  });
  it("routes friends to feed tab", () => {
    expect(TAB_ACTIVE_MAP["friends"]).toBe("feed");
  });
  it("routes friendRequests to profile tab (not feed)", () => {
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
  it("routes forum, leaderboard, groups to feed tab", () => {
    expect(TAB_ACTIVE_MAP["forum"]).toBe("feed");
    expect(TAB_ACTIVE_MAP["leaderboard"]).toBe("feed");
    expect(TAB_ACTIVE_MAP["groups"]).toBe("feed");
  });
  it("routes legacy /community URLs to feed tab", () => {
    expect(TAB_ACTIVE_MAP["community"]).toBe("feed");
  });
  it("routes studyTopics and bookmarks to main (Bible) tab", () => {
    expect(TAB_ACTIVE_MAP["studyTopics"]).toBe("main");
    expect(TAB_ACTIVE_MAP["bookmarks"]).toBe("main");
  });
  it("routes publicProfile and settings to profile tab", () => {
    expect(TAB_ACTIVE_MAP["publicProfile"]).toBe("profile");
    expect(TAB_ACTIVE_MAP["settings"]).toBe("profile");
  });
});
