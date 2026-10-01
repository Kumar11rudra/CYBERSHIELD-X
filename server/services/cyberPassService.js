const crypto = require('crypto');
const qrcode = require('qrcode');

/**
 * CyberPass™ Cryptographic Authentication Service
 * 
 * Provides zero-cost, offline-resilient authentication and digital badge verification
 * for both Founder Admin and Platform Users without external SMS/SMTP dependencies.
 */
class CyberPassService {
  constructor() {
    this.signingKey = process.env.CYBERPASS_SIGNING_KEY || process.env.JWT_SECRET || 'csx-cyberpass-master-hmac-key-2026';
    this.founderPasskeySecret = process.env.ADMIN_PASSKEY_SECRET || 'CSX-FOUNDER-MASTER-PASSKEY-ANIL-KUMAR-2026';
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
   * Generate Master Founder CyberPass Payload & QR
   */
  async generateFounderPass() {
    const founderIdentity = 'anil-kumar';
    const sig = this._sign(`founder:${founderIdentity}:admin:${this.founderPasskeySecret}`);

    const payload = {
      csx: 'CYBERPASS',
      v: 1,
      role: 'admin',
      id: 'founder-admin',
      u: founderIdentity,
      name: 'Anil Kumar',
      k: this.founderPasskeySecret,
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

    const payload = {
      csx: 'CYBERPASS',
      v: 1,
      role,
      id: userId,
      u: username,
      name: user.fullName || username,
      k: secret,
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
      role,
      name: user.fullName || username,
      clearance: role === 'admin' ? 'SYSTEM ADMINISTRATOR' : 'SECURITY OPERATOR'
    };
  }

  /**
   * Verify an incoming CyberPass payload or raw passkey string
   */
  verifyPass(input) {
    if (!input || typeof input !== 'string') {
      return { valid: false, error: 'Invalid or missing passkey input' };
    }

    const trimmed = input.trim();

    // 1. Direct check against Founder Master Key
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

    // 2. Try JSON payload parse (Scanned QR or Dropzone Image decoded string)
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

    // 3. Return raw passkey candidate for User DB lookup
    return {
      valid: true,
      isRawToken: true,
      rawPasskey: trimmed
    };
  }
}

module.exports = new CyberPassService();
