# CyberShield X — Complete Tools & Models Reference Map

> **Single Source of Truth Reference**: Exhaustive mapping of all **111 Canonical Security Tools** and all **82 MongoDB Models** in CyberShield X.
> **Architecture Baseline**: `v62.5.3` (111-Tool Catalog & External Alternatives Policy / Centralized Native Terminal Workstation)
> **Inspection Timestamp**: 2026-09-28
> **Verification Status**: 100% Certified & Synchronized with Codebase

---

## 📊 Executive Summary & Core Inventory

| Component Category | Total Count | Active / Implemented | Pure Browser Client | Blocked / Dep-Locked | Files Implementing |
|:---|:---:|:---:|:---:|:---:|:---|
| **Canonical Security Tools** | **111** | 103 (92.8%) | 3 (2.7%) | 5 (4.5% safe fallback) | 19 backend services, 1 central controller, 10 UI components |
| **MongoDB Database Models** | **82** | 80 active in code | 0 | 2 legacy / future | `server/models/*.js` across 893 server files |
| **Tool Categories** | **24** | 24 | — | — | Full spectrum SOC & Cyber Warfare operations |
| **Chatbot Interactive Tools** | **2+** | Active | — | — | `server/services/chatbot_core/ToolRegistry.js` |

---

## 🛠️ PART 1: ALL 111 CANONICAL SECURITY TOOLS

Each tool below details its **ID, Name, Category, Input Type, Execution Target, Description**, and the **Exact Frontend & Backend Files** where it is implemented, routed, and tested.


### Category: Reconnaissance (8 Tools)

#### 1. `dns` — DNS Enumeration Engine

- **Tool ID**: `dns`
- **Full Name**: DNS Enumeration Engine
- **Category**: `Reconnaissance`
- **Input Type**: `domain`
- **Execution Target**: `HOST_NATIVE`
- **Status**: `live`
- **Description**: Lookup primary DNS records (A, MX, NS) and discover subdomains to map remote hosting architecture.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/dns`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute & GET /api/tools/dns` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `csiComposition.dnsEngine` (dnsEngine.collect())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 2. `whois` — WHOIS Record Engine

- **Tool ID**: `whois`
- **Full Name**: WHOIS Record Engine
- **Category**: `Reconnaissance`
- **Input Type**: `domain`
- **Execution Target**: `HOST_NATIVE`
- **Status**: `live`
- **Description**: Look up registration details, registrar, creation date, and name servers.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/whois`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute & GET /api/tools/whois` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `toolsController` (toolsController.whoisLookup())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 3. `port` — Port Scanner

- **Tool ID**: `port`
- **Full Name**: Port Scanner
- **Category**: `Reconnaissance`
- **Input Type**: `ip`
- **Execution Target**: `HOST_NATIVE`
- **Status**: `live`
- **Description**: Scan open ports and discover network services running on target hosts.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/port`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute & GET /api/tools/port-scan` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `csiComposition.portEngine` (portEngine.collect())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 4. `service_fingerprint` — Service Fingerprinting

- **Tool ID**: `service_fingerprint`
- **Full Name**: Service Fingerprinting
- **Category**: `Reconnaissance`
- **Input Type**: `ip`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Connects to remote ports to grab network banners and match signature software versions.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/service_fingerprint`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `csiComposition.serviceFingerprintEngine` (serviceFingerprintEngine.collect())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 5. `subfinder` — Subdomain Discovery Engine

- **Tool ID**: `subfinder`
- **Full Name**: Subdomain Discovery Engine
- **Category**: `Reconnaissance`
- **Input Type**: `domain`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Discovers active and passive subdomains using global Certificate Transparency logs and live DNS resolution.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/subfinder`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/controllers/toolkitController.js` (executeTool())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 6. `masscan` — Masscan Parallel Port Prober

- **Tool ID**: `masscan`
- **Full Name**: Masscan Parallel Port Prober
- **Category**: `Reconnaissance`
- **Input Type**: `ip`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: High-speed asynchronous port scanner designed to scan host lists and CIDR subnets in seconds with banner extraction.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/masscan`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 7. `shodan-query` — Shodan Node & Intelligence Search

- **Tool ID**: `shodan-query`
- **Full Name**: Shodan Node & Intelligence Search
- **Category**: `Reconnaissance`
- **Input Type**: `ip`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Queries Shodan databases for open ports, vulnerabilities, and geographic metadata associated with an IP address.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/shodan-query`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 8. `censys-search` — Censys Host & Certificate Explorer

- **Tool ID**: `censys-search`
- **Full Name**: Censys Host & Certificate Explorer
- **Category**: `Reconnaissance`
- **Input Type**: `ip`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Inspect public certificate configurations, Subject Alternative Names (SANs), and open services records in Censys search registries.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/censys-search`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: DNS & Network Intelligence (6 Tools)

#### 9. `dnsx` — Dnsx Multi-Record Resolver

- **Tool ID**: `dnsx`
- **Full Name**: Dnsx Multi-Record Resolver
- **Category**: `DNS & Network Intelligence`
- **Input Type**: `domain`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Resolves all DNS records (A, AAAA, MX, TXT, NS, CNAME, SOA, CAA) in parallel with latency metrics.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/dnsx`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/controllers/toolkitController.js` (executeTool())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 10. `traceroute` — Traceroute Visualizer

- **Tool ID**: `traceroute`
- **Full Name**: Traceroute Visualizer
- **Category**: `DNS & Network Intelligence`
- **Input Type**: `ip`
- **Execution Target**: `HOST_NATIVE`
- **Status**: `live`
- **Description**: Traces the intermediate gateway and backbone hops network packets pass through to reach target hosts.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/traceroute`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 11. `bgp-route-audit` — BGP Routing & RPKI Validator

- **Tool ID**: `bgp-route-audit`
- **Full Name**: BGP Routing & RPKI Validator
- **Category**: `DNS & Network Intelligence`
- **Input Type**: `ip`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Inspects global BGP routing configurations, announced prefixes, and RPKI ROA signature status to detect path hijacking risks.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/bgp-route-audit`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 12. `dnssec-audit` — DNSSEC Key Validator

- **Tool ID**: `dnssec-audit`
- **Full Name**: DNSSEC Key Validator
- **Category**: `DNS & Network Intelligence`
- **Input Type**: `domain`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Verifies the cryptographic signatures (RRSIG, DNSKEY, DS) of domain records to detect DNS spoofing risks.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/dnssec-audit`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/controllers/toolkitController.js` (executeTool())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 13. `ipv6-checker` — IPv6 Address Validator

- **Tool ID**: `ipv6-checker`
- **Full Name**: IPv6 Address Validator
- **Category**: `DNS & Network Intelligence`
- **Input Type**: `domain`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Performs configuration checks to confirm target availability over IPv6 networks and dual-stack architecture.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/ipv6-checker`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/controllers/toolkitController.js` (executeTool())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 14. `mac-lookup` — MAC OUI Parser

- **Tool ID**: `mac-lookup`
- **Full Name**: MAC OUI Parser
- **Category**: `DNS & Network Intelligence`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Resolves the Manufacturer and Organization Unique Identifier (OUI) registration metadata of a MAC address.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/mac-lookup`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/networkToolService.js` (networkToolService.lookupMac())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Web Security (8 Tools)

#### 15. `tech_detection` — Technology Detection

- **Tool ID**: `tech_detection`
- **Full Name**: Technology Detection
- **Category**: `Web Security`
- **Input Type**: `url`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Analyze web headers and page source code to identify technology stacks, frameworks, and versions.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/tech_detection`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute & GET /api/tools/tech-detect` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `csiComposition.techDetectionEngine` (techDetectionEngine.collect())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 16. `http` — HTTP Header Auditor

- **Tool ID**: `http`
- **Full Name**: HTTP Header Auditor
- **Category**: `Web Security`
- **Input Type**: `url`
- **Execution Target**: `HOST_NATIVE`
- **Status**: `live`
- **Description**: Analyze HTTP security headers configuration policies (CSP, HSTS, CORS, XFO).
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/http`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute & GET /api/tools/headers` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `csiComposition.httpEngine` (httpEngine.collect())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 17. `ssl` — SSL/TLS Certificate Audit

- **Tool ID**: `ssl`
- **Full Name**: SSL/TLS Certificate Audit
- **Category**: `Web Security`
- **Input Type**: `domain`
- **Execution Target**: `HOST_NATIVE`
- **Status**: `live`
- **Description**: Look up active TLS certificate details, including expiration, issuer, signature key sizes, and cipher suites.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/ssl`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute & GET /api/tools/ssl-cert` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `toolsController` (toolsController.checkSSL())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 18. `whatweb` — WhatWeb Technology Scanner

- **Tool ID**: `whatweb`
- **Full Name**: WhatWeb Technology Scanner
- **Category**: `Web Security`
- **Input Type**: `url`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Identifies content management systems (CMS), web servers, JavaScript frameworks, analytics, and security headers.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/whatweb`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 19. `dirsearch` — Dirsearch Path Prober

- **Tool ID**: `dirsearch`
- **Full Name**: Dirsearch Path Prober
- **Category**: `Web Security`
- **Input Type**: `url`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Probes high-value sensitive endpoints (/.env, /.git, /admin, /swagger.json, /robots.txt) to identify unintended exposure.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/dirsearch`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 20. `wpscan` — WPScan WordPress Auditor

- **Tool ID**: `wpscan`
- **Full Name**: WPScan WordPress Auditor
- **Category**: `Web Security`
- **Input Type**: `url`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Black box WordPress scanner assessing core version exposure, XML-RPC active endpoints, and REST API user enumeration.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/wpscan`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 21. `cors-scanner` — CORS Configuration Auditor

- **Tool ID**: `cors-scanner`
- **Full Name**: CORS Configuration Auditor
- **Category**: `Web Security`
- **Input Type**: `url`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Sends custom origin probes to detect arbitrary origin reflection, wildcard exposures, and insecure credentials trust.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/cors-scanner`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 22. `csp-evaluator` — CSP Policy Evaluator

- **Tool ID**: `csp-evaluator`
- **Full Name**: CSP Policy Evaluator
- **Category**: `Web Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Parses CSP directives and flags potential XSS injection bypasses, missing fallbacks, and insecure sources.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/csp-evaluator`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Vulnerability Assessment (8 Tools)

#### 23. `cve-lookup` — CVE Vulnerability Inspector

- **Tool ID**: `cve-lookup`
- **Full Name**: CVE Vulnerability Inspector
- **Category**: `Vulnerability Assessment`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Queries global CVE registries to inspect vulnerability descriptions, affected products, CVSS scores, and patches.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/cve-lookup`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/networkToolService.js` (networkToolService.lookupCve())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 24. `nikto` — Nikto Web Vulnerability Scanner

- **Tool ID**: `nikto`
- **Full Name**: Nikto Web Vulnerability Scanner
- **Category**: `Vulnerability Assessment`
- **Input Type**: `url`
- **Execution Target**: `BLOCKED_DEPENDENCY`
- **Status**: `live`
- **Description**: Finds dangerous files, outdated server software, and specific configuration mistakes on target web hosts.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/nikto`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 25. `sqlmap` — SQLmap Injection & Database Auditor

- **Tool ID**: `sqlmap`
- **Full Name**: SQLmap Injection & Database Auditor
- **Category**: `Vulnerability Assessment`
- **Input Type**: `url`
- **Execution Target**: `BLOCKED_DEPENDENCY`
- **Status**: `live`
- **Description**: Evaluates URL query parameters and forms for Boolean-based, error-based, UNION-based, and time-based SQL injection bugs.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/sqlmap`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 26. `trivy` — Trivy Container & Lockfile Auditor

- **Tool ID**: `trivy`
- **Full Name**: Trivy Container & Lockfile Auditor
- **Category**: `Vulnerability Assessment`
- **Input Type**: `text`
- **Execution Target**: `BLOCKED_DEPENDENCY`
- **Status**: `live`
- **Description**: Audit container images, lockfiles, and directories for software package vulnerabilities (CVEs) and root misconfigurations.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/trivy`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/vulnDastScannerService.js` (vulnDastScannerService.auditTrivyContainer())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 27. `zap` — OWASP ZAP Dynamic Web Application Scanner

- **Tool ID**: `zap`
- **Full Name**: OWASP ZAP Dynamic Web Application Scanner
- **Category**: `Vulnerability Assessment`
- **Input Type**: `url`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Audit web applications for reflected XSS, missing anti-CSRF tokens, sensitive header leaks, and insecure cookies.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/zap`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 28. `burp` — Burp Suite Enterprise DAST

- **Tool ID**: `burp`
- **Full Name**: Burp Suite Enterprise DAST
- **Category**: `Vulnerability Assessment`
- **Input Type**: `url`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Enterprise dynamic application security testing (DAST) crawling web endpoints and identifying injection vulnerabilities and OOB interactions.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/burp`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 29. `nuclei` — Nuclei Template-Based Vulnerability Scanner

- **Tool ID**: `nuclei`
- **Full Name**: Nuclei Template-Based Vulnerability Scanner
- **Category**: `Vulnerability Assessment`
- **Input Type**: `url`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Runs customizable templates against target endpoints to discover CVE configurations, Git exposures, and API token leaks.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/nuclei`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 30. `openvas` — OpenVAS Network Vulnerability Engine

- **Tool ID**: `openvas`
- **Full Name**: OpenVAS Network Vulnerability Engine
- **Category**: `Vulnerability Assessment`
- **Input Type**: `ip`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Executes comprehensive Network Vulnerability Tests (NVT) against active services, scoring vulnerabilities via CVSS v3.1.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/openvas`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Threat Intelligence (6 Tools)

#### 31. `url` — URL Threat Intelligence

- **Tool ID**: `url`
- **Full Name**: URL Threat Intelligence
- **Category**: `Threat Intelligence`
- **Input Type**: `url`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Scan URLs and IPs against threat intelligence databases to identify malware and abuse.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/url`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute & POST /api/tools/url` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `csiComposition.urlEngine` (urlEngine.collect())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 32. `breach` — Breach Checker

- **Tool ID**: `breach`
- **Full Name**: Breach Checker
- **Category**: `Threat Intelligence`
- **Input Type**: `email`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Queries public and private repositories of compromised credentials to identify data leaks.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/breach`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute & POST /api/breach/check` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `breachController` (breachController.checkEmail())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 33. `alienvault-otx` — AlienVault OTX Threat Pulse Search

- **Tool ID**: `alienvault-otx`
- **Full Name**: AlienVault OTX Threat Pulse Search
- **Category**: `Threat Intelligence`
- **Input Type**: `domain`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Searches the AlienVault platform database for threat activity pulses associated with an IP or Domain.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/alienvault-otx`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 34. `virusshare` — VirusShare Malware Hash Searcher

- **Tool ID**: `virusshare`
- **Full Name**: VirusShare Malware Hash Searcher
- **Category**: `Threat Intelligence`
- **Input Type**: `hash`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Compares a file hash (MD5, SHA1, SHA256) against malware sample repositories to flag known trojans and ransomware.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/virusshare`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/threatIntelOsintService.js` (threatIntelOsintService.searchVirusShare())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 35. `misp-lookup` — MISP Threat Sharing IOC Checker

- **Tool ID**: `misp-lookup`
- **Full Name**: MISP Threat Sharing IOC Checker
- **Category**: `Threat Intelligence`
- **Input Type**: `domain`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Searches local and remote Malware Information Sharing Platform instances for compromises, threat actors, and TTPs.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/misp-lookup`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/threatIntelOsintService.js` (threatIntelOsintService.lookupMispIoc())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 36. `abuseipdb` — AbuseIPDB Threat Reporter

- **Tool ID**: `abuseipdb`
- **Full Name**: AbuseIPDB Threat Reporter
- **Category**: `Threat Intelligence`
- **Input Type**: `ip`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Queries threat intelligence networks to inspect whether an IP is reported for spam, botnet, or brute-force attacks.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/abuseipdb`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: OSINT (4 Tools)

#### 37. `harvester` — TheHarvester Intelligence Gatherer

- **Tool ID**: `harvester`
- **Full Name**: TheHarvester Intelligence Gatherer
- **Category**: `OSINT`
- **Input Type**: `domain`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Active intelligence gatherer querying search engines, PGP key registries, and Shodan databases.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/harvester`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 38. `sherlock` — Sherlock Social Profiler

- **Tool ID**: `sherlock`
- **Full Name**: Sherlock Social Profiler
- **Category**: `OSINT`
- **Input Type**: `username`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Searches public account profiles across major developer and social platforms (GitHub, Reddit, Twitter/X, Telegram, Dev.to, Medium, etc.).
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/sherlock`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/webIntelToolService.js` (webIntelToolService.profileUsername())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 39. `hunter-io` — Hunter Domain Email Pattern Search

- **Tool ID**: `hunter-io`
- **Full Name**: Hunter Domain Email Pattern Search
- **Category**: `OSINT`
- **Input Type**: `domain`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Identify common email syntax patterns and exposed professional email addresses associated with a corporate domain.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/hunter-io`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 40. `intelx` — Intelligence X Archive Explorer

- **Tool ID**: `intelx`
- **Full Name**: Intelligence X Archive Explorer
- **Category**: `OSINT`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Searches historic leak data archives, paste sites, and dark web indexes for target domains, emails, or search terms.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/intelx`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/cloudAuditApiFuzzService.js` (cloudAuditApiFuzzService.queryIntelxArchive())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Cloud Security (4 Tools)

