// @ts-nocheck
// Simple event-based toast system — no context needed
export function toast(message, type = "success") {
  window.dispatchEvent(new CustomEvent("nwt-toast", { detail: { message, type } }));
}

toast.success = (msg) => toast(msg, "success");
toast.error   = (msg) => toast(msg, "error");
toast.info    = (msg) => toast(msg, "info");
toast.warning = (msg) => toast(msg, "warning");
