import { useDeletedAccounts } from "../../../hooks/useAdmin";
import { AdminSkeleton } from "./UsersTab";

/** Record of deleted accounts — keeps the email after the auth user is gone. */
export function DeletedAccountsTab() {
  const { data: entries = [], isLoading } = useDeletedAccounts({ limit: 200 });

  if (isLoading) return <AdminSkeleton />;

  if (!entries.length) return (
    <div className="admin-empty">No deleted accounts yet. When a user deletes their account — or an admin removes one — it will be recorded here with their email.</div>
  );

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Email</th>
            <th>Name</th>
            <th>How</th>
            <th>Deleted by</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry.id}>
              <td className="admin-audit-time">
                {new Date(entry.created_at).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </td>
              <td>
                {entry.email
                  ? <a href={`mailto:${entry.email}`}>{entry.email}</a>
                  : <span className="text-[var(--text-muted)]">—</span>}
              </td>
              <td>{entry.display_name || <span className="text-[var(--text-muted)]">—</span>}</td>
              <td>
                {entry.deletion_type === "self"
                  ? <span className="admin-audit-action">Self-deleted</span>
                  : <span className="admin-audit-action">Admin removed</span>}
              </td>
              <td className="admin-audit-target">
                {entry.deletion_type === "self"
                  ? <span className="text-[var(--text-muted)]">user</span>
                  : (entry.deleted_by_name || entry.deleted_by_email || "—")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
