import { useState } from "react";
import {
  useCampaign, useCreateCampaign, useUpdateCampaign,
  useSendCampaign, useAudienceEstimate, useDistinctTags,
} from "../../../../hooks/useCampaigns";
import { useUsers } from "../../../../hooks/useAdmin";
import { Campaign, SegmentConfig } from "../../../../api/campaigns";

type TargetMode = "segment" | "individuals";

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
  { label: "Custom cron",           value: "custom" },
];

const TYPE_META: Record<Campaign["type"], { icon: string; desc: string }> = {
  broadcast:  { icon: "📢", desc: "One-time send to a segment" },
  newsletter: { icon: "📰", desc: "Recurring editorial content" },
  sequence:   { icon: "🔗", desc: "Automated drip series" },
};

type SendMode = "now" | "scheduled" | "recurring";

interface Props {
  campaignId:    string | null;
  currentUserId: string;
  onBack:        () => void;
  onSent:        () => void;
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/[0.02]">
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{title}</span>
      {action}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-500">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-purple-400 dark:focus:border-purple-500/70 focus:bg-white dark:focus:bg-white/8 transition-all";

export function CampaignEditor({ campaignId, currentUserId, onBack, onSent }: Props) {
  const { data: existing }      = useCampaign(campaignId);
  const createCampaign          = useCreateCampaign();
  const updateCampaign          = useUpdateCampaign();
  const sendCampaign            = useSendCampaign();
  const { data: allTags = [] }  = useDistinctTags();
  const { data: allUsers = [] } = useUsers();

  const existingConfig = existing?.segment_config ?? {};
  const initMode: TargetMode = existingConfig.recipient_ids?.length ? "individuals" : "segment";

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
  const [targetMode,  setTargetMode]  = useState<TargetMode>(initMode);
  const [userSearch,  setUserSearch]  = useState("");

  const [segment, setSegment] = useState<SegmentConfig>(existingConfig);

  const { data: audienceCount } = useAudienceEstimate(
    targetMode === "segment" ? segment : {}
  );

  const selectedIds = new Set(segment.recipient_ids ?? []);
  const typedUsers = allUsers as Array<{ id: string; display_name?: string | null; email?: string }>;
  const filteredUsers = typedUsers
    .filter(u =>
      !userSearch ||
      u.display_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    )
    .slice(0, 50);

  const selectedUsers = typedUsers.filter(u => selectedIds.has(u.id));

  function toggleRecipient(userId: string) {
    const next = new Set(selectedIds);
    next.has(userId) ? next.delete(userId) : next.add(userId);
    setSegment(prev => ({ ...prev, recipient_ids: Array.from(next) }));
  }

  function switchTargetMode(mode: TargetMode) {
    setTargetMode(mode);
    if (mode === "individuals") {
      setSegment({ recipient_ids: segment.recipient_ids ?? [] });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { recipient_ids: _r, ...rest } = segment;
      setSegment(rest);
    }
  }

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
      setError("Name, subject, and email body are required.");
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

  const sendLabel = saving
    ? "Saving…"
    : sendMode === "now"       ? "Send Now"
    : sendMode === "scheduled" ? "Schedule Send"
    : "Save Recurring";

  return (
    <div className="min-h-full p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/8 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
            {campaignId ? "Edit Campaign" : "New Campaign"}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Configure, segment, and send your email</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">

        {/* ── Left: Content ── */}
        <div className="space-y-5">

          {/* Campaign type */}
          <SectionCard>
            <SectionHeader title="Campaign Type" />
            <div className="p-4 grid grid-cols-3 gap-3">
              {(["broadcast", "newsletter", "sequence"] as Campaign["type"][]).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`group relative flex flex-col items-start gap-1.5 p-3.5 rounded-xl border transition-all text-left ${
                    type === t
                      ? "border-purple-500/50 bg-purple-50 dark:bg-purple-600/15 shadow-[0_0_0_1px_rgb(168_85_247/0.3)]"
                      : "border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/3 hover:border-gray-300 dark:hover:border-white/15 hover:bg-gray-100 dark:hover:bg-white/6"
                  }`}
                >
                  <span className="text-lg leading-none">{TYPE_META[t].icon}</span>
                  <span className={`text-sm font-semibold capitalize ${type === t ? "text-purple-700 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                    {t}
                  </span>
                  <span className="text-[11px] text-gray-500 leading-tight">{TYPE_META[t].desc}</span>
                  {type === t && (
                    <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-purple-400" />
                  )}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Content fields */}
          <SectionCard>
            <SectionHeader title="Email Content" />
            <div className="p-5 space-y-4">
              <Field label="Campaign name (internal)">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. April Newsletter"
                  autoComplete="off"
                  className={inputCls}
                />
              </Field>
              <Field label="Subject line">
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="What recipients see in their inbox"
                  autoComplete="off"
                  className={inputCls}
                />
              </Field>
              <Field label="Preview text">
                <input
                  value={previewText}
                  onChange={e => setPreviewText(e.target.value)}
                  placeholder="Short summary shown below subject in inbox"
                  autoComplete="off"
                  className={inputCls}
                />
              </Field>
            </div>
          </SectionCard>

          {/* HTML body */}
          <SectionCard>
            <SectionHeader
              title="Email Body (HTML)"
              action={
                <button
                  onClick={() => setPreview(p => !p)}
                  className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  {preview ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                      Edit HTML
                    </>
                  ) : (
                    <>
                      Preview
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </>
                  )}
                </button>
              }
            />
            {preview ? (
              <iframe
                srcDoc={htmlBody || "<div style='padding:32px;color:#999;font-family:sans-serif;text-align:center'>Nothing to preview yet</div>"}
                className="w-full h-[520px] bg-white"
                sandbox="allow-same-origin"
                title="Email preview"
              />
            ) : (
              <textarea
                value={htmlBody}
                onChange={e => setHtmlBody(e.target.value)}
                placeholder="Paste your HTML email here…"
                className="w-full h-[520px] bg-transparent px-5 py-4 text-sm text-gray-800 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 font-mono focus:outline-none resize-none"
              />
            )}
          </SectionCard>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 dark:text-red-400 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* ── Right: Settings ── */}
        <div className="space-y-5">

          {/* Audience / Segment */}
          <SectionCard>
            <SectionHeader
              title="Audience"
              action={
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-300">
                    ~{audienceCount?.toLocaleString() ?? "…"} users
                  </span>
                </div>
              }
            />
            <div className="p-4 space-y-5">

              {/* Targeting mode toggle */}
              <div className="grid grid-cols-2 gap-1.5 bg-gray-100 dark:bg-white/4 rounded-xl p-1">
                {(["segment", "individuals"] as TargetMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => switchTargetMode(mode)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                      targetMode === mode
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {mode === "segment" ? "Segment Filters" : "Pick Individuals"}
                  </button>
                ))}
              </div>

              {/* ── Individuals picker ── */}
              {targetMode === "individuals" && (
                <div className="space-y-3">
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUsers.map(u => (
                        <span
                          key={u.id}
                          className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-700/30 text-purple-700 dark:text-purple-200 text-xs px-2 py-1 rounded-lg"
                        >
                          {u.display_name ?? u.email}
                          <button
                            onClick={() => toggleRecipient(u.id)}
                            className="hover:text-red-400 transition-colors leading-none ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search users by name or email…"
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-purple-400 dark:focus:border-purple-500/70 transition-all"
                  />
                  <div className="space-y-0.5 max-h-52 overflow-y-auto pr-0.5">
                    {filteredUsers.map(u => {
                      const checked = selectedIds.has(u.id);
                      return (
                        <button
                          key={u.id}
                          onClick={() => toggleRecipient(u.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                            checked
                              ? "bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/30"
                              : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-all ${
                            checked ? "bg-purple-600 border border-purple-500" : "border border-gray-300 dark:border-white/20"
                          }`}>
                            {checked && (
                              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                                <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{u.display_name ?? "—"}</p>
                            <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                          </div>
                        </button>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <p className="text-center text-gray-600 py-4 text-xs">No users found</p>
                    )}
                  </div>
                  {selectedIds.size > 0 && (
                    <p className="text-xs text-gray-500 text-right">{selectedIds.size} recipient{selectedIds.size !== 1 ? "s" : ""} selected</p>
                  )}
                </div>
              )}

