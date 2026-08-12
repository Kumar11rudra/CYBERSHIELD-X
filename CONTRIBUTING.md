# Contributing to CyberShield X

Thank you for your interest in contributing to **CyberShield X**! We welcome bug reports, feature suggestions, documentation updates, and code contributions from the security community.

---

## 1. Code of Conduct & Principles

* **Defensive Focus**: All tools and features in CyberShield X are strictly **defensive and passive**. We do NOT accept contributions that implement offensive exploits, automated credential attacks, or unauthorized scanning tools.
* **Zero Fabrication**: All system health and threat intelligence metrics must be derived from verified runtime telemetry or authoritative APIs. Never generate fake or hardcoded scan data.
* **Token & Security Discipline**: Never commit API keys, secrets, JWT tokens, passwords, or connection strings.

---

## 2. Development Workflow

1. **Fork & Clone**: Clone your fork of the CyberShield X repository.
2. **Install Dependencies**:
   ```bash
   npm run install:all
   ```
3. **Branching**: Create a topic branch targeting `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Local Staging Check**:
   ```bash
   npm run verify:staging
   ```
5. **Run Test Suites**:
   ```bash
   cd server && npm test
   ```
6. **Submit Pull Request**: Open a PR with a clear summary of your changes using our PR template.

---

## 3. Reporting Issues

* Use [GitHub Issues](https://github.com/Kumar11rudra/CYBERSHIELD-X/issues) for bug reports and feature requests.
* For security vulnerability disclosures, please refer to [`SECURITY.md`](SECURITY.md) instead of public issue trackers.
