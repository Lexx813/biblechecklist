// Simple event-based toast system — no context needed
type ToastType = "success" | "error" | "info" | "warning";

interface ToastFn {
  (message: string, type?: ToastType): void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
  warning: (msg: string) => void;
}

function _toast(message: string, type: ToastType = "success"): void {
  window.dispatchEvent(new CustomEvent("nwt-toast", { detail: { message, type } }));
}

export const toast = _toast as ToastFn;

toast.success = (msg: string) => toast(msg, "success");
toast.error   = (msg: string) => toast(msg, "error");
toast.info    = (msg: string) => toast(msg, "info");
toast.warning = (msg: string) => toast(msg, "warning");
