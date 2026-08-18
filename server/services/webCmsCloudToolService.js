/**
 * 🛠️ WebCmsCloudToolService
 * Execution engines for Batch 4 Security Tools:
 * - WhatWeb Technology Fingerprint Scanner (whatweb)
 * - Dirsearch Sensitive Path Prober (dirsearch)
 * - WPScan WordPress Security Auditor (wpscan)
 * - IAM Policy Security Linter (iam-policy-audit)
 * - JWT Strength & Algorithm Auditor (jwt-strength)
 */

const axios = require('axios');

/**
 * 1. WhatWeb Technology Fingerprint Scanner
 */
async function scanWhatWeb(targetUrl) {
  let url = targetUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const startTime = Date.now();
  let headers = {};
  let body = '';
  let status = 200;

  try {
    const res = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      maxRedirects: 3,
      validateStatus: () => true
    });
    headers = res.headers || {};
    body = typeof res.data === 'string' ? res.data : JSON.stringify(res.data || '');
    status = res.status;
  } catch (err) {
    // If request fails, return basic probe structure
    body = '';
  }

  const latencyMs = `${Date.now() - startTime}ms`;
  const lowerBody = body.toLowerCase();

  const technologies = [];

  // Web Server / Cloud
  const serverHeader = headers['server'] || headers['x-powered-by'] || '';
  if (serverHeader) {
    technologies.push({ category: 'Web Server', name: serverHeader, confidence: '100%' });
  } else if (headers['cf-ray'] || headers['cf-cache-status']) {
    technologies.push({ category: 'CDN / Proxy', name: 'Cloudflare', confidence: '100%' });
  }

  // CMS Detection
  if (lowerBody.includes('/wp-content/') || lowerBody.includes('/wp-includes/')) {
    technologies.push({ category: 'CMS', name: 'WordPress', confidence: '99%' });
  } else if (lowerBody.includes('drupal.settings') || lowerBody.includes('/sites/default/files')) {
    technologies.push({ category: 'CMS', name: 'Drupal', confidence: '95%' });
  } else if (lowerBody.includes('/media/jui/') || lowerBody.includes('joomla')) {
    technologies.push({ category: 'CMS', name: 'Joomla', confidence: '95%' });
  } else if (lowerBody.includes('cdn.shopify.com')) {
    technologies.push({ category: 'E-Commerce CMS', name: 'Shopify', confidence: '99%' });
  }

  // JavaScript Frameworks & Libraries
  if (lowerBody.includes('_next/static') || lowerBody.includes('__next')) {
    technologies.push({ category: 'JavaScript Framework', name: 'Next.js (React)', confidence: '98%' });
  } else if (lowerBody.includes('react') || lowerBody.includes('react-dom')) {
    technologies.push({ category: 'JavaScript Library', name: 'React', confidence: '90%' });
  }
  if (lowerBody.includes('vue') || lowerBody.includes('v-bind') || lowerBody.includes('v-for')) {
    technologies.push({ category: 'JavaScript Framework', name: 'Vue.js', confidence: '85%' });
  }
  if (lowerBody.includes('jquery') || lowerBody.includes('jquery.min.js')) {
    technologies.push({ category: 'JavaScript Library', name: 'jQuery', confidence: '95%' });
  }
  if (lowerBody.includes('bootstrap') || lowerBody.includes('bootstrap.min.css')) {
    technologies.push({ category: 'CSS Framework', name: 'Bootstrap', confidence: '95%' });
  }
  if (lowerBody.includes('tailwind') || lowerBody.includes('tailwindcss')) {
    technologies.push({ category: 'CSS Framework', name: 'Tailwind CSS', confidence: '90%' });
  }

  // Analytics & Tracking
  if (lowerBody.includes('google-analytics.com') || lowerBody.includes('gtag(') || lowerBody.includes('googletagmanager.com')) {
    technologies.push({ category: 'Analytics', name: 'Google Analytics / GTM', confidence: '99%' });
  }

  return {
    target: url,
    httpStatus: status,
    latency: latencyMs,
    totalTechnologiesFound: technologies.length,
    technologies,
    summary: technologies.length > 0
      ? `Fingerprinted ${technologies.length} web technologies and framework signatures on target.`
      : 'Target server returned minimal signature fingerprints. Security obfuscation or generic static rendering in place.'
  };
}

