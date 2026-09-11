# CyberShield X — Authentication Architecture & Identity Hardening Specification

> **Platform Baseline**: `v61.4.0`  
> **Status**: `AUTHENTICATION_ARCHITECTURE_DEFINED`  
> **Author**: AntiGravity (Implementation Engineer)  
> **Reviewer**: Lead Architect (ChatGPT)  
> **Date**: 2026-09-09  

---

## 1. Executive Summary

This specification establishes the canonical authentication architecture for CyberShield X. It eliminates recurring authentication failures caused by token lifecycle bugs, race conditions, stale browser state, cookie/token mismatches, refresh storms, premature redirect loops, and multi-tab state desynchronization.

The core standard is:
> A normal user must be able to create an account, verify/sign in where applicable, maintain a session, refresh the page, navigate the application, logout, login again, and recover from expired/stale credentials without encountering inconsistent authentication state.

---

## 2. Complete Runtime Flow Trace

```
Signup
  ↓
Account Creation (Email normalized, SHA-256 emailHash unique index enforced)
  ↓
Authentication Response (Access token + Refresh token + User DTO)
  ↓
Credential Storage (HttpOnly Cookie with HTTPS-aware Secure flag + Bearer fallback in memory/localStorage)
  ↓
Auth Bootstrap on Reload (App boots in UNKNOWN state, calls /api/auth/me, displays LoadingScreen)
  ↓
Protected API Request (Bearer token attached; x-organization-id tenant header attached)
  ↓
Token Validation (JWT verification: signature, issuer 'cybershield-x', audience 'cybershield-x-api', expiration)
  ↓
Refresh / Renewal (Single-flight mutex; concurrent 401s share ONE refresh call; tokens rotated)
  ↓
User Session (Session model in MongoDB tracks active sessions; revoked sessions rejected immediately)
  ↓
Authorization / RBAC (Server-side hierarchy: VIEWER: 10, ANALYST: 20, OPERATOR: 30, ADMIN: 40)
  ↓
Logout (Session revoked in MongoDB & cache; cookies cleared; localStorage cleared; event broadcast to other tabs)
  ↓
Session Cleanup (React AuthContext state reset to UNAUTHENTICATED; active queries cleared)
  ↓
Re-login (Clean state; new user credentials isolated with zero cache leakage)
```

---

## 3. One Authoritative Source of Truth — Canonical State Machine

To eliminate conflicting states (e.g. `localStorage` says authenticated, cookie says unauthenticated, React state says loading, backend session says expired), frontend routing and protected UI behavior derive strictly from a single 7-state finite state machine:

```
                  ┌───────────────┐
                  │    UNKNOWN    │ (Initial Boot / Reload)
                  └───────┬───────┘
                          │
                          ▼
               ┌─────────────────────┐
               │   AUTHENTICATING    │ (Calling /api/auth/me)
               └──────────┬──────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
  ┌───────────────┐               ┌─────────────────┐
  │ AUTHENTICATED │               │ UNAUTHENTICATED │
  └───────┬───────┘               └─────────────────┘
          │                               ▲
    401 on Token                          │
          │                               │
          ▼                               │ Refresh Failed
  ┌───────────────┐                       │
  │  REFRESHING   │───────────────────────┤
  └───────┬───────┘                       │
          │                               │
    Refresh Succeeded                     ▼
          │                       ┌─────────────────┐
          └──────────────────────►│ SESSION_EXPIRED │
                                  └─────────────────┘
```

### State Definitions

