import { ImageResponse } from "next/og";
import { blogApi } from "../../../src/api/blog";

export const alt = "JW Study Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }) {
  const post = await blogApi.getBySlug(params.slug).catch(() => null);
  const title = post?.title ?? "JW Study Blog";
  const coverUrl = post?.cover_url ?? null;
  const fontSize = title.length > 70 ? 40 : title.length > 50 ? 48 : 56;

  // When the post has a cover photo, show it full-bleed with a dark gradient
  // overlay at the bottom so the title is always readable.
  if (coverUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
            fontFamily: "sans-serif",
          }}
        >
          {/* Cover image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            width={1200}
            height={630}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />

          {/* Dark gradient overlay — bottom two-thirds */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(10,4,24,0.92) 0%, rgba(10,4,24,0.55) 55%, rgba(0,0,0,0.05) 100%)",
              display: "flex",
            }}
          />

          {/* Text block pinned to bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "44px 64px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div
              style={{
                color: "#C084FC",
                fontSize: "20px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              JW Study · Blog
            </div>
            <div
              style={{
                color: "#FFFFFF",
                fontSize: `${fontSize}px`,
                fontWeight: "800",
                lineHeight: "1.2",
              }}
            >
              {title}
            </div>
          </div>
        </div>
      ),
      { ...size },
    );
  }

  // No cover photo — branded purple gradient card
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
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6A3DAA, #C084FC)",
              flexShrink: 0,
            }}
          />
          <span style={{ color: "#C084FC", fontSize: "26px", fontWeight: "700" }}>
            JW Study
          </span>
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              color: "#A78BFA",
              fontSize: "18px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            Blog
          </div>
          <div
            style={{
              color: "#F5F0FF",
              fontSize: `${fontSize}px`,
              fontWeight: "800",
              lineHeight: "1.25",
              maxWidth: "960px",
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer */}
        <div style={{ color: "#7C5FBF", fontSize: "20px", fontWeight: "600" }}>
          nwtprogress.com
        </div>
      </div>
    ),
    { ...size },
  );
}
