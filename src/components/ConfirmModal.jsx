export default function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = "Delete", danger = true }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-body">
          <div className="confirm-title">Are you sure?</div>
          <div className="confirm-message">{message}</div>
        </div>
        <div className="confirm-actions">
          <button className="confirm-cancel-btn" onClick={onCancel}>Cancel</button>
          <button
            className={`confirm-ok-btn${danger ? " confirm-ok-btn--danger" : ""}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
