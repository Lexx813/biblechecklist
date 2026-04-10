import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getOrCreateKeyPair, importPublicKey, deriveSharedKey } from "../lib/e2e";

interface KeyPair {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicJwk: JsonWebKey;
}

/**
 * Initialise E2E keys for the current user.
 * Generates a key pair if none exists, then publishes the public key to Supabase.
 */
// E2E encryption disabled — messages are protected by Supabase RLS.
// Key exchange infrastructure is preserved for future re-enablement.
export function useE2EKeys(_userId: string | undefined): { keyPair: null; ready: false } {
  return { keyPair: null, ready: false };
}

/**
 * Derive the shared AES key for a conversation between the current user and another user.
 * Returns null until both parties have published their public keys.
 */
export function useSharedKey(keyPair: KeyPair | null, otherUserId: string | undefined, myUserId?: string) {
  const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);
  const [otherHasKey, setOtherHasKey] = useState<boolean | null>(null); // null=loading, true/false

  useEffect(() => {
    if (!keyPair || !otherUserId || !myUserId) return;
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
        const theirPublicKey = await importPublicKey(data.public_key_jwk as JsonWebKey);
        const key = await deriveSharedKey(keyPair.privateKey, theirPublicKey, myUserId!, otherUserId!);
        if (!cancelled) setSharedKey(key);
      } catch (err) {
        console.error("[E2E] Shared key derivation failed:", err);
        if (!cancelled) setOtherHasKey(false);
      }
    }
    derive();
    return () => { cancelled = true; };
  }, [keyPair, otherUserId, myUserId]);

  return { sharedKey, otherHasKey };
}
