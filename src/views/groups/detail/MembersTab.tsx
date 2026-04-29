import { useTranslation } from "react-i18next";
import {
  useGroupMembers,
  useApproveJoinRequest, useDenyJoinRequest,
  useRemoveMember, useUpdateMemberRole,
} from "../../../hooks/useGroups";
import { GroupMember } from "../../../api/groups";
import { toast } from "../../../lib/toast";
import Avatar from "./Avatar";

interface Props {
  groupId: string;
  userId: string;
  isAdmin: boolean;
  isOwner: boolean;
}

export default function MembersTab({ groupId, userId, isAdmin, isOwner }: Props) {
  const { t } = useTranslation();
  const { data: members = [], isLoading } = useGroupMembers(groupId);
  const approve = useApproveJoinRequest(groupId);
  const deny = useDenyJoinRequest(groupId);
  const remove = useRemoveMember(groupId);
  const updateRole = useUpdateMemberRole(groupId);

  const pending = (members as GroupMember[]).filter(m => m.status === "pending");
  const active = (members as GroupMember[]).filter(m => m.status === "member");

  if (isLoading) return <div className="grp-tab-loading">{t("groups.loadingMembers")}</div>;

  return (
    <div className="grp-members-tab">
      {isAdmin && pending.length > 0 && (
        <div className="grp-pending-section">
          <h3 className="grp-section-label">{t("groups.joinRequests")} <span className="grp-tab-count">{pending.length}</span></h3>
          {pending.map(m => (
            <div key={m.id} className="grp-member-row grp-member-row--pending">
              <Avatar src={m.avatar_url} name={m.display_name} size={36} />
              <span className="grp-member-name">{m.display_name || t("groups.unknown")}</span>
              <div className="grp-member-actions">
                <button className="grp-btn grp-btn--sm grp-btn--primary" onClick={() => approve.mutate({ requestId: m.id, userId: m.user_id }, { onError: () => toast.error(t("groups.failedToApprove")) })}>{t("groups.approve")}</button>
                <button className="grp-btn grp-btn--sm grp-btn--ghost" onClick={() => deny.mutate(m.id, { onError: () => toast.error(t("groups.failedToDeny")) })}>{t("groups.deny")}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="grp-section-label">{t("groups.membersHeading")} <span className="grp-tab-count">{active.length}</span></h3>
      {active.map(m => (
        <div key={m.id} className="grp-member-row">
          <Avatar src={m.avatar_url} name={m.display_name} size={36} />
          <div className="grp-member-info">
            <span className="grp-member-name">{m.display_name || t("groups.unknown")}</span>
            <span className="grp-member-role">{m.role}</span>
          </div>
          {isAdmin && m.user_id !== userId && m.role !== "owner" && (
            <div className="grp-member-actions">
              {isOwner && (
                <button className="grp-btn grp-btn--sm grp-btn--ghost" onClick={() => updateRole.mutate(
                  { memberId: m.id, role: m.role === "admin" ? "member" : "admin" },
                  { onError: () => toast.error(t("groups.failedToUpdateRole")) }
                )}>
                  {m.role === "admin" ? t("groups.removeAdmin") : t("groups.makeAdmin")}
                </button>
              )}
              <button className="grp-btn grp-btn--sm grp-btn--danger" onClick={() => remove.mutate(m.id, { onError: () => toast.error(t("groups.failedToRemoveMember")) })}>{t("groups.remove")}</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
