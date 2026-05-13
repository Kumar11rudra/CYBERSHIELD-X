# 🛡️ CyberShield X (Nexus Core v4.0)

**CyberShield X** is a high-fidelity, industrial-strength cybersecurity intelligence platform. It transforms standard threat detection into a comprehensive **Security Operations Center (SOC)** experience, designed for both individual operators and enterprise-level auditing.

---

## 🚀 Key Modules & Capabilities

### 📡 Nexus Tactical Dashboard
* **Sentinel Pulse:** Real-time network telemetry and threat hunting status.
* **Neural Heatmap:** Visualizes correlation between different attack vectors.
* **Global Threat Map:** A 3D geospatial visualization of live threat signals.
* **Automated Watchlist:** Persistent monitoring of critical IPs and domains with auto-syncing.

### 🛡️ Enterprise-Grade Security
* **Session Intelligence:** A real-time monitor for all authorized nodes. Surgically disconnect untrusted devices from your digital perimeter.
* **Neural Key Rotation:** Secure, authenticated password management with automatic breach-intelligence verification (HaveIBeenPwned integration).
* **Global CSRF Protection:** Hardened Origin/Referer validation for all state-changing API telemetry.
* **PII Encryption:** Multi-layered field-level encryption for sensitive user data at rest.

### 🤖 CyboBot: Agentic AI Assistant
* **Contextual Intelligence:** Interprets natural language security commands.
* **Intent Recognition:** Physically controls the dashboard—switch themes, launch scanners, or navigate modules via text/voice intent.

---

## 🛠️ Technical Stack & Architecture

- **Frontend:** React 18 (Vite/CRA), Framer Motion, Tailwind CSS, Recharts, Globe.gl.
- **Backend:** Node.js (Express), Socket.io (Real-time), Morgan (Observability).
- **Database:** MongoDB (Mongoose) with composite forensic indexing.
- **Security:** Helmet (Strict CSP), Compression (GZIP), CSRF Session Tracking, JWT Rotation.

---

## 📦 Deployment Specifications

### Environment Variables (.env)
Required keys for full platform functionality:
```env
# Server Config
PORT=3001
MONGODB_URI=your_mongo_connection_string
JWT_SECRET=your_high_entropy_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Threat Intel (Optional but Recommended)
VIRUSTOTAL_API_KEY=your_key
ABUSEIPDB_API_KEY=your_key

# Client Config
CLIENT_URL=http://localhost:3000
```

### Production Hardening
The Nexus Core is pre-configured with:
* **GZIP Compression:** Drastically reduces TTI on low-bandwidth networks.
* **NoSQL Sanitization:** Neutralizes injection vectors at the request lifecycle.
* **Silent Token Rotation:** Silent 401 handling via `api.js` interceptors for seamless 7-day session continuity.

---

## 📝 Governance & Compliance
* **Access Control:** Role-Based Access Control (RBAC) enforced across all API controllers.
* **Audit Trail:** Comprehensive activity logging with forensic hardware signatures (Device ID, ISP, OS).

---

## ⚖️ License
Enterprise Proprietary - CyberShield Security Solutions.
