import { describe, it, expect, vi, beforeEach } from "vitest";

const { getUserMock, createClientMock } = vi.hoisted(() => {
  const getUserMock = vi.fn();
  const createClientMock = vi.fn(() => ({ auth: { getUser: getUserMock } }));
  return { getUserMock, createClientMock };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

import { resolveAuthedUserId, getServiceClient } from "../_auth";

function reqWith(headers: Record<string, string> = {}) {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as unknown as Parameters<typeof resolveAuthedUserId>[0];
}

describe("resolveAuthedUserId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  });

  it("returns null when Authorization header is missing", async () => {
    const id = await resolveAuthedUserId(reqWith());
    expect(id).toBeNull();
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("returns null when Authorization is not Bearer", async () => {
    const id = await resolveAuthedUserId(reqWith({ authorization: "Basic xyz" }));
    expect(id).toBeNull();
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("returns null when Supabase rejects the token", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null }, error: { message: "bad token" } });
    const id = await resolveAuthedUserId(reqWith({ authorization: "Bearer bad" }));
    expect(id).toBeNull();
  });

  it("returns the user id when Supabase accepts the token", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "u-1" } }, error: null });
    const id = await resolveAuthedUserId(reqWith({ authorization: "Bearer good" }));
    expect(id).toBe("u-1");
  });

  it("forwards the Authorization header into the supabase client", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "u-1" } }, error: null });
    await resolveAuthedUserId(reqWith({ authorization: "Bearer good" }));
    const call = createClientMock.mock.calls[0] as unknown as [
      string,
      string,
      { global?: { headers?: { Authorization?: string } } } | undefined,
    ];
    expect(call[2]?.global?.headers?.Authorization).toBe("Bearer good");
  });
});

describe("getServiceClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when env is not configured", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => getServiceClient()).toThrow(/env/i);
  });

  it("returns a client when env is configured", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    const client = getServiceClient();
    expect(client).toBeTruthy();
    expect(createClientMock).toHaveBeenCalledWith("https://x.supabase.co", "service");
  });
});
