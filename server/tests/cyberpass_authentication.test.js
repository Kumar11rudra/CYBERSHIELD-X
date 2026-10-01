const cyberPassService = require('../services/cyberPassService');

describe('CyberPass™ Cryptographic Authentication Service', () => {
  test('1. Should generate and sign Founder Admin passkey with Anil Kumar identity', async () => {
    const founderPass = await cyberPassService.generateFounderPass();

    expect(founderPass).toBeDefined();
    expect(founderPass.role).toBe('admin');
    expect(founderPass.name).toBe('Anil Kumar');
    expect(founderPass.clearance).toBe('FOUNDER & LEAD');
    expect(founderPass.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(typeof founderPass.backupCode).toBe('string');
    expect(founderPass.backupCode.length).toBeGreaterThan(10);

    const verified = cyberPassService.verifyPass(founderPass.payloadString);
    expect(verified.valid).toBe(true);
    expect(verified.isFounder).toBe(true);
    expect(verified.role).toBe('admin');
    expect(verified.fullName).toBe('Anil Kumar');
  });

  test('2. Should verify Founder Admin using raw backup passkey code', () => {
    const founderKey = process.env.ADMIN_PASSKEY_SECRET || 'CSX-FOUNDER-MASTER-PASSKEY-ANIL-KUMAR-2026';
    const verified = cyberPassService.verifyPass(founderKey);

    expect(verified.valid).toBe(true);
    expect(verified.isFounder).toBe(true);
    expect(verified.role).toBe('admin');
    expect(verified.fullName).toBe('Anil Kumar');
  });

  test('3. Should generate and sign Regular User digital badge payload', async () => {
    const mockUser = {
      id: '507f1f77bcf86cd799439011',
      username: 'cyber_analyst_01',
      fullName: 'Cyber Analyst',
      role: 'user',
      cyberPassSecret: 'a1b2c3d4e5f60718293a4b5c6d7e8f90'
    };

    const userPass = await cyberPassService.generateUserPass(mockUser);
    expect(userPass).toBeDefined();
    expect(userPass.role).toBe('user');
    expect(userPass.name).toBe('Cyber Analyst');
    expect(userPass.clearance).toBe('SECURITY OPERATOR');
    expect(userPass.qrDataUrl).toMatch(/^data:image\/png;base64,/);

    const verified = cyberPassService.verifyPass(userPass.payloadString);
    expect(verified.valid).toBe(true);
    expect(verified.isFounder).toBe(false);
    expect(verified.role).toBe('user');
    expect(verified.id).toBe(mockUser.id);
    expect(verified.username).toBe(mockUser.username);
  });

  test('4. Should reject tampered or invalid CyberPass payload', () => {
    const tamperedPayload = JSON.stringify({
      csx: 'CYBERPASS',
      v: 1,
      role: 'admin',
      id: 'attacker',
      u: 'hacker',
      k: 'fake-key',
      sig: 'fake-signature-12345'
    });

    const verified = cyberPassService.verifyPass(tamperedPayload);
    // Tampered JSON payload should fail HMAC signature check and fall through to raw token
    expect(verified.isFounder).toBeUndefined();
  });

  test('5. Should reject empty or non-string input', () => {
    expect(cyberPassService.verifyPass(null).valid).toBe(false);
    expect(cyberPassService.verifyPass('').valid).toBe(false);
    expect(cyberPassService.verifyPass(12345).valid).toBe(false);
  });

  test('6. Should generate Google Authenticator TOTP setup and compute valid 6-digit rolling code', async () => {
    const totpSetup = await cyberPassService.getFounderTotpSetup();
    expect(totpSetup).toBeDefined();
    expect(totpSetup.secret).toMatch(/^[A-Z2-7]{16}$/);
    expect(totpSetup.uri).toContain('otpauth://totp/CyberShieldX:AnilKumar');
    expect(totpSetup.qrDataUrl).toMatch(/^data:image\/png;base64,/);

    // Compute rolling 6-digit code for current time
    const rollingCode = cyberPassService.generateTotpCode(totpSetup.secret);
    expect(rollingCode).toMatch(/^\d{6}$/);

    // Verify rolling code passes RFC 6238 verification
    const isValid = cyberPassService.verifyTotpCode(totpSetup.secret, rollingCode);
    expect(isValid).toBe(true);
  });

  test('7. Should verify Founder Admin using live 6-digit Google Authenticator code in verifyPass', async () => {
    const totpSetup = await cyberPassService.getFounderTotpSetup();
    const liveCode = cyberPassService.generateTotpCode(totpSetup.secret);

    const verified = cyberPassService.verifyPass(liveCode);
    expect(verified.valid).toBe(true);
    expect(verified.isFounder).toBe(true);
    expect(verified.role).toBe('admin');
    expect(verified.fullName).toBe('Anil Kumar');
  });
});
