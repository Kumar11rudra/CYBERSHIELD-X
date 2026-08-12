#!/usr/bin/env node
/**
 * @file migrateUserEncryption.js
 * @description One-time migration script: re-encrypts User documents from the
 * old mongoose-field-encryption@7.0.1 format to the new Node.js 24-compatible
 * AES-256-CBC format (enc2: prefix).
 *
 * LEGACY FORMAT (mongoose-field-encryption@7.0.1):
 *   - Key derivation: SHA256(VAULT_ENCRYPTION_KEY).hex.substring(0, 32)
 *   - IV:             Buffer.from('1234567890123456') (deterministic, from User.js saltGenerator)
 *   - Stored value:   '<iv-as-hex>:<ciphertext-as-hex>'  (no prefix)
 *   - Marker fields:  __enc_email: true, __enc_mobileNumber: true
 *   - Algorithm:      AES-256-CBC
 *
 * NEW FORMAT (userFieldEncryption.js):
 *   - Key derivation: scryptSync(secret, 'cybershield-field-enc-v2', 32)
 *   - IV:             crypto.randomBytes(16) (random per encryption)
 *   - Stored value:   'enc2:<iv-as-hex>:<ciphertext-as-hex>'
 *   - Algorithm:      AES-256-CBC
 *
 * USAGE:
 *   # Dry-run (no writes)
 *   node server/scripts/migrateUserEncryption.js --dry-run
 *
 *   # Production execution (writes to DB)
 *   node server/scripts/migrateUserEncryption.js --execute
 *
 * SAFETY:
 *   - Idempotent: skips records already in enc2: format
 *   - Never deletes users on failure
 *   - Never writes unless decryption + re-encryption both succeed
 *   - Never prints plaintext email/mobile
 *   - Reports counts only: scanned / legacy / migrated / skipped / failed
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const crypto = require('crypto');
const { encryptField } = require('../utils/userFieldEncryption');

// ─── Argument parsing ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isExecute = args.includes('--execute');

if (!isDryRun && !isExecute) {
  console.error('Usage: node migrateUserEncryption.js [--dry-run | --execute]');
  process.exit(1);
}

// ─── Secrets ──────────────────────────────────────────────────────────────────
const secret = process.env.VAULT_ENCRYPTION_KEY
  || (process.env.NODE_ENV !== 'production' ? 'default_fallback_encryption_key_32_bytes_long' : null);

if (!secret) {
  console.error('FATAL: VAULT_ENCRYPTION_KEY is required in production.');
  process.exit(1);
}

// ─── Legacy key derivation (exact replica of plugin internal _hash function) ──
// Source: mongoose-field-encryption/lib/mongoose-field-encryption.js
//   const _hash = (secret) => crypto.createHash('sha256').update(secret).digest('hex').substring(0, 32);
function deriveLegacyKey(rawSecret) {
  return crypto.createHash('sha256').update(rawSecret).digest('hex').substring(0, 32);
}

// ─── Legacy IV (from User.js saltGenerator: () => '1234567890123456') ─────────
const LEGACY_IV = Buffer.from('1234567890123456'); // 16 ASCII bytes

/**
 * Decrypts a value stored in legacy mongoose-field-encryption format.
 * Format: '<iv-hex>:<ciphertext-hex>'
 * Returns null if decryption fails or format is unrecognised.
 * NEVER throws.
 */
