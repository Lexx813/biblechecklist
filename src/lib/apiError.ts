import { NextResponse } from "next/server";

/**
 * Server-safe API error helper.
 *
 * Two goals:
 *   1. Don't leak Supabase / Postgres / Anthropic internals to clients
 *      (table names, column hints, constraint names, request IDs).
 *   2. Always log the real error server-side so we can debug.
 *
 * Use:
 *   try { ... } catch (err) { return apiError(err, "Failed to save note", 500); }
 *
 * Or wrap a whole handler:
 *   export const POST = withApiHandler(async (req) => { ... });
 */

type Logger = (msg: string, meta?: Record<string, unknown>) => void;

function defaultLog(msg: string, meta?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.error(msg, meta ?? {});
}

const SAFE_FALLBACK = "Something went wrong. Please try again.";

const SUPABASE_LEAK_HINTS = [
  /relation .* does not exist/i,
  /violates .* constraint/i,
  /duplicate key value/i,
  /column .* does not exist/i,
  /permission denied/i,
  /invalid input syntax/i,
  /JWT/i,
  /service role/i,
];

/**
 * Returns true if a string looks like raw DB / SDK output that we shouldn't ship.
 */
function looksLikeInternalLeak(text: string): boolean {
  if (!text || text.length > 240) return true; // overlong = likely a stack/dump
  return SUPABASE_LEAK_HINTS.some((rx) => rx.test(text));
}

/**
 * Build a JSON error response with a safe public message and structured server
 * log. The original error is NEVER serialized into the response body.
 */
export function apiError(
  err: unknown,
  publicMessage: string = SAFE_FALLBACK,
  status: number = 500,
  ctx: { route?: string; log?: Logger; extra?: Record<string, unknown> } = {},
): Response {
  const log = ctx.log ?? defaultLog;
  const real = err instanceof Error ? err : new Error(String(err));

  log(`[api] ${ctx.route ?? "unknown"} error`, {
    message: real.message,
    name: real.name,
    ...(ctx.extra ?? {}),
  });

  // Sentry server-side capture would go here once @sentry/node (or
  // @sentry/nextjs) is added as a dependency. The structured console.error
  // above is what hits Vercel function logs in the meantime.

  const safe = looksLikeInternalLeak(publicMessage) ? SAFE_FALLBACK : publicMessage;
  return NextResponse.json({ error: safe }, { status });
}

/**
 * Wrap a Next.js Route Handler so any thrown exception becomes a sanitized
 * 500 instead of leaking a stack/PostgREST blob.
 *
 *   export const POST = withApiHandler(async (req) => {
 *     const body = await req.json();
 *     ...
 *   }, { route: "ai-chat" });
 */
export function withApiHandler<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response> | Response,
  opts: { route?: string; publicMessage?: string } = {},
): (...args: TArgs) => Promise<Response> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (err) {
      return apiError(err, opts.publicMessage, 500, { route: opts.route });
    }
  };
}
