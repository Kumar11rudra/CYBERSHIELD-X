module.exports = {
    capabilities: [
        {
            capabilityId: 'UrlEngine.scan',
            name: 'UrlEngine Scan',
            adapter: 'UrlEngineAdapter',
            supportsStreaming: false
        },
        {
            capabilityId: 'UrlEngine.scan',
            name: 'UrlEngine Reputation Check',
            adapter: 'UrlEngineAdapter',
            supportsStreaming: false
        },
        {
            capabilityId: 'wazuh.audit',
            name: 'Wazuh SIEM Agent Audit',
            adapter: 'WazuhAdapter',
            supportsStreaming: true
        },
        {
            capabilityId: 'whois.scan',
            name: 'WHOIS Domain Lookup',
            adapter: 'WhoisAdapter',
            supportsStreaming: false
        },
        {
            capabilityId: 'ssl.scan',
            name: 'SSL/TLS Certificate Audit',
            adapter: 'SslAdapter',
            supportsStreaming: false
        },
        {
            capabilityId: 'email.verify',
            name: 'Email Integrity Verifier',
            adapter: 'EmailVerifierAdapter',
            supportsStreaming: false
        },
        {
            capabilityId: 'upi.verify',
            name: 'UPI Identity Verifier',
            adapter: 'UpiVerifierAdapter',
            supportsStreaming: false
        },
        // Mapped legacy pentest tools (17 simulated)
        { capabilityId: 'sqlmap.scan', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'hashcat.crack', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'nmap.scan', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'metasploit.exploit', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'wireshark.capture', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'burp.scan', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'zap.scan', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'nikto.scan', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'gobuster.scan', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'john.crack', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'hydra.crack', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'aircrack.crack', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'kismet.scan', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'autopsy.analyze', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'volatility.analyze', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'ghidra.analyze', adapter: 'SimulationAdapter', supportsStreaming: true },
        { capabilityId: 'radare2.analyze', adapter: 'SimulationAdapter', supportsStreaming: true }
    ]
};
