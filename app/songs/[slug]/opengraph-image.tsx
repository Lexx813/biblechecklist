import { ImageResponse } from "next/og";
import { songsApi } from "../../../src/api/songs";

export const alt = "JW Study · Original Songs built on scripture";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }) {
  const { slug } = await params;
  const song = await songsApi.getBySlug(slug, "en").catch(() => null);
  const title = song?.title ?? "Original Song";
  const scripture = song?.primary_scripture_ref ?? "";
  const cover = song?.cover_image_url ?? null;
  const fontSize = title.length > 40 ? 52 : title.length > 24 ? 64 : 76;

  // When the song has cover art, show it full-bleed with a dark gradient so the
  // title stays readable. Otherwise render the branded JW Study card.
  if (cover) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "sans-serif" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} width={1200} height={630} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(15,7,30,0) 30%, rgba(15,7,30,0.9) 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "56px 64px",
            }}
          >
            <div style={{ color: "#C084FC", fontSize: "22px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              JW Study · Original Song
            </div>
            <div style={{ color: "#FFFFFF", fontSize: `${fontSize}px`, fontWeight: "800", lineHeight: "1.1", marginTop: "10px" }}>
              {title}
            </div>
          </div>
        </div>
      ),
      { ...size },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1E0D3C 0%, #2D1B69 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #6A3DAA, #C084FC)", flexShrink: 0 }} />
          <span style={{ color: "#C084FC", fontSize: "26px", fontWeight: "700" }}>JW Study</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ color: "#A78BFA", fontSize: "18px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Original Song{scripture ? ` · ${scripture}` : ""}
          </div>
          <div style={{ color: "#F5F0FF", fontSize: `${fontSize}px`, fontWeight: "800", lineHeight: "1.2", maxWidth: "960px" }}>
            {title}
          </div>
        </div>
        <div style={{ color: "#7C5FBF", fontSize: "20px", fontWeight: "600" }}>jwstudy.org/songs</div>
      </div>
    ),
    { ...size },
  );
}
