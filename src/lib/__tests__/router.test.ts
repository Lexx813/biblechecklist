// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { buildPath, parsePath } from "../router";

describe("buildPath", () => {
  it("builds /friends", () => {
    expect(buildPath("friends")).toBe("/friends");
  });

  it("builds /friends/requests", () => {
    expect(buildPath("friendRequests")).toBe("/friends/requests");
  });

  it("builds /invite/<token>", () => {
    expect(buildPath("invite", { token: "abc123" })).toBe("/invite/abc123");
  });

  it("builds /messages", () => {
    expect(buildPath("messages")).toBe("/messages");
  });

  it("builds /messages/<id> when conversationId provided", () => {
    expect(buildPath("messages", { conversationId: "conv-42" })).toBe("/messages/conv-42");
  });

  it("builds /blog/<slug>", () => {
    expect(buildPath("blog", { slug: "my-post" })).toBe("/blog/my-post");
  });

  it("builds /blog without slug", () => {
    expect(buildPath("blog")).toBe("/blog");
  });

  it("builds /user/<id>", () => {
    expect(buildPath("publicProfile", { userId: "uuid-123" })).toBe("/user/uuid-123");
  });

  it("redirects legacy /community to /feed", () => {
    expect(buildPath("community")).toBe("/feed");
  });

  it("builds / for unknown page", () => {
    expect(buildPath("unknown-page")).toBe("/");
  });

  it("builds /checklist for main", () => {
    expect(buildPath("main")).toBe("/checklist");
  });

  it("builds /study-topics/<slug> with encoding", () => {
    expect(buildPath("studyTopicDetail", { slug: "faith & works" })).toBe(
      "/study-topics/faith%20%26%20works"
    );
  });
});

function setLocation(pathname: string, search = "") {
  Object.defineProperty(window, "location", {
    value: { pathname, search },
    writable: true,
    configurable: true,
  });
}

describe("parsePath", () => {
  it("parses / as home", () => {
    setLocation("/");
    expect(parsePath()).toEqual({ page: "home" });
  });

  it("parses /friends as friends", () => {
    setLocation("/friends");
    expect(parsePath()).toEqual({ page: "friends" });
  });

  it("parses /friends/requests as friendRequests", () => {
    setLocation("/friends/requests");
    expect(parsePath()).toEqual({ page: "friendRequests" });
  });

  it("parses /invite/<token>", () => {
    setLocation("/invite/token123");
    expect(parsePath()).toEqual({ page: "invite", token: "token123" });
  });

  it("parses /messages", () => {
    setLocation("/messages");
    expect(parsePath()).toEqual({ page: "messages" });
  });

  it("parses /user/<id> as publicProfile", () => {
    setLocation("/user/abc");
    expect(parsePath()).toEqual({ page: "publicProfile", userId: "abc" });
  });

  it("parses /blog/<slug>", () => {
    setLocation("/blog/my-post");
    expect(parsePath()).toEqual({ page: "blog", slug: "my-post" });
  });

  it("parses legacy /community as feed", () => {
    setLocation("/community");
    expect(parsePath()).toEqual({ page: "feed" });
  });

  it("parses unknown path as notFound", () => {
    setLocation("/nonexistent-path");
    expect(parsePath()).toEqual({ page: "notFound" });
  });

  it("parses /checklist as main", () => {
    setLocation("/checklist");
    expect(parsePath()).toEqual({ page: "main" });
  });
});