/**
 * 2. Dirsearch Sensitive Path Prober
 */
async function probeDirsearch(targetUrl) {
  let baseUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(baseUrl)) {
    baseUrl = `https://${baseUrl}`;
  }
  baseUrl = baseUrl.replace(/\/+$/, '');

  const SENSITIVE_PATHS = [
    { path: '/robots.txt', label: 'Robots Crawl Policy', risk: 'INFO' },
    { path: '/.well-known/security.txt', label: 'Security Disclosure Policy', risk: 'INFO' },
    { path: '/sitemap.xml', label: 'Site Map XML', risk: 'INFO' },
    { path: '/.env', label: 'Environment Config File', risk: 'CRITICAL' },
    { path: '/.git/HEAD', label: 'Git Version Repository', risk: 'CRITICAL' },
    { path: '/admin', label: 'Admin Portal', risk: 'MEDIUM' },
    { path: '/wp-login.php', label: 'WordPress Login Page', risk: 'MEDIUM' },
    { path: '/swagger.json', label: 'OpenAPI / Swagger Spec', risk: 'HIGH' },
    { path: '/api/v1', label: 'API Base Endpoint', risk: 'INFO' },
    { path: '/server-status', label: 'Apache Server Status', risk: 'HIGH' }
  ];

  const results = [];
  let accessibleCount = 0;

  for (const item of SENSITIVE_PATHS) {
    const probeUrl = `${baseUrl}${item.path}`;
    try {
      const resp = await axios.get(probeUrl, {
        timeout: 2500,
        headers: { 'User-Agent': 'CyberShield-Dirsearch/1.0' },
        maxRedirects: 2,
        validateStatus: () => true
      });

      const isFound = resp.status >= 200 && resp.status < 400;
      if (isFound) accessibleCount++;

      results.push({
        path: item.path,
        label: item.label,
        status: resp.status,
        accessible: isFound,
        risk: isFound ? item.risk : 'SAFE'
      });
    } catch {
      results.push({
        path: item.path,
        label: item.label,
        status: 'Timeout/Blocked',
        accessible: false,
        risk: 'SAFE'
      });
    }
  }

  return {
    baseUrl,
    pathsProbed: SENSITIVE_PATHS.length,
    accessibleCount,
    paths: results,
    summary: accessibleCount > 0
      ? `Discovered ${accessibleCount} accessible path(s). Review exposed files to prevent sensitive data leakage.`
      : 'All tested sensitive configuration paths and administrative routes returned 404/403 (Protected).'
  };
}

/**
 * 3. WPScan WordPress Security Auditor
 */
