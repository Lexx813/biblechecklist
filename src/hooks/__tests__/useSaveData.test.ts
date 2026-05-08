import { describe, it, expect } from "vitest";
import { isSlowConnection } from "../useSaveData";

describe("isSlowConnection", () => {
  it("returns false when connection info is unavailable", () => {
    expect(isSlowConnection(undefined)).toBe(false);
  });

  it("returns false on a fast 4g connection", () => {
    expect(isSlowConnection({ saveData: false, effectiveType: "4g" } as never)).toBe(false);
  });

  it("returns true when Data Saver is on", () => {
    expect(isSlowConnection({ saveData: true, effectiveType: "4g" } as never)).toBe(true);
  });

  it("returns true on slow-2g", () => {
    expect(isSlowConnection({ effectiveType: "slow-2g" } as never)).toBe(true);
  });

  it("returns true on 2g", () => {
    expect(isSlowConnection({ effectiveType: "2g" } as never)).toBe(true);
  });

  it("returns true on 3g", () => {
    expect(isSlowConnection({ effectiveType: "3g" } as never)).toBe(true);
  });

  it("Data Saver flag overrides a fast effectiveType", () => {
    expect(isSlowConnection({ saveData: true, effectiveType: "4g" } as never)).toBe(true);
  });
});
