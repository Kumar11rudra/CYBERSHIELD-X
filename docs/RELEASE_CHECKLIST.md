# CyberShield X — Final Production Release & Launch Checklist

This checklist provides the final release gate controls for deploying **CyberShield X** to production hosts.

```
[ FRONTEND ] Cloudflare Pages (`client/build/` SPA)
     │
[ BACKEND  ] Render Web Service (`server/index.js` via `render.yaml`)
     │
[ DATABASE ] MongoDB Atlas Cluster (`MONGODB_URI`)
```

> [!IMPORTANT]
> Detailed step-by-step setup guides are provided in [`docs/DEPLOYMENT_RUNBOOK.md`](DEPLOYMENT_RUNBOOK.md). This checklist tracks execution sign-off.

---

## 1. Pre-Deployment Verification `[AUTOMATED CHECK]`
- [x] Run full backend test suite: `cd server && npm test` (79/79 tests passed).
- [x] Run staging verification CLI: `npm run verify:staging` (Exits with code `0`).
- [x] Run release verification CLI: `npm run verify:release` (Exits with code `0`).
- [x] Build React production client: `cd client && npm run build` (Outputs `_headers` and `_redirects`).

---

## 2. MongoDB Atlas Setup `[OPERATOR ACTION]`
- [ ] Provision MongoDB Atlas Cluster (Free M0 or Dedicated Instance).
- [ ] Create Database User with `readWrite` access to `cybershield-x` database.
- [ ] Add `0.0.0.0/0` or Render static outbound IPs to Network Access IP Whitelist.
- [ ] Copy connection string URI: `mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>.mongodb.net/cybershield-x`.

---

## 3. Render Backend Setup `[OPERATOR ACTION]`
- [ ] Log into Render Dashboard and connect GitHub repository (`CYBERSHIELD-X`).
- [ ] Select `render.yaml` Blueprint or create Web Service:
  - Root Directory: `server`
  - Start Command: `npm start`
  - Health Probe Path: `/health`

---

## 4. Production Environment Variables `[OPERATOR ACTION]`
Configure production keys on Render Dashboard:
- [ ] `NODE_ENV`: `production`
- [ ] `MONGODB_URI`: `<MONGODB_CONNECTION_STRING>`
- [ ] `JWT_SECRET`: `<RANDOM_64_CHAR_HEX_STRING>`
- [ ] `JWT_REFRESH_SECRET`: `<RANDOM_64_CHAR_HEX_STRING>`
- [ ] `VAULT_ENCRYPTION_KEY`: `<RANDOM_32_CHAR_STRING>`
- [ ] `CLIENT_URL`: `https://cybershieldx.pages.dev`

---

## 5. Cloudflare Pages Setup `[OPERATOR ACTION]`
- [ ] Connect repository (`CYBERSHIELD-X`) to Cloudflare Pages Dashboard.
- [ ] Set Framework Preset: `Create React App`.
- [ ] Set Root Directory: `client`.
- [ ] Set Build Command: `npm run build`.
- [ ] Set Output Directory: `build`.

---

## 6. Frontend API Configuration `[OPERATOR ACTION]`
- [ ] Set Environment Variable in Cloudflare Pages Dashboard:
  - `REACT_APP_API_URL`: `https://<RENDER_SERVICE_NAME>.onrender.com`

---

## 7. CORS Verification `[POST-DEPLOYMENT VERIFICATION]`
- [ ] Verify Render backend CORS matcher allows `https://cybershieldx.pages.dev` and `https://*.pages.dev`.
- [ ] Verify cross-origin API requests from browser console complete without CORS errors.

---

## 8. Admin Account Seeding `[OPERATOR ACTION]`
- [ ] Execute initial admin seed script on backend host:
  ```bash
  npm run seed:admin
  ```
- [ ] Verify secure Administrator account is created with `role === 'admin'`.

---

## 9. Health Check `[POST-DEPLOYMENT VERIFICATION]`
- [ ] Send HTTP GET request to `https://<RENDER_SERVICE_NAME>.onrender.com/health`.
- [ ] Confirm response returns `HTTP 200 OK` in `< 50ms`.

---

## 10. Authentication Verification `[POST-DEPLOYMENT VERIFICATION]`
- [ ] Create test user account on Cloudflare Pages site (`/signup`).
- [ ] Log in (`/login`) and verify JWT access token & signed HTTP-only refresh cookie.

---

## 11. Core Tool Verification `[POST-DEPLOYMENT VERIFICATION]`
- [ ] Test WHOIS & DNS engine query on `/web-forensics` page.
- [ ] Test SSL/TLS certificate audit query.
- [ ] Test Phishing URL Detector query.
- [ ] Verify all live models settle in `< 10 seconds` without hanging.

---

## 12. Security Verification `[POST-DEPLOYMENT VERIFICATION]`
- [ ] Inspect HTTP response headers on Cloudflare Pages: confirm `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`.
- [ ] Test SSRF block on `127.0.0.1`: confirm HTTP 400 error returned.

---

## 13. Rollback Procedure `[OPERATOR ACTION]`
- [ ] Cloudflare Pages: Navigate to **Deployments** → **Rollback to this deployment** on any previously passing build commit.
- [ ] Render Backend: Navigate to **Events** → **Rollback to deploy**.

---

## 14. Post-Deployment Monitoring `[POST-DEPLOYMENT VERIFICATION]`
- [ ] Log into `/nexus-admin` as Administrator.
- [ ] Audit **Nexus Command System Health** dashboard for 30-minute anomalies or connection drops.

---

## 15. Final Launch Sign-Off
- [ ] Lead Architect Sign-Off: **APPROVED**
- [ ] Release Date: **2026-08-11**
- [ ] Architecture Release Version: **V27.0.0**