async function auditWpScan(targetUrl) {
  let url = targetUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  url = url.replace(/\/+$/, '');

  let isWordPress = false;
  let wpVersion = 'Hidden / Undetected';
  let xmlRpcActive = false;
  let enumeratedUsers = [];
  const findings = [];

  try {
    // 1. Check main page for WP generator / paths
    const homeRes = await axios.get(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'CyberShield-WPScan/1.0' },
      validateStatus: () => true
    });
    const html = typeof homeRes.data === 'string' ? homeRes.data : '';

    if (html.includes('/wp-content/') || html.includes('/wp-includes/')) {
      isWordPress = true;
    }

    const versionMatch = html.match(/<meta\s+name=["']generator["']\s+content=["']WordPress\s+([0-9.]+)["']/i);
    if (versionMatch) {
      wpVersion = versionMatch[1];
      findings.push({
        severity: 'MEDIUM',
        issue: `Exposed WordPress Core Version (${wpVersion})`,
        recommendation: 'Remove version generator meta tags from theme header to prevent automated CVE targeting.'
      });
    }
  } catch {}

  // 2. Check XML-RPC
  try {
    const xmlRpcRes = await axios.post(`${url}/xmlrpc.php`, '<methodCall><methodName>system.listMethods</methodName></methodCall>', {
      timeout: 3000,
      headers: { 'Content-Type': 'text/xml' },
      validateStatus: () => true
    });
    if (xmlRpcRes.status === 200 && typeof xmlRpcRes.data === 'string' && xmlRpcRes.data.includes('methodResponse')) {
      xmlRpcActive = true;
      findings.push({
        severity: 'HIGH',
        issue: 'Active XML-RPC Endpoint (/xmlrpc.php)',
        recommendation: 'Disable XML-RPC via web server rules or security plugins to prevent brute-force amplification and DDoS attacks.'
      });
    }
  } catch {}

  // 3. User Enumeration via REST API
  try {
    const usersRes = await axios.get(`${url}/wp-json/wp/v2/users`, {
      timeout: 3000,
      validateStatus: () => true
    });
    if (usersRes.status === 200 && Array.isArray(usersRes.data)) {
      enumeratedUsers = usersRes.data.map(u => ({ id: u.id, name: u.name, slug: u.slug }));
      if (enumeratedUsers.length > 0) {
        findings.push({
          severity: 'HIGH',
          issue: `User Enumeration Vulnerability (${enumeratedUsers.length} author usernames exposed via REST API)`,
          recommendation: 'Disable public /wp-json/wp/v2/users endpoint for unauthenticated visitors.'
        });
      }
    }
  } catch {}

  return {
    target: url,
    isWordPress,
    wpVersion,
    xmlRpcActive,
    enumeratedUsersCount: enumeratedUsers.length,
    enumeratedUsers,
    riskLevel: findings.some(f => f.severity === 'HIGH') ? 'HIGH' : findings.length > 0 ? 'MEDIUM' : 'LOW',
    findingsCount: findings.length,
    findings,
    summary: isWordPress
      ? `WordPress audit complete. Identified ${findings.length} security observation(s) on target instance.`
      : 'Target does not appear to be running a standard WordPress CMS or has active security obfuscation.'
  };
}

/**
 * 4. IAM Policy Security Linter
 */
async function lintIamPolicy(policyInput) {
  let text = policyInput.trim();
  let policyObj;

  try {
    policyObj = JSON.parse(text);
  } catch {
    throw new Error('Enter a valid JSON AWS IAM Policy document.');
  }

  const statements = Array.isArray(policyObj.Statement) ? policyObj.Statement : policyObj.Statement ? [policyObj.Statement] : [];
  if (statements.length === 0) {
    throw new Error('IAM policy must contain at least one "Statement" element.');
  }

  let score = 100;
  const observations = [];

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const effect = stmt.Effect || 'Allow';
    const action = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action || ''];
    const resource = Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource || ''];

    if (effect === 'Allow') {
      // 1. Full AdministratorAccess (* action + * resource)
      if (action.includes('*') && resource.includes('*')) {
        score -= 40;
        observations.push({
          severity: 'CRITICAL',
          rule: 'FullAdminAccess',
          message: `Statement #${i + 1} grants full Administrator Access ("Action": "*", "Resource": "*").`
        });
      }

      // 2. Wildcard action on IAM
      if (action.some(a => a.toLowerCase() === 'iam:*' || a.toLowerCase() === 'sts:*')) {
        score -= 25;
        observations.push({
          severity: 'HIGH',
          rule: 'IamPrivilegeEscalation',
          message: `Statement #${i + 1} grants unrestricted IAM / STS actions allowing potential privilege escalation.`
        });
      }

      // 3. Unconstrained Resource
      if (resource.includes('*') && !action.includes('*')) {
        score -= 15;
        observations.push({
          severity: 'MEDIUM',
          rule: 'UnconstrainedResource',
          message: `Statement #${i + 1} applies actions to all resources ("Resource": "*"). Scope to specific ARNs.`
        });
      }

      // 4. PassRole risk
      if (action.some(a => a.toLowerCase() === 'iam:passrole') && resource.includes('*')) {
        score -= 20;
        observations.push({
          severity: 'HIGH',
          rule: 'DangerousPassRole',
          message: `Statement #${i + 1} allows iam:PassRole with wildcard Resource, enabling unauthorized service role assumption.`
        });
      }
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    grade: score >= 85 ? 'PASSED' : score >= 60 ? 'WARNING' : 'CRITICAL',
    statementCount: statements.length,
    observationsCount: observations.length,
    observations,
    summary: `IAM policy security score: ${score}/100 with ${observations.length} security observation(s).`
  };
}

