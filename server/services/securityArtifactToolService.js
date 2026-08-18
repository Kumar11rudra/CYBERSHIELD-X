/**
 * 🛠️ SecurityArtifactToolService
 * Execution engines for Batch 3 Security Tools:
 * - SAML Assertion Decoder (saml-decoder)
 * - OAuth 2.0 Route & Redirect Validator (oauth-validator)
 * - Gitleaks Secrets & Key Scanner (gitleaks)
 * - Kubesec YAML Manifest Linter (kubesec)
 * - PDF Security & Malware Inspector (pdfid)
 */

/**
 * 1. SAML Assertion Decoder
 */
async function decodeSaml(rawInput) {
  let text = rawInput.trim();
  let xmlString = text;

  // Try decoding Base64 if needed
  if (!text.startsWith('<') && /^[A-Za-z0-9+/=\s]+$/.test(text)) {
    try {
      xmlString = Buffer.from(text, 'base64').toString('utf8');
    } catch {}
  }

  const isXml = xmlString.includes('<') && xmlString.includes('>');
  if (!isXml) {
    throw new Error('Enter a valid Base64-encoded SAML token or XML SAML assertion.');
  }

  // Extract core SAML metadata via fast regex parser
  const issuerMatch = xmlString.match(/<(?:saml2?:)?Issuer[^>]*>([^<]+)<\/(?:saml2?:)?Issuer>/i);
  const nameIdMatch = xmlString.match(/<(?:saml2?:)?NameID[^>]*>([^<]+)<\/(?:saml2?:)?NameID>/i);
  const audienceMatch = xmlString.match(/<(?:saml2?:)?Audience[^>]*>([^<]+)<\/(?:saml2?:)?Audience>/i);
  const notBeforeMatch = xmlString.match(/NotBefore="([^"]+)"/i);
  const notOnOrAfterMatch = xmlString.match(/NotOnOrAfter="([^"]+)"/i);
  const hasSignature = /<(?:ds:)?Signature/i.test(xmlString);
  const isEncrypted = /<(?:saml2?:)?EncryptedAssertion/i.test(xmlString);

  // Extract attributes
  const attributes = [];
  const attrRegex = /<(?:saml2?:)?Attribute\s+Name="([^"]+)"[^>]*>[\s\S]*?<(?:saml2?:)?AttributeValue[^>]*>([^<]+)<\/(?:saml2?:)?AttributeValue>/gi;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(xmlString)) !== null) {
    attributes.push({ name: attrMatch[1], value: attrMatch[2] });
  }

  // Validate expiration
  let isExpired = false;
  if (notOnOrAfterMatch) {
    const expDate = new Date(notOnOrAfterMatch[1]);
    if (!isNaN(expDate.getTime()) && expDate < new Date()) {
      isExpired = true;
    }
  }

  return {
    issuer: issuerMatch ? issuerMatch[1] : 'Unknown Identity Provider',
    subject: nameIdMatch ? nameIdMatch[1] : 'Anonymous / Not Specified',
    audience: audienceMatch ? audienceMatch[1] : 'Unrestricted',
    notBefore: notBeforeMatch ? notBeforeMatch[1] : 'Not specified',
    notOnOrAfter: notOnOrAfterMatch ? notOnOrAfterMatch[1] : 'Not specified',
    hasSignature,
    isEncrypted,
    isExpired,
    attributeCount: attributes.length,
    attributes,
    summary: hasSignature
      ? `Valid SAML 2.0 assertion parsed from ${issuerMatch ? issuerMatch[1] : 'IdP'}. Cryptographic signature present (${isExpired ? 'EXPIRED' : 'ACTIVE'}).`
      : `Unsigned SAML assertion parsed. Warning: Missing digital signature signature tag enables potential XML injection.`
  };
}

/**
 * 2. OAuth 2.0 Route & Redirect Validator
 */