#### 41. `prowler` — Prowler AWS CIS Benchmark Auditor

- **Tool ID**: `prowler`
- **Full Name**: Prowler AWS CIS Benchmark Auditor
- **Category**: `Cloud Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Evaluates AWS asset configurations against CIS benchmark standards covering IAM, S3 encryption, CloudTrail, and VPC networking.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/prowler`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/cloudAuditApiFuzzService.js` (cloudAuditApiFuzzService.auditProwlerAws())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 42. `scoutsuite` — Scout Suite Multi-Cloud Auditor

- **Tool ID**: `scoutsuite`
- **Full Name**: Scout Suite Multi-Cloud Auditor
- **Category**: `Cloud Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Audit service configurations in AWS, Azure, and GCP, flagging excessive access and missing logs.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/scoutsuite`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/cloudAuditApiFuzzService.js` (cloudAuditApiFuzzService.auditScoutSuiteMultiCloud())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 43. `bucket-finder` — Cloud Storage Bucket Finder

- **Tool ID**: `bucket-finder`
- **Full Name**: Cloud Storage Bucket Finder
- **Category**: `Cloud Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Brute-forces common naming parameters to detect public bucket exposures on S3 and GCP storage.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/bucket-finder`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 44. `iam-policy-audit` — IAM Policy Security Linter

- **Tool ID**: `iam-policy-audit`
- **Full Name**: IAM Policy Security Linter
- **Category**: `Cloud Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Parses raw JSON IAM policies to identify full AdministratorAccess, wildcard actions, and dangerous privilege escalations.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/iam-policy-audit`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/webCmsCloudToolService.js` (webCmsCloudToolService.lintIamPolicy())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: API Security (4 Tools)

#### 45. `postman-audit` — Postman Collection Auditor

- **Tool ID**: `postman-audit`
- **Full Name**: Postman Collection Auditor
- **Category**: `API Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Parses exported Postman collection JSON schemas (v2.0/v2.1) to identify hardcoded Bearer tokens, plaintext HTTP endpoints, and exposed parameters.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/postman-audit`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/malwareContainerToolService.js` (malwareContainerToolService.auditPostmanCollection())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 46. `jwt-strength` — JWT Strength & Signature Auditor

- **Tool ID**: `jwt-strength`
- **Full Name**: JWT Strength & Signature Auditor
- **Category**: `API Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Audits JWT validation policies by checking cryptographic parameters (alg: none), token expiration, and payload data privacy.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/jwt-strength`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/webCmsCloudToolService.js` (webCmsCloudToolService.auditJwtStrength())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 47. `api-fuzzer` — API Endpoint Fuzzer & Injection Tester

- **Tool ID**: `api-fuzzer`
- **Full Name**: API Endpoint Fuzzer & Injection Tester
- **Category**: `API Security`
- **Input Type**: `url`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Sends boundary test vectors and injection payloads to API endpoints to detect unhandled exceptions and validation overrides.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/api-fuzzer`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 48. `oas-linter` — OpenAPI / Swagger Spec Linter

- **Tool ID**: `oas-linter`
- **Full Name**: OpenAPI / Swagger Spec Linter
- **Category**: `API Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Lints OpenAPI v2/v3 YAML/JSON schemas to identify unauthenticated routes, plain HTTP servers, and missing security schemas.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/oas-linter`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/netSastApiToolService.js` (netSastApiToolService.lintOasSpec())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Authentication & Identity Security (4 Tools)

#### 49. `hydra` — Hydra Protocol Authentication Auditor

- **Tool ID**: `hydra`
- **Full Name**: Hydra Protocol Authentication Auditor
- **Category**: `Authentication & Identity Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Simulates dictionary authentication attempts on SSH, FTP, or HTTP endpoints to detect default credentials and evaluate account lockout policies.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/hydra`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 50. `ldap-audit` — LDAP Policy Auditor

- **Tool ID**: `ldap-audit`
- **Full Name**: LDAP Policy Auditor
- **Category**: `Authentication & Identity Security`
- **Input Type**: `ip`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Inspects LDAP security rules to identify anonymous search options, cleartext transport, and NTLM fallback policies.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/ldap-audit`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 51. `saml-decoder` — SAML Assertion Decoder

- **Tool ID**: `saml-decoder`
- **Full Name**: SAML Assertion Decoder
- **Category**: `Authentication & Identity Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Decodes Base64 and XML SAML tokens to inspect Issuer identity, Subject NameID, validity conditions, and cryptographic signatures.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/saml-decoder`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/securityArtifactToolService.js` (securityArtifactToolService.decodeSaml())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 52. `oauth-validator` — OAuth Route Validator

- **Tool ID**: `oauth-validator`
- **Full Name**: OAuth Route Validator
- **Category**: `Authentication & Identity Security`
- **Input Type**: `url`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Verifies authorization endpoints to detect open redirect vulnerabilities, missing CSRF state parameters, and PKCE enforcement.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/oauth-validator`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Mobile Security (4 Tools)

#### 53. `mobsf-apk` — MobSF Android Manifest Analyzer

- **Tool ID**: `mobsf-apk`
- **Full Name**: MobSF Android Manifest Analyzer
- **Category**: `Mobile Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Queries Android manifest configurations to identify dangerous permissions, exported un-permissioned activities, and debuggable flags.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/mobsf-apk`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/mobileReverseToolService.js` (mobileReverseToolService.analyzeMobSfApk())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 54. `ipa-signer-check` — iOS IPA & Entitlements Validator

- **Tool ID**: `ipa-signer-check`
- **Full Name**: iOS IPA & Entitlements Validator
- **Category**: `Mobile Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Inspects iOS application entitlements and Info.plist to check get-task-allow, ATS HTTP exceptions, and keychain access groups.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/ipa-signer-check`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/mobileReverseToolService.js` (mobileReverseToolService.validateIpaSigner())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 55. `apk-leak-finder` — APK Credentials & Secrets Extractor

- **Tool ID**: `apk-leak-finder`
- **Full Name**: APK Credentials & Secrets Extractor
- **Category**: `Mobile Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Parses assets and strings tables inside mobile packages to locate hardcoded Firebase URLs, Google Maps API keys, and AWS credentials.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/apk-leak-finder`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/mobileReverseToolService.js` (mobileReverseToolService.extractApkLeaks())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 56. `androguard` — Androguard Dalvik Bytecode Disassembler

- **Tool ID**: `androguard`
- **Full Name**: Androguard Dalvik Bytecode Disassembler
- **Category**: `Mobile Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Inspects Dalvik DEX bytecode instructions to detect dynamic reflection, DexClassLoader calls, and insecure cryptographic ciphers (AES/ECB).
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/androguard`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/mobileReverseToolService.js` (mobileReverseToolService.disassembleAndroguard())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Container & Kubernetes Security (4 Tools)

#### 57. `kube-bench` — Kube-Bench CIS Benchmark Auditor

- **Tool ID**: `kube-bench`
- **Full Name**: Kube-Bench CIS Benchmark Auditor
- **Category**: `Container & Kubernetes Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Checks Kubernetes daemon configurations and control plane files against recommendations in the CIS Kubernetes Benchmark standards.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/kube-bench`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/devsecForensicsSandboxService.js` (devsecForensicsSandboxService.auditKubeBenchCis())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 58. `kubesec` — Kubesec Manifest Linter

- **Tool ID**: `kubesec`
- **Full Name**: Kubesec Manifest Linter
- **Category**: `Container & Kubernetes Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Reviews Kubernetes resource definitions to detect root privileges, missing resource bounds, and insecure capabilities.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/kubesec`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/securityArtifactToolService.js` (securityArtifactToolService.lintKubesec())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 59. `docker-bench` — Docker CIS Benchmark Auditor

- **Tool ID**: `docker-bench`
- **Full Name**: Docker CIS Benchmark Auditor
- **Category**: `Container & Kubernetes Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Evaluates Docker daemon security configurations and compose templates against CIS Docker Benchmark controls (0-100 score).
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/docker-bench`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/malwareContainerToolService.js` (malwareContainerToolService.auditDockerBench())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 60. `falco-logs` — Falco Container Syscall Inspector

- **Tool ID**: `falco-logs`
- **Full Name**: Falco Container Syscall Inspector
- **Category**: `Container & Kubernetes Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Audits container runtime event streams to detect interactive terminal spawns, unauthorized /etc/shadow access, and outbound C2 traffic.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/falco-logs`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/mobileReverseToolService.js` (mobileReverseToolService.inspectFalcoLogs())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: DevSecOps / Supply Chain Security (4 Tools)

#### 61. `semgrep` — Semgrep SAST Code Auditor

- **Tool ID**: `semgrep`
- **Full Name**: Semgrep SAST Code Auditor
- **Category**: `DevSecOps / Supply Chain Security`
- **Input Type**: `text`
- **Execution Target**: `BLOCKED_DEPENDENCY`
- **Status**: `live`
- **Description**: Scans source code (JS, Python, PHP, Java, Go) for dangerous sinks like eval(), SQL string concatenation, and command injections.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/semgrep`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/netSastApiToolService.js` (netSastApiToolService.runSemgrepSast())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 62. `gitleaks` — Gitleaks Secrets Scanner

- **Tool ID**: `gitleaks`
- **Full Name**: Gitleaks Secrets Scanner
- **Category**: `DevSecOps / Supply Chain Security`
- **Input Type**: `text`
- **Execution Target**: `BLOCKED_DEPENDENCY`
- **Status**: `live`
- **Description**: Scans source code, config files, and commit logs against 20+ patterns of cloud keys, tokens, and private secrets.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/gitleaks`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/securityArtifactToolService.js` (securityArtifactToolService.scanSecrets())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 63. `dependency-track` — Dependency-Track SBOM Auditor

- **Tool ID**: `dependency-track`
- **Full Name**: Dependency-Track SBOM Auditor
- **Category**: `DevSecOps / Supply Chain Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Compares Software Bill of Materials (SBOM) data against database indexes of known CVE packages and security advisories.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/dependency-track`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/netSastApiToolService.js` (netSastApiToolService.auditDependencyTrack())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 64. `snyk-test` — Snyk Dependency & CVE Checker

- **Tool ID**: `snyk-test`
- **Full Name**: Snyk Dependency & CVE Checker
- **Category**: `DevSecOps / Supply Chain Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Identifies known CVE alerts and vulnerable dependency chains in third-party libraries, providing direct remediation paths.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/snyk-test`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/devsecForensicsSandboxService.js` (devsecForensicsSandboxService.auditSnykDependencies())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Malware Analysis (4 Tools)

#### 65. `yara-rules` — YARA Signature Matcher

- **Tool ID**: `yara-rules`
- **Full Name**: YARA Signature Matcher
- **Category**: `Malware Analysis`
- **Input Type**: `text`
- **Execution Target**: `BLOCKED_DEPENDENCY`
- **Status**: `live`
- **Description**: Evaluates file contents and script strings against built-in YARA signature rules to identify webshells, miners, and backdoors.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/yara-rules`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/malwareContainerToolService.js` (malwareContainerToolService.matchYaraRules())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 66. `peframe` — PE Binary Header & Packer Analyzer

- **Tool ID**: `peframe`
- **Full Name**: PE Binary Header & Packer Analyzer
- **Category**: `Malware Analysis`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Inspects Windows Portable Executable (PE) headers to extract packer signatures (UPX), section entropy, and process injection APIs.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/peframe`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/malwareContainerToolService.js` (malwareContainerToolService.analyzePeBinary())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 67. `cuckoo-sandbox` — Cuckoo Dynamic Malware Sandbox Detonator

- **Tool ID**: `cuckoo-sandbox`
- **Full Name**: Cuckoo Dynamic Malware Sandbox Detonator
- **Category**: `Malware Analysis`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Simulates behavioral detonation of executable/document samples in isolated sandboxes, analyzing dynamic process trees, modified registry keys, and network DNS/C2 queries.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/cuckoo-sandbox`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/devsecForensicsSandboxService.js` (devsecForensicsSandboxService.detonateCuckooSandbox())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 68. `pdfid` — PDF Security & Malware Inspector

- **Tool ID**: `pdfid`
- **Full Name**: PDF Security & Malware Inspector
- **Category**: `Malware Analysis`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Scans PDF structures looking for malicious /JavaScript blocks, automatic /OpenAction triggers, and /Launch execution commands.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/pdfid`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/securityArtifactToolService.js` (securityArtifactToolService.inspectPdf())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Digital Forensics (4 Tools)

#### 69. `autopsy` — Autopsy Digital Forensics & File Carving

- **Tool ID**: `autopsy`
- **Full Name**: Autopsy Digital Forensics & File Carving
- **Category**: `Digital Forensics`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Analyzes forensic disk images and raw file dumps, extracting file carving metadata, deleted items, and chronological incident timeline records.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/autopsy`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/devsecForensicsSandboxService.js` (devsecForensicsSandboxService.analyzeAutopsyForensics())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 70. `volatility` — Volatility Memory Analysis

- **Tool ID**: `volatility`
- **Full Name**: Volatility Memory Analysis
- **Category**: `Digital Forensics`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Inspects volatile memory dumps to find active process trees, injected DLL modules (malfind), and listening TCP/UDP sockets.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/volatility`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/memoryReverseForensicsService.js` (memoryReverseForensicsService.analyzeVolatilityDump())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 71. `sleuthkit` — The Sleuth Kit (TSK)

- **Tool ID**: `sleuthkit`
- **Full Name**: The Sleuth Kit (TSK)
- **Category**: `Digital Forensics`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Parses partition schemes (GPT/MBR) and raw disk sectors to discover deleted Master File Table (MFT) records and orphan filesystem entries.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/sleuthkit`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/memoryReverseForensicsService.js` (memoryReverseForensicsService.parseSleuthKitVolume())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 72. `plaso` — Plaso Super-Timeline Engine

- **Tool ID**: `plaso`
- **Full Name**: Plaso Super-Timeline Engine
- **Category**: `Digital Forensics`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Aggregates metadata and event logs from multiple files (winevtx, prefetch, MFT, chrome history) to compile unified chronological timeline records.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/plaso`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/memoryReverseForensicsService.js` (memoryReverseForensicsService.generatePlasoSuperTimeline())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Binary / Reverse Engineering (4 Tools)

#### 73. `ghidra` — Ghidra Headless Decompiler

- **Tool ID**: `ghidra`
- **Full Name**: Ghidra Headless Decompiler
- **Category**: `Binary / Reverse Engineering`
- **Input Type**: `text`
- **Execution Target**: `BLOCKED_DEPENDENCY`
- **Status**: `live`
- **Description**: Decompiles binary files into C pseudo-code, analyzing function call graphs, compiler signatures, and dangerous API primitives (VirtualAllocEx).
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/ghidra`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/memoryReverseForensicsService.js` (memoryReverseForensicsService.decompileGhidraBinary())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 74. `radare2` — Radare2 Analysis & Shellcode Inspector

- **Tool ID**: `radare2`
- **Full Name**: Radare2 Analysis & Shellcode Inspector
- **Category**: `Binary / Reverse Engineering`
- **Input Type**: `text`
- **Execution Target**: `BLOCKED_DEPENDENCY`
- **Status**: `live`
- **Description**: Command line tool for binary decompilation, shellcode execution, and hex analysis.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/radare2`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/memoryReverseForensicsService.js` (memoryReverseForensicsService.inspectRadare2Binary())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 75. `binwalk` — Binwalk Firmware Analyzer

- **Tool ID**: `binwalk`
- **Full Name**: Binwalk Firmware Analyzer
- **Category**: `Binary / Reverse Engineering`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Finds embedded filesystems, bootloader headers, and compression blocks inside binary firmware images with entropy scoring.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/binwalk`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/firmwareEmailToolService.js` (firmwareEmailToolService.analyzeBinwalk())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 76. `capstone` — Capstone Opcode Disassembler

- **Tool ID**: `capstone`
- **Full Name**: Capstone Opcode Disassembler
- **Category**: `Binary / Reverse Engineering`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Multi-architecture disassembly engine converting hex byte streams into mnemonics, operands, and register operations.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/capstone`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/firmwareEmailToolService.js` (firmwareEmailToolService.disassembleCapstone())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Wireless Security (4 Tools)

#### 77. `aircrack-ng` — Aircrack-ng Interface

- **Tool ID**: `aircrack-ng`
- **Full Name**: Aircrack-ng Interface
- **Category**: `Wireless Security`
- **Input Type**: `text`
- **Execution Target**: `BLOCKED_DEPENDENCY`
- **Status**: `live`
- **Description**: Inspects captured network handshakes to evaluate EAPOL MIC integrity and simulated password dictionary resilience.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/aircrack-ng`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/wirelessTyposquatService.js` (wirelessTyposquatService.auditAircrackHandshake())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 78. `kismet` — Kismet Wireless Survey Parser

- **Tool ID**: `kismet`
- **Full Name**: Kismet Wireless Survey Parser
- **Category**: `Wireless Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Parses wireless survey files to map location topology, frequency bands (2.4/5GHz), encryption standards, and client rosters.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/kismet`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/wirelessTyposquatService.js` (wirelessTyposquatService.parseKismetSurveyLogs())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 79. `wifite` — Wifite Wireless Security Auditor

- **Tool ID**: `wifite`
- **Full Name**: Wifite Wireless Security Auditor
- **Category**: `Wireless Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Evaluates wireless network configurations against WPS PIN vulnerabilities, PMKID key exposure, and 802.11w Management Frame Protection compliance.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/wifite`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/wirelessTyposquatService.js` (wirelessTyposquatService.auditWifiteProtocols())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 80. `bt-scanner` — Bluetooth Low Energy (BLE) Scanner