1. **`UNKNOWN`**: The initial state when the React application first mounts. No routing decisions are allowed. The UI displays `<LoadingScreen />`.
2. **`AUTHENTICATING`**: The application is actively validating stored credentials or attempting session bootstrap via `GET /api/auth/me`. Protected routes wait and display `<LoadingScreen />`.
3. **`AUTHENTICATED`**: The session is verified and active. The `user` object is populated. Protected routes render normal application views.
4. **`UNAUTHENTICATED`**: Explicitly unauthenticated (e.g. user never logged in or logged out). Protected routes redirect to `/login?returnTo=...`.
5. **`REFRESHING`**: The access token expired and the single-flight interceptor is actively acquiring a new token. API requests are held in a FIFO queue. Protected routes maintain current view without redirecting.
6. **`SESSION_EXPIRED`**: The refresh token is invalid or expired. The session has terminated. The UI displays a recoverable message ("Your session has expired. Please sign in again.") and directs to login.
7. **`AUTH_ERROR`**: Unrecoverable network or server error during authentication. Renders a retryable error screen without clearing valid credentials.

---

## 4. Token Architecture

| Property | Access Token | Refresh Token |
| :--- | :--- | :--- |
| **Token Type** | JSON Web Token (JWT) — `type: 'access'` | JSON Web Token (JWT) — `type: 'refresh'` |
| **Signing Algorithm** | HMAC-SHA256 (`HS256`) | HMAC-SHA256 (`HS256`) |
| **Secret Source** | `process.env.JWT_SECRET` (min 64 hex chars) | `process.env.JWT_REFRESH_SECRET` (min 64 hex chars) |
| **Issuer (`iss`)** | `cybershield-x` | `cybershield-x` |
| **Audience (`aud`)** | `cybershield-x-api` | `cybershield-x-api` |
| **Expiration (`exp`)** | 15 minutes (`15m`) | 7 days (`7d`) |
| **Clock Tolerance** | 10 seconds | 10 seconds |
| **Unique ID (`jti`)** | Random 16-byte hex string | Random 16-byte hex string |
| **Payload Claims** | `id`, `sub`, `role`, `orgId`, `sessionId`, `type` | `id`, `sub`, `sessionId`, `type`, `jti` |
| **Rotation Policy** | Replaced on every refresh | Rotated on every successful refresh |
| **Revocation** | Server checks `Session.isRevoked` via `sessionId` | Invalidation in MongoDB `Session` collection and cache |
| **Logout Invalidation** | Client removes token; backend marks `Session.isRevoked = true` | Cookie cleared; DB session marked revoked |

---

## 5. Token Storage & Resilient Dual Transport

To prevent environments without cookie support (e.g., cross-origin development, Safari ITP, mobile webviews, or non-HTTPS localhost) from breaking, CyberShield X uses **Resilient Dual Transport**:

1. **Primary Transport (Cookies)**:
   - `token` (Access Token): `HttpOnly: true`, `SameSite: strict` (or `none` in production cross-origin), `Path: /`, `Secure: req.secure || isProduction`.
   - `refreshToken`: `HttpOnly: true`, `SameSite: strict` (or `none` in production), `Path: /api/auth/refresh`, `Secure: req.secure || isProduction`.
2. **Fallback Transport (Headers & Request Body)**:
   - Access token is returned in the login/signup/refresh JSON response (`token: accessToken`). The client stores it in React memory and `localStorage.setItem('cybershield_token', ...)` for reload bootstrap.
   - The request interceptor attaches `Authorization: Bearer <token>`.
   - The refresh endpoint (`POST /api/auth/refresh`) inspects `req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token']`.
   - The login and signup endpoints return both `token` and `refreshToken` in the JSON response payload so clients without cookie access can supply the refresh token in the request body.

---

## 6. Single-Flight Token Refresh Interceptor

When multiple API requests trigger simultaneously (e.g., 10 parallel dashboard widgets) and the access token is expired:

1. **Lock Acquisition**: The first failing request (`status === 401`) sets `isRefreshing = true` and stores the active refresh promise.
2. **Request Queueing**: Requests 2 through 10 see `isRefreshing === true` and are appended to `failedQueue`, returning a promise resolved when the shared refresh finishes.
3. **Single Dispatch**: Exactly **one** `POST /api/auth/refresh` is dispatched to the backend.
4. **Originating Request Header Update**: Once the new access token arrives:
   - `localStorage.setItem('cybershield_token', newAccessToken)` is immediately called.
   - `originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken` is updated on Request 1.
   - Request 1 is retried via `api(originalRequest)`.
