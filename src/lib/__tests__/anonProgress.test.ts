// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadAnonProgress,
  saveAnonProgress,
  clearAnonProgress,
  countAnonChapters,
  hasAnonProgress,
  type AnonProgress,
} from "../anonProgress";

const KEY = "nwt_anon_progress_v1";

beforeEach(() => {
  localStorage.clear();
});

describe("loadAnonProgress", () => {
  it("returns empty object when nothing stored", () => {
    expect(loadAnonProgress()).toEqual({});
  });

  it("returns empty object when stored value is invalid JSON", () => {
    localStorage.setItem(KEY, "not-json");
    expect(loadAnonProgress()).toEqual({});
  });

  it("returns empty object when stored value is non-object", () => {
    localStorage.setItem(KEY, "42");
    expect(loadAnonProgress()).toEqual({});
  });

  it("returns stored progress", () => {
    const data: AnonProgress = { 1: { 1: true, 2: false }, 2: { 1: true } };
    localStorage.setItem(KEY, JSON.stringify(data));
    expect(loadAnonProgress()).toEqual(data);
  });
});

describe("saveAnonProgress", () => {
  it("persists progress to localStorage", () => {
    const data: AnonProgress = { 5: { 3: true } };
    saveAnonProgress(data);
    const stored = JSON.parse(localStorage.getItem(KEY)!);
    expect(stored).toEqual(data);
  });
});

describe("clearAnonProgress", () => {
  it("removes the key from localStorage", () => {
    localStorage.setItem(KEY, "{}");
    clearAnonProgress();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

describe("countAnonChapters", () => {
  it("returns 0 for empty progress", () => {
    expect(countAnonChapters({})).toBe(0);
  });

  it("counts only truthy chapter entries", () => {
    const data: AnonProgress = {
      1: { 1: true, 2: false, 3: true },
      2: { 1: true },
    };
    expect(countAnonChapters(data)).toBe(3);
  });

  it("handles books with no chapters", () => {
    const data: AnonProgress = { 1: {} };
    expect(countAnonChapters(data)).toBe(0);
  });
});

describe("hasAnonProgress", () => {
  it("returns false when localStorage is empty", () => {
    expect(hasAnonProgress()).toBe(false);
  });

  it("returns true when there is at least one checked chapter", () => {
    const data: AnonProgress = { 1: { 1: true } };
    localStorage.setItem(KEY, JSON.stringify(data));
    expect(hasAnonProgress()).toBe(true);
  });

  it("returns false when all chapters are unchecked", () => {
    const data: AnonProgress = { 1: { 1: false, 2: false } };
    localStorage.setItem(KEY, JSON.stringify(data));
    expect(hasAnonProgress()).toBe(false);
  });
});
