const {
  auditAircrackHandshake,
  parseKismetSurveyLogs,
  auditWifiteProtocols,
  scanBluetoothBleDevices,
  generateDomainTwistPermutations
} = require('../services/wirelessTyposquatService');

describe('Batch 17 Wireless Security Posture, BLE Discovery & Domain Typosquatting Tests', () => {
  describe('auditAircrackHandshake', () => {
    it('analyzes WPA2 4-way handshake MIC and calculates password resilience', async () => {
      const res = await auditAircrackHandshake('wpa2_corp_handshake.cap');
      expect(res).toBeDefined();
      expect(res.captureFile).toBe('wpa2_corp_handshake.cap');
      expect(res.handshake.bssid).toBeDefined();
      expect(res.keysTestedCount).toBeGreaterThanOrEqual(1000);
      expect(res.passwordResilienceScore).toBeDefined();
    });
  });

  describe('parseKismetSurveyLogs', () => {
    it('parses wireless survey logs, mapping access points, channels, and encryption', async () => {
      const res = await parseKismetSurveyLogs('kismet_survey.kismet');
      expect(res).toBeDefined();
      expect(res.totalAccessPoints).toBeGreaterThanOrEqual(2);
      expect(res.activeChannels.length).toBeGreaterThanOrEqual(2);
      expect(res.accessPoints.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('auditWifiteProtocols', () => {
    it('evaluates wireless interfaces for WPS PIN and PMKID zero-client vulnerabilities', async () => {
      const res = await auditWifiteProtocols('wlan0mon');
      expect(res).toBeDefined();
      expect(res.interfaceOrTarget).toBe('wlan0mon');
      expect(res.auditsRunCount).toBeGreaterThanOrEqual(2);
      expect(res.audits.length).toBeGreaterThanOrEqual(2);
      expect(res.remediation).toBeDefined();
    });
  });

  describe('scanBluetoothBleDevices', () => {
    it('scans Bluetooth BLE peripherals, returning GATT services and RSSI proximity', async () => {
      const res = await scanBluetoothBleDevices('hci0');
      expect(res).toBeDefined();
      expect(res.controller).toBe('hci0');
      expect(res.devicesDiscovered).toBeGreaterThanOrEqual(2);
      expect(res.devices[0].gattServices.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generateDomainTwistPermutations', () => {
    it('generates homoglyph and bit-squatting typosquatting permutations for brand domains', async () => {
      const res = await generateDomainTwistPermutations('example.com');
      expect(res).toBeDefined();
      expect(res.apexDomain).toBe('example.com');
      expect(res.permutationsGenerated).toBeGreaterThanOrEqual(3);
      expect(res.activeRegisteredDomains).toBeGreaterThanOrEqual(1);
      expect(res.permutations.length).toBeGreaterThanOrEqual(3);
    });

    it('rejects empty domains with descriptive error', async () => {
      await expect(generateDomainTwistPermutations('')).rejects.toThrow('Enter target domain');
    });
  });
});