/**
 * 5. JWT Strength & Algorithm Auditor
 */
async function auditJwtStrength(tokenInput) {
  const token = tokenInput.trim();
  const parts = token.split('.');

  if (parts.length < 2 || parts.length > 3) {
    throw new Error('Enter a valid 3-part JWT token (header.payload.signature).');
  }

  let header = {};
  let payload = {};

  try {
    header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf8'));
    payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
  } catch {
    throw new Error('Failed to decode Base64 URL components of the JWT.');
  }

  const findings = [];
  let strengthScore = 100;

  // 1. Check alg none
  const alg = header.alg ? header.alg.toLowerCase() : 'none';
  if (alg === 'none') {
    strengthScore -= 60;
    findings.push({
      severity: 'CRITICAL',
      issue: 'Vulnerable "alg: none" Algorithm',
      recommendation: 'Reject tokens signed with "none". Strictly enforce HMAC-SHA256 (HS256) or RSA (RS256/ES256).'
    });
  } else if (alg === 'hs256') {
    findings.push({
      severity: 'LOW',
      issue: 'Symmetric Signature Algorithm (HS256)',
      recommendation: 'For distributed microservices, prefer asymmetric signing (RS256 or ES256) so public keys can verify tokens without secret sharing.'
    });
  }

  // 2. Check expiration claim
  if (!payload.exp) {
    strengthScore -= 25;
    findings.push({
      severity: 'HIGH',
      issue: 'Missing Token Expiration ("exp" claim)',
      recommendation: 'Always set a short-lived expiration timestamp (e.g. 15–60 minutes) to prevent replay of stolen tokens.'
    });
  } else {
    const expDate = new Date(payload.exp * 1000);
    if (expDate < new Date()) {
      findings.push({
        severity: 'INFO',
        issue: 'Token is Expired',
        recommendation: `Expired on ${expDate.toISOString()}. Request a fresh token.`
      });
    }
  }

  // 3. Check for sensitive PII in claims
  const sensitiveKeys = ['password', 'secret', 'pass', 'ssn', 'credit_card', 'pin'];
  const exposedKeys = Object.keys(payload).filter(k => sensitiveKeys.includes(k.toLowerCase()));
  if (exposedKeys.length > 0) {
    strengthScore -= 20;
    findings.push({
      severity: 'HIGH',
      issue: `Sensitive Data Exposed in Payload (${exposedKeys.join(', ')})`,
      recommendation: 'JWT payloads are only Base64-encoded, not encrypted. Never store passwords, secrets, or PII in claims.'
    });
  }

  strengthScore = Math.max(0, Math.min(100, strengthScore));

  return {
    algorithm: header.alg || 'None',
    tokenType: header.typ || 'JWT',
    strengthScore: `${strengthScore}/100`,
    grade: strengthScore >= 80 ? 'STRONG' : strengthScore >= 50 ? 'MODERATE' : 'WEAK / CRITICAL',
    issuer: payload.iss || 'Not specified',
    subject: payload.sub || 'Not specified',
    expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Never (Missing)',
    findingsCount: findings.length,
    findings,
    summary: `JWT cryptographic strength score: ${strengthScore}/100. Algorithm: ${header.alg || 'None'} with ${findings.length} security observation(s).`
  };
}

module.exports = {
  scanWhatWeb,
  probeDirsearch,
  auditWpScan,
  lintIamPolicy,
  auditJwtStrength
};
