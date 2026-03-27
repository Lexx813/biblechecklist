import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getOrCreateKeyPair, importPublicKey, deriveSharedKey } from "../lib/e2e";

/**
 * Initialise E2E keys for the current user.
 * Generates a key pair if none exists, then publishes the public key to Supabase.
 */
// E2E encryption disabled — messages are protected by Supabase RLS.
// Key exchange infrastructure is preserved for future re-enablement.
export function useE2EKeys(_userId) {
  return { keyPair: null, ready: false };
}

/**
 * Derive the shared AES key for a conversation between the current user and another user.
 * Returns null until both parties have published their public keys.
 */
export function useSharedKey(keyPair, otherUserId) {
  const [sharedKey, setSharedKey] = useState(null);
  const [otherHasKey, setOtherHasKey] = useState(null); // null=loading, true/false

  useEffect(() => {
    if (!keyPair || !otherUserId) return;
    let cancelled = false;
    async function derive() {
      try {
        const { data } = await supabase
          .from("user_keys")
          .select("public_key_jwk")
          .eq("user_id", otherUserId)
          .single();

        if (cancelled) return;

        if (!data?.public_key_jwk) {
          setOtherHasKey(false);
          setSharedKey(null);
          return;
        }

        setOtherHasKey(true);
        const theirPublicKey = await importPublicKey(data.public_key_jwk);
        const key = await deriveSharedKey(keyPair.privateKey, theirPublicKey);
        if (!cancelled) setSharedKey(key);
      } catch (err) {
        console.error("[E2E] Shared key derivation failed:", err);
        if (!cancelled) setOtherHasKey(false);
      }
    }
    derive();
    return () => { cancelled = true; };
  }, [keyPair, otherUserId]);

  return { sharedKey, otherHasKey };
}
