// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  sanitizeContent,
  encryptMessage,
  decryptMessage,
  generateKeyPair,
  deriveSharedKey,
  MAX_MSG_LENGTH,
} from "../e2e";

// ── sanitizeContent ───────────────────────────────────────────────────────────

describe("sanitizeContent", () => {
  it("returns plain text unchanged", () => {
    expect(sanitizeContent("Hello world")).toBe("Hello world");
  });

  it("strips HTML tags", () => {
    expect(sanitizeContent("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("strips script tags (XSS prevention)", () => {
    expect(sanitizeContent('<script>alert("xss")</script>Hello')).toBe("Hello");
  });

  it("strips event handler attributes", () => {
    expect(sanitizeContent('<img src="x" onerror="alert(1)">')).toBe("");
  });

  it("strips null bytes", () => {
    expect(sanitizeContent("Hello\x00World")).toBe("HelloWorld");
  });

  it("strips non-printable control characters but keeps \\t \\n \\r", () => {
    const input = "line1\nline2\ttabbed\r\nwindows";
    const result = sanitizeContent(input);
    expect(result).toContain("line1");
    expect(result).toContain("line2");
    expect(result).toContain("tabbed");
  });

  it("collapses 3+ consecutive newlines to 2", () => {
    const input = "para1\n\n\n\npara2";
    const result = sanitizeContent(input);
    expect(result).toBe("para1\n\npara2");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeContent("  hello  ")).toBe("hello");
  });

  it("truncates to MAX_MSG_LENGTH", () => {
    const long = "a".repeat(MAX_MSG_LENGTH + 100);
    expect(sanitizeContent(long)).toHaveLength(MAX_MSG_LENGTH);
  });

  it("returns empty string for non-string input", () => {
    expect(sanitizeContent(null as unknown as string)).toBe("");
    expect(sanitizeContent(undefined as unknown as string)).toBe("");
    expect(sanitizeContent(42 as unknown as string)).toBe("");
  });

  it("returns empty string for empty string input", () => {
    expect(sanitizeContent("")).toBe("");
  });
});

// ── encrypt / decrypt roundtrip ───────────────────────────────────────────────

describe("encryptMessage / decryptMessage", () => {
  async function makeSharedKey() {
    const alice = await generateKeyPair();
    const bob   = await generateKeyPair();
    // Alice derives with her private key + Bob's public key
    return deriveSharedKey(alice.privateKey, bob.publicKey, "alice-id", "bob-id");
  }

  it("roundtrips a simple message", async () => {
    const key = await makeSharedKey();
    const plaintext = "Hello, Bob!";
    const ciphertext = await encryptMessage(plaintext, key);
    const decrypted  = await decryptMessage(ciphertext, key);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertexts for the same plaintext (random IV)", async () => {
    const key = await makeSharedKey();
    const ct1 = await encryptMessage("same message", key);
    const ct2 = await encryptMessage("same message", key);
    expect(ct1).not.toBe(ct2);
  });

  it("ciphertext starts with 'enc:'", async () => {
    const key = await makeSharedKey();
    const ct = await encryptMessage("test", key);
    expect(ct.startsWith("enc:")).toBe(true);
  });

  it("returns legacy plaintext as-is when not encrypted", async () => {
    const key = await makeSharedKey();
    expect(await decryptMessage("legacy plaintext", key)).toBe("legacy plaintext");
  });

  it("returns empty string for null/undefined content", async () => {
    const key = await makeSharedKey();
    expect(await decryptMessage(null as unknown as string, key)).toBe("");
    expect(await decryptMessage(undefined as unknown as string, key)).toBe("");
  });

  it("returns [🔒 Malformed message] for 'enc:' with too few parts", async () => {
    const key = await makeSharedKey();
    expect(await decryptMessage("enc:onlyone", key)).toBe("[🔒 Malformed message]");
  });

  it("returns [🔒 Unable to decrypt] for tampered ciphertext", async () => {
    const key = await makeSharedKey();
    const ct = await encryptMessage("secret", key);
    const tampered = ct.slice(0, -4) + "XXXX";
    const result = await decryptMessage(tampered, key);
    expect(result).toBe("[🔒 Unable to decrypt]");
  });

  it("roundtrips unicode and emoji", async () => {
    const key = await makeSharedKey();
    const msg = "Привет 🙏 Hola 日本語";
    expect(await decryptMessage(await encryptMessage(msg, key), key)).toBe(msg);
  });

  it("roundtrips a message at MAX_MSG_LENGTH", async () => {
    const key = await makeSharedKey();
    const msg = "x".repeat(MAX_MSG_LENGTH);
    expect(await decryptMessage(await encryptMessage(msg, key), key)).toBe(msg);
  });
});

// ── ECDH key derivation symmetry ─────────────────────────────────────────────

describe("deriveSharedKey", () => {
  it("Alice and Bob derive the same key (ECDH symmetry)", async () => {
    const alice = await generateKeyPair();
    const bob   = await generateKeyPair();

    const aliceShared = await deriveSharedKey(alice.privateKey, bob.publicKey, "alice-id", "bob-id");
    const bobShared   = await deriveSharedKey(bob.privateKey, alice.publicKey, "bob-id", "alice-id");

    // Encrypt with Alice's derived key, decrypt with Bob's — they must match
    const ct = await encryptMessage("symmetry test", aliceShared);
    const pt = await decryptMessage(ct, bobShared);
    expect(pt).toBe("symmetry test");
  });
});
