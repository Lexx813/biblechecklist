// Simple event-based toast system — no context needed
export function toast(message, type = "error") {
  window.dispatchEvent(new CustomEvent("nwt-toast", { detail: { message, type } }));
}
