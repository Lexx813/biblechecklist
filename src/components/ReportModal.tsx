import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface Props {
  onSubmit: (reason: string) => void;
  onClose: () => void;
  isPending?: boolean;
}

export default function ReportModal({ onSubmit, onClose, isPending }: Props) {
  const [reason, setReason] = useState("");
  const { t } = useTranslation();
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <h3 className="modal-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",marginRight:6}}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>{t("report.title")}</h3>
        <p className="modal-sub">{t("report.sub")}</p>
        <textarea
          id="report-reason"
          name="reason"
          className="modal-textarea"
          placeholder={t("report.placeholder")}
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
        />
        <div className="modal-actions">
          <button className="modal-cancel-btn" onClick={onClose}>{t("common.cancel")}</button>
          <button
            className="modal-submit-btn modal-submit-btn--danger"
            onClick={() => onSubmit(reason)}
            disabled={isPending}
          >
            {isPending ? t("report.submitting") : t("report.submit")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
