<p align="center">
  <img src="client/public/og-banner.png" alt="CyberShield X Banner" width="100%" />
</p>

<h1 align="center">⚔️ CyberShield X</h1>
<h3 align="center">AI-Powered Threat Intelligence & Cybersecurity Operations Platform</h3>

<p align="center">
  <a href="https://github.com/Kumar11rudra/CYBERSHIELD-X/releases"><img src="https://img.shields.io/badge/version-v63.5.0%20Production-blue?style=for-the-badge&logo=github" alt="Version"></a>
  <a href="https://cybershield-x.onrender.com/health"><img src="https://img.shields.io/badge/Backend-Live-brightgreen?style=for-the-badge&logo=render" alt="Backend Status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License"></a>
  <a href="https://github.com/Kumar11rudra/CYBERSHIELD-X/actions"><img src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="CI/CD"></a>
  <a href="#testing"><img src="https://img.shields.io/badge/Tests-157%2F157%20PASS-success?style=for-the-badge&logo=vitest" alt="Tests Passing"></a>
</p>

<p align="center">
  <a href="https://www.cybershieldx.in"><strong>🌐 Live Platform</strong></a> ·
  <a href="https://www.cybershieldx.in/terminal"><strong>💻 Terminal</strong></a> ·
  <a href="#-team"><strong>👥 Team</strong></a> ·
  <a href="#-security-architecture"><strong>🛡️ Architecture</strong></a> ·
  <a href="#-125-security-tools--24-domains"><strong>🧰 Tools</strong></a> ·
  <a href="#-local-development--quickstart"><strong>🚀 Quickstart</strong></a> ·
  <a href="#-contact"><strong>📬 Contact</strong></a>
</p>

---

## 🔍 What is CyberShield X?

**CyberShield X** is a production-grade, AI-powered cybersecurity operations platform that unifies threat intelligence, security tooling, and analyst workflows into a single browser-based interface. It solves the fragmentation problem in modern security operations — where analysts must juggle dozens of disconnected tools — by aggregating **125 canonical security tools across 24 domains** into one coherent, permission-controlled workspace.

