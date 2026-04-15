import { useRef, useState } from "react";
import { useUploadCover } from "../../hooks/useAdmin";
import { toast } from "../../lib/toast";

interface Props {
  coverUrl: string | null;
  userId: string;
  isOwner: boolean;
  onSettingsClick?: () => void;
}

export default function CoverPhoto({
  coverUrl,
  userId,
  isOwner,
  onSettingsClick,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadCover(userId);

  const displayUrl = previewUrl || coverUrl;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    upload.mutate(file, {
      onError: (err: unknown) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to upload cover photo"
        );
      },
      onSettled: () => {
        setPreviewUrl(null);
        URL.revokeObjectURL(preview);
        // Reset input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  }

  return (
    <div className="relative h-[200px] w-full overflow-hidden sm:h-[240px]">
      {/* Background: gradient or image */}
      {displayUrl ? (
        <img
          src={displayUrl}
          alt="Cover photo"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0635] via-[#3b1080] to-[#6d28d9]" />
          {/* Subtle geometric pattern so blank cover looks intentional */}
          <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cover-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cover-dots)" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-violet-400/15" />
        </>
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

      {/* Owner controls */}
      {isOwner && (
        <>
          {/* Settings cog */}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-black/35 text-white/85 transition-colors hover:bg-black/55 hover:text-white"
              aria-label="Settings"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}

          {/* Edit Cover button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={upload.isPending}
            className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
          >
            {upload.isPending ? (
              /* Spinner */
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="animate-spin"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  strokeOpacity="0.25"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  strokeOpacity="0.75"
                />
              </svg>
            ) : (
              /* Camera icon */
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            )}
            Edit Cover
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
