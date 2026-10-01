const crypto = require('crypto');
const qrcode = require('qrcode');

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input) {
  const cleaned = input.toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const output = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_CHARS.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

/**
 * CyberPass™ Cryptographic Authentication Service
 * 
 * Provides zero-cost, offline-resilient authentication, Google Authenticator (TOTP RFC 6238),
 * and digital badge verification for both Founder Admin and Platform Users.
 */
class CyberPassService {
  constructor() {
    this.signingKey = process.env.CYBERPASS_SIGNING_KEY || process.env.JWT_SECRET || 'csx-cyberpass-master-hmac-key-2026';
    this.founderPasskeySecret = process.env.ADMIN_PASSKEY_SECRET || 'CSX-FOUNDER-MASTER-PASSKEY-ANIL-KUMAR-2026';
  }

  /**
   * Base32 encoding and decoding utilities
   */
  base32Encode(buf) {
    return base32Encode(buf);
  }

  base32Decode(str) {
    return base32Decode(str);
  }

  /**
   * Compute timing-safe HMAC-SHA256 signature
   */
  _sign(data) {
    return crypto.createHmac('sha256', this.signingKey).update(data).digest('hex');
  }

  /**
   * Timing-safe string comparison
   */
  _safeCompare(a, b) {
    if (!a || !b || typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Compute RFC 6238 TOTP 6-digit rolling code
   */
  generateTotpCode(secret, timestamp = Date.now()) {
    const key = typeof secret === 'string' ? base32Decode(secret) : secret;
    const epoch = Math.floor(timestamp / 1000);
    const counter = Math.floor(epoch / 30);
    const buf = Buffer.alloc(8);
    buf.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', key).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = (binary % 1000000).toString().padStart(6, '0');
    return otp;
  }

  /**
   * Verify 6-digit TOTP code with +-1 step drift tolerance (90s window)
   */
  verifyTotpCode(secret, code, window = 1) {
    if (!code || typeof code !== 'string') return false;
    const cleaned = code.trim();
    if (!/^\d{6}$/.test(cleaned)) return false;

    const now = Date.now();
    for (let i = -window; i <= window; i++) {
      const stepTime = now + (i * 30 * 1000);
      const expected = this.generateTotpCode(secret, stepTime);
      if (this._safeCompare(cleaned, expected)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Deterministic permanent Base32 secret for Founder Admin Google Authenticator
   */
  getFounderTotpSecret() {
    if (process.env.ADMIN_TOTP_SECRET) {
      return process.env.ADMIN_TOTP_SECRET.toUpperCase().replace(/[^A-Z2-7]/g, '');
    }
    const hash = crypto.createHash('sha256').update(`totp:${this.founderPasskeySecret}`).digest();
    return base32Encode(hash.subarray(0, 10)); // Exactly 16 base32 characters
  }

  /**
   * Get Founder Google Authenticator Setup details and QR code
   */
  async getFounderTotpSetup() {
    const secret = this.getFounderTotpSecret();
    const uri = `otpauth://totp/CyberShieldX:AnilKumar?secret=${secret}&issuer=CyberShieldX&algorithm=SHA1&digits=6&period=30`;
    const qrDataUrl = await qrcode.toDataURL(uri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      color: {
        dark: '#00bfff',
        light: '#020814'
      }
    });

    return {
      secret,
      uri,
      qrDataUrl,
      issuer: 'CyberShieldX',
      label: 'AnilKumar (Founder Admin)'
    };
  }

  /**
   * Generate Master Founder CyberPass Payload & QR
   */
  async generateFounderPass() {
    const founderIdentity = 'anil-kumar';
    const sig = this._sign(`founder:${founderIdentity}:admin:${this.founderPasskeySecret}`);
    const totpSecret = this.getFounderTotpSecret();

    const payload = {
      csx: 'CYBERPASS',
      v: 1,
      role: 'admin',
      id: 'founder-admin',
      u: founderIdentity,
      name: 'Anil Kumar',
      k: this.founderPasskeySecret,
      totp: totpSecret,
      sig
    };

    const payloadString = JSON.stringify(payload);
    const qrDataUrl = await qrcode.toDataURL(payloadString, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#00bfff',
        light: '#020814'
      }
    });

    return {
      payloadString,
      qrDataUrl,
      backupCode: this.founderPasskeySecret,
      totpSecret,
      role: 'admin',
      name: 'Anil Kumar',
      clearance: 'FOUNDER & LEAD'
    };
  }

  /**
   * Generate User CyberPass Payload & QR
   */
  async generateUserPass(user) {
    const userId = String(user.id || user._id);
    const username = String(user.username || 'operator');
    const role = user.role || 'user';
    const secret = user.cyberPassSecret || crypto.randomBytes(24).toString('hex');
    const sig = this._sign(`user:${userId}:${username}:${role}:${secret}`);

    let userTotpSecret = user.totpSecret;
    if (!userTotpSecret) {
      userTotpSecret = base32Encode(crypto.randomBytes(10));
    }

    const payload = {
      csx: 'CYBERPASS',
      v: 1,
      role,
      id: userId,
      u: username,
      name: user.fullName || username,
      k: secret,
      totp: userTotpSecret,
      sig
    };

    const payloadString = JSON.stringify(payload);
    const qrDataUrl = await qrcode.toDataURL(payloadString, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#00ff88',
        light: '#020814'
      }
    });

    return {
      payloadString,
      qrDataUrl,
      backupCode: secret,
      totpSecret: userTotpSecret,
      role,
      name: user.fullName || username,
      clearance: role === 'admin' ? 'SYSTEM ADMINISTRATOR' : 'SECURITY OPERATOR'
    };
  }

  /**
   * Verify an incoming CyberPass payload, 6-digit TOTP code, or raw passkey string
   */
  verifyPass(input) {
    if (!input || typeof input !== 'string') {
      return { valid: false, error: 'Invalid or missing passkey input' };
    }

    const trimmed = input.trim();

    // 1. Google Authenticator 6-digit rolling code check
    if (/^\d{6}$/.test(trimmed)) {
      const founderTotp = this.getFounderTotpSecret();
      if (this.verifyTotpCode(founderTotp, trimmed)) {
        return {
          valid: true,
          role: 'admin',
          isFounder: true,
          isTotp: true,
          username: 'anil-kumar',
          fullName: 'Anil Kumar',
          email: 'founder@cybershieldx.local'
        };
      }
    }

    // 2. Direct check against Founder Master Key
    if (this._safeCompare(trimmed, this.founderPasskeySecret)) {
      return {
        valid: true,
        role: 'admin',
        isFounder: true,
        username: 'anil-kumar',
        fullName: 'Anil Kumar',
        email: 'founder@cybershieldx.local'
      };
    }

    // 3. Try JSON payload parse (Scanned QR or Dropzone Image decoded string)
    try {
      const data = JSON.parse(trimmed);
      if (data && data.csx === 'CYBERPASS') {
        // Verify Founder Admin Passkey
        if (data.role === 'admin') {
          const expectedSig = this._sign(`founder:${data.u}:admin:${this.founderPasskeySecret}`);
          if (this._safeCompare(data.sig, expectedSig) && this._safeCompare(data.k, this.founderPasskeySecret)) {
            return {
              valid: true,
              role: 'admin',
              isFounder: true,
              username: 'anil-kumar',
              fullName: 'Anil Kumar',
              email: 'founder@cybershieldx.local'
            };
          }
        }

        // Verify User Passkey
        if (data.role === 'user' || !data.role) {
          const expectedSig = this._sign(`user:${data.id}:${data.u}:${data.role || 'user'}:${data.k}`);
          if (this._safeCompare(data.sig, expectedSig)) {
            return {
              valid: true,
              role: data.role || 'user',
              isFounder: false,
              id: data.id,
              username: data.u,
              passkey: data.k
            };
          }
        }
      }
    } catch {
      // Not JSON, continue to raw token check
    }

    // 4. Return raw passkey candidate for User DB lookup
    return {
      valid: true,
      isRawToken: true,
      rawPasskey: trimmed
    };
  }
}

module.exports = new CyberPassService();
