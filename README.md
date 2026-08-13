# CyberShield X 🛡️

**Next-Generation AI-Powered Cybersecurity Threat Intelligence & Vulnerability Assessment Platform**

[![Production Status](https://img.shields.io/badge/Production-Live-00ff88?style=for-the-badge&logo=cloudflare)](https://www.cybershieldx.in)
[![SSL Certificate](https://img.shields.io/badge/SSL-Google%20Trust%20Services-00bfff?style=for-the-badge)](https://www.cybershieldx.in)
[![Tests Passing](https://img.shields.io/badge/Tests-79%2F79%20Passed-brightgreen?style=for-the-badge)](https://github.com/Kumar11rudra/CYBERSHIELD-X)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 🌐 Official Production Deployment

- **Primary Production URL**: [https://www.cybershieldx.in](https://www.cybershieldx.in)
- **Apex Production URL**: [https://cybershieldx.in](https://cybershieldx.in)
- **Production Backend API**: [https://cybershield-x.onrender.com](https://cybershield-x.onrender.com)
- **API Health Check**: [https://cybershield-x.onrender.com/health](https://cybershield-x.onrender.com/health)
- **Sitemap**: [https://www.cybershieldx.in/sitemap.xml](https://www.cybershieldx.in/sitemap.xml)
- **Robots.txt**: [https://www.cybershieldx.in/robots.txt](https://www.cybershieldx.in/robots.txt)

---

## 🌟 Platform Highlights

CyberShield X is a full-stack, enterprise-grade cybersecurity intelligence platform designed for automated vulnerability discovery, multi-vector threat correlation, and AI-assisted incident remediation.

- **Cloudflare Edge Security**: Full CDN edge proxying, Universal SSL with Google Trust Services, HTTP/2, HSTS preload, strict Content Security Policy (CSP), and `X-Frame-Options: DENY`.
- **Authoritative 110-Model Security Catalog**: Features 110 registered models across 24 distinct cybersecurity categories:
  - **14 Live Models**: DNS Engine, WHOIS Engine, Port Scanner, Tech Stack Detection, HTTP Security, SSL/TLS Audit, Phishing URL Detection, Service Version Fingerprinting, URL Threat Intelligence, JWT Security Decoder, Base64 Converter, URL Sanitizer, SMS Analyzer, UPI Verifier.
  - **2 Partial Models**: Breach Checker, AI Remediation Planner.
  - **94 Upcoming Models**: Subfinder, Masscan, Dnsx, Traceroute, WhatWeb, Dirsearch, WPScan, Nikto, SQLmap, Trivy, OWASP ZAP, Burp Suite, Nuclei, OpenVAS, and more.
- **Enterprise SOC & SIEM Console**: Real-time correlation engine mapping threat intelligence feeds (URLHaus, OpenPhish, Feodo Tracker, CISA KEV) against target assets.
- **Zero-Trust Security & Privacy Gate**: Enforces authentication (`401 Unauthorized`) across all live scanning endpoints and prevents SSRF and DNS rebinding attacks with target normalizers.
- **Search Engine Optimization (SEO)**: Fully verified in Google Search Console with structured Schema.org JSON-LD, OpenGraph, and automated XML sitemaps.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 18, TailwindCSS, Framer Motion, Socket.io-client | Hosted on Cloudflare Pages (`cybershieldx.pages.dev`) |
| **Edge & DNS** | Cloudflare Edge Proxy & Authoritative DNS | Nameservers: `amir.ns.cloudflare.com`, `maxine.ns.cloudflare.com` |
| **Backend API** | Node.js, Express, Winston Logger, Helmet, CORS | Hosted on Render Web Service |
| **Database** | MongoDB Atlas | Cluster0 with secure TLS connection pooling |
| **AI Intelligence** | Google Gemini API + Local Heuristics Engine | Threat classification, remediation planning, AI chat |
| **Security Controls** | SSRF Sanitizer, Strict Origin Matching, 401 Auth Gating | Zero PII exposure, least-privilege RBAC |

---

## 👥 Core Team & Leadership

Visit our interactive 3D Cyber Command Center at [https://www.cybershieldx.in/team](https://www.cybershieldx.in/team).

| Member | Role | Focus Area |
| :--- | :--- | :--- |
| **Anil Kumar** | **Founder & Command Chief** | Strategic Vision, Architecture & Core Platform Development |
| **Suryansh Pandey** | **Core Security Architect** | Vulnerability Assessment, Exploit Analysis & Network Defense |
| **Aryan Patel** | **Lead SOC Engineer** | SIEM Monitoring, Threat Intelligence & Incident Response |
| **Pranav Kumar** | **AI & Threat Intelligence** | Machine Learning Models, Threat Hunting & Automation |
| **Ankita** | **DevOps & Cloud Security** | Infrastructure Hardening, CI/CD Pipelines & Cloud Architecture |
| **Sushant** | **Data Analyst** | Threat Analytics, Telemetry Correlation & Metric Visualizations |

---

## 🧪 Testing & Release Verification

CyberShield X includes an automated release and quality validation suite.

```bash
# 1. Run all Jest Unit & Integration Tests (79/79 passing)
cd server && npm test

# 2. Run Pre-Flight Staging Verification
npm run verify:staging

# 3. Run Production Release Verification Gate
npm run verify:release
```

---

## 🛠️ Local Development Setup

### 1. Clone the repository:
```bash
git clone https://github.com/Kumar11rudra/CYBERSHIELD-X.git
cd CYBERSHIELD-X
```

### 2. Install all dependencies:
```bash
npm run install:all
```

### 3. Configure Environment Variables:
Copy `.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```

### 4. Start Development Servers:
```bash
npm run dev
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

---

## 📜 Governance & Security Policy

- **Contributing**: Please read our [CONTRIBUTING.md](CONTRIBUTING.md) guide before submitting pull requests.
- **Security Policy**: For responsible disclosure guidelines, see [SECURITY.md](SECURITY.md).
- **License**: Released under the [MIT License](LICENSE).

---

© 2026 CyberShield X — Engineered with ❤️ by [Anil Kumar](https://github.com/Kumar11rudra) & The CyberShield X Team.
