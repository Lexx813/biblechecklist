import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useUploadAvatar } from "../../hooks/useAdmin";
import { useFollowCounts, useIsFollowing, useToggleFollow } from "../../hooks/useFollows";
import { FriendRequestButton } from "../../components/FriendRequestButton";
import { useGetOrCreateDM } from "../../hooks/useMessages";
import { friendsApi } from "../../api/friends";
import Button from "../../components/ui/Button";
import { formatDate } from "../../utils/formatters";

/* ── Types ──────────────────────────────────────────────────── */

interface Props {
  profile: any;
  userId: string;
  currentUserId: string;
  isOwner: boolean;
  navigate: (page: string, params?: any) => void;
  isPremium: boolean;
  onUpgrade: () => void;
  onEditProfile?: () => void;
}

/* ── Avatar (internal) ──────────────────────────────────────── */

function AvatarOverlap({
  profile,
  userId,
  isOwner,
}: {
  profile: any;
  userId: string;
  isOwner: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatar(userId);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    upload.mutate(file, { onSettled: () => setPreview(null) });
  }

  const src = preview ?? profile?.avatar_url;
  const initial = (profile?.display_name || profile?.email || "?")[0].toUpperCase();

  const avatarContent = src ? (
    <img
      src={src}
      alt=""
      className="size-28 sm:size-36 rounded-full border-4 border-[var(--card-bg)] object-cover shadow-lg"
      width={144}
      height={144}
      loading="lazy"
    />
  ) : (
    <span className="flex size-28 sm:size-36 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-5xl font-extrabold text-white shadow-lg border-4 border-[var(--card-bg)]">
      {initial}
    </span>
  );

  if (!isOwner) {
    return <div className="-mt-16 sm:-mt-20 shrink-0">{avatarContent}</div>;
  }

  return (
    <div className="-mt-16 sm:-mt-20 shrink-0">
      <button
        type="button"
        className="group relative cursor-pointer rounded-full"
        onClick={() => fileRef.current?.click()}
        aria-label="Change avatar"
      >
        {avatarContent}
        {/* Camera overlay on hover */}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

/* ── ProfileHeader ──────────────────────────────────────────── */

export default function ProfileHeader({
  profile,
  userId,
  currentUserId,
  isOwner,
  navigate,
  isPremium,
  onUpgrade,
  onEditProfile,
}: Props) {
  const { t } = useTranslation();
  const { data: counts } = useFollowCounts(userId);
  const { data: isFollowing } = useIsFollowing(currentUserId, userId);
  const toggleFollow = useToggleFollow(currentUserId, userId);
  const getOrCreate = useGetOrCreateDM();

  /* ── Message handler (visitor) ── */

  async function handleMessage() {
    if (!isPremium) {
      const canMessage = await friendsApi.canMessageUser(userId, isPremium);
      if (!canMessage) {
        onUpgrade?.();
        return;
      }
    }
    getOrCreate.mutate(userId, {
      onSuccess: (conversationId: string) =>
        navigate("messages", {
          conversationId,
          otherDisplayName: profile?.display_name,
          otherAvatarUrl: profile?.avatar_url,
        }),
    });
  }

  /* ── Render ── */

  return (
    <div className="overflow-visible rounded-b-[var(--radius)] border border-t-0 border-[var(--border)] bg-[var(--card-bg)] px-5 pb-5 sm:px-8">
      {/* Avatar row */}
      <div className="flex items-end gap-4 sm:gap-6">
        <AvatarOverlap profile={profile} userId={userId} isOwner={isOwner} />

        {/* Name + counts beside avatar */}
        <div className="min-w-0 flex-1 pb-1">
          <h1 className="truncate text-xl font-extrabold text-[var(--text-primary)] sm:text-2xl">
            {profile?.display_name || profile?.email?.split("@")[0] || t("profile.anonymous", "Anonymous")}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            <button
              type="button"
              className="cursor-pointer appearance-none border-0 bg-transparent p-0 font-[inherit] text-sm text-[var(--text-muted)] outline-none hover:text-[var(--text-primary)] hover:underline"
              onClick={() => navigate("followers", { userId })}
            >
              <span className="font-bold text-[var(--text-primary)]">{counts?.followers ?? 0}</span> {t("profile.followers", "followers")}
            </button>
            {" \u00B7 "}
            <button
              type="button"
              className="cursor-pointer appearance-none border-0 bg-transparent p-0 font-[inherit] text-sm text-[var(--text-muted)] outline-none hover:text-[var(--text-primary)] hover:underline"
              onClick={() => navigate("following", { userId })}
            >
              <span className="font-bold text-[var(--text-primary)]">{counts?.following ?? 0}</span> {t("profile.following", "following")}
            </button>
          </p>
          {profile?.created_at && (
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {t("profile.memberSince", { date: formatDate(profile.created_at, "long"), defaultValue: "Member since {{date}}" })}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile?.bio && (
        <p className="mt-3 max-w-[560px] text-sm leading-relaxed text-[var(--text-secondary)]">
          {profile.bio}
        </p>
      )}

      {/* Action buttons — full width row below avatar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isOwner ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={onEditProfile}
            iconLeft={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            }
          >
            {t("profile.editProfile", "Edit Profile")}
          </Button>
        ) : (
          <>
            <Button
              variant={isFollowing ? "ghost" : "primary"}
              size="sm"
              onClick={() => toggleFollow.mutate()}
              loading={toggleFollow.isPending}
            >
              {isFollowing
                ? t("profile.unfollow", "Unfollow")
                : t("profile.follow", "Follow")}
            </Button>

            <FriendRequestButton
              currentUserId={currentUserId}
              targetId={userId}
            />

            <Button
              variant="secondary"
              size="sm"
              onClick={handleMessage}
              loading={getOrCreate.isPending}
              iconLeft={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              }
            >
              {t("profile.message", "Message")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
