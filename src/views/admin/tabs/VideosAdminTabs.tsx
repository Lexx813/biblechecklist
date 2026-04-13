import { useState, useEffect } from "react";
import ConfirmModal from "../../../components/ConfirmModal";
import { useAdminCreatorRequests, useAdminSetCreatorApproval, useAdminDeleteVideo } from "../../../hooks/useVideos";
import type { CreatorRequest } from "../../../api/videos";
import { supabase } from "../../../lib/supabase";
import { formatDate } from "../../../utils/formatters";

interface VideoRow {
  id: string;
  title: string;
  embed_url: string | null;
  storage_path: string | null;
  created_at: string;
  playback_url?: string | null;
  profiles: { display_name: string | null } | null;
}

// ── Video Card ────────────────────────────────────────────────────────────────
function VideoCard({ v, onDelete }: { v: VideoRow; onDelete: (id: string, title: string, storagePath?: string | null) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
      <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{v.title}</div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: 2 }}>
            {v.profiles?.display_name ?? "Unknown"} · {formatDate(v.created_at)}
            {v.embed_url && (
              <> · <a href={v.embed_url} target="_blank" rel="noopener noreferrer" style={{ color: "#a78bfa" }}>open ↗</a></>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "none", color: "var(--text-secondary)", fontSize: "0.7rem", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          {expanded ? "Hide" : "Preview"}
        </button>
        <button
          onClick={() => onDelete(v.id, v.title, v.storage_path)}
          style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#f87171", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Delete
        </button>
      </div>
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {v.embed_url ? (
            <div style={{ position: "relative", paddingBottom: "56.25%", background: "#000" }}>
              <iframe
                src={v.embed_url}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={v.title}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              />
            </div>
          ) : v.playback_url ? (
            <video controls preload="metadata" style={{ width: "100%", display: "block", background: "#000" }}>
              <source src={v.playback_url} type="video/mp4" />
            </video>
          ) : (
            <div style={{ padding: 16, fontSize: "0.78rem", color: "var(--text-secondary)" }}>No preview available.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Videos Tab ────────────────────────────────────────────────────────────────
export function VideosTab() {
  const deleteVideo = useAdminDeleteVideo();
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string; storagePath?: string | null } | null>(null);

  useEffect(() => {
    supabase
      .from("videos")
      .select("id, title, embed_url, storage_path, created_at, profiles!creator_id(display_name)")
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        const enriched = await Promise.all((data ?? []).map(async (v: typeof data[0]) => {
          if (v.storage_path) {
            const { data: signed } = await supabase.storage.from("videos").createSignedUrl(v.storage_path, 3600);
            return { ...v, playback_url: signed?.signedUrl ?? null } as unknown as VideoRow;
          }
          return v as unknown as VideoRow;
        }));
        setVideos(enriched);
        setLoading(false);
      });
  }, []);

  async function handleDelete(videoId: string, storagePath?: string | null) {
    try {
      await deleteVideo.mutateAsync({ videoId, storagePath });
      setVideos(vs => vs.filter(v => v.id !== videoId));
    } catch (err: unknown) {
      alert((err as Error).message ?? "Failed to delete.");
    } finally {
      setConfirmDelete(null);
    }
  }

  if (loading) return <div style={{ padding: 20, color: "var(--text-secondary)", fontSize: "0.82rem" }}>Loading…</div>;

  return (
    <div style={{ padding: "16px 20px" }}>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>
        All Videos
        <span style={{ background: "rgba(124,58,237,0.12)", color: "#7c3aed", fontSize: "0.7rem", padding: "2px 8px", borderRadius: 20, marginLeft: 8 }}>
          {videos.length}
        </span>
      </h3>
      {videos.length === 0 && <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>No videos yet.</p>}
      {videos.map(v => (
        <VideoCard key={v.id} v={v} onDelete={(id, title, sp) => setConfirmDelete({ id, title, storagePath: sp })} />
      ))}
      {confirmDelete && (
        <ConfirmModal
          message={`Delete "${confirmDelete.title}"? This cannot be undone.`}
          onConfirm={() => handleDelete(confirmDelete.id, confirmDelete.storagePath)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ── Creators Tab ──────────────────────────────────────────────────────────────
export function CreatorsTab() {
  const { data: requests = [], isLoading } = useAdminCreatorRequests();
  const setApproval = useAdminSetCreatorApproval();

  async function handle(userId: string, approved: boolean) {
    try {
      await setApproval.mutateAsync({ userId, approved });
    } catch (err: unknown) {
      alert((err as Error).message ?? "Failed.");
    }
  }

  if (isLoading) return <div className="admin-section" style={{ padding: 20, color: "var(--text-secondary)", fontSize: "0.82rem" }}>Loading…</div>;

  const pending = (requests as CreatorRequest[]).filter(r => r.status === "pending");
  const reviewed = (requests as CreatorRequest[]).filter(r => r.status !== "pending");

  return (
    <div style={{ padding: "16px 20px" }}>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>
        Creator Requests
        {pending.length > 0 && (
          <span style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", fontSize: "0.7rem", padding: "2px 8px", borderRadius: 20, marginLeft: 8 }}>
            {pending.length} pending
          </span>
        )}
      </h3>
      {pending.length === 0 && reviewed.length === 0 && (
        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>No requests yet.</p>
      )}
      {pending.map(req => (
        <div key={req.id} style={{ padding: 12, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 8 }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{req.profiles?.display_name ?? req.display_name}</div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginBottom: 4 }}>{req.profiles?.email} · Member since {formatDate(req.profiles?.created_at ?? "")}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic", marginBottom: 8 }}>"{req.topic_description}"</div>
          {req.sample_url && (
            <div style={{ fontSize: "0.68rem", marginBottom: 8 }}>
              <a href={req.sample_url} target="_blank" rel="noopener noreferrer" style={{ color: "#a78bfa" }}>View sample →</a>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handle(req.user_id, true)} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#34d399", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>✓ Approve</button>
            <button onClick={() => handle(req.user_id, false)} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>✕ Deny</button>
          </div>
        </div>
      ))}
      {reviewed.length > 0 && (
        <>
          <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", marginTop: 16, marginBottom: 8 }}>Reviewed</h4>
          {reviewed.map(req => (
            <div key={req.id} style={{ padding: "10px 12px", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 6, display: "flex", alignItems: "center", gap: 10, opacity: 0.7 }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{req.profiles?.display_name ?? req.display_name}</span>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: req.status === "approved" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)", color: req.status === "approved" ? "#34d399" : "#f87171" }}>{req.status}</span>
              {req.status === "approved" && (
                <button onClick={() => handle(req.user_id, false)} style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 4, border: "1px solid var(--border)", background: "none", color: "var(--text-secondary)", fontSize: "0.65rem", cursor: "pointer" }}>Revoke</button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