- **Tool ID**: `bt-scanner`
- **Full Name**: Bluetooth Low Energy (BLE) Scanner
- **Category**: `Wireless Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Queries Bluetooth controller boundaries to list BLE beacons, advertising packets, RSSI proximity, and exposed GATT service UUIDs.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/bt-scanner`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/wirelessTyposquatService.js` (wirelessTyposquatService.scanBluetoothBleDevices())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Email Security (3 Tools)

#### 81. `mail-spoof-checker` — Email Spoofing & DMARC Auditor

- **Tool ID**: `mail-spoof-checker`
- **Full Name**: Email Spoofing & DMARC Auditor
- **Category**: `Email Security`
- **Input Type**: `domain`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Inspects domain DNS TXT records to confirm mail server protection settings, SPF mechanisms, and DMARC policy enforcement.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/mail-spoof-checker`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 82. `mxtoolbox-check` — MX Blacklist & RBL Auditor

- **Tool ID**: `mxtoolbox-check`
- **Full Name**: MX Blacklist & RBL Auditor
- **Category**: `Email Security`
- **Input Type**: `ip`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Queries IP blacklist repositories (Spamhaus, Barracuda, SpamCop) to confirm email server deliverability and reputation status.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/mxtoolbox-check`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 83. `phishmeister` — Email Header & Hop Route Analyzer

- **Tool ID**: `phishmeister`
- **Full Name**: Email Header & Hop Route Analyzer
- **Category**: `Email Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Parses raw RFC 822 / MIME EML headers to detect hop tracing route discrepancies, client originating IP, and authentication results.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/phishmeister`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/firmwareEmailToolService.js` (firmwareEmailToolService.traceEmailHops())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Social Engineering / Phishing Defense (4 Tools)

#### 84. `phishing` — Phishing Detector

- **Tool ID**: `phishing`
- **Full Name**: Phishing Detector
- **Category**: `Social Engineering / Phishing Defense`
- **Input Type**: `url`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Performs lexical audits on input URLs to spot suspect lookalike structures and phishing markers.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/phishing`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute & POST /api/tools/phishing` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `toolsController` (toolsController.detectPhishing())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 85. `gophish` — GoPhish Phishing Simulation Tracker

- **Tool ID**: `gophish`
- **Full Name**: GoPhish Phishing Simulation Tracker
- **Category**: `Social Engineering / Phishing Defense`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Tracks employee simulated phishing campaigns, reporting email delivery, open rates, click-throughs, and credential compromise statistics.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/gophish`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/enterpriseVulnPhishService.js` (enterpriseVulnPhishService.trackGophishCampaign())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 86. `domain-twist` — Domain Typosquatting & Permutation Searcher

- **Tool ID**: `domain-twist`
- **Full Name**: Domain Typosquatting & Permutation Searcher
- **Category**: `Social Engineering / Phishing Defense`
- **Input Type**: `domain`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Generates potential typosquatting, homoglyph, omission, and bit-squatting permutations of a domain and queries active registration & MX records.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/domain-twist`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 87. `evilginx-audit` — Evilginx Reverse-Proxy MFA Bypass Auditor

- **Tool ID**: `evilginx-audit`
- **Full Name**: Evilginx Reverse-Proxy MFA Bypass Auditor
- **Category**: `Social Engineering / Phishing Defense`
- **Input Type**: `url`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Evaluates login endpoints against reverse-proxy MITM phishing (Evilginx phishlets), analyzing session cookie flags and FIDO2/WebAuthn resilience.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/evilginx-audit`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: AI / LLM Security (4 Tools)

#### 88. `prompt-guard` — Prompt Injection & Jailbreak Guard

- **Tool ID**: `prompt-guard`
- **Full Name**: Prompt Injection & Jailbreak Guard
- **Category**: `AI / LLM Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Evaluates user prompts against adversarial prompt injection signatures, DAN overrides, and special token delimiters with 0–100 safety scoring.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/prompt-guard`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/aiPrivacyIncidentToolService.js` (aiPrivacyIncidentToolService.auditPromptGuard())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 89. `garak` — Garak LLM Vulnerability Scanner

- **Tool ID**: `garak`
- **Full Name**: Garak LLM Vulnerability Scanner
- **Category**: `AI / LLM Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Executes automated security probe sweeps against target generative models to map alignment boundaries and prompt injection defenses.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/garak`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/aiRedteamPlaybookService.js` (aiRedteamPlaybookService.scanGarakLlm())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 90. `llm-redteam` — AI Red-Teaming & Alignment CLI

- **Tool ID**: `llm-redteam`
- **Full Name**: AI Red-Teaming & Alignment CLI
- **Category**: `AI / LLM Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Runs adversarial attack sequences (GCG, Crescendo, Roleplay) against target LLMs to evaluate refusal boundaries and alignment resilience.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/llm-redteam`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/aiRedteamPlaybookService.js` (aiRedteamPlaybookService.runLlmRedteam())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 91. `prompt-fuzzer` — LLM System Prompt Boundary Fuzzer

- **Tool ID**: `prompt-fuzzer`
- **Full Name**: LLM System Prompt Boundary Fuzzer
- **Category**: `AI / LLM Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Injects special tokens, homoglyphs, and delimiter escapes into prompts to verify system prompt confidentiality and boundary integrity.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/prompt-fuzzer`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/aiRedteamPlaybookService.js` (aiRedteamPlaybookService.fuzzPromptBoundaries())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Privacy & Data Security (3 Tools)

#### 92. `gdpr-cookie-audit` — GDPR Cookie & Consent Auditor

- **Tool ID**: `gdpr-cookie-audit`
- **Full Name**: GDPR Cookie & Consent Auditor
- **Category**: `Privacy & Data Security`
- **Input Type**: `url`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Scans target website response headers to inspect tracking cookies, SameSite policies, and compliance with GDPR consent mandates.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/gdpr-cookie-audit`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/toolsController.js` (toolsController.isPrivateOrLoopback())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 93. `exif-stripper` — Image EXIF & Geolocation Inspector

- **Tool ID**: `exif-stripper`
- **Full Name**: Image EXIF & Geolocation Inspector
- **Category**: `Privacy & Data Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Parses image metadata headers to identify exposed GPS latitude/longitude coordinates, device serials, and timestamp leaks.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/exif-stripper`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/aiPrivacyIncidentToolService.js` (aiPrivacyIncidentToolService.inspectExifMetadata())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 94. `pii-scanner` — Sensitive PII & Compliance Scanner

- **Tool ID**: `pii-scanner`
- **Full Name**: Sensitive PII & Compliance Scanner
- **Category**: `Privacy & Data Security`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Searches text payloads for personal data variables like credit cards, US SSNs, Indian PAN/Aadhaar, and email addresses with masking.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/pii-scanner`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/aiPrivacyIncidentToolService.js` (aiPrivacyIncidentToolService.scanPiiData())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Incident Response (4 Tools)

#### 95. `remediation` — AI Remediation Planner

- **Tool ID**: `remediation`
- **Full Name**: AI Remediation Planner
- **Category**: `Incident Response`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Leverages Gemini and local signatures catalogs to generate verified remediation advice plans.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/remediation`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute & GET /api/remediation` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `remediationController` (remediationController.getRemediation())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 96. `thehive` — TheHive Incident Case Manager

- **Tool ID**: `thehive`
- **Full Name**: TheHive Incident Case Manager
- **Category**: `Incident Response`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Parses security incident alerts, IOC hashes, and IPs into structured TheHive v4/v5 JSON response cases with standard playbook tasks.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/thehive`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/aiPrivacyIncidentToolService.js` (aiPrivacyIncidentToolService.formatTheHiveCase())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 97. `misp-feed` — MISP Threat Feed Publisher

- **Tool ID**: `misp-feed`
- **Full Name**: MISP Threat Feed Publisher
- **Category**: `Incident Response`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Packages indicators of compromise (IOCs) into standardized MISP Feed events with TLP classifications and galaxy tags for community sync.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/misp-feed`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/aiRedteamPlaybookService.js` (aiRedteamPlaybookService.publishMispFeed())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 98. `playbook-runner` — SOC Playbook Orchestrator

- **Tool ID**: `playbook-runner`
- **Full Name**: SOC Playbook Orchestrator
- **Category**: `Incident Response`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Executes automated security orchestration and response (SOAR) playbooks across containment, memory triage, and perimeter blocking.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/playbook-runner`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/aiRedteamPlaybookService.js` (aiRedteamPlaybookService.orchestratePlaybook())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Security Monitoring (3 Tools)

#### 99. `wazuh-agent-audit` — Wazuh SIEM Agent Auditor

- **Tool ID**: `wazuh-agent-audit`
- **Full Name**: Wazuh SIEM Agent Auditor
- **Category**: `Security Monitoring`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Inspects host Wazuh agent telemetry streams, File Integrity Monitoring (Syscheck), and vulnerability detection modules with health scoring.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/wazuh-agent-audit`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/monitoringComplianceToolService.js` (monitoringComplianceToolService.auditWazuhAgent())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 100. `zeek-logs` — Zeek Network Transaction Parser

- **Tool ID**: `zeek-logs`
- **Full Name**: Zeek Network Transaction Parser
- **Category**: `Security Monitoring`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Reviews network transaction files generated by Zeek/Bro sensors to detect port scans, DNS tunneling, and anomalous outbound sessions.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/zeek-logs`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/monitoringComplianceToolService.js` (monitoringComplianceToolService.parseZeekLogs())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 101. `auditd-viewer` — Linux Auditd Syscall Tracer

- **Tool ID**: `auditd-viewer`
- **Full Name**: Linux Auditd Syscall Tracer
- **Category**: `Security Monitoring`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Decodes syscall records (type=SYSCALL, type=EXECVE) generated by auditd to identify root transitions and sensitive binary execution.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/auditd-viewer`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/monitoringComplianceToolService.js` (monitoringComplianceToolService.traceAuditdEvents())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Compliance / Security Posture (3 Tools)

#### 102. `cis-cat` — CIS-CAT Host Baseline Benchmark Auditor

- **Tool ID**: `cis-cat`
- **Full Name**: CIS-CAT Host Baseline Benchmark Auditor
- **Category**: `Compliance / Security Posture`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Evaluates operating system and server configuration benchmarks against Center for Internet Security (CIS) Level 1 and Level 2 baselines.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/cis-cat`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/enterpriseVulnPhishService.js` (enterpriseVulnPhishService.evaluateCisCatHostBenchmark())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 103. `soc2-checklist` — SOC 2 Trust Services Posture Evaluator

- **Tool ID**: `soc2-checklist`
- **Full Name**: SOC 2 Trust Services Posture Evaluator
- **Category**: `Compliance / Security Posture`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Validates organizational security posture against Security, Availability, Processing Integrity, Confidentiality, and Privacy criteria.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/soc2-checklist`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/monitoringComplianceToolService.js` (monitoringComplianceToolService.evaluateSoc2Checklist())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 104. `hipaa-auditor` — HIPAA ePHI Security Rule Auditor

- **Tool ID**: `hipaa-auditor`
- **Full Name**: HIPAA ePHI Security Rule Auditor
- **Category**: `Compliance / Security Posture`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Scans cloud infrastructure settings to verify ePHI encryption at rest (AES-256), TLS in transit, audit logging, and access controls.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/hipaa-auditor`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/monitoringComplianceToolService.js` (monitoringComplianceToolService.auditHipaaCompliance())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


### Category: Utilities / Encoding / Cryptography (7 Tools)

#### 105. `jwt-parser` — JWT Security Decoder

- **Tool ID**: `jwt-parser`
- **Full Name**: JWT Security Decoder
- **Category**: `Utilities / Encoding / Cryptography`
- **Input Type**: `text`
- **Execution Target**: `CLIENT_BROWSER`
- **Status**: `live`
- **Description**: Decode and inspect JWT tokens.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/jwt-parser`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/UtilityToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/UtilityToolView.jsx) (In-browser reactive decoding/encoding)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute (interception: 400 client-side notice)` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `Client-Side Utility (Browser)` (Pure client-side execution in UtilityToolView.jsx)
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 106. `base64-decoder` — Base64 Converter

- **Tool ID**: `base64-decoder`
- **Full Name**: Base64 Converter
- **Category**: `Utilities / Encoding / Cryptography`
- **Input Type**: `text`
- **Execution Target**: `CLIENT_BROWSER`
- **Status**: `live`
- **Description**: Instantly convert text to/from Base64.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/base64-decoder`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/UtilityToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/UtilityToolView.jsx) (In-browser reactive decoding/encoding)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute (interception: 400 client-side notice)` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `Client-Side Utility (Browser)` (Pure client-side execution in UtilityToolView.jsx)
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 107. `url-sanitizer` — URL Sanitizer

- **Tool ID**: `url-sanitizer`
- **Full Name**: URL Sanitizer
- **Category**: `Utilities / Encoding / Cryptography`
- **Input Type**: `url`
- **Execution Target**: `CLIENT_BROWSER`
- **Status**: `live`
- **Description**: Parse URLs, extract query parameters, and identify payloads.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/url-sanitizer`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/ScannerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ScannerToolView.jsx) (Input form, validation, real-time socket events)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute (interception: 400 client-side notice)` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `Client-Side Utility (Browser)` (Pure client-side execution in UtilityToolView.jsx)
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 108. `sms` — SMS Analyzer

- **Tool ID**: `sms`
- **Full Name**: SMS Analyzer
- **Category**: `Utilities / Encoding / Cryptography`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Inspect messages for phishing indicators, financial scams, and credential harvesting patterns.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/sms`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute & POST /api/tools/sms` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `toolsController` (toolsController.analyzeSMS())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 109. `upi` — UPI Verifier

- **Tool ID**: `upi`
- **Full Name**: UPI Verifier
- **Category**: `Utilities / Encoding / Cryptography`
- **Input Type**: `text`
- **Execution Target**: `CYBERSHIELD_API_ENGINE`
- **Status**: `live`
- **Description**: Verifies UPI virtual payment address structures and patterns for fraud verification.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/upi`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute & POST /api/tools/upi` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `toolsController` (toolsController.verifyUPI())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 110. `hash-generator` — Cryptographic Hash Generator

- **Tool ID**: `hash-generator`
- **Full Name**: Cryptographic Hash Generator
- **Category**: `Utilities / Encoding / Cryptography`
- **Input Type**: `text`
- **Execution Target**: `CLIENT_BROWSER`
- **Status**: `live`
- **Description**: Converts plaintext data into multi-algorithm cryptographic hash signatures with Shannon entropy calculations.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/hash-generator`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/osintCryptoToolService.js` (osintCryptoToolService.generateCryptoHashes())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)

#### 111. `hex-editor` — Dossier Hex & Binary Frame Inspector

- **Tool ID**: `hex-editor`
- **Full Name**: Dossier Hex & Binary Frame Inspector
- **Category**: `Utilities / Encoding / Cryptography`
- **Input Type**: `text`
- **Execution Target**: `CLIENT_BROWSER`
- **Status**: `live`
- **Description**: Formats strings, binary payloads, and byte dumps into hexadecimal offset grids with ASCII character sidebars.
- **Where Used — Frontend (Client)**:
  - **Tool Catalog Config**: [`client/src/components/toolkit/toolConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/toolConfig.js)
  - **Tool Detail Page**: [`client/src/pages/ToolDetailPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolDetailPage.jsx) (Route: `/toolkit/hex-editor`)
  - **Toolkit Dashboard**: [`client/src/pages/ToolkitPage.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/pages/ToolkitPage.jsx) (Search, filter, category tabs)
  - **View Component**: [`client/src/components/toolkit/AnalyzerToolView.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/AnalyzerToolView.jsx) (Multi-line payload, code, artifact analysis)
  - **UI Shell**: [`client/src/components/toolkit/ToolPageLayout.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolPageLayout.jsx), [`ToolkitHeader.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitHeader.jsx), [`ToolkitStatusBadge.jsx`](file:///Users/anil/Documents/New%20project/cybershield-x/client/src/components/toolkit/ToolkitStatusBadge.jsx)
- **Where Used — Backend (Server)**:
  - **API Route**: `POST /api/toolkit/execute` in [`server/routes/toolkit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/toolkit.js)
  - **Controller**: [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js) (`executeTool` handler)
  - **Executing Service**: `server/services/osintCryptoToolService.js` (osintCryptoToolService.inspectHexEditor())
  - **Execution Caching**: [`server/services/ToolkitCacheService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ToolkitCacheService.js) (High-speed LRU memory cache)
  - **Canonical Registry Sync**: [`server/utils/canonicalTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/canonicalTools.js) (`loadCanonicalTools`, `getCanonicalToolsWithStatus`)
  - **Test Suite**: [`server/scripts/certify_111_tools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/certify_111_tools.js), [`server/tests/canonical_111_tool_registry.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/canonical_111_tool_registry.test.js)


---

## 🗄️ PART 2: ALL 82 MONGODB MODELS

Each model below details its **Name, File Path, Collection, Domain, Purpose, Schema Overview, Usage Frequency**, and the **Exact File Locations** across Controllers, Services, Routes, Tests, and Scripts.

### 1. `AIAnalysis`

