import { useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button, Input } from "../../../components/ui";
import { useFocusTrap } from "../../../hooks/useFocusTrap";
import { useFriends, type FriendProfile } from "../../../hooks/useFriends";
import {
  useGroupMembers, useAddFriendsToGroup, useInviteByEmail,
  useGroupInviteCode, useResetGroupInvite,
} from "../../../hooks/useGroups";
import { GroupMember } from "../../../api/groups";
import { shareInviteLink } from "../../../lib/shareInvite";
import { isValidEmail } from "../../../lib/groupInviteEmail";
import { toast } from "../../../lib/toast";
import Avatar from "./Avatar";

interface Props {
  groupId: string;
  groupName: string;
  userId: string;
  isAdmin: boolean;
  onClose: () => void;
}

const sectionLabel = "text-xs font-bold uppercase tracking-[0.05em] text-[var(--text-muted)]";

export default function InviteMembersModal({ groupId, groupName, userId, isAdmin, onClose }: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, { onClose });

  const { data: friends = [], isLoading: friendsLoading } = useFriends(userId);
  const { data: members = [] } = useGroupMembers(groupId);
  const addFriends = useAddFriendsToGroup(groupId);
  const inviteByEmail = useInviteByEmail(groupId);
  const { data: inviteCode } = useGroupInviteCode(groupId, true);
  const resetInvite = useResetGroupInvite(groupId);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const memberIds = useMemo(
    () => new Set((members as GroupMember[]).filter(m => m.status === "member").map(m => m.user_id)),
    [members],
  );
  const invitable = (friends as FriendProfile[]).filter(f => f.id && !memberIds.has(f.id));

  function toggleFriend(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleAddFriends() {
    addFriends.mutate([...selected], {
      onSuccess: (count) => {
        setSelected(new Set());
        toast.success(t("groups.invite.friendsAdded", { count }));
      },
      onError: () => toast.error(t("groups.invite.failed")),
    });
  }

  function handleEmail(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!isValidEmail(value)) {
      setEmailError(t("groups.invite.invalidEmail"));
      return;
    }
    setEmailError(null);
    inviteByEmail.mutate(value, {
      onSuccess: () => {
        setEmail("");
        toast.success(t("groups.invite.emailSent", { email: value }));
      },
      onError: (err) => setEmailError(err instanceof Error ? err.message : t("groups.invite.failed")),
    });
  }

  async function handleShareLink() {
    if (!inviteCode) return;
    const url = `${window.location.origin}/groups/${groupId}?join=${inviteCode}`;
    const result = await shareInviteLink(url, t("groups.invite.shareText", { name: groupName }));
    if (result === "copied") toast.success(t("groups.invite.linkCopied"));
    else if (result === "failed") toast.error(t("groups.invite.failed"));
  }

  function handleResetLink() {
    resetInvite.mutate(undefined, {
      onSuccess: () => toast.success(t("groups.invite.linkReset")),
      onError: () => toast.error(t("groups.invite.failed")),
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-overlay)] flex items-end justify-center bg-[rgba(10,5,20,0.60)] backdrop-blur-[12px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="grp-invite-title"
        className="flex max-h-[90dvh] w-full flex-col gap-6 overflow-y-auto rounded-t-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)] px-4 pb-6 pt-5 shadow-[var(--shadow-xl)] sm:max-w-[480px] sm:rounded-[var(--radius-lg)] sm:px-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="grp-invite-title" className="text-lg font-bold text-[var(--text-primary)]">
              {t("groups.invite.title")}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">{groupName}</p>
          </div>
          <Button variant="icon" size="sm" onClick={onClose} aria-label={t("common.close")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Button>
        </div>

        {/* Friends */}
        <section className="flex flex-col gap-3">
          <h3 className={sectionLabel}>{t("groups.invite.friendsHeading")}</h3>
          {friendsLoading ? (
            <div className="skeleton h-14 rounded-md" />
          ) : invitable.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              {(friends as FriendProfile[]).length === 0 ? t("groups.invite.noFriends") : t("groups.invite.allFriendsIn")}
            </p>
          ) : (
            <>
              <ul className="flex max-h-56 flex-col overflow-y-auto rounded-md border border-[var(--border)]">
                {invitable.map(f => (
                  <li key={f.id}>
                    <label className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-[var(--hover-bg)]">
                      <input
                        type="checkbox"
                        className="size-4 accent-[#7c3aed]"
                        checked={selected.has(f.id)}
                        onChange={() => toggleFriend(f.id)}
                      />
                      <Avatar src={f.avatar_url} name={f.display_name} size={32} />
                      <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {f.display_name || t("groups.unknown")}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleAddFriends}
                disabled={selected.size === 0}
                loading={addFriends.isPending}
              >
                {t("groups.invite.addFriends", { count: selected.size })}
              </Button>
            </>
          )}
        </section>

        {/* Email */}
        <section className="flex flex-col gap-3">
          <h3 className={sectionLabel}>{t("groups.invite.emailHeading")}</h3>
          <form onSubmit={handleEmail} className="flex flex-col gap-2 sm:flex-row" noValidate>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("groups.invite.emailPlaceholder")}
              aria-label={t("groups.invite.emailHeading")}
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(null); }}
              error={!!emailError}
            />
            <Button type="submit" loading={inviteByEmail.isPending} size="lg">
              {t("groups.invite.send")}
            </Button>
          </form>
          {emailError ? (
            <p className="text-xs text-red-600" role="alert">{emailError}</p>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">{t("groups.invite.emailHint")}</p>
          )}
        </section>

        {/* Link */}
        <section className="flex flex-col gap-3">
          <h3 className={sectionLabel}>{t("groups.invite.linkHeading")}</h3>
          <p className="text-xs text-[var(--text-muted)]">{t("groups.invite.linkHint")}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleShareLink} disabled={!inviteCode}>
              {t("groups.invite.shareLink")}
            </Button>
            {isAdmin && (
              <Button variant="ghost" onClick={handleResetLink} loading={resetInvite.isPending} disabled={!inviteCode}>
                {t("groups.invite.resetLink")}
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
}
