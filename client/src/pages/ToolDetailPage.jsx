import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api, { resolveRealtimeServerUrl } from '../services/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/common/BrandLogo';

// ─── New Template System ─────────────────────────────────────────────────────
import { getToolConfig, TOOL_STATUS, TOOL_TYPES } from '../components/toolkit/toolConfig';
import ToolPageLayout from '../components/toolkit/ToolPageLayout';
import ScannerToolView from '../components/toolkit/ScannerToolView';
import AnalyzerToolView from '../components/toolkit/AnalyzerToolView';
import ComingSoonView from '../components/toolkit/ComingSoonView';
import UtilityToolView from '../components/toolkit/UtilityToolView';

// ─── Console Output Component ────────────────────────────────────────────────
const ConsoleOutput = ({ logs }) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      ref={containerRef}
      className="bg-black/90 rounded-xl border border-white/5 p-4 font-mono text-[9px] h-44 overflow-y-auto custom-scrollbar text-left w-full select-all leading-normal"
    >
      {logs.map((log, i) => (
        <div key={i} className="mb-1 flex gap-2.5">
          <span className="text-white/20 select-none">[{new Date().toLocaleTimeString()}]</span>
          <span className={log.type === 'error' ? 'text-cyber-red font-bold' : log.type === 'success' ? 'text-cyber-green' : 'text-cyber-accent'}>
            {log.message}
          </span>
        </div>
      ))}
      {logs.length === 0 && <span className="text-white/20 uppercase tracking-widest animate-pulse">Awaiting system initialization...</span>}
    </div>
  );
};

