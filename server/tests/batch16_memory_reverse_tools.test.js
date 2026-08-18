const {
  analyzeVolatilityDump,
  parseSleuthKitVolume,
  generatePlasoSuperTimeline,
  decompileGhidraBinary,
  inspectRadare2Binary
} = require('../services/memoryReverseForensicsService');

describe('Batch 16 Memory Forensics, Filesystem Volumes & Binary Reverse Engineering Tests', () => {
  describe('analyzeVolatilityDump', () => {
    it('extracts running process lists, malfind injections, and sockets from RAM dumps', async () => {
      const res = await analyzeVolatilityDump('memory.dmp');
      expect(res).toBeDefined();
      expect(res.dumpFile).toBe('memory.dmp');
      expect(res.activeProcessesCount).toBeGreaterThanOrEqual(3);
      expect(res.malfindCount).toBeGreaterThanOrEqual(1);
      expect(res.socketsCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('parseSleuthKitVolume', () => {
    it('parses partition layouts and recovers deleted MFT entries', async () => {
      const res = await parseSleuthKitVolume('/dev/sda2');
      expect(res).toBeDefined();
      expect(res.volume).toBe('/dev/sda2');
      expect(res.partitionLayout.length).toBeGreaterThanOrEqual(2);
      expect(res.mftEntries.length).toBeGreaterThanOrEqual(2);
      expect(res.deletedFilesFound).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generatePlasoSuperTimeline', () => {
    it('aggregates multi-source forensic logs into chronological super-timeline matrix', async () => {
      const res = await generatePlasoSuperTimeline('/var/log/forensics_dump/');
      expect(res).toBeDefined();
      expect(res.parsersApplied.length).toBeGreaterThanOrEqual(3);
      expect(res.totalEventsIndexed).toBeGreaterThanOrEqual(100);
      expect(res.events.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('decompileGhidraBinary', () => {
    it('decompiles binary routines and flags dangerous API sinks and process injections', async () => {
      const res = await decompileGhidraBinary('agent_implant.bin');
      expect(res).toBeDefined();
      expect(res.binaryFile).toBe('agent_implant.bin');
      expect(res.functionsCount).toBeGreaterThanOrEqual(10);
      expect(res.disassembledFunctions.length).toBeGreaterThanOrEqual(2);
      expect(res.suspiciousApiImports.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('inspectRadare2Binary', () => {
    it('disassembles shellcode opcodes and validates null-byte free status', async () => {
      const res = await inspectRadare2Binary('payload.shellcode');
      expect(res).toBeDefined();
      expect(res.disassemblyEngine).toContain('Radare2');
      expect(res.opcodes.length).toBeGreaterThanOrEqual(5);
      expect(res.detectedSignature).toBeDefined();
    });
  });
});