5. **Queue Resolution**: All pending requests in `failedQueue` have their `Authorization` headers updated with `newAccessToken` and are re-executed.
6. **Hard Failure Guard**:
   - If `/auth/refresh` returns 401/403, `failedQueue` is rejected.
   - All tokens are wiped from `localStorage`.
   - A custom event `cybershield:session-expired` is dispatched to transition the frontend state machine to `SESSION_EXPIRED`.
   - No request is retried more than once (`_retry = true`).

---

## 7. Auth Bootstrap on Page Reload

```
Page Reload (F5)
      ↓
AuthContext initializes state = 'UNKNOWN', loading = true
      ↓
PrivateRoute intercepts route: detects 'UNKNOWN' / 'AUTHENTICATING'
      ↓
Renders <LoadingScreen /> (NO premature redirect to /login)
      ↓
AuthContext calls GET /api/auth/me
      ↓
Case A: Access Token Valid
      → Receives { success: true, user: {...} }
      → State transitions: AUTHENTICATING → AUTHENTICATED
      → PrivateRoute renders protected page

Case B: Access Token Expired, Refresh Token Valid
      → /auth/me returns 401
      → api.js single-flight refresh triggers POST /auth/refresh
      → /auth/refresh returns new token
      → /auth/me retries successfully
      → State transitions: AUTHENTICATING → REFRESHING → AUTHENTICATED
      → PrivateRoute renders protected page

Case C: Both Tokens Expired / Invalid
      → /auth/me returns 401, refresh fails
      → State transitions: AUTHENTICATING → UNAUTHENTICATED / SESSION_EXPIRED
      → PrivateRoute redirects to /login?returnTo=...
```

---

## 8. Database-Level Uniqueness Enforcement

In `server/models/User.js`:
- Email is encrypted at rest using AES-256-CBC with a random IV (`enc2:...`). Because non-deterministic IVs produce different ciphertexts for the same plaintext, MongoDB's unique index on `email` cannot prevent duplicates.
- **Enforcement**:
  - `emailHash: { type: String, unique: true, index: true, sparse: false }`
  - When saving or querying, `email.toLowerCase().trim()` is hashed with SHA-256.
  - MongoDB enforces the unique index on `emailHash`. Concurrent signup requests with identical emails produce identical `emailHash` values and trigger an immediate `E11000 duplicate key error` from MongoDB, preventing duplicate account creation at the database engine level.

---

## 9. Multi-Tab Session Synchronization

In `client/src/context/AuthContext.jsx`:
- A global `window.addEventListener('storage', handleStorageChange)` monitors changes to `cybershield_token` and `cybershield_auth_event`.
- **Cross-Tab Scenarios**:
  - **Tab A logs out**: Tab A clears `cybershield_token` and sets `localStorage.setItem('cybershield_auth_event', 'logout:' + Date.now())`. Tab B receives the event, resets its user state to `null`, and transitions to `UNAUTHENTICATED`.
  - **Tab A logs in as User B**: Tab B receives the new token event, reloads user profile via `/auth/me`, and replaces cached state, preventing User A's data from being displayed to User B.
  - **Session expires in Tab A**: Both tabs transition cleanly to `SESSION_EXPIRED`.

---

## 10. Standardized Error Contract

All authentication endpoints return standardized error payloads:

```json
{
  "success": false,
  "code": "AUTH_INVALID_CREDENTIALS",
  "error": "Invalid credentials",
  "errorDetails": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid credentials"
  }
}
```

### Canonical Error Codes

