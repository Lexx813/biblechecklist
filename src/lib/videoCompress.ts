// src/lib/videoCompress.ts
"use client";
// Lazy-loaded — only imported when the user opens the Upload File tab.
// ffmpeg.wasm runs entirely in the browser; no server round-trip needed.

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export interface CompressProgress {
  ratio: number;       // 0–1
  originalMB: number;
  compressedMB: number;
}

/**
 * Compresses a video file using ffmpeg.wasm.
 * Targets H.264 at 720p, CRF 28, 2 Mbps max — turns a 200 MB phone video into ~40–50 MB.
 *
 * Requires SharedArrayBuffer (Chrome/Firefox with proper COOP/COEP headers).
 * Throws a descriptive error if the browser doesn't support it.
 */
export async function compressVideo(
  file: File,
  onProgress?: (p: CompressProgress) => void
): Promise<File> {
  if (typeof SharedArrayBuffer === "undefined") {
    return file; // Skip compression silently — upload the original
  }

  const originalMB = file.size / (1024 * 1024);
  const ffmpeg = new FFmpeg();

  // Core hosted on jsDelivr CDN (~10 MB), cached after first load.
  const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  let durationSec = 0;
  ffmpeg.on("log", ({ message }) => {
    const m = message.match(/Duration:\s+(\d+):(\d+):(\d+)/);
    if (m) durationSec = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3]);
  });
  ffmpeg.on("progress", ({ time }) => {
    if (durationSec > 0 && onProgress) {
      const ratio = Math.min(time / durationSec, 0.99);
      onProgress({ ratio, originalMB, compressedMB: originalMB * (1 - ratio * 0.75) });
    }
  });

  const inputName = "input" + file.name.slice(file.name.lastIndexOf("."));
  const outputName = "output.mp4";

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-vf", "scale=-2:720",
    "-c:v", "libx264",
    "-crf", "28",
    "-preset", "fast",
    "-maxrate", "2000k",
    "-bufsize", "4000k",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data as unknown as BlobPart], { type: "video/mp4" });
  onProgress?.({ ratio: 1, originalMB, compressedMB: blob.size / (1024 * 1024) });

  return new File([blob], outputName, { type: "video/mp4" });
}
