import { describe, it, expect } from "vitest";
import { aggregateUserTotals, topUserIdsByCost, type AIUsageRow } from "../aiUsageAggregation";

describe("aggregateUserTotals", () => {
  it("sums messages, tokens, and cost per user", () => {
    const rows: AIUsageRow[] = [
      { user_id: "u1", input_tokens: 100, output_tokens: 50, cost_usd: "0.001" },
      { user_id: "u1", input_tokens: 200, output_tokens: 30, cost_usd: "0.002" },
      { user_id: "u2", input_tokens: 10,  output_tokens: 5,  cost_usd: "0.0001" },
    ];
    const totals = aggregateUserTotals(rows);
    expect(totals.get("u1")).toEqual({ messages: 2, tokens: 380, cost: 0.003 });
    expect(totals.get("u2")).toEqual({ messages: 1, tokens: 15,  cost: 0.0001 });
  });

  it("skips rows with null user_id so they never reach .in('id', …)", () => {
    // Regression for the admin AI Usage tab crash: ai_usage_logs.user_id is
    // nullable (FK ON DELETE SET NULL). If a null leaks into topUserIds, the
    // follow-up `.in("id", topUserIds)` on profiles 400s with
    // "invalid input syntax for type uuid: 'null'" and the whole hook throws.
    const rows: AIUsageRow[] = [
      { user_id: "u1",  input_tokens: 100, output_tokens: 50, cost_usd: "0.001" },
      { user_id: null,  input_tokens: 999, output_tokens: 999, cost_usd: "99.99" },
      { user_id: "u2",  input_tokens: 10,  output_tokens: 5,  cost_usd: "0.0001" },
    ];
    const totals = aggregateUserTotals(rows);
    expect(totals.has("u1")).toBe(true);
    expect(totals.has("u2")).toBe(true);
    expect(totals.size).toBe(2);
    // Nulls must not become Map keys
    for (const id of totals.keys()) {
      expect(id).not.toBeNull();
      expect(id).toBeTypeOf("string");
    }
  });
});

describe("topUserIdsByCost", () => {
  it("orders by cost descending and respects the limit", () => {
    const totals = new Map([
      ["a", { messages: 1, tokens: 10, cost: 0.01 }],
      ["b", { messages: 1, tokens: 10, cost: 5.00 }],
      ["c", { messages: 1, tokens: 10, cost: 1.00 }],
    ]);
    expect(topUserIdsByCost(totals, 2)).toEqual(["b", "c"]);
  });

  it("returns an empty array for an empty input — keeps the follow-up .in() call un-fired", () => {
    expect(topUserIdsByCost(new Map())).toEqual([]);
  });
});
