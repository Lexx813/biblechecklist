"use client";

import { useEffect, useRef, useState } from "react";
import { trackSongEvent } from "../../lib/songs/trackEvent";

type Props = {
  signedUrl: string | null;
  durationSeconds: number;
  title: string;
  songId: string;
  lang: "en" | "es";
};

const COPY = {
  en: {
    play: "Play",
    pause: "Pause",
    nowPlaying: "Now playing",
    unavailable: "Audio unavailable. Refresh to retry.",
  },
  es: {
    play: "Reproducir",
    pause: "Pausar",
    nowPlaying: "Reproduciendo",
    unavailable: "Audio no disponible. Actualiza para reintentar.",
  },
};

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SongAudioPlayer({ signedUrl, durationSeconds, title, songId, lang }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const [seeking, setSeeking] = useState(false);
  const playFiredRef = useRef(false);
  const completeFiredRef = useRef(false);
  const t = COPY[lang];

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      setCurrent(a.currentTime);
      if (
        !completeFiredRef.current &&
        a.duration > 0 &&
        a.currentTime / a.duration >= 0.8
      ) {
        completeFiredRef.current = true;
        trackSongEvent({ song_id: songId, event_type: "complete" });
      }
    };
    const onMeta = () => {
      if (a.duration && Number.isFinite(a.duration)) setDuration(a.duration);
    };
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, [songId]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().then(() => {
        setPlaying(true);
        if (!playFiredRef.current) {
          playFiredRef.current = true;
          trackSongEvent({ song_id: songId, event_type: "play" });
        }
      }).catch(() => setPlaying(false));
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    const next = Number(e.target.value);
    a.currentTime = next;
    setCurrent(next);
  };

  if (!signedUrl) {
    return (
      <div className="rounded-md border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
        {t.unavailable}
      </div>
    );
  }

  const max = duration || durationSeconds || 1;
  const pct = Math.min(100, Math.max(0, (current / max) * 100));
  const remaining = Math.max(0, max - current);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/4">
      <audio
        ref={audioRef}
        src={signedUrl}
        preload="metadata"
        controlsList="nodownload noplaybackrate"
        onContextMenu={(e) => e.preventDefault()}
        aria-label={title}
      />

      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? t.pause : t.play}
          className="group relative inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition active:scale-95 hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          {playing && (
            <span
              aria-hidden
              className="absolute inset-0 rounded-full ring-4 ring-violet-200 dark:ring-violet-500/25"
            />
          )}
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="0.5" />
              <rect x="14" y="5" width="4" height="14" rx="0.5" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden style={{ marginLeft: 3 }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          {/* Custom track */}
          <div
            className={
              "group relative h-1.5 w-full cursor-pointer rounded-full bg-slate-200 transition dark:bg-white/10" +
              (seeking ? " h-2" : "")
            }
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-violet-600 transition-[width] duration-75 ease-out"
              style={{ width: `${pct}%` }}
            />
            <div
              aria-hidden
              className={
                "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-violet-600 bg-white shadow-sm transition-opacity " +
                (seeking || playing ? "opacity-100" : "opacity-0 group-hover:opacity-100")
              }
              style={{ left: `${pct}%` }}
            />
            <input
              type="range"
              min={0}
              max={max}
              step={0.1}
              value={current}
              onChange={seek}
              onPointerDown={() => setSeeking(true)}
              onPointerUp={() => setSeeking(false)}
              onPointerCancel={() => setSeeking(false)}
              aria-label="Seek"
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
          </div>

          {/* Time + state row */}
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                {fmt(current)}
              </span>
              <span aria-hidden className="text-xs font-medium text-slate-400 dark:text-slate-500">
                /
              </span>
              <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
                {fmt(max)}
              </span>
            </div>

            {playing ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
                <PulseDot />
                {t.nowPlaying}
              </span>
            ) : (
              <span className="text-xs font-medium tabular-nums text-slate-400 dark:text-slate-500">
                {pct > 1 ? `-${fmt(remaining)}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PulseDot() {
  return (
    <span className="relative inline-flex size-1.5">
      <span className="absolute inset-0 inline-flex animate-ping rounded-full bg-violet-500 opacity-60" />
      <span className="relative inline-flex size-1.5 rounded-full bg-violet-600" />
    </span>
  );
}