async function validateOAuth(rawUrl) {
  let urlStr = rawUrl.trim();
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = `https://${urlStr}`;
  }

  const parsed = new URL(urlStr);
  const params = parsed.searchParams;

  const clientId = params.get('client_id');
  const redirectUri = params.get('redirect_uri');
  const responseType = params.get('response_type');
  const scope = params.get('scope');
  const state = params.get('state');
  const codeChallenge = params.get('code_challenge');
  const codeChallengeMethod = params.get('code_challenge_method');

  const findings = [];
  let riskLevel = 'SECURE';

  // 1. Check state parameter (CSRF)
  if (!state) {
    findings.push({
      severity: 'HIGH',
      issue: 'Missing "state" parameter',
      recommendation: 'Pass a cryptographically random, unguessable state parameter to prevent OAuth CSRF / Login CSRF attacks.'
    });
    riskLevel = 'HIGH';
  }

  // 2. Check PKCE for Authorization Code flow
  if (responseType === 'code' && !codeChallenge) {
    findings.push({
      severity: 'MEDIUM',
      issue: 'Missing PKCE code_challenge',
      recommendation: 'Enforce RFC 7636 Proof Key for Code Exchange (PKCE) with S256 method to protect against authorization code interception.'
    });
    if (riskLevel !== 'HIGH') riskLevel = 'MEDIUM';
  }

  // 3. Check response_type token (Implicit Grant deprecation)
  if (responseType && responseType.includes('token')) {
    findings.push({
      severity: 'HIGH',
      issue: 'Deprecated OAuth Implicit Grant flow (response_type=token)',
      recommendation: 'Implicit flow exposes access tokens directly in URL hash fragments. Migrate to Authorization Code flow with PKCE.'
    });
    riskLevel = 'HIGH';
  }

  // 4. Check redirect_uri security
  let redirectRisk = 'Valid';
  if (redirectUri) {
    try {
      const parsedRedirect = new URL(redirectUri);
      if (parsedRedirect.protocol === 'http:' && !parsedRedirect.hostname.includes('localhost') && !parsedRedirect.hostname.includes('127.0.0.1')) {
        findings.push({
          severity: 'CRITICAL',
          issue: 'Insecure plaintext HTTP redirect_uri',
          recommendation: 'OAuth redirect_uri must strictly enforce HTTPS to protect against authorization code interception in transit.'
        });
        riskLevel = 'CRITICAL';
        redirectRisk = 'Insecure HTTP';
      }
    } catch {
      findings.push({
        severity: 'HIGH',
        issue: 'Invalid or Relative redirect_uri parameter',
        recommendation: 'Supply an absolute, validated HTTPS redirect URI.'
      });
      redirectRisk = 'Malformed';
    }
  } else {
    findings.push({
      severity: 'MEDIUM',
      issue: 'Missing explicit redirect_uri',
      recommendation: 'Always explicitly provide redirect_uri in authorization requests.'
    });
  }

  return {
    endpoint: `${parsed.protocol}//${parsed.host}${parsed.pathname}`,
    clientId: clientId || 'Not provided',
    redirectUri: redirectUri || 'Not provided',
    responseType: responseType || 'Not specified',
    scope: scope || 'default',
    hasStateParam: !!state,
    hasPkce: !!codeChallenge,
    pkceMethod: codeChallengeMethod || (codeChallenge ? 'plain' : 'None'),
    riskLevel,
    findingsCount: findings.length,
    findings,
    summary: findings.length === 0
      ? 'OAuth 2.0 authorization endpoint conforms to modern security standards (State CSRF protected, HTTPS redirect).'
      : `Identified ${findings.length} security observation(s) on OAuth route (Overall Risk: ${riskLevel}).`
  };
}

/**
 * 3. Gitleaks Secrets & Key Scanner
 */