              {/* ── Segment filters ── */}
              {targetMode === "segment" && (
                <>
              {/* Plan */}
              <Field label="Plan">
                <div className="grid grid-cols-3 gap-1.5">
                  {(["all", "free", "premium"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => updateSegment({ plan: p })}
                      className={`py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                        (segment.plan ?? "all") === p
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/8"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Languages */}
              <Field label="Languages">
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.map(l => {
                    const active = (segment.languages ?? []).includes(l.code);
                    return (
                      <button
                        key={l.code}
                        onClick={() => toggleLanguage(l.code)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          active
                            ? "bg-purple-100 dark:bg-purple-600/80 text-purple-700 dark:text-white border border-purple-300 dark:border-purple-500/50"
                            : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/8 dark:hover:border-white/20"
                        }`}
                      >
                        {l.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {/* Joined date range */}
              <div className="grid grid-cols-2 gap-2">
                <Field label="Joined after">
                  <input
                    type="date"
                    value={segment.joined_after?.slice(0, 10) ?? ""}
                    onChange={e => updateSegment({ joined_after: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })}
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-400 dark:focus:border-purple-500/70 transition-all scheme-dark"
                  />
                </Field>
                <Field label="Joined before">
                  <input
                    type="date"
                    value={segment.joined_before?.slice(0, 10) ?? ""}
                    onChange={e => updateSegment({ joined_before: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })}
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-400 dark:focus:border-purple-500/70 transition-all scheme-dark"
                  />
                </Field>
              </div>

              {/* Inactive days + min chapters */}
              <div className="grid grid-cols-2 gap-2">
                <Field label="Inactive (days)">
                  <input
                    type="number" min="1" placeholder="e.g. 14"
                    value={segment.inactive_days ?? ""}
                    onChange={e => updateSegment({ inactive_days: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-400 dark:focus:border-purple-500/70 transition-all"
                  />
                </Field>
                <Field label="Min chapters">
                  <input
                    type="number" min="0" placeholder="e.g. 10"
                    value={segment.min_chapters_read ?? ""}
                    onChange={e => updateSegment({ min_chapters_read: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-400 dark:focus:border-purple-500/70 transition-all"
                  />
                </Field>
              </div>

              {/* Include / Exclude tags */}
              {allTags.length > 0 && (
                <>
                  <Field label="Include tags">
                    <div className="flex flex-wrap gap-1.5">
                      {allTags.map(({ tag }) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag, "tags")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                            (segment.tags ?? []).includes(tag)
                              ? "bg-emerald-100 dark:bg-emerald-700/60 text-emerald-700 dark:text-emerald-200 border-emerald-300 dark:border-emerald-600/40"
                              : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white border-gray-200 dark:border-white/8"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Exclude tags">
                    <div className="flex flex-wrap gap-1.5">
                      {allTags.map(({ tag }) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag, "exclude_tags")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                            (segment.exclude_tags ?? []).includes(tag)
                              ? "bg-red-100 dark:bg-red-700/60 text-red-600 dark:text-red-200 border-red-200 dark:border-red-600/40"
                              : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white border-gray-200 dark:border-white/8"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </Field>
                </>
              )}
                </>
              )}
            </div>
          </SectionCard>

          {/* Send Options */}
          <SectionCard>
            <SectionHeader title="Send Options" />
            <div className="p-4 space-y-2">
              {(["now", "scheduled", "recurring"] as SendMode[]).map(mode => {
                const labels: Record<SendMode, { title: string; sub: string }> = {
                  now:       { title: "Send Now",   sub: "Dispatch immediately" },
                  scheduled: { title: "Schedule",   sub: "Pick a date and time" },
                  recurring: { title: "Recurring",  sub: "Automated on a schedule" },
                };
                const active = sendMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setSendMode(mode)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      active
                        ? "border-purple-400 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-600/12"
                        : "border-gray-200 dark:border-white/6 bg-gray-50 dark:bg-white/3 hover:border-gray-300 dark:hover:border-white/12 hover:bg-gray-100 dark:hover:bg-white/6"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${
                      active ? "border-purple-500 bg-purple-500 shadow-[0_0_0_3px_rgb(168_85_247/0.2)]" : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {active && <div className="w-full h-full rounded-full scale-[0.4] bg-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold leading-tight ${active ? "text-purple-700 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                        {labels[mode].title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{labels[mode].sub}</p>
                    </div>
                  </button>
                );
              })}

              {/* Expanded controls */}
              {sendMode === "scheduled" && (
                <div className="pt-2">
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={e => setScheduleAt(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-400 dark:focus:border-purple-500/70 transition-all scheme-dark"
                  />
                </div>
              )}
              {sendMode === "recurring" && (
                <div className="pt-2 space-y-2">
                  <select
                    value={cronPreset}
                    onChange={e => setCronPreset(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-400 dark:focus:border-purple-500/70 transition-all scheme-dark"
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
                      className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:border-purple-400 dark:focus:border-purple-500/70 transition-all"
                    />
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={() => handleSave(sendMode === "now")}
              disabled={saving}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-900/30 text-sm"
            >
              {sendLabel}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full bg-gray-100 dark:bg-white/6 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/8 hover:border-gray-300 dark:hover:border-white/15 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium py-2.5 rounded-xl transition-all text-sm"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
