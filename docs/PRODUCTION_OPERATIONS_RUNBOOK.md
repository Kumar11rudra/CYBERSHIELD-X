# 🛡️ CYBERSHIELD X — PRODUCTION OPERATIONS RUNBOOK (v61.4.0)

> **Operational Standard Operating Procedure (SOP)**  
> Author: CyberShield X Engineering & Architecture Core  
> Status: Certified for Production Operations  
> Applicable Release: v61.4.0+  

---

## 1. System Topology & Architecture Overview

CyberShield X operates as a high-integrity, hybrid-execution cybersecurity operations workstation. The platform executes across a dual-tier topology:

```
[ Internet / Enterprise Network ]
               │
               ▼
   [ Reverse Proxy / TLS Ingress (Nginx / Cloudflare) ]
               │ (Proxy Headers: X-Forwarded-For, X-Forwarded-Proto)
               ▼
┌────────────────────────────────────────────────────────┐
│  CyberShield X Node.js Core (Express + Socket.IO)     │
│  Port: 5001 (Default)                                  │
│                                                        │
│  ├── Security Middlewares (Helmet, CORS, Rate Limiters)│
│  ├── Authentication (JWT + Revocation Blacklist)       │
│  ├── API Engine (91 Built-in Threat/Security Services) │
│  ├── Native Terminal Subprocess Manager                │
│  │   └── HostEnvironmentService (PID Tracking, Kill)  │
│  ├── Real-time Threat Engine (ThreatBroadcaster)       │
│  └── AI Copilot Orchestrator (Gemini / Ollama / Rules) │
└───────────┬────────────────────────────────────────────┘
            │
            ├──────────────────────────┐
            ▼                          ▼
┌───────────────────────┐  ┌──────────────────────────────────┐
│ MongoDB Replica Set   │  │ Host Native System Binaries      │
│ (Mongoose v8 Pool)    │  │ (curl, dig, whois, ping, traceroute)
└───────────────────────┘  └──────────────────────────────────┘
```

---

## 2. Production Environment Prerequisites

Before starting the application in a production environment, verify the following baseline prerequisites:

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Operating System** | Linux (Ubuntu 22.04 LTS / Debian 12 / RHEL 9) or macOS (Darwin 23+) | Linux Ubuntu 22.04 LTS x86_64 or aarch64 |
| **Node.js Runtime** | Node.js v20.x LTS | Node.js v20.x or v22.x LTS |
| **Memory (RAM)** | 2 GB Available | 4 GB+ Dedicated |
| **Storage (Disk)** | 10 GB SSD | 50 GB+ High-IOPS SSD |
| **Database** | MongoDB 6.0+ Community / Enterprise | MongoDB 7.0+ Replica Set with TLS & Auth |
| **Required Binaries** | `curl`, `whois`, `dig` (or `nslookup`), `ping` | System network utilities installed in `$PATH` |

---

## 3. Configuration Management & Secret Safety

Production configuration must be supplied exclusively through environment variables or a secured, read-only `.env` file (`chmod 600 .env`).

### 3.1 Required Production Variables

```bash
# Server Runtime
NODE_ENV=production
PORT=5001
HOST=0.0.0.0

# Database URI (Authentication required in production)
MONGO_URI=mongodb://cybershield_app:YOUR_SECURE_PASSWORD@127.0.0.1:27017/cybershield-x?authSource=admin
MONGO_MAX_POOL_SIZE=50
MONGO_CONNECT_TIMEOUT_MS=10000

# Cryptographic Keys (Min 64-char random hex)
JWT_SECRET=c3b0d7...f48a912e
JWT_REFRESH_SECRET=e71c9a...a13b48df
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS Allowed Origins
CLIENT_URL=https://soc.cybershield.local
ALT_CLIENT_URL=https://soc-backup.cybershield.local
```

### 3.2 Optional Capability Variables

```bash
# AI Engines (Truthful attribution fallback if missing)
GEMINI_API_KEY=AIzaSy...
OLLAMA_BASE_URL=http://127.0.0.1:11434

# External Threat Feeds
ALIENVAULT_API_KEY=
SHODAN_API_KEY=
CENSYS_API_ID=
CENSYS_API_SECRET=
```

> [!CAUTION]
> **Zero Secret Leakage Rule:** Never commit active credentials to git. Ensure logs, error payloads, and diagnostic readiness endpoints redact connection strings and bearer tokens.

---

## 4. Production Startup Procedures

### 4.1 Native Node.js Startup

```bash
# 1. Switch to application directory
cd /opt/cybershield-x

# 2. Verify environment configuration
test -f server/.env && chmod 600 server/.env

# 3. Export production environment
export NODE_ENV=production

# 4. Start production server
node server/index.js
```

### 4.2 PM2 Process Manager (Recommended for Single/Multi-Host VMs)

Create or verify `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'cybershield-x',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    max_memory_restart: '1G',
    kill_timeout: 10000,
    listen_timeout: 8000,
    error_file: '/var/log/cybershield/error.log',
    out_file: '/var/log/cybershield/combined.log',
    time: true
  }]
};
```