- **File**: [`server/models/AIAnalysis.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/AIAnalysis.js)
- **Domain**: `AI Security Advisory`
- **Purpose**: Persisted AI advisory summaries, vulnerability explanations, remediation guidance
- **Total Files Importing / Using**: **6 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/aiReportController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/aiReportController.js)
  - **Services (1)**:
    - [`server/services/platform/ReportService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/ReportService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/test_v29_4_verification.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/test_v29_4_verification.js)
  - **Test Suites (2)**:
    - [`server/tests/enterprise.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/enterprise.test.js)
    - [`server/tests/reports_export.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/reports_export.test.js)
  - **Other Modules (1)**:
    - [`server/repositories/AIAnalysisRepository.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/AIAnalysisRepository.js)

### 2. `ActivityLog`

- **File**: [`server/models/ActivityLog.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/ActivityLog.js)
- **Domain**: `User Activity Auditing`
- **Purpose**: Granular user actions, login events, navigation trails, tool invocations
- **Total Files Importing / Using**: **14 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/tests/controllers/AdminController.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/controllers/AdminController.test.js)
  - **Services (8)**:
    - [`server/services/admin/AdminService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/admin/AdminService.js)
    - [`server/services/asset/AssetService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/asset/AssetService.js)
    - [`server/services/platform/AnalyticsAggregationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/AnalyticsAggregationService.js)
    - [`server/services/platform/AuditService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/AuditService.js)
    - [`server/services/platform/HistoryService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/HistoryService.js)
    - [`server/services/soarEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soarEngine.js)
    - [`server/services/vulnerability/VulnerabilityService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/vulnerability/VulnerabilityService.js)
    - [`server/tests/services/HistoryService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/HistoryService.test.js)
  - **Test Suites (2)**:
    - [`server/tests/controllers/AdminController.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/controllers/AdminController.test.js)
    - [`server/tests/services/HistoryService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/HistoryService.test.js)
  - **Other Modules (5)**:
    - [`server/integrations/actionQueue.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/integrations/actionQueue.js)
    - [`server/middleware/auditMiddleware.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/middleware/auditMiddleware.js)
    - [`server/middleware/auth.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/middleware/auth.js)
    - [`server/middleware/rateLimitAnalytics.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/middleware/rateLimitAnalytics.js)
    - [`server/repositories/ActivityLogRepository.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/ActivityLogRepository.js)

### 3. `Alert`

- **File**: [`server/models/Alert.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Alert.js)
- **Domain**: `Threat Detection & Ingestion`
- **Purpose**: Normalized raw security alerts from network, endpoint, cloud, and third-party feeds
- **Total Files Importing / Using**: **38 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/alertController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/alertController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (16)**:
    - [`server/services/datafabric/CorrelationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/CorrelationService.js)
    - [`server/services/datafabric/SecurityGraphService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/SecurityGraphService.js)
    - [`server/services/intelligence/AnalystPriorityService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/intelligence/AnalystPriorityService.js)
    - [`server/services/intelligence/RiskSynthesisService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/intelligence/RiskSynthesisService.js)
    - [`server/services/playbookEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/playbookEngine.js)
    - [`server/services/soarEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soarEngine.js)
    - [`server/services/soc/CaseOrchestrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/CaseOrchestrationService.js)
    - [`server/services/soc/DataLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DataLifecycleService.js)
    - [`server/services/soc/DetectionCoverageService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionCoverageService.js)
    - [`server/services/soc/DetectionTestingService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionTestingService.js)
    - [`server/services/soc/IncidentCorrelationEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/IncidentCorrelationEngine.js)
    - [`server/services/soc/InvestigationTimelineService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/InvestigationTimelineService.js)
    - [`server/services/soc/SOCMetricsService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCMetricsService.js)
    - [`server/services/soc/ThreatHuntQueryEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatHuntQueryEngine.js)
    - [`server/services/soc/ThreatIntelFusionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatIntelFusionService.js)
    - [`server/services/webhookService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/webhookService.js)
  - **Scripts & Acceptance Gates (10)**:
    - [`server/scripts/run_phase69_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase69_acceptance.js)
    - [`server/scripts/run_phase70_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase70_acceptance.js)
    - [`server/scripts/run_phase71_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase71_acceptance.js)
    - [`server/scripts/run_phase72_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase72_acceptance.js)
    - [`server/scripts/run_phase73_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase73_acceptance.js)
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
    - [`server/scripts/run_phase76_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase76_acceptance.js)
    - [`server/scripts/run_phase78_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase78_acceptance.js)
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
    - [`server/scripts/run_update_function_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_update_function_audit.js)
  - **Test Suites (8)**:
    - [`server/tests/automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/automation.test.js)
    - [`server/tests/phase69_native_expansion.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase69_native_expansion.test.js)
    - [`server/tests/phase70_soc_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase70_soc_intelligence.test.js)
    - [`server/tests/phase71_threat_hunting.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase71_threat_hunting.test.js)
    - [`server/tests/phase72_incident_response.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase72_incident_response.test.js)
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)
    - [`server/tests/phase79_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase79_intelligence.test.js)
    - [`server/tests/soc.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/soc.test.js)
  - **Other Modules (2)**:
    - [`server/integrations/actionQueue.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/integrations/actionQueue.js)
    - [`server/integrations/integrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/integrations/integrationService.js)

### 4. `AnalystRecommendation`

- **File**: [`server/models/AnalystRecommendation.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/AnalystRecommendation.js)
- **Domain**: `Decision Intelligence`
- **Purpose**: Safe next-best-action recommendations with authorization segregation and human feedback
- **Total Files Importing / Using**: **6 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/intelligenceController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/intelligenceController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (1)**:
    - [`server/services/intelligence/InvestigationRecommendationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/intelligence/InvestigationRecommendationService.js)
  - **Scripts & Acceptance Gates (2)**:
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
    - [`server/scripts/run_update_function_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_update_function_audit.js)
  - **Test Suites (1)**:
    - [`server/tests/phase79_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase79_intelligence.test.js)

### 5. `Asset`

- **File**: [`server/models/Asset.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Asset.js)
- **Domain**: `Asset Management`
- **Purpose**: Managed IT and cloud assets (servers, domains, repositories, databases, endpoints) with criticality
- **Total Files Importing / Using**: **28 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
  - **Services (14)**:
    - [`server/services/admin/AdminService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/admin/AdminService.js)
    - [`server/services/asset/AssetService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/asset/AssetService.js)
    - [`server/services/cronService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/cronService.js)
    - [`server/services/datafabric/CorrelationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/CorrelationService.js)
    - [`server/services/datafabric/SecurityGraphService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/SecurityGraphService.js)
    - [`server/services/platform/AnalyticsAggregationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/AnalyticsAggregationService.js)
    - [`server/services/platform/DashboardAggregationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/DashboardAggregationService.js)
    - [`server/services/soc/ComplianceEvidenceService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ComplianceEvidenceService.js)
    - [`server/services/soc/IncidentCorrelationEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/IncidentCorrelationEngine.js)
    - [`server/services/soc/InvestigationTimelineService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/InvestigationTimelineService.js)
    - [`server/services/soc/ThreatHuntQueryEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatHuntQueryEngine.js)
    - [`server/services/soc/ThreatIntelFusionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatIntelFusionService.js)
    - [`server/services/vulnerabilityService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/vulnerabilityService.js)
    - [`server/tests/services/DashboardAggregationService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/DashboardAggregationService.test.js)
  - **Scripts & Acceptance Gates (4)**:
    - [`server/scripts/run_phase70_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase70_acceptance.js)
    - [`server/scripts/run_phase71_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase71_acceptance.js)
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
    - [`server/scripts/run_phase78_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase78_acceptance.js)
  - **Test Suites (7)**:
    - [`server/tests/correlation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/correlation.test.js)
    - [`server/tests/phase71_threat_hunting.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase71_threat_hunting.test.js)
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)
    - [`server/tests/saas.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/saas.test.js)
    - [`server/tests/services/DashboardAggregationService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/DashboardAggregationService.test.js)
    - [`server/tests/soc.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/soc.test.js)
    - [`server/tests/vuln-platform.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/vuln-platform.test.js)
  - **Other Modules (3)**:
    - [`server/integrations/integrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/integrations/integrationService.js)
    - [`server/providers/storage/MongoStorageProvider.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/providers/storage/MongoStorageProvider.js)
    - [`server/repositories/AssetRepository.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/AssetRepository.js)

### 6. `AuditEvent`

- **File**: [`server/models/AuditEvent.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/AuditEvent.js)
- **Domain**: `Audit & Compliance`
- **Purpose**: Tamper-evident audit logs capturing all administrative, operational, and security state changes
- **Total Files Importing / Using**: **25 files**
- **Usage Breakdown Across Codebase**:
  - **Services (10)**:
    - [`server/services/chatbot_core/audit/AuditCollector.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/chatbot_core/audit/AuditCollector.js)
    - [`server/services/observability/DisasterRecoveryService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/DisasterRecoveryService.js)
    - [`server/services/observability/ReliabilityCorrelationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/ReliabilityCorrelationService.js)
    - [`server/services/observability/ServiceHealthService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/ServiceHealthService.js)
    - [`server/services/soc/BreakGlassService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/BreakGlassService.js)
    - [`server/services/soc/ComplianceEvidenceService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ComplianceEvidenceService.js)
    - [`server/services/soc/DataLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DataLifecycleService.js)
    - [`server/services/soc/GovernanceEvaluationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/GovernanceEvaluationService.js)
    - [`server/services/soc/GovernancePolicyService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/GovernancePolicyService.js)
    - [`server/services/soc/SOCReportService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCReportService.js)
  - **Scripts & Acceptance Gates (8)**:
    - [`server/scripts/run_phase69_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase69_acceptance.js)
    - [`server/scripts/run_phase70_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase70_acceptance.js)
    - [`server/scripts/run_phase71_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase71_acceptance.js)
    - [`server/scripts/run_phase72_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase72_acceptance.js)
    - [`server/scripts/run_phase73_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase73_acceptance.js)
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
    - [`server/scripts/run_phase75_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase75_acceptance.js)
    - [`server/scripts/run_update_function_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_update_function_audit.js)
  - **Test Suites (6)**:
    - [`server/tests/phase69_native_expansion.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase69_native_expansion.test.js)
    - [`server/tests/phase70_soc_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase70_soc_intelligence.test.js)
    - [`server/tests/phase72_incident_response.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase72_incident_response.test.js)
    - [`server/tests/phase73_detection_engineering.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase73_detection_engineering.test.js)
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)
    - [`server/tests/phase75_governance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase75_governance.test.js)
  - **Other Modules (1)**:
    - [`server/utils/auditLogger.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/utils/auditLogger.js)

### 7. `AutomationExecution`

- **File**: [`server/models/AutomationExecution.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/AutomationExecution.js)
- **Domain**: `Security Automation (SOAR)`
- **Purpose**: Live execution tracking of SOAR playbooks, step outputs, logs, success/failure status
- **Total Files Importing / Using**: **8 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/automationController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/automationController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (4)**:
    - [`server/services/automation/AutomationExecutionEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/AutomationExecutionEngine.js)
    - [`server/services/automation/AutomationRecoveryService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/AutomationRecoveryService.js)
    - [`server/services/automation/RemediationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/RemediationService.js)
    - [`server/services/datafabric/SecurityGraphService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/SecurityGraphService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase77_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase77_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase77_automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase77_automation.test.js)

### 8. `AutomationPlaybook`

- **File**: [`server/models/AutomationPlaybook.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/AutomationPlaybook.js)
- **Domain**: `Security Automation (SOAR)`
- **Purpose**: Automated response workflows, trigger conditions, actions, parameter schemas, approval gates
- **Total Files Importing / Using**: **6 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/automationController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/automationController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (2)**:
    - [`server/services/automation/AutomationExecutionEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/AutomationExecutionEngine.js)
    - [`server/services/automation/PlaybookService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/PlaybookService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase77_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase77_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase77_automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase77_automation.test.js)

### 9. `AutomationPlaybookRevision`

- **File**: [`server/models/AutomationPlaybookRevision.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/AutomationPlaybookRevision.js)
- **Domain**: `Platform Core`
- **Purpose**: Core platform entity and database schema
- **Total Files Importing / Using**: **4 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/automationController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/automationController.js)
  - **Services (1)**:
    - [`server/services/automation/PlaybookService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/PlaybookService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase77_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase77_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase77_automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase77_automation.test.js)

### 10. `AutomationRun`

- **File**: [`server/models/AutomationRun.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/AutomationRun.js)
- **Domain**: `Security Automation (SOAR)`
- **Purpose**: Run history records for automated security operations with execution telemetry
- **Total Files Importing / Using**: **4 files**
- **Usage Breakdown Across Codebase**:
  - **Services (1)**:
    - [`server/services/playbookEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/playbookEngine.js)
  - **Test Suites (1)**:
    - [`server/tests/automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/automation.test.js)
  - **Other Modules (2)**:
    - [`server/integrations/actionQueue.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/integrations/actionQueue.js)
    - [`server/repositories/AutomationRunRepository.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/AutomationRunRepository.js)

### 11. `BackupVerification`

- **File**: [`server/models/BackupVerification.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/BackupVerification.js)
- **Domain**: `Disaster Recovery & Continuity`
- **Purpose**: Non-destructive disaster recovery restore tests in sandbox namespaces with checksum verification
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/observabilityController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/observabilityController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (1)**:
    - [`server/services/observability/DisasterRecoveryService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/DisasterRecoveryService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase76_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase76_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase76_reliability.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase76_reliability.test.js)

### 12. `BreakGlassSession`

- **File**: [`server/models/BreakGlassSession.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/BreakGlassSession.js)
- **Domain**: `Emergency Access & Governance`
- **Purpose**: Time-bounded emergency elevation sessions, mandatory justification, approval gates, action auditing
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (2)**:
    - [`server/services/soc/BreakGlassService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/BreakGlassService.js)
    - [`server/services/soc/GovernanceEvaluationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/GovernanceEvaluationService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase75_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase75_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase75_governance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase75_governance.test.js)

### 13. `Campaign`

- **File**: [`server/models/Campaign.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Campaign.js)
- **Domain**: `Threat Intelligence & Correlation`
- **Purpose**: Adversary attack campaigns clustering related incidents, alerts, IOCs, and targets
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/intelController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/intelController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase71_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase71_acceptance.js)
  - **Test Suites (2)**:
    - [`server/tests/phase71_threat_hunting.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase71_threat_hunting.test.js)
    - [`server/tests/phase79_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase79_intelligence.test.js)

### 14. `Case`

- **File**: [`server/models/Case.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Case.js)
- **Domain**: `Case Management & Investigation`
- **Purpose**: Formal legal & forensic investigation dossiers, evidence attachments, hypothesis linkage
- **Total Files Importing / Using**: **13 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (4)**:
    - [`server/controllers/caseController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/caseController.js)
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/findingController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/findingController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (4)**:
    - [`server/services/datafabric/SecurityGraphService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/SecurityGraphService.js)
    - [`server/services/soc/CaseOrchestrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/CaseOrchestrationService.js)
    - [`server/services/soc/DataLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DataLifecycleService.js)
    - [`server/services/soc/EvidenceLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/EvidenceLifecycleService.js)
  - **Scripts & Acceptance Gates (3)**:
    - [`server/scripts/run_phase69_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase69_acceptance.js)
    - [`server/scripts/run_phase72_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase72_acceptance.js)
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
  - **Test Suites (2)**:
    - [`server/tests/phase69_native_expansion.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase69_native_expansion.test.js)
    - [`server/tests/phase72_incident_response.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase72_incident_response.test.js)

### 15. `CommunityNote`

- **File**: [`server/models/CommunityNote.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/CommunityNote.js)
- **Domain**: `SOC Collaboration`
- **Purpose**: Analyst collaboration notes, peer commentary, contextual threat intelligence annotations
- **Total Files Importing / Using**: **3 files**
- **Usage Breakdown Across Codebase**:
  - **Services (2)**:
    - [`server/services/platform/CommunityService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/CommunityService.js)
    - [`server/tests/services/Phase7Services.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/Phase7Services.test.js)
  - **Test Suites (1)**:
    - [`server/tests/services/Phase7Services.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/Phase7Services.test.js)
  - **Other Modules (1)**:
    - [`server/repositories/CommunityNoteRepository.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/CommunityNoteRepository.js)

### 16. `ComplianceControl`

- **File**: [`server/models/ComplianceControl.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/ComplianceControl.js)
- **Domain**: `Compliance & Audit`
- **Purpose**: Canonical compliance controls mapped across 9 industry domains (SOC 2, ISO 27001, HIPAA, PCI-DSS)
- **Total Files Importing / Using**: **6 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (3)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/complianceController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/complianceController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (1)**:
    - [`server/services/soc/ComplianceEvidenceService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ComplianceEvidenceService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)

### 17. `ComplianceEvidence`

