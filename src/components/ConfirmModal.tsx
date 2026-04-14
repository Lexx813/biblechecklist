import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import Button from "./ui/Button";

interface Props {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}

export default function ConfirmModal({ message, onConfirm, onCancel, confirmLabel, danger = true }: Props) {
  const { t } = useTranslation();
  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center bg-[rgba(10,5,20,0.60)] p-4 backdrop-blur-[12px] backdrop-saturate-[140%]"
      onClick={onCancel}
    >
      <div
        className="flex w-full max-w-[340px] animate-[confirm-in_var(--dur-base)_var(--ease-spring)] flex-col gap-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)] px-6 pb-6 pt-7 shadow-[var(--shadow-xl)]"
        role="dialog"
        aria-modal="true"
        aria-label="Confirm action"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          <div className="text-center text-lg font-bold text-[var(--text-primary)]">{t("confirm.title")}</div>
          <div className="text-center text-sm leading-relaxed text-[var(--text-muted)]">{message}</div>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            size="lg"
            className="flex-1 font-extrabold"
            onClick={onConfirm}
          >
            {confirmLabel ?? t("common.delete")}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
