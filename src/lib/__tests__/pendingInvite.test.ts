// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { captureGroupInviteFromUrl, getPendingGroupInvite, clearPendingGroupInvite } from "../pendingInvite";

const CODE = "0123456789abcdef0123456789abcdef";

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, "", "/");
});

describe("captureGroupInviteFromUrl", () => {
  it("stores the join code and strips it from the URL", () => {
    history.replaceState(null, "", `/groups/g1?join=${CODE}&x=1`);
    expect(captureGroupInviteFromUrl()).toBe(CODE);
    expect(getPendingGroupInvite()).toBe(CODE);
    expect(window.location.pathname + window.location.search).toBe("/groups/g1?x=1");
  });

  it("ignores malformed codes", () => {
    history.replaceState(null, "", "/groups/g1?join=not-a-code");
    expect(captureGroupInviteFromUrl()).toBeNull();
    expect(getPendingGroupInvite()).toBeNull();
  });

  it("does nothing without a join param", () => {
    history.replaceState(null, "", "/groups/g1");
    expect(captureGroupInviteFromUrl()).toBeNull();
  });

  it("clears the stored code", () => {
    history.replaceState(null, "", `/groups/g1?join=${CODE}`);
    captureGroupInviteFromUrl();
    clearPendingGroupInvite();
    expect(getPendingGroupInvite()).toBeNull();
  });
});
