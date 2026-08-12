/**
 * CyberShield X — Phase 22 & Phase 23 Test Suite
 * Validates Google / SEO Metadata Standards & GitHub Open Source Repository Governance Files.
 */

const fs = require('fs');
const path = require('path');

describe('Phase 22 & Phase 23 — SEO & Open Source Repository Standards', () => {
  const rootDir = path.join(__dirname, '../..');
  const publicDir = path.join(rootDir, 'client/public');

  it('1. Zero YOUR-DOMAIN.com placeholders in client/public/ index.html, sitemap.xml, robots.txt', () => {
    const indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
    const sitemapXml = fs.readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
    const robotsTxt = fs.readFileSync(path.join(publicDir, 'robots.txt'), 'utf8');

    expect(indexHtml).not.toContain('YOUR-DOMAIN.com');
    expect(sitemapXml).not.toContain('YOUR-DOMAIN.com');
    expect(robotsTxt).not.toContain('YOUR-DOMAIN.com');
  });

  it('2. sitemap.xml uses canonical Cloudflare Pages domain (https://cybershieldx.pages.dev)', () => {
    const sitemapXml = fs.readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
    expect(sitemapXml).toContain('https://cybershieldx.pages.dev/');
    expect(sitemapXml).toContain('https://cybershieldx.pages.dev/team');
    expect(sitemapXml).toContain('https://cybershieldx.pages.dev/login');
  });

  it('3. robots.txt references valid sitemap URL and disallows internal/admin routes', () => {
    const robotsTxt = fs.readFileSync(path.join(publicDir, 'robots.txt'), 'utf8');
    expect(robotsTxt).toContain('Sitemap: https://cybershieldx.pages.dev/sitemap.xml');
    expect(robotsTxt).toContain('Disallow: /dashboard/*');
    expect(robotsTxt).toContain('Disallow: /nexus-admin/*');
    expect(robotsTxt).toContain('Disallow: /api/*');
  });

  it('4. index.html contains canonical link, OpenGraph, Twitter Card, and Schema.org JSON-LD metadata', () => {
    const indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
    expect(indexHtml).toContain('<link rel="canonical" href="https://cybershieldx.pages.dev/" />');
    expect(indexHtml).toContain('property="og:title"');
    expect(indexHtml).toContain('property="og:url" content="https://cybershieldx.pages.dev"');
    expect(indexHtml).toContain('name="twitter:card"');
    expect(indexHtml).toContain('application/ld+json');
  });

  it('5. Open Source LICENSE file exists at project root and contains MIT License text', () => {
    const licensePath = path.join(rootDir, 'LICENSE');
    expect(fs.existsSync(licensePath)).toBe(true);

    const content = fs.readFileSync(licensePath, 'utf8');
    expect(content).toContain('MIT License');
    expect(content).toContain('CyberShield X');
  });

  it('6. CONTRIBUTING.md governance file exists at project root', () => {
    const contribPath = path.join(rootDir, 'CONTRIBUTING.md');
    expect(fs.existsSync(contribPath)).toBe(true);

    const content = fs.readFileSync(contribPath, 'utf8');
    expect(content).toContain('Contributing to CyberShield X');
    expect(content).toContain('Defensive Focus');
  });

  it('7. SECURITY.md policy file exists at project root', () => {
    const secPath = path.join(rootDir, 'SECURITY.md');
    expect(fs.existsSync(secPath)).toBe(true);

    const content = fs.readFileSync(secPath, 'utf8');
    expect(content).toContain('Security Policy');
    expect(content).toContain('SSRF Prevention');
  });

  it('8. GitHub issue templates exist (.github/ISSUE_TEMPLATE/)', () => {
    const bugPath = path.join(rootDir, '.github/ISSUE_TEMPLATE/bug_report.md');
    const featPath = path.join(rootDir, '.github/ISSUE_TEMPLATE/feature_request.md');

    expect(fs.existsSync(bugPath)).toBe(true);
    expect(fs.existsSync(featPath)).toBe(true);
  });

  it('9. GitHub pull request template exists (.github/PULL_REQUEST_TEMPLATE.md)', () => {
    const prPath = path.join(rootDir, '.github/PULL_REQUEST_TEMPLATE.md');
    expect(fs.existsSync(prPath)).toBe(true);

    const content = fs.readFileSync(prPath, 'utf8');
    expect(content).toContain('Verification Checklist');
  });

  it('10. Zero Vercel active deployment dependencies introduced', () => {
    const packageJson = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8');
    const serverPackageJson = fs.readFileSync(path.join(rootDir, 'server/package.json'), 'utf8');

    expect(packageJson).not.toContain('"vercel"');
    expect(serverPackageJson).not.toContain('"vercel"');
  });

  it('11. Zero secrets or API keys exposed in open source governance files', () => {
    const license = fs.readFileSync(path.join(rootDir, 'LICENSE'), 'utf8');
    const contrib = fs.readFileSync(path.join(rootDir, 'CONTRIBUTING.md'), 'utf8');
    const security = fs.readFileSync(path.join(rootDir, 'SECURITY.md'), 'utf8');

    const combined = license + contrib + security;
    expect(combined).not.toContain('mongodb+srv://');
    expect(combined).not.toContain('JWT_SECRET');
    expect(combined).not.toContain('ghp_');
  });
});
