/**
 * Client wrapper around the /api/admin/songs/* routes.
 * Each call attaches the current Supabase access token; the routes verify
 * it and the caller's is_admin profile flag.
 */

import { supabase } from "../lib/supabase";
import type { JwOrgLink } from "./songs";

async function token(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const t = session?.access_token;
  if (!t) throw new Error("Not authenticated");
  return t;
}

export interface SongPatch {
  title?: string;
  title_es?: string | null;
  description?: string;
  description_es?: string | null;
  primary_scripture_ref?: string;
  primary_scripture_text?: string;
  primary_scripture_text_es?: string | null;
  theme?: string;
  cover_image_url?: string | null;
  duration_seconds?: number;
  jw_org_links?: JwOrgLink[];
  published?: boolean;
}

export interface SongCreateMeta {
  slug: string;
  title: string;
  title_es?: string | null;
  primary_scripture_ref: string;
  primary_scripture_text: string;
  theme: string;
  description: string;
  cover_image_url?: string | null;
  duration_seconds?: number;
  jw_org_links?: JwOrgLink[];
  published?: boolean;
}

async function post<T>(url: string, body: BodyInit, isJson: boolean): Promise<T> {
  const t = await token();
  const headers: Record<string, string> = { Authorization: `Bearer ${t}` };
  if (isJson) headers["Content-Type"] = "application/json";
  const res = await fetch(url, { method: "POST", headers, body });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as T;
}

export const adminSongsApi = {
  patch: async (id: string, patch: SongPatch) => {
    const t = await token();
    const res = await fetch(`/api/admin/songs/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(json.error ?? `Update failed (${res.status})`);
    return json.song;
  },

  delete: async (id: string) => {
    const t = await token();
    const res = await fetch(`/api/admin/songs/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${t}` },
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(json.error ?? `Delete failed (${res.status})`);
    return true;
  },

  uploadAudio: async (id: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return post<{ audio_url: string }>(`/api/admin/songs/${id}/audio`, fd, false);
  },

  create: async (meta: SongCreateMeta, lyricsMd: string, audio: File, lyricsEsMd?: string) => {
    const fd = new FormData();
    fd.append("meta", JSON.stringify(meta));
    fd.append("lyrics_md", lyricsMd);
    if (lyricsEsMd) fd.append("lyrics_es_md", lyricsEsMd);
    fd.append("file", audio);
    return post<{ id: string }>(`/api/admin/songs`, fd, false);
  },
};
