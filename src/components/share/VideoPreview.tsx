"use client";

/**
 * VideoPreview, renders the Remotion ProgressVideo animation in the browser.
 * Fetches props from /api/render-progress-video, then plays them via @remotion/player.
 * No server rendering required, @remotion/player runs entirely in the browser.
 */

import React, { useEffect, useState } from "react";
import { Player } from "@remotion/player";
import type { ProgressVideoProps } from "../../remotion/ProgressVideo";
import ProgressVideo from "../../remotion/ProgressVideo";
import { supabase } from "../../lib/supabase";

interface VideoPreviewProps {
  userId?: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; props: ProgressVideoProps }
  | { status: "error"; message: string };

export default function VideoPreview({ userId }: VideoPreviewProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Sign in to preview your video.");

        const body: Record<string, string> = {};
        if (userId) body.userId = userId;

        const res = await fetch("/api/render-progress-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
        }

        const { props } = await res.json() as { props: ProgressVideoProps };
        if (!cancelled) setState({ status: "ready", props });
      } catch (err) {
        if (!cancelled) {
          setState({ status: "error", message: err instanceof Error ? err.message : "Failed to load video." });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  if (state.status === "loading") {
    return (
      <div className="vp-loading">
        <div className="vp-spinner" />
        <span>Preparing your video…</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="vp-error">
        <span>⚠ {state.message}</span>
      </div>
    );
  }

  return (
    <div className="vp-wrap">
      <Player
        acknowledgeRemotionLicense
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={ProgressVideo as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inputProps={state.props as any}
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
      <p className="vp-hint">
        Record your screen to save as a video.
      </p>
    </div>
  );
}
