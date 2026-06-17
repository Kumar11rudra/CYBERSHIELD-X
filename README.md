# CyberShield X 🛡️

**Advanced Cybersecurity Threat Detection Platform**

A full-stack, production-ready cybersecurity intelligence platform featuring 22 security models, an enterprise Security Operations Center (SOC) SIEM dashboard, continuous background scan schedules, asset inventory management, and a premium ChatGPT-style console.

---

## 🛡️ Zero-API Performance & Reliability Layer (V9.0 Upgrade)

- **CacheProvider Abstraction**: Multi-instance ready caching service implementing `MemoryCache` (active) and future-ready `RedisCache` stubs. Tracks cache hit/miss/set telemetry.
- **QueueProvider Workers**: General background queue manager supporting `MemoryQueue` (active) and `BullMQQueue` (future). Orchestrates dedicated workers:
  - `ScanWorker` (runs Nmap/Nikto/Trivy/Wazuh scans).
  - `AIWorker` (handles AI chat, triage, and remediation).
  - `NotificationWorker` (handles email, system, and socket alerts).
  - `IntegrationWorker` (processes SOAR playbook actions).
  Supports concurrency limits, retry attempts (max 3), Dead-Letter Queue (DLQ) containment, and latency tracking.
- **Reliable Health Diagnostics**: Exposes endpoints `/health` and `/health/details` checking database connectivity, queue stats, cache efficiency, and AI engine mode.
- **Optional Ollama Health Check**: Ollama connection failures report `Template Engine Active` as the mode, keeping the overall platform healthy.
- **Scan Performance Analytics**: Tracks Scan Throughput, Success/Failure rates, and execution time metrics (Average, Fastest, Slowest scan times).
- **System Health Dashboard**: Dynamic, interactive DevOps console displaying real-time database liveness, cache hit rates, worker logs, and scan performance metrics.

---

## 🛡️ SOAR Security Automation & Orchestration (V8.0 Upgrade)

- **Automated Playbook Workflows**: Triggers playbook action queues based on platform events (`vulnerability_detected`, `sla_breached`, `critical_ioc`, `ssl_expired`, `scan_completed`, `manual`).
- **In-Memory Action Queue**: Throttles and sequences integration actions asynchronously in a dedicated worker thread, preparing the codebase for Redis/BullMQ scalability.
- **Integration Connectors**: Provides modular, decoupled connectors for Slack Block Kit channels, MS Teams Adaptive Cards, Jira Cloud Bug creation, GitHub Issues tracking, and generic Webhooks.
- **Integration Health Monitor**: Continuously updates connector `healthStatus` ('Healthy', 'Warning', 'Failed') and captures connection errors for real-time audit visibility.
- **AI Remediation Engine**: Formulates technical fix roadmaps by querying Gemini/Ollama, structuring responses into Executive Summary, Root Cause, Recommended Fix, Verification Checklist, and References.
- **Remediation Caching (24h TTL)**: Utilizes an in-memory CVE cache to lower LLM cost and speed up audit requests.
- **AI Remediation PDF Injection**: Dynamically injects AI Remediation Plan detail pages directly into generated threat intelligence PDF reports.
- **Premium SOAR Workspaces**: Deploys an Integrations Page (Hub, Playbook Builder, Automation Runs log history) and an AI Remediation Console (CVE Lookup, Vulnerability Fixes, History).

---

## 🛡️ SIEM + Threat Intelligence Platform (V5.0 Upgrade)

- **Global Threat Feeds Sync**: Continuously syncs active indicators of compromise (IOCs) from URLHaus (malware URLs), OpenPhish (phishing URLs), Feodo Tracker (botnet C2 IPs), and CISA Known Exploited Vulnerabilities (CVE catalog) with configurable ingestion limits.
- **Continuous Risk Correlation**: Computes a dynamic target Risk Score (0-100) combining threat intelligence matches (40%), managed asset criticality ratings (20%), exposed ports profiles (15%), SSL certificate validity logs (10%), and banner CVE vulnerability audits (15%), mapped to Enterprise risk levels (`Informational`, `Low`, `Medium`, `High`, `Critical`).
- **Historical Trend Logs**: Captures transactional snapshot records in the database (`CorrelationRecord`) to support posture trending analysis.
- **Diagnostic Feed Health & Stats**: Monitors sync frequencies, counts, and logs diagnostic connectivity status (Healthy, Degraded, Unknown) for feed integrations.
- **Security Operations Center (SOC) Dashboard**: Integrates a dynamic Correlation Search Console, live feed health diagnostics, recent query history tables, and SVG-based growth trend lines.
- **Continuous Scan Scheduler**: Automates port (Nmap) and configuration checks on a daily, weekly, or monthly cycle.
- **Asset Inventory System**: Organizes target hosts with criticality ratings (Low, Medium, High, Critical), environment scopes, and live threat scores.
- **Alert Escalation Engine**: Automatically categorizes warnings into Info, Warning, High, and Critical levels and fires automated console notifications & SMTP emails.

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
