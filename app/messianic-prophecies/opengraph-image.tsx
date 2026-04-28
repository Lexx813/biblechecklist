import { ImageResponse } from "next/og";
import { MESSIANIC_PROPHECIES } from "../../src/data/messianicProphecies";

export const alt = "JW Study · Messianic Prophecies Fulfilled in Jesus";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const count = MESSIANIC_PROPHECIES.length;

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

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              color: "#A78BFA",
              fontSize: "18px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            Editorial Study · {count} Pairs
          </div>
          <div
            style={{
              display: "flex",
              color: "#F5F0FF",
              fontSize: "62px",
              fontWeight: "800",
              lineHeight: "1.05",
              maxWidth: "1000px",
              letterSpacing: "-0.025em",
            }}
          >
            Messianic Prophecies Fulfilled in Jesus
          </div>
          <div
            style={{
              display: "flex",
              color: "#C7B8E8",
              fontSize: "22px",
              lineHeight: "1.4",
              maxWidth: "920px",
            }}
          >
            Hebrew Scripture prophecies paired with Christian Greek Scripture fulfillments. Sourced from the New World Translation.
          </div>
        </div>

        <div style={{ color: "#7C5FBF", fontSize: "20px", fontWeight: "600" }}>
          jwstudy.org/messianic-prophecies
        </div>
      </div>
    ),
    { ...size },
  );
}
