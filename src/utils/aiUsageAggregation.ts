// Pure helpers for the admin AI Usage tab. Extracted from useAIUsage so the
// null-user-id case (rows orphaned by ON DELETE SET NULL on ai_usage_logs.user_id)
// can be exercised in a unit test — passing `null` into `.in("id", …)` on
// profiles previously made PostgREST 400 and broke the whole tab.

export interface AIUsageRow {
  user_id: string | null;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number | string;
}

export interface UserTotals {
  messages: number;
  tokens: number;
  cost: number;
}

export function aggregateUserTotals(rows: AIUsageRow[]): Map<string, UserTotals> {
  const totals = new Map<string, UserTotals>();
  for (const r of rows) {
    if (!r.user_id) continue;
    const cur = totals.get(r.user_id) ?? { messages: 0, tokens: 0, cost: 0 };
    cur.messages += 1;
    cur.tokens   += r.input_tokens + r.output_tokens;
    cur.cost     += Number(r.cost_usd);
    totals.set(r.user_id, cur);
  }
  return totals;
}

export function topUserIdsByCost(totals: Map<string, UserTotals>, limit = 10): string[] {
  return [...totals.entries()]
    .sort(([, a], [, b]) => b.cost - a.cost)
    .slice(0, limit)
    .map(([id]) => id);
}