- `AUTH_INVALID_CREDENTIALS`: Wrong username/email/mobile or password.
- `AUTH_ACCOUNT_EXISTS`: Duplicate username, email, or mobile number during registration.
- `AUTH_ACCOUNT_DISABLED`: User is suspended, locked out, or banned.
- `AUTH_SESSION_EXPIRED`: Refresh token or session expired.
- `AUTH_TOKEN_INVALID`: Malformed, tampered, or invalid signature.
- `AUTH_TOKEN_MISSING`: No authorization header or cookie provided.
- `AUTH_REFRESH_FAILED`: Refresh token invalid, expired, or revoked.
- `AUTH_UNAUTHORIZED`: Authentication required for protected route.
- `AUTH_FORBIDDEN`: User lacks required role (e.g. non-admin accessing admin route).
- `AUTH_RATE_LIMITED`: Too many login/signup attempts.
- `AUTH_NETWORK_ERROR`: Backend unreachable or request timed out.
- `AUTH_SERVER_ERROR`: Internal server error during authentication.

---

## 11. Recurring Failure Root Cause

### 1. What was previously wrong
Multiple previous partial fixes addressed surface symptoms without stabilizing the underlying asynchronous token lifecycle:
- In `client/src/services/api.js`, the response interceptor updated queued requests with the refreshed token, but **retried the originating request with its stale, expired token**.
- `api.js` failed to write the refreshed access token to `localStorage.setItem('cybershield_token', ...)`.
- As a result, every subsequent request read the expired token from `localStorage`, triggering an infinite refresh storm.
- Because `AuthService.js` rotated the refresh token on every call, the duplicate refresh requests presented old refresh tokens, resulting in `Invalid or expired refresh token` (401) and sudden session termination.
- `authController.js` had hardcoded `secure: true` on cookies, causing cookies to be dropped over plain HTTP localhost or cross-port testing.
- `PrivateRoute` did not wait for auth bootstrap, redirecting to `/login` prematurely on page reloads.
- Encrypted email storage bypassed Mongo's unique index because `emailHash` lacked `unique: true`.
- No cross-tab session synchronization existed.

### 2. Why previous fixes did not permanently solve it
Previous changes (e.g. Phase 60 fixing bcrypt double-hashing on pre-save, or adding a boolean `isRefreshing` flag) only resolved isolated bugs. The fundamental flaws — originating request header desynchronization, unpersisted tokens, cookie dropping on plain HTTP, and lack of database uniqueness on `emailHash` — were never addressed together in a unified architecture.

### 3. Which component(s) caused the recurring behavior
- `client/src/services/api.js` (Interceptor header update omission, missing localStorage persistence)
- `server/controllers/authController.js` (Cookie-only refresh read, hardcoded secure flag)
- `server/models/User.js` (Missing `unique: true` on `emailHash`)
- `client/src/context/AuthContext.jsx` (No unified state machine, missing multi-tab sync)
- `client/src/App.jsx` (Premature redirect in `PrivateRoute`)

### 4. What architectural change prevents recurrence
- **Self-Updating Interceptor**: Originating request explicitly receives `originalRequest.headers['Authorization'] = 'Bearer ' + data.token` before retry.
- **Immediate LocalStorage Persistence**: Refreshed tokens are immediately written to storage.
- **Dual Transport**: Refresh endpoint reads cookies, request body, and headers; responses return refresh tokens for resilient fallback.
- **Database Unique Index**: `emailHash` enforces database-level uniqueness against duplicate account creation races.
- **7-State Canonical State Machine**: Prevents premature route redirects and unifies UI state.
- **Cross-Tab Synchronization**: `storage` event listener keeps all tabs in sync.

### 5. Which automated test now permanently guards against regression
- `server/tests/authentication_reliability.test.js`: Deterministic Jest test suite exercising signup duplicate rejection, token expiration handling, single-flight refresh with parallel requests, session revocation, and error code conformity.
- `server/scripts/run_authentication_reliability.js`: 34-point acceptance runner validating all Core, Reliability, Security, Browser/UX, and Regression requirements.
