// @ts-nocheck
/**
 * End-to-end encryption for direct messages.
 * Uses ECDH P-256 for key exchange, HKDF for key derivation, AES-256-GCM for encryption.
 * Private keys never leave the user's device (stored in localStorage as JWK).
 * Public keys are published to Supabase so the other party can derive the shared key.
 */

const STORAGE_KEY = (userId) => `nwt-e2e-${userId}`;

// ── Base64url helpers ─────────────────────────────────────────────────────────

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(str) {
  const pad = "=".repeat((4 - (str.length % 4)) % 4);
  return Uint8Array.from(atob((str + pad).replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
}

// ── Key operations ────────────────────────────────────────────────────────────

async function importPublicKey(jwk) {
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, true, []);
}

async function importPrivateKey(jwk) {
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
}

/**
 * Generate a fresh ECDH P-256 key pair.
 * Returns { privateKey, publicKey, publicJwk }
 */
export async function generateKeyPair() {
  const kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const publicJwk = await crypto.subtle.exportKey("jwk", kp.publicKey);
  const privateJwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
  return { privateKey: kp.privateKey, publicKey: kp.publicKey, publicJwk, privateJwk };
}

/**
 * Load key pair from localStorage, or generate and persist a new one.
 */
export async function getOrCreateKeyPair(userId) {
  const stored = localStorage.getItem(STORAGE_KEY(userId));
  if (stored) {
    try {
      const { privateJwk, publicJwk } = JSON.parse(stored);
      const [privateKey, publicKey] = await Promise.all([
        importPrivateKey(privateJwk),
        importPublicKey(publicJwk),
      ]);
      return { privateKey, publicKey, publicJwk };
    } catch {
      // Corrupted — fall through to regenerate
    }
  }
  const kp = await generateKeyPair();
  localStorage.setItem(STORAGE_KEY(userId), JSON.stringify({ privateJwk: kp.privateJwk, publicJwk: kp.publicJwk }));
  return { privateKey: kp.privateKey, publicKey: kp.publicKey, publicJwk: kp.publicJwk };
}

/**
 * Derive a shared AES-256-GCM key from ECDH + HKDF.
 * Alice(privateKey) + Bob(publicKey) === Bob(privateKey) + Alice(publicKey)
 */
export async function deriveSharedKey(myPrivateKey, theirPublicKey) {
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: theirPublicKey },
    myPrivateKey,
    256
  );
  const hkdfKey = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(32),
      info: new TextEncoder().encode("nwt-messages-v1"),
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Import another user's public key from JWK (fetched from Supabase).
 */
export { importPublicKey };

// ── Encrypt / Decrypt ─────────────────────────────────────────────────────────

/**
 * Encrypt a plaintext string. Returns "enc:{iv}:{ciphertext}" (base64url).
 */
export async function encryptMessage(plaintext, aesKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded);
  return `enc:${b64url(iv)}:${b64url(ciphertext)}`;
}

/**
 * Decrypt an "enc:iv:ct" string. Returns plaintext.
 * If content doesn't start with "enc:", it's a legacy plaintext message — returned as-is.
 */
export async function decryptMessage(content, aesKey) {
  if (!content?.startsWith("enc:")) return content ?? "";
  try {
    const parts = content.split(":");
    if (parts.length < 3) return "[🔒 Malformed message]";
    const iv = fromB64url(parts[1]);
    const ct = fromB64url(parts.slice(2).join(":")); // handle colons in ciphertext
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ct);
    return new TextDecoder().decode(plain);
  } catch {
    return "[🔒 Unable to decrypt]";
  }
}

/** Maximum allowed message length (enforced client-side; mirror in DB CHECK constraint). */
export const MAX_MSG_LENGTH = 2000;

/**
 * Sanitize user-supplied chat content before storing or encrypting.
 *
 * Strategy (defence-in-depth):
 *  1. Type-guard — reject non-strings silently.
 *  2. DOMParser textContent extraction — the browser's own HTML parser strips
 *     every tag, attribute, and event handler, including malformed/nested markup
 *     that defeats regex approaches (e.g. <scr<script>ipt>alert(1)</script>).
 *  3. Strip null bytes and ASCII control characters (except \t \n \r).
 *  4. Collapse runs of whitespace-only lines to at most two consecutive newlines.
 *  5. Hard-truncate to MAX_MSG_LENGTH after sanitisation.
 *
 * Note: React's JSX renderer already HTML-encodes every string value at render
 * time, so this sanitisation is a belt-and-suspenders measure for the stored
 * copy and for any future surface that might render content differently.
 */
export function sanitizeContent(content) {
  if (typeof content !== "string") return "";

  // Step 1: use DOMParser to safely extract plain text from any HTML
  const doc = new DOMParser().parseFromString(content, "text/html");
  let text = doc.body.textContent ?? "";

  // Step 2: remove null bytes and non-printable control chars (keep \t \n \r)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Step 3: collapse excessive blank lines (max 2 consecutive newlines)
  text = text.replace(/\n{3,}/g, "\n\n");

  // Step 4: trim and enforce length cap
  return text.trim().slice(0, MAX_MSG_LENGTH);
}
