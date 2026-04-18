import { useState } from "react";
import {
  useCampaign, useCreateCampaign, useUpdateCampaign,
  useSendCampaign, useAudienceEstimate, useDistinctTags,
} from "../../../../hooks/useCampaigns";
import { Campaign, SegmentConfig } from "../../../../api/campaigns";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "tl", label: "Filipino" },
  { code: "zh", label: "中文" },
];

const CRON_PRESETS = [
  { label: "Daily at 8am UTC",      value: "0 8 * * *" },
  { label: "Weekly Monday 8am UTC", value: "0 8 * * 1" },
  { label: "Monthly 1st at 8am",    value: "0 8 1 * *" },
  { label: "Custom",                value: "custom" },
];

type SendMode = "now" | "scheduled" | "recurring";

interface Props {
  campaignId:    string | null;
  currentUserId: string;
  onBack:        () => void;
  onSent:        () => void;
}

export function CampaignEditor({ campaignId, currentUserId, onBack, onSent }: Props) {
  const { data: existing }    = useCampaign(campaignId);
  const createCampaign        = useCreateCampaign();
  const updateCampaign        = useUpdateCampaign();
  const sendCampaign          = useSendCampaign();
  const { data: allTags = [] } = useDistinctTags();

  const [name,        setName]        = useState(existing?.name         ?? "");
  const [subject,     setSubject]     = useState(existing?.subject      ?? "");
  const [previewText, setPreviewText] = useState(existing?.preview_text ?? "");
  const [htmlBody,    setHtmlBody]    = useState(existing?.html_body    ?? "");
  const [type,        setType]        = useState<Campaign["type"]>(existing?.type ?? "broadcast");
  const [preview,     setPreview]     = useState(false);
  const [sendMode,    setSendMode]    = useState<SendMode>("now");
  const [scheduleAt,  setScheduleAt]  = useState("");
  const [cronPreset,  setCronPreset]  = useState("0 8 * * 1");
  const [cronCustom,  setCronCustom]  = useState("");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  const [segment, setSegment] = useState<SegmentConfig>(existing?.segment_config ?? {});

  const { data: audienceCount } = useAudienceEstimate(segment);

  function updateSegment(patch: Partial<SegmentConfig>) {
    setSegment(prev => ({ ...prev, ...patch }));
  }

  function toggleLanguage(code: string) {
    const langs = segment.languages ?? [];
    updateSegment({
      languages: langs.includes(code) ? langs.filter(l => l !== code) : [...langs, code],
    });
  }

  function toggleTag(tag: string, kind: "tags" | "exclude_tags") {
    const current = (segment[kind] ?? []) as string[];
    updateSegment({
      [kind]: current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag],
    });
  }

  async function handleSave(andSend = false) {
    if (!name || !subject || !htmlBody) {
      setError("Name, subject, and body are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const effectiveCron = cronPreset === "custom" ? cronCustom : cronPreset;
      const payload: Omit<Campaign, "id" | "created_at" | "updated_at" | "sent_count" | "last_sent_at" | "next_run_at"> = {
        name,
        subject,
        preview_text:    previewText || null,
        html_body:       htmlBody,
        type,
        status:          sendMode === "scheduled" ? "scheduled"
                       : sendMode === "recurring"  ? "recurring"
                       : "draft",
        segment_config:  segment,
        schedule_at:     sendMode === "scheduled" ? new Date(scheduleAt).toISOString() : null,
        recurrence_cron: sendMode === "recurring"  ? effectiveCron : null,
        created_by:      currentUserId,
      };

      let savedId = campaignId;
      if (campaignId) {
        await updateCampaign.mutateAsync({ id: campaignId, payload });
      } else {
        const created = await createCampaign.mutateAsync(payload);
        savedId = created.id;
      }

      if (andSend && savedId) {
        await sendCampaign.mutateAsync(savedId);
        onSent();
      } else {
        onBack();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-white">
          {campaignId ? "Edit Campaign" : "New Campaign"}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* ── Left: Content ── */}
        <div className="space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            {(["broadcast", "newsletter", "sequence"] as Campaign["type"][]).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  type === t
                    ? "bg-purple-600 text-white"
                    : "bg-white/8 text-gray-400 hover:text-white hover:bg-white/12"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Campaign name (internal)"
            className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Email subject line"
            className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <input
            value={previewText}
            onChange={e => setPreviewText(e.target.value)}
            placeholder="Preview text (shows in inbox preview)"
            className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />

          {/* HTML editor with preview toggle */}
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between bg-white/5 border-b border-white/10 px-4 py-2">
              <span className="text-sm text-gray-400 font-medium">Email Body (HTML)</span>
              <button
                onClick={() => setPreview(p => !p)}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                {preview ? "← Edit" : "Preview →"}
              </button>
            </div>
            {preview ? (
              <iframe
                srcDoc={htmlBody || "<p style='padding:20px;color:#888'>Nothing to preview</p>"}
                className="w-full h-[480px] bg-white"
                sandbox="allow-same-origin"
                title="Email preview"
              />
            ) : (
              <textarea
                value={htmlBody}
                onChange={e => setHtmlBody(e.target.value)}
                placeholder="Paste your HTML email here…"
                className="w-full h-[480px] bg-transparent px-4 py-3 text-sm text-gray-200 placeholder-gray-600 font-mono focus:outline-none resize-none"
              />
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        {/* ── Right: Settings ── */}
        <div className="space-y-4">
          {/* Segment Builder */}
          <div className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Audience</h3>
              <span className="text-xs text-purple-300 font-medium">
                ~{audienceCount?.toLocaleString() ?? "…"} users
              </span>
            </div>

            {/* Plan */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider">Plan</label>
              <div className="flex gap-2 mt-1.5">
                {(["all", "free", "premium"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => updateSegment({ plan: p })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      (segment.plan ?? "all") === p
                        ? "bg-purple-600 text-white"
                        : "bg-white/6 text-gray-400 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider">Languages</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => toggleLanguage(l.code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      (segment.languages ?? []).includes(l.code)
                        ? "bg-purple-700 text-white"
                        : "bg-white/6 text-gray-400 hover:text-white"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Joined date range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Joined after</label>
                <input
                  type="date"
                  value={segment.joined_after?.slice(0, 10) ?? ""}
                  onChange={e => updateSegment({ joined_after: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })}
                  className="w-full mt-1 bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Joined before</label>
                <input
                  type="date"
                  value={segment.joined_before?.slice(0, 10) ?? ""}
                  onChange={e => updateSegment({ joined_before: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })}
                  className="w-full mt-1 bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Inactive days */}
            <div>
              <label className="text-xs text-gray-500">Inactive for (days)</label>
              <input
                type="number" min="1" placeholder="e.g. 14"
                value={segment.inactive_days ?? ""}
                onChange={e => updateSegment({ inactive_days: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full mt-1 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Min chapters */}
            <div>
              <label className="text-xs text-gray-500">Min chapters read</label>
              <input
                type="number" min="0" placeholder="e.g. 10"
                value={segment.min_chapters_read ?? ""}
                onChange={e => updateSegment({ min_chapters_read: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full mt-1 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Include tags */}
            {allTags.length > 0 && (
              <div>
                <label className="text-xs text-gray-500">Include tags</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {allTags.map(({ tag }) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag, "tags")}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        (segment.tags ?? []).includes(tag)
                          ? "bg-green-700 text-white"
                          : "bg-white/6 text-gray-400 hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Exclude tags */}
            {allTags.length > 0 && (
              <div>
                <label className="text-xs text-gray-500">Exclude tags</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {allTags.map(({ tag }) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag, "exclude_tags")}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        (segment.exclude_tags ?? []).includes(tag)
                          ? "bg-red-700 text-white"
                          : "bg-white/6 text-gray-400 hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Send Options */}
          <div className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Send Options</h3>
            {(["now", "scheduled", "recurring"] as SendMode[]).map(mode => (
              <label key={mode} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio" name="sendMode" value={mode}
                  checked={sendMode === mode}
                  onChange={() => setSendMode(mode)}
                  className="mt-0.5 accent-purple-500"
                />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">
                    {mode === "now" ? "Send Now" : mode === "scheduled" ? "Schedule" : "Recurring"}
                  </p>
                  {mode === "scheduled" && sendMode === "scheduled" && (
                    <input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={e => setScheduleAt(e.target.value)}
                      className="mt-1.5 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  )}
                  {mode === "recurring" && sendMode === "recurring" && (
                    <div className="mt-1.5 space-y-2">
                      <select
                        value={cronPreset}
                        onChange={e => setCronPreset(e.target.value)}
                        className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        {CRON_PRESETS.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                      {cronPreset === "custom" && (
                        <input
                          value={cronCustom}
                          onChange={e => setCronCustom(e.target.value)}
                          placeholder="0 8 * * 1"
                          className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                        />
                      )}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleSave(sendMode === "now")}
              disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              {saving
                ? "Saving…"
                : sendMode === "now"
                  ? "Send Now"
                  : sendMode === "scheduled"
                    ? "Schedule Send"
                    : "Save Recurring"}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full bg-white/8 hover:bg-white/12 text-gray-300 font-medium py-2 rounded-xl transition-colors"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
