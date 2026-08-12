# CyberShield X — Production Operator Deployment Runbook

## 1. Executive Summary & Target Architecture

This runbook details the production deployment workflow for **CyberShield X**.

```
[ User Browser ]
      │
      ├───► Frontend SPA ─────────────► Cloudflare Pages (`client/build/`)
      │                                 - Static SPA fallback (`_redirects`)
      │                                 - Security headers (`_headers`)
      │
      └───► Express Backend API ──────► Render Web Service (`server/index.js`)
                                        - Dynamic CORS matching `https://*.pages.dev`
                                        - Non-destructive production config validator
                                              │
                                              ▼
                                        MongoDB Atlas Cluster
```

> [!IMPORTANT]
> **Deployment Target Policy**:
> - **Frontend Host**: Cloudflare Pages (`client/`)
> - **Backend Host**: Render Web Service (`server/`)
> - **Database Host**: MongoDB Atlas
> - **Vercel Policy**: Vercel is **NOT** an active deployment target for CyberShield X. Vercel provider REST adapters in `server/services/deployment/adapters/` remain purely for read-only status telemetry when enabled.

---

## 2. Prerequisites & Repository Setup

* **GitHub Repository**: CyberShield X repository (`CYBERSHIELD-X`) cloned with admin access.
* **Accounts Required**:
  1. MongoDB Atlas Account (Free M0 or Paid Cluster)
  2. Render Account
  3. Cloudflare Account (Pages enabled)
* **CLI Tools**: Node.js v20+, Git, npm.

---

## 3. Step-by-Step Operator Workflow

### Step A: MongoDB Atlas Database Setup
1. Log into **MongoDB Atlas** and create a new Database Cluster.
2. Under **Database Access**, create a database user with `readWrite` permissions on the `cybershield-x` database.
3. Under **Network Access**, add an IP Access Entry:
   - For Render cloud access, add `0.0.0.0/0` (Allow Access from Anywhere) or specify Render static outbound IPs.
4. Obtain the Connection String URI in standard SRV format:
   ```
   mongodb+srv://<DB_USER>:<DB_PASSWORD>@<CLUSTER_ADDRESS>.mongodb.net/cybershield-x?retryWrites=true&w=majority
   ```

---

### Step B: Render Web Service Backend Deployment
1. Log into **Render** and click **New +** → **Blueprint**.
2. Connect your GitHub repository (`CYBERSHIELD-X`). Render will detect `render.yaml` in the root directory.
3. Alternatively, create a **New Web Service** manually:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install --legacy-peer-deps`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
4. Configure **Environment Variables** in the Render Dashboard:

#### Required Production Variables
| Environment Variable | Requirement | Description / Value Placeholder |
| :--- | :--- | :--- |
| `NODE_ENV` | **REQUIRED** | `production` |
| `PORT` | **REQUIRED** | `10000` (Injected automatically by Render) |
| `MONGODB_URI` | **REQUIRED** | `<MONGODB_CONNECTION_STRING>` |
| `JWT_SECRET` | **REQUIRED** | `<RANDOM_64_CHAR_HEX_STRING>` |
| `JWT_REFRESH_SECRET` | **REQUIRED** | `<RANDOM_64_CHAR_HEX_STRING>` |
| `VAULT_ENCRYPTION_KEY` | **REQUIRED** | `<RANDOM_32_CHAR_STRING>` |
| `CLIENT_URL` | **REQUIRED** | `https://cybershieldx.pages.dev` |

#### Optional Deployment Observability Variables (Phases 20–24)
| Environment Variable | Requirement | Description / Value Placeholder |
| :--- | :--- | :--- |
| `GITHUB_TOKEN` | OPTIONAL / DEFERRED | GitHub Personal Access Token (repo scope) |
| `GITHUB_OWNER` | OPTIONAL / DEFERRED | `Kumar11rudra` |
| `GITHUB_REPO` | OPTIONAL / DEFERRED | `CYBERSHIELD-X` |
| `VERCEL_TOKEN` | OPTIONAL / DEFERRED | Vercel REST API Token (Read-Only Telemetry) |
| `VERCEL_PROJECT_ID` | OPTIONAL / DEFERRED | Vercel Project Identifier |
| `RENDER_API_KEY` | OPTIONAL / DEFERRED | Render API Access Key |
| `RENDER_SERVICE_ID` | OPTIONAL / DEFERRED | Render Web Service ID |

5. Deploy the Web Service and note your live Render backend URL:
   ```
   https://<RENDER_SERVICE_NAME>.onrender.com
   ```

---

### Step C: Cloudflare Pages Frontend Deployment
1. Log into **Cloudflare** and navigate to **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**.
2. Select your repository (`CYBERSHIELD-X`).
3. Configure Build Settings:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `build`
4. Add **Environment Variable**:
   - `REACT_APP_API_URL`: `https://<RENDER_SERVICE_NAME>.onrender.com`
5. Click **Save and Deploy**. Cloudflare Pages will build static assets, copying `client/public/_headers` (CSP/HSTS) and `client/public/_redirects` (`/* /index.html 200`) into `build/`.

---

## 4. Post-Deployment Verification & Diagnostics

Run the non-destructive staging verification CLI locally or in CI/CD:

```bash
# Run staging pre-flight verification CLI
npm run verify:staging
```

Expected Output:
```
==================================================
CYBERSHIELD X — PHASE 25 STAGING VERIFICATION
==================================================
OVERALL STATUS : READY (or READY_WITH_DEFERRED_ITEMS)

[FRONTEND BUILD & HEADERS]
Status         : PASS
Security Headers: PRESENT (_headers)
SPA Redirects   : PRESENT (_redirects)

[CORS SECURITY REGEX]
Status         : PASS
Canonical Host : ALLOWED (https://cybershieldx.pages.dev)
Alias Domain   : ALLOWED (https://*.pages.dev)
==================================================
```

---

## 5. Security & Secret Rules

> [!CAUTION]
> 1. **Never commit `.env` files** to Git repository. `.gitignore` strictly ignores `.env` and `.env.*`.
> 2. **Never expose backend secrets** (`MONGODB_URI`, `JWT_SECRET`, `VAULT_ENCRYPTION_KEY`) in frontend environment variables.
> 3. **Verify CORS policies**: The backend Express CORS matcher strictly accepts origins matching `https://*.pages.dev` and configured `CLIENT_URL`. Wildcard CORS (`*`) is disabled.

---

## 6. Troubleshooting & Rollback Guidance

* **Frontend SPA 404 on Refresh**: Ensure `client/public/_redirects` contains `/* /index.html 200`.
* **CORS Blocked in Browser**: Verify `CLIENT_URL` in Render matches your exact Cloudflare Pages domain URL (with `https://`).
* **MongoDB Connection Timeout**: Ensure Atlas Network Access IP Whitelist includes `0.0.0.0/0` or Render static IPs.
* **Rollback Procedure**: In Cloudflare Pages or Render Dashboard, navigate to **Deployments** and click **Rollback to this deployment** on any previously verified build commit.
