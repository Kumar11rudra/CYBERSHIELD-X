# CyberShield X — Authentication Operations Runbook

> **Platform Baseline**: `v61.4.0`  
> **Status**: `OPERATIONS_RUNBOOK_ACTIVE`  
> **Author**: AntiGravity (Implementation Engineer)  
> **Reviewer**: Lead Architect (ChatGPT)  
> **Date**: 2026-09-09  

---

## 1. Operational Overview

This runbook establishes standard operating procedures for managing, monitoring, troubleshooting, and securing user sessions and authentication infrastructure in CyberShield X.

---

## 2. Session Lifecycle & Token Timers

| Credential / Artifact | Lifetime | Storage Location | Renewal Strategy |
| :--- | :--- | :--- | :--- |
| **Access Token** | 15 Minutes | In-Memory (React) & `localStorage.cybershield_token` | Renewed via Single-Flight Refresh Interceptor |
| **Refresh Token** | 7 Days | HttpOnly Cookie & `localStorage.cybershield_refresh_token` | Rotated on each successful `/auth/refresh` |
| **Server Session Record** | 7 Days | MongoDB `Session` collection + Cache | TTL index automatically evicts expired sessions |
| **Nexus Session Token** | Browser Session | `sessionStorage.cybershield.nexus.session` | Per-tab CSRF/anti-hijacking session token |

---

## 3. Emergency Session Revocation Procedures

### 3.1 Revoke a Specific User Session
To immediately invalidate an active session (e.g. compromised device):
```javascript
const sessionService = require('./services/sessionService');
await sessionService.revokeSession(sessionId);
```
- The session is marked `isRevoked: true` in MongoDB.
- Cached state is updated for 24 hours.
- Any subsequent request bearing this `sessionId` in its token payload will receive:
  ```json
  {
    "success": false,
    "code": "AUTH_SESSION_EXPIRED",
    "error": "Session has been revoked. Please re-authenticate."
  }
  ```

### 3.2 Revoke All Active Sessions for a User
In case of account takeover, password reset, or admin suspension:
```javascript
const sessionService = require('./services/sessionService');
await sessionService.revokeAllUserSessions(userId, exceptSessionId = null);
```
- All active sessions for `userId` are revoked in MongoDB and cache.
- The user is immediately forced to re-login on all devices.

---

## 4. Multi-Tab Session Synchronization Behavior

CyberShield X automatically synchronizes authentication state across all open browser tabs via browser `storage` events:

1. **User Logs Out in Tab A**:
   - `cybershield_token` is removed from `localStorage`.
   - `localStorage.setItem('cybershield_auth_event', 'logout:' + Date.now())` is written.
   - Tab B, Tab C, and all other open tabs receive the `storage` event.
   - All tabs immediately clear local memory state and transition to `UNAUTHENTICATED`.
2. **User Logs In in Tab A**:
   - `cybershield_token` is updated in `localStorage`.
   - `localStorage.setItem('cybershield_auth_event', 'login:' + Date.now())` is written.
   - Other tabs receive the event, fetch the new user profile via `/api/auth/me`, and update their views without requiring a manual page refresh.
3. **User Switches Accounts**:
   - User A logs out and User B logs in.
   - All tabs purge existing cached data, ensuring User B never sees User A's data.

---

## 5. Rate Limiting & Abuse Protection Tuning

Authentication routes are protected by dedicated rate limiters in `server/index.js`:

```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // Accommodates interactive form checks & availability probes
  skip: (req) => req.method === 'OPTIONS' || req.path === '/check-username' || req.path === '/me',
  message: {
    success: false,
    code: 'AUTH_RATE_LIMITED',
    error: 'Too many login/signup attempts. Try again later.'
  }
});
```

### Account Lockout Thresholds
- **Max Failed Attempts**: 5 consecutive failed attempts.
- **Lockout Duration**: 15 minutes.
- When locked out, `/api/auth/login` returns:
  ```json
  {
    "success": false,
    "code": "AUTH_ACCOUNT_DISABLED",
    "error": "Account temporarily locked due to excessive failed attempts. Try again in 15 minutes."
  }
  ```

---

## 6. Troubleshooting Guide

### Issue 1: 401 Loops on Expired Tokens
- **Symptom**: User sees rapidly flickering screens or requests repeatedly failing with 401.
- **Diagnosis**: Verify `client/src/services/api.js` interceptor is setting `originalRequest.headers['Authorization']` on Request 1 and writing to `localStorage`. Verify `originalRequest._retry = true` is present to prevent infinite loops.
- **Resolution**: Clear browser cache and localStorage. Verify backend returns valid token on `POST /api/auth/refresh`.

### Issue 2: Cookies Dropped in Local Development
- **Symptom**: Refresh token missing error on `/api/auth/refresh`.
- **Diagnosis**: Browser rejects `Set-Cookie` header because `Secure` flag is present on plain HTTP (`http://localhost:3000` or `http://localhost:5001`).
- **Resolution**: Verify `authController.js` uses dynamic secure flags (`secure: process.env.NODE_ENV === 'production' && req.secure`). Alternatively, client sends refresh token in request body as fallback.

### Issue 3: Duplicate Signup Race Condition
- **Symptom**: Database contains two users with identical emails.
- **Diagnosis**: `emailHash` index was non-unique or sparse.
- **Resolution**: Check MongoDB index on `emailHash`. Re-index:
  ```javascript
  db.users.createIndex({ emailHash: 1 }, { unique: true });
  ```
