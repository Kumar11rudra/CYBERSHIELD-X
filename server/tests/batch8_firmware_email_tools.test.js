const {
  analyzeBinwalk,
  disassembleCapstone,
  auditMailSpoofing,
  traceEmailHops,
  auditMxBlacklist
} = require('../services/firmwareEmailToolService');

describe('Batch 8 Firmware, Reverse Engineering & Email Security Tool Tests', () => {
  describe('analyzeBinwalk', () => {
    it('detects SquashFS, U-Boot, and Linux kernel magic headers in firmware dump', async () => {
      const firmwareDump = `
        DECIMAL       HEXADECIMAL     DESCRIPTION
        --------------------------------------------------------------------------------
        0             0x00000000      uImage header, header size: 64 bytes, 27051956
        65536         0x00010000      Linux-4.14.18 kernel zImage
        262144        0x00040000      SquashFS filesystem, little endian, version 4.0, hsqs
        2097152       0x00200000      JFFS2 filesystem, big endian, 8519
      `;

      const res = await analyzeBinwalk(firmwareDump);
      expect(res).toBeDefined();
      expect(res.partitionsFound).toBeGreaterThanOrEqual(3);
      expect(res.partitions.some(p => p.name.includes('SquashFS'))).toBe(true);
      expect(res.partitions.some(p => p.name.includes('U-Boot'))).toBe(true);
    });
  });

  describe('disassembleCapstone', () => {
    it('disassembles x86_64 hex opcodes into push, mov, and stack frame instructions', async () => {
      const hexOpcodes = '55 48 89 e5 48 83 ec 20 48 c7 c0 01 00 00 00 0f 05 c3';
      const res = await disassembleCapstone(hexOpcodes);
      expect(res).toBeDefined();
      expect(res.architecture).toContain('x86_64');
      expect(res.instructionCount).toBeGreaterThanOrEqual(4);
      expect(res.instructions.some(i => i.mnemonic === 'push')).toBe(true);
      expect(res.instructions.some(i => i.mnemonic === 'syscall')).toBe(true);
    });
  });

  describe('auditMailSpoofing', () => {
    it('flags vulnerable permissive SPF and monitoring-only DMARC policies', async () => {
      const spfDmarcTxt = `
        v=spf1 include:_spf.google.com ~all
        v=DMARC1; p=none; sp=none; rua=mailto:dmarc-reports@example.com;
      `;

      const res = await auditMailSpoofing(spfDmarcTxt);
      expect(res).toBeDefined();
      expect(res.spfStatus).toContain('SOFTFAIL');
      expect(res.dmarcStatus).toContain('p=none');
      expect(res.issuesCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('traceEmailHops', () => {
    it('parses raw Received headers, extracts originating IP, and checks auth results', async () => {
      const emlText = `
        Received: by mail-wm1-f49.google.com with SMTP id 198291823912
            for <victim@target.com>; Tue, 18 Aug 2026 14:02:11 -0700
        Received: from mail.attacker.net (mail.attacker.net [198.51.100.45])
            by mx.google.com with ESMTPS id abc123
            for <victim@target.com>; Tue, 18 Aug 2026 14:02:10 -0700
        Authentication-Results: mx.google.com; spf=pass (google.com: domain of sender@attacker.net designates 198.51.100.45 as permitted sender) smtp.mailfrom=sender@attacker.net; dkim=pass header.i=@attacker.net; dmarc=pass
        From: CEO <ceo@company.com>
        Subject: Urgent Wire Transfer
      `;

      const res = await traceEmailHops(emlText);
      expect(res).toBeDefined();
      expect(res.totalHops).toBe(2);
      expect(res.originatingIp).toBe('198.51.100.45');
      expect(res.spfAuthentication).toBe('PASS');
      expect(res.dkimAuthentication).toBe('PASS');
    });
  });

  describe('auditMxBlacklist', () => {
    it('audits MX records and returns clean RBL reputation status', async () => {
      const res = await auditMxBlacklist('gmail.com');
      expect(res).toBeDefined();
      expect(res.target).toBe('gmail.com');
      expect(res.reputationStatus).toContain('CLEAN');
      expect(res.rblFeeds.length).toBeGreaterThanOrEqual(5);
    });
  });
});
