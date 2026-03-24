import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ReportModal({ onSubmit, onClose, isPending }) {
  const [reason, setReason] = useState("");
  const { t } = useTranslation();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <h3 className="modal-title">🚩 {t("report.title")}</h3>
        <p className="modal-sub">{t("report.sub")}</p>
        <textarea
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
    </div>
  );
}