function decryptLegacyField(encryptedValue, legacyKey) {
  if (!encryptedValue || typeof encryptedValue !== 'string') return null;
  if (encryptedValue.startsWith('enc2:')) return null; // already new format

  try {
    const colonIdx = encryptedValue.indexOf(':');
    if (colonIdx === -1) return null;

    const ivHex = encryptedValue.slice(0, colonIdx);
    const ciphertextHex = encryptedValue.slice(colonIdx + 1);

    const ivBuf = Buffer.from(ivHex, 'hex');
    if (ivBuf.length !== 16) return null;

    const cipherBuf = Buffer.from(ciphertextHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', legacyKey, ivBuf);
    let dec = decipher.update(cipherBuf);
    dec = Buffer.concat([dec, decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return null; // Corrupted or wrong key — never expose partial data
  }
}

/**
 * Returns true if the field value looks like a legacy encrypted value:
 * - Not null/undefined/empty
 * - Does NOT start with 'enc2:' (not already migrated)
 * - Contains ':' separator (iv_hex:ciphertext_hex format)
 */
function isLegacyFormat(value) {
  return typeof value === 'string' && !value.startsWith('enc2:') && value.includes(':');
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const mode = isDryRun ? 'DRY-RUN (no writes)' : 'EXECUTE (writing to DB)';
  console.log(`\n[Migration] Mode: ${mode}`);
  console.log('[Migration] Connecting to database...');

  const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cybershield';
  await mongoose.connect(dbUri);
  console.log('[Migration] Connected.');

  const legacyKey = deriveLegacyKey(secret);

  const counts = {
    scanned: 0,
    legacy: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
  };

  // Use raw MongoDB collection to avoid triggering mongoose hooks
  const collection = mongoose.connection.collection('users');
  const cursor = collection.find({});

  for await (const doc of cursor) {
    counts.scanned++;

    const emailIsLegacy = doc.__enc_email === true && isLegacyFormat(doc.email);
    const mobileIsLegacy = doc.__enc_mobileNumber === true && isLegacyFormat(doc.mobileNumber);

    // Skip if neither field needs migration
    if (!emailIsLegacy && !mobileIsLegacy) {
      counts.skipped++;
      continue;
    }

    counts.legacy++;

    // Attempt decryption and re-encryption
    const updates = {};
    let decryptFailed = false;

    if (emailIsLegacy) {
      const plain = decryptLegacyField(doc.email, legacyKey);
      if (plain === null) {
        console.error(`[Migration] FAILED decrypt email for doc _id=${doc._id} (key mismatch or corrupted)`);
        decryptFailed = true;
      } else {
        const reEncrypted = encryptField(plain, secret);
        updates.email = reEncrypted;
        updates.__enc_email = false;
        // Note: emailHash is already correct SHA256 — do not overwrite
      }
    }

    if (mobileIsLegacy && !decryptFailed) {
      const plain = decryptLegacyField(doc.mobileNumber, legacyKey);
      if (plain === null) {
        console.error(`[Migration] FAILED decrypt mobileNumber for doc _id=${doc._id}`);
        decryptFailed = true;
      } else {
        const reEncrypted = encryptField(plain, secret);
        updates.mobileNumber = reEncrypted;
        updates.__enc_mobileNumber = false;
      }
    }

    if (decryptFailed) {
      counts.failed++;
      // NEVER delete or overwrite on failure
      continue;
    }

    if (isDryRun) {
      // Confirm decryption worked — verify the result starts with enc2:
      const emailOk = !emailIsLegacy || (updates.email && updates.email.startsWith('enc2:'));
      const mobileOk = !mobileIsLegacy || (updates.mobileNumber && updates.mobileNumber.startsWith('enc2:'));
      if (emailOk && mobileOk) {
        counts.migrated++;
      } else {
        counts.failed++;
      }
      continue;
    }

    // Write: only update the fields that were re-encrypted
    try {
      await collection.updateOne(
        { _id: doc._id },
        { $set: updates }
      );
      counts.migrated++;
    } catch (err) {
      console.error(`[Migration] FAILED to write doc _id=${doc._id}: ${err.message}`);
      counts.failed++;
    }
  }

  await mongoose.disconnect();

  console.log('\n[Migration] Complete.');
  console.log(`  scanned:  ${counts.scanned}`);
  console.log(`  legacy:   ${counts.legacy}`);
  console.log(`  migrated: ${counts.migrated}`);
  console.log(`  skipped:  ${counts.skipped}`);
  console.log(`  failed:   ${counts.failed}`);

  if (counts.failed > 0) {
    console.error('\n[Migration] WARNING: Some records could not be migrated. Check logs above.');
    process.exit(2);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[Migration] FATAL:', err.message);
  process.exit(1);
});
