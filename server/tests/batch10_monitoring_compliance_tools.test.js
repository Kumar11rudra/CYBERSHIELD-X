const {
  auditWazuhAgent,
  parseZeekLogs,
  traceAuditdEvents,
  evaluateSoc2Checklist,
  auditHipaaCompliance
} = require('../services/monitoringComplianceToolService');

describe('Batch 10 SIEM, Monitoring, Auditd & Compliance Posture Tool Tests', () => {
  describe('auditWazuhAgent', () => {
    it('evaluates Wazuh SIEM agent health and active detection modules', async () => {
      const configText = `
        <ossec_config>
          <syscheck>
            <disabled>no</disabled>
            <frequency>43200</frequency>
          </syscheck>
          <rootcheck>
            <disabled>no</disabled>
          </rootcheck>
        </ossec_config>
      `;

      const res = await auditWazuhAgent(configText);
      expect(res).toBeDefined();
      expect(res.agentVersion).toContain('Wazuh');
      expect(res.activeModulesCount).toBeGreaterThanOrEqual(4);
      expect(res.healthScore).toBeDefined();
    });
  });

  describe('parseZeekLogs', () => {
    it('parses Zeek conn.log TSV stream and detects suspicious anomalies', async () => {
      const zeekLog = `
        #fields ts uid id.orig_h id.orig_p id.resp_h id.resp_p proto service duration orig_bytes resp_bytes conn_state
        1724000000.000000 C12345 192.168.1.50 49152 93.184.216.34 443 tcp ssl 1.25 1500 4500 SF
        1724000001.000000 C12346 192.168.1.50 49153 198.51.100.99 4444 tcp unknown 0.05 48 0 S0
      `;

      const res = await parseZeekLogs(zeekLog);
      expect(res).toBeDefined();
      expect(res.totalRecordsParsed).toBe(2);
      expect(res.anomaliesCount).toBeGreaterThanOrEqual(1);
      expect(res.status).toBe('ANOMALIES_DETECTED');
    });
  });

  describe('traceAuditdEvents', () => {
    it('decodes Linux auditd syscall records and flags root privilege elevations', async () => {
      const auditLog = `
        type=SYSCALL msg=audit(1724000000.123:101): arch=c000003e syscall=59 success=yes exit=0 a0=7ffd a1=7ffd a2=7ffd a3=0 items=2 ppid=1234 pid=5678 auid=1000 uid=0 gid=0 euid=0 suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 tty=pts1 ses=3 comm="chmod" exe="/usr/bin/chmod"
      `;

      const res = await traceAuditdEvents(auditLog);
      expect(res).toBeDefined();
      expect(res.totalEventsParsed).toBe(1);
      expect(res.privilegedEventsCount).toBe(1);
      expect(res.events[0].isRootElevation).toBe(true);
    });
  });

  describe('evaluateSoc2Checklist', () => {
    it('scores organizational controls against 5 SOC 2 Trust Services Categories', async () => {
      const soc2Input = 'AWS Production Environment with Multi-Region Automated Backups and SOC 2 Type II controls.';
      const res = await evaluateSoc2Checklist(soc2Input);
      expect(res).toBeDefined();
      expect(res.auditStandard).toContain('SOC 2');
      expect(res.overallReadinessScore).toBeDefined();
      expect(res.categories.length).toBe(5);
    });
  });

  describe('auditHipaaCompliance', () => {
    it('audits cloud storage settings against HIPAA Security Rule safeguards', async () => {
      const hipaaInput = 'GCP Healthcare Cloud with AES-256 Storage and TLS 1.3 Transmission Security.';
      const res = await auditHipaaCompliance(hipaaInput);
      expect(res).toBeDefined();
      expect(res.regulation).toContain('HIPAA');
      expect(res.ephiProtectionGrade).toBe('HIPAA_COMPLIANT');
      expect(res.safeguardsCount).toBeGreaterThanOrEqual(6);
    });
  });
});
