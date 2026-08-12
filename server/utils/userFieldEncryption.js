'use strict';

/**
 * @module userFieldEncryption
 * @description Node.js 24-compatible field-level encryption for sensitive User PII.
 *
 * Replaces `mongoose-field-encryption@7.0.1` which uses `crypto.createDecipher`
 * (removed in Node.js v22+). Implements equivalent protection using
 * `crypto.createCipheriv` / `crypto.createDecipheriv` (AES-256-CBC).
 *
 * Format: `enc2:<iv-hex>:<ciphertext-hex>`
 * The prefix `enc2:` distinguishes new-format records from old plugin format.
 *
 * Old format (mongoose-field-encryption < Node.js v22 data) is detected and
 * gracefully ignored — the field falls back to null/empty. Since all lookups
 * are hash-based (emailHash, mobileHash), authentication still works correctly.
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENC_PREFIX = 'enc2:';

/**
 * Derives a 32-byte AES key from the provided secret using scrypt.
 * @param {string} secret
 * @returns {Buffer} 32-byte key
 */
function deriveKey(secret) {
  // scryptSync is intentionally used for key derivation (not hashing)
  // salt is constant to make key deterministic from secret
  return crypto.scryptSync(String(secret), 'cybershield-field-enc-v2', 32);
}

/**
 * Encrypts a plaintext string using AES-256-CBC with a random IV.
 * Each call produces a different ciphertext (non-deterministic).
 * @param {string} plaintext
 * @param {string} secret
 * @returns {string} Encrypted string in format `enc2:<iv-hex>:<ciphertext-hex>`
 */
function encryptField(plaintext, secret) {
  if (plaintext === null || plaintext === undefined) return plaintext;
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(String(plaintext), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${ENC_PREFIX}${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string that was encrypted by `encryptField`.
 * Returns null (without throwing) for:
 *  - old plugin format data (no enc2: prefix)
 *  - empty/null values
 *  - corrupted/unrecognised values
 * @param {string} encryptedValue
 * @param {string} secret
 * @returns {string|null}
 */
function decryptField(encryptedValue, secret) {
  if (!encryptedValue) return encryptedValue;

  // Not our format — could be old mongoose-field-encryption data or plaintext
  if (!encryptedValue.startsWith(ENC_PREFIX)) {
    return null;
  }

  try {
    const withoutPrefix = encryptedValue.slice(ENC_PREFIX.length);
    const colonIdx = withoutPrefix.indexOf(':');
    if (colonIdx === -1) return null;

    const ivHex = withoutPrefix.slice(0, colonIdx);
    const ciphertextHex = withoutPrefix.slice(colonIdx + 1);

    const key = deriveKey(secret);
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    // Corrupted ciphertext — return null safely, never expose partial data
    return null;
  }
}

/**
 * Returns true if the value looks like a new-format encrypted field.
 * @param {string} value
 * @returns {boolean}
 */
function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX);
}

module.exports = { encryptField, decryptField, isEncrypted };
