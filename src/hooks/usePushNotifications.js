import { useState, useEffect } from "react";
import { pushApi } from "../api/pushSubscriptions";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";
const LS_KEY = "nwt-push-subscribed";

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// Get the service worker registration without using navigator.serviceWorker.ready,
// which hangs if the SW install event failed or is still in progress.
// getRegistration() returns immediately with whatever registration exists.
async function getSwReg() {
  let reg = await navigator.serviceWorker.getRegistration("/");

  // No registration at all — try registering the SW ourselves.
  if (!reg) {
    reg = await navigator.serviceWorker.register("/sw.js");
  }

  // If there's already an active SW we're done.
  if (reg.active) return reg;

  // SW is installing/waiting — wait up to 10 s for it to activate.
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("App is still loading. Please refresh and try again.")),
      10000
    );
    const done = () => { clearTimeout(timer); resolve(reg); };

    const sw = reg.installing ?? reg.waiting;
    if (!sw) { clearTimeout(timer); resolve(reg); return; }

    sw.addEventListener("statechange", function handler() {
      if (this.state === "activated") { sw.removeEventListener("statechange", handler); done(); }
      if (this.state === "redundant") { sw.removeEventListener("statechange", handler); reject(new Error("Service worker failed. Refresh and try again.")); }
    });
  });
}

export function usePushNotifications() {
  const supported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    !!VAPID_PUBLIC_KEY;

  const [permission, setPermission] = useState(() =>
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  // localStorage is the source of truth for the toggle UI so it persists
  // across reloads instantly without waiting for async browser checks.
  const [subscribed, setSubscribed] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === "1"; } catch { return false; }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // On mount: check the real browser subscription state.
  //   - If browser HAS a subscription  → confirm as subscribed (update localStorage)
  //   - If browser has NO subscription AND user intended to be subscribed (localStorage "1")
  //     AND permission is still granted → silently re-subscribe (Android clears these)
  //   - If permission was revoked        → clear saved preference
  //   - Otherwise                        → leave localStorage alone (don't reset on SW hiccup)
  useEffect(() => {
    if (!supported) return;

    getSwReg()
      .then(async (reg) => {
        const currentPerm = Notification.permission;
        setPermission(currentPerm);

        const sub = await reg.pushManager.getSubscription();

        if (sub) {
          // Browser has a live subscription — ensure localStorage reflects it
          setSubscribed(true);
          try { localStorage.setItem(LS_KEY, "1"); } catch {}
          return;
        }

        if (currentPerm === "denied") {
          // User revoked permission in OS settings — clear stored preference
          setSubscribed(false);
          try { localStorage.removeItem(LS_KEY); } catch {}
          return;
        }

        if (currentPerm === "granted" && localStorage.getItem(LS_KEY) === "1") {
          // Browser lost the subscription (Android battery saver, data clear, etc.)
          // but permission is still granted and user chose to be subscribed.
          // Re-subscribe silently — no permission dialog needed.
          try {
            const newSub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            await pushApi.save(newSub);
            setSubscribed(true);
          } catch {
            // Silent re-subscribe failed — clear stale state so user can retry manually
            setSubscribed(false);
            try { localStorage.removeItem(LS_KEY); } catch {}
          }
          return;
        }

        // No subscription, no saved preference — nothing to do
      })
      .catch(() => {
        // getSwReg() timed out or failed — leave localStorage state as-is
        // so the toggle still shows the user's last known preference.
      });
  }, [supported]);

  async function subscribe() {
    if (!supported) return false;
    setLoading(true);
    setError(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setError(
          result === "denied"
            ? "Notifications blocked. Open your browser or phone Settings → Site Settings → Notifications and allow this site."
            : "Notification permission was not granted. Please try again."
        );
        return false;
      }

      const reg = await getSwReg();

      // Reuse an existing browser subscription if present — it may just need
      // to be re-saved to the DB (e.g. after a DB row was lost).
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      await pushApi.save(sub);
      setSubscribed(true);
      try { localStorage.setItem(LS_KEY, "1"); } catch {}
      return true;
    } catch (err) {
      console.error("[push] subscribe failed:", err);
      setError(err.message || "Failed to enable notifications. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    if (!supported) return;
    setLoading(true);
    setError(null);
    try {
      const reg = await getSwReg();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await pushApi.remove(sub.endpoint);
        await sub.unsubscribe();
      } else {
        // No browser subscription but might still have a DB row — clean it up
        // by doing a best-effort delete (pushApi.remove handles missing rows gracefully)
      }
      setSubscribed(false);
      try { localStorage.removeItem(LS_KEY); } catch {}
    } catch (err) {
      console.error("[push] unsubscribe failed:", err);
      setError(err.message || "Failed to disable notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return { supported, permission, subscribed, loading, error, subscribe, unsubscribe };
}
