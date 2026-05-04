import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { useAdminLearnStats } from "../../../hooks/useLearn";
import { getUnits, totalLessonCount } from "../../learn/content";
import { useChartTheme, KpiCard, ChartCard, BarGradient } from "../../../components/charts";
import { AdminSkeleton } from "./UsersTab";

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function relativeTime(s: string | null | undefined): string {
  if (!s) return "—";
  const then = new Date(s).getTime();
  const diff = Date.now() - then;
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function LearnTab() {
  const { data: stats, isLoading, isError, error } = useAdminLearnStats();
  const t = useChartTheme();

  // Course shape (lesson order, titles) comes from local content, not the DB.
  const courseLessons = useMemo(() => {
    return getUnits("en").flatMap(u => u.lessons.map(l => ({
      lesson_id: l.id,
      unit_id: u.id,
      number: l.number,
      title: l.title,
      unit_number: u.number,
      unit_title: u.title,
    })));
  }, []);
  const totalLessons = totalLessonCount();

  if (isLoading) return <AdminSkeleton />;

  // Show a clear setup hint if the migration hasn't been applied yet.
  if (isError) {
    const msg = error instanceof Error ? error.message : String(error);
    return (
      <div style={{ padding: 32 }}>
        <div style={{
          background: "rgba(245, 158, 11, 0.08)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          borderRadius: 12,
          padding: 20,
          maxWidth: 720,
        }}>
          <h3 style={{ margin: "0 0 8px", color: "var(--warning, #f59e0b)" }}>
            Learn analytics not ready
          </h3>
          <p style={{ margin: "0 0 12px", color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
            The <code>learn_lesson_progress</code> table or <code>admin_learn_stats()</code>
            RPC isn&apos;t available yet. Run the migration in Supabase SQL Editor:
          </p>
          <pre style={{
            background: "rgba(0,0,0,0.2)",
            padding: 10,
            borderRadius: 8,
            fontSize: 12,
            overflowX: "auto",
            margin: 0,
          }}>supabase/migrations/20260503_learn_progress.sql</pre>
          <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
            Server said: {msg}
          </p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { per_lesson, per_user, totals } = stats;

  // Build per-lesson rows in canonical course order so a never-touched lesson
  // shows as 0, not "missing".
  const perLessonByCourseOrder = courseLessons.map((cl, idx) => {
    const row = per_lesson.find(p => p.lesson_id === cl.lesson_id);
    const completions = row?.completion_count ?? 0;
    const uniqueUsers = row?.unique_users ?? 0;
    return {
      ...cl,
      order: idx + 1,
      completions,
      uniqueUsers,
      latest: row?.latest_completion ?? null,
    };
  });

  // Funnel: drop-off vs prior lesson, by unique_users
  const withDropoff = perLessonByCourseOrder.map((row, i) => {
    const prevUsers = i === 0 ? null : perLessonByCourseOrder[i - 1].uniqueUsers;
    const dropPct = prevUsers && prevUsers > 0
      ? Math.round(((prevUsers - row.uniqueUsers) / prevUsers) * 100)
      : null;
    return { ...row, dropPct };
  });

  const completers = per_user.filter(u => u.lessons_completed >= totalLessons).length;
  const completionRate = totals.unique_starters > 0
    ? Math.round((completers / totals.unique_starters) * 100)
    : 0;
  const avgLessons = per_user.length > 0
    ? Math.round((per_user.reduce((s, u) => s + u.lessons_completed, 0) / per_user.length) * 10) / 10
    : 0;

  const chartData = withDropoff.map(r => ({
    name: `L${r.order}`,
    title: r.title,
    users: r.uniqueUsers,
  }));

  return (
    <div className="an-wrap">
      <div className="an-kpi-row">
        <KpiCard
          label="Unique starters"
          value={totals.unique_starters}
          deltaLabel={totals.first_activity ? `since ${formatDate(totals.first_activity)}` : "no data yet"}
          accent={t.purple}
        />
        <KpiCard
          label="Completed course"
          value={completers}
          deltaLabel={`${completionRate}% of starters`}
          accent={t.green}
        />
        <KpiCard
          label="Total completions"
          value={totals.total_completions}
          deltaLabel="lesson × user rows"
          accent={t.amber}
        />
        <KpiCard
          label="Avg lessons / user"
          value={`${avgLessons} / ${totalLessons}`}
          deltaLabel="among starters"
          accent={t.teal}
        />
      </div>

      <ChartCard title="Lesson funnel — unique users completing each lesson">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <BarGradient id="learnFunnel" color={t.purpleDark} highlight={t.purpleLight} />
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: t.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: t.tick, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
            <Tooltip
              cursor={t.tooltip.cursor}
              contentStyle={t.tooltip.contentStyle}
              itemStyle={t.tooltip.itemStyle}
              labelFormatter={(label, payload) => {
                const p = payload?.[0]?.payload as { title?: string } | undefined;
                return p?.title ? `${label} — ${p.title}` : String(label);
              }}
              formatter={(v: unknown) => [`${v}`, "Users"]}
            />
            <Bar dataKey="users" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={900}>
              {chartData.map((_, i) => <Cell key={i} fill="url(#learnFunnel)" />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Per-lesson detail">
        <div className="admin-table-wrap" style={{ marginTop: -8 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Lesson</th>
                <th>Unit</th>
                <th>Users</th>
                <th>Completions</th>
                <th>Drop vs prev</th>
                <th>Latest</th>
              </tr>
            </thead>
            <tbody>
              {withDropoff.map(r => (
                <tr key={r.lesson_id}>
                  <td><strong>L{r.order}</strong></td>
                  <td>{r.title}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: 12 }}>U{r.unit_number}: {r.unit_title}</td>
                  <td><strong>{r.uniqueUsers}</strong></td>
                  <td>{r.completions}</td>
                  <td>
                    {r.dropPct === null ? (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    ) : (
                      <span style={{
                        fontWeight: 600,
                        color: r.dropPct <= 10 ? "var(--success, #22c55e)"
                          : r.dropPct <= 30 ? "var(--warning, #f59e0b)"
                          : "var(--danger, #ef4444)",
                      }}>
                        {r.dropPct > 0 ? `−${r.dropPct}%` : `+${Math.abs(r.dropPct)}%`}
                      </span>
                    )}
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{relativeTime(r.latest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <ChartCard title={`Top users (${per_user.length} total)`}>
        <div className="admin-table-wrap" style={{ marginTop: -8 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Progress</th>
                <th>Last activity</th>
                <th>First activity</th>
              </tr>
            </thead>
            <tbody>
              {per_user.slice(0, 100).map(u => {
                const pct = Math.round((u.lessons_completed / totalLessons) * 100);
                return (
                  <tr key={u.user_id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatar_url} alt="" width={24} height={24} style={{ borderRadius: "50%" }} />
                        ) : (
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(124,58,237,0.2)" }} />
                        )}
                        <span>{u.display_name ?? "—"}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{u.email ?? "—"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 160 }}>
                        <div style={{
                          flex: 1, height: 6, borderRadius: 3,
                          background: "rgba(124,58,237,0.12)", overflow: "hidden",
                        }}>
                          <div style={{
                            width: `${pct}%`, height: "100%",
                            background: pct === 100 ? "var(--success, #22c55e)" : "#7c3aed",
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 60 }}>
                          {u.lessons_completed} / {totalLessons}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{relativeTime(u.last_activity)}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{formatDate(u.first_activity)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {per_user.length > 100 && (
          <p style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 12, textAlign: "center" }}>
            Showing top 100 of {per_user.length}. Server caps at 500.
          </p>
        )}
      </ChartCard>
    </div>
  );
}
