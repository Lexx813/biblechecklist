// @ts-nocheck
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export default function ConfirmModal({ message, onConfirm, onCancel, confirmLabel, danger = true }) {
  const { t } = useTranslation();
  return createPortal(
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-body">
          <div className="confirm-title">{t("confirm.title")}</div>
          <div className="confirm-message">{message}</div>
        </div>
        <div className="confirm-actions">
          <button className="confirm-cancel-btn" onClick={onCancel}>{t("common.cancel")}</button>
          <button
            className={`confirm-ok-btn${danger ? " confirm-ok-btn--danger" : ""}`}
            onClick={onConfirm}
          >
            {confirmLabel ?? t("common.delete")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
