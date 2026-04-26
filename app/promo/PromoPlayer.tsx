"use client";

import { Player } from "@remotion/player";
import AIPromoVideo from "../../src/remotion/AIPromoVideo";

export default function PromoPlayer() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 960,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Player
        acknowledgeRemotionLicense
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={AIPromoVideo as any}
        inputProps={{}}
        durationInFrames={1200}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        style={{
          width: "100%",
          aspectRatio: "16/9",
        }}
        controls
        autoPlay={false}
        loop={false}
        clickToPlay
        doubleClickToFullscreen
        showVolumeControls={false}
      />
    </div>
  );
}
