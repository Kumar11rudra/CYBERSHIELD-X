module.exports = {
  lookupCVEsFromBanners(banner) {
    if (!banner) return [];
    const bannerLower = banner.toLowerCase();
    const findings = [];
    
    // Nginx
    const nginxMatch = bannerLower.match(/nginx\/([0-9.]+)/);
    if (nginxMatch) {
      const version = nginxMatch[1];
      if (version.startsWith('1.18') || version.startsWith('1.19') || version.startsWith('1.20')) {
        findings.push({
          software: 'Nginx',
          version,
          cve: 'CVE-2021-23017',
          severity: 'High (8.1)',
          description: 'Nginx resolver vulnerability allows remote attackers to cause a denial of service or execution of arbitrary code via 1-byte buffer overflow.'
        });
      }
    }

    // Apache
    const apacheMatch = bannerLower.match(/apache\/([0-9.]+)/) || bannerLower.match(/httpd\/([0-9.]+)/);
    if (apacheMatch) {
      const version = apacheMatch[1];
      if (version.startsWith('2.4') && parseFloat(version.split('.').slice(1).join('.')) < 49) {
        findings.push({
          software: 'Apache HTTP Server',
          version,
          cve: 'CVE-2021-40438',
          severity: 'Critical (9.0)',
          description: 'Apache HTTP Server mod_proxy SSRF vulnerability allows an attacker to route requests to arbitrary hosts.'
        });
      }
    }

    // PHP
    const phpMatch = bannerLower.match(/php\/([0-9.]+)/);
    if (phpMatch) {
      const version = phpMatch[1];
      if (version.startsWith('7.4') || version.startsWith('8.0')) {
        findings.push({
          software: 'PHP',
          version,
          cve: 'CVE-2021-21708',
          severity: 'High (7.5)',
          description: 'PHP OPcache memory corruption vulnerability could lead to privilege escalation or remote code execution.'
        });
      }
    }

    // OpenSSH
    const sshMatch = bannerLower.match(/openssh_([0-9.]+)/) || bannerLower.match(/openssh\/([0-9.]+)/);
    if (sshMatch) {
      const version = sshMatch[1];
      if (parseFloat(version) < 7.7) {
        findings.push({
          software: 'OpenSSH',
          version,
          cve: 'CVE-2018-15473',
          severity: 'Medium (5.3)',
          description: 'OpenSSH before 7.7 is prone to username enumeration due to premature connection closing on invalid users.'
        });
      }
    }

    return findings;
  }
};
