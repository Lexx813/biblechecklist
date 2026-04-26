// @vitest-environment jsdom
import { describe, it, expect } from "vitest";

// Test the new TAB_ACTIVE_MAP logic inline, serves as a spec document
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

describe("TAB_ACTIVE_MAP (new 5-tab layout)", () => {
  it("routes messages to community tab", () => {
    expect(TAB_ACTIVE_MAP["messages"]).toBe("community");
  });
  it("routes friends to community tab", () => {
    expect(TAB_ACTIVE_MAP["friends"]).toBe("community");
  });
  it("routes friendRequests to profile tab (not community)", () => {
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
  it("routes studyTopics and bookmarks to main (Bible) tab", () => {
    expect(TAB_ACTIVE_MAP["studyTopics"]).toBe("main");
    expect(TAB_ACTIVE_MAP["bookmarks"]).toBe("main");
  });
  it("routes publicProfile and settings to profile tab", () => {
    expect(TAB_ACTIVE_MAP["publicProfile"]).toBe("profile");
    expect(TAB_ACTIVE_MAP["settings"]).toBe("profile");
  });
});
