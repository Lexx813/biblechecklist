// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { loadState, saveState } from "../storage";

const STORAGE_KEY = "nwt_bible_checklist_v2";

beforeEach(() => {
  localStorage.clear();
});

describe("loadState", () => {
  it("returns empty object when nothing is stored", () => {
    expect(loadState()).toEqual({});
  });

  it("returns parsed state when data is stored", () => {
    const state = { book1: true, book2: false };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    expect(loadState()).toEqual(state);
  });

  it("handles corrupt JSON gracefully and returns empty object", () => {
    localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");
    expect(loadState()).toEqual({});
  });
});

describe("saveState", () => {
  it("stores state in localStorage", () => {
    const state = { chapter1: true };
    saveState(state);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual(state);
  });

  it("state saved can be retrieved via loadState", () => {
    const state = { chapter1: true, chapter2: false, meta: "value" };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it("overwrites previously stored state", () => {
    saveState({ old: true });
    saveState({ new: true });
    expect(loadState()).toEqual({ new: true });
  });
});
