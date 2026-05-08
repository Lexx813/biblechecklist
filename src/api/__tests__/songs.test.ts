import { describe, it, expect, vi, beforeEach } from "vitest";

const { fromMock, selectMock, eqMock, orderMock, maybeSingleMock } = vi.hoisted(() => {
  const maybeSingleMock = vi.fn();
  const orderMock = vi.fn();
  const eqMock = vi.fn();
  const selectMock = vi.fn();
  const fromMock = vi.fn();
  return { fromMock, selectMock, eqMock, orderMock, maybeSingleMock };
});

vi.mock("../../lib/supabase", () => ({
  supabase: { from: fromMock },
}));

import { songsApi, localizedTitle, localizedDescription, localizedScriptureText, localizedLyrics, type Song } from "../songs";

function buildChain(result: { data: unknown; error: unknown }) {
  // The chain calls used: from().select().eq().maybeSingle()  (getBySlug),
  // and from().select().eq().order()  (listPublished). We make every chain
  // method return the chain object, and pin the terminal resolutions.
  const chain: Record<string, unknown> = {};
  selectMock.mockReturnValue(chain);
  eqMock.mockReturnValue(chain);
  orderMock.mockReturnValue(Promise.resolve(result));
  maybeSingleMock.mockReturnValue(Promise.resolve(result));
  chain.select = selectMock;
  chain.eq = eqMock;
  chain.order = orderMock;
  chain.maybeSingle = maybeSingleMock;
  fromMock.mockReturnValue(chain);
}

const baseSong: Song = {
  id: "s1",
  slug: "shepherd",
  title: "Jehovah Is My Shepherd",
  title_es: null,
  audio_url: "shepherd/audio.mp3",
  duration_seconds: 240,
  primary_scripture_ref: "Psalm 23:1",
  primary_scripture_text: "Jehovah is my Shepherd. I will lack nothing.",
  primary_scripture_text_es: null,
  theme: "trust",
  lyrics: { sections: [] },
  lyrics_es: null,
  description: "A gospel ballad rooted in Psalm 23.",
  description_es: null,
  jw_org_links: [],
  cover_image_url: null,
  published: true,
  created_at: "2026-05-07",
  updated_at: "2026-05-07",
  play_count: 0,
  download_count: 0,
  song_number: null,
};

describe("songsApi.listPublished", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when supabase returns an error", async () => {
    buildChain({ data: null, error: { message: "boom" } });
    await expect(songsApi.listPublished()).rejects.toThrow(/boom/);
  });

  it("returns rows on success (en)", async () => {
    buildChain({ data: [baseSong], error: null });
    const rows = await songsApi.listPublished("en");
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe("shepherd");
  });

  it("filters out rows missing ES translation when lang=es", async () => {
    const partial = { ...baseSong, slug: "no-es" };
    const full = {
      ...baseSong,
      slug: "with-es",
      title_es: "Jehová Es Mi Pastor",
      lyrics_es: { sections: [] },
    };
    buildChain({ data: [partial, full], error: null });
    const rows = await songsApi.listPublished("es");
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe("with-es");
  });
});

describe("songsApi.getBySlug", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null on no match", async () => {
    buildChain({ data: null, error: null });
    const song = await songsApi.getBySlug("missing");
    expect(song).toBeNull();
  });

  it("returns null on ES request when ES translation missing", async () => {
    buildChain({ data: baseSong, error: null });
    const song = await songsApi.getBySlug("shepherd", "es");
    expect(song).toBeNull();
  });

  it("returns row on EN with full data", async () => {
    buildChain({ data: baseSong, error: null });
    const song = await songsApi.getBySlug("shepherd", "en");
    expect(song?.slug).toBe("shepherd");
  });
});

describe("localized field accessors", () => {
  it("localizedTitle prefers ES when present", () => {
    expect(localizedTitle({ ...baseSong, title_es: "Jehová Es Mi Pastor" }, "es")).toBe(
      "Jehová Es Mi Pastor",
    );
  });
  it("localizedTitle falls back to EN when ES missing", () => {
    expect(localizedTitle(baseSong, "es")).toBe(baseSong.title);
  });
  it("localizedDescription falls back to EN when ES missing", () => {
    expect(localizedDescription(baseSong, "es")).toBe(baseSong.description);
  });
  it("localizedScriptureText falls back to EN when ES missing", () => {
    expect(localizedScriptureText(baseSong, "es")).toBe(baseSong.primary_scripture_text);
  });
  it("localizedLyrics falls back to EN when ES missing", () => {
    expect(localizedLyrics(baseSong, "es")).toBe(baseSong.lyrics);
  });
});