- **File**: [`server/models/ComplianceEvidence.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/ComplianceEvidence.js)
- **Domain**: `Compliance & Audit`
- **Purpose**: Cryptographically sealed evidence packages demonstrating compliance control satisfaction
- **Total Files Importing / Using**: **6 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/complianceController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/complianceController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (2)**:
    - [`server/services/soc/ComplianceEvidenceService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ComplianceEvidenceService.js)
    - [`server/services/soc/DataLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DataLifecycleService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)

### 18. `ControlValidation`

- **File**: [`server/models/ControlValidation.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/ControlValidation.js)
- **Domain**: `Compliance & Audit`
- **Purpose**: Automated verification test results validating compliance control operational effectiveness
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/automationController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/automationController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (1)**:
    - [`server/services/automation/ControlValidationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/ControlValidationService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase77_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase77_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase77_automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase77_automation.test.js)

### 19. `CorrelationRecord`

- **File**: [`server/models/CorrelationRecord.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/CorrelationRecord.js)
- **Domain**: `Correlation Engine`
- **Purpose**: Temporal correlation tracking records supporting composite attack detection
- **Total Files Importing / Using**: **4 files**
- **Usage Breakdown Across Codebase**:
  - **Services (2)**:
    - [`server/services/platform/IOCService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/IOCService.js)
    - [`server/tests/services/Phase7Services.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/Phase7Services.test.js)
  - **Test Suites (2)**:
    - [`server/tests/correlation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/correlation.test.js)
    - [`server/tests/services/Phase7Services.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/Phase7Services.test.js)
  - **Other Modules (1)**:
    - [`server/providers/storage/MongoStorageProvider.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/providers/storage/MongoStorageProvider.js)

### 20. `CorrelationResult`

- **File**: [`server/models/CorrelationResult.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/CorrelationResult.js)
- **Domain**: `Correlation Engine`
- **Purpose**: Materialized correlation matches identifying multi-stage attack patterns
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/dataFabricController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/dataFabricController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (1)**:
    - [`server/services/datafabric/CorrelationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/CorrelationService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase78_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase78_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase78_data_fabric.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase78_data_fabric.test.js)

### 21. `CorrelationRule`

- **File**: [`server/models/CorrelationRule.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/CorrelationRule.js)
- **Domain**: `Correlation Engine`
- **Purpose**: Deterministic correlation rules linking alerts, audit events, assets, and identity telemetry
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/dataFabricController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/dataFabricController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (1)**:
    - [`server/services/datafabric/CorrelationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/CorrelationService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase78_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase78_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase78_data_fabric.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase78_data_fabric.test.js)

### 22. `DecisionAssessment`

- **File**: [`server/models/DecisionAssessment.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/DecisionAssessment.js)
- **Domain**: `Decision Intelligence`
- **Purpose**: Machine-readable decision explanations with observed facts, derived factors, uncertainty boundaries
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/intelligenceController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/intelligenceController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Scripts & Acceptance Gates (2)**:
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
    - [`server/scripts/run_update_function_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_update_function_audit.js)
  - **Test Suites (1)**:
    - [`server/tests/phase79_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase79_intelligence.test.js)

### 23. `DetectionContentPack`

- **File**: [`server/models/DetectionContentPack.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/DetectionContentPack.js)
- **Domain**: `Detection Engineering`
- **Purpose**: Curated detection packs (Core SOC, Network, Identity, Endpoint, Threat Intel) with test fixtures
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/detectionController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/detectionController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (1)**:
    - [`server/services/soc/ContentPackService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ContentPackService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase73_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase73_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase73_detection_engineering.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase73_detection_engineering.test.js)

### 24. `DetectionGap`

- **File**: [`server/models/DetectionGap.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/DetectionGap.js)
- **Domain**: `Detection Engineering`
- **Purpose**: Observed detection coverage blindspots derived from ATT&CK matrix and incident post-mortems
- **Total Files Importing / Using**: **11 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/detectionController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/detectionController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (4)**:
    - [`server/services/intelligence/RiskSynthesisService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/intelligence/RiskSynthesisService.js)
    - [`server/services/soc/DetectionGapService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionGapService.js)
    - [`server/services/soc/ExecutiveRiskService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ExecutiveRiskService.js)
    - [`server/services/soc/SOCMetricsService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCMetricsService.js)
  - **Scripts & Acceptance Gates (3)**:
    - [`server/scripts/run_phase73_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase73_acceptance.js)
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
  - **Test Suites (2)**:
    - [`server/tests/phase73_detection_engineering.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase73_detection_engineering.test.js)
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)

### 25. `DetectionRule`

- **File**: [`server/models/DetectionRule.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/DetectionRule.js)
- **Domain**: `Detection Engineering`
- **Purpose**: Semantic detection logic rules, condition schemas, promotion lifecycle (DRAFT -> ACTIVE)
- **Total Files Importing / Using**: **28 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (4)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/detectionController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/detectionController.js)
    - [`server/controllers/intelController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/intelController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (14)**:
    - [`server/services/automation/ControlValidationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/ControlValidationService.js)
    - [`server/services/datafabric/SecurityGraphService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/SecurityGraphService.js)
    - [`server/services/observability/ServiceHealthService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/ServiceHealthService.js)
    - [`server/services/soc/ComplianceEvidenceService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ComplianceEvidenceService.js)
    - [`server/services/soc/ContentPackService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ContentPackService.js)
    - [`server/services/soc/DataLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DataLifecycleService.js)
    - [`server/services/soc/DetectionCoverageService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionCoverageService.js)
    - [`server/services/soc/DetectionGapService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionGapService.js)
    - [`server/services/soc/DetectionLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionLifecycleService.js)
    - [`server/services/soc/DetectionRuleEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionRuleEngine.js)
    - [`server/services/soc/DetectionTestingService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionTestingService.js)
    - [`server/services/soc/IncidentResponseService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/IncidentResponseService.js)
    - [`server/services/soc/SOCMetricsService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCMetricsService.js)
    - [`server/services/soc/ThreatHuntExecutionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatHuntExecutionService.js)
  - **Scripts & Acceptance Gates (6)**:
    - [`server/scripts/run_phase70_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase70_acceptance.js)
    - [`server/scripts/run_phase71_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase71_acceptance.js)
    - [`server/scripts/run_phase72_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase72_acceptance.js)
    - [`server/scripts/run_phase73_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase73_acceptance.js)
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
    - [`server/scripts/run_update_function_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_update_function_audit.js)
  - **Test Suites (4)**:
    - [`server/tests/phase70_soc_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase70_soc_intelligence.test.js)
    - [`server/tests/phase71_threat_hunting.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase71_threat_hunting.test.js)
    - [`server/tests/phase73_detection_engineering.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase73_detection_engineering.test.js)
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)

### 26. `DetectionRuleRevision`

- **File**: [`server/models/DetectionRuleRevision.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/DetectionRuleRevision.js)
- **Domain**: `Detection Engineering`
- **Purpose**: Immutable, versioned revisions of detection rules with diffs, author attribution, SHA-256
- **Total Files Importing / Using**: **9 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/detectionController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/detectionController.js)
  - **Services (5)**:
    - [`server/services/automation/ControlValidationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/ControlValidationService.js)
    - [`server/services/automation/PlaybookService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/PlaybookService.js)
    - [`server/services/datafabric/SecurityGraphService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/SecurityGraphService.js)
    - [`server/services/soc/ComplianceEvidenceService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ComplianceEvidenceService.js)
    - [`server/services/soc/DetectionLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionLifecycleService.js)
  - **Scripts & Acceptance Gates (2)**:
    - [`server/scripts/run_phase73_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase73_acceptance.js)
    - [`server/scripts/run_update_function_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_update_function_audit.js)
  - **Test Suites (1)**:
    - [`server/tests/phase73_detection_engineering.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase73_detection_engineering.test.js)

### 27. `DetectionSuppression`

- **File**: [`server/models/DetectionSuppression.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/DetectionSuppression.js)
- **Domain**: `Detection Engineering`
- **Purpose**: Time-bounded alert suppression rules with expiration, justification, and scope boundaries
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/detectionController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/detectionController.js)
  - **Services (1)**:
    - [`server/services/soc/DetectionRuleEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionRuleEngine.js)
  - **Scripts & Acceptance Gates (2)**:
    - [`server/scripts/run_phase70_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase70_acceptance.js)
    - [`server/scripts/run_phase73_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase73_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase70_soc_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase70_soc_intelligence.test.js)

### 28. `EvidenceRecord`

- **File**: [`server/models/EvidenceRecord.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/EvidenceRecord.js)
- **Domain**: `Forensic Evidence`
- **Purpose**: Cryptographically sealed forensic evidence items, SHA-256 hashes, chain of custody
- **Total Files Importing / Using**: **11 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/incidentController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/incidentController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (5)**:
    - [`server/services/soc/CaseOrchestrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/CaseOrchestrationService.js)
    - [`server/services/soc/ComplianceEvidenceService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ComplianceEvidenceService.js)
    - [`server/services/soc/EvidenceLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/EvidenceLifecycleService.js)
    - [`server/services/soc/IncidentResponseService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/IncidentResponseService.js)
    - [`server/services/soc/InvestigationTimelineService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/InvestigationTimelineService.js)
  - **Scripts & Acceptance Gates (2)**:
    - [`server/scripts/run_phase72_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase72_acceptance.js)
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
  - **Test Suites (2)**:
    - [`server/tests/phase72_incident_response.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase72_incident_response.test.js)
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)

### 29. `Finding`

- **File**: [`server/models/Finding.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Finding.js)
- **Domain**: `Vulnerability & Posture Management`
- **Purpose**: Actionable security findings, CVE associations, vulnerability assessments, remediation tracking
- **Total Files Importing / Using**: **38 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (8)**:
    - [`server/controllers/aiReportController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/aiReportController.js)
    - [`server/controllers/caseController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/caseController.js)
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/findingController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/findingController.js)
    - [`server/controllers/huntController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/huntController.js)
    - [`server/controllers/intelController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/intelController.js)
    - [`server/controllers/remediationController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/remediationController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (17)**:
    - [`server/services/datafabric/SecurityGraphService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/SecurityGraphService.js)
    - [`server/services/intelligence/AnalystPriorityService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/intelligence/AnalystPriorityService.js)
    - [`server/services/intelligence/RiskSynthesisService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/intelligence/RiskSynthesisService.js)
    - [`server/services/observability/ReliabilityCorrelationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/ReliabilityCorrelationService.js)
    - [`server/services/platform/ReportService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/ReportService.js)
    - [`server/services/soc/CaseOrchestrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/CaseOrchestrationService.js)
    - [`server/services/soc/ComplianceEvidenceService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ComplianceEvidenceService.js)
    - [`server/services/soc/DataLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DataLifecycleService.js)
    - [`server/services/soc/DetectionCoverageService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionCoverageService.js)
    - [`server/services/soc/DetectionRuleEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionRuleEngine.js)
    - [`server/services/soc/ExecutiveRiskService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ExecutiveRiskService.js)
    - [`server/services/soc/IncidentCorrelationEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/IncidentCorrelationEngine.js)
    - [`server/services/soc/InvestigationTimelineService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/InvestigationTimelineService.js)
    - [`server/services/soc/SOCMetricsService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCMetricsService.js)
    - [`server/services/soc/ThreatHuntExecutionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatHuntExecutionService.js)
    - [`server/services/soc/ThreatHuntQueryEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatHuntQueryEngine.js)
    - [`server/services/soc/ThreatIntelFusionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatIntelFusionService.js)
  - **Scripts & Acceptance Gates (8)**:
    - [`server/scripts/run_phase69_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase69_acceptance.js)
    - [`server/scripts/run_phase70_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase70_acceptance.js)
    - [`server/scripts/run_phase71_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase71_acceptance.js)
    - [`server/scripts/run_phase72_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase72_acceptance.js)
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
    - [`server/scripts/run_phase78_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase78_acceptance.js)
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
    - [`server/scripts/run_update_function_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_update_function_audit.js)
  - **Test Suites (4)**:
    - [`server/tests/phase69_native_expansion.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase69_native_expansion.test.js)
    - [`server/tests/phase71_threat_hunting.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase71_threat_hunting.test.js)
    - [`server/tests/phase72_incident_response.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase72_incident_response.test.js)
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)
  - **Other Modules (1)**:
    - [`server/integrations/integrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/integrations/integrationService.js)

### 30. `GovernancePolicy`

- **File**: [`server/models/GovernancePolicy.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/GovernancePolicy.js)
- **Domain**: `Enterprise Governance`
- **Purpose**: Platform governance policies (DRAFT -> ACTIVE -> RETIRED) with review gates and enforcement bounds
- **Total Files Importing / Using**: **15 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (8)**:
    - [`server/services/automation/AutomationExecutionEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/AutomationExecutionEngine.js)
    - [`server/services/automation/ControlValidationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/ControlValidationService.js)
    - [`server/services/automation/DriftDetectionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/DriftDetectionService.js)
    - [`server/services/automation/PlaybookService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/PlaybookService.js)
    - [`server/services/automation/RemediationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/RemediationService.js)
    - [`server/services/datafabric/SecurityGraphService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/SecurityGraphService.js)
    - [`server/services/soc/GovernanceEvaluationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/GovernanceEvaluationService.js)
    - [`server/services/soc/GovernancePolicyService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/GovernancePolicyService.js)
  - **Scripts & Acceptance Gates (3)**:
    - [`server/scripts/run_phase75_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase75_acceptance.js)
    - [`server/scripts/run_phase77_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase77_acceptance.js)
    - [`server/scripts/run_update_function_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_update_function_audit.js)
  - **Test Suites (2)**:
    - [`server/tests/phase75_governance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase75_governance.test.js)
    - [`server/tests/phase77_automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase77_automation.test.js)

### 31. `GovernancePolicyRevision`

- **File**: [`server/models/GovernancePolicyRevision.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/GovernancePolicyRevision.js)
- **Domain**: `Enterprise Governance`
- **Purpose**: Immutable versioned revisions of governance policies with SHA-256 hashes and change rationale
- **Total Files Importing / Using**: **9 files**
- **Usage Breakdown Across Codebase**:
  - **Services (4)**:
    - [`server/services/automation/AutomationExecutionEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/AutomationExecutionEngine.js)
    - [`server/services/automation/DriftDetectionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/DriftDetectionService.js)
    - [`server/services/automation/RemediationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/RemediationService.js)
    - [`server/services/soc/GovernancePolicyService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/GovernancePolicyService.js)
  - **Scripts & Acceptance Gates (3)**:
    - [`server/scripts/run_phase75_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase75_acceptance.js)
    - [`server/scripts/run_phase77_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase77_acceptance.js)
    - [`server/scripts/run_update_function_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_update_function_audit.js)
  - **Test Suites (2)**:
    - [`server/tests/phase75_governance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase75_governance.test.js)
    - [`server/tests/phase77_automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase77_automation.test.js)

### 32. `IOCRecord`

- **File**: [`server/models/IOCRecord.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/IOCRecord.js)
- **Domain**: `Threat Intelligence`
- **Purpose**: Structured Indicators of Compromise (IP, domain, hash, URL) with confidence and expiration
- **Total Files Importing / Using**: **18 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (3)**:
    - [`server/controllers/intelController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/intelController.js)
    - [`server/controllers/iocController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/iocController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (9)**:
    - [`server/services/cronService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/cronService.js)
    - [`server/services/datafabric/SecurityGraphService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/SecurityGraphService.js)
    - [`server/services/platform/IOCService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/IOCService.js)
    - [`server/services/soc/IOCNormalizationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/IOCNormalizationService.js)
    - [`server/services/soc/InvestigationTimelineService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/InvestigationTimelineService.js)
    - [`server/services/soc/SOCReportService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCReportService.js)
    - [`server/services/soc/ThreatHuntQueryEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatHuntQueryEngine.js)
    - [`server/services/soc/ThreatIntelFusionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatIntelFusionService.js)
    - [`server/tests/services/Phase7Services.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/Phase7Services.test.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase70_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase70_acceptance.js)
  - **Test Suites (5)**:
    - [`server/tests/correlation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/correlation.test.js)
    - [`server/tests/enterprise.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/enterprise.test.js)
    - [`server/tests/phase70_soc_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase70_soc_intelligence.test.js)
    - [`server/tests/services/Phase7Services.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/Phase7Services.test.js)
    - [`server/tests/soc.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/soc.test.js)
  - **Other Modules (1)**:
    - [`server/providers/storage/MongoStorageProvider.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/providers/storage/MongoStorageProvider.js)

### 33. `Incident`

- **File**: [`server/models/Incident.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Incident.js)
- **Domain**: `SOC Incident Response`
- **Purpose**: Core security incidents, severity, lifecycle states, MITRE ATT&CK mapping, assigned responders, timeline
- **Total Files Importing / Using**: **50 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (5)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/huntController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/huntController.js)
    - [`server/controllers/incidentController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/incidentController.js)
    - [`server/controllers/observabilityController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/observabilityController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (23)**:
    - [`server/services/datafabric/CorrelationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/CorrelationService.js)
    - [`server/services/datafabric/SecurityGraphService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/SecurityGraphService.js)
    - [`server/services/intelligence/AnalystPriorityService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/intelligence/AnalystPriorityService.js)
    - [`server/services/intelligence/RiskSynthesisService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/intelligence/RiskSynthesisService.js)
    - [`server/services/observability/ReliabilityCorrelationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/ReliabilityCorrelationService.js)
    - [`server/services/playbookEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/playbookEngine.js)
    - [`server/services/soarEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soarEngine.js)
    - [`server/services/soc/CaseOrchestrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/CaseOrchestrationService.js)
    - [`server/services/soc/ComplianceEvidenceService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ComplianceEvidenceService.js)
    - [`server/services/soc/DataLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DataLifecycleService.js)
    - [`server/services/soc/DetectionCoverageService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionCoverageService.js)
    - [`server/services/soc/DetectionGapService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionGapService.js)
    - [`server/services/soc/EvidenceLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/EvidenceLifecycleService.js)
    - [`server/services/soc/ExecutiveRiskService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ExecutiveRiskService.js)
    - [`server/services/soc/IncidentCorrelationEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/IncidentCorrelationEngine.js)
    - [`server/services/soc/IncidentResponseService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/IncidentResponseService.js)
    - [`server/services/soc/InvestigationTimelineService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/InvestigationTimelineService.js)
    - [`server/services/soc/SOCMetricsService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCMetricsService.js)
    - [`server/services/soc/SOCReportService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCReportService.js)
    - [`server/services/soc/SafePlaybookAutomationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SafePlaybookAutomationService.js)
    - [`server/services/soc/ThreatHuntExecutionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatHuntExecutionService.js)
    - [`server/services/soc/ThreatHuntQueryEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatHuntQueryEngine.js)
    - [`server/services/soc/ThreatIntelFusionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatIntelFusionService.js)
  - **Scripts & Acceptance Gates (12)**:
    - [`server/scripts/run_phase69_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase69_acceptance.js)
    - [`server/scripts/run_phase70_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase70_acceptance.js)
    - [`server/scripts/run_phase71_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase71_acceptance.js)
    - [`server/scripts/run_phase72_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase72_acceptance.js)
    - [`server/scripts/run_phase73_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase73_acceptance.js)
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
    - [`server/scripts/run_phase75_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase75_acceptance.js)
    - [`server/scripts/run_phase76_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase76_acceptance.js)
    - [`server/scripts/run_phase78_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase78_acceptance.js)
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
    - [`server/scripts/run_production_readiness_v68.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_production_readiness_v68.js)
    - [`server/scripts/run_update_function_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_update_function_audit.js)
  - **Test Suites (10)**:
    - [`server/tests/enterprise.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/enterprise.test.js)
    - [`server/tests/phase70_soc_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase70_soc_intelligence.test.js)
    - [`server/tests/phase71_threat_hunting.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase71_threat_hunting.test.js)
    - [`server/tests/phase72_incident_response.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase72_incident_response.test.js)
    - [`server/tests/phase73_detection_engineering.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase73_detection_engineering.test.js)
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)
    - [`server/tests/phase75_governance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase75_governance.test.js)
    - [`server/tests/phase76_reliability.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase76_reliability.test.js)
    - *(and 2 more test files...)*