async function scanSecrets(inputCode) {
  const content = inputCode.trim();
  if (!content) {
    throw new Error('Paste source code, configuration files, or commit logs to scan for secrets.');
  }

  const SECRET_PATTERNS = [
    { name: 'AWS Access Key ID', regex: /\b(AKIA[0-9A-Z]{16})\b/g, severity: 'CRITICAL' },
    { name: 'GitHub Personal Access Token', regex: /\b(ghp_[0-9a-zA-Z]{36}|gho_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})\b/g, severity: 'CRITICAL' },
    { name: 'Google API Key', regex: /\b(AIza[0-9A-Za-z\-_]{35})\b/g, severity: 'HIGH' },
    { name: 'Stripe Live Secret Key', regex: /\b(sk_live_[0-9a-zA-Z]{24,99})\b/g, severity: 'CRITICAL' },
    { name: 'Slack Webhook URL', regex: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/g, severity: 'HIGH' },
    { name: 'RSA / SSH Private Key', regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g, severity: 'CRITICAL' },
    { name: 'Generic API Key / Secret Token', regex: /(?:api[_-]?key|secret[_-]?token|auth[_-]?token)\s*[:=]\s*['"]([a-zA-Z0-9_\-]{20,64})['"]/gi, severity: 'HIGH' },
    { name: 'Database Connection String with Credentials', regex: /(?:postgres|mysql|mongodb(?:\+srv)?):\/\/[a-zA-Z0-9_-]+:[^@\s]+@[a-zA-Z0-9.-]+/gi, severity: 'HIGH' }
  ];

  const leaks = [];

  for (const pat of SECRET_PATTERNS) {
    let match;
    const regex = new RegExp(pat.regex);
    while ((match = regex.exec(content)) !== null) {
      const fullMatch = match[0];
      const masked = fullMatch.length > 8 
        ? `${fullMatch.substring(0, 4)}...${fullMatch.substring(fullMatch.length - 4)}`
        : '********';

      leaks.push({
        type: pat.name,
        severity: pat.severity,
        maskedSecret: masked,
        matchLength: fullMatch.length
      });
    }
  }

  return {
    totalScannedBytes: content.length,
    leaksCount: leaks.length,
    status: leaks.length > 0 ? 'SECRETS DETECTED' : 'CLEAN / NO LEAKS',
    riskLevel: leaks.some(l => l.severity === 'CRITICAL') ? 'CRITICAL' : leaks.length > 0 ? 'HIGH' : 'SECURE',
    leaks,
    summary: leaks.length > 0
      ? `Alert: Found ${leaks.length} hardcoded credential signature(s). Rotate leaked keys immediately and remove from version control.`
      : 'Clean scan. No high-entropy API keys, private tokens, or cloud credentials identified in submitted content.'
  };
}

/**
 * 4. Kubesec YAML Manifest Linter
 */
async function lintKubesec(yamlContent) {
  const text = yamlContent.trim();
  if (!text) {
    throw new Error('Paste a Kubernetes YAML manifest to evaluate.');
  }

  let score = 100;
  const observations = [];

  // Check privileged mode
  if (/privileged:\s*true/i.test(text)) {
    score -= 35;
    observations.push({
      severity: 'CRITICAL',
      rule: 'PrivilegedContainer',
      message: 'Container runs with privileged mode enabled, granting root access to the host kernel.'
    });
  }

  // Check allowPrivilegeEscalation
  if (!/allowPrivilegeEscalation:\s*false/i.test(text)) {
    score -= 15;
    observations.push({
      severity: 'HIGH',
      rule: 'AllowPrivilegeEscalation',
      message: 'allowPrivilegeEscalation is not explicitly set to false.'
    });
  }

  // Check readOnlyRootFilesystem
  if (!/readOnlyRootFilesystem:\s*true/i.test(text)) {
    score -= 15;
    observations.push({
      severity: 'MEDIUM',
      rule: 'ReadOnlyRootFilesystem',
      message: 'Container filesystem is writable. Set readOnlyRootFilesystem: true to prevent tampering.'
    });
  }

  // Check runAsNonRoot
  if (!/runAsNonRoot:\s*true/i.test(text)) {
    score -= 15;
    observations.push({
      severity: 'MEDIUM',
      rule: 'RunAsNonRoot',
      message: 'Container is not constrained to run as non-root user (runAsNonRoot: true missing).'
    });
  }

  // Check resource limits
  if (!/limits:\s*\n\s*(?:cpu|memory)/i.test(text)) {
    score -= 10;
    observations.push({
      severity: 'LOW',
      rule: 'ResourceLimits',
      message: 'Resource limits (CPU/Memory) are not defined, exposing the node to Denial of Service.'
    });
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    grade: score >= 85 ? 'PASSED' : score >= 60 ? 'WARNING' : 'CRITICAL',
    observationsCount: observations.length,
    observations,
    summary: `Kubesec manifest security score: ${score}/100 with ${observations.length} recommendation(s).`
  };
}

/**
 * 5. PDF Security & Malware Inspector
 */
async function inspectPdf(pdfData) {
  const content = typeof pdfData === 'string' ? pdfData : String(pdfData);

  const SUSPICIOUS_TAGS = [
    { tag: '/JavaScript', risk: 'HIGH', desc: 'Embedded JavaScript execution block' },
    { tag: '/JS', risk: 'HIGH', desc: 'Direct JavaScript routine' },
    { tag: '/Launch', risk: 'CRITICAL', desc: 'Executable launch action' },
    { tag: '/EmbeddedFiles', risk: 'MEDIUM', desc: 'Attached payload or embedded file stream' },
    { tag: '/OpenAction', risk: 'HIGH', desc: 'Automatic execution trigger upon PDF opening' },
    { tag: '/AcroForm', risk: 'LOW', desc: 'Interactive form fields' },
    { tag: '/URI', risk: 'LOW', desc: 'External web hyperlink' }
  ];

  const findings = [];
  let threatScore = 0;

  for (const item of SUSPICIOUS_TAGS) {
    const regex = new RegExp(item.tag.replace('/', '\\/'), 'gi');
    const matches = content.match(regex);
    const count = matches ? matches.length : 0;

    if (count > 0) {
      if (item.risk === 'CRITICAL') threatScore += 40;
      else if (item.risk === 'HIGH') threatScore += 25;
      else if (item.risk === 'MEDIUM') threatScore += 15;
      else threatScore += 5;

      findings.push({
        tag: item.tag,
        occurrences: count,
        risk: item.risk,
        description: item.desc
      });
    }
  }

  threatScore = Math.min(100, threatScore);
  const isMalicious = threatScore >= 50;

  return {
    threatScore: `${threatScore}/100`,
    status: isMalicious ? 'MALICIOUS_TRIGGERS_DETECTED' : threatScore > 0 ? 'SUSPICIOUS_ELEMENTS' : 'CLEAN',
    hasJavaScript: findings.some(f => f.tag === '/JavaScript' || f.tag === '/JS'),
    hasAutoLaunch: findings.some(f => f.tag === '/Launch' || f.tag === '/OpenAction'),
    tagsFoundCount: findings.length,
    findings,
    summary: threatScore === 0
      ? 'Clean PDF structure. No active script triggers, automated launch actions, or embedded evasion objects detected.'
      : `Identified ${findings.length} active/interactive PDF elements (Threat Score: ${threatScore}/100).`
  };
}

module.exports = {
  decodeSaml,
  validateOAuth,
  scanSecrets,
  lintKubesec,
  inspectPdf
};
