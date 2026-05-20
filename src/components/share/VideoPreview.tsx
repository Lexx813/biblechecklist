"use client";

/**
 * VideoPreview — fetches Remotion props from /api/render-progress-video and
 * renders a lazy-loaded player. @remotion/player itself is gated behind
 * React.lazy so the ~100KB chunk only ships when the user actually visits
 * a screen that mounts this component (share / promo pages).
 */

import React, { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProgressVideoProps } from "../../remotion/ProgressVideo";
import { supabase } from "../../lib/supabase";

const RemotionPreview = lazy(() => import("./RemotionPreview"));

interface VideoPreviewProps {
  userId?: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; props: ProgressVideoProps }
  | { status: "error"; message: string };

export default function VideoPreview({ userId }: VideoPreviewProps) {
  const { t } = useTranslation();
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
        <span>{t("share.preparingVideo")}</span>
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
      <Suspense fallback={<div className="vp-loading"><div className="vp-spinner" /><span>{t("share.loadingPlayer")}</span></div>}>
        <RemotionPreview props={state.props} />
      </Suspense>
      <p className="vp-hint">
        {t("share.recordHint")}
      </p>
    </div>
  );
}
