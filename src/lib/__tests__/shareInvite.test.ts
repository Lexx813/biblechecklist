import { describe, it, expect, vi, afterEach } from "vitest";
import { shareInviteLink } from "../shareInvite";

const URL_ = "https://jwstudy.org/invite/abc";
const TEXT = "Join me";

function mockNavigator(nav: Partial<Navigator>) {
  vi.stubGlobal("navigator", nav);
}

afterEach(() => vi.unstubAllGlobals());

describe("shareInviteLink", () => {
  it("uses the native share sheet when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    mockNavigator({ share });
    expect(await shareInviteLink(URL_, TEXT)).toBe("shared");
    expect(share).toHaveBeenCalledWith({ text: TEXT, url: URL_ });
  });

  it("treats a dismissed share sheet as cancelled without copying", async () => {
    const writeText = vi.fn();
    mockNavigator({
      share: vi.fn().mockRejectedValue(new DOMException("dismissed", "AbortError")),
      clipboard: { writeText } as unknown as Clipboard,
    });
    expect(await shareInviteLink(URL_, TEXT)).toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("falls back to copying when share fails for another reason", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockNavigator({
      share: vi.fn().mockRejectedValue(new DOMException("nope", "NotAllowedError")),
      clipboard: { writeText } as unknown as Clipboard,
    });
    expect(await shareInviteLink(URL_, TEXT)).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(`${TEXT} ${URL_}`);
  });

  it("copies when share is unsupported", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockNavigator({ clipboard: { writeText } as unknown as Clipboard });
    expect(await shareInviteLink(URL_, TEXT)).toBe("copied");
  });

  it("reports failure when neither share nor clipboard works", async () => {
    mockNavigator({ clipboard: { writeText: vi.fn().mockRejectedValue(new Error("blocked")) } as unknown as Clipboard });
    expect(await shareInviteLink(URL_, TEXT)).toBe("failed");
  });
});
