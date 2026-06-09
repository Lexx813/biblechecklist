import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useCreateEvent } from "../../../hooks/useGroups";
import { useFocusTrap } from "../../../hooks/useFocusTrap";

interface Props {
  groupId: string;
  onClose: () => void;
}

export default function CreateEventModal({ groupId, onClose }: Props) {
  const { t } = useTranslation();
  const createEvent = useCreateEvent(groupId);
  const [form, setForm] = useState({ title: "", description: "", location: "", starts_at: "", ends_at: "" });
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  useFocusTrap(dialogRef, { onClose });

  // Focus the title field on mount (after the trap so it wins over autofocus).
  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.starts_at) return;
    setError("");
    createEvent.mutate(
      {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        starts_at: form.starts_at,
        ends_at: form.ends_at || undefined,
      },
      { onSuccess: () => onClose(), onError: (err: Error) => setError(err.message) }
    );
  }

  return createPortal(
    <div className="grp-modal-overlay" onClick={onClose}>
      <div ref={dialogRef} className="grp-modal" role="dialog" aria-modal="true" aria-label={t("groups.events.createAria")} onClick={e => e.stopPropagation()}>
        <div className="grp-modal-header">
          <h2 className="grp-modal-title">{t("groups.events.createTitle")}</h2>
          <button className="grp-modal-close" onClick={onClose} aria-label={t("groups.events.closeAria")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form className="grp-modal-body" onSubmit={submit}>
          <label className="grp-field"><span>{t("groups.events.fieldTitle")}</span><input ref={titleInputRef} className="grp-input" value={form.title} onChange={e => set("title", e.target.value)} placeholder={t("groups.events.titlePlaceholder")} maxLength={120} required /></label>
          <label className="grp-field"><span>{t("groups.events.fieldDescription")} <span className="grp-optional">{t("groups.optional")}</span></span><textarea className="grp-input grp-textarea" value={form.description} onChange={e => set("description", e.target.value)} maxLength={500} rows={2} /></label>
          <label className="grp-field"><span>{t("groups.events.fieldLocation")} <span className="grp-optional">{t("groups.optional")}</span></span><input className="grp-input" value={form.location} onChange={e => set("location", e.target.value)} placeholder={t("groups.events.locationPlaceholder")} maxLength={200} /></label>
          <label className="grp-field"><span>{t("groups.events.fieldStartsAt")}</span><input className="grp-input" type="datetime-local" value={form.starts_at} onChange={e => set("starts_at", e.target.value)} required /></label>
          <label className="grp-field"><span>{t("groups.events.fieldEndsAt")} <span className="grp-optional">{t("groups.optional")}</span></span><input className="grp-input" type="datetime-local" value={form.ends_at} onChange={e => set("ends_at", e.target.value)} /></label>
          {error && <p className="grp-error">{error}</p>}
          <div className="grp-modal-actions">
            <button type="button" className="grp-btn grp-btn--ghost" onClick={onClose}>{t("groups.events.cancel")}</button>
            <button type="submit" className="grp-btn grp-btn--primary" disabled={createEvent.isPending || !form.title.trim() || !form.starts_at}>
              {createEvent.isPending ? t("groups.events.creating") : t("groups.events.create")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
