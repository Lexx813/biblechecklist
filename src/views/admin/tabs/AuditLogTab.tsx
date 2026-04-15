import { useAdminAuditLog } from "../../../hooks/useAdmin";
import { AdminSkeleton } from "./UsersTab";

const ACTION_LABELS: Record<string, { icon: React.ReactNode; label: string }> = {
  delete_user:      { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>, label: "Deleted user" },
  grant_admin:      { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>, label: "Granted admin" },
  revoke_admin:     { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>, label: "Revoked admin" },
  grant_moderator:  { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: "Granted moderator" },
  revoke_moderator: { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: "Revoked moderator" },
  ban_user:         { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>, label: "Banned user" },
  unban_user:       { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>, label: "Unbanned user" },
  grant_blog:       { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>, label: "Granted blog access" },
  revoke_blog:      { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>, label: "Revoked blog access" },
};

export function AuditLogTab() {
  const { data: entries = [], isLoading } = useAdminAuditLog({ limit: 200 });

  if (isLoading) return <AdminSkeleton />;

  if (!entries.length) return (
    <div className="admin-empty">No audit log entries yet. Actions taken by admins will appear here.</div>
  );

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Target</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => {
            const def = ACTION_LABELS[entry.action] ?? { icon: "🔧", label: entry.action };
            return (
              <tr key={entry.id}>
                <td className="admin-audit-time">
                  {new Date(entry.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td>{entry.actor?.display_name || entry.actor?.email || "—"}</td>
                <td><span className="admin-audit-action">{def.icon} {def.label}</span></td>
                <td className="admin-audit-target">{entry.target_email || entry.target_id || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