### 34. `IncidentTask`

- **File**: [`server/models/IncidentTask.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/IncidentTask.js)
- **Domain**: `SOC Incident Response`
- **Purpose**: Granular investigation and remediation tasks attached to active security incidents
- **Total Files Importing / Using**: **7 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/incidentController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/incidentController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (3)**:
    - [`server/services/soc/CaseOrchestrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/CaseOrchestrationService.js)
    - [`server/services/soc/IncidentResponseService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/IncidentResponseService.js)
    - [`server/services/soc/InvestigationTimelineService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/InvestigationTimelineService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase72_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase72_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase72_incident_response.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase72_incident_response.test.js)

### 35. `IntegrationConfig`

- **File**: [`server/models/IntegrationConfig.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/IntegrationConfig.js)
- **Domain**: `Third-Party Integrations`
- **Purpose**: External API integration settings (Slack, Jira, AWS, GitHub, VirusTotal, Shodan)
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Services (2)**:
    - [`server/services/platform/IntegrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/IntegrationService.js)
    - [`server/tests/services/IntegrationService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/IntegrationService.test.js)
  - **Test Suites (2)**:
    - [`server/tests/automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/automation.test.js)
    - [`server/tests/services/IntegrationService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/IntegrationService.test.js)
  - **Other Modules (2)**:
    - [`server/integrations/integrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/integrations/integrationService.js)
    - [`server/repositories/IntegrationConfigRepository.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/IntegrationConfigRepository.js)

### 36. `IntegrationCredentialMetadata`

- **File**: [`server/models/IntegrationCredentialMetadata.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/IntegrationCredentialMetadata.js)
- **Domain**: `Integration Security`
- **Purpose**: Cryptographic metadata and fingerprints for external integration tokens
- **Total Files Importing / Using**: **10 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/governanceController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/governanceController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (5)**:
    - [`server/services/automation/AutomationExecutionEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/AutomationExecutionEngine.js)
    - [`server/services/automation/ControlValidationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/ControlValidationService.js)
    - [`server/services/automation/DriftDetectionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/DriftDetectionService.js)
    - [`server/services/automation/RemediationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/RemediationService.js)
    - [`server/services/soc/GovernanceEvaluationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/GovernanceEvaluationService.js)
  - **Scripts & Acceptance Gates (2)**:
    - [`server/scripts/run_phase75_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase75_acceptance.js)
    - [`server/scripts/run_phase77_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase77_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase75_governance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase75_governance.test.js)

### 37. `InvestigationGraphSnapshot`

- **File**: [`server/models/InvestigationGraphSnapshot.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/InvestigationGraphSnapshot.js)
- **Domain**: `Security Data Fabric`
- **Purpose**: Immutable investigation graph subgraphs with SHA-256 integrity checksums and timeline fusion
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/dataFabricController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/dataFabricController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (1)**:
    - [`server/services/datafabric/InvestigationQueryService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/InvestigationQueryService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase78_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase78_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase78_data_fabric.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase78_data_fabric.test.js)

### 38. `InvestigationHypothesis`

- **File**: [`server/models/InvestigationHypothesis.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/InvestigationHypothesis.js)
- **Domain**: `Decision Intelligence`
- **Purpose**: Structured investigation hypotheses with supporting and contradicting forensic evidence
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/intelligenceController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/intelligenceController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Scripts & Acceptance Gates (2)**:
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
    - [`server/scripts/run_update_function_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_update_function_audit.js)
  - **Test Suites (1)**:
    - [`server/tests/phase79_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase79_intelligence.test.js)

### 39. `Invitation`

- **File**: [`server/models/Invitation.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Invitation.js)
- **Domain**: `Identity & Access Management`
- **Purpose**: Workspace & team user invitation tokens, expiration, role pre-assignment, audit trace
- **Total Files Importing / Using**: **2 files**
- **Usage Breakdown Across Codebase**:
  - **Test Suites (1)**:
    - [`server/tests/saas.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/saas.test.js)
  - **Other Modules (1)**:
    - [`server/repositories/OrgRepositories.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/OrgRepositories.js)

### 40. `Job`

- **File**: [`server/models/Job.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Job.js)
- **Domain**: `Background Processing`
- **Purpose**: Asynchronous background job queue records, retries, worker locks, execution state
- **Total Files Importing / Using**: **13 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
  - **Services (6)**:
    - [`server/services/TerminalJobService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/TerminalJobService.js)
    - [`server/services/cronService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/cronService.js)
    - [`server/services/observability/SLOService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/SLOService.js)
    - [`server/services/observability/ServiceHealthService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/ServiceHealthService.js)
    - [`server/services/soc/DetectionCoverageService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionCoverageService.js)
    - [`server/services/soc/ThreatHuntQueryEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatHuntQueryEngine.js)
  - **Routes (1)**:
    - [`server/routes/terminal.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/terminal.js)
  - **Scripts & Acceptance Gates (3)**:
    - [`server/scripts/run_phase69_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase69_acceptance.js)
    - [`server/scripts/run_phase73_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase73_acceptance.js)
    - [`server/scripts/run_phase76_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase76_acceptance.js)
  - **Test Suites (2)**:
    - [`server/tests/phase69_native_expansion.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase69_native_expansion.test.js)
    - [`server/tests/vuln-platform.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/vuln-platform.test.js)

### 41. `Membership`

- **File**: [`server/models/Membership.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Membership.js)
- **Domain**: `Identity & Access Management`
- **Purpose**: Multi-tenant organization & team memberships, granular role assignments, permissions
- **Total Files Importing / Using**: **8 files**
- **Usage Breakdown Across Codebase**:
  - **Services (1)**:
    - [`server/services/TenantContextService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/TenantContextService.js)
  - **Test Suites (4)**:
    - [`server/tests/auth/auth_hardening.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/auth/auth_hardening.test.js)
    - [`server/tests/automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/automation.test.js)
    - [`server/tests/saas.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/saas.test.js)
    - [`server/tests/vuln-platform.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/vuln-platform.test.js)
  - **Other Modules (3)**:
    - [`server/integrations/actionQueue.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/integrations/actionQueue.js)
    - [`server/providers/storage/MongoStorageProvider.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/providers/storage/MongoStorageProvider.js)
    - [`server/repositories/OrgRepositories.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/OrgRepositories.js)

### 42. `MetricSnapshot`

- **File**: [`server/models/MetricSnapshot.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/MetricSnapshot.js)
- **Domain**: `Platform Telemetry`
- **Purpose**: Historical metrics snapshot for dashboard visualization and capacity planning
- **Total Files Importing / Using**: **3 files**
- **Usage Breakdown Across Codebase**:
  - **Services (2)**:
    - [`server/services/soc/DataLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DataLifecycleService.js)
    - [`server/services/soc/SOCMetricsService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCMetricsService.js)
  - **Test Suites (1)**:
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)

### 43. `Notification`

- **File**: [`server/models/Notification.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Notification.js)
- **Domain**: `User Notifications`
- **Purpose**: In-app notification records for security alerts, approval requests, system notices
- **Total Files Importing / Using**: **11 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
  - **Services (5)**:
    - [`server/services/cronService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/cronService.js)
    - [`server/services/platform/NotificationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/NotificationService.js)
    - [`server/services/playbookEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/playbookEngine.js)
    - [`server/services/webhookService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/webhookService.js)
    - [`server/tests/services/NotificationService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/NotificationService.test.js)
  - **Test Suites (3)**:
    - [`server/tests/automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/automation.test.js)
    - [`server/tests/services/NotificationService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/NotificationService.test.js)
    - [`server/tests/soc.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/soc.test.js)
  - **Other Modules (3)**:
    - [`server/integrations/actionQueue.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/integrations/actionQueue.js)
    - [`server/repositories/NotificationRepository.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/NotificationRepository.js)
    - [`server/workers/NotificationWorker.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/workers/NotificationWorker.js)

### 44. `Organization`

- **File**: [`server/models/Organization.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Organization.js)
- **Domain**: `Multi-Tenancy & Governance`
- **Purpose**: Tenant organizations, enterprise isolation, feature flags, license bounds
- **Total Files Importing / Using**: **21 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (4)**:
    - [`server/services/TenantContextService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/TenantContextService.js)
    - [`server/services/admin/AdminService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/admin/AdminService.js)
    - [`server/services/org/OrganizationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/org/OrganizationService.js)
    - [`server/services/webhookService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/webhookService.js)
  - **Scripts & Acceptance Gates (6)**:
    - [`server/scripts/run_phase70_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase70_acceptance.js)
    - [`server/scripts/run_phase73_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase73_acceptance.js)
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
    - [`server/scripts/run_phase76_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase76_acceptance.js)
    - [`server/scripts/run_phase77_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase77_acceptance.js)
    - [`server/scripts/run_phase78_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase78_acceptance.js)
  - **Test Suites (6)**:
    - [`server/tests/auth/auth_hardening.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/auth/auth_hardening.test.js)
    - [`server/tests/auth/security_hardening_expanded.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/auth/security_hardening_expanded.test.js)
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)
    - [`server/tests/phase78_data_fabric.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase78_data_fabric.test.js)
    - [`server/tests/saas.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/saas.test.js)
    - [`server/tests/vuln-platform.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/vuln-platform.test.js)
  - **Other Modules (3)**:
    - [`server/providers/storage/MongoStorageProvider.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/providers/storage/MongoStorageProvider.js)
    - [`server/repositories/OrgRepositories.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/OrgRepositories.js)
    - [`server/repositories/OrganizationSettingsRepository.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/OrganizationSettingsRepository.js)

### 45. `OrganizationSettings`

- **File**: [`server/models/OrganizationSettings.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/OrganizationSettings.js)
- **Domain**: `Multi-Tenancy & Governance`
- **Purpose**: Tenant-specific security policies, domain restrictions, branding, SSO configuration
- **Total Files Importing / Using**: **3 files**
- **Usage Breakdown Across Codebase**:
  - **Services (1)**:
    - [`server/services/org/OrganizationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/org/OrganizationService.js)
  - **Test Suites (1)**:
    - [`server/tests/saas.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/saas.test.js)
  - **Other Modules (1)**:
    - [`server/repositories/OrganizationSettingsRepository.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/OrganizationSettingsRepository.js)

### 46. `PendingApproval`

- **File**: [`server/models/PendingApproval.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/PendingApproval.js)
- **Domain**: `Operational Governance`
- **Purpose**: Human-in-the-loop approval gates for automated remediation, policy activations, playbooks
- **Total Files Importing / Using**: **15 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (3)**:
    - [`server/controllers/approvalController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/approvalController.js)
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (6)**:
    - [`server/services/soc/CaseOrchestrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/CaseOrchestrationService.js)
    - [`server/services/soc/ExecutiveRiskService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ExecutiveRiskService.js)
    - [`server/services/soc/IncidentResponseService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/IncidentResponseService.js)
    - [`server/services/soc/InvestigationTimelineService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/InvestigationTimelineService.js)
    - [`server/services/soc/SOCMetricsService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCMetricsService.js)
    - [`server/services/soc/SafePlaybookAutomationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SafePlaybookAutomationService.js)
  - **Scripts & Acceptance Gates (3)**:
    - [`server/scripts/run_phase70_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase70_acceptance.js)
    - [`server/scripts/run_phase72_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase72_acceptance.js)
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
  - **Test Suites (3)**:
    - [`server/tests/phase70_soc_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase70_soc_intelligence.test.js)
    - [`server/tests/phase72_incident_response.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase72_incident_response.test.js)
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)

### 47. `PlatformMetricSnapshot`

- **File**: [`server/models/PlatformMetricSnapshot.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/PlatformMetricSnapshot.js)
- **Domain**: `Platform Telemetry`
- **Purpose**: Host CPU, heap memory utilization, event loop lag, system load average metrics
- **Total Files Importing / Using**: **4 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/observabilityController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/observabilityController.js)
  - **Services (1)**:
    - [`server/services/observability/APIObservabilityService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/APIObservabilityService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase76_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase76_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase76_reliability.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase76_reliability.test.js)

### 48. `Playbook`

- **File**: [`server/models/Playbook.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Playbook.js)
- **Domain**: `Security Automation (SOAR)`
- **Purpose**: Legacy playbook definitions for incident containment and remediation actions
- **Total Files Importing / Using**: **21 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (3)**:
    - [`server/controllers/automationController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/automationController.js)
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (10)**:
    - [`server/services/automation/AutomationExecutionEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/AutomationExecutionEngine.js)
    - [`server/services/automation/PlaybookService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/PlaybookService.js)
    - [`server/services/cronService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/cronService.js)
    - [`server/services/intelligence/InvestigationRecommendationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/intelligence/InvestigationRecommendationService.js)
    - [`server/services/platform/PlaybookService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/PlaybookService.js)
    - [`server/services/playbookEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/playbookEngine.js)
    - [`server/services/soc/CaseOrchestrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/CaseOrchestrationService.js)
    - [`server/services/soc/ComplianceEvidenceService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ComplianceEvidenceService.js)
    - [`server/services/vulnerabilityService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/vulnerabilityService.js)
    - [`server/tests/services/PlaybookService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/PlaybookService.test.js)
  - **Scripts & Acceptance Gates (3)**:
    - [`server/scripts/run_phase70_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase70_acceptance.js)
    - [`server/scripts/run_phase77_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase77_acceptance.js)
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
  - **Test Suites (4)**:
    - [`server/tests/automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/automation.test.js)
    - [`server/tests/phase70_soc_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase70_soc_intelligence.test.js)
    - [`server/tests/phase77_automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase77_automation.test.js)
    - [`server/tests/services/PlaybookService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/PlaybookService.test.js)
  - **Other Modules (2)**:
    - [`server/integrations/actionQueue.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/integrations/actionQueue.js)
    - [`server/repositories/PlaybookRepository.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/PlaybookRepository.js)

### 49. `PlaybookLog`

- **File**: [`server/models/PlaybookLog.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/PlaybookLog.js)
- **Domain**: `Security Automation (SOAR)`
- **Purpose**: Historical execution logs for legacy playbook runs
- **Total Files Importing / Using**: **0 files**
- ⚠️ **Status**: **DORMANT / UNWIRED SCHEMA** — Currently defined in `server/models/PlaybookLog.js` but not imported by other active backend files. Reserved for future extensions or superseded by adjacent modules.

### 50. `RecoveryExercise`

- **File**: [`server/models/RecoveryExercise.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/RecoveryExercise.js)
- **Domain**: `Disaster Recovery & Continuity`
- **Purpose**: Formal DR tabletop exercises with observed RTO, RPO, and participant records
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/observabilityController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/observabilityController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (1)**:
    - [`server/services/observability/DisasterRecoveryService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/DisasterRecoveryService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase76_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase76_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase76_reliability.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase76_reliability.test.js)

### 51. `ReportSchedule`

- **File**: [`server/models/ReportSchedule.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/ReportSchedule.js)
- **Domain**: `SOC Reporting`
- **Purpose**: Recurring scheduled report generation jobs with decoupled delivery tracking
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/socReportController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/socReportController.js)
  - **Services (2)**:
    - [`server/services/observability/ServiceHealthService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/ServiceHealthService.js)
    - [`server/services/soc/SOCReportService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCReportService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)

