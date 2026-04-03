import { ImageResponse } from "next/og";
import { blogApi } from "../../../src/api/blog";

export const alt = "NWT Progress Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }) {
  const post = await blogApi.getBySlug(params.slug).catch(() => null);
  const title = post?.title ?? "NWT Progress Blog";
  const fontSize = title.length > 70 ? 40 : title.length > 50 ? 48 : 56;

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
            NWT Progress
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
