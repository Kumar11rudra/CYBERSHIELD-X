# CyberShield X 🛡️

**Advanced Cybersecurity Threat Detection Platform**

A full-stack, production-ready cybersecurity intelligence platform featuring 22 security models, real-time threat scanning, AI-powered analysis, and a premium ChatGPT-style console.

---

## 🚀 Deployment: Google Cloud Run

This platform is designed to be deployed on **Google Cloud Run** (GCP).

### Prerequisites
- Google Cloud account with billing enabled
- `gcloud` CLI installed
- MongoDB Atlas cluster (free tier works)
- GitHub repository with Actions enabled

### Environment Variables (set in GCP Secret Manager)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
VAULT_ENCRYPTION_KEY=...
GEMINI_API_KEY=...
VIRUSTOTAL_API_KEY=...
ABUSEIPDB_API_KEY=...
```

### One-Click Deploy via GitHub Actions
Push to `main` branch → GitHub Actions automatically builds and deploys to Cloud Run.

---

## 🛠️ Local Development

```bash
# Install all dependencies
npm run install:all

# Start dev servers (client + server)
npm run dev
```

Client runs on `http://localhost:3000`  
Server runs on `http://localhost:3001`

---

## 🔬 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Framer Motion, Socket.io-client |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB (Atlas in production) |
| AI Engine | Google Gemini API + Local NLEM Engine |
| Deployment | Google Cloud Run |
| CI/CD | GitHub Actions |

---

## 🔒 Security Models (22 Total)

Port Sentinel (Nmap) · Web Auditor (Nikto) · SQL Injection Lab · Password Cracker (John) · Hash Analyzer (Hashcat) · Digital Forensics (Autopsy) · FTK Imager · Memory Forensics (Volatility) · SIEM (Splunk) · Endpoint Security (Wazuh) · Cloud Security (Wiz/Trivy) · Threat Intel (VirusTotal) · Malware Sandbox · UPI Verifier · Email Verifier · AI Pentest (ZeroThreat) · Mobile Scanner (MobSF) · OSINT (Sherlock) · Steganography · Tech Profiler (WhatWeb) · Metadata Cleaner (ExifTool) · Smart Contract Auditor (Slither) · Directory Scanner (Dirsearch) · Exploit Framework (Metasploit) · Container Scanner (Trivy) · Wireless Analyst (Aircrack)

---

© 2026 CyberShield X — Built by Kumar11rudra