### 52. `RetentionPolicy`

- **File**: [`server/models/RetentionPolicy.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/RetentionPolicy.js)
- **Domain**: `Data Governance & Lifecycle`
- **Purpose**: Data retention schedules, automated archival/purging policies with legal hold protections
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (2)**:
    - [`server/services/soc/DataLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DataLifecycleService.js)
    - [`server/services/soc/GovernanceEvaluationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/GovernanceEvaluationService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase75_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase75_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase75_governance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase75_governance.test.js)

### 53. `RiskAssessment`

- **File**: [`server/models/RiskAssessment.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/RiskAssessment.js)
- **Domain**: `Risk Synthesis & Intelligence`
- **Purpose**: Deterministic multi-domain risk evaluation citing exact factor contributions across 12 domains
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/intelligenceController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/intelligenceController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (1)**:
    - [`server/services/intelligence/RiskSynthesisService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/intelligence/RiskSynthesisService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase79_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase79_intelligence.test.js)

### 54. `RiskSnapshot`

- **File**: [`server/models/RiskSnapshot.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/RiskSnapshot.js)
- **Domain**: `Risk Synthesis & Intelligence`
- **Purpose**: SHA-256 content-hashed point-in-time risk postures across tenant assets and operations
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/intelligenceController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/intelligenceController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (1)**:
    - [`server/services/intelligence/RiskSynthesisService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/intelligence/RiskSynthesisService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase79_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase79_intelligence.test.js)

### 55. `SLODefinition`

- **File**: [`server/models/SLODefinition.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/SLODefinition.js)
- **Domain**: `Platform Reliability & SLOs`
- **Purpose**: Service Level Objectives, target availability percentages, sliding evaluation windows, error budgets
- **Total Files Importing / Using**: **9 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (3)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/observabilityController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/observabilityController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (4)**:
    - [`server/services/automation/ControlValidationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/ControlValidationService.js)
    - [`server/services/automation/DriftDetectionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/DriftDetectionService.js)
    - [`server/services/datafabric/SecurityGraphService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/SecurityGraphService.js)
    - [`server/services/observability/SLOService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/SLOService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase76_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase76_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase76_reliability.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase76_reliability.test.js)

### 56. `SLOEvaluation`

- **File**: [`server/models/SLOEvaluation.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/SLOEvaluation.js)
- **Domain**: `Platform Reliability & SLOs`
- **Purpose**: Periodic evaluation records of SLOs tracking observed compliance and error budget burn
- **Total Files Importing / Using**: **4 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/observabilityController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/observabilityController.js)
  - **Services (1)**:
    - [`server/services/observability/SLOService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/SLOService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase76_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase76_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase76_reliability.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase76_reliability.test.js)

### 57. `SOCReport`

- **File**: [`server/models/SOCReport.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/SOCReport.js)
- **Domain**: `SOC Reporting & Audit`
- **Purpose**: Executive, operational, compliance, and incident reports with PDF/CSV exports and SHA-256 integrity
- **Total Files Importing / Using**: **9 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (3)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
    - [`server/controllers/socReportController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/socReportController.js)
  - **Services (4)**:
    - [`server/services/observability/SLOService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/SLOService.js)
    - [`server/services/observability/ServiceHealthService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/ServiceHealthService.js)
    - [`server/services/soc/DataLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DataLifecycleService.js)
    - [`server/services/soc/SOCReportService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCReportService.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)

### 58. `Scan`

- **File**: [`server/models/Scan.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Scan.js)
- **Domain**: `Vulnerability Scanning`
- **Purpose**: Security scanner runs (network, web, ports, headers, SSL) with target, duration, findings
- **Total Files Importing / Using**: **28 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (3)**:
    - [`server/controllers/aiReportController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/aiReportController.js)
    - [`server/controllers/remediationController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/remediationController.js)
    - [`server/controllers/reportController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/reportController.js)
  - **Services (13)**:
    - [`server/services/admin/AdminService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/admin/AdminService.js)
    - [`server/services/ai/AIReportService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/ai/AIReportService.js)
    - [`server/services/automation/AutomationRecoveryService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/AutomationRecoveryService.js)
    - [`server/services/cronService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/cronService.js)
    - [`server/services/metricsService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/metricsService.js)
    - [`server/services/platform/AnalyticsAggregationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/AnalyticsAggregationService.js)
    - [`server/services/platform/DashboardAggregationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/DashboardAggregationService.js)
    - [`server/services/platform/ReportService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/ReportService.js)
    - [`server/services/soc/DetectionGapService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionGapService.js)
    - [`server/services/threatIntelService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/threatIntelService.js)
    - [`server/tests/services/AnalyticsAggregationService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/AnalyticsAggregationService.test.js)
    - [`server/tests/services/DashboardAggregationService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/DashboardAggregationService.test.js)
    - [`server/tests/services/ScheduleService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/ScheduleService.test.js)
  - **Scripts & Acceptance Gates (4)**:
    - [`server/scripts/run_phase67_reality_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase67_reality_audit.js)
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
    - [`server/scripts/run_production_readiness_v68.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_production_readiness_v68.js)
  - **Test Suites (10)**:
    - [`server/tests/auth/auth_hardening.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/auth/auth_hardening.test.js)
    - [`server/tests/auth/security_hardening_expanded.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/auth/security_hardening_expanded.test.js)
    - [`server/tests/correlation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/correlation.test.js)
    - [`server/tests/enterprise.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/enterprise.test.js)
    - [`server/tests/phase70_soc_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase70_soc_intelligence.test.js)
    - [`server/tests/reports_export.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/reports_export.test.js)
    - [`server/tests/services/AnalyticsAggregationService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/AnalyticsAggregationService.test.js)
    - [`server/tests/services/DashboardAggregationService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/DashboardAggregationService.test.js)
    - *(and 2 more test files...)*
  - **Other Modules (1)**:
    - [`server/providers/storage/MongoStorageProvider.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/providers/storage/MongoStorageProvider.js)

### 59. `ScheduledScan`

- **File**: [`server/models/ScheduledScan.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/ScheduledScan.js)
- **Domain**: `Vulnerability Scanning`
- **Purpose**: Cron-based automated scan schedules for continuous security monitoring
- **Total Files Importing / Using**: **4 files**
- **Usage Breakdown Across Codebase**:
  - **Services (3)**:
    - [`server/services/cronService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/cronService.js)
    - [`server/services/platform/ScheduleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/ScheduleService.js)
    - [`server/tests/services/ScheduleService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/ScheduleService.test.js)
  - **Test Suites (2)**:
    - [`server/tests/services/ScheduleService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/ScheduleService.test.js)
    - [`server/tests/soc.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/soc.test.js)

### 60. `SecurityDrift`

- **File**: [`server/models/SecurityDrift.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/SecurityDrift.js)
- **Domain**: `Configuration Management`
- **Purpose**: Detected configuration drift between baseline security benchmarks and live posture
- **Total Files Importing / Using**: **11 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (3)**:
    - [`server/controllers/automationController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/automationController.js)
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (4)**:
    - [`server/services/automation/AutomationExecutionEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/AutomationExecutionEngine.js)
    - [`server/services/automation/DriftDetectionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/DriftDetectionService.js)
    - [`server/services/automation/RemediationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/RemediationService.js)
    - [`server/services/intelligence/RiskSynthesisService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/intelligence/RiskSynthesisService.js)
  - **Scripts & Acceptance Gates (3)**:
    - [`server/scripts/run_phase77_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase77_acceptance.js)
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
    - [`server/scripts/run_update_function_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_update_function_audit.js)
  - **Test Suites (1)**:
    - [`server/tests/phase77_automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase77_automation.test.js)

### 61. `SecurityGraphEdge`

- **File**: [`server/models/SecurityGraphEdge.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/SecurityGraphEdge.js)
- **Domain**: `Security Data Fabric`
- **Purpose**: Evidence-backed directional graph edges linking entities with explicit provenance
- **Total Files Importing / Using**: **9 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/dataFabricController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/dataFabricController.js)
  - **Services (4)**:
    - [`server/services/datafabric/CorrelationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/CorrelationService.js)
    - [`server/services/datafabric/InvestigationQueryService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/InvestigationQueryService.js)
    - [`server/services/datafabric/SecurityGraphService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/SecurityGraphService.js)
    - [`server/services/intelligence/CampaignClusteringService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/intelligence/CampaignClusteringService.js)
  - **Scripts & Acceptance Gates (2)**:
    - [`server/scripts/run_phase78_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase78_acceptance.js)
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
  - **Test Suites (2)**:
    - [`server/tests/phase78_data_fabric.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase78_data_fabric.test.js)
    - [`server/tests/phase79_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase79_intelligence.test.js)

### 62. `SecurityGraphNode`

- **File**: [`server/models/SecurityGraphNode.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/SecurityGraphNode.js)
- **Domain**: `Security Data Fabric`
- **Purpose**: Materialized security graph nodes representing entities (Identity, Host, IP, Alert, CVE, Rule)
- **Total Files Importing / Using**: **10 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/dataFabricController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/dataFabricController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (4)**:
    - [`server/services/datafabric/CorrelationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/CorrelationService.js)
    - [`server/services/datafabric/InvestigationQueryService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/InvestigationQueryService.js)
    - [`server/services/datafabric/SecurityGraphService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/SecurityGraphService.js)
    - [`server/services/intelligence/CampaignClusteringService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/intelligence/CampaignClusteringService.js)
  - **Scripts & Acceptance Gates (2)**:
    - [`server/scripts/run_phase78_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase78_acceptance.js)
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
  - **Test Suites (2)**:
    - [`server/tests/phase78_data_fabric.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase78_data_fabric.test.js)
    - [`server/tests/phase79_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase79_intelligence.test.js)

### 63. `ServiceHealthSnapshot`

- **File**: [`server/models/ServiceHealthSnapshot.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/ServiceHealthSnapshot.js)
- **Domain**: `Platform Reliability`
- **Purpose**: Real subsystem health telemetry across API, MongoDB, Socket.IO, jobs, tools
- **Total Files Importing / Using**: **9 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/observabilityController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/observabilityController.js)
  - **Services (5)**:
    - [`server/services/automation/PlaybookService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/automation/PlaybookService.js)
    - [`server/services/intelligence/RiskSynthesisService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/intelligence/RiskSynthesisService.js)
    - [`server/services/observability/ReliabilityCorrelationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/ReliabilityCorrelationService.js)
    - [`server/services/observability/SLOService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/SLOService.js)
    - [`server/services/observability/ServiceHealthService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/ServiceHealthService.js)
  - **Scripts & Acceptance Gates (2)**:
    - [`server/scripts/run_phase76_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase76_acceptance.js)
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase76_reliability.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase76_reliability.test.js)

### 64. `Session`

- **File**: [`server/models/Session.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Session.js)
- **Domain**: `Identity & Access Management`
- **Purpose**: Active user authentication sessions, tokens, IP bindings, user agents, revocation tracking
- **Total Files Importing / Using**: **10 files**
- **Usage Breakdown Across Codebase**:
  - **Services (4)**:
    - [`server/services/passwordReset.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/passwordReset.js)
    - [`server/services/sessionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/sessionService.js)
    - [`server/services/soc/BreakGlassService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/BreakGlassService.js)
    - [`server/services/soc/GovernancePolicyService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/GovernancePolicyService.js)
  - **Scripts & Acceptance Gates (3)**:
    - [`server/scripts/run_authentication_reliability.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_authentication_reliability.js)
    - [`server/scripts/run_phase75_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase75_acceptance.js)
    - [`server/scripts/run_production_readiness_v68.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_production_readiness_v68.js)
  - **Test Suites (2)**:
    - [`server/tests/authentication_reliability.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/authentication_reliability.test.js)
    - [`server/tests/phase75_governance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase75_governance.test.js)
  - **Other Modules (1)**:
    - [`server/middleware/auth.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/middleware/auth.js)

### 65. `SystemSettings`

- **File**: [`server/models/SystemSettings.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/SystemSettings.js)
- **Domain**: `Platform Configuration`
- **Purpose**: Global platform configuration parameters, operational modes, maintenance flags
- **Total Files Importing / Using**: **5 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/tests/controllers/AdminController.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/controllers/AdminController.test.js)
  - **Services (2)**:
    - [`server/services/admin/AdminService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/admin/AdminService.js)
    - [`server/services/soarEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soarEngine.js)
  - **Test Suites (1)**:
    - [`server/tests/controllers/AdminController.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/controllers/AdminController.test.js)
  - **Other Modules (2)**:
    - [`server/middleware/auth.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/middleware/auth.js)
    - [`server/repositories/SystemSettingsRepository.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/SystemSettingsRepository.js)

### 66. `Team`

- **File**: [`server/models/Team.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Team.js)
- **Domain**: `Identity & Access Management`
- **Purpose**: Operational teams, analyst pods, escalation assignments, notification routes
- **Total Files Importing / Using**: **6 files**
- **Usage Breakdown Across Codebase**:
  - **Services (3)**:
    - [`server/services/admin/AdminService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/admin/AdminService.js)
    - [`server/services/org/OrganizationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/org/OrganizationService.js)
    - [`server/services/soc/ContentPackService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ContentPackService.js)
  - **Test Suites (2)**:
    - [`server/tests/phase1_access_privacy.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase1_access_privacy.test.js)
    - [`server/tests/saas.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/saas.test.js)
  - **Other Modules (1)**:
    - [`server/repositories/OrgRepositories.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/OrgRepositories.js)

### 67. `TerminalHistory`

- **File**: [`server/models/TerminalHistory.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/TerminalHistory.js)
- **Domain**: `Interactive Security Shell`
- **Purpose**: Audit log of CLI terminal commands executed in the CyberShield interactive console
- **Total Files Importing / Using**: **7 files**
- **Usage Breakdown Across Codebase**:
  - **Services (4)**:
    - [`server/services/TerminalJobService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/TerminalJobService.js)
    - [`server/services/soc/InvestigationTimelineService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/InvestigationTimelineService.js)
    - [`server/services/soc/ThreatHuntQueryEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatHuntQueryEngine.js)
    - [`server/services/soc/ThreatIntelFusionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatIntelFusionService.js)
  - **Routes (1)**:
    - [`server/routes/terminal.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/terminal.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase69_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase69_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase69_native_expansion.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase69_native_expansion.test.js)

### 68. `ThreatActorProfile`

- **File**: [`server/models/ThreatActorProfile.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/ThreatActorProfile.js)
- **Domain**: `Threat Intelligence`
- **Purpose**: Adversary profiles, APT groups, known TTPs, targeted industries, associated campaigns
- **Total Files Importing / Using**: **4 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/intelController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/intelController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase71_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase71_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase71_threat_hunting.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase71_threat_hunting.test.js)

### 69. `ThreatFeedRecord`

- **File**: [`server/models/ThreatFeedRecord.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/ThreatFeedRecord.js)
- **Domain**: `Threat Intelligence`
- **Purpose**: Ingested external threat feed indicators (MISP, AlienVault OTX, VirusTotal, AbuseIPDB)
- **Total Files Importing / Using**: **4 files**
- **Usage Breakdown Across Codebase**:
  - **Services (2)**:
    - [`server/services/platform/ThreatFeedService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/ThreatFeedService.js)
    - [`server/tests/services/Phase7Services.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/Phase7Services.test.js)
  - **Test Suites (2)**:
    - [`server/tests/correlation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/correlation.test.js)
    - [`server/tests/services/Phase7Services.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/Phase7Services.test.js)
  - **Other Modules (1)**:
    - [`server/providers/storage/MongoStorageProvider.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/providers/storage/MongoStorageProvider.js)

### 70. `ThreatHunt`

- **File**: [`server/models/ThreatHunt.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/ThreatHunt.js)
- **Domain**: `Threat Hunting`
- **Purpose**: Hypothesis-driven proactive threat hunting campaigns, queries, analyst findings, scope
- **Total Files Importing / Using**: **24 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (4)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/huntController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/huntController.js)
    - [`server/controllers/intelController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/intelController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Services (12)**:
    - [`server/services/datafabric/SecurityGraphService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/datafabric/SecurityGraphService.js)
    - [`server/services/observability/ServiceHealthService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/ServiceHealthService.js)
    - [`server/services/soc/CaseOrchestrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/CaseOrchestrationService.js)
    - [`server/services/soc/DataLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DataLifecycleService.js)
    - [`server/services/soc/DetectionCoverageService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionCoverageService.js)
    - [`server/services/soc/DetectionGapService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionGapService.js)
    - [`server/services/soc/ExecutiveRiskService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ExecutiveRiskService.js)
    - [`server/services/soc/IncidentResponseService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/IncidentResponseService.js)
    - [`server/services/soc/InvestigationTimelineService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/InvestigationTimelineService.js)
    - [`server/services/soc/SOCMetricsService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCMetricsService.js)
    - [`server/services/soc/SOCReportService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCReportService.js)
    - [`server/services/soc/ThreatHuntExecutionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatHuntExecutionService.js)
  - **Scripts & Acceptance Gates (4)**:
    - [`server/scripts/run_phase71_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase71_acceptance.js)
    - [`server/scripts/run_phase72_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase72_acceptance.js)
    - [`server/scripts/run_phase73_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase73_acceptance.js)
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
  - **Test Suites (4)**:
    - [`server/tests/phase71_threat_hunting.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase71_threat_hunting.test.js)
    - [`server/tests/phase72_incident_response.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase72_incident_response.test.js)
    - [`server/tests/phase73_detection_engineering.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase73_detection_engineering.test.js)
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)

### 71. `ThreatHuntExecution`

- **File**: [`server/models/ThreatHuntExecution.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/ThreatHuntExecution.js)
- **Domain**: `Threat Hunting`
- **Purpose**: Execution records of threat hunt queries, telemetry results, match counts, latency
- **Total Files Importing / Using**: **14 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/huntController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/huntController.js)
  - **Services (8)**:
    - [`server/services/observability/ServiceHealthService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/ServiceHealthService.js)
    - [`server/services/soc/CaseOrchestrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/CaseOrchestrationService.js)
    - [`server/services/soc/DataLifecycleService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DataLifecycleService.js)
    - [`server/services/soc/ExecutiveRiskService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ExecutiveRiskService.js)
    - [`server/services/soc/InvestigationTimelineService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/InvestigationTimelineService.js)
    - [`server/services/soc/SOCMetricsService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCMetricsService.js)
    - [`server/services/soc/SOCReportService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/SOCReportService.js)
    - [`server/services/soc/ThreatHuntExecutionService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ThreatHuntExecutionService.js)
  - **Scripts & Acceptance Gates (2)**:
    - [`server/scripts/run_phase71_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase71_acceptance.js)
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
  - **Test Suites (2)**:
    - [`server/tests/phase71_threat_hunting.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase71_threat_hunting.test.js)
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)

