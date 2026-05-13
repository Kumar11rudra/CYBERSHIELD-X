/**
 * Vault Encryption Utility — AES-256-GCM
 * Provides authenticated encryption for the Quantum Vault feature.
 * Each value gets a unique IV. The auth tag prevents tampering.
 *
 * Format: iv(hex):authTag(hex):ciphertext(hex)
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;  // 128-bit IV for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

// ─── Startup Validation ──────────────────────────────────────────────────────
const getVaultKey = () => {
  const keyHex = process.env.VAULT_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    console.error('\n❌ FATAL: VAULT_ENCRYPTION_KEY must be a 64-char hex string (32 bytes).');
    console.error('   Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
    if (process.env.NODE_ENV === 'production') process.exit(1);
    // In dev, return a deterministic key so existing unencrypted data doesn't crash
    return Buffer.from('0'.repeat(64), 'hex');
  }
  return Buffer.from(keyHex, 'hex');
};

/**
 * Encrypt plaintext using AES-256-GCM
 * @param {string} plaintext - The sensitive value to encrypt
 * @returns {string} Format: "iv:authTag:ciphertext" (all hex-encoded)
 */
function encrypt(plaintext) {
  const key = getVaultKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string
 * @param {string} ciphertext - Format: "iv:authTag:encryptedData"
 * @returns {string} The decrypted plaintext
 * @throws {Error} If tampered, wrong key, or invalid format
 */
function decrypt(ciphertext) {
  // Handle legacy unencrypted values (migration support)
  if (!ciphertext || !ciphertext.includes(':') || ciphertext.split(':').length !== 3) {
    return ciphertext; // Return as-is — it's a pre-encryption plaintext value
  }

  const key = getVaultKey();
  const [ivHex, authTagHex, encData] = ciphertext.split(':');

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[VAULT CRYPTO] Decryption failed — data may be tampered or key mismatch:', err.message);
    throw new Error('Vault decryption failed. Data integrity compromised.');
  }
}

/**
 * Check if a value is already encrypted (has the iv:tag:data format)
 * @param {string} value
 * @returns {boolean}
 */
function isEncrypted(value) {
  if (!value || typeof value !== 'string') return false;
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  // Check if all parts are valid hex
  return parts.every(p => /^[a-f0-9]+$/i.test(p));
}

module.exports = { encrypt, decrypt, isEncrypted };
