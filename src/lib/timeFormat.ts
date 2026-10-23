import i18n from "../i18n";

export function fmtDiff(diff: number | null): string {
  if (diff == null) return "";
  if (diff < 60_000) return i18n.t("time.activeNow", "Active now");
  if (diff < 3_600_000) return i18n.t("time.minutesAgoShort", "{{count}}m ago", { count: Math.floor(diff / 60_000) });
  if (diff < 86_400_000) return i18n.t("time.hoursAgoShort", "{{count}}h ago", { count: Math.floor(diff / 3_600_000) });
  return i18n.t("time.daysAgoShort", "{{count}}d ago", { count: Math.floor(diff / 86_400_000) });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return i18n.t("time.justNow", "just now");
  if (m < 60) return i18n.t("time.minutesAgoShort", "{{count}}m ago", { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return i18n.t("time.hoursAgoShort", "{{count}}h ago", { count: h });
  const d = Math.floor(h / 24);
  if (d < 30) return i18n.t("time.daysAgoShort", "{{count}}d ago", { count: d });
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
