/**
 * Encrypted localStorage adapter for Zustand persist.
 *
 * Uses AES-GCM (256-bit) via the Web Crypto API.
 * The encryption key is derived from the site origin with PBKDF2 so the
 * ciphertext stored in localStorage is unreadable outside the application
 *
 * The adapter is fully async and compatible with Zustand's PersistStorage<S>.
 */

const SALT = new TextEncoder().encode('crab-portfolio-aes-salt-v1');
const ITERATIONS = 100_000;

/** Derive an AES-GCM CryptoKey from the current origin (or fallback string). */
async function deriveKey(): Promise<CryptoKey> {
  const originBytes = new TextEncoder().encode(
    typeof window !== 'undefined' ? window.location.origin : 'crab-portfolio'
  );
  const keyMaterial = await crypto.subtle.importKey('raw', originBytes, 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: SALT, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plain-text string.
 * Returns a base64-encoded string: 12-byte IV prepended to the ciphertext.
 */
export async function encryptData(plain: string): Promise<string> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain)
  );
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  // btoa works on Latin-1; use reduce to avoid stack-overflow on large arrays
  return btoa(combined.reduce((str, byte) => str + String.fromCharCode(byte), ''));
}

/**
 * Decrypt a base64-encoded string produced by encryptData.
 * Throws if the data is corrupted or the key doesn't match.
 */
export async function decryptData(encoded: string): Promise<string> {
  const key = await deriveKey();
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plainBuffer);
}
