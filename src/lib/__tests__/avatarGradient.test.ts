import { describe, it, expect } from "vitest";
import { avatarGradient } from "../avatarGradient";

describe("avatarGradient", () => {
  it("returns a 2-tuple of hex colors", () => {
    const [a, b] = avatarGradient("user-123");
    expect(a).toMatch(/^#[0-9a-f]{6}$/i);
    expect(b).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("is deterministic for the same id", () => {
    expect(avatarGradient("abc")).toEqual(avatarGradient("abc"));
    expect(avatarGradient("user-xyz-789")).toEqual(avatarGradient("user-xyz-789"));
  });

  it("returns different gradients for different ids (sample)", () => {
    const a = avatarGradient("alice");
    const b = avatarGradient("bob");
    const c = avatarGradient("carol");
    const all = [a, b, c].map(p => p.join("|"));
    expect(new Set(all).size).toBeGreaterThan(1);
  });

  it("handles empty string without throwing", () => {
    expect(() => avatarGradient("")).not.toThrow();
    const [a, b] = avatarGradient("");
    expect(a).toMatch(/^#/);
    expect(b).toMatch(/^#/);
  });

  it("handles unicode ids", () => {
    expect(() => avatarGradient("用户-🙂")).not.toThrow();
  });
});
