"use client";

/**
 * Loads @remotion/player + ProgressVideo on demand so the ~100KB Remotion
 * runtime only ships when a user actually mounts VideoPreview. Imported
 * lazily by VideoPreview.tsx.
 */

import { Player } from "@remotion/player";
import type { ProgressVideoProps } from "../../remotion/ProgressVideo";
import ProgressVideo from "../../remotion/ProgressVideo";

export default function RemotionPreview({ props }: { props: ProgressVideoProps }) {
  return (
    <Player
      acknowledgeRemotionLicense
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={ProgressVideo as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inputProps={props as any}
      durationInFrames={150}
      fps={30}
      compositionWidth={1080}
      compositionHeight={1920}
      style={{
        width: "100%",
        maxWidth: 280,
        aspectRatio: "9/16",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
      controls
      autoPlay
      loop
    />
  );
}