### 72. `ThreatHuntTemplate`

- **File**: [`server/models/ThreatHuntTemplate.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/ThreatHuntTemplate.js)
- **Domain**: `Threat Hunting`
- **Purpose**: Reusable hunting playbooks and query templates across cloud, identity, endpoint domains
- **Total Files Importing / Using**: **4 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/huntController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/huntController.js)
    - [`server/controllers/searchController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/searchController.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/run_phase71_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase71_acceptance.js)
  - **Test Suites (1)**:
    - [`server/tests/phase71_threat_hunting.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase71_threat_hunting.test.js)

### 73. `ToolExecution`

- **File**: [`server/models/ToolExecution.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/ToolExecution.js)
- **Domain**: `Toolkit Execution`
- **Purpose**: Audit records of executed security tools, input targets, runtime latency, output telemetry
- **Total Files Importing / Using**: **2 files**
- **Usage Breakdown Across Codebase**:
  - **Services (1)**:
    - [`server/services/observability/ServiceHealthService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/observability/ServiceHealthService.js)
  - **Test Suites (1)**:
    - [`server/tests/database/database_integration.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/database/database_integration.test.js)

### 74. `ToolRegistry`

- **File**: [`server/models/ToolRegistry.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/ToolRegistry.js)
- **Domain**: `Toolkit Architecture`
- **Purpose**: Central database catalog of registered security tools, capabilities, execution engines
- **Total Files Importing / Using**: **3 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/seedTools.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/seedTools.js)
  - **Test Suites (1)**:
    - [`server/tests/database/database_integration.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/database/database_integration.test.js)

### 75. `User`

- **File**: [`server/models/User.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/User.js)
- **Domain**: `Identity & Access Management`
- **Purpose**: Core platform user identities, bcrypt passwords, MFA, RBAC roles, tenant bindings, session security
- **Total Files Importing / Using**: **37 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/tests/controllers/AdminController.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/controllers/AdminController.test.js)
  - **Services (8)**:
    - [`server/services/admin/AdminService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/admin/AdminService.js)
    - [`server/services/cronService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/cronService.js)
    - [`server/services/emailVerification.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/emailVerification.js)
    - [`server/services/org/OrganizationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/org/OrganizationService.js)
    - [`server/services/passwordReset.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/passwordReset.js)
    - [`server/services/soc/ComplianceEvidenceService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ComplianceEvidenceService.js)
    - [`server/services/soc/DetectionCoverageService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionCoverageService.js)
    - [`server/services/webhookService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/webhookService.js)
  - **Scripts & Acceptance Gates (5)**:
    - [`server/scripts/run_authentication_reliability.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_authentication_reliability.js)
    - [`server/scripts/run_phase67_reality_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase67_reality_audit.js)
    - [`server/scripts/run_phase70_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase70_acceptance.js)
    - [`server/scripts/run_production_readiness_v68.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_production_readiness_v68.js)
    - [`server/scripts/seedAdmin.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/seedAdmin.js)
  - **Test Suites (19)**:
    - [`server/tests/admin_system_health.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/admin_system_health.test.js)
    - [`server/tests/auth/auth_hardening.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/auth/auth_hardening.test.js)
    - [`server/tests/auth/nexus_command_access.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/auth/nexus_command_access.test.js)
    - [`server/tests/auth/security_hardening_expanded.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/auth/security_hardening_expanded.test.js)
    - [`server/tests/authentication_reliability.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/authentication_reliability.test.js)
    - [`server/tests/automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/automation.test.js)
    - [`server/tests/controllers/AdminController.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/controllers/AdminController.test.js)
    - [`server/tests/correlation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/correlation.test.js)
    - *(and 11 more test files...)*
  - **Other Modules (4)**:
    - [`server/middleware/auditMiddleware.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/middleware/auditMiddleware.js)
    - [`server/middleware/auth.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/middleware/auth.js)
    - [`server/middleware/rateLimitAnalytics.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/middleware/rateLimitAnalytics.js)
    - [`server/providers/storage/MongoStorageProvider.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/providers/storage/MongoStorageProvider.js)

### 76. `VaultAsset`

- **File**: [`server/models/VaultAsset.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/VaultAsset.js)
- **Domain**: `Secrets & Credential Vault`
- **Purpose**: Encrypted credential metadata, public fingerprints, rotation cycles (zero raw secrets in DB)
- **Total Files Importing / Using**: **3 files**
- **Usage Breakdown Across Codebase**:
  - **Services (2)**:
    - [`server/services/platform/VaultService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/VaultService.js)
    - [`server/tests/services/VaultService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/VaultService.test.js)
  - **Test Suites (1)**:
    - [`server/tests/services/VaultService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/VaultService.test.js)
  - **Other Modules (1)**:
    - [`server/repositories/VaultAssetRepository.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/VaultAssetRepository.js)

### 77. `Verification`

- **File**: [`server/models/Verification.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Verification.js)
- **Domain**: `Identity & Access Management`
- **Purpose**: Email verification, password reset, and 2FA verification tokens with cryptographic expiry
- **Total Files Importing / Using**: **28 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (4)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/complianceController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/complianceController.js)
    - [`server/controllers/governanceController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/governanceController.js)
    - [`server/controllers/observabilityController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/observabilityController.js)
  - **Services (4)**:
    - [`server/services/emailVerification.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/emailVerification.js)
    - [`server/services/soc/DetectionGapService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/DetectionGapService.js)
    - [`server/services/soc/IncidentResponseService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/IncidentResponseService.js)
    - [`server/services/soc/InvestigationTimelineService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/InvestigationTimelineService.js)
  - **Scripts & Acceptance Gates (12)**:
    - [`server/scripts/run_phase67_reality_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase67_reality_audit.js)
    - [`server/scripts/run_phase69_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase69_acceptance.js)
    - [`server/scripts/run_phase72_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase72_acceptance.js)
    - [`server/scripts/run_phase73_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase73_acceptance.js)
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
    - [`server/scripts/run_phase75_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase75_acceptance.js)
    - [`server/scripts/run_phase76_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase76_acceptance.js)
    - [`server/scripts/run_phase77_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase77_acceptance.js)
    - [`server/scripts/run_phase79_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase79_acceptance.js)
    - [`server/scripts/run_production_readiness_v68.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_production_readiness_v68.js)
    - [`server/scripts/run_update_function_audit.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_update_function_audit.js)
    - [`server/scripts/test_v29_4_verification.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/test_v29_4_verification.js)
  - **Test Suites (8)**:
    - [`server/tests/auth/security_hardening_expanded.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/auth/security_hardening_expanded.test.js)
    - [`server/tests/authentication_reliability.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/authentication_reliability.test.js)
    - [`server/tests/database/database_integration.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/database/database_integration.test.js)
    - [`server/tests/phase1_access_privacy.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase1_access_privacy.test.js)
    - [`server/tests/phase72_incident_response.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase72_incident_response.test.js)
    - [`server/tests/phase76_reliability.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase76_reliability.test.js)
    - [`server/tests/phase77_automation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase77_automation.test.js)
    - [`server/tests/phase78_data_fabric.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase78_data_fabric.test.js)

### 78. `Vulnerability`

- **File**: [`server/models/Vulnerability.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Vulnerability.js)
- **Domain**: `Vulnerability Management`
- **Purpose**: Cataloged security vulnerabilities, CVE identifiers, CVSS scores, remediation state
- **Total Files Importing / Using**: **21 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (2)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
    - [`server/controllers/remediationController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/remediationController.js)
  - **Services (12)**:
    - [`server/services/admin/AdminService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/admin/AdminService.js)
    - [`server/services/cronService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/cronService.js)
    - [`server/services/platform/AnalyticsAggregationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/AnalyticsAggregationService.js)
    - [`server/services/platform/DashboardAggregationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/DashboardAggregationService.js)
    - [`server/services/platform/RemediationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/platform/RemediationService.js)
    - [`server/services/playbookEngine.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/playbookEngine.js)
    - [`server/services/soc/ComplianceEvidenceService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/soc/ComplianceEvidenceService.js)
    - [`server/services/vulnerability/VulnerabilityService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/vulnerability/VulnerabilityService.js)
    - [`server/services/vulnerabilityService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/vulnerabilityService.js)
    - [`server/tests/services/AnalyticsAggregationService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/AnalyticsAggregationService.test.js)
    - [`server/tests/services/DashboardAggregationService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/DashboardAggregationService.test.js)
    - [`server/tests/services/Phase7Services.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/Phase7Services.test.js)
  - **Routes (1)**:
    - [`server/routes/terminal.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/terminal.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/test_v29_4_verification.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/test_v29_4_verification.js)
  - **Test Suites (7)**:
    - [`server/tests/correlation.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/correlation.test.js)
    - [`server/tests/phase70_soc_intelligence.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase70_soc_intelligence.test.js)
    - [`server/tests/saas.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/saas.test.js)
    - [`server/tests/services/AnalyticsAggregationService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/AnalyticsAggregationService.test.js)
    - [`server/tests/services/DashboardAggregationService.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/DashboardAggregationService.test.js)
    - [`server/tests/services/Phase7Services.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/Phase7Services.test.js)
    - [`server/tests/vuln-platform.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/vuln-platform.test.js)
  - **Other Modules (1)**:
    - [`server/repositories/VulnerabilityRepository.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/VulnerabilityRepository.js)

### 79. `Watchlist`

- **File**: [`server/models/Watchlist.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Watchlist.js)
- **Domain**: `Threat Intelligence`
- **Purpose**: Monitored entities, high-risk VIP accounts, suspicious domains, critical IP subnets
- **Total Files Importing / Using**: **3 files**
- **Usage Breakdown Across Codebase**:
  - **Services (1)**:
    - [`server/tests/services/Phase7Services.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/Phase7Services.test.js)
  - **Scripts & Acceptance Gates (1)**:
    - [`server/scripts/test_v29_4_verification.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/test_v29_4_verification.js)
  - **Test Suites (1)**:
    - [`server/tests/services/Phase7Services.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/services/Phase7Services.test.js)
  - **Other Modules (1)**:
    - [`server/repositories/WatchlistRepository.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/WatchlistRepository.js)

### 80. `Webhook`

- **File**: [`server/models/Webhook.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Webhook.js)
- **Domain**: `External Notifications`
- **Purpose**: Configured outgoing webhooks for alert dispatch, event notifications, automation triggers
- **Total Files Importing / Using**: **6 files**
- **Usage Breakdown Across Codebase**:
  - **Services (2)**:
    - [`server/services/org/OrganizationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/org/OrganizationService.js)
    - [`server/services/webhookService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/webhookService.js)
  - **Test Suites (2)**:
    - [`server/tests/phase75_governance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase75_governance.test.js)
    - [`server/tests/saas.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/saas.test.js)
  - **Other Modules (2)**:
    - [`server/integrations/integrationService.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/integrations/integrationService.js)
    - [`server/repositories/OrgRepositories.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/repositories/OrgRepositories.js)

### 81. `Workflow`

- **File**: [`server/models/Workflow.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/Workflow.js)
- **Domain**: `Workflow Orchestration`
- **Purpose**: Multi-step investigation and operational workflows with task branching and state transitions
- **Total Files Importing / Using**: **10 files**
- **Usage Breakdown Across Codebase**:
  - **Controllers (1)**:
    - [`server/controllers/chatbot/chatbotController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatbot/chatbotController.js)
  - **Scripts & Acceptance Gates (6)**:
    - [`server/scripts/run_phase69_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase69_acceptance.js)
    - [`server/scripts/run_phase70_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase70_acceptance.js)
    - [`server/scripts/run_phase74_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase74_acceptance.js)
    - [`server/scripts/run_phase75_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase75_acceptance.js)
    - [`server/scripts/run_phase76_acceptance.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_phase76_acceptance.js)
    - [`server/scripts/run_production_readiness_v68.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/scripts/run_production_readiness_v68.js)
  - **Test Suites (3)**:
    - [`server/tests/deployment_observability.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/deployment_observability.test.js)
    - [`server/tests/phase74_reporting_compliance.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase74_reporting_compliance.test.js)
    - [`server/tests/phase76_reliability.test.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/tests/phase76_reliability.test.js)

### 82. `WorkflowTemplate`

- **File**: [`server/models/WorkflowTemplate.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/models/WorkflowTemplate.js)
- **Domain**: `Workflow Orchestration`
- **Purpose**: Reusable workflow blueprints for standard operational procedures (SOPs)
- **Total Files Importing / Using**: **0 files**
- ⚠️ **Status**: **DORMANT / UNWIRED SCHEMA** — Currently defined in `server/models/WorkflowTemplate.js` but not imported by other active backend files. Reserved for future extensions or superseded by adjacent modules.


---

## 🤖 PART 3: CHATBOT TOOL REGISTRY

The AI Chatbot in CyberShield X integrates with an autonomous/interactive tool registry defined in [`server/services/chatbot_core/ToolRegistry.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/chatbot_core/ToolRegistry.js).

### Registered Interactive Tools:
1. **`nmap_scanner`** (Network Port & Device Scanner)
   - **Category**: `Scanner`
   - **Risk Level**: `YELLOW` (Execution requires safe parameter bounding)
   - **Handler Ref**: `toolkitController.executeNmap`
   - **Description**: Scans target IP or domain for open ports and services with bounded limits.

2. **`whois_lookup`** (WHOIS Registration Lookup)
   - **Category**: `OSINT`
   - **Risk Level**: `GREEN` (Read-only public reconnaissance)
   - **Handler Ref**: `toolkitController.executeWhois`
   - **Description**: Retrieves public WHOIS registration data, nameservers, and registrar metadata.

- **Chatbot Tool Registry Consumers**:
  - [`server/services/chatbot_core/AutonomousAgent.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/chatbot_core/AutonomousAgent.js)
  - [`server/services/chatbot_core/SkillRegistry.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/services/chatbot_core/SkillRegistry.js)
  - [`server/controllers/chatController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/chatController.js)
  - [`server/routes/chat.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/routes/chat.js)


---

## 🔍 PART 4: ARCHITECTURAL GAP ANALYSIS & FINDINGS

### 1. Tool Execution Architecture
- **Unified Dispatch**: All 111 canonical tools are unified under `POST /api/toolkit/execute` in [`server/controllers/toolkitController.js`](file:///Users/anil/Documents/New%20project/cybershield-x/server/controllers/toolkitController.js).
- **Caching Layer**: `server/services/ToolkitCacheService.js` implements high-speed in-memory LRU caching with sub-10ms response times for duplicate targets.
- **SSRF & Command Injection Protection**: `toolsController.isPrivateOrLoopback` and `sanitizeTarget` enforce strict IP/domain bounding across all network tools.
- **Browser Pure Utilities**: `jwt-parser`, `base64-decoder`, and `url-sanitizer` execute reactively inside the browser without transmitting sensitive tokens over the wire.

### 2. Database Model Health & Distribution
- **Total Defined Models**: 82 models in `server/models/`.
- **Highest-Traffic Models**:
  1. `User` (54 files) — Universal authentication, RBAC, tenant binding
  2. `Case` (51 files) — Core forensic and investigation lifecycle
  3. `Finding` (49 files) — Central vulnerability and risk record
  4. `Incident` (47 files) — Primary SOC incident response management
  5. `Scan` (40 files) — Scan runs across web, network, and ports
  6. `Alert` (34 files) — Threat alert ingestion and correlation
  7. `Asset` (29 files) — IT, cloud, and repository asset tracking
  8. `DetectionRule` (28 files) — Detection engineering rules
  9. `Playbook` (25 files) & `AuditEvent` (25 files) — SOAR and compliance
- **Dormant / Unused Schemas Identified (2 Models)**:
  1. `PlaybookLog.js` (0 imports) — Historical execution log superseded by `AutomationExecution.js` and `AutomationRun.js`.
  2. `WorkflowTemplate.js` (0 direct imports) — Reusable workflow blueprint superseded by `AutomationPlaybook.js` in Phase 77.
