import i18n from "../../../i18n";

export function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return i18n.t("groups.timeJustNow", "just now");
  if (m < 60) return i18n.t("groups.timeMinutesAgo", "{{count}}m ago", { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return i18n.t("groups.timeHoursAgo", "{{count}}h ago", { count: h });
  return i18n.t("groups.timeDaysAgo", "{{count}}d ago", { count: Math.floor(h / 24) });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