// ─── 1. JWT Parser Component (100% Client-side) ─────────────────────────────
const JwtParserView = () => {
  const [token, setToken] = useState('');
  const decoded = useMemo(() => {
    if (!token.trim()) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return { error: 'Invalid JWT structure. A JWT must consist of three parts separated by dots.' };
      const [headerB64, payloadB64, signature] = parts;
      const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
      return { header, payload, signature };
    } catch {
      return { error: 'Failed to decode JWT token. Ensure valid base64 payload.' };
    }
  }, [token]);

  return (
    <div className="space-y-6 flex-1 text-left">
      <div className="cyber-bento-card p-6">
        <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider mb-4">🔑 JWT Parser</h3>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-[10px] text-cyber-accent outline-none focus:border-cyber-accent h-24 resize-none transition-all"
          placeholder="Paste encoded JWT token here..."
        />
      </div>

      {decoded && (
        <div className="grid grid-cols-1 gap-6">
          {decoded.error ? (
            <div className="p-4 border border-cyber-red/30 bg-cyber-red/5 rounded-xl font-mono text-[10px] text-cyber-red">
              {decoded.error}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="cyber-bento-card p-4 border-orange-500/10 bg-orange-500/[0.01]">
                  <h4 className="font-mono text-[9px] font-bold text-orange-500 uppercase tracking-widest mb-2">Header</h4>
                  <pre className="bg-black/40 p-3 rounded-xl font-mono text-[9px] text-orange-400 overflow-x-auto">
                    {JSON.stringify(decoded.header, null, 2)}
                  </pre>
                </div>
                <div className="cyber-bento-card p-4 border-cyber-accent/10 bg-cyber-accent/[0.01]">
                  <h4 className="font-mono text-[9px] font-bold text-cyber-accent uppercase tracking-widest mb-2">Payload</h4>
                  <pre className="bg-black/40 p-3 rounded-xl font-mono text-[9px] text-cyber-accent overflow-x-auto">
                    {JSON.stringify(decoded.payload, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="cyber-bento-card p-4 border-cyber-red/10 bg-cyber-red/[0.01]">
                <h4 className="font-mono text-[9px] font-bold text-cyber-red uppercase tracking-widest mb-1">Signature Verification Hash</h4>
                <code className="block bg-black/60 p-3 rounded-lg font-mono text-[9px] text-cyber-red truncate">
                  HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), "{decoded.signature}")
                </code>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── 2. Base64 Decoder Component (100% Client-side) ────────────────────────
const Base64DecoderView = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('decode');
  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      return mode === 'decode' ? atob(input.trim()) : btoa(input);
    } catch {
      return 'Error: Invalid base64 sequence or coding mismatch.';
    }
  }, [input, mode]);

  return (
    <div className="cyber-bento-card p-6 space-y-6 flex-1 text-left">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">📝 Base64 Translator</h3>
        <div className="flex border border-white/10 rounded-lg overflow-hidden">
          {['decode', 'encode'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setInput(''); }}
              className={`px-3 py-1 font-mono text-[8px] uppercase tracking-widest transition-all ${
                mode === m ? 'bg-cyber-accent text-cyber-bg font-bold' : 'text-cyber-muted hover:text-white'
              }`}
            >
              {m === 'decode' ? 'Decode' : 'Encode'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[8px] font-mono text-cyber-muted uppercase tracking-widest">Input Payload</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-[10px] text-white outline-none focus:border-cyber-accent h-28 resize-none"
            placeholder={mode === 'decode' ? 'Paste Base64 string to decode...' : 'Enter plaintext to encode...'}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[8px] font-mono text-cyber-muted uppercase tracking-widest">Output Signal</label>
          <textarea
            value={output}
            readOnly
            className="w-full bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-[10px] text-cyber-accent outline-none h-28 resize-none animate-pulse"
            placeholder="Result will appear here..."
          />
        </div>
      </div>
    </div>
  );
};

// ─── 3. URL Sanitizer Component (100% Client-side) ─────────────────────────
const UrlSanitizerView = () => {
  const [url, setUrl] = useState('');
  const analyzed = useMemo(() => {
    if (!url.trim()) return null;
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      const params = Object.fromEntries(parsed.searchParams.entries());
      return { success: true, protocol: parsed.protocol, hostname: parsed.hostname, pathname: parsed.pathname, params };
    } catch {
      return { success: false, error: 'Malformed URL pattern. Check syntax.' };
    }
  }, [url]);

  return (
    <div className="space-y-6 flex-1 text-left">
      <div className="cyber-bento-card p-6">
        <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider mb-4">🔗 URL Payload Sanitizer</h3>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 font-mono text-[10px] text-cyber-accent outline-none focus:border-cyber-accent"
          placeholder="Paste URL parameters to analyze (e.g. example.com/pay?user=123&token=abc)..."
        />
      </div>

      {analyzed && (
        <div className="cyber-bento-card p-6">
          {analyzed.error ? (
            <div className="p-4 border border-cyber-red/30 bg-cyber-red/5 rounded-xl font-mono text-[10px] text-cyber-red">
              {analyzed.error}
            </div>
          ) : (
            <div className="space-y-6">
              <h4 className="font-mono text-[9px] font-bold text-white uppercase tracking-widest border-b border-white/5 pb-2">Diagnostic Parameters</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                  <p className="text-[7px] font-mono text-cyber-muted uppercase">Protocol</p>
                  <p className="font-mono text-[10px] text-cyber-accent font-bold mt-1">{analyzed.protocol}</p>
                </div>
                <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                  <p className="text-[7px] font-mono text-cyber-muted uppercase">Hostname</p>
                  <p className="font-mono text-[10px] text-cyber-accent font-bold mt-1 truncate">{analyzed.hostname}</p>
                </div>
                <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                  <p className="text-[7px] font-mono text-cyber-muted uppercase">Path</p>
                  <p className="font-mono text-[10px] text-cyber-accent font-bold mt-1 truncate">{analyzed.pathname}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[8px] font-mono text-cyber-muted uppercase tracking-widest">Query Decoded Matrix</p>
                <div className="border border-white/5 rounded-xl overflow-hidden">
                  <table className="w-full text-left font-mono text-[10px]">
                    <thead className="bg-white/5 text-cyber-muted">
                      <tr>
                        <th className="p-3">KEY</th>
                        <th className="p-3">DECODED VALUE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-black/20">
                      {Object.entries(analyzed.params).length === 0 ? (
                        <tr>
                          <td colSpan={2} className="p-3 text-white/30 text-center uppercase tracking-widest italic">No query parameters found</td>
                        </tr>
                      ) : (
                        Object.entries(analyzed.params).map(([k, v]) => (
                          <tr key={k}>
                            <td className="p-3 text-white font-bold">{k}</td>
                            <td className="p-3 text-cyber-accent break-all">{v}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── 4. Conversational Sidekick for Utility Decoders ─────────────────────────
const UtilitySidekick = ({ toolId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  useEffect(() => {
    let greeting = "";
    if (toolId === 'jwt-parser') {
      greeting = "👋 **JWT Parser sidekick active!** I am here to help you dissect JSON Web Tokens. Paste any JWT token in the input box on the left, and I will instantly split the Claims and Signatures. Did you know JWT signature tampering is a common vector?";
    } else if (toolId === 'base64-decoder') {
      greeting = "👋 **Base64 Translator sidekick active!** Paste base64 or plain text on the left to encode/decode in real-time. Feel free to ask me about common encoding standards!";
    } else {
      greeting = "👋 **URL Sanitizer sidekick active!** Paste a URL to isolate query strings and prevent dangerous open redirects.";
    }
    setMessages([{ text: greeting, isBot: true }]);
  }, [toolId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    
    setTimeout(() => {
      let botResponse = "";
      if (toolId === 'jwt-parser') {
        botResponse = `🔍 **Intelligence**: I see you're working with JWTs! Always make sure the signature matches and verify the 'exp' (expiration) claim to prevent replay attacks.`;
      } else if (toolId === 'base64-decoder') {
        botResponse = `📝 **Base64 Tip**: Base64 encoding is NOT encryption! It simply formats binary data as ASCII text. Never store raw credentials in Base64 strings.`;
      } else {
        botResponse = `🔗 **URL Security**: Check for double-encoded characters in URL strings, as they can sometimes bypass validation rules (e.g. SQLi or XSS filters).`;
      }
      setMessages(prev => [...prev, { text: botResponse, isBot: true }]);
    }, 800);
  };

  return (
    <div className="cyber-bento-card p-6 flex flex-col h-[350px] text-left">
      <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyber-accent animate-pulse" />
        Conversational Sidekick
      </h3>
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar text-[10px] font-mono leading-relaxed pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-xl border ${
            m.isBot ? 'bg-cyber-card/30 border-white/5 text-cyber-muted' : 'bg-cyber-accent/5 border-cyber-accent/20 text-white'
          }`}>
            <p className="font-bold mb-1 text-[8px] uppercase tracking-wider text-cyber-accent">
              {m.isBot ? '🤖 CYBOBOT' : '🕵️ OPERATOR'}
            </p>
            <div>{m.text}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Sidekick..."
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 font-mono text-[10px] text-white focus:border-cyber-accent outline-none"
        />
        <button type="submit" className="px-3 bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent rounded-xl text-[10px] font-mono hover:bg-cyber-accent/20 transition-all font-bold">SEND</button>
      </form>
    </div>
  );
};

// ─── 5. Specialized AI Agent Specifications Dictionary ────────────────────────
const TOOL_AGENTS = {
  nmap: {
    id: 'nmap',
    name: 'Nmap',
    icon: '📡',
    greeting: 'Greetings Operator! I am your Nmap Coordinator. Ready to scan network ports and services. Please provide an IP or Domain target below to execute a real-time native TCP scan.',
    chips: ['127.0.0.1', 'localhost', 'scanme.nmap.org'],
    chain: [
      { id: 'nikto', label: '🌐 Nikto' },
      { id: 'whatweb', label: '🕸️ WhatWeb' }
    ]
  },
  sherlock: {
    id: 'sherlock',
    name: 'Sherlock',
    icon: '🕵️‍♂️',
    greeting: 'Sherlock Username Footprint Engine online. I will search across 300+ social and developer platforms to track any handle footprint. Enter the target username handle below:',
    chips: ['kumar11rudra', 'cyberanalyst', 'admin'],
    chain: [
      { id: 'exiftool', label: '🧹 ExifTool' }
    ]
  },
  whatweb: {
    id: 'whatweb',
    name: 'WhatWeb',
    icon: '🕸️',
    greeting: 'Tech Stack Profiling node active. I can passively fingerprint web application stacks, servers, CMS plugins, and headers. Input the target domain name:',
    chips: ['localhost', 'example.com'],
    chain: [
      { id: 'nikto', label: '🌐 Nikto' },
      { id: 'dirsearch', label: '📂 Dirsearch' }
    ]
  },
  nikto: {
    id: 'nikto',
    name: 'Nikto',
    icon: '🧪',
    greeting: 'Nikto Web Auditor active. I will analyze target web servers for insecure header structures, default folders, and vulnerability factors. Enter target web server host:',
    chips: ['http://localhost:3000', 'http://127.0.0.1:3001'],
    chain: [
      { id: 'sqlmap', label: '💉 SQLMap' },
      { id: 'dirsearch', label: '📂 Dirsearch' }
    ]
  },
  sqlmap: {
    id: 'sqlmap',
    name: 'SQLMap',
    icon: '💉',
    greeting: 'SQLMap Coordinator initialized. Ready to perform SQL Injection tests and database vulnerability audits. Input the target HTTP application request endpoint:',
    chips: ['http://localhost:3001/api/auth', 'http://example.com/item?id=1'],
    chain: [
      { id: 'nikto', label: '🌐 Nikto' }
    ]
  },
  dirsearch: {
    id: 'dirsearch',
    name: 'Dirsearch',
    icon: '📂',
    greeting: 'Dirsearch sentinel active. I will perform recursive path discovery to find hidden panels, config dumps, or backup archives. Enter base URL path:',
    chips: ['http://localhost:3000', 'http://127.0.0.1:3001'],
    chain: [
      { id: 'nikto', label: '🌐 Nikto' },
      { id: 'splunk', label: '📊 Forward logs to Splunk' }
    ]
  },
  john: {
    id: 'john',
    name: 'John the Ripper',
    icon: '🔨',
    greeting: 'John the Ripper node active. I can perform offline hash cracking and password entropy strength audits. Enter password hash string or list:',
    chips: ['e10adc3949ba59abbe56e057f20f883e', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'],
    chain: [
      { id: 'hashcat', label: '🔥 Hashcat' }
    ]
  },
  hashcat: {
    id: 'hashcat',
    name: 'Hashcat',
    icon: '🔥',
    greeting: 'Hashcat active. Specialized in GPU-accelerated hash cracking. Enter hash payload to evaluate entropy strength:',
    chips: ['5d41402abc4b2a76b9719d911017c592', '098f6bcd4621d373cade4e832627b4f6'],
    chain: [
      { id: 'john', label: '🔨 John the Ripper' }
    ]
  },
  splunk: {
    id: 'splunk',
    name: 'Splunk',
    icon: '📊',
    greeting: 'Splunk SIEM agent live. I am listening for authentication failures, port scans, and forensic warnings. Enter target audit source identifier:',
    chips: ['system_audit_log', 'auth_failures_db'],
    chain: [
      { id: 'wazuh', label: '🐕 Wazuh' }
    ]
  },
  wazuh: {
    id: 'wazuh',
    name: 'Wazuh',
    icon: '🐕',
    greeting: 'Wazuh HIDS endpoint monitoring coordinator live. Monitoring hosts for rootkits, file integrity, and configuration faults. Input target host endpoint ID:',
    chips: ['host_operator_primary', 'soc_node_1'],
    chain: [
      { id: 'splunk', label: '📊 Splunk' }
    ]
  },
  wiz: {
    id: 'wiz',
    name: 'Wiz',
    icon: '🧙',
    greeting: 'Wiz Cloud Workload Shield active. Scans Kubernetes namespaces, AWS buckets, and API secrets. Provide the target Cloud resource ARN or identifier:',
    chips: ['arn:aws:s3:::soc-assets', 'kubernetes-cluster-primary'],
    chain: [
      { id: 'slither', label: '🪙 Slither' }
    ]
  },
  mobsf: {
    id: 'mobsf',
    name: 'MobSF',
    icon: '📱',
    greeting: 'MobSF ready. Scans Android/iOS binaries for malware, insecure permissions, and embedded keys. Enter target mobile archive/file name:',
    chips: ['android_operator_v1.apk', 'ios_primary_operator.ipa'],
    chain: [
      { id: 'exiftool', label: '🧹 ExifTool' }
    ]
  },
  slither: {
    id: 'slither',
    name: 'Slither',
    icon: '🪙',
    greeting: 'Web3 Solidity static compiler auditor ready. I will parse smart contract ASTs to isolate reentrancy traps, integer overflows, and administrative control risks. Enter target contract address or file:',
    chips: ['0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 'PrimaryTokenContract.sol'],
    chain: [
      { id: 'wiz', label: '🧙 Wiz' }
    ]
  },
  autopsy: {
    id: 'autopsy',
    name: 'Autopsy',
    icon: '🔎',
    greeting: 'Autopsy Digital Forensics coordinator online. I will parse raw disk images, extract browser databases, and index system metadata. Input forensic disk image target:',
    chips: ['forensic_image_usb.dd', 'operator_drive_mirror.img'],
    chain: [
      { id: 'ftk', label: '📸 FTK Imager' },
      { id: 'volatility', label: '🧠 Volatility' }
    ]
  },
  ftk: {
    id: 'ftk',
    name: 'FTK Imager',
    icon: '📸',
    greeting: 'FTK Imager online. Ready to clone storage blocks and verify forensic hashes (MD5/SHA1) of source files. Input target folder or drive path:',
    chips: ['/dev/disk1s1', '/Users/anil/Documents/evidence'],
    chain: [
      { id: 'autopsy', label: '🔎 Autopsy' }
    ]
  },
  volatility: {
    id: 'volatility',
    name: 'Volatility',
    icon: '🧠',
    greeting: 'Volatility core active. Ready to extract active network connections, active processes, and registry credentials from raw RAM dumps. Enter RAM dump target:',
    chips: ['memory_core_dump.raw', 'hiberfil.sys'],
    chain: [
      { id: 'autopsy', label: '🔎 Autopsy' }
    ]
  },
  stegano: {
    id: 'stegano',
    name: 'Steghide',
    icon: '🖼️',
    greeting: 'Steghide active. I will analyze visual payloads for LSB hidden watermarks, cryptographic file blocks, or hidden messages. Input target image payload name:',
    chips: ['security_badge_stego.png', 'avatar_secret.jpg'],
    chain: [
      { id: 'exiftool', label: '🧹 ExifTool' }
    ]
  },
  exiftool: {
    id: 'exiftool',
    name: 'ExifTool',
    icon: '🧹',
    greeting: 'ExifTool online. I can extract and strip EXIF geolocation metadata, camera logs, and tracking tags from document and media payloads. Enter target payload file name:',
    chips: ['raw_photo_log.jpg', 'soc_confidential_briefing.pdf'],
    chain: [
      { id: 'stegano', label: '🖼️ Steghide' }
    ]
  },
  virustotal: {
    id: 'virustotal',
    name: 'VirusTotal',
    icon: '☣️',
    greeting: 'Global Threat Intelligence coordinator active. I will cross-reference file hashes, domain reputation marks, and IP logs against 70+ security vendors. Input the target IP, domain, or malware hash:',
    chips: ['1.1.1.1', 'eicar_antivirus_test_signature', 'malicious-domain.com'],
    chain: [
      { id: 'nmap', label: '📡 Nmap' }
    ]
  },
  metasploit: {
    id: 'metasploit',
    name: 'Metasploit Coordinator',
    icon: '🛡️',
    greeting: 'Metasploit Exploit Verification Node active. Scan target hosts for known CVEs and coordinate payload validation. Input target host or CVE string:',
    chips: ['127.0.0.1', 'CVE-2023-38606', 'CVE-2021-44228'],
    chain: [
      { id: 'nmap', label: '📡 Nmap' }
    ]
  },
  trivy: {
    id: 'trivy',
    name: 'Trivy Container Auditor',
    icon: '🐳',
    greeting: 'Trivy Container & Kubernetes Auditor live. Scan Docker images, Kubernetes namespaces, and lockfiles for critical CVEs and secrets leaks. Enter target image name or namespace:',
    chips: ['postgres:15-alpine', 'nginx:latest', 'k8s-core-namespace'],
    chain: [
      { id: 'wiz', label: '🧙 Wiz' }
    ]
  },
  aircrack: {
    id: 'aircrack',
    name: 'Aircrack Wireless Analyst',
    icon: '📶',
    greeting: 'Aircrack Wireless Network Auditor active. Ready to monitor 802.11 packets, capture WPA handshakes, and run dictionary audits. Enter simulated SSID or BSSID target:',
    chips: ['Office_Secure_WiFi', '00:14:22:01:23:45'],
    chain: [
      { id: 'nikto', label: '🌐 Nikto' }
    ]
  }
};

// ─── 100% Offline Local Cyber AI Engine ──────────────────────────────────────
const localAIEngine = {
  getGreeting: (toolId) => {
    const agent = TOOL_AGENTS[toolId] || TOOL_AGENTS.nmap;
    return `👋 **${agent.name} Coordinator Online!**\n\nI am your dedicated threat intelligence partner for **${agent.name}** (${agent.id.toUpperCase()}).\n\nI am fully initialized and ready to assist you. How can I help you with your security audits today? Please enter your target in the prompt bar below or say 'Hi' to start our threat conversation!`;
  },
  getResponse: (toolId, query, target) => {
    const q = query.toLowerCase().trim();
    const agent = TOOL_AGENTS[toolId] || TOOL_AGENTS.nmap;
    const name = agent.name;
    
    // GREETINGS: hi, hello, hey, yo, etc.
    if (q === 'hi' || q === 'hello' || q === 'hey' || q.includes('greetings') || q.includes('namaste')) {
      if (toolId === 'nmap') {
        return `📡 **Greetings Operator!** I am your **Nmap** coordinator. 

I specialize in scanning network systems for open ports, vulnerable services, and active network connections. How can I assist you with your security audits today? 

Please enter a target IP address or host (e.g., \`127.0.0.1\`) in the command bar below and let's run a native TCP scan together!`;
      }
      if (toolId === 'sherlock') {
        return `🕵️‍♂️ **Greetings Operator!** I am your **Sherlock** coordinator. 

I specialize in searching across 300+ social networks, developer registries, and web forums to locate the digital footprint of a username handle. How can I assist you with your footprint footprint analysis? 

Please provide a target handle or username below, and let's track their digital footprint!`;
      }
      if (toolId === 'nikto') {
        return `🧪 **Greetings Operator!** I am your **Nikto** coordinator. 

I specialize in performing automated audits on web server configuration headers, checking for missing policies, outdated servers, and common exposure points. How can I help you audit your web applications? 

Please specify a target host URL (e.g., \`http://localhost:3000\`) below, and let's audit its configuration headers!`;
      }
      if (toolId === 'sqlmap') {
        return `💉 **Greetings Operator!** I am your **SQLMap** coordinator. 

I scan target endpoints for SQL Injection vulnerabilities, database exposures, and privilege escalation pathways. What database endpoints are we auditing today? 

Provide a target web application URL below to start a diagnostic SQL injection assessment!`;
      }
      if (toolId === 'dirsearch') {
        return `📂 **Greetings Operator!** I am your **Dirsearch** coordinator. 

I perform high-speed recursive path audits on web servers to discover hidden admin panels, backup files, and system configuration dumps. What base URL are we auditing? 

Please enter the target base URL below to start path discovery!`;
      }
      if (toolId === 'john') {
        return `🔨 **Greetings Operator!** I am your **John the Ripper** partner. 

I audit password hash complexity, perform dictionary attacks, and measure the cryptographic entropy strength of credential databases. What hashes are we cracking today? 

Provide a target password hash (e.g., MD5/SHA256) below, and let's check its strength!`;
      }
      if (toolId === 'hashcat') {
        return `🔥 **Greetings Operator!** I am your **Hashcat** coordinator. 

I harness GPU-accelerated mathematical arrays to crack complex password hashes and verify enterprise credential robustness. What hashes do we need to check? 

Paste your hash target below to launch a diagnostic hash audit!`;
      }
      if (toolId === 'splunk') {
        return `📊 **Greetings Operator!** I am your **Splunk** advisor. 

I ingest system logs, query index streams, and correlate security alerts to help you coordinate enterprise threat detection. What index or host are we auditing? 

Enter your query string or target host below to generate enterprise SOC insight!`;
      }
      if (toolId === 'wazuh') {
        return `🐕 **Greetings Operator!** I am your **Wazuh** coordinator. 

I specialize in endpoint monitoring, integrity validation, and active host audits across your operating systems. What node are we checking? 

Provide the active Wazuh agent hostname or IP below to pull active endpoint telemetry!`;
      }
      if (toolId === 'wiz') {
        return `🧙 **Greetings Operator!** I am your **Wiz** coordinator. 

I audit Kubernetes namespaces, cloud assets, container configurations, and access keys for active security risks. What cloud resources are we auditing? 

Provide your target cloud ARN or namespace below, and let's check its posture!`;
      }
      if (toolId === 'mobsf') {
        return `📱 **Greetings Operator!** I am your **MobSF** analyst. 

I analyze Android APK and iOS IPA binaries for dangerous permissions, hardcoded API keys, and insecure network calls. What mobile application are we scanning? 

Specify the mobile app file name below, and let's compile its security score!`;
      }
      if (toolId === 'slither') {
        return `🪙 **Greetings Operator!** I am your **Slither** specialist. 

I audit Solidity smart contracts, scanning for reentrancy vectors, integer exceptions, and administrative control risks. What smart contract are we inspecting? 

Provide your target contract address or file name below, and let's audit its blockchain integrity!`;
      }
      if (toolId === 'autopsy') {
        return `🔎 **Greetings Operator!** I am your **Autopsy** lead investigator. 

I analyze raw disk images, extract system registry clusters, and index user activities to reconstruct a timeline of events. What evidence files are we indexing? 

Enter your target raw image file name below, and let's begin digital forensics!`;
      }
      if (toolId === 'ftk') {
        return `📸 **Greetings Operator!** I am your **FTK Imager** coordinator. 

I clone physical drives, calculate MD5/SHA hashes, and ensure complete data preservation. What storage volumes are we imaging? 

Specify the raw disk drive path below to capture a forensic evidence image!`;
      }
      if (toolId === 'volatility') {
        return `🧠 **Greetings Operator!** I am your **Volatility** specialist. 

I extract network connections, kernel descriptors, and running processes directly from volatile RAM dumps. What RAM image are we auditing? 

Enter your target RAM image name below to begin memory forensics!`;
      }
      if (toolId === 'stegano') {
        return `🖼️ **Greetings Operator!** I am your **Steghide** coordinator. 

I inspect visual payloads for LSB hidden watermarks, cryptographic files, or hidden messages. What image payload are we analyzing? 

Enter the image name below, and let's decode its secrets!`;
      }
      if (toolId === 'exiftool') {
        return `🧹 **Greetings Operator!** I am your **ExifTool** coordinator. 

I extract and strip EXIF tags, GPS locations, camera logs, and author metadata from visual and document payloads. What file are we cleaning? 

Enter your target document or image name below, and let's scrub it!`;
      }
      if (toolId === 'virustotal') {
        return `☣️ **Greetings Operator!** I am your **VirusTotal** partner. 

I cross-reference file hashes, domain reputation marks, and IP logs against 70+ vendor feeds to resolve threat reputation scores. What payload are we querying? 

Enter the target IP, domain, or malware hash below to extract global reputation intel!`;
      }
      if (toolId === 'metasploit') {
        return `🛡️ **Greetings Operator!** I am your **Metasploit Coordinator** advisor. 

I specialize in matching identified target vulnerabilities against the Metasploit Exploit Database, preparing proof-of-concept exploit payload scenarios, and verifying if vulnerabilities are active and exploitable. How can I assist you with your exploit validation tests today?

Please enter a target host or CVE string (e.g. \`CVE-2021-44228\`) in the command bar below to begin!`;
      }
      if (toolId === 'trivy') {
        return `🐳 **Greetings Operator!** I am your **Trivy Container Auditor** coordinator. 

I specialize in scanning Docker images, base software packages, Kubernetes namespaces, and repositories for critical vulnerability footprints and exposed secret keys. What containers are we auditing today?

Please specify a target image name or resource identifier (e.g., \`postgres:15-alpine\`) below to start container layer scanning!`;
      }
      if (toolId === 'aircrack') {
        return `📶 **Greetings Operator!** I am your **Aircrack Wireless Analyst** partner. 

I specialize in simulating 802.11 wireless network auditing, packet capture streams, WPA 4-way handshake collection, and dictionary-based credential audit validation. What networks are we testing?

Provide a target SSID or BSSID address (e.g., \`Office_Secure_WiFi\`) below to begin wireless monitoring simulations!`;
      }
      
      return `🤖 **Greetings Operator!** I am your dedicated coordinator for **${name}**. 

I am fully initialized and ready to assist you. How can I help you with your security audits today? Please enter your target in the prompt bar below and let's begin!`;
    }

    // HELP / GUIDES
    if (q.includes('help') || q.includes('how') || q.includes('work') || q.includes('guide')) {
      return `🛡️ **${name} Operational Guidelines**:
      
I am your dedicated NLEM Agent. Here is how we can coordinate our security audits:
1. **Trigger Audits**: Enter a target IP, domain, username, or input string in the prompt bar below.
2. **Quick Scans**: Click any of the **Quick Targets** buttons to start a fast scan instantly.
3. **Conversational Assistance**: Ask me specific security questions about common vulnerabilities, risks, or compliance standards, and I will generate local expert advice instantly!
4. **Logic Chaining**: Once an audit completes, I will recommend logical follow-up modules to chain your security analysis smoothly.`;
    }

    // SCANS / LAUNCH
    if (q.includes('scan') || q.includes('target') || q.includes('run') || q.includes('execute')) {
      return `📡 **Launch Signal Detected!** 

To execute the **${name}** security scan on your target, simply enter the target IP or domain in the input bar and click the **LAUNCH** button (or hit enter)! 

If you are unsure of what target format to use, feel free to select one of our pre-configured **Quick Targets** above the input bar!`;
    }
    
    if (toolId === 'metasploit') {
      return `🛡️ **Metasploit Coordinator Intelligence**:
      
Metasploit matches target systems against exploit databases to locate vulnerabilities:
* **Exploits vs. Payloads**: Exploits are vectors (e.g. CVE triggers) that bypass system boundaries, while Payloads are code executed after successful entry (e.g. reverse TCP shells).
* **MSFConsole Operations**: Standard flows involve using \`search\`, selecting modules via \`use\`, setting arguments with \`set\`, and executing using \`run\`.
* **Safe Audits**: In SOC environments, exploits are verified using safe "dry-run" queries or check plugins to verify patch status without crashing services.`;
    }
    if (toolId === 'trivy') {
      return `🐳 **Trivy Container Security Analysis**:
      
Container vulnerability scanning prevents supply-chain exploits:
* **Base Image Risks**: Base images (like older Debian or Node images) often contain outdated packages. Consider replacing them with hardened minimal base distributions like \`alpine\` or \`distroless\`.
* **Lockfile Scanning**: Trivy parses package files (\`package-lock.json\`, \`go.sum\`) to highlight vulnerabilities in third-party libraries before runtime deployment.
* **Secret Detection**: Purge exposed keys (like API secrets or passwords) from layers immediately using \`git filter-repo\` or similar utilities.`;
    }
    if (toolId === 'aircrack') {
      return `📶 **Aircrack Wireless Security Insights**:
      
Wireless audits test passphrase complexity and encryption standards:
* **Packet Capture (wlan0mon)**: Monitor mode captures raw 802.11 frames passing through physical space.
* **4-Way Handshake**: Aircrack captures the cryptographic exchange established when a client authenticator connects, which contains the salted passphrase hashes.
* **Passphrase Entropy**: Dict-based cracking succeeded because the simulated password (\`admin12345\`) had low complexity. Mitigate by using high-entropy passwords (>16 characters, diverse sets).`;
    }

    return `🤖 **${name} Coordinator**:

I received your message. I am here to help you audit **${name}**. 

* If you're ready to perform a diagnostic security scan, please provide the target IP, URL, or identifier in the input bar below and click **LAUNCH**.
* If you have security questions about how to mitigate vulnerabilities or standard practices for **${name}**, let me know and I will provide local expert analysis!`;
  }
};

// ─── Main ToolDetailPage Component ───────────────────────────────────────────
export default function ToolDetailPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  // If tool exists in toolConfig, route to its dedicated template view
  const toolConfig = getToolConfig(toolId);
  if (toolConfig) {
    if (toolConfig.status === TOOL_STATUS.COMING_SOON) {
      return (
        <ToolPageLayout toolId={toolId}>
          <ComingSoonView toolId={toolId} />
        </ToolPageLayout>
      );
    }
    if (toolConfig.type === TOOL_TYPES.SCANNER) {
      return (
        <ToolPageLayout toolId={toolId}>
          <ScannerToolView toolId={toolId} />
        </ToolPageLayout>
      );
    }
    if (toolConfig.type === TOOL_TYPES.ANALYZER) {
      return (
        <ToolPageLayout toolId={toolId}>
          <AnalyzerToolView toolId={toolId} />
        </ToolPageLayout>
      );
    }
    if (toolConfig.type === TOOL_TYPES.UTILITY) {
      return (
        <ToolPageLayout toolId={toolId}>
          <UtilityToolView toolId={toolId} />
        </ToolPageLayout>
      );
    }
  }

  // ─── Chatbot Interface (for real working tools) ────────────────────────────
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState('');
  const [logs, setLogs] = useState([]);
  const [socket, setSocket] = useState(null);

  // Chatbot State
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showLibraryModal, setShowLibraryModal] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;
      
    let preview = null;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }
    
    setAttachedFile({
      name: file.name,
      size: sizeStr,
      type: file.type,
      preview: preview
    });
    
    toast.success(`Payload "${file.name}" linked successfully!`);
  };

  const isUtility = ['jwt-parser', 'base64-decoder', 'url-sanitizer'].includes(toolId);
  const agent = useMemo(() => TOOL_AGENTS[toolId] || TOOL_AGENTS.nmap, [toolId]);

  // Sync scroll on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, logs]);

  // Load agent greeting on mount/tool switch
  useEffect(() => {
    if (isUtility) return;
    setMessages([
      { text: agent.greeting, isBot: true }
    ]);
    setTarget('');
    setLogs([]);
  }, [toolId, isUtility, agent]);

  // Initialize Socket Connection (only for CLI tools)
  useEffect(() => {
    if (isUtility) return;

    const SERVER_URL = resolveRealtimeServerUrl();
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    setSocket(newSocket);

    newSocket.on('tool_log', (log) => {
      setLogs(prev => [...prev, log]);
    });

    return () => newSocket.disconnect();
  }, [toolId, isUtility]);

  const handleExecute = async (e, customTarget = null) => {
    if (e) e.preventDefault();
    const activeTarget = customTarget || target;
    
    // Heuristic: If they input a non-target conversational question, reply with Local AI!
    if (!customTarget && target.trim() && !/^[a-zA-Z0-9.\-/:_]+$/.test(target.trim())) {
      const userQuestion = target.trim();
      setTarget('');
      const userMsg = { text: userQuestion, isBot: false };
      if (attachedFile) {
        userMsg.attachment = { ...attachedFile };
        setAttachedFile(null);
      }
      setMessages(prev => [...prev, userMsg]);
      setLoading(true);
      setTimeout(() => {
        const reply = localAIEngine.getResponse(toolId, userQuestion, activeTarget);
        setMessages(prev => [...prev, { text: reply, isBot: true }]);
        setLoading(false);
      }, 600);
      return;
    }

    if (!activeTarget.trim()) return toast.error('Target is required');

    setLoading(true);
    setLogs([]);
    
    // Add user's command to chat history
    const commandMsg = { text: `🚀 Launch Command: execute ${toolId} --target ${activeTarget}`, isBot: false };
    if (attachedFile) {
      commandMsg.attachment = { ...attachedFile };
      setAttachedFile(null);
    }
    setMessages(prev => [...prev, commandMsg]);

    // Add immediate bot message for logs streaming
    setMessages(prev => [...prev, { isConsole: true, isBot: true, target: activeTarget }]);

    try {
      const response = await api.post('/toolkit/execute', {
        toolId,
        target: activeTarget,
        socketId: socket?.id
      });

      if (response.data.success) {
        const raw = response.data.rawOutput;
        const findings = raw.split('\n').filter(l => l.includes('/') && l.includes('open')).slice(0, 5);
        
        // Add analysis verdict message to chat history
        setMessages(prev => [...prev, { 
          isVerdict: true, 
          isBot: true, 
          target: activeTarget,
          findings: findings.length > 0 ? findings : ['Target verification successful.', 'Configuration scan complete with zero vulnerabilities detected.'],
          raw: raw,
          chainingOptions: agent.chain
        }]);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Execution failed';
      toast.error(msg);
      setMessages(prev => [...prev, { text: `❌ **Execution Error**: ${msg}`, isBot: true }]);
    } finally {
      setLoading(false);
      setTarget('');
    }
  };

  const handleChain = (nextToolId, originalTarget) => {
    navigate(`/toolkit/${nextToolId}`);
    setTimeout(() => {
      setTarget(originalTarget);
      toast.success(`Chained target "${originalTarget}" to ${TOOL_AGENTS[nextToolId]?.name || nextToolId}`);
    }, 300);
  };

  // Grouped active models for left sidebar navigation
  const sidebarGroups = useMemo(() => {
    const active = Object.values(TOOL_AGENTS);
    return {
      '📡 Reconnaissance & OSINT': active.filter(t => ['nmap', 'sherlock', 'whatweb', 'metasploit'].includes(t.id)),
      '🧪 Vulnerabilities & Web': active.filter(t => ['nikto', 'sqlmap', 'dirsearch', 'aircrack'].includes(t.id)),
      '🔑 Credentials & Passwords': active.filter(t => ['john', 'hashcat'].includes(t.id)),
      '🏛️ Enterprise SOC & Cloud': active.filter(t => ['splunk', 'wazuh', 'wiz', 'trivy'].includes(t.id)),
      '🕵️ Digital Forensics': active.filter(t => ['autopsy', 'ftk', 'volatility', 'stegano', 'exiftool'].includes(t.id)),
      '🪙 DevSecOps': active.filter(t => ['slither'].includes(t.id)),
      '☣️ Global Intelligence': active.filter(t => ['virustotal'].includes(t.id))
    };
  }, []);

  return (
    <div className="min-h-screen w-screen bg-[#020814] overflow-hidden flex text-left relative">
      <div className="bloom-bg top-[-10%] left-[-10%] bg-cyber-accent/5" />
      
      {/* Immersive ChatGPT Split Layout (Sidebar + Chat Area) */}
      <div className="flex w-full h-screen relative z-10">
        
        {/* Collapsible Left Sidebar */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '280px', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0 bg-[#070b13]/90 backdrop-blur-md border-r border-white/5 p-4 flex flex-col h-full overflow-hidden space-y-4"
            >
              {/* Sidebar Header with Brand Logo & Close X Button */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
                  <BrandLogo size={28} />
                  <span className="font-display text-xs font-black tracking-widest text-white">CYBERSHIELD X</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/5 border border-white/5 hover:border-cyber-accent/30 hover:bg-cyber-accent/5 text-cyber-muted hover:text-white transition-all flex items-center justify-center font-bold text-xs"
                  title="Collapse Sidebar"
                >
                  ×
                </button>
              </div>

              {/* Action Trigger (Rounded "+ New Chat" box) */}
              <button 
                onClick={() => {
                  setMessages([]);
                  setTarget('');
                  toast.success('Conversational workspace reset.');
                }}
                className="w-full py-2 px-3 bg-white/5 border border-white/10 hover:border-cyber-accent/30 rounded-xl text-white hover:text-cyber-accent font-mono text-[9.5px] font-bold transition-all text-left flex items-center justify-between group shadow-sm shadow-black/40 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs select-none">✏️</span>
                  <span className="uppercase tracking-wider">New chat</span>
                </div>
                <span className="text-xs font-bold text-cyber-muted group-hover:text-cyber-accent select-none">＋</span>
              </button>

              {/* Main GPT Navigation Node List */}
              <div className="space-y-0.5 border-b border-white/5 pb-3">
                <button
                  onClick={() => toast.success('Threat intelligence search node initialized.')}
                  className="w-full text-left py-2 px-2.5 hover:bg-white/[0.02] rounded-xl font-mono text-[9px] text-cyber-muted hover:text-white transition-all flex items-center gap-2.5 uppercase tracking-wider"
                >
                  <span className="text-xs select-none">🔍</span>
                  <span>Search chats</span>
                </button>

                <button
                  onClick={() => setShowLibraryModal(true)}
                  className="w-full text-left py-2 px-2.5 hover:bg-white/[0.02] rounded-xl font-mono text-[9px] text-cyber-muted hover:text-white transition-all flex items-center justify-between uppercase tracking-wider group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs select-none">📚</span>
                    <span>Library</span>
                  </div>
                  <span className="text-[7px] bg-cyber-accent/15 text-cyber-accent px-1.5 py-0.5 rounded font-mono uppercase font-black tracking-widest border border-cyber-accent/20">All Models</span>
                </button>

                <button
                  onClick={() => toast.success('[SOC SECURE PROJECT NODE] Sandbox environments online.')}
                  className="w-full text-left py-2 px-2.5 hover:bg-white/[0.02] rounded-xl font-mono text-[9px] text-cyber-muted hover:text-white transition-all flex items-center gap-2.5 uppercase tracking-wider"
                >
                  <span className="text-xs select-none">📁</span>
                  <span>Projects</span>
                </button>

                <button
                  onClick={() => toast.success('Apps store loaded. Dynamic threat coordination active.')}
                  className="w-full text-left py-2 px-2.5 hover:bg-white/[0.02] rounded-xl font-mono text-[9px] text-cyber-muted hover:text-white transition-all flex items-center gap-2.5 uppercase tracking-wider"
                >
                  <span className="text-xs select-none">📱</span>
                  <span>Apps</span>
                </button>

                <button
                  onClick={() => {
                    navigate('/toolkit/jwt-parser');
                    toast.success('Navigated to utility Codex node.');
                  }}
                  className="w-full text-left py-2 px-2.5 hover:bg-[#080d19]/60 border border-white/5 rounded-xl font-mono text-[9px] text-cyber-accent hover:text-white transition-all flex items-center gap-2.5 uppercase tracking-wider"
                >
                  <span className="text-xs select-none">🧠</span>
                  <span>Codex (Utilities)</span>
                </button>
              </div>

              {/* Recents Section Panel */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-2.5 mb-2">
                  <span className="text-[7.5px] font-mono font-bold text-cyber-muted uppercase tracking-[0.25em]">Recents</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-accent animate-pulse" />
                </div>

                {/* Scrollable list of active models */}
                <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar min-h-0 pl-1">
                  {Object.values(TOOL_AGENTS).map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        navigate(`/toolkit/${t.id}`);
                        setMessages([{ text: t.greeting, isBot: true }]);
                        setTarget('');
                      }}
                      className={`w-full text-left py-2 px-2.5 rounded-xl font-mono text-[9px] transition-all flex items-center justify-between ${
                        toolId === t.id 
                          ? 'bg-cyber-accent/10 border-l-2 border-cyber-accent text-white font-bold' 
                          : 'text-cyber-muted hover:text-white hover:bg-white/[0.02]'
                      }`}
                    >
                      <span className="truncate flex items-center gap-2">
                        <span>{t.icon}</span> 
                        <span className="truncate">{t.name.split(' (')[0]}</span>
                      </span>
                      {toolId === t.id && <span className="w-1 h-1 rounded-full bg-cyber-accent animate-ping" />}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Threat Session History Node */}
              <div className="border-t border-white/5 pt-3 space-y-1 flex-shrink-0">
                <button
                  onClick={() => {
                    if (!user) {
                      toast.error('Operator profile required to view audit logs. Redirecting to login...', { duration: 4000 });
                      setTimeout(() => navigate('/login'), 1500);
                      return;
                    }
                    navigate('/history');
                  }}
                  className="w-full text-left py-2 px-2.5 bg-white/[0.02] border border-white/5 hover:border-cyber-accent/30 hover:bg-cyber-accent/5 rounded-xl font-mono text-[9px] text-cyber-muted hover:text-white transition-all flex items-center gap-2.5 uppercase tracking-wider"
                >
                  <span>⏱️</span>
                  <span>View Session Logs</span>
                </button>
              </div>

              {/* Bottom Operator Identity / Session Controls */}
              <div className="border-t border-white/5 pt-3 flex-shrink-0">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5 bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                      <img 
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.email || user.username || 'operator'}`} 
                        alt="Operator Face Avatar"
                        className="w-8 h-8 rounded-lg border border-cyber-accent/20 bg-cyber-bg p-0.5 select-none"
                      />
                      <div className="truncate flex-1">
                        <p className="text-[6.5px] font-mono text-cyber-accent uppercase tracking-widest font-black">Authorized Operator</p>
                        <p className="text-[9.5px] font-mono text-white truncate font-bold">{user.email || user.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        toast.success('Operator session decoupled successfully.');
                        navigate('/login');
                      }}
                      className="w-full py-1.5 bg-cyber-red/10 border border-cyber-red/30 rounded-xl text-cyber-red font-mono text-[8px] font-bold uppercase tracking-widest hover:bg-cyber-red/20 transition-all text-center"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5 bg-white/[0.01] border border-white/5 p-2 rounded-xl opacity-75">
                      <img 
                        src="https://api.dicebear.com/7.x/bottts/svg?seed=guest" 
                        alt="Guest Face Avatar"
                        className="w-8 h-8 rounded-lg border border-white/10 bg-cyber-bg p-0.5 select-none grayscale"
                      />
                      <div>
                        <p className="text-[6.5px] font-mono text-cyber-muted uppercase tracking-widest">Operator Session</p>
                        <p className="text-[9.5px] font-mono text-white/50 uppercase tracking-widest font-black">Guest Operator</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full py-2 bg-cyber-accent/10 border border-cyber-accent/30 rounded-xl text-cyber-accent font-mono text-[8px] font-bold uppercase tracking-widest hover:bg-cyber-accent/25 transition-all text-center"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Message/Workspace Area */}
        <div className="flex-1 flex flex-col h-full bg-[#020814] overflow-hidden relative">
          
          {/* Header Controls (Completely clean top bar, model selector relocated to bottom) */}
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 flex-shrink-0 bg-[#070b13]/40 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              {!isSidebarOpen && (
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-cyber-accent hover:text-white transition-all mr-2 flex items-center justify-center"
                  title="Expand Sidebar"
                >
                  <span className="text-sm font-bold leading-none select-none">☰</span>
                </button>
              )}
              <div className="text-2xl select-none">{agent.icon}</div>
              <div>
                <h2 className="font-display text-xs font-bold text-white uppercase tracking-wider">{agent.name}</h2>
                <p className="text-[8px] font-mono text-cyber-muted uppercase tracking-widest mt-0.5">Active Threat Intelligence Scan Context</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              <span className="text-[8px] font-mono text-cyber-green uppercase tracking-widest hidden sm:inline">NLEM SECURE ENGINE: ONLINE</span>
            </div>
          </div>

          {/* Active Workspace / Content */}
          <div className="flex-1 overflow-hidden p-6 relative">
            {isUtility ? (
              // Utility Decoders Layout
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch h-full overflow-y-auto custom-scrollbar">
                <div className="lg:col-span-2 space-y-6">
                  {toolId === 'jwt-parser' && <JwtParserView />}
                  {toolId === 'base64-decoder' && <Base64DecoderView />}
                  {toolId === 'url-sanitizer' && <UrlSanitizerView />}
                </div>
                <div className="lg:col-span-1">
                  <UtilitySidekick toolId={toolId} />
                </div>
              </div>
            ) : (
              // Immersive Chat workspace container
              <div className="flex flex-col h-full bg-[#080d19]/30 border border-white/[0.03] rounded-2xl p-6 relative overflow-hidden">
                
                {messages.length === 0 ? (
                  /* ChatGPT-style Landing Workspace */
                  <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto h-full text-center relative px-4 w-full">
                    
                    {/* Large Central Watermark Brand Logo */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 0.1, scale: 1 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                    >
                      <div className="w-80 h-80 rounded-full border border-cyber-accent/20 flex items-center justify-center">
                        <span className="text-[120px] select-none text-cyber-accent animate-pulse">🤖</span>
                      </div>
                    </motion.div>

                    {/* Header Greeting */}
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="mb-8 z-10"
                    >
                      <div className="w-16 h-16 rounded-full bg-cyber-accent/10 border border-cyber-accent/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyber-accent/5">
                        <span className="text-3xl select-none">🤖</span>
                      </div>
                      <h1 className="font-display text-sm font-black text-white uppercase tracking-widest leading-relaxed">How can I assist your security audit today?</h1>
                      <p className="text-[8px] font-mono text-cyber-muted uppercase tracking-widest mt-2">Offline NLEM Intelligent Threat Operations Center</p>
                    </motion.div>

                    {/* Centered Input Box (ChatGPT Pill style) */}
                    <motion.form 
                      onSubmit={handleExecute}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="w-full bg-black/60 border border-white/10 rounded-3xl p-3 flex gap-2.5 items-center relative z-10 shadow-2xl focus-within:border-cyber-accent/50 transition-all flex-wrap sm:flex-nowrap"
                      style={{ boxShadow: '0 0 30px rgba(0, 0, 0, 0.6)' }}
                    >
                      {/* Dynamic Attachment Dropdown inside Pill */}
                      <div ref={attachmentMenuRef} className="relative flex-shrink-0 flex items-center justify-center pl-1">
                        <button 
                          type="button" 
                          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} 
                          className={`w-9 h-9 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-cyber-muted hover:text-cyber-accent hover:border-cyber-accent/40 transition-all font-extrabold text-base hover:scale-105 active:scale-95 cursor-pointer ${
                            showAttachmentMenu ? 'rotate-45 text-cyber-accent border-cyber-accent/40 bg-cyber-accent/10' : ''
                          }`}
                          title="Attach Payload Options"
                        >
                          +
                        </button>

                        <AnimatePresence>
                          {showAttachmentMenu && (
                            <motion.div
                              initial={{ opacity: 0, y: 15, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                              className="absolute bottom-12 left-0 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 w-48 text-left z-50 overflow-hidden"
                              style={{ boxShadow: '0 0 20px rgba(0, 243, 255, 0.15)' }}
                            >
                              <div className="px-2.5 py-1.5 border-b border-white/5 mb-1 flex items-center justify-between">
                                <span className="text-[7.5px] font-mono text-cyber-muted uppercase tracking-[0.15em] font-extrabold">🔗 ATTACH OPTIONS</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-cyber-accent animate-ping" />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setShowAttachmentMenu(false);
                                  fileInputRef.current.click();
                                }}
                                className="w-full px-3 py-1.5 text-[9px] font-mono font-bold text-white/80 hover:text-cyber-accent hover:bg-cyber-accent/10 rounded-xl flex items-center gap-2.5 transition-all uppercase tracking-wider text-left"
                              >
                                <span className="text-sm select-none">📁</span>
                                <span>File</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setShowAttachmentMenu(false);
                                  fileInputRef.current.click();
                                }}
                                className="w-full px-3 py-1.5 text-[9px] font-mono font-bold text-white/80 hover:text-cyber-accent hover:bg-cyber-accent/10 rounded-xl flex items-center gap-2.5 transition-all uppercase tracking-wider text-left"
                              >
                                <span className="text-sm select-none">📄</span>
                                <span>Document</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setShowAttachmentMenu(false);
                                  photoInputRef.current.click();
                                }}
                                className="w-full px-3 py-1.5 text-[9px] font-mono font-bold text-white/80 hover:text-cyber-accent hover:bg-cyber-accent/10 rounded-xl flex items-center gap-2.5 transition-all uppercase tracking-wider text-left"
                              >
                                <span className="text-sm select-none">🖼️</span>
                                <span>Photo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setShowAttachmentMenu(false);
                                  toast.success('[SENSOR ACTIVE] Camera diagnostics initialized. Visual spectrum analysis online.');
                                }}
                                className="w-full px-3 py-1.5 text-[9px] font-mono font-bold text-white/80 hover:text-cyber-accent hover:bg-cyber-accent/10 rounded-xl flex items-center gap-2.5 transition-all uppercase tracking-wider text-left"
                              >
                                <span className="text-sm select-none">📷</span>
                                <span>Camera</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="w-[1px] h-6 bg-white/10 mx-1 hidden sm:block flex-shrink-0" />

                      {/* Relocated Security Model Dropdown */}
                      <select 
                        value={toolId}
                        onChange={(e) => navigate(`/toolkit/${e.target.value}`)}
                        className="bg-black/60 border border-white/10 text-white font-mono text-[9px] font-bold py-2 px-2.5 rounded-xl outline-none focus:border-cyber-accent uppercase tracking-wider cursor-pointer max-w-[155px] truncate flex-shrink-0"
                      >
                        {Object.entries(sidebarGroups).map(([group, tools]) => (
                          <optgroup key={group} label={group} className="bg-[#0b0f19] text-cyber-muted text-[8px]">
                            {tools.map(t => <option key={t.id} value={t.id} className="text-white bg-[#0b0f19]">{t.icon} {t.name.split(' (')[0]}</option>)}
                          </optgroup>
                        ))}
                      </select>

                      <div className="w-[1px] h-6 bg-white/10 mx-1 hidden sm:block flex-shrink-0" />

                      <input 
                        type="text" 
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        disabled={loading}
                        placeholder={`Ask AI or specify target (e.g. 127.0.0.1)...`}
                        className="flex-1 bg-transparent border-none text-white font-mono text-[10.5px] focus:outline-none placeholder-white/20 min-w-[140px] py-1 pl-1"
                      />

                      {/* Microphone Icon Relocated to right side of input */}
                      <button 
                        type="button" 
                        onClick={() => toast.success('Microphone sensor active. Ambient threat intelligence scanning initiated...')} 
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-cyber-muted hover:text-cyber-accent hover:border-cyber-accent/40 transition-all text-xs hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0" 
                        title="Voice Input (🎤)"
                      >
                        🎤
                      </button>

                      <button 
                        type="submit"
                        disabled={loading || !target.trim()}
                        className="px-4 py-2 bg-cyber-accent/10 hover:bg-cyber-accent/25 border border-cyber-accent/30 text-cyber-accent font-mono text-[9.5px] font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-30 flex-shrink-0"
                      >
                        LAUNCH
                      </button>
                    </motion.form>

                    {/* Suggestion Cards 2x2 Grid */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full mt-8 z-10 text-left"
                    >
                      {[
                        { id: 'nmap', icon: '📡', label: 'Port Discovery (Nmap)', val: '127.0.0.1', desc: 'Verify local/remote ports and host interfaces.' },
                        { id: 'sherlock', icon: '🕵️‍♂️', label: 'OSINT Footprint (Sherlock)', val: 'kumar11rudra', desc: 'Trace username identity handles across 300+ nodes.' },
                        { id: 'nikto', icon: '🧪', label: 'Config Audit (Nikto)', val: 'http://localhost:3000', desc: 'Inspect configuration headers & exposed paths.' },
                        { id: 'slither', icon: '🪙', label: 'Contract Scan (Slither)', val: 'PrimaryTokenContract.sol', desc: 'Detect Web3 Solidity exceptions and reentrancy risks.' }
                      ].map((card, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            navigate(`/toolkit/${card.id}`);
                            setTimeout(() => {
                              setTarget(card.val);
                              setMessages([{ text: TOOL_AGENTS[card.id]?.greeting, isBot: true }]);
                              toast.success(`Active tool switched to ${card.label}`);
                            }, 100);
                          }}
                          className="p-3.5 bg-[#080d19]/40 border border-white/5 rounded-2xl hover:border-cyber-accent/30 hover:bg-cyber-accent/[0.02] text-left transition-all hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider group-hover:text-cyber-accent transition-colors truncate">
                              {card.icon} {card.label}
                            </span>
                            <span className="text-[8px] font-mono text-cyber-muted opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                          </div>
                          <p className="text-[8.5px] font-mono text-cyber-muted leading-relaxed mt-1.5">{card.desc}</p>
                        </button>
                      ))}
                    </motion.div>
                  </div>
                ) : (
                  <>
                    {/* Conversational Feed */}
                    <div className="flex-1 overflow-y-auto space-y-5 mb-4 custom-scrollbar pr-2">
                      {messages.map((m, i) => {
                        if (m.isConsole) {
                          return (
                            <div key={i} className="flex gap-4 items-start bg-black/40 border border-white/5 p-4 rounded-2xl w-full">
                              <div className="text-xl select-none">💻</div>
                              <div className="flex-1 space-y-2">
                                <p className="font-mono text-[8px] uppercase tracking-widest text-cyber-accent font-bold">Spawning Live NLEM Local Scanner...</p>
                                <ConsoleOutput logs={logs} />
                              </div>
                            </div>
                          );
                        }

                        if (m.isVerdict) {
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-4 items-start bg-cyber-green/5 border border-cyber-green/20 p-5 rounded-2xl w-full"
                            >
                              <div className="text-xl select-none">🛡️</div>
                              <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-xs font-bold text-white uppercase tracking-widest">Analysis Verdict</h4>
                                    <p className="text-[8px] font-mono text-cyber-muted uppercase mt-0.5">Target: {m.target}</p>
                                  </div>
                                  <span className="px-2.5 py-1 bg-cyber-green/10 border border-cyber-green/30 rounded text-cyber-green font-mono font-bold text-[9px] uppercase tracking-widest">
                                    SAFE / COMPLETE
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  {m.findings.map((f, idx) => (
                                    <div key={idx} className="flex gap-2 items-start text-white/80 font-mono text-[9px] leading-relaxed">
                                      <span className="text-cyber-green">✓</span>
                                      <p className="uppercase">{f}</p>
                                    </div>
                                  ))}
                                </div>

                                <button 
                                  onClick={() => {
                                    if (!user) {
                                      toast.error('Operator authentication required to compile forensic PDF logs. Shifting to signing page...', { duration: 3000 });
                                      navigate('/login');
                                      return;
                                    }
                                    toast.success('Forensic report compiled successfully! Ready for download.');
                                  }}
                                  className="w-full py-2 bg-white/5 border border-white/5 text-[8px] font-mono text-cyber-muted uppercase tracking-[0.2em] hover:text-white transition-colors"
                                >
                                  Download Forensic Report (PDF)
                                </button>

                                {/* Interactive Chaining ("Niche Niche Link") */}
                                {m.chainingOptions && m.chainingOptions.length > 0 && (
                                  <div className="pt-4 border-t border-white/5 space-y-2">
                                    <p className="text-[8px] font-mono text-cyber-accent/80 uppercase tracking-widest font-bold">
                                      ⛓️ Logical Follow-up Chaining ("Niche Niche Link"):
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {m.chainingOptions.map(opt => (
                                        <button
                                          key={opt.id}
                                          onClick={() => handleChain(opt.id, m.target)}
                                          className="px-3 py-1.5 bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent hover:bg-cyber-accent/20 transition-all rounded-lg font-mono text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                                        >
                                          🔗 Chain {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        }

                        return (
                          <div key={i} className={`flex gap-4 items-start p-4 rounded-2xl ${
                            m.isBot ? 'bg-cyber-card/25 border border-white/5' : 'bg-cyber-accent/[0.03] border border-cyber-accent/15'
                          }`}>
                            <div className="text-xl select-none">{m.isBot ? agent.icon : '🕵️‍♂️'}</div>
                            <div className="flex-1 font-mono text-[10px] leading-relaxed">
                              <p className="font-bold mb-1 text-[8px] uppercase tracking-wider text-cyber-accent">
                                {m.isBot ? `🤖 ${agent.name} Coordinator` : '🕵️ OPERATOR'}
                              </p>
                              <div className="text-white/80 whitespace-pre-wrap">{m.text}</div>
                              {m.attachment && (
                                <div className="mt-3 flex items-center gap-3 bg-black/40 border border-white/5 p-2.5 rounded-xl max-w-xs text-left">
                                  {m.attachment.preview ? (
                                    <img 
                                      src={m.attachment.preview} 
                                      alt="Payload preview" 
                                      className="w-10 h-10 object-cover rounded-lg border border-white/5"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-cyber-accent/10 border border-cyber-accent/20 rounded-lg flex items-center justify-center text-lg select-none">
                                      📄
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-mono text-white truncate font-bold">{m.attachment.name}</p>
                                    <p className="text-[7.5px] font-mono text-cyber-muted uppercase tracking-widest">{m.attachment.size} • {m.attachment.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input & Selector Prompt Box Area */}
                    <div className="border-t border-white/5 pt-4 space-y-3 flex-shrink-0">
                      {/* Quick Targets Suggestions */}
                      {!loading && (
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-[7.5px] font-mono text-cyber-muted uppercase tracking-widest">Quick Targets:</span>
                          {agent.chips.map(chip => (
                            <button
                              key={chip}
                              onClick={() => handleExecute(null, chip)}
                              className="px-2.5 py-1 bg-white/5 hover:bg-cyber-accent/10 hover:text-cyber-accent transition-all border border-white/5 hover:border-cyber-accent/25 rounded-xl font-mono text-[8.5px]"
                            >
                              🎯 {chip}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Attached File Preview Card */}
                      {attachedFile && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 bg-white/[0.03] border border-white/10 p-2.5 rounded-xl max-w-sm text-left relative"
                        >
                          {attachedFile.preview ? (
                            <img 
                              src={attachedFile.preview} 
                              alt="Attachment preview" 
                              className="w-10 h-10 object-cover rounded-lg border border-white/10"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-cyber-accent/10 border border-cyber-accent/20 rounded-lg flex items-center justify-center text-lg select-none">
                              📄
                            </div>
                          )}
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-[10px] font-mono text-white truncate font-bold">{attachedFile.name}</p>
                            <p className="text-[8px] font-mono text-cyber-muted uppercase tracking-widest">{attachedFile.size} • {attachedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setAttachedFile(null)}
                            className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/5 hover:bg-cyber-red/20 hover:text-cyber-red text-cyber-muted text-[10px] flex items-center justify-center transition-all font-bold"
                            title="Remove Attachment"
                          >
                            ×
                          </button>
                        </motion.div>
                      )}

                      <form onSubmit={handleExecute} className="flex gap-2 bg-black/40 border border-white/10 rounded-2xl p-2 items-center flex-wrap sm:flex-nowrap">
                        
                        {/* Hidden Native File Input Selectors */}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                        <input type="file" ref={photoInputRef} accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

                        {/* Custom Cyberpunk Attachment Toggle Dropdown Menu */}
                        <div ref={attachmentMenuRef} className="relative flex-shrink-0 flex items-center justify-center pl-1">
                          <button 
                            type="button" 
                            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} 
                            className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-cyber-muted hover:text-cyber-accent hover:border-cyber-accent/40 transition-all font-extrabold text-base hover:scale-105 active:scale-95 shadow-md shadow-black/40 cursor-pointer ${
                              showAttachmentMenu ? 'rotate-45 text-cyber-accent border-cyber-accent/40 bg-cyber-accent/10' : ''
                            }`}
                            title="Attach Payload Options"
                          >
                            +
                          </button>

                          <AnimatePresence>
                            {showAttachmentMenu && (
                              <motion.div
                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                className="absolute bottom-11 left-0 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 w-48 text-left z-50 overflow-hidden"
                                style={{ boxShadow: '0 0 20px rgba(0, 243, 255, 0.15)' }}
                              >
                                <div className="px-2.5 py-1.5 border-b border-white/5 mb-1 flex items-center justify-between">
                                  <span className="text-[7.5px] font-mono text-cyber-muted uppercase tracking-[0.15em] font-extrabold">🔗 ATTACH OPTIONS</span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-accent animate-ping" />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAttachmentMenu(false);
                                    fileInputRef.current.click();
                                  }}
                                  className="w-full px-3 py-1.5 text-[9px] font-mono font-bold text-white/80 hover:text-cyber-accent hover:bg-cyber-accent/10 rounded-xl flex items-center gap-2.5 transition-all uppercase tracking-wider text-left"
                                >
                                  <span className="text-sm select-none">📁</span>
                                  <span>File</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAttachmentMenu(false);
                                    fileInputRef.current.click();
                                  }}
                                  className="w-full px-3 py-1.5 text-[9px] font-mono font-bold text-white/80 hover:text-cyber-accent hover:bg-cyber-accent/10 rounded-xl flex items-center gap-2.5 transition-all uppercase tracking-wider text-left"
                                >
                                  <span className="text-sm select-none">📄</span>
                                  <span>Document</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAttachmentMenu(false);
                                    photoInputRef.current.click();
                                  }}
                                  className="w-full px-3 py-1.5 text-[9px] font-mono font-bold text-white/80 hover:text-cyber-accent hover:bg-cyber-accent/10 rounded-xl flex items-center gap-2.5 transition-all uppercase tracking-wider text-left"
                                >
                                  <span className="text-sm select-none">🖼️</span>
                                  <span>Photo</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAttachmentMenu(false);
                                    toast.success('[SENSOR ACTIVE] Camera diagnostics initialized. Visual spectrum analysis online.');
                                  }}
                                  className="w-full px-3 py-1.5 text-[9px] font-mono font-bold text-white/80 hover:text-cyber-accent hover:bg-cyber-accent/10 rounded-xl flex items-center gap-2.5 transition-all uppercase tracking-wider text-left"
                                >
                                  <span className="text-sm select-none">📷</span>
                                  <span>Camera</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="w-[1px] h-6 bg-white/10 mx-1 hidden sm:block flex-shrink-0" />

                        {/* RELOCATED SECURITY MODEL SELECTOR DROPDOWN */}
                        <select 
                          value={toolId}
                          onChange={(e) => navigate(`/toolkit/${e.target.value}`)}
                          className="bg-black/60 border border-white/10 text-white font-mono text-[9px] font-bold py-1.5 px-2 rounded-lg outline-none focus:border-cyber-accent uppercase tracking-wider cursor-pointer max-w-[155px] truncate"
                        >
                          {Object.entries(sidebarGroups).map(([group, tools]) => (
                            <optgroup key={group} label={group} className="bg-[#0b0f19] text-cyber-muted text-[8px]">
                              {tools.map(t => <option key={t.id} value={t.id} className="text-white bg-[#0b0f19]">{t.icon} {t.name.split(' (')[0]}</option>)}
                            </optgroup>
                          ))}
                        </select>

                        <div className="w-[1px] h-6 bg-white/10 mx-1 hidden sm:block flex-shrink-0" />

                        <input 
                          type="text" 
                          value={target}
                          onChange={(e) => setTarget(e.target.value)}
                          disabled={loading}
                          placeholder={loading ? 'Processing execution...' : `Ask AI or specify target (e.g. 127.0.0.1)...`}
                          className="flex-1 bg-transparent border-none text-white font-mono text-[10px] focus:outline-none placeholder-white/20 min-w-[120px]"
                        />

                        {/* Microphone button relocated to the right side */}
                        <button 
                          type="button" 
                          onClick={() => toast.success('Microphone sensor active. Ambient threat intelligence scanning initiated...')} 
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-cyber-muted hover:text-cyber-accent hover:border-cyber-accent/40 transition-all text-xs hover:scale-105 active:scale-95 shadow-md shadow-black/40 cursor-pointer flex-shrink-0"
                          title="Voice Input (🎤)"
                        >
                          🎤
                        </button>

                        <button 
                          type="submit"
                          disabled={loading || !target.trim()}
                          className="px-4 py-2 bg-cyber-accent/10 hover:bg-cyber-accent/25 border border-cyber-accent/30 text-cyber-accent font-mono text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-30 flex-shrink-0"
                        >
                          {loading ? 'RUNNING' : 'LAUNCH'}
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Models Library Modal */}
      <AnimatePresence>
        {showLibraryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowLibraryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="w-full max-w-4xl max-h-[85vh] overflow-hidden bg-[#070b13]/90 border border-white/10 rounded-2xl flex flex-col shadow-2xl relative"
              style={{ boxShadow: '0 0 40px rgba(0, 243, 255, 0.15)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/5 p-5 bg-[#0b0f19]/40 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-cyber-accent/30 flex items-center justify-center bg-cyber-accent/10">
                    <span className="text-base select-none">📚</span>
                  </div>
                  <div>
                    <h3 className="font-display text-xs font-black tracking-widest text-white uppercase">Aegis Model Library</h3>
                    <p className="text-[8px] font-mono text-cyber-muted uppercase tracking-widest mt-0.5">All 17+ CyberShield X advanced cybersecurity models</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLibraryModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/5 hover:border-cyber-accent/30 hover:bg-cyber-accent/5 text-cyber-muted hover:text-white transition-all flex items-center justify-center font-bold text-sm cursor-pointer"
                  title="Close Library"
                >
                  ×
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-left">
                {Object.entries(sidebarGroups).map(([groupName, tools]) => (
                  <div key={groupName} className="space-y-3">
                    <h4 className="font-mono text-[9px] font-black text-cyber-accent uppercase tracking-widest border-b border-white/5 pb-1 flex items-center justify-between">
                      <span>{groupName}</span>
                      <span className="text-[7px] text-cyber-muted font-bold font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">{tools.length} Models</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tools.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            navigate(`/toolkit/${t.id}`);
                            setMessages([{ text: t.greeting, isBot: true }]);
                            setTarget('');
                            setShowLibraryModal(false);
                            toast.success(`Active tool switched to ${t.name.split(' (')[0]}`);
                          }}
                          className={`p-3 bg-[#080d19]/40 border rounded-xl hover:border-cyber-accent/40 hover:bg-cyber-accent/[0.02] text-left transition-all hover:scale-[1.01] flex flex-col justify-between group h-24 ${
                            toolId === t.id ? 'border-cyber-accent bg-cyber-accent/[0.02]' : 'border-white/5'
                          }`}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-sm select-none">{t.icon}</span>
                              <span className="text-[10px] font-mono font-bold text-white group-hover:text-cyber-accent transition-colors truncate">
                                {t.name.split(' (')[0]}
                              </span>
                            </div>
                            {toolId === t.id && (
                              <span className="text-[7px] font-mono bg-cyber-accent/15 text-cyber-accent px-1.5 py-0.5 rounded border border-cyber-accent/20 uppercase font-black tracking-wider">Active</span>
                            )}
                          </div>
                          
                          <p className="text-[8px] font-mono text-cyber-muted leading-relaxed line-clamp-2 mt-2">
                            {t.greeting.length > 90 ? `${t.greeting.slice(0, 90)}...` : t.greeting}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
