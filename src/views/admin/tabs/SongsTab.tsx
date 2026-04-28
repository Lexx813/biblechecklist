import { useEffect, useState } from "react";
import { useSongStats } from "../../../hooks/useAdmin";
import { useUpdateSong, useDeleteSong } from "../../../hooks/useAdminSongs";
import type { SongFormPrefill } from "../../../hooks/useAIChat";
import { SongEditModal, type EditableSong } from "../SongEditModal";
import { AddSongDialog } from "../AddSongDialog";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  useChartTheme,
  KpiCard,
  ChartCard,
  RichTooltip,
  AreaGradient,
  Glow,
} from "../../../components/charts";

const VIOLET = "#7c3aed";
const VIOLET_LIGHT = "#a78bfa";

const dateFmt = (d: string) => {
  const dt = new Date(d + "T00:00:00");
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
};

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="an-kpi-row">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />
        ))}
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="skeleton" style={{ height: 220, borderRadius: 14 }} />
      ))}
    </div>
  );
}

export function SongsTab() {
  const [days, setDays] = useState(30);
  const [editing, setEditing] = useState<EditableSong | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [prefill, setPrefill] = useState<SongFormPrefill | null>(null);
  const { data, isLoading, isError } = useSongStats(days);

  // Listen for AI prefill events. The admin asks the AI Companion to add a
  // song; the AI calls prefill_song_form, the server emits an SSE event,
  // useAIChat re-broadcasts it as a window CustomEvent, and we open the
  // dialog with the values already filled in.
  useEffect(() => {
    function onPrefill(e: Event) {
      const detail = (e as CustomEvent<SongFormPrefill>).detail;
      if (!detail) return;
      setPrefill(detail);
      setShowAdd(true);
    }
    window.addEventListener("ai:song-form-prefill", onPrefill);
    return () => window.removeEventListener("ai:song-form-prefill", onPrefill);
  }, []);
  const updateSong = useUpdateSong();
  const deleteSong = useDeleteSong();
  const t = useChartTheme();

  function openEdit(row: { id: string; slug: string; title: string; title_es: string | null; theme: string; scripture_ref: string; primary_scripture_text: string; primary_scripture_text_es: string | null; description: string; description_es: string | null; cover_image_url: string | null; duration_seconds: number; jw_org_links: { url: string; anchor: string }[]; published: boolean }) {
    setEditing({
      id: row.id,
      slug: row.slug,
      title: row.title,
      title_es: row.title_es,
      description: row.description,
      description_es: row.description_es,
      primary_scripture_ref: row.scripture_ref,
      primary_scripture_text: row.primary_scripture_text,
      primary_scripture_text_es: row.primary_scripture_text_es,
      theme: row.theme,
      cover_image_url: row.cover_image_url,
      duration_seconds: row.duration_seconds,
      jw_org_links: row.jw_org_links,
      published: row.published,
    });
  }

  async function togglePublish(id: string, current: boolean) {
    try {
      await updateSong.mutateAsync({ id, patch: { published: !current } });
    } catch (e) {
      alert(`Failed to toggle: ${(e as Error).message}`);
    }
  }

  async function confirmDelete(row: { id: string; title: string }) {
    if (!confirm(`Delete "${row.title}"? This removes the song row, all its plays, and the audio file. Cannot be undone.`)) return;
    try {
      await deleteSong.mutateAsync(row.id);
    } catch (e) {
      alert(`Delete failed: ${(e as Error).message}`);
    }
  }

  if (isLoading) return <Skeleton />;
  if (isError || !data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
        Failed to load song stats. Make sure you have admin access.
      </div>
    );
  }

  const {
    totalPlays,
    totalCompletes,
    totalDownloads,
    totalJwClicks,
    totalShares,
    perSongRows,
    dailySeries,
    sourceBreakdown,
  } = data;

  const completionPct = totalPlays > 0 ? Math.round((totalCompletes / totalPlays) * 100) : 0;

  // Build sparkline arrays from dailySeries (last 14)
  const playsSpark = dailySeries.slice(-14).map((d) => d.plays);
  const downloadsSpark = dailySeries.slice(-14).map((d) => d.downloads);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top row: range + add */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Range:</span>
        {[7, 30, 90, 365].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              padding: "5px 14px",
              borderRadius: 999,
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
              background: days === d ? VIOLET : "transparent",
              color: days === d ? "#fff" : "var(--text-muted)",
              border: `1px solid ${days === d ? "transparent" : "var(--border)"}`,
              transition: "all 180ms ease",
            }}
          >
            {d === 365 ? "1y" : `${d}d`}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowAdd(true)}
          style={{
            padding: "7px 14px",
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 600,
            background: VIOLET,
            color: "#fff",
            border: "none",
          }}
        >
          + Add song
        </button>
      </div>

      {/* KPIs */}
      <div className="an-kpi-row">
        <KpiCard
          label="Plays"
          value={totalPlays}
          deltaLabel={`last ${days}d`}
          accent={VIOLET}
          spark={playsSpark}
        />
        <KpiCard
          label="Downloads"
          value={totalDownloads}
          deltaLabel={`last ${days}d`}
          accent={VIOLET_LIGHT}
          spark={downloadsSpark}
        />
        <KpiCard
          label="Completions"
          value={totalCompletes}
          format={(n) => `${n}`}
          deltaLabel={`${completionPct}% finish rate`}
          accent="#10b981"
        />
        <KpiCard
          label="jw.org clicks"
          value={totalJwClicks}
          deltaLabel="from song pages"
          accent="#3b82f6"
        />
        <KpiCard
          label="Shares"
          value={totalShares}
          deltaLabel={`last ${days}d`}
          accent="#f59e0b"
        />
      </div>

      {/* Plays + downloads per day */}
      <ChartCard title="Plays and downloads per day">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={dailySeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <AreaGradient id="songPlaysGrad" color={VIOLET} />
              <AreaGradient id="songDownloadsGrad" color={VIOLET_LIGHT} />
              <Glow id="songPlaysGlow" stdDeviation={2.4} />
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={dateFmt}
              tick={{ fill: t.tick, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: t.tick, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={32}
            />
            <Tooltip
              cursor={t.tooltip.cursor}
              content={
                <RichTooltip
                  series={dailySeries as unknown as Array<Record<string, unknown>>}
                  valueLabel="plays"
                  labelFormatter={(d) => dateFmt(String(d))}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="plays"
              stroke={VIOLET}
              fill="url(#songPlaysGrad)"
              strokeWidth={2.2}
              dot={false}
              style={{ filter: "url(#songPlaysGlow)" }}
              isAnimationActive
              animationDuration={900}
              activeDot={{ r: 5, fill: VIOLET_LIGHT, stroke: "#fff", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="downloads"
              stroke={VIOLET_LIGHT}
              fill="url(#songDownloadsGrad)"
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationDuration={900}
              activeDot={{ r: 4, fill: "#c4b5fd", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Per-song table */}
      <ChartCard title={`Per song (last ${days}d)`}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.grid}`, textAlign: "left" }}>
                <th style={th(t.tick)}>Song</th>
                <th style={thNum(t.tick)}>Plays</th>
                <th style={thNum(t.tick)}>Completes</th>
                <th style={thNum(t.tick)}>Finish %</th>
                <th style={thNum(t.tick)}>Downloads</th>
                <th style={thNum(t.tick)}>Shares</th>
                <th style={thNum(t.tick)}>jw.org clicks</th>
                <th style={thNum(t.tick)}>All-time plays</th>
                <th style={thNum(t.tick)}>All-time downloads</th>
                <th style={{ ...th(t.tick), textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {perSongRows.map((row) => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${t.grid}` }}>
                  <td style={td()}>
                    <a
                      href={`/songs/${row.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}
                    >
                      {row.title}
                    </a>
                    <div style={{ fontSize: 11, color: t.tick, marginTop: 2 }}>
                      {row.theme} · {row.scripture_ref}
                      {!row.published && (
                        <span
                          style={{
                            marginLeft: 8,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: "var(--accent-light)",
                            color: "var(--text-muted)",
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          DRAFT
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={tdNum()}>{row.window_plays.toLocaleString()}</td>
                  <td style={tdNum()}>{row.window_completes.toLocaleString()}</td>
                  <td style={tdNum()}>{row.completion_pct === null ? "–" : `${row.completion_pct}%`}</td>
                  <td style={tdNum()}>{row.window_downloads.toLocaleString()}</td>
                  <td style={tdNum()}>{row.window_shares.toLocaleString()}</td>
                  <td style={tdNum()}>{row.window_jw_org_clicks.toLocaleString()}</td>
                  <td style={tdNum("var(--text-muted)")}>{row.all_time_plays.toLocaleString()}</td>
                  <td style={tdNum("var(--text-muted)")}>{row.all_time_downloads.toLocaleString()}</td>
                  <td style={{ ...tdNum(), display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <button
                      onClick={() => togglePublish(row.id, row.published)}
                      disabled={updateSong.isPending}
                      style={actionBtn(row.published ? "#94a3b8" : VIOLET)}
                      title={row.published ? "Unpublish (move to draft)" : "Publish"}
                    >
                      {row.published ? "Unpublish" : "Publish"}
                    </button>
                    <button onClick={() => openEdit(row)} style={actionBtn("var(--text-muted)")}>
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(row)}
                      disabled={deleteSong.isPending}
                      style={actionBtn("#ef4444")}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {perSongRows.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: 32, textAlign: "center", color: t.tick }}>
                    No songs published yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Modals */}
      {editing && <SongEditModal song={editing} onClose={() => setEditing(null)} />}
      {showAdd && (
        <AddSongDialog
          onClose={() => { setShowAdd(false); setPrefill(null); }}
          initialValues={prefill}
        />
      )}

      {/* Source breakdown */}
      {sourceBreakdown.length > 0 && (
        <ChartCard title={`Where plays came from (last ${days}d)`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 4px" }}>
            {sourceBreakdown.map(({ source, count }) => {
              const pct = totalPlays > 0 ? (count / totalPlays) * 100 : 0;
              return (
                <div key={source} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 100,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      textTransform: "capitalize",
                    }}
                  >
                    {source}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      background: "var(--accent-light)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: `${pct}%`,
                        background: VIOLET,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 80,
                      textAlign: "right",
                      fontSize: 12,
                      fontVariantNumeric: "tabular-nums",
                      color: "var(--text-muted)",
                    }}
                  >
                    {count} ({pct.toFixed(0)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      )}
    </div>
  );
}

const th = (tickColor: string): React.CSSProperties => ({
  padding: "8px 12px",
  color: tickColor,
  fontWeight: 600,
});

const thNum = (tickColor: string): React.CSSProperties => ({
  ...th(tickColor),
  textAlign: "right",
});

const td = (color?: string): React.CSSProperties => ({
  padding: "10px 12px",
  color: color ?? undefined,
});

const tdNum = (color?: string): React.CSSProperties => ({
  padding: "10px 12px",
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  color: color ?? undefined,
});

const actionBtn = (color: string): React.CSSProperties => ({
  padding: "4px 10px",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  background: "transparent",
  color,
  border: `1px solid ${color === "var(--text-muted)" ? "var(--border)" : color}`,
  transition: "all 150ms ease",
});
