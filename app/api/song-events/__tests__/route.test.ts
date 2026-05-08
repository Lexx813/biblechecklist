import { describe, it, expect, vi, beforeEach } from "vitest";

const { insertMock, fromMock, createClientMock, rateLimitMock } = vi.hoisted(() => {
  const insertMock = vi.fn();
  const fromMock = vi.fn(() => ({ insert: insertMock }));
  const createClientMock = vi.fn(() => ({ from: fromMock }));
  const rateLimitMock = vi.fn();
  return { insertMock, fromMock, createClientMock, rateLimitMock };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

vi.mock("../../../../src/lib/ratelimit", () => ({
  rateLimit: rateLimitMock,
  rateLimitResponse: (result: { retryAfter: number }) =>
    new Response(JSON.stringify({ error: "rate_limited" }), {
      status: 429,
      headers: { "Retry-After": String(result.retryAfter) },
    }),
}));

import { POST } from "../route";

const VALID_UUID = "11111111-2222-3333-4444-555555555555";

function makeReq(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://jwstudy.org/api/song-events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.5",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/song-events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    insertMock.mockResolvedValue({ error: null });
    rateLimitMock.mockResolvedValue({ ok: true, retryAfter: 0, label: "song event", remaining: 30 });
  });

  it("rejects invalid JSON with 400", async () => {
    const res = await POST(makeReq("not-json{") as never);
    expect(res.status).toBe(400);
  });

  it("rejects non-UUID song_id", async () => {
    const res = await POST(makeReq({ song_id: "not-a-uuid", event_type: "play" }) as never);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/UUID/);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects unknown event_type", async () => {
    const res = await POST(makeReq({ song_id: VALID_UUID, event_type: "scrub" }) as never);
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects unknown share_platform on share event", async () => {
    const res = await POST(
      makeReq({ song_id: VALID_UUID, event_type: "share", share_platform: "myspace" }) as never,
    );
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("accepts a known share_platform", async () => {
    const res = await POST(
      makeReq({ song_id: VALID_UUID, event_type: "share", share_platform: "tiktok" }) as never,
    );
    expect(res.status).toBe(200);
    expect(insertMock).toHaveBeenCalledOnce();
    const row = insertMock.mock.calls[0][0];
    expect(row.share_platform).toBe("tiktok");
    expect(row.event_type).toBe("share");
  });

  it("derives source from referer", async () => {
    await POST(
      makeReq(
        { song_id: VALID_UUID, event_type: "play" },
        { referer: "https://www.tiktok.com/foo" },
      ) as never,
    );
    expect(insertMock.mock.calls[0][0].source).toBe("tiktok");
  });

  it("falls back to direct when no referer", async () => {
    await POST(makeReq({ song_id: VALID_UUID, event_type: "play" }) as never);
    expect(insertMock.mock.calls[0][0].source).toBe("direct");
  });

  it("rejects jw_org_url that is too long", async () => {
    const longUrl = "https://www.jw.org/" + "x".repeat(600);
    const res = await POST(
      makeReq({ song_id: VALID_UUID, event_type: "jw_org_click", jw_org_url: longUrl }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("rejects jw_org_url without http(s)", async () => {
    const res = await POST(
      makeReq({
        song_id: VALID_UUID,
        event_type: "jw_org_click",
        jw_org_url: "javascript:alert(1)",
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("strips share_platform on non-share events", async () => {
    await POST(
      makeReq({
        song_id: VALID_UUID,
        event_type: "play",
        share_platform: "tiktok",
      }) as never,
    );
    expect(insertMock.mock.calls[0][0].share_platform).toBeNull();
  });

  it("returns 429 when rate-limited", async () => {
    rateLimitMock.mockResolvedValueOnce({
      ok: false,
      retryAfter: 30,
      label: "song event",
      remaining: 0,
    });
    const res = await POST(makeReq({ song_id: VALID_UUID, event_type: "play" }) as never);
    expect(res.status).toBe(429);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rate-limits per-IP-per-song (key shape)", async () => {
    await POST(makeReq({ song_id: VALID_UUID, event_type: "play" }) as never);
    expect(rateLimitMock).toHaveBeenCalledWith("songEvents", `203.0.113.5:${VALID_UUID}`);
  });

  it("returns 404 on FK violation (deleted song)", async () => {
    insertMock.mockResolvedValueOnce({ error: { code: "23503", message: "fk violation" } });
    const res = await POST(makeReq({ song_id: VALID_UUID, event_type: "play" }) as never);
    expect(res.status).toBe(404);
  });

  it("returns 500 on other DB errors via withApiHandler", async () => {
    insertMock.mockResolvedValueOnce({ error: { code: "XX000", message: "boom" } });
    const res = await POST(makeReq({ song_id: VALID_UUID, event_type: "play" }) as never);
    expect(res.status).toBe(500);
  });

  it("does not call rateLimit when IP cannot be determined", async () => {
    const res = await POST(
      new Request("https://jwstudy.org/api/song-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: VALID_UUID, event_type: "play" }),
      }) as never,
    );
    expect(res.status).toBe(200);
    expect(rateLimitMock).not.toHaveBeenCalled();
  });
});
