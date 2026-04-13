import React from "react";
import { Composition } from "remotion";
import ProgressVideo, { type ProgressVideoProps } from "./ProgressVideo";
import AIPromoVideo from "./AIPromoVideo";
import VideoUploaderPromo from "./VideoUploaderPromo";
import { QuizPromo } from "./QuizPromo";
import { BibleTrackerPromo } from "./BibleTrackerPromo";

export function RemotionRoot() {
  const defaultProps: ProgressVideoProps = {
    displayName: "Your Name",
    avatarInitial: "Y",
    avatarUrl: null,
    chaptersRead: 342,
    totalChapters: 1189,
    currentStreak: 14,
    badgeCount: 5,
    topBadgeEmoji: "🏺",
    pct: 29,
  };

  return (
    <>
      <Composition
        id="ProgressVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={ProgressVideo as any}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
      />
      <Composition
        id="AIPromoVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={AIPromoVideo as any}
        durationInFrames={1200}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="VideoUploaderPromo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={VideoUploaderPromo as any}
        durationInFrames={1200}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="QuizPromo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={QuizPromo as any}
        durationInFrames={1200}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="BibleTrackerPromo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={BibleTrackerPromo as any}
        durationInFrames={1200}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
}