Whether you're a **security engineer** running recon, a **SOC analyst** triaging live alerts from CISA KEV feeds, or a **recruiter** evaluating a team's technical depth, CyberShield X delivers an immediately usable, enterprise-grade experience backed by real infrastructure, multi-model AI, and rigorous authentication. Built by a cross-functional team and deployed at [cybershieldx.in](https://www.cybershieldx.in), it reflects a full SDLC — from threat modelling to CI/CD pipelines.

> [!IMPORTANT]
> CyberShield X is intended for **authorized security research, education, and professional use only**. See the [Legal Notice](#-legal-notice) below.

---

## 📡 Live Platform Status

| Tier | Service | Endpoint | Status |
|------|---------|----------|--------|
| 🌐 Frontend | Cloudflare Pages CDN | [cybershieldx.in](https://www.cybershieldx.in) | ✅ Live |
| ⚙️ Backend API | Render (Node.js) | [/health](https://cybershield-x.onrender.com/health) | ✅ Live |
| 🗄️ Database | MongoDB Atlas | Cloud-hosted cluster | ✅ Live |
| 🤖 AI Copilot | Gemini 2.5 Flash + Groq Qwen 27B | Multi-model fallback | ✅ Live |
| 🔐 Auth Service | JWT + TOTP + CyberPass QR | `/api/auth/*` | ✅ Live |
| 📰 Threat Feed | CISA KEV (15-min cache) | `/api/threats/kev` | ✅ Live |
| 💻 CyberSOC Terminal | Subprocess-sandboxed | `/terminal` | ✅ Live |
| 📲 PWA | Service Worker + Manifest | `/manifest.json` | ✅ Live |
| 🔄 Keep-Alive | 9-min Render heartbeat | Internal | ✅ Active |
| 🗺️ Sitemap | 12 indexed routes | [/sitemap.xml](https://www.cybershieldx.in/sitemap.xml) | ✅ Live |

---

## ✨ Key Features

### 🤖 Multi-Model AI Copilot
- **Primary**: Google Gemini 2.5 Flash for fast, context-aware security guidance
- **Fallback**: Groq Qwen 27B for resilience when primary is unavailable
- Threat analysis, tool recommendations, incident explanation in plain English

### 🧰 125-Tool Security Arsenal
- 125 canonical tools across **24 security domains**
- 55 tools live and online; 70 additional tools flagged *Coming Soon*
- Categorized, searchable, and permission-gated per user role

### 💻 Host-Native CyberSOC Terminal
- Subprocess-sandboxed terminal at `/terminal`
- Runs real security commands in an isolated, controlled environment
- Designed for SOC analysts needing CLI access without leaving the platform

### 🔐 Enterprise-Grade Authentication
- **JWT dual-token**: 15-min access tokens + 7-day refresh tokens
- **Google Authenticator TOTP** (RFC 6238 compliant)
- **CyberPass QR**: Proprietary QR-code-based login flow
- AES-256-GCM encrypted credential vault

### 📰 Live Threat Intelligence
- **CISA KEV** (Known Exploited Vulnerabilities) feed with 15-minute cache proxy
- Real-time threat scoring and analyst-friendly triage UI
- Planned SOAR/ITSM: Jira, ServiceNow, PagerDuty, Slack, Microsoft Teams webhooks

### ☁️ Cloud Telemetry & Log Normalization
- AWS CloudTrail, GCP, and Azure log ingestion (Phase 80)
- Normalized event pipeline for cross-cloud visibility

### 🛡️ Defense-in-Depth Security Posture
- TLS 1.3 via Cloudflare Full Strict SSL, HSTS enforced
- Strict CSP headers, SSRF protection, CORS strict-origin policy
- Zero-trust architecture at every layer

### 📲 Progressive Web App (PWA)
- Installable on desktop and mobile
- Service Worker caching for offline resilience
- Google Search Console + Bing Webmaster verified; IndexNow protocol active

---

## 🏗️ Tech Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | React 18 | Vite build, component-driven, PWA-ready |
| **Backend** | Node.js + Express | RESTful API, modular controllers, middleware-first |
| **Database** | MongoDB Atlas | Cloud-hosted, Atlas Search, encrypted at rest |
| **CDN / Hosting** | Cloudflare Pages | Global edge, Full Strict SSL, HSTS |
| **AI** | Google Gemini 2.5 Flash | Primary copilot model |
| **AI Fallback** | Groq Qwen 27B | Secondary model, automatic failover |
| **Auth** | JWT + TOTP + AES-256-GCM | Dual-token + MFA + encrypted vault |
| **CI/CD** | GitHub Actions | Frontend → Cloudflare Pages; Backend → Render |
| **DNS / SSL** | Cloudflare | TLS 1.3, DNSSEC, WAF |

---

## 🛡️ Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│          CLOUDFLARE EDGE  (TLS 1.3 · WAF · HSTS)           │
└──────────────────────────┬──────────────────────────────────┘
                           │
       ┌───────────────────┴──────────────────┐
       │                                      │
┌──────▼──────────┐                  ┌────────▼────────┐
│  Cloudflare     │                  │   Render.com    │
│  Pages (CDN)    │   REST / HTTPS   │   Node.js API   │
│  React 18 SPA   │◄────────────────►│   Express.js    │
│  PWA Manifest   │                  │   JWT · TOTP    │
└─────────────────┘                  └────────┬────────┘
                                              │
                                    ┌─────────▼────────┐
                                    │  MongoDB Atlas   │
                                    │  AES-256-GCM     │
                                    │  Encrypted Vault │
                                    └──────────────────┘
                                              │
                              ┌───────────────┼───────────────┐
                              │               │               │
                     ┌────────▼───┐  ┌────────▼───┐  ┌───────▼────┐
                     │ Gemini 2.5 │  │  Groq Qwen │  │  CISA KEV  │
                     │   Flash    │  │    27B     │  │  Feed API  │
                     └────────────┘  └────────────┘  └────────────┘
```

**Defense Layers:**
| Layer | Control |
|-------|---------|
| Network | Cloudflare WAF, TLS 1.3, HSTS, DNSSEC |
| Transport | Strict CORS origin, CSP headers |
| Application | SSRF protection, input sanitization, rate limiting |
| Identity | JWT dual-token, TOTP MFA, CyberPass QR |
| Data | AES-256-GCM vault, MongoDB Atlas encryption-at-rest |
| Operations | Sandboxed terminal subprocess isolation |

---

## 🧰 125 Security Tools / 24 Domains

> [!NOTE]
> 55 tools are **live and operational**. 70 are marked **Coming Soon** and are actively being integrated. The full tool catalog is browsable at [cybershieldx.in](https://www.cybershieldx.in).

| # | Security Domain | # | Security Domain |
|---|----------------|---|----------------|
| 1 | 🔍 Reconnaissance & OSINT | 13 | 🔐 Cryptography & PKI |
| 2 | 🌐 Network Scanning & Mapping | 14 | 🕵️ Threat Intelligence |
| 3 | 🧱 Firewall & Perimeter Analysis | 15 | 🧬 Malware Analysis |
| 4 | 🔓 Vulnerability Assessment | 16 | 🏴 Exploit Frameworks |
| 5 | 🌍 Web Application Security | 17 | 🧩 Reverse Engineering |
| 6 | 📡 Wireless Security | 18 | 🏗️ Cloud Security |
| 7 | 🔑 Password & Authentication | 19 | ☁️ Container & K8s Security |
| 8 | 📦 Packet Capture & Analysis | 20 | 🔎 Log Analysis & SIEM |
| 9 | 🕸️ Proxy & Interception | 21 | 📋 Compliance & Audit |
| 10 | 🛡️ Intrusion Detection & Prevention | 22 | 🤖 AI-Assisted Security |
| 11 | 💻 Endpoint & Host Forensics | 23 | 🔗 SOAR & Automation |
| 12 | 📧 Phishing & Social Engineering | 24 | 📊 Risk & Reporting |

---

## 👥 Team

| Name | Role | Focus Area |
|------|------|-----------|
| **Anil Kumar** | Founder & Cybersecurity Analyst | Platform architecture, security design, full-stack leadership |
| **Suryansh** | Data Analyst | Threat data pipelines, telemetry normalization, analytics |
| **Aryan Patel** | AI & ML Engineer | Multi-model copilot integration, AI feature development |
| **Pranav** | Data Analyst | Security metrics, reporting dashboards, data visualization |
| **Ankita** | Network Analyst | Network security tooling, packet analysis, perimeter defense |
| **Sushant** | Data Analyst | Log normalization, cloud telemetry (AWS/GCP/Azure), SIEM |

---

## 🚀 Local Development / Quickstart

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MongoDB Atlas** URI (or local MongoDB ≥ 6.x)
- API keys: Google Gemini, Groq (see [Environment Variables](#-environment-variables))

### 1 · Clone the Repository

```bash
git clone https://github.com/Kumar11rudra/CYBERSHIELD-X.git
cd CYBERSHIELD-X
```

### 2 · Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 3 · Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` with your credentials — see the [Environment Variables](#-environment-variables) table below.

### 4 · Run the Development Servers

```bash
# Run backend (from project root)
npm run dev

# In a separate terminal — run frontend
cd client && npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/health |

### 5 · Build for Production

```bash
# Frontend production build
cd client && npm run build

# Backend starts with
npm start
```

---

## 🔧 Environment Variables

> [!IMPORTANT]
> Never commit `.env` to version control. Use `.env.example` as a template and keep secrets in your CI/CD secret store.

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWT access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Secret key for JWT refresh tokens |
| `GEMINI_API_KEY` | ✅ | Google Gemini 2.5 Flash API key |
| `GROQ_API_KEY` | ✅ | Groq API key (Qwen 27B fallback) |
| `AES_VAULT_KEY` | ✅ | AES-256-GCM key for credential vault |
| `TOTP_ISSUER` | ✅ | TOTP issuer name (e.g. `CyberShieldX`) |
| `CORS_ORIGIN` | ✅ | Allowed frontend origin (e.g. `https://www.cybershieldx.in`) |
| `PORT` | ⬜ | Backend port (default: `5000`) |
| `NODE_ENV` | ⬜ | `development` or `production` |
| `CISA_KEV_CACHE_TTL` | ⬜ | KEV cache duration in seconds (default: `900`) |
| `RENDER_KEEPALIVE_INTERVAL` | ⬜ | Heartbeat interval in ms (default: `540000`) |

---

## 🧪 Testing

```bash
# Run all client-side tests
cd client && npm test

# Run with coverage report
cd client && npm run test:coverage
```

| Suite | Tests | Status |
|-------|-------|--------|
| Client Unit & Integration | 157 / 157 | ✅ PASS |
| Build Verification | Exit Code 0 | ✅ PASS |

> [!NOTE]
> CI/CD pipeline runs the full test suite on every push via GitHub Actions. Deployment to Cloudflare Pages only proceeds on a clean build and green test run.

---

## 🌐 API Endpoints

> Base URL: `https://cybershield-x.onrender.com`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/health` | Platform health check | Public |
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Login (returns JWT pair) | Public |
| `POST` | `/api/auth/refresh` | Refresh access token | Refresh token |
| `POST` | `/api/auth/totp/verify` | Verify TOTP MFA code | Partial auth |
| `GET` | `/api/threats/kev` | CISA KEV live feed | JWT |
| `POST` | `/api/ai/chat` | AI copilot chat | JWT |
| `GET` | `/api/tools` | Full security tool catalog | JWT |
| `GET` | `/api/tools/:domain` | Tools filtered by domain | JWT |
| `GET` | `/api/user/profile` | Authenticated user profile | JWT |
| `POST` | `/api/terminal/exec` | CyberSOC terminal command | JWT + Role |

---

## 🤝 Contributing

We welcome contributions from the security community! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) before submitting pull requests.

**Quick contribution guide:**
1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with conventional commit messages: `feat:`, `fix:`, `docs:`, `chore:`
4. Open a Pull Request against `main`
5. CI must pass (157/157 tests + build) before merge

---

## 🔒 Security / Responsible Disclosure

We take security seriously. If you discover a vulnerability in CyberShield X, please follow responsible disclosure:

- 📧 **Email**: [official.cybershieldx@gmail.com](mailto:official.cybershieldx@gmail.com)
- 📋 **Policy**: See [SECURITY.md](SECURITY.md) for the full disclosure policy and expected response timelines
- **Do NOT** open public GitHub Issues for security vulnerabilities
- We aim to acknowledge reports within **48 hours** and resolve critical issues within **14 days**

---

## 📄 License

```
MIT License

Copyright (c) 2024 Anil Kumar — CyberShield X

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

---

## ⚠️ Legal Notice

> [!CAUTION]
> **CyberShield X is provided for authorized security research, education, and professional cybersecurity operations only.**
>
> - All security tools and capabilities within this platform must be used **only on systems you own or have explicit written authorization to test**.
> - Unauthorized use of security tools against systems, networks, or individuals without consent is **illegal** and may violate the Computer Fraud and Abuse Act (CFAA), the UK Computer Misuse Act, and equivalent laws worldwide.
> - The CyberShield X team, its contributors, and Anil Kumar accept **no liability** for misuse of this platform or any tools integrated within it.
> - By accessing or using CyberShield X, you agree to comply with all applicable local, national, and international laws.
>
> **Use responsibly. Hack ethically. Defend fearlessly.**

---

## 📬 Contact

| Channel | Details |
|---------|---------|
| 🌐 Platform | [https://www.cybershieldx.in](https://www.cybershieldx.in) |
| 📧 Email | [official.cybershieldx@gmail.com](mailto:official.cybershieldx@gmail.com) |
| 🐙 GitHub | [Kumar11rudra/CYBERSHIELD-X](https://github.com/Kumar11rudra/CYBERSHIELD-X) |
| 👤 Founder | Anil Kumar — Founder & Cybersecurity Analyst |

---

<p align="center">
  Built with ❤️ by the <strong>CyberShield X Team</strong> · Deployed at <a href="https://www.cybershieldx.in">cybershieldx.in</a>
  <br/>
  <sub>v63.5.0 Production · MIT License · © 2024 Anil Kumar</sub>
</p>
