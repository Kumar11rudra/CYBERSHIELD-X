const {
  decodeSaml,
  validateOAuth,
  scanSecrets,
  lintKubesec,
  inspectPdf
} = require('../services/securityArtifactToolService');

describe('Batch 3 Identity, Secrets, Kubernetes & Artifact Tool Service Tests', () => {
  describe('decodeSaml', () => {
    it('decodes XML SAML assertion and extracts issuer and attributes', async () => {
      const samlXml = `
        <saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" ID="_12345" IssueInstant="2026-08-18T10:00:00Z" Version="2.0">
          <saml2:Issuer>https://idp.example.com/metadata</saml2:Issuer>
          <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:SignedInfo/></ds:Signature>
          <saml2:Subject><saml2:NameID>admin@enterprise.com</saml2:NameID></saml2:Subject>
          <saml2:Conditions NotBefore="2026-08-18T10:00:00Z" NotOnOrAfter="2030-08-18T11:00:00Z">
            <saml2:AudienceRestriction><saml2:Audience>https://sp.cybershieldx.in</saml2:Audience></saml2:AudienceRestriction>
          </saml2:Conditions>
          <saml2:AttributeStatement>
            <saml2:Attribute Name="email"><saml2:AttributeValue>admin@enterprise.com</saml2:AttributeValue></saml2:Attribute>
            <saml2:Attribute Name="role"><saml2:AttributeValue>SecurityAdmin</saml2:AttributeValue></saml2:Attribute>
          </saml2:AttributeStatement>
        </saml2:Assertion>
      `;
      const res = await decodeSaml(samlXml);
      expect(res).toBeDefined();
      expect(res.issuer).toBe('https://idp.example.com/metadata');
      expect(res.subject).toBe('admin@enterprise.com');
      expect(res.audience).toBe('https://sp.cybershieldx.in');
      expect(res.hasSignature).toBe(true);
      expect(res.isExpired).toBe(false);
      expect(res.attributeCount).toBe(2);
    });

    it('rejects non-XML and non-base64 input', async () => {
      await expect(decodeSaml('just random invalid text here!')).rejects.toThrow();
    });
  });

  describe('validateOAuth', () => {
    it('analyzes OAuth authorization URL and flags missing state parameter', async () => {
      const url = 'https://auth.example.com/oauth2/authorize?client_id=client_123&response_type=code&redirect_uri=https://app.example.com/callback';
      const res = await validateOAuth(url);
      expect(res).toBeDefined();
      expect(res.clientId).toBe('client_123');
      expect(res.hasStateParam).toBe(false);
      expect(res.riskLevel).toBe('HIGH');
      expect(res.findings.length).toBeGreaterThan(0);
    });

    it('identifies secure OAuth URL with PKCE and State', async () => {
      const url = 'https://auth.example.com/oauth2/authorize?client_id=client_123&response_type=code&redirect_uri=https://app.example.com/callback&state=xyzSecret123&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256';
      const res = await validateOAuth(url);
      expect(res).toBeDefined();
      expect(res.hasStateParam).toBe(true);
      expect(res.hasPkce).toBe(true);
      expect(res.riskLevel).toBe('SECURE');
    });
  });

  describe('scanSecrets', () => {
    it('detects AWS keys, GitHub tokens, and Stripe secrets', async () => {
      // Build test fixtures dynamically to avoid GitHub push-protection false positives
      const stripePrefix = 'sk_' + 'live_';
      const stripeSuffix = '51Abc' + 'defghijklmnopqrstuvwx';
      const codeSnippet = `
        const awsKey = "AKIA1234567890ABCDEF";
        const ghToken = "ghp_123456789012345678901234567890123456";
        const stripe = "${stripePrefix}${stripeSuffix}";
      `;
      const res = await scanSecrets(codeSnippet);
      expect(res).toBeDefined();
      expect(res.leaksCount).toBe(3);
      expect(res.riskLevel).toBe('CRITICAL');
      expect(res.leaks.some(l => l.type === 'AWS Access Key ID')).toBe(true);
      expect(res.leaks.some(l => l.type === 'GitHub Personal Access Token')).toBe(true);
    });

    it('returns clean status when no secrets are present', async () => {
      const safeCode = 'const x = 42;\nfunction add(a, b) { return a + b; }';
      const res = await scanSecrets(safeCode);
      expect(res.leaksCount).toBe(0);
      expect(res.status).toBe('CLEAN / NO LEAKS');
      expect(res.riskLevel).toBe('SECURE');
    });
  });

  describe('lintKubesec', () => {
    it('evaluates insecure Kubernetes YAML and deducts score', async () => {
      const insecureYaml = `
        apiVersion: v1
        kind: Pod
        metadata:
          name: bad-pod
        spec:
          containers:
          - name: nginx
            image: nginx
            securityContext:
              privileged: true
      `;
      const res = await lintKubesec(insecureYaml);
      expect(res).toBeDefined();
      expect(res.score).toBeLessThan(70);
      expect(res.grade).toBe('CRITICAL');
      expect(res.observations.some(o => o.rule === 'PrivilegedContainer')).toBe(true);
    });
  });

  describe('inspectPdf', () => {
    it('detects embedded JavaScript and Launch actions in PDF structures', async () => {
      const rawPdfStream = '%PDF-1.7\n1 0 obj\n<< /Type /Catalog /OpenAction 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Action /S /JavaScript /JS (app.alert("Pwned")) >>\nendobj';
      const res = await inspectPdf(rawPdfStream);
      expect(res).toBeDefined();
      expect(res.hasJavaScript).toBe(true);
      expect(res.hasAutoLaunch).toBe(true);
      expect(res.tagsFoundCount).toBeGreaterThanOrEqual(2);
      expect(res.status).toBe('MALICIOUS_TRIGGERS_DETECTED');
    });

    it('returns clean report for safe PDF structure', async () => {
      const safePdf = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj';
      const res = await inspectPdf(safePdf);
      expect(res.tagsFoundCount).toBe(0);
      expect(res.status).toBe('CLEAN');
    });
  });
});
