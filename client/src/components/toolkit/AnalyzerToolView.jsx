import React, { useState, useCallback } from 'react';
import { getToolConfig } from './toolConfig';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import usePdfExport from '../../hooks/usePdfExport';
import toast from 'react-hot-toast';

/**
 * AnalyzerToolView — Template for analysis tools (UrlEngine, WHOIS, SSL).
 *
 * Features:
 *  • Target input + "Analyze" button
 *  • Structured report cards (icon, label, value)
 *  • Risk score visualisation
 *  • Loading skeleton cards
 */
const AnalyzerToolView = ({ toolId }) => {
  const tool = getToolConfig(toolId);
  const [target, setTarget] = useState('');
  const [results, setResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { exportToolReportPdf } = usePdfExport();

  const handleExportPdf = () => {
    if (!user) {
      toast.error('You must login first to download the report.');
      navigate('/login');
      return;
    }
    exportToolReportPdf(tool.name, target, results, user);
  };

  const handleAnalyze = useCallback(async () => {
    const trimmed = target.trim();
    if (!trimmed) return;

    setResults(null);
    setError(null);
    setAnalyzing(true);

    try {
      const response = await api.post('/toolkit/execute', {
        toolId,
        target: trimmed,
      });
      const data = response.data;

      // Normalise the response into a renderable shape
      if (data?.report) {
        setResults(data.report);
      } else if (data?.results) {
        setResults(data.results);
      } else {
        setResults(data);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Create an account or sign in to use this security tool.');
      } else {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Analysis failed';
        setError(msg);
      }
    } finally {
      setAnalyzing(false);
    }
  }, [target, toolId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !analyzing) {
      handleAnalyze();
    }
  };

  if (!tool) return null;

  const toolColor = tool.color || '#00d4ff';

  /* ── Render helpers ── */
  const renderRiskScore = (score) => {
    if (score == null) return null;
    const numericScore = Number(score);
    if (Number.isNaN(numericScore)) return null;

    let barColor = '#00ff88';
    if (numericScore >= 70) barColor = '#ef4444';
    else if (numericScore >= 40) barColor = '#f59e0b';

    return (
      <div style={styles.riskSection}>
        <div style={styles.riskHeader}>
          <span style={styles.riskLabel}>Risk Score</span>
          <span style={{ ...styles.riskValue, color: barColor }}>{numericScore}/100</span>
        </div>
        <div style={styles.riskTrack}>
          <div
            style={{
              ...styles.riskFill,
              width: `${Math.min(numericScore, 100)}%`,
              background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
            }}
          />
        </div>
      </div>
    );
  };

  const renderResultCards = (data) => {
    if (!data) return null;

    // 1. Sherlock OSINT Username Profiler View
    if (data.profiles && data.totalScanned !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#10b981]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sherlock Identity Profiles</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
                Scanned: {data.totalScanned}
              </span>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-bold">
                Found: {data.foundCount}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {data.profiles.map((p, i) => (
              <div key={i} className={`p-3 rounded-xl border transition-all ${p.exists ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400' : 'bg-black/30 border-white/5 opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{p.platform}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${p.exists ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
                    {p.exists ? '● Found' : '○ Not Found'}
                  </span>
                </div>
                {p.exists ? (
                  <a
                    href={p.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline truncate block mt-2"
                  >
                    {p.profileUrl} ↗
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-600 block mt-2">No public account</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 2. CORS Configuration Auditor View
    if (data.tests && data.overallRisk) {
      const isCritical = data.overallRisk === 'CRITICAL' || data.overallRisk === 'HIGH';
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#0ea5e9]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">CORS Misconfiguration Audit</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${isCritical ? 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'}`}>
              Risk: {data.overallRisk}
            </span>
          </div>

          <div className="space-y-3">
            {data.tests.map((t, i) => (
              <div key={i} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{t.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${t.risk === 'CRITICAL' || t.risk === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {t.risk}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-slate-500">Tested Origin:</span> <span className="text-cyan-400">{t.testOrigin}</span></div>
                  <div><span className="text-slate-500">Allowed Origin:</span> <span className="text-amber-400">{t.allowOrigin}</span></div>
                  <div><span className="text-slate-500">Credentials:</span> <span className="text-white">{String(t.allowCredentials)}</span></div>
                </div>
                {t.issue && t.issue !== 'None' && (
                  <p className="text-[11px] text-red-400/90 bg-red-950/20 p-2 rounded border border-red-500/20 mt-1">
                    ⚠ {t.issue}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 3. CSP Policy Evaluator View
    if (data.grade && data.directives) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#10b981]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">CSP Security Policy Evaluation</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-black px-4 py-1 rounded-xl border ${data.grade.startsWith('A') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : data.grade === 'B' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
                {data.grade}
              </span>
              <span className="text-xs text-slate-400 font-bold">Score: {data.score}/100</span>
            </div>
          </div>

          {data.findings?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Security Observations ({data.findings.length})</span>
              {data.findings.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-start gap-2 text-xs">
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${f.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {f.severity}
                  </span>
                  <span className="text-slate-300">{f.message}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Configured Directives ({data.directiveCount})</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(data.directives).map(([dir, vals]) => (
                <div key={dir} className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-xs">
                  <span className="text-cyan-400 font-bold">{dir}:</span>
                  <span className="text-slate-300 ml-1.5 break-all">{Array.isArray(vals) ? vals.join(' ') : String(vals)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 4. AbuseIPDB Threat View
    if (data.abuseConfidenceScore && data.ipAddress) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#e11d48]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">IP Threat & Abuse Intelligence</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.riskLevel === 'CLEAN' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
              {data.riskLevel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Target IP</span>
              <div className="text-xs text-white font-bold">{data.ipAddress}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Abuse Confidence</span>
              <div className="text-xs text-red-400 font-bold">{data.abuseConfidenceScore}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">ISP / ASN</span>
              <div className="text-xs text-cyan-400 font-bold truncate">{data.isp}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Country</span>
              <div className="text-xs text-amber-400 font-bold">{data.country}</div>
            </div>
          </div>
        </div>
      );
    }

    // 5. SAML Assertion Decoder View
    if (data.issuer && data.hasSignature !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#0891b2]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">SAML 2.0 Assertion Inspection</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.hasSignature ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
                {data.hasSignature ? '✓ Signed' : '⚠ Unsigned'}
              </span>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.isExpired ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'}`}>
                {data.isExpired ? 'Expired' : 'Active'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Issuer (IdP)</span>
              <div className="text-xs text-cyan-400 font-bold break-all">{data.issuer}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Subject (NameID)</span>
              <div className="text-xs text-white font-bold break-all">{data.subject}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Audience Restriction</span>
              <div className="text-xs text-amber-400 font-bold break-all">{data.audience}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Valid Until (NotOnOrAfter)</span>
              <div className="text-xs text-slate-300 font-bold">{data.notOnOrAfter}</div>
            </div>
          </div>

          {data.attributes?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Extracted Claims & Attributes ({data.attributes.length})</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {data.attributes.map((attr, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-xs">
                    <span className="text-cyan-400 font-bold">{attr.name}:</span>
                    <span className="text-slate-200 ml-1.5 break-all">{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 6. OAuth 2.0 Route Validator View
    if (data.hasPkce !== undefined && data.hasStateParam !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#65a30d]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">OAuth 2.0 / OIDC Route Validation</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.riskLevel === 'SECURE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
              Risk: {data.riskLevel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">State CSRF Token</span>
              <div className={`text-xs font-bold ${data.hasStateParam ? 'text-emerald-400' : 'text-red-400'}`}>
                {data.hasStateParam ? '✓ Present' : '⚠ Missing (CSRF Risk)'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">PKCE Code Challenge</span>
              <div className={`text-xs font-bold ${data.hasPkce ? 'text-emerald-400' : 'text-amber-400'}`}>
                {data.hasPkce ? `✓ Enforced (${data.pkceMethod})` : '○ Not Configured'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Response Type</span>
              <div className="text-xs text-cyan-400 font-bold">{data.responseType}</div>
            </div>
          </div>

          {data.findings?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Security Vulnerabilities ({data.findings.length})</span>
              {data.findings.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-bold">⚠ {f.issue}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{f.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 7. Gitleaks Secrets Scanner View
    if (data.leaks && data.leaksCount !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#dc2626]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gitleaks Secrets & Credentials Scan</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.leaksCount === 0 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'}`}>
              {data.status} ({data.leaksCount})
            </span>
          </div>

          {data.leaks?.length > 0 ? (
            <div className="space-y-3">
              {data.leaks.map((leak, i) => (
                <div key={i} className="p-4 rounded-xl bg-black/40 border border-red-500/20 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{leak.type}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                        {leak.severity}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-amber-400">
                      Masked Secret: <span className="bg-white/5 px-2 py-0.5 rounded text-white font-bold">{leak.maskedSecret}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs">
              ✓ No hardcoded private keys, cloud access tokens, or unmasked secrets detected in submitted payload.
            </div>
          )}
        </div>
      );
    }

    // 8. Kubesec YAML Manifest Linter View
    if (data.observations && data.observationsCount !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#6366f1]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Kubesec Manifest Security Linter</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-black px-4 py-1 rounded-xl border ${data.grade === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : data.grade === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
                {data.score}/100
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Security Rule Audit ({data.observationsCount})</span>
            {data.observations.map((obs, i) => (
              <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-start gap-2 text-xs">
                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${obs.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : obs.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {obs.severity}
                </span>
                <div>
                  <span className="text-cyan-400 font-bold">{obs.rule}: </span>
                  <span className="text-slate-300">{obs.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 9. PDF Security & Malware Inspector View
    if (data.threatScore && data.hasJavaScript !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#f43f5e]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">PDF Malware & Exploit Structure Analysis</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.status === 'CLEAN' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'}`}>
              Threat: {data.threatScore}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Embedded JavaScript</span>
              <div className={`text-xs font-bold ${data.hasJavaScript ? 'text-red-400' : 'text-emerald-400'}`}>
                {data.hasJavaScript ? '⚠ Detected (/JavaScript | /JS)' : '✓ None'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Auto-Launch Triggers</span>
              <div className={`text-xs font-bold ${data.hasAutoLaunch ? 'text-red-400' : 'text-emerald-400'}`}>
                {data.hasAutoLaunch ? '⚠ Detected (/Launch | /OpenAction)' : '✓ None'}
              </div>
            </div>
          </div>

          {data.findings?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Identified Interactive Tags ({data.tagsFoundCount})</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.findings.map((f, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-cyan-400 font-bold">{f.tag}</span>
                      <span className="text-slate-400 ml-2 text-[11px]">{f.description}</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-white/5 text-slate-300">
                      x{f.occurrences}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 10. WhatWeb Technology Scanner View
    if (data.technologies && data.totalTechnologiesFound !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#f43f5e]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">WhatWeb Technology Fingerprint</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
                Technologies: {data.totalTechnologiesFound}
              </span>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-bold">
                ⚡ {data.latency}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.technologies.map((tech, i) => (
              <div key={i} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">{tech.category}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold">{tech.confidence}</span>
                </div>
                <div className="text-xs text-white font-bold truncate">{tech.name}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 11. Dirsearch Sensitive Path Prober View
    if (data.paths && data.pathsProbed !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#a855f7]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dirsearch Sensitive Path Probe</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 font-bold">
                Probed: {data.pathsProbed}
              </span>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.accessibleCount > 0 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
                Accessible: {data.accessibleCount}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {data.paths.map((p, i) => (
              <div key={i} className={`p-3 rounded-xl border flex items-center justify-between ${p.accessible ? 'bg-amber-950/20 border-amber-500/30' : 'bg-black/30 border-white/5'}`}>
                <div>
                  <div className="text-xs font-bold text-white">{p.path}</div>
                  <span className="text-[10px] text-slate-400">{p.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${p.status === 200 ? 'bg-emerald-500/20 text-emerald-400' : p.status === 403 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                    HTTP {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 12. WPScan WordPress Security Auditor View
    if (data.isWordPress !== undefined && data.enumeratedUsers !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#2563eb]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">WPScan WordPress Security Audit</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.isWordPress ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'bg-slate-800 text-slate-400 border-white/10'}`}>
              {data.isWordPress ? 'WordPress Detected' : 'Non-WordPress'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Core Version</span>
              <div className="text-xs text-white font-bold">{data.wpVersion}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">XML-RPC Status</span>
              <div className={`text-xs font-bold ${data.xmlRpcActive ? 'text-red-400' : 'text-emerald-400'}`}>
                {data.xmlRpcActive ? '⚠ Active (/xmlrpc.php)' : '✓ Inactive'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Exposed Authors</span>
              <div className="text-xs text-cyan-400 font-bold">{data.enumeratedUsersCount} author(s)</div>
            </div>
          </div>

          {data.findings?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Security Observations ({data.findingsCount})</span>
              {data.findings.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-bold">⚠ {f.issue}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${f.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{f.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 13. IAM Policy Security Linter View
    if (data.statementCount !== undefined && data.observations !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#8b5cf6]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">AWS IAM Policy Security Linter</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-black px-4 py-1 rounded-xl border ${data.grade === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : data.grade === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
                {data.score}/100
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Policy Security Observations ({data.observationsCount})</span>
            {data.observations.map((obs, i) => (
              <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-start gap-2 text-xs">
                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${obs.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {obs.severity}
                </span>
                <div>
                  <span className="text-cyan-400 font-bold">{obs.rule}: </span>
                  <span className="text-slate-300">{obs.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 14. JWT Strength & Signature Auditor View
    if (data.strengthScore && data.algorithm !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#06b6d4]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">JWT Cryptographic Strength & Claims Audit</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.grade === 'STRONG' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
              Grade: {data.grade} ({data.strengthScore})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Algorithm</span>
              <div className="text-xs text-cyan-400 font-bold">{data.algorithm}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Token Type</span>
              <div className="text-xs text-white font-bold">{data.tokenType}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Expires At</span>
              <div className="text-xs text-amber-400 font-bold truncate">{data.expiresAt}</div>
            </div>
          </div>

          {data.findings?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Security Observations ({data.findingsCount})</span>
              {data.findings.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-bold">⚠ {f.issue}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{f.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 15. Traceroute Network Hop Visualizer View
    if (data.hops && data.totalHops !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#10b981]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Traceroute Network Path & Latency Trace</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
                Hops: {data.totalHops}
              </span>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-bold">
                ⚡ {data.finalLatency}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {data.hops.map((h, i) => (
              <div key={i} className={`p-3 rounded-xl border flex items-center justify-between ${h.status === 'DESTINATION_REACHED' ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-black/30 border-white/5'}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${h.status === 'DESTINATION_REACHED' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-400'}`}>
                    {h.hop}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{h.ip}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">{h.type}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{h.hostname}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  {h.latency}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 16. BGP Route & RPKI Validator View
    if (data.originAsn && data.announcedPrefix !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#f97316]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">BGP Autonomous System & RPKI Validation</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.rpkiRoaStatus === 'VALID' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
              RPKI: {data.rpkiRoaStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Origin ASN</span>
              <div className="text-xs text-cyan-400 font-bold">{data.originAsn}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Organization</span>
              <div className="text-xs text-white font-bold truncate">{data.autonomousSystem}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Announced Prefix</span>
              <div className="text-xs text-amber-400 font-bold">{data.announcedPrefix}</div>
            </div>
          </div>

          {data.transitTier1Peers?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Upstream Tier-1 Transit Peers</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {data.transitTier1Peers.map((peer, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-xs text-slate-300 font-bold">
                    {peer}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 17. OpenAPI / Swagger Spec Linter View
    if (data.specTitle && data.totalEndpoints !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#10b981]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">OpenAPI / Swagger Spec Security Linter</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-black px-4 py-1 rounded-xl border ${data.grade === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : data.grade === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
                {data.securityScore}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Endpoints</span>
              <div className="text-xs text-white font-bold">{data.totalEndpoints} path(s)</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Global Security Block</span>
              <div className={`text-xs font-bold ${data.hasGlobalSecurity ? 'text-emerald-400' : 'text-red-400'}`}>
                {data.hasGlobalSecurity ? '✓ Configured' : '⚠ Missing (Public Defaults)'}
              </div>
            </div>
          </div>

          {data.findings?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Security Observations ({data.findingsCount})</span>
              {data.findings.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-bold">⚠ {f.rule}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{f.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 18. Semgrep SAST Static Code Auditor View
    if (data.totalLinesScanned !== undefined && data.vulnerabilitiesCount !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#f43f5e]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Semgrep SAST Static Code Vulnerability Audit</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.riskLevel === 'SECURE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
              Risk: {data.riskLevel}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Lines Scanned: {data.totalLinesScanned}
            </span>
            <span className={`px-3 py-1 rounded-lg font-bold ${data.vulnerabilitiesCount > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
              Findings: {data.vulnerabilitiesCount}
            </span>
          </div>

          {data.findings?.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Vulnerabilities Identified</span>
              {data.findings.map((f, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-black/50 border border-red-500/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-bold">⚠ {f.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold">{f.cwe}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">Line {f.line}</span>
                  </div>
                  <div className="p-2 rounded bg-black/80 border border-white/10 text-[11px] text-slate-300 overflow-x-auto">
                    <code>{f.snippet}</code>
                  </div>
                  <p className="text-slate-400 text-[11px]">{f.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 19. Dependency-Track SBOM & License Auditor View
    if (data.totalPackagesAudited !== undefined && data.alerts !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#8b5cf6]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dependency-Track SBOM & Package CVE Audit</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.riskLevel === 'SECURE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
              Risk: {data.riskLevel}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Packages Audited: {data.totalPackagesAudited}
            </span>
            <span className={`px-3 py-1 rounded-lg font-bold ${data.vulnerabilitiesCount > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
              Vulnerable Packages: {data.vulnerabilitiesCount}
            </span>
          </div>

          {data.alerts?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Vulnerable Dependencies Identified</span>
              {data.alerts.map((a, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">{a.package} ({a.installedVersion})</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold">{a.cve}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold">Fix in: {a.fixedIn}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{a.advisory}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 20. YARA Signature Matcher View
    if (data.matchedRules !== undefined && data.matchedRulesCount !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#ea580c]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">YARA Malware Signature Rule Matcher</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.threatLevel === 'CLEAN' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'}`}>
              Threat: {data.threatLevel}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Matched Rule Signatures ({data.matchedRulesCount})</span>
            {data.matchedRules.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-400 font-bold flex items-center gap-2">
                <span>✓</span> Zero malware signatures matched. File strings appear benign.
              </div>
            ) : (
              data.matchedRules.map((r, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-red-500/20 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-bold">⚠ {r.rule}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-red-500/20 text-red-400">
                      {r.category}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{r.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    // 21. PE Binary Header & Packer Analyzer View
    if (data.isPEFormat !== undefined && data.packedStatus !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#0d9488]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Windows PE/EXE Binary Header Analysis</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.grade === 'SAFE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
              Safety: {data.safetyScore}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Architecture</span>
              <div className="text-xs text-white font-bold">{data.architecture}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Packer Status</span>
              <div className={`text-xs font-bold ${data.isPacked ? 'text-amber-400' : 'text-emerald-400'}`}>
                {data.packedStatus}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Subsystem</span>
              <div className="text-xs text-cyan-400 font-bold">{data.subsystem}</div>
            </div>
          </div>

          {data.suspiciousImports?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Dangerous Win32 API Imports ({data.suspiciousImportsCount})</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.suspiciousImports.map((api, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-red-500/20 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-red-400 font-bold">{api.name}</span>
                      <p className="text-slate-400 text-[10px]">{api.risk}</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold shrink-0">{api.cwe}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 22. Docker CIS Benchmark Auditor View
    if (data.cisComplianceScore !== undefined && data.findings !== undefined && data.findings[0]?.rule?.startsWith('CIS')) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#0ea5e9]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">CIS Docker Benchmark Security Linter</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-black px-4 py-1 rounded-xl border ${data.grade === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : data.grade === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
                {data.cisComplianceScore}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">CIS Docker Observations ({data.findingsCount})</span>
            {data.findings.map((f, i) => (
              <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold">{f.rule}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : f.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {f.severity}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">{f.message}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 23. Active Directory LDAP Policy Auditor View
    if (data.anonymousBinding !== undefined && data.protocol?.includes('LDAP')) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#4f46e5]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Directory / LDAP Security Audit</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase bg-white/5 text-slate-300 border border-white/10">
              {data.protocol}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Anonymous Binding</span>
              <div className="text-xs text-emerald-400 font-bold">{data.anonymousBinding}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Channel Binding (TLS)</span>
              <div className={`text-xs font-bold ${data.channelBindingStatus === 'ENFORCED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {data.channelBindingStatus}
              </div>
            </div>
          </div>

          {data.issues?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">LDAP Security Findings ({data.securityIssuesCount})</span>
              {data.issues.map((iss, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-bold">⚠ {iss.issue}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${iss.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {iss.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{iss.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 24. Postman API Collection Security Auditor View
    if (data.collectionName !== undefined && data.totalRequestsAudited !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#f97316]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Postman API Collection Security Audit</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-black px-4 py-1 rounded-xl border ${data.grade === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : data.grade === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
                {data.securityScore}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Collection Name</span>
              <div className="text-xs text-white font-bold">{data.collectionName}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Requests Audited</span>
              <div className="text-xs text-cyan-400 font-bold">{data.totalRequestsAudited} endpoint(s)</div>
            </div>
          </div>

          {data.findings?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Security Observations ({data.findingsCount})</span>
              {data.findings.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-bold">⚠ {f.issue} ({f.requestName})</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{f.detail}</p>
                  <p className="text-slate-500 text-[10px]">{f.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 25. MobSF Android Manifest Security View
    if (data.dangerousPermissions !== undefined && data.minSdkVersion !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#d946ef]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">MobSF Android Manifest Security Analysis</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-black px-4 py-1 rounded-xl border ${data.grade === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : data.grade === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
                {data.securityScore}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Package Name</span>
              <div className="text-xs text-white font-bold truncate">{data.packageName}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Min SDK Version</span>
              <div className="text-xs text-cyan-400 font-bold">{data.minSdkVersion}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Target SDK Version</span>
              <div className="text-xs text-emerald-400 font-bold">{data.targetSdkVersion}</div>
            </div>
          </div>

          {data.dangerousPermissions?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Dangerous Android Permissions ({data.dangerousPermissionsCount})</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.dangerousPermissions.map((p, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-amber-500/20 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-amber-400 font-bold">{p.perm}</span>
                      <p className="text-slate-400 text-[10px]">{p.risk}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.findings?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Configuration Vulnerabilities ({data.findingsCount})</span>
              {data.findings.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-red-500/20 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-bold">⚠ {f.issue}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{f.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 26. iOS IPA & Entitlements Validator View
    if (data.bundleId !== undefined && data.atsStatus !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#3b82f6]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">iOS IPA Entitlements & ATS Audit</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-black px-4 py-1 rounded-xl border ${data.grade === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : data.grade === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
                {data.securityScore}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Bundle Identifier</span>
              <div className="text-xs text-white font-bold truncate">{data.bundleId}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">App Transport Security</span>
              <div className={`text-xs font-bold ${data.atsStatus.includes('SECURE') ? 'text-emerald-400' : 'text-red-400'}`}>
                {data.atsStatus}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Debugging Entitlement</span>
              <div className={`text-xs font-bold ${data.debuggingEnabled.includes('DISABLED') ? 'text-emerald-400' : 'text-red-400'}`}>
                {data.debuggingEnabled}
              </div>
            </div>
          </div>

          {data.issues?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Policy Findings ({data.issuesCount})</span>
              {data.issues.map((iss, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-bold">⚠ {iss.issue}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${iss.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {iss.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{iss.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 27. APK Credentials & Secrets Extractor View
    if (data.leaks !== undefined && data.totalStringsScanned !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#10b981]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mobile App Hardcoded Secrets Extractor</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.riskLevel === 'SECURE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'}`}>
              Risk: {data.riskLevel}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Strings Scanned: {data.totalStringsScanned}
            </span>
            <span className={`px-3 py-1 rounded-lg font-bold ${data.leaksCount > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              Leaked Secrets: {data.leaksCount}
            </span>
          </div>

          {data.leaks?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Discovered Embedded Credentials</span>
              {data.leaks.map((l, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-red-500/20 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">{l.type}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${l.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {l.severity}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-black/80 border border-white/10 text-[11px] text-amber-300">
                    <code>{l.masked}</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 28. Androguard Dalvik Bytecode Disassembler View
    if (data.bytecodeInstructions !== undefined && data.methodsAnalyzed !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#84cc16]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Androguard Dalvik DEX Reverse Engineering</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.riskLevel === 'SECURE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
              Risk: {data.riskLevel}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Methods Analyzed: {data.methodsAnalyzed}
            </span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Instructions: {data.bytecodeInstructions}
            </span>
          </div>

          {data.findings?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Bytecode Security Findings ({data.findingsCount})</span>
              {data.findings.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-bold">⚠ {f.category}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold">{f.cwe}</span>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{f.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 29. Falco Container Syscall Inspector View
    if (data.totalEventsParsed !== undefined && data.anomaliesCount !== undefined && data.events !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#10b981]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Falco Container Runtime Syscall Audit</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.threatLevel === 'LOW' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'}`}>
              Threat: {data.threatLevel}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Events Evaluated: {data.totalEventsParsed}
            </span>
            <span className={`px-3 py-1 rounded-lg font-bold ${data.anomaliesCount > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              Anomalies: {data.anomaliesCount}
            </span>
          </div>

          {data.events?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Suspicious System Calls Identified</span>
              {data.events.map((e, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-red-500/20 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-bold">⚠ {e.rule}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${e.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {e.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{e.description}</p>
                  <p className="text-slate-500 text-[10px] font-mono truncate">{e.rawRecord}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 30. Binwalk Firmware Image & Filesystem View
    if (data.entropyScore !== undefined && data.partitionsFound !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#d97706]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Binwalk Firmware Signature & Partition Analysis</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.isEncryptedOrCompressed ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'}`}>
              Entropy: {data.entropyScore}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Architecture Inference</span>
              <div className="text-xs text-cyan-400 font-bold">{data.architectureGuess}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Partitions Identified</span>
              <div className="text-xs text-white font-bold">{data.partitionsFound} segment(s)</div>
            </div>
          </div>

          {data.partitions?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Detected Firmware Image Headers</span>
              {data.partitions.map((p, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Offset: {p.offset}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{p.type}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 31. Capstone Machine Instruction & Opcode View
    if (data.instructionCount !== undefined && data.instructions !== undefined && data.architecture?.includes('86')) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#4b5563]/50 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Capstone Multi-Arch Opcode Disassembly</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase bg-white/5 text-cyan-400 border border-white/10">
              {data.architecture}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Total Bytes: {data.totalBytes}
            </span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Instructions: {data.instructionCount}
            </span>
          </div>

          {data.instructions?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Assembly Instruction Stream</span>
              <div className="space-y-1">
                {data.instructions.map((insn, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between font-mono">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-[10px] w-12">{insn.offset}</span>
                      <span className="text-slate-400 text-[11px] w-28 truncate">{insn.bytes}</span>
                      <span className="text-emerald-400 font-bold">{insn.mnemonic}</span>
                      <span className="text-white font-bold">{insn.op}</span>
                    </div>
                    <span className="text-slate-500 text-[10px] hidden md:block">{insn.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 32. Email Spoofing, SPF & DMARC Defense View
    if (data.spoofingDefenseScore !== undefined && data.spfStatus !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#f97316]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Domain Email Spoofing & DMARC Policy Audit</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-black px-4 py-1 rounded-xl border ${data.grade === 'STRONG_PROTECTION' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : data.grade === 'MODERATE_RISK' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
                {data.spoofingDefenseScore}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">SPF Mechanism Status</span>
              <div className={`text-xs font-bold ${data.spfStatus === 'SECURE' ? 'text-emerald-400' : 'text-amber-400'}`}>{data.spfStatus}</div>
              <p className="text-slate-400 text-[10px] font-mono truncate">{data.spfRecord}</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">DMARC Policy Enforcement</span>
              <div className={`text-xs font-bold ${data.dmarcStatus.includes('ENFORCED') || data.dmarcStatus === 'SECURE' ? 'text-emerald-400' : 'text-amber-400'}`}>{data.dmarcStatus}</div>
              <p className="text-slate-400 text-[10px] font-mono truncate">{data.dmarcRecord}</p>
            </div>
          </div>

          {data.issues?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Spoofing Vulnerabilities ({data.issuesCount})</span>
              {data.issues.map((iss, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-red-500/20 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-bold">⚠ {iss.issue}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${iss.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {iss.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{iss.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 33. Raw EML Email Header & Delivery Hop Route View
    if (data.totalHops !== undefined && data.originatingIp !== undefined && data.hops !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#10b981]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Email MTA Delivery Hop Sequence & Auth Results</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${data.spfAuthentication === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                SPF: {data.spfAuthentication}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${data.dkimAuthentication === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                DKIM: {data.dkimAuthentication}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Client Originating IP</span>
            <div className="text-xs text-cyan-400 font-bold">{data.originatingIp}</div>
          </div>

          {data.hops?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">MTA Received Relay Hops ({data.totalHops})</span>
              {data.hops.map((h, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold">Hop #{h.hopNumber}: {h.fromHost} → {h.byHost}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{h.ip}</span>
                  </div>
                  <p className="text-slate-500 text-[10px] font-mono truncate">{h.raw}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 34. Mail Exchange Server & IP Blacklist / RBL View
    if (data.rblFeeds !== undefined && data.reputationStatus !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#8b5cf6]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mail Server DNSBL Blacklist & RBL Status</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {data.reputationStatus}
            </span>
          </div>

          {data.mxRecords?.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Resolved Mail Exchangers (MX)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.mxRecords.map((m, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                    <span className="text-cyan-400 font-bold truncate">{m.exchange}</span>
                    <span className="text-[10px] text-slate-400">Pref: {m.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.rblFeeds?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">RBL / DNSBL Blacklist Providers</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.rblFeeds.map((feed, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                    <span className="text-slate-300 font-bold">{feed.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">{feed.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 35. Prompt Injection & LLM Jailbreak Guard View
    if (data.safetyScore !== undefined && data.detections !== undefined && data.isInjectionDetected !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#a855f7]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Prompt Injection & Jailbreak Guard</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-4 py-1 rounded-xl text-lg font-black uppercase border ${data.grade === 'SAFE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : data.grade === 'SUSPICIOUS' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
              {data.safetyScore}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Length: {data.promptLength} chars
            </span>
            <span className={`px-3 py-1 rounded-lg font-bold ${data.isInjectionDetected ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              Status: {data.grade}
            </span>
          </div>

          {data.detections?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Identified Injection & Jailbreak Patterns</span>
              {data.detections.map((d, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-red-500/20 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-bold">⚠ {d.rule}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${d.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {d.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{d.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 36. Sensitive PII & Compliance Scanner View
    if (data.piiFound !== undefined && data.totalCharsScanned !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#e11d48]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sensitive PII & Compliance Data Leakage Scan</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/40' : data.riskLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              Risk: {data.riskLevel}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Scanned: {data.totalCharsScanned} chars
            </span>
            <span className={`px-3 py-1 rounded-lg font-bold ${data.piiCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              Leaks: {data.piiCount}
            </span>
          </div>

          {data.piiFound?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Exposed PII Records with Redaction</span>
              {data.piiFound.map((p, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs flex items-center justify-between">
                  <div>
                    <div className="text-amber-400 font-bold">{p.type}</div>
                    <div className="text-slate-300 font-mono text-[11px]">{p.masked}</div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${p.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {p.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 37. GDPR Cookie & Consent Policy View
    if (data.gdprComplianceScore !== undefined && data.cookies !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#8b5cf6]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">GDPR Tracking Cookie & Consent Policy Audit</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-4 py-1 rounded-xl text-lg font-black uppercase border ${data.grade === 'COMPLIANT' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'}`}>
              {data.gdprComplianceScore}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              HTTP: {data.httpStatus}
            </span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Cookies: {data.totalCookiesFound}
            </span>
          </div>

          {data.cookies?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Set-Cookie Security Attributes</span>
              {data.cookies.map((c, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">{c.name}</span>
                    <span className="text-slate-500 text-[10px] ml-2">({c.type})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded font-bold ${c.isSecure ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {c.isSecure ? 'Secure' : 'Insecure'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded font-bold ${c.isHttpOnly ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {c.isHttpOnly ? 'HttpOnly' : 'NoHttpOnly'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 font-bold">
                      {c.sameSite}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.findings?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">GDPR Compliance Deficiencies ({data.findingsCount})</span>
              {data.findings.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-amber-500/20 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold">{f.cookie}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase">{f.severity}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{f.issue}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 38. Image EXIF Metadata & Geolocation Inspector View
    if (data.privacyStatus !== undefined && data.tags !== undefined && data.hasGpsLocation !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#14b8a6]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Image EXIF Metadata & Privacy Exposure</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.hasGpsLocation ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              {data.privacyStatus}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">GPS Geolocation Coordinates</span>
            <div className={`text-xs font-bold ${data.hasGpsLocation ? 'text-red-400' : 'text-emerald-400'}`}>{data.gpsCoordinates}</div>
          </div>

          {data.tags?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Extracted Metadata Tags ({data.totalTagsExtracted})</span>
              {data.tags.map((t, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-teal-400 font-bold">{t.tag}: </span>
                    <span className="text-slate-200">{t.value}</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">{t.privacyRisk}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 39. TheHive Incident Response Case & Threat View
    if (data.theHiveJson !== undefined && data.tasks !== undefined && data.observables !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#eab308]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">TheHive Incident Response Case Triage</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.caseTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
                {data.tlp}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                Severity: {data.severity}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Standardized Playbook Tasks ({data.tasksCount})</span>
              {data.tasks.map((task, i) => (
                <div key={i} className="p-2 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <span className="text-slate-300 font-bold">{task.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${task.status === 'InProgress' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-400'}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Extracted IOC Observables ({data.totalObservables})</span>
              {data.observables.map((obs, i) => (
                <div key={i} className="p-2 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between font-mono">
                  <span className="text-cyan-400 truncate max-w-[180px]">{obs.value}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 uppercase">{obs.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 40. Wazuh Host & SIEM Agent Auditor View
    if (data.agentVersion !== undefined && data.healthScore !== undefined && data.modules !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#0284c7]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Wazuh SIEM Host Agent Auditor</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-4 py-1 rounded-xl text-lg font-black uppercase border ${data.grade === 'HEALTHY' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'}`}>
              {data.healthScore}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Host Agent Target</span>
              <div className="text-xs text-cyan-400 font-bold">{data.agentId}</div>
              <p className="text-slate-400 text-[10px]">{data.osVersion}</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Wazuh Agent Status</span>
              <div className="text-xs text-emerald-400 font-bold">{data.connectionStatus}</div>
              <p className="text-slate-400 text-[10px]">{data.agentVersion}</p>
            </div>
          </div>

          {data.modules?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Telemetry & Detection Modules ({data.activeModulesCount}/{data.totalModulesCount} Active)</span>
              {data.modules.map((m, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">{m.name}</span>
                    <span className="text-slate-500 text-[10px] ml-2 font-mono">({m.interval})</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${m.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 41. Zeek Network Transaction Parser View
    if (data.totalBytesTransferred !== undefined && data.transactions !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#10b981]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Zeek Network Connection & Session Parser</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.anomaliesCount > 0 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              {data.status}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Sessions: {data.totalRecordsParsed}
            </span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Transferred: {data.totalBytesTransferred}
            </span>
            <span className={`px-3 py-1 rounded-lg font-bold ${data.anomaliesCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              Anomalies: {data.anomaliesCount}
            </span>
          </div>

          {data.transactions?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Analyzed Connection Flows</span>
              {data.transactions.map((tx, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px]">#{tx.sessionIndex}</span>
                    <span className="text-cyan-400 font-bold">{tx.source}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-white font-bold">{tx.destination}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 text-[10px]">{tx.protocol}/{tx.service}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${tx.isAnomaly ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {tx.connState}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 42. Linux Auditd Syscall Tracer View
    if (data.privilegedEventsCount !== undefined && data.events !== undefined && data.events[0]?.auditUid !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#4b5563]/50 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Linux Auditd Syscall & Process Privilege Trace</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.privilegedEventsCount > 0 ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              {data.status}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Total Syscalls: {data.totalEventsParsed}
            </span>
            <span className={`px-3 py-1 rounded-lg font-bold ${data.privilegedEventsCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              Privileged Actions: {data.privilegedEventsCount}
            </span>
          </div>

          {data.events?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">System Call Execution Stream</span>
              {data.events.map((ev, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between font-mono">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">{ev.command}</span>
                      <span className="text-slate-500 text-[10px]">{ev.executable}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      auid={ev.auditUid} euid={ev.effectiveUid} ({ev.status})
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${ev.isRootElevation ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-300'}`}>
                    {ev.risk}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 43. SOC 2 Trust Services Posture View
    if (data.overallReadinessScore !== undefined && data.categories !== undefined && data.auditStandard?.includes('SOC 2')) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#0d9488]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">SOC 2 Type II Trust Services Criteria Posture</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-4 py-1 rounded-xl text-lg font-black uppercase border ${data.grade === 'SOC2_READY' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'}`}>
              {data.overallReadinessScore}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Controls Compliant</span>
            <div className="text-xs text-emerald-400 font-bold">{data.passingControlsCount} controls satisfied</div>
          </div>

          {data.categories?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">5 Trust Services Categories</span>
              {data.categories.map((cat, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-teal-400 font-bold">{cat.category}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">{cat.categoryScore}</span>
                  </div>
                  <div className="space-y-1">
                    {cat.controls.map((ctrl, ci) => (
                      <div key={ci} className="flex items-center justify-between text-[11px] pl-2 border-l border-white/10">
                        <span className="text-slate-300">{ctrl.id}: {ctrl.name}</span>
                        <span className={`text-[9px] font-bold ${ctrl.status === 'COMPLIANT' ? 'text-emerald-400' : 'text-amber-400'}`}>{ctrl.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 44. HIPAA ePHI Security Rule View
    if (data.ephiProtectionGrade !== undefined && data.safeguards !== undefined && data.regulation?.includes('HIPAA')) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#d946ef]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">HIPAA Security Rule & ePHI Safeguards Audit</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-4 py-1 rounded-xl text-lg font-black uppercase border ${data.ephiProtectionGrade === 'HIPAA_COMPLIANT' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
              {data.complianceScore}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Standard Regulation</span>
            <div className="text-xs text-fuchsia-400 font-bold">{data.regulation}</div>
          </div>

          {data.safeguards?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Safeguards Compliance Checklist ({data.compliantSafeguards}/{data.safeguardsCount})</span>
              {data.safeguards.map((s, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">{s.rule}</span>
                    <span className="text-slate-400 text-[10px] ml-2">({s.spec})</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${s.status === 'COMPLIANT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 45. Shodan Node & Intelligence Search View
    if (data.resolvedIp !== undefined && data.openPorts !== undefined && data.vulnerabilities !== undefined && data.tags !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#f59e0b]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Shodan Node & Host Intelligence</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-bold uppercase">
              {data.country}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Target & IP</span>
              <div className="text-xs text-amber-400 font-bold">{data.query} → {data.resolvedIp}</div>
              <p className="text-slate-400 text-[10px]">{data.isp}</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Location</span>
              <div className="text-xs text-white font-bold">{data.city}</div>
              <p className="text-slate-400 text-[10px]">Hostnames: {data.hostnames?.join(', ')}</p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Open Ports ({data.openPortsCount})</span>
            <div className="flex flex-wrap gap-2">
              {data.openPorts.map((p, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  Port {p}
                </span>
              ))}
            </div>
          </div>

          {data.vulnerabilities?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Vulnerabilities / CVE Exposures ({data.vulnerabilitiesCount})</span>
              <div className="flex flex-wrap gap-2">
                {data.vulnerabilities.map((cve, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold">
                    {cve}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 46. Censys Host & TLS Certificate Explorer View
    if (data.securityGrade !== undefined && data.tlsProfile !== undefined && data.subjectAltNames !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#ec4899]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Censys Host & Certificate Explorer</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-4 py-1 rounded-xl text-lg font-black uppercase border bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
              Grade {data.securityGrade}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Certificate Issuer</span>
              <div className="text-xs text-pink-400 font-bold">{data.issuer}</div>
              <p className="text-slate-400 text-[10px]">Valid To: {data.validTo} ({data.daysRemaining})</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Preferred Cipher Suite</span>
              <div className="text-xs text-emerald-400 font-bold">{data.cipher}</div>
              <p className="text-slate-400 text-[10px]">Protocols: {data.protocols?.join(', ')}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Subject Alternative Names (SANs)</span>
            <div className="flex flex-wrap gap-2">
              {data.subjectAltNames.map((san, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-slate-300 text-xs">
                  {san}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 47. Masscan Range & Port Prober View
    if (data.rate !== undefined && data.hostsDiscovered !== undefined && data.totalOpenPortsFound !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#f43f5e]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Masscan Parallel Port Prober</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg text-xs font-bold uppercase">
              {data.rate}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Target: {data.targetRange}
            </span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Live Hosts: {data.hostsDiscovered}
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold">
              Open Ports: {data.totalOpenPortsFound}
            </span>
          </div>

          {data.hosts?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Discovered Host Nodes</span>
              {data.hosts.map((host, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-rose-400 font-bold">{host.ip}</span>
                    <span className="text-slate-500 text-[10px]">RTT: {host.rtt}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {host.ports.map((p, pi) => (
                      <span key={pi} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                        {p.port}/{p.service} ({p.banner})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 48. Cryptographic Hash Generator View
    if (data.inputLength !== undefined && data.entropy !== undefined && data.hashes !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#6b7280]/40 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cryptographic Hash Digest Suite</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-slate-300">
              Entropy: {data.entropy}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Generated Cryptographic Signatures</span>
            {data.hashes.map((h, i) => (
              <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-400 font-bold">{h.algorithm}</span>
                  <span className="text-slate-500 text-[10px]">{h.bits} bits</span>
                </div>
                <div className="p-2 rounded bg-black/60 border border-white/5 text-[11px] text-slate-300 break-all select-all font-mono">
                  {h.hash}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 49. Dossier Hex & Binary Frame Inspector View
    if (data.totalBytes !== undefined && data.byteStreamPreview !== undefined && data.rows !== undefined && data.rows[0]?.hex !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#475569]/40 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dossier Hex & Binary Offset Matrix</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-slate-300">
              {data.totalBytes} Bytes ({data.totalRows} Rows)
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg bg-black/60 border border-white/5 p-3 text-[11px] font-mono leading-relaxed">
            <div className="text-slate-500 border-b border-white/10 pb-1 mb-2 flex justify-between">
              <span>OFFSET</span>
              <span>00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F</span>
              <span>ASCII</span>
            </div>
            {data.rows.map((row, i) => (
              <div key={i} className="flex justify-between items-center py-0.5 hover:bg-white/5 px-1 rounded">
                <span className="text-cyan-400 font-bold">{row.offset}</span>
                <span className="text-slate-300 tracking-wider">{row.hex}</span>
                <span className="text-emerald-400 font-bold border-l border-white/10 pl-2">{row.ascii}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 50. Nikto Web Vulnerability Scanner View
    if (data.serverBanner !== undefined && data.hardeningScore !== undefined && data.findings !== undefined && data.probedPaths !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#ef4444]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Nikto Web Server Vulnerability Scanner</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-4 py-1 rounded-xl text-lg font-black uppercase border ${data.grade === 'SECURE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
              {data.hardeningScore}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Target Host</span>
              <div className="text-xs text-rose-400 font-bold">{data.hostname}</div>
              <p className="text-slate-400 text-[10px]">Response Status: {data.responseCode}</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Detected Web Server</span>
              <div className="text-xs text-white font-bold">{data.serverBanner}</div>
              <p className="text-slate-400 text-[10px]">Findings: {data.findingsCount} issue(s)</p>
            </div>
          </div>

          {data.findings?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Server Configuration & Security Flaws</span>
              {data.findings.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{f.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${f.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : f.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{f.description}</p>
                  <p className="text-emerald-400 text-[10px]">💡 {f.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 51. SQLmap Injection & Database Auditor View
    if (data.testedParametersCount !== undefined && data.sqliRiskScore !== undefined && data.testedVectors !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#f59e0b]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">SQLmap Injection & Database Auditor</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-4 py-1 rounded-xl text-lg font-black uppercase border ${data.vulnerabilityStatus.includes('DETECTED') ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              {data.sqliRiskScore}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Vulnerability Status</span>
              <div className={`text-xs font-bold ${data.vulnerabilityStatus.includes('DETECTED') ? 'text-red-400' : 'text-emerald-400'}`}>
                {data.vulnerabilityStatus}
              </div>
              <p className="text-slate-400 text-[10px]">Target: {data.target}</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Backend DBMS</span>
              <div className="text-xs text-amber-400 font-bold">{data.backendDbms}</div>
              <p className="text-slate-400 text-[10px]">Parameters: {data.testedParametersCount} tested</p>
            </div>
          </div>

          {data.testedVectors?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Evaluated SQL Injection Vectors</span>
              {data.testedVectors.map((v, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">{v.type}</span>
                    <span className="text-slate-500 text-[10px] ml-2 font-mono">{v.payload}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${v.status === 'VULNERABLE' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 52. Trivy Container & Lockfile Auditor View
    if (data.imageTarget !== undefined && data.severityBreakdown !== undefined && data.vulnerabilities !== undefined && data.misconfigurations !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#06b6d4]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Trivy Container & Lockfile Auditor</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.securityGrade === 'CRITICAL_RISK' ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              {data.securityGrade}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg font-bold">
              Critical: {data.severityBreakdown?.critical || 0}
            </span>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg font-bold">
              High: {data.severityBreakdown?.high || 0}
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg font-bold">
              Medium: {data.severityBreakdown?.medium || 0}
            </span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Packages: {data.totalPackagesScanned}
            </span>
          </div>

          {data.vulnerabilities?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Detected Package CVE Vulnerabilities</span>
              {data.vulnerabilities.map((v, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">{v.cve}</span>
                      <span className="text-white font-bold">{v.pkg}</span>
                      <span className="text-slate-500 text-[10px]">({v.installedVersion} → {v.fixedVersion})</span>
                    </div>
                    <p className="text-slate-400 text-[10px] mt-0.5">{v.title}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${v.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {v.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 53. OWASP ZAP DAST Scanner View
    if (data.spideredUrlsCount !== undefined && data.dastScore !== undefined && data.alertCounts !== undefined && data.alerts !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#10b981]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">OWASP ZAP Dynamic Application Security Testing (DAST)</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-4 py-1 rounded-xl text-lg font-black uppercase border bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
              {data.dastScore}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Spidered URLs: {data.spideredUrlsCount}
            </span>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg font-bold">
              High: {data.alertCounts?.high || 0}
            </span>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg font-bold">
              Medium: {data.alertCounts?.medium || 0}
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg font-bold">
              Low: {data.alertCounts?.low || 0}
            </span>
          </div>

          {data.alerts?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Flagged DAST Vulnerability Alerts</span>
              {data.alerts.map((a, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{a.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${a.risk === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {a.risk}
                    </span>
                  </div>
                  <div className="text-cyan-400 text-[11px] font-mono">Evidence: {a.evidence}</div>
                  <p className="text-emerald-400 text-[10px]">💡 {a.solution}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 54. Nuclei Template Scanner View
    if (data.templatesExecuted !== undefined && data.matchedTemplatesCount !== undefined && data.templates !== undefined && data.templates[0]?.matcherName !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#e11d48]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Nuclei Template-Based Vulnerability Scanner</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg text-xs font-bold uppercase">
              {data.matchedTemplatesCount} Matches
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Templates Tested: {data.templatesExecuted}
            </span>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg font-bold">
              Critical CVEs: {data.criticalFindings}
            </span>
          </div>

          {data.templates?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Matched Security Signatures</span>
              {data.templates.map((t, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{t.name}</span>
                      <span className="text-slate-500 text-[10px]">({t.templateId})</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${t.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : t.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {t.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{t.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>CVE: {t.cve}</span>
                    <span>•</span>
                    <span>CVSS: {t.cvssScore}</span>
                    <span>•</span>
                    <span>Matcher: {t.matcherName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 55. AlienVault OTX Threat Pulse View
    if (data.pulseCount !== undefined && data.threatReputation !== undefined && data.pulses !== undefined && data.tags !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#10b981]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">AlienVault Open Threat Exchange (OTX)</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold uppercase">
              {data.pulseCount} Active Pulses
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Target Evaluated</span>
              <div className="text-xs text-emerald-400 font-bold">{data.target}</div>
              <p className="text-slate-400 text-[10px]">Reputation Score: {data.threatReputation}</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Adversary & Threat Tags</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded text-[10px]">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {data.pulses?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Threat Pulses & Intelligence Feeds</span>
              {data.pulses.map((p, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{p.name}</span>
                    <span className="text-[10px] text-slate-400">{p.created}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Author: {p.author}</span>
                    <span>References: {p.referencesCount} linked</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 56. VirusShare Malware Hash Searcher View
    if (data.hashType !== undefined && data.threatClass !== undefined && data.detectionRatio !== undefined && data.fileType !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#ef4444]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">VirusShare Malware Hash Searcher</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.isIdentified ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              {data.threatClass}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Detection Ratio</span>
              <div className={`text-xs font-bold ${data.isIdentified ? 'text-red-400' : 'text-emerald-400'}`}>
                {data.detectionRatio}
              </div>
              <p className="text-slate-400 text-[10px]">Sample Size: {data.fileSize}</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Malware Family & Format</span>
              <div className="text-xs text-amber-400 font-bold">{data.malwareFamily}</div>
              <p className="text-slate-400 text-[10px] truncate">{data.fileType}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Query Checksum ({data.hashType})</span>
            <div className="text-[11px] text-cyan-400 font-mono break-all">{data.hash}</div>
          </div>
        </div>
      );
    }

    // 57. MISP Threat Sharing IOC Checker View
    if (data.correlationsCount !== undefined && data.highestThreatLevel !== undefined && data.threatActors !== undefined && data.events !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#f97316]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">MISP Threat Sharing Platform IOC Checker</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-bold uppercase">
              {data.highestThreatLevel} Threat Level
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Correlated Events: {data.correlationsCount}
            </span>
            <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-lg font-bold">
              Actors: {data.threatActors?.join(', ')}
            </span>
          </div>

          {data.events?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Correlated Threat Sharing Events</span>
              {data.events.map((e, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-400 font-bold">{e.eventId}</span>
                      <span className="text-white font-bold">{e.eventTitle}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                      {e.threatLevel}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">Distribution: {e.distribution} • Analysis: {e.analysis}</div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {e.mitreTechniques.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded text-[9px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 58. TheHarvester Intelligence Gatherer View
    if (data.sourcesQueriedCount !== undefined && data.emailsDiscoveredCount !== undefined && data.emails !== undefined && data.hosts !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#8b5cf6]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">TheHarvester OSINT Intelligence Gatherer</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded-lg text-xs font-bold uppercase">
              {data.emailsDiscoveredCount} Emails • {data.hostsDiscoveredCount} Hosts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Discovered Emails ({data.emailsDiscoveredCount})</span>
              <div className="space-y-1 text-xs">
                {data.emails.map((em, i) => (
                  <div key={i} className="text-purple-300 font-mono py-0.5 hover:bg-white/5 px-1 rounded">
                    ✉️ {em}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Discovered Hosts & Subdomains ({data.hostsDiscoveredCount})</span>
              <div className="space-y-1 text-xs">
                {data.hosts.map((h, i) => (
                  <div key={i} className="text-cyan-300 font-mono py-0.5 hover:bg-white/5 px-1 rounded">
                    🌐 {h}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 59. Hunter.io Domain Email Pattern Search View
    if (data.patternSchema !== undefined && data.confidenceScore !== undefined && data.contacts !== undefined && data.departments !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#f97316]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hunter.io Corporate Domain Email Search</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-bold uppercase">
              {data.confidenceScore} Confidence
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Detected Pattern Syntax</span>
              <div className="text-xs text-amber-400 font-bold font-mono">{data.patternSchema}</div>
              <p className="text-slate-400 text-[10px]">{data.totalIndexedEmails} indexed public addresses</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Company Structure</span>
              <div className="text-xs text-white font-bold">{data.company}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.departments.map((d, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-slate-300">
                    {d.name}: {d.count}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {data.contacts?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Indexed Executive & Engineering Directory</span>
              {data.contacts.map((c, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold">{c.name}</div>
                    <p className="text-slate-400 text-[10px]">{c.position}</p>
                    <p className="text-cyan-400 text-[10px] font-mono">{c.email}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">
                    {c.confidence}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 60. Intelligence X Archive Explorer View
    if (data.totalRecordsFound !== undefined && data.mediaDistribution !== undefined && data.leaks !== undefined && data.highestConfidence !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#6366f1]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Intelligence X Historical Leak Archive Explorer</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 rounded-lg text-xs font-bold uppercase">
              {data.totalRecordsFound} Records Found
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-red-500/20 text-red-400 rounded-lg font-bold">
              Breach Combos: {data.mediaDistribution?.breaches || 0}
            </span>
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-lg font-bold">
              Pastes: {data.mediaDistribution?.pastes || 0}
            </span>
            <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 rounded-lg font-bold">
              Tor Darknet: {data.mediaDistribution?.darknet || 0}
            </span>
          </div>

          {data.leaks?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Historical Archive Leak Matches</span>
              {data.leaks.map((l, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{l.title}</span>
                    <span className="text-[10px] text-slate-400">{l.date} ({l.size})</span>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono">{l.matchSnippet}</div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                    <span>Category: {l.category}</span>
                    <span>•</span>
                    <span className="text-indigo-400 font-bold">{l.mediaType}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 61. Prowler AWS CIS Benchmark Auditor View
    if (data.cisComplianceScore !== undefined && data.passedChecks !== undefined && data.sections !== undefined && data.benchmark !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#ec4899]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Prowler AWS CIS Benchmark Compliance Auditor</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-4 py-1 rounded-xl text-lg font-black uppercase border bg-pink-500/20 text-pink-400 border-pink-500/40">
              {data.cisComplianceScore}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Target: {data.targetAccountOrRegion}
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold">
              Passed: {data.passedChecks}
            </span>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg font-bold">
              Failed: {data.failedChecks}
            </span>
          </div>

          {data.sections?.length > 0 && (
            <div className="space-y-3">
              {data.sections.map((s, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{s.id} {s.name}</span>
                    <span className="text-pink-400 font-bold">{s.score} Compliant</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    {s.findings?.map((f, fIdx) => (
                      <div key={fIdx} className="flex items-center justify-between text-[11px] py-0.5">
                        <span className="text-slate-300 truncate max-w-[80%]">{f.check}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${f.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {f.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 62. Scout Suite Multi-Cloud Auditor View
    if (data.providersAudited !== undefined && data.totalResourcesAudited !== undefined && data.services !== undefined && data.services[0]?.flaggedRisks !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#3b82f6]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Scout Suite Multi-Cloud Security Auditor</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-lg text-xs font-bold uppercase">
              {data.postureRating}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Providers: {data.providersAudited?.join(' • ')}
            </span>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg font-bold">
              Resources: {data.totalResourcesAudited}
            </span>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg font-bold">
              Flagged Risks: {data.totalFlaggedRisks}
            </span>
          </div>

          {data.services?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Audited Cloud Infrastructure Services</span>
              {data.services.map((srv, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-bold">[{srv.provider}]</span>
                      <span className="text-white font-bold">{srv.service}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${srv.flaggedRisks > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {srv.status}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{srv.topRisk}</p>
                  <span className="text-[10px] text-slate-500">{srv.resourcesAudited} resource(s) analyzed</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 63. Cloud Storage Bucket Finder View
    if (data.bucketsTestedCount !== undefined && data.exposedBucketsCount !== undefined && data.overallRisk !== undefined && data.buckets !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#10b981]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cloud Storage Bucket Exposure Finder</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.exposedBucketsCount > 0 ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              {data.overallRisk}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Tested: {data.bucketsTestedCount} Mutations
            </span>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg font-bold">
              Exposed: {data.exposedBucketsCount} Public
            </span>
          </div>

          {data.buckets?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Storage Bucket Mutation Results</span>
              {data.buckets.map((b, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold font-mono">{b.name}</span>
                      <span className="text-slate-500 text-[10px]">({b.provider})</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">{b.access}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${b.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : b.risk === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 64. API Endpoint Fuzzer View
    if (data.fuzzVectorsTested !== undefined && data.unexpected500Errors !== undefined && data.robustnessScore !== undefined && data.fuzzVectors !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#ef4444]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">API Endpoint Fuzzer & Parameter Tester</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-4 py-1 rounded-xl text-lg font-black uppercase border bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
              {data.robustnessScore}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Payloads Tested: {data.fuzzVectorsTested}
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold">
              Server 500 Crashes: {data.unexpected500Errors}
            </span>
          </div>

          {data.fuzzVectors?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fuzzing Test Vectors & Response Codes</span>
              {data.fuzzVectors.map((f, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 font-bold">{f.result}</span>
                      <span className="text-slate-500 text-[10px]">({f.responseTimeMs}ms)</span>
                    </div>
                    <p className="text-slate-400 text-[10px] mt-0.5">{f.note}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                    HTTP {f.responseCode}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 65. Hydra Protocol Authentication Auditor View
    if (data.authStrengthScore !== undefined && data.lockoutPolicyDetected !== undefined && data.attempts !== undefined && data.protocol !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#dc2626]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hydra Protocol Authentication Auditor</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-4 py-1 rounded-xl text-lg font-black uppercase border bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
              {data.authStrengthScore}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Protocol: {data.protocol} • Host: {data.host}
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg font-bold">
              Words Tested: {data.dictionaryWordsTested} ({data.timeElapsed})
            </span>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
            <span className="text-slate-400">Lockout & Rate-Limiting Policy:</span>
            <span className="text-emerald-400 font-bold">{data.lockoutPolicyDetected}</span>
          </div>

          {data.attempts?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Simulated Dictionary Authentication Attempts</span>
              {data.attempts.map((a, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">{a.username}</span>
                    <span className="text-slate-500 text-[10px] ml-2">[{a.credentialTested}]</span>
                    <p className="text-slate-400 text-[10px]">{a.reason}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold uppercase">
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 66. Kube-Bench Kubernetes CIS Benchmark Auditor View
    if (data.complianceScore !== undefined && data.clusterContext !== undefined && data.sections !== undefined && data.sections[0]?.findings !== undefined && data.benchmark?.includes('Kubernetes')) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#06b6d4]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Kube-Bench Kubernetes CIS Benchmark Auditor</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-4 py-1 rounded-xl text-lg font-black uppercase border bg-cyan-500/20 text-cyan-400 border-cyan-500/40">
              {data.complianceScore}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Cluster: {data.clusterContext}
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold">
              Passed: {data.passedChecks}
            </span>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg font-bold">
              Failed: {data.failedChecks}
            </span>
          </div>

          {data.sections?.length > 0 && (
            <div className="space-y-3">
              {data.sections.map((s, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">Section {s.id}: {s.name}</span>
                    <span className="text-cyan-400 font-bold">{s.score} Pass Rate</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    {s.findings?.map((f, fIdx) => (
                      <div key={fIdx} className="flex items-center justify-between text-[11px] py-0.5">
                        <div className="truncate max-w-[80%]">
                          <span className="text-slate-300">{f.check}</span>
                          {f.fix && <p className="text-amber-400 text-[10px]">Fix: {f.fix}</p>}
                        </div>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${f.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {f.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 67. Snyk Dependency & CVE Checker View
    if (data.dependenciesAudited !== undefined && data.severityBreakdown !== undefined && data.vulnerabilities !== undefined && data.packageManager !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#4f46e5]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Snyk Dependency & Vulnerability Checker</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.severityBreakdown?.critical > 0 ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              {data.status}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-red-500/20 text-red-400 rounded-lg font-bold">
              Critical: {data.severityBreakdown?.critical || 0}
            </span>
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-lg font-bold">
              High: {data.severityBreakdown?.high || 0}
            </span>
            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-lg font-bold">
              Medium: {data.severityBreakdown?.medium || 0}
            </span>
            <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Total Audited: {data.dependenciesAudited} Packages
            </span>
          </div>

          {data.vulnerabilities?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Vulnerable Package Dependencies & Upgrade Paths</span>
              {data.vulnerabilities.map((v, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{v.pkg} <span className="text-slate-400">({v.installedVersion})</span></span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${v.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {v.severity} • {v.cve}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{v.title}</p>
                  <p className="text-emerald-400 text-[10px] font-bold">Recommended Upgrade: {v.upgradePath}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 68. Cuckoo Dynamic Sandbox Detonator View
    if (data.sampleName !== undefined && data.processTree !== undefined && data.networkBeacons !== undefined && data.registryModifications !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#0ea5e9]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cuckoo Dynamic Malware Sandbox Detonator</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-4 py-1 rounded-xl text-lg font-black uppercase border bg-red-500/20 text-red-400 border-red-500/40">
              {data.threatScore}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-bold">
              Sample: {data.sampleName}
            </span>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg font-bold uppercase">
              {data.classification}
            </span>
          </div>

          {data.processTree?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Detonated Process Execution Tree</span>
              {data.processTree.map((p, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div className="truncate max-w-[80%]">
                    <span className="text-rose-400 font-bold font-mono">PID {p.pid}</span>
                    <span className="text-slate-300 ml-2">{p.name}</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold uppercase">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {data.networkBeacons?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Network Beacons & Exfiltration Channels</span>
              {data.networkBeacons.map((b, i) => (
                <div key={i} className="p-2 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <span className="text-cyan-400 font-mono">[{b.protocol}] {b.destination}:{b.port}</span>
                  <span className="text-slate-400 text-[10px]">{b.note}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 69. Autopsy Digital Forensics View
    if (data.imageTarget !== undefined && data.carvedFiles !== undefined && data.timelineArtifacts !== undefined && data.forensicIntegrity !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#6b7280]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Autopsy Digital Forensics & File Carving</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold uppercase">
              {data.forensicIntegrity}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Target: {data.imageTarget}
            </span>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg font-bold">
              Carved Files: {data.carvedFilesCount}
            </span>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg font-bold">
              Timeline Events: {data.timelineArtifactsCount}
            </span>
          </div>

          {data.carvedFiles?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Carved & Recovered File Artifacts</span>
              {data.carvedFiles.map((c, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">{c.name}</span>
                    <span className="text-slate-500 text-[10px] ml-2">({c.size} • Sector: {c.sector})</span>
                    <p className="text-slate-400 text-[10px]">{c.path}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {data.timelineArtifacts?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Chronological Incident Timeline</span>
              {data.timelineArtifacts.map((t, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold text-[10px]">{t.timestamp}</span>
                    <span className="text-slate-500 text-[10px]">[{t.source}]</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{t.artifact}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 70. Volatility Memory Analysis View
    if (data.dumpFile !== undefined && data.suggestedProfile !== undefined && data.processes !== undefined && data.malfindInjections !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#8b5cf6]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Volatility Memory Forensics Analyzer</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.malfindInjections?.length > 0 ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              {data.forensicAssessment}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Profile: {data.suggestedProfile} • Target: {data.dumpFile}
            </span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg font-bold">
              Processes: {data.activeProcessesCount}
            </span>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg font-bold">
              Injections: {data.malfindCount}
            </span>
          </div>

          {data.processes?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Running Process Table (pslist / pstree)</span>
              {data.processes.map((p, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">{p.name}</span>
                    <span className="text-slate-500 text-[10px] ml-2 font-mono">[PID: {p.pid} • PPID: {p.ppid} • {p.offset}]</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${p.risk.includes('MALICIOUS') ? 'bg-red-500/20 text-red-400' : p.risk === 'SUSPICIOUS' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {p.risk}
                  </span>
                </div>
              ))}
            </div>
          )}

          {data.malfindInjections?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Memory Injections (malfind VAD)</span>
              {data.malfindInjections.map((m, i) => (
                <div key={i} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-red-400 font-bold font-mono">PID {m.pid} ({m.process})</span>
                    <span className="text-slate-400 text-[10px] ml-2">{m.vadAddress} • {m.protection}</span>
                  </div>
                  <span className="text-amber-400 text-[10px] font-bold">{m.tag}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 71. The Sleuth Kit (TSK) Volume & Filesystem Parser View
    if (data.volume !== undefined && data.scheme !== undefined && data.partitionLayout !== undefined && data.mftEntries !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#10b981]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">The Sleuth Kit (TSK) Volume & Filesystem Parser</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold uppercase">
              {data.scheme}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Volume: {data.volume} (Sector: {data.sectorSize}B)
            </span>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg font-bold">
              Deleted Artifacts: {data.deletedFilesFound}
            </span>
          </div>

          {data.partitionLayout?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">GPT Partition Table Layout (mmls)</span>
              {data.partitionLayout.map((part, i) => (
                <div key={i} className="p-2 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-emerald-400 font-bold">{part.slot}</span>
                    <span className="text-slate-300 ml-2">{part.description}</span>
                  </div>
                  <span className="text-slate-500 text-[10px] font-mono">{part.startSector} -> {part.endSector}</span>
                </div>
              ))}
            </div>
          )}

          {data.mftEntries?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Master File Table ($MFT) Inode Records</span>
              {data.mftEntries.map((m, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">{m.name}</span>
                    <span className="text-slate-500 text-[10px] ml-2">({m.size} • Inode: {m.inode})</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${m.allocated.includes('DELETED') ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {m.allocated}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 72. Plaso Super-Timeline Engine View
    if (data.parsersApplied !== undefined && data.totalEventsIndexed !== undefined && data.events !== undefined && data.filteredKeyEvents !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#f59e0b]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Plaso Log2Timeline Super-Timeline Forensics Engine</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-bold uppercase">
              {data.totalEventsIndexed} Events Indexed
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Parsers: {data.parsersApplied?.join(' • ')}
            </span>
          </div>

          {data.events?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Chronological Forensic Super-Timeline Matrix</span>
              {data.events.map((e, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold">{e.datetime}</span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[9px] font-bold uppercase">{e.tag}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{e.description}</p>
                  <span className="text-slate-500 text-[10px]">[{e.source}] {e.sourceType} • {e.timestampDesc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 73. Ghidra Headless Decompiler View
    if (data.binaryFile !== undefined && data.functionsCount !== undefined && data.disassembledFunctions !== undefined && data.suspiciousApiImports !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#10b981]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ghidra Headless Binary Disassembler & Decompiler</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold uppercase">
              {data.architecture}
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Suspicious Win32/POSIX API Sinks</span>
            <div className="flex flex-wrap gap-1.5">
              {data.suspiciousApiImports?.map((api, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                  {api}
                </span>
              ))}
            </div>
          </div>

          {data.disassembledFunctions?.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Decompiled C Pseudo-Code Functions</span>
              {data.disassembledFunctions.map((fn, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/60 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold">{fn.name} ({fn.address})</span>
                    <span className="text-rose-400 text-[10px] font-bold">{fn.riskLevel}</span>
                  </div>
                  <pre className="p-2.5 rounded bg-black/80 text-[11px] text-cyan-300 font-mono overflow-x-auto whitespace-pre">
                    {fn.decompiledSnippet}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 74. Radare2 Shellcode & Binary Analysis View
    if (data.disassemblyEngine?.includes('Radare2') && data.opcodes !== undefined && data.detectedSignature !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#3b82f6]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Radare2 Shellcode & Instruction Disassembler</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-lg text-xs font-bold uppercase">
              {data.payloadSize}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs flex items-center justify-between">
            <span className="text-slate-300">Detected Payload Signature:</span>
            <span className="text-indigo-400 font-bold">{data.detectedSignature}</span>
          </div>

          {data.opcodes?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Disassembled Instruction Stream (r2 pd)</span>
              {data.opcodes.map((op, i) => (
                <div key={i} className="p-2 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-[10px] font-mono">{op.offset}</span>
                    <span className="text-rose-400 font-mono">{op.hex}</span>
                    <span className="text-white font-bold">{op.mnemonic}</span>
                  </div>
                  <span className="text-slate-400 text-[10px] italic">; {op.comment}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 75. Aircrack-ng WPA2/WPA3 Handshake View
    if (data.handshake !== undefined && data.keysTestedCount !== undefined && data.passwordResilienceScore !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#06b6d4]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Aircrack-ng WPA2/WPA3 Handshake & Entropy Auditor</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-lg text-xs font-bold uppercase">
              {data.securityStatus}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Capture: {data.captureFile} • Time: {data.timeElapsed}
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold">
              Resilience Score: {data.passwordResilienceScore}
            </span>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg font-bold">
              Keys Tested: {data.keysTestedCount?.toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-cyan-400 font-bold">ESSID: {data.handshake.essid}</span>
              <span className="text-slate-400 font-mono">BSSID: {data.handshake.bssid}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Station MAC: {data.handshake.stationMac}</span>
              <span>Key Exchange: {data.handshake.keyExchange}</span>
            </div>
            <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-300 flex items-center justify-between">
              <span>{data.handshake.eapolFrames}</span>
              <span className="font-bold text-emerald-400">{data.handshake.micStatus}</span>
            </div>
          </div>
        </div>
      );
    }

    // 76. Kismet Wireless Survey Parser View
    if (data.accessPoints !== undefined && data.totalAccessPoints !== undefined && data.surveyCoverage !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#10b981]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Kismet Wireless Survey & AP Telemetry Parser</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold uppercase">
              {data.surveyCoverage}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Survey: {data.sourceFile}
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold">
              Access Points: {data.totalAccessPoints}
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg">
              Channels: {data.activeChannels?.join(', ')}
            </span>
          </div>

          {data.accessPoints?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Discovered 802.11 Access Points</span>
              {data.accessPoints.map((ap, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{ap.ssid}</span>
                      <span className="text-slate-500 text-[10px] font-mono">[{ap.bssid}]</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">{ap.frequency} • Signal: {ap.signalRssi} • Clients: {ap.clientCount}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${ap.status === 'SECURE' ? 'bg-emerald-500/20 text-emerald-400' : ap.status === 'ADEQUATE' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {ap.encryption}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 77. Wifite Wireless Security View
    if (data.auditsRunCount !== undefined && data.vulnerabilitiesFlagged !== undefined && data.audits !== undefined && data.remediation !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#ef4444]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Wifite Wireless Protocol & PMKID Auditor</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.vulnerabilitiesFlagged > 0 ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              {data.overallPosture}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Interface: {data.interfaceOrTarget}
            </span>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg font-bold">
              Vulnerabilities: {data.vulnerabilitiesFlagged}
            </span>
          </div>

          {data.audits?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Automated Wireless Security Checks</span>
              {data.audits.map((a, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{a.check}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${a.risk === 'HIGH' ? 'bg-red-500/20 text-red-400' : a.risk === 'SECURE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {a.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{a.details}</p>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
            <span className="text-amber-400 font-bold uppercase text-[10px]">Remediation Action</span>
            <p className="text-slate-300 text-[11px]">{data.remediation}</p>
          </div>
        </div>
      );
    }

    // 78. Bluetooth BLE Device Scanner View
    if (data.devicesDiscovered !== undefined && data.devices !== undefined && data.closestDeviceRssi !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#3b82f6]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Bluetooth Low Energy (BLE) Peripheral Scanner</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-lg text-xs font-bold uppercase">
              {data.devicesDiscovered} Devices Found
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Controller: {data.controller}
            </span>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg font-bold">
              Closest RSSI: {data.closestDeviceRssi}
            </span>
          </div>

          {data.devices?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Discovered BLE Peripherals & GATT Attributes</span>
              {data.devices.map((d, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold">{d.name}</span>
                      <span className="text-slate-500 text-[10px] ml-2 font-mono">[{d.mac}]</span>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${d.risk === 'EXPOSED_GATT' ? 'bg-amber-500/20 text-amber-400' : d.risk === 'TRACKER_BEACON' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {d.risk}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Mfr: {d.manufacturer} • Proximity: {d.proximity}</span>
                    <span className="text-cyan-400 font-bold">{d.rssi}</span>
                  </div>
                  {d.gattServices?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {d.gattServices.map((g, gi) => (
                        <span key={gi} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-slate-300 font-mono">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 79. Domain Typosquatting & Homoglyph Mutation View
    if (data.apexDomain !== undefined && data.permutationsGenerated !== undefined && data.activeRegisteredDomains !== undefined && data.permutations !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#e11d48]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Domain Typosquatting & Homoglyph Permutation Searcher</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg text-xs font-bold uppercase">
              {data.activeRegisteredDomains} Active Lookalikes
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Target: {data.apexDomain} (Brand: {data.brandName})
            </span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg font-bold">
              Permutations: {data.permutationsGenerated}
            </span>
          </div>

          {data.permutations?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Typosquatting Mutation Results</span>
              {data.permutations.map((p, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{p.domain}</span>
                      <span className="text-slate-500 text-[10px]">[{p.type}]</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">DNS IP: {p.dnsA} • MX: {p.mxRecord}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${p.risk.includes('CRITICAL') ? 'bg-red-500/20 text-red-400' : p.risk.includes('HIGH') ? 'bg-rose-500/20 text-rose-400' : p.risk === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1">
            <span className="text-indigo-400 font-bold uppercase text-[10px]">Brand Protection Guidance</span>
            <p className="text-slate-300 text-[11px]">{data.recommendation}</p>
          </div>
        </div>
      );
    }

    // 80. Burp Suite Enterprise DAST View
    if (data.scanEngine?.includes('Burp Suite') && data.vulnerabilities !== undefined && data.crawledEndpointsCount !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#f97316]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Burp Suite Enterprise DAST Vulnerability Scanner</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.dastPostureGrade.includes('FAIL') ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              {data.dastPostureGrade}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Target: {data.targetUrl} • Duration: {data.duration}
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg font-bold">
              Crawled: {data.crawledEndpointsCount}
            </span>
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg font-bold">
              OOB Payloads: {data.collaboratorPayloadsFired}
            </span>
          </div>

          {data.vulnerabilities?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Identified DAST Security Issues</span>
              {data.vulnerabilities.map((v, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{v.name}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${v.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : v.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {v.severity} • {v.cwe}
                    </span>
                  </div>
                  <p className="text-cyan-300 font-mono text-[11px]">{v.path}</p>
                  <p className="text-slate-400 text-[10px] italic">Fix: {v.remediation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 81. OpenVAS Network Vulnerability Engine View
    if (data.scanner?.includes('OpenVAS') && data.findings !== undefined && data.nvtsExecuted !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#7c3aed]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">OpenVAS Network Vulnerability Scanner (GVM)</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded-lg text-xs font-bold uppercase">
              Risk: {data.riskScore}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Host: {data.target} • Checks: {data.nvtsExecuted?.toLocaleString()} NVTs
            </span>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg">
              Open Ports: {data.openPortsDetected?.join(', ')}
            </span>
          </div>

          {data.findings?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">NVT Vulnerability Findings</span>
              {data.findings.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{f.nvtName}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${f.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      CVSS {f.cvss} • {f.cve}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px]">Port: {f.port} • OID: {f.oid}</p>
                  <p className="text-slate-300 text-[11px]">Remediation: {f.solution}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 82. GoPhish Phishing Simulation Campaign View
    if (data.campaign !== undefined && data.metrics !== undefined && data.rates !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#a855f7]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">GoPhish Phishing Awareness Campaign Analytics</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.riskAssessment.includes('HIGH') ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              {data.riskAssessment}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <span className="text-slate-400 text-[10px]">Sent</span>
              <p className="text-white font-bold text-sm">{data.metrics.emailsSent}</p>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <span className="text-slate-400 text-[10px]">Opened</span>
              <p className="text-blue-400 font-bold text-sm">{data.rates.openRate}</p>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <span className="text-slate-400 text-[10px]">Clicked</span>
              <p className="text-amber-400 font-bold text-sm">{data.rates.clickRate}</p>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <span className="text-slate-400 text-[10px]">Compromised</span>
              <p className="text-rose-400 font-bold text-sm">{data.rates.credentialCompromiseRate}</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-300">
              <span>Template: {data.metrics.templateUsed}</span>
              <span className="text-emerald-400 font-bold">Report Rate: {data.rates.userReportingRate}</span>
            </div>
            <p className="text-slate-500 text-[10px]">Sending Profile: {data.metrics.sendingProfile}</p>
          </div>
        </div>
      );
    }

    // 83. Evilginx Reverse-Proxy MFA Resilience View
    if (data.phishletBypassRisk !== undefined && data.mfaAudits !== undefined && data.loginEndpoint !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#ea580c]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Evilginx Reverse-Proxy MFA Bypass Auditor</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-bold uppercase">
              {data.authDomain}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs space-y-1">
            <span className="text-red-400 font-bold uppercase text-[10px]">Bypass Vulnerability Assessment</span>
            <p className="text-slate-300 text-[11px]">{data.phishletBypassRisk}</p>
          </div>

          {data.mfaAudits?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">MFA Protocol Phishing Resilience Comparison</span>
              {data.mfaAudits.map((m, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-white font-bold">{m.mfaMethod}</span>
                    <p className="text-slate-400 text-[10px]">{m.notes}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${m.evilginxBypassable ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {m.phishResistance}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1">
            <span className="text-indigo-400 font-bold uppercase text-[10px]">Hardening Recommendation</span>
            <p className="text-slate-300 text-[11px]">{data.recommendation}</p>
          </div>
        </div>
      );
    }

    // 84. CIS-CAT Host Baseline Benchmark View
    if (data.benchmarkProfile?.includes('CIS') && data.complianceScore !== undefined && data.sections !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#eab308]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">CIS-CAT Host Baseline Benchmark Evaluation</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 rounded-lg text-xs font-bold uppercase">
              Score: {data.complianceScore}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Host: {data.targetHost}
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold">
              Passed: {data.passedChecks}
            </span>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg font-bold">
              Failed: {data.failedChecks}
            </span>
          </div>

          {data.sections?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">CIS Benchmark Section Scores</span>
              {data.sections.map((s, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">{s.section}</span>
                    <span className="text-slate-500 text-[10px] ml-2 font-mono">({s.passed} Passed / {s.failed} Failed)</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${s.score >= 90 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {s.score}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 85. Garak LLM Vulnerability & Hallucination Scanner View
    if (data.framework?.includes('Garak') && data.probeBreakdown !== undefined && data.overallSafetyScore !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#06b6d4]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Garak Generative AI Vulnerability Scanner</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.safetyGrade.includes('EXCELLENT') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'}`}>
              Safety: {data.overallSafetyScore}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Target: {data.targetModel}
            </span>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg font-bold">
              Probes Fired: {data.totalProbesFired}
            </span>
          </div>

          {data.probeBreakdown?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Garak Probe Taxonomy Breakdown</span>
              {data.probeBreakdown.map((p, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-white font-bold">{p.category}</span>
                    <p className="text-slate-500 text-[10px]">{p.probe}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[10px]">({p.passes} Passed / {p.fails} Failed)</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${parseFloat(p.passRate) >= 95 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {p.passRate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 86. AI Red-Teaming & Alignment CLI View
    if (data.engine?.includes('AI Red-Teaming') && data.attackVectors !== undefined && data.refusalRate !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#dc2626]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Red-Teaming Adversarial Alignment Suite</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg text-xs font-bold uppercase">
              Refusal Rate: {data.refusalRate}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Target: {data.modelTarget}
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold">
              Alignment: {data.alignmentScore}
            </span>
          </div>

          {data.attackVectors?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Adversarial Vector Results</span>
              {data.attackVectors.map((a, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <span className="text-white font-bold">{a.attackVector}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px]">Margin: {a.safetyMargin}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/20 text-emerald-400">
                      {a.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1">
            <span className="text-indigo-400 font-bold uppercase text-[10px]">Model Alignment Remediation</span>
            <p className="text-slate-300 text-[11px]">{data.recommendation}</p>
          </div>
        </div>
      );
    }

    // 87. LLM System Prompt Boundary Fuzzer View
    if (data.leakResilienceScore !== undefined && data.mutations !== undefined && data.boundaryIntegrity !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#10b981]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Prompt Boundary Fuzzer & Leak Guard</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${data.boundaryIntegrity === 'HARDENED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
              Resilience: {data.leakResilienceScore}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Target Prompt Under Fuzzing:</span>
            <p className="text-cyan-300 italic font-mono">{data.systemPromptSample}</p>
          </div>

          {data.mutations?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Delimiter & Special Token Fuzzing Payloads</span>
              {data.mutations.map((m, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <span className="text-white font-mono text-[11px]">{m.mutation}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px]">Risk: {m.leakRisk}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${m.boundaryResilience === 'DEFENDED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {m.boundaryResilience}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 88. MISP Threat Intelligence Feed Publisher View
    if (data.feedDestination !== undefined && data.event !== undefined && data.event.galaxyTags !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#ea580c]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">MISP Threat Intelligence Feed Publisher</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-bold uppercase">
              {data.event.tlp}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Event: {data.event.eventName} ({data.event.eventId})
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg">
              Destination: {data.feedDestination}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {data.event.galaxyTags?.map((tag, ti) => (
              <span key={ti} className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] border border-purple-500/30">
                {tag}
              </span>
            ))}
          </div>

          {data.event.attributes?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Published IOC Attributes ({data.event.attributes.length})</span>
              {data.event.attributes.map((attr, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-cyan-400 font-mono font-bold">{attr.value}</span>
                    <p className="text-slate-500 text-[10px]">Type: {attr.type} • Category: {attr.category}</p>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/20 text-emerald-400">
                    IDS EXPORT
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 89. SOC Incident Playbook Orchestration View
    if (data.playbookId !== undefined && data.steps !== undefined && data.orchestrationStatus !== undefined) {
      return (
        <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-[#06b6d4]/30 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">SOC Automated Playbook Orchestration Runner</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">{data.summary}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold uppercase">
              {data.orchestrationStatus}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              Playbook: {data.playbookName} ({data.playbookId})
            </span>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg font-bold">
              Execution Time: {data.totalExecutionTime}
            </span>
          </div>

          {data.steps?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Automated Playbook Execution Steps</span>
              {data.steps.map((st, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                      {st.step}
                    </span>
                    <span className="text-white font-bold">{st.action}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px] font-mono">{st.duration}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/20 text-emerald-400">
                      {st.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
            <span className="text-emerald-400 font-bold uppercase text-[10px]">Containment Status</span>
            <p className="text-slate-300 text-[11px]">{data.incidentContainment}</p>
          </div>
        </div>
      );
    }

    // If data is an array of items
    if (Array.isArray(data)) {
      return (
        <div style={styles.cardsGrid}>
          {data.map((item, i) => (
            <div key={i} style={styles.card}>
              <div style={styles.cardIcon}>{item.icon || '📋'}</div>
              <div style={styles.cardBody}>
                <span style={styles.cardLabel}>{item.label || item.key || `Item ${i + 1}`}</span>
                <span style={styles.cardValue}>
                  {typeof item.value === 'object'
                    ? JSON.stringify(item.value, null, 2)
                    : String(item.value ?? '—')}
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // If data is a plain object, render each key as a card
    if (typeof data === 'object') {
      const riskScore = data.riskScore ?? data.risk_score ?? data.score ?? null;
      const entries = Object.entries(data).filter(
        ([k]) => !['riskScore', 'risk_score', 'score'].includes(k)
      );

      return (
        <>
          {renderRiskScore(riskScore)}
          <div style={styles.cardsGrid}>
            {entries.map(([key, value]) => (
              <div key={key} style={styles.card}>
                <div style={styles.cardIcon}>📄</div>
                <div style={styles.cardBody}>
                  <span style={styles.cardLabel}>{formatLabel(key)}</span>
                  <span style={styles.cardValue}>
                    {typeof value === 'object'
                      ? JSON.stringify(value, null, 2)
                      : String(value ?? '—')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    // Fallback: raw string
    return (
      <div style={styles.card}>
        <div style={styles.cardBody}>
          <span style={styles.cardValue}>{String(data)}</span>
        </div>
      </div>
    );
  };

  const renderSkeletonCards = () => (
    <div style={styles.cardsGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ ...styles.card, ...styles.skeletonCard }}>
          <div style={styles.skeletonIcon} />
          <div style={styles.skeletonBody}>
            <div style={{ ...styles.skeletonLine, width: '40%' }} />
            <div style={{ ...styles.skeletonLine, width: '70%' }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Description */}
      <p style={styles.description}>{tool.description}</p>

      {/* Capabilities */}
      {tool.capabilities?.length > 0 && (
        <div style={styles.capsRow}>
          {tool.capabilities.map((cap) => (
            <span key={cap} style={{ ...styles.capBadge, borderColor: `${toolColor}40`, color: toolColor }}>
              {cap}
            </span>
          ))}
        </div>
      )}

      {/* Input section */}
      <div style={styles.inputSection}>
        <label style={styles.inputLabel}>Target</label>
        <div style={styles.inputRow}>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tool.inputPlaceholder || 'Enter target...'}
            disabled={analyzing}
            style={{
              ...styles.input,
              borderColor: analyzing ? 'rgba(255,255,255,0.06)' : `${toolColor}40`,
            }}
          />
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !target.trim()}
            style={{
              ...styles.analyzeButton,
              background: analyzing
                ? 'rgba(255,255,255,0.05)'
                : `linear-gradient(135deg, ${toolColor}, ${toolColor}cc)`,
              cursor: analyzing || !target.trim() ? 'not-allowed' : 'pointer',
              opacity: analyzing || !target.trim() ? 0.5 : 1,
            }}
          >
            {analyzing ? (
              <span style={styles.spinnerWrap}>
                <span style={styles.spinner}>⟳</span> Analyzing…
              </span>
            ) : (
              '🔬 Analyze'
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={styles.errorIcon}>✖</span> {error}
            </div>
            {error.includes('sign in') && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  onClick={() => navigate('/login')}
                  style={{ background: '#00bfff', color: '#0a0e1a', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  style={{ background: 'transparent', border: '1px solid #00bfff', color: '#00bfff', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report section */}
      <div style={styles.reportSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={styles.reportTitle}>
            {analyzing ? 'Analyzing…' : results ? 'Analysis Report' : 'Report'}
          </h3>
          {results && !analyzing && (
            <button
              onClick={handleExportPdf}
              style={styles.exportButton}
            >
              📄 Export PDF
            </button>
          )}
        </div>
        {analyzing && renderSkeletonCards()}
        {!analyzing && results && renderResultCards(results)}
        {!analyzing && !results && !error && (
          <p style={styles.reportPlaceholder}>
            Enter a target above and click Analyze to generate a report.
          </p>
        )}
      </div>
    </div>
  );
};

/* ── Helpers ── */
const formatLabel = (key) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();

/* ═══════════════════════════════════════════════════════
   Inline Styles
   ═══════════════════════════════════════════════════════ */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  description: {
    margin: 0,
    fontSize: '15px',
    lineHeight: 1.6,
    color: '#94a3b8',
  },

  /* Capabilities */
  capsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  capBadge: {
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid',
    background: 'transparent',
  },

  /* Input */
  inputSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inputLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#e2e8f0',
    letterSpacing: '0.03em',
  },
  inputRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    minWidth: '220px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid',
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0',
    fontSize: '14px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  analyzeButton: {
    padding: '12px 28px',
    borderRadius: '10px',
    border: 'none',
    color: '#0a0e1a',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.02em',
    transition: 'opacity 0.2s',
    whiteSpace: 'nowrap',
  },
  spinnerWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#94a3b8',
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
    fontSize: '16px',
  },

  /* Error */
  errorBox: {
    padding: '12px 16px',
    borderRadius: '10px',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#fca5a5',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  errorIcon: {
    color: '#ef4444',
    fontWeight: 700,
  },

  /* Report */
  reportSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  reportTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  reportPlaceholder: {
    margin: 0,
    fontSize: '14px',
    color: '#475569',
    fontStyle: 'italic',
  },

  /* Cards */
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    transition: 'border-color 0.2s',
  },
  cardIcon: {
    fontSize: '20px',
    flexShrink: 0,
    width: '28px',
    textAlign: 'center',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    minWidth: 0,
  },
  cardLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardValue: {
    fontSize: '14px',
    color: '#e2e8f0',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },

  /* Risk score */
  riskSection: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  riskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#94a3b8',
  },
  riskValue: {
    fontSize: '20px',
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  riskTrack: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  riskFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.6s ease',
  },

  /* Skeleton loading */
  skeletonCard: {
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  skeletonIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  skeletonBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  skeletonLine: {
    height: '12px',
    borderRadius: '4px',
    background: 'rgba(255,255,255,0.06)',
  },
  exportButton: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(0, 212, 255, 0.4)',
    background: 'rgba(0, 212, 255, 0.1)',
    color: '#00bfff',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default AnalyzerToolView;