Commands:
```bash
# Start application under PM2
pm2 start ecosystem.config.js --env production

# Save process list for auto-boot
pm2 save
pm2 startup
```

### 4.3 Container / Docker Startup

```bash
# Build production container image
docker build -t cybershield-x:v61.4.0 .

# Run container with environment file and network isolation
docker run -d \
  --name cybershield-x-core \
  --restart unless-stopped \
  -p 5001:5001 \
  --env-file /etc/cybershield/production.env \
  cybershield-x:v61.4.0
```

---

## 5. Graceful Shutdown & Zombie Process Elimination

CyberShield X implements a deterministic two-phase shutdown workflow upon receiving `SIGTERM` or `SIGINT`:

1. **Stop Accepting Ingress:** HTTP/Socket.IO servers cease accepting new client connections.
2. **Subprocess Cleanup:** `HostEnvironmentService.activeProcesses` is iterated; all executing child processes receive `SIGKILL` to prevent orphan/zombie states.
3. **Database Drain:** Active MongoDB connection pool operations are drained and `mongoose.connection.close()` is executed.
4. **Timer Clear & Exit:** Internal intervals are terminated and process exits with code `0`.

### Manual Termination Commands:

```bash
# Graceful shutdown (SIGTERM)
kill -15 $(pgrep -f "node.*server/index.js")

# Check for lingering native subprocesses (curl, whois, dig, ping)
ps aux | grep -E "(curl|whois|dig|ping|traceroute)" | grep -v grep

# Emergency force-kill if unresponsive after 10s
kill -9 $(pgrep -f "node.*server/index.js")
```

---

## 6. Health & Readiness Telemetry Monitoring

The platform provides dual status endpoints designed for container orchestrators (Kubernetes / ECS) and reverse proxies:

### 6.1 Liveness Probe (`GET /health`)
- **Purpose:** Verifies that the HTTP event loop and process are alive.
- **Expected Response:** `HTTP 200 OK`
```json
{
  "status": "healthy",
  "service": "CyberShield X Nexus API",
  "version": "v61.4.0",
  "timestamp": "2026-09-09T02:00:00.000Z"
}
```

### 6.2 Truthful Readiness Probe (`GET /api/health/readiness` or `/api/readiness`)
- **Purpose:** Deep inspection of Database, AI engines, Host Native binaries, and real-time event pipeline.
- **States:**
  - `READY`: All primary systems operational (DB connected, native tools available).
  - `DEGRADED`: Database unreachable or optional features missing, but platform operates in safe contingency mode.
- **Example Response:**
```json
{
  "status": "READY",
  "timestamp": "2026-09-09T02:00:00.000Z",
  "uptime": 1420.5,
  "database": {
    "status": "connected",
    "latencyMs": 2
  },
  "ai": {
    "provider": "google",
    "status": "operational"
  },
  "nativeHost": {
    "platform": "linux",
    "availableTools": ["dns", "whois", "port", "http", "ssl", "traceroute"],
    "blockedTools": ["sqlmap", "trivy", "nikto", "aircrack-ng", "ghidra", "yara-rules", "radare2", "semgrep", "gitleaks"]
  }
}
```

---

## 7. Terminal & Host Native Diagnostics

### 7.1 Emergency Subprocess Cancellation

If an operator launches a command or a subprocess becomes non-responsive:

```bash
# Cancel execution via authenticated API
curl -X POST https://soc.cybershield.local/api/terminal/cancel \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"executionId": "exec_1725840000000_abc"}'
```

Response:
```json
{
  "success": true,
  "executionId": "exec_1725840000000_abc",
  "message": "Process terminated successfully"
}
```

> [!NOTE]
> `POST /api/terminal/cancel` is explicitly exempted from rate limiting to guarantee operators can terminate runaway executions even under peak traffic conditions.

### 7.2 Inspecting Active Subprocesses

```bash
# Check running processes spawned by CyberShield X
pgrep -P $(pgrep -f "node.*server/index.js") -l
```

---

## 8. Database Administration, Backup & Recovery

### 8.1 MongoDB Production Hardening
Ensure the following connection settings are applied in `server/.env`:
- `MONGO_MAX_POOL_SIZE=50` (prevents socket exhaustion)
- `MONGO_CONNECT_TIMEOUT_MS=10000` (detects network partitions rapidly)
- Socket Timeout: Hardened to 45,000ms internally

### 8.2 Database Backup Procedure

Perform cold or hot database backups using `mongodump`:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/cybershield/$(date +%Y%m%d_%H%M%S)"
mkdir -p "${BACKUP_DIR}"

echo "Starting CyberShield X database backup..."
mongodump \
  --uri="${MONGO_URI}" \
  --out="${BACKUP_DIR}" \
  --gzip

echo "Backup completed successfully at: ${BACKUP_DIR}"
```

### 8.3 Database Restore Procedure

To restore from an archive:

```bash
#!/usr/bin/env bash
set -euo pipefail

