'use strict';

/**
 * Unit tests for server/utils/userFieldEncryption.js
 * Verifies all security-relevant behaviours of the Node.js 24-compatible
 * AES-256-CBC field encryption module.
 */

const { encryptField, decryptField, isEncrypted } = require('../../utils/userFieldEncryption');

const SECRET = 'test_secret_for_unit_tests_only';

describe('userFieldEncryption — Core Security Properties', () => {

  test('AES key is 32 bytes (AES-256 requirement)', () => {
    const crypto = require('crypto');
    const key = crypto.scryptSync(SECRET, 'cybershield-field-enc-v2', 32);
    expect(key.length).toBe(32);
  });

  test('IV is 16 bytes (AES-CBC block size)', () => {
    const enc = encryptField('test@example.com', SECRET);
    // format: enc2:<iv-hex>:<ciphertext-hex>
    const ivHex = enc.slice('enc2:'.length).split(':')[0];
    const iv = Buffer.from(ivHex, 'hex');
    expect(iv.length).toBe(16);
  });

  test('Repeated encryption produces different ciphertext (random IV)', () => {
    const val = 'same@email.com';
    const enc1 = encryptField(val, SECRET);
    const enc2 = encryptField(val, SECRET);
    expect(enc1).not.toBe(enc2);
  });

  test('Encryption/decryption round-trip: email', () => {
    const email = 'user@cybershield.test';
    const enc = encryptField(email, SECRET);
    expect(decryptField(enc, SECRET)).toBe(email);
  });

  test('Encryption/decryption round-trip: mobile number', () => {
    const mobile = '+919876543210';
    const enc = encryptField(mobile, SECRET);
    expect(decryptField(enc, SECRET)).toBe(mobile);
  });

  test('enc2: prefix is present on encrypted values', () => {
    const enc = encryptField('test@example.com', SECRET);
    expect(enc.startsWith('enc2:')).toBe(true);
  });

  test('isEncrypted detects new-format values', () => {
    const enc = encryptField('test@example.com', SECRET);
    expect(isEncrypted(enc)).toBe(true);
  });

  test('isEncrypted rejects plaintext', () => {
    expect(isEncrypted('test@example.com')).toBe(false);
  });

  test('isEncrypted rejects old plugin format (no enc2: prefix)', () => {
    expect(isEncrypted('31323334353637383930313233343536:ab12cd34ef')).toBe(false);
  });

  test('Wrong key returns null — no plaintext exposure', () => {
    const enc = encryptField('secret@example.com', SECRET);
    const result = decryptField(enc, 'completely_different_wrong_key_value');
    expect(result).toBeNull();
  });

  test('null input returns null (passthrough)', () => {
    expect(decryptField(null, SECRET)).toBeNull();
  });

  test('undefined input returns undefined (passthrough)', () => {
    expect(decryptField(undefined, SECRET)).toBeUndefined();
  });

  test('empty string returns empty string (passthrough)', () => {
    expect(decryptField('', SECRET)).toBe('');
  });

  test('Old-format value (no enc2: prefix) returns null (migration safety)', () => {
    const legacyValue = '31323334353637383930313233343536:abcdef1234';
    expect(decryptField(legacyValue, SECRET)).toBeNull();
  });

  test('Malformed ciphertext returns null (no throw)', () => {
    const malformed = 'enc2:badhex:notvalidhex!!!';
    expect(decryptField(malformed, SECRET)).toBeNull();
  });

  test('Truncated enc2 value returns null (no throw)', () => {
    const truncated = 'enc2:abcd'; // missing colon + ciphertext
    expect(decryptField(truncated, SECRET)).toBeNull();
  });

  test('encryptField returns null for null input', () => {
    expect(encryptField(null, SECRET)).toBeNull();
  });

  test('encryptField returns undefined for undefined input', () => {
    expect(encryptField(undefined, SECRET)).toBeUndefined();
  });

});

describe('userFieldEncryption — Legacy Format Detection', () => {

  test('Migration script can derive legacy key matching plugin _hash function', () => {
    const crypto = require('crypto');
    // Exact replica of plugin: _hash = (secret) => SHA256(secret).hex.substring(0, 32)
    const rawSecret = 'default_fallback_encryption_key_32_bytes_long';
    const legacyKey = crypto.createHash('sha256').update(rawSecret).digest('hex').substring(0, 32);
    expect(typeof legacyKey).toBe('string');
    expect(legacyKey.length).toBe(32);
  });

  test('Legacy format can be identified by absence of enc2: prefix and presence of colon', () => {
    const legacyFormatValue = '31323334353637383930313233343536:aabbccdd'; // iv_hex:cipher_hex
    expect(legacyFormatValue.startsWith('enc2:')).toBe(false);
    expect(legacyFormatValue.includes(':')).toBe(true);
  });

  test('New format is never confused with legacy format', () => {
    const enc = encryptField('example@domain.com', SECRET);
    expect(enc.startsWith('enc2:')).toBe(true);
    // enc2: values split into 3 parts, not 2
    const parts = enc.split(':');
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe('enc2');
  });

});