RESTORE_ARCHIVE="$1"

if [ -z "${RESTORE_ARCHIVE}" ]; then
  echo "Usage: ./restore.sh /path/to/backup_directory"
  exit 1
fi

echo "Restoring database from ${RESTORE_ARCHIVE}..."
mongorestore \
  --uri="${MONGO_URI}" \
  --drop \
  --gzip \
  "${RESTORE_ARCHIVE}"

echo "Database restore completed. Validating application connectivity..."
curl -s http://127.0.0.1:5001/api/readiness | grep -q '"status":"READY"' && echo "✅ Readiness Verified" || echo "⚠️ Check Logs"
```

---

## 9. Rollback Strategy & Procedures

If a deployment contains unforeseen regressions, execute the rollback plan immediately:

### 9.1 Fast Application Rollback

```bash
# 1. Stop current release
pm2 stop cybershield-x

# 2. Check out previously certified release tag
git checkout v61.3.0

# 3. Restore frontend production build
npm run build --prefix client

# 4. Restart server under prior release
pm2 start ecosystem.config.js --env production

# 5. Verify readiness
curl -f http://127.0.0.1:5001/api/readiness
```

### 9.2 Database Schema Compatibility Note
CyberShield X maintains backward compatibility across minor versions. The MongoDB schemas do not use destructive column/field drops across versions `v61.3.0` and `v61.4.0`. Data written by `v61.4.0` remains legible to `v61.3.0`.

---

## 10. Native Binary Classification & Dependency Policy

CyberShield X categorizes binary dependencies strictly into three tiers to guarantee truthful operations:

| Tool ID | Classification | Behavior if Missing on Host |
| :--- | :--- | :--- |
| `curl` / `http` | **REQUIRED** | Deployment blocked; essential for egress verification. |
| `dig` / `dns` | **REQUIRED** | Deployment blocked; essential for DNS reconnaissance. |
| `whois` | **OPTIONAL** | Warning reported; tool marks error gracefully without blocking server startup. |
| `ping` | **OPTIONAL** | Warning reported; ping diagnostic disabled. |
| `traceroute` | **OPTIONAL** | Warning reported; path analysis tool disabled. |
| `sqlmap` | **BLOCKED_DEPENDENCY** | Honestly reported as missing external dependency (Same-Capability Rule). Requires containerized sandbox. |
| `trivy` | **BLOCKED_DEPENDENCY** | Blocked dependency reported. |
| `nikto` | **BLOCKED_DEPENDENCY** | Blocked dependency reported. |
| `aircrack-ng` | **BLOCKED_DEPENDENCY** | Blocked dependency reported. |
| `ghidra` | **BLOCKED_DEPENDENCY** | Blocked dependency reported. |
| `yara-rules` | **BLOCKED_DEPENDENCY** | Blocked dependency reported. |
| `radare2` | **BLOCKED_DEPENDENCY** | Blocked dependency reported. |
| `semgrep` | **BLOCKED_DEPENDENCY** | Blocked dependency reported. |
| `gitleaks` | **BLOCKED_DEPENDENCY** | Blocked dependency reported. |

---

## 11. Incident Handling & Emergency Playbooks

### Incident A: Terminal Execution Storm / High Load
1. Check process table for stuck child processes:
   `ps -ef | grep -E "whois|dig|curl"`
2. If rate limiting triggers across legitimate clients, review `TERMINAL_RATE_LIMIT_MAX` in `.env`.
3. In emergency, execute `POST /api/terminal/cancel` for the offending `executionId`.

### Incident B: MongoDB Cluster Disconnection
1. The platform automatically enters `DEGRADED` state (`HTTP 503` or `{ "status": "DEGRADED" }` on `/api/readiness`).
2. Mongoose driver automatically retries connections with exponential backoff.
3. Check MongoDB service status:
   `systemctl status mongod` or `docker logs mongodb`
4. Once MongoDB connectivity is restored, Mongoose listener emits `reconnected` and readiness returns to `READY` without restarting the Node.js process.

### Incident C: External AI Provider Outage
1. If Google Gemini API is unresponsive or rate-limited (`429`), AIOrchestrator automatically cascades to:
   - Ollama (Local LLM if configured via `OLLAMA_BASE_URL`)
   - Truthful Contingency Rule-Engine fallback
2. The UI transparently updates provider attribution badge to `Contingency Rule Engine (Local Fallback)` with honest telemetry.

---

## 12. Operator Verification Checklist

Before certifying any node for live operational traffic:

- [ ] Liveness probe returns `200 OK` on `/health`.
- [ ] Readiness probe returns `status: "READY"` on `/api/readiness`.
- [ ] Terminal emergency cancellation verified on test execution.
- [ ] Secret leakage audit confirms zero raw tokens in logs.
- [ ] MongoDB connection pool active with min 5 sockets.
- [ ] Clean shutdown leaves 0 orphaned child processes (`ps aux | grep curl`).
- [ ] Production build assets served with cache headers and no source code leak.
