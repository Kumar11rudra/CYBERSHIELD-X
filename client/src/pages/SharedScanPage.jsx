import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import ThreatGauge from '../components/scan/ThreatGauge';
import ScanGuidance from '../components/scan/ScanGuidance';
import SecurityAssistantCard from '../components/scan/SecurityAssistantCard';
import RiskBadge from '../components/common/RiskBadge';
import LoadingScreen from '../components/common/LoadingScreen';
import CommunityNotesPanel from '../components/community/CommunityNotesPanel';
import AISummary from '../components/scan/AISummary';
import { motion, AnimatePresence } from 'framer-motion';
import WAFRulesGenerator from '../components/scan/WAFRulesGenerator';

const ThreatTopology = ({ target, riskLevel, threatScore }) => {
  const isDangerous = riskLevel === 'dangerous';
  const color = isDangerous ? '#ff2244' : riskLevel === 'medium' ? '#ff8c00' : '#00ff88';

  const nodes = [
    { id: 'source', label: 'Signal Source', pos: { x: '10%', y: '50%' }, icon: '📡' },
    { id: 'nexus', label: 'Nexus AI Core', pos: { x: '50%', y: '50%' }, icon: '🧠', pulse: true },
    { id: 'target', label: 'Target Perimeter', pos: { x: '90%', y: '50%' }, icon: '🎯' },
    { id: 'global', label: 'Global Feed', pos: { x: '50%', y: '15%' }, icon: '🌐' },
    { id: 'database', label: 'Vault DB', pos: { x: '50%', y: '85%' }, icon: '🔐' }
  ];

  const connections = [
    { from: 'source', to: 'nexus' },
    { from: 'nexus', to: 'target' },
    { from: 'global', to: 'nexus' },
    { from: 'database', to: 'nexus' }
  ];

  return (
    <div className="cyber-card p-6 min-h-[400px] relative overflow-hidden bg-black/40 border-white/5">
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
         <div>
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest">Signal Topology</h3>
            <p className="text-[10px] font-mono text-cyber-muted mt-1 uppercase tracking-wider">Path of Intelligence Analysis</p>
         </div>
         <div className="px-3 py-1 bg-cyber-accent/10 border border-cyber-accent/20 rounded-full">
            <span className="text-[9px] font-mono text-cyber-accent uppercase font-bold animate-pulse">Live Reconstruction</span>
         </div>
      </div>

      <div className="relative w-full h-[280px]">
        {/* SVG Connections Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {connections.map((conn, i) => {
            const from = nodes.find(n => n.id === conn.from).pos;
            const to = nodes.find(n => n.id === conn.to).pos;
            return (
              <motion.line
                key={i}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={color}
                strokeWidth="1"
                strokeOpacity="0.2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              />
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-crosshair"
            style={{ left: node.pos.x, top: node.pos.y }}
          >
            <div className={`w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:border-cyber-accent/50 transition-all ${node.pulse ? 'ring-2 ring-cyber-accent/20' : ''}`}>
               {node.icon}
               {node.pulse && (
                 <motion.div 
                   animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="absolute inset-0 rounded-xl bg-cyber-accent"
                 />
               )}
            </div>
            <span className="mt-2 text-[8px] font-mono text-cyber-muted uppercase tracking-widest whitespace-nowrap bg-black/80 px-2 py-0.5 rounded border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
              {node.label}
            </span>
          </motion.div>
        ))}

        {/* Floating Data Bits */}
        {isDangerous && [...Array(10)].map((_, i) => (
          <motion.div 
            key={i}
            animate={{ 
              x: [Math.random() * 500, Math.random() * 500],
              y: [Math.random() * 300, Math.random() * 300],
              opacity: [0, 0.4, 0]
            }}
            transition={{ duration: 5 + i, repeat: Infinity }}
            className="absolute w-px h-8 bg-red-500/30"
          />
        ))}
      </div>

      <div className="absolute bottom-6 right-6 text-right">
         <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.4em]">Topology Hash</p>
         <p className="text-[9px] font-mono text-cyber-accent font-bold">TXN-SIGN-77x02</p>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, valueClass = '' }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-cyber-border/30 last:border-0">
    <span className="font-mono text-cyber-muted text-xs uppercase tracking-wider">{label}</span>
    <span className={`font-mono text-xs text-right max-w-xs break-all ${valueClass || 'text-cyber-text'}`}>{value ?? '—'}</span>
  </div>
);

export default function SharedScanPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/history/public/${id}`)
      .then((res) => setScan(res.data.scan))
      .catch(() => { toast.error('Scan not found or is private'); navigate('/'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleCopyTarget = async () => {
    try {
      await navigator.clipboard.writeText(scan.target);
      toast.success('Target copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  // Removed handleShareScan

  if (loading) return <LoadingScreen />;
  if (!scan) return null;

  const vt = scan.breakdown?.virusTotal;
  const abuse = scan.breakdown?.abuseIPDB;
  const domainIntel = scan.breakdown?.domainIntel;
  const hashlookup = scan.breakdown?.hashlookup;
  const isDangerous = scan.riskLevel === 'dangerous';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Nav */}
      <div className="flex items-center gap-2 font-mono text-xs text-cyber-muted">
        <Link to="/" className="hover:text-cyber-accent">Home</Link>
        <span>/</span>
        <span className="text-cyber-muted">Shared Scan</span>
        <span>/</span>
        <span className="text-cyber-text truncate max-w-xs font-tech">{scan.target}</span>
      </div>

      {/* Danger alert */}
      {isDangerous && (
        <div className="border border-cyber-red/50 bg-red-900/20 rounded-lg p-4 flex items-start gap-3">
          <span className="text-cyber-red text-xl">⚠</span>
          <div>
            <p className="font-mono text-cyber-red text-sm font-bold uppercase tracking-wider">High Threat Detected</p>
            <p className="font-mono text-cyber-muted text-xs mt-1">
              This target has a high threat score. Do not visit or interact with it.
            </p>
          </div>
        </div>
      )}

      {/* Header card */}
      <div className="cyber-card p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <ThreatGauge score={scan.threatScore} riskLevel={scan.riskLevel} size={180} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <div>
                <p className="font-mono text-cyber-muted text-xs uppercase tracking-wider mb-1">Target</p>
                <p className="font-mono font-tech text-cyber-text text-sm break-all">{scan.target}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs border border-cyber-border/40 px-2 py-1 text-cyber-muted rounded uppercase">{scan.targetType}</span>
                <RiskBadge level={scan.riskLevel} />
              </div>
            </div>

            <InfoRow label="Scan ID" value={scan._id} />
            <InfoRow label="IOC Type" value={scan.targetType?.toUpperCase()} />
            <InfoRow label="Scanned At" value={new Date(scan.createdAt).toLocaleString()} />
            <InfoRow label="Alert Sent" value={scan.alertSent ? '✓ Yes' : 'No'} />
            <InfoRow
              label="Recommended Action"
              value={
                scan.riskLevel === 'dangerous'
                  ? 'Block and investigate immediately'
                  : scan.riskLevel === 'medium'
                    ? 'Review before interacting'
                    : 'Low immediate concern'
              }
            />

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <button onClick={handleCopyTarget} className="font-mono text-xs text-cyber-accent hover:underline uppercase tracking-widest">
                Copy Target
              </button>
              <Link to="/" className="font-mono text-xs text-cyber-muted hover:text-cyber-text uppercase tracking-widest transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AISummary scan={scan} />

      <ScanGuidance scan={scan} />
      
      <ThreatTopology target={scan.target} riskLevel={scan.riskLevel} threatScore={scan.threatScore} />

      {['dangerous', 'medium'].includes(scan.riskLevel) && (
        <WAFRulesGenerator target={scan.target} targetType={scan.targetType} />
      )}

      <SecurityAssistantCard scan={scan} />

      {/* Source scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* VirusTotal */}
        {vt && (
          <div className="cyber-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyber-accent" />
              <h3 className="font-mono text-xs uppercase tracking-wider text-cyber-text font-bold">VirusTotal</h3>
              {scan.sourceScores?.virusTotal !== undefined && (
                <span className="ml-auto font-display text-xl font-bold" style={{
                  color: scan.sourceScores.virusTotal > 75 ? '#ff2244' : scan.sourceScores.virusTotal > 50 ? '#ff8c00' : scan.sourceScores.virusTotal > 20 ? '#ffdd00' : '#00ff88'
                }}>
                  {scan.sourceScores.virusTotal}
                </span>
              )}
            </div>
            {vt.error ? (
              <p className="font-mono text-cyber-muted text-xs">{vt.error}</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {[
                    { label: 'Malicious', value: vt.malicious, color: '#ff2244' },
                    { label: 'Suspicious', value: vt.suspicious, color: '#ff8c00' },
                    { label: 'Harmless', value: vt.harmless, color: '#00ff88' },
                    { label: 'Undetected', value: vt.undetected, color: '#6b7fa3' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="font-mono text-xs text-cyber-muted w-24">{label}</span>
                      <div className="flex-1 h-1.5 bg-cyber-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${vt.total ? (value / vt.total) * 100 : 0}%`, backgroundColor: color, transition: 'width 1s ease' }} />
                      </div>
                      <span className="font-mono text-xs font-bold w-8 text-right" style={{ color }}>{value}</span>
                    </div>
                  ))}
                </div>
                <InfoRow label="Total Engines" value={vt.total} />
                {vt.reputation !== undefined && <InfoRow label="Reputation" value={vt.reputation} />}
                {vt.registrar && <InfoRow label="Registrar" value={vt.registrar} />}
                {vt.creationDate && <InfoRow label="Created" value={new Date(vt.creationDate).toLocaleDateString()} />}
                {vt.lastUpdateDate && <InfoRow label="Last Updated" value={new Date(vt.lastUpdateDate).toLocaleDateString()} />}
                {vt.fileType && <InfoRow label="File Type" value={vt.fileType} />}
                {vt.size && <InfoRow label="File Size" value={`${vt.size} bytes`} />}
                {vt.magic && <InfoRow label="Magic" value={vt.magic} />}
                {vt.meaningfulName && <InfoRow label="Meaningful Name" value={vt.meaningfulName} />}
                {vt.country && <InfoRow label="Country" value={vt.country} />}
                {vt.asOwner && <InfoRow label="AS Owner" value={vt.asOwner} />}
                {vt.firstSubmissionDate && <InfoRow label="First Seen" value={new Date(vt.firstSubmissionDate).toLocaleDateString()} />}
                {vt.lastSubmissionDate && <InfoRow label="Last Seen" value={new Date(vt.lastSubmissionDate).toLocaleDateString()} />}
                {vt.permalink && (
                  <a href={vt.permalink} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-xs text-cyber-accent hover:underline mt-2 inline-block">
                    View on VirusTotal →
                  </a>
                )}
                {vt.names?.length > 0 && (
                  <div className="mt-3">
                    <p className="font-mono text-cyber-muted text-xs mb-2 uppercase tracking-wider">Known File Names</p>
                    <div className="space-y-1">
                      {vt.names.map((name) => (
                        <div key={name} className="font-mono text-xs text-cyber-muted break-all">{name}</div>
                      ))}
                    </div>
                  </div>
                )}
                {vt.lastDnsRecords?.length > 0 && (
                  <div className="mt-3">
                    <p className="font-mono text-cyber-muted text-xs mb-2 uppercase tracking-wider">Recent DNS Records</p>
                    <div className="space-y-1">
                      {vt.lastDnsRecords.map((record, index) => (
                        <div key={`${record.type}-${record.value}-${index}`} className="flex items-center justify-between gap-3">
                          <span className="font-mono text-xs text-cyber-muted">{record.type}</span>
                          <span className="font-mono text-xs text-cyber-text break-all text-right">{record.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {vt.topEngines?.length > 0 && (
                  <div className="mt-3">
                    <p className="font-mono text-cyber-muted text-xs mb-2 uppercase tracking-wider">Detecting Engines</p>
                    <div className="space-y-1">
                      {vt.topEngines.map((e) => (
                        <div key={e.engine} className="flex items-center justify-between">
                          <span className="font-mono text-xs text-cyber-muted">{e.engine}</span>
                          <span className="font-mono text-xs text-cyber-red">{e.result}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* AbuseIPDB */}
        {abuse && (
          <div className="cyber-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyber-orange" />
              <h3 className="font-mono text-xs uppercase tracking-wider text-cyber-text font-bold">AbuseIPDB</h3>
              {scan.sourceScores?.abuseIPDB !== undefined && (
                <span className="ml-auto font-display text-xl font-bold" style={{
                  color: scan.sourceScores.abuseIPDB > 75 ? '#ff2244' : scan.sourceScores.abuseIPDB > 50 ? '#ff8c00' : scan.sourceScores.abuseIPDB > 20 ? '#ffdd00' : '#00ff88'
                }}>
                  {scan.sourceScores.abuseIPDB}
                </span>
              )}
            </div>
            {abuse.error ? (
              <p className="font-mono text-cyber-muted text-xs">{abuse.notApplicable ? 'N/A for URLs' : abuse.error}</p>
            ) : (
              <>
                <div className="mb-4">
                  <p className="font-mono text-cyber-muted text-xs mb-1">Abuse Confidence</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-cyber-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${abuse.abuseConfidenceScore}%`, backgroundColor: abuse.abuseConfidenceScore > 75 ? '#ff2244' : abuse.abuseConfidenceScore > 40 ? '#ff8c00' : '#00ff88' }} />
                    </div>
                    <span className="font-mono text-sm font-bold text-cyber-text">{abuse.abuseConfidenceScore}%</span>
                  </div>
                </div>
                <InfoRow label="ISP" value={abuse.isp} />
                <InfoRow label="Country" value={abuse.countryCode} />
                <InfoRow label="Usage Type" value={abuse.usageType} />
                <InfoRow label="Total Reports" value={abuse.totalReports} valueClass={abuse.totalReports > 50 ? 'text-cyber-red' : 'text-cyber-text'} />
                <InfoRow label="Distinct Users" value={abuse.numDistinctUsers} />
                <InfoRow label="Whitelisted" value={abuse.isWhitelisted ? '✓ Yes' : 'No'} />
                {abuse.lastReportedAt && <InfoRow label="Last Reported" value={new Date(abuse.lastReportedAt).toLocaleDateString()} />}
                {abuse.reports?.length > 0 && (
                  <div className="mt-3">
                    <p className="font-mono text-cyber-muted text-xs mb-2 uppercase tracking-wider">Recent Reports</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {abuse.reports.map((r, i) => (
                        <div key={i} className="bg-cyber-surface border border-cyber-border/30 rounded p-2">
                          <p className="font-mono text-xs text-cyber-muted">{new Date(r.reportedAt).toLocaleDateString()}</p>
                          {r.comment && <p className="font-mono text-xs text-cyber-text mt-1 truncate">{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {domainIntel && !domainIntel.notApplicable && (
          <div className="cyber-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyber-green" />
              <h3 className="font-mono text-xs uppercase tracking-wider text-cyber-text font-bold">Domain Intel</h3>
              {scan.sourceScores?.domainIntel !== undefined && (
                <span className="ml-auto font-display text-xl font-bold" style={{
                  color: scan.sourceScores.domainIntel > 75 ? '#ff2244' : scan.sourceScores.domainIntel > 50 ? '#ff8c00' : scan.sourceScores.domainIntel > 20 ? '#ffdd00' : '#00ff88'
                }}>
                  {scan.sourceScores.domainIntel}
                </span>
              )}
            </div>
            {domainIntel.error ? (
              <p className="font-mono text-cyber-muted text-xs">{domainIntel.error}</p>
            ) : (
              <>
                <InfoRow label="Domain" value={domainIntel.domain} />
                <InfoRow label="Registrar" value={domainIntel.registrar} />
                <InfoRow label="Age" value={domainIntel.ageDays !== null ? `${domainIntel.ageDays} days` : 'Unknown'} />
                <InfoRow label="Registered" value={domainIntel.registrationDate ? new Date(domainIntel.registrationDate).toLocaleDateString() : 'Unknown'} />
                <InfoRow label="Last Changed" value={domainIntel.lastChangedDate ? new Date(domainIntel.lastChangedDate).toLocaleDateString() : 'Unknown'} />
                <InfoRow label="DNSSEC" value={domainIntel.dnssecSigned === null ? 'Unknown' : domainIntel.dnssecSigned ? 'Enabled' : 'Not enabled'} />
                <InfoRow label="SPF" value={domainIntel.hasSpf ? 'Present' : 'Missing'} />
                <InfoRow label="DMARC" value={domainIntel.hasDmarc ? 'Present' : 'Missing'} />
                <InfoRow label="Parked" value={domainIntel.parked ? 'Likely parked' : 'No'} />
                <InfoRow label="A Records" value={domainIntel.aRecords?.length || 0} />
                <InfoRow label="MX Records" value={domainIntel.mxRecords?.length || 0} />
                {domainIntel.nameservers?.length > 0 && (
                  <div className="mt-3">
                    <p className="font-mono text-cyber-muted text-xs mb-2 uppercase tracking-wider">Nameservers</p>
                    <div className="space-y-1">
                      {domainIntel.nameservers.slice(0, 5).map((server) => (
                        <div key={server} className="font-mono text-xs text-cyber-text break-all">{server}</div>
                      ))}
                    </div>
                  </div>
                )}
                {domainIntel.riskFactors?.length > 0 && (
                  <div className="mt-3">
                    <p className="font-mono text-cyber-muted text-xs mb-2 uppercase tracking-wider">Risk Factors</p>
                    <div className="space-y-2">
                      {domainIntel.riskFactors.map((reason) => (
                        <div key={reason} className="bg-cyber-surface border border-cyber-border/30 rounded p-2">
                          <p className="font-mono text-xs text-cyber-text">{reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {hashlookup && !hashlookup.notApplicable && (
          <div className="cyber-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyber-accent" />
              <h3 className="font-mono text-xs uppercase tracking-wider text-cyber-text font-bold">CIRCL Hashlookup</h3>
              {scan.sourceScores?.hashlookup !== undefined && (
                <span className="ml-auto font-display text-xl font-bold" style={{
                  color: scan.sourceScores.hashlookup > 75 ? '#ff2244' : scan.sourceScores.hashlookup > 50 ? '#ff8c00' : scan.sourceScores.hashlookup > 20 ? '#ffdd00' : '#00ff88'
                }}>
                  {scan.sourceScores.hashlookup}
                </span>
              )}
            </div>
            {hashlookup.error ? (
              <p className="font-mono text-cyber-muted text-xs">{hashlookup.error}</p>
            ) : (
              <>
                <InfoRow label="Hash Type" value={hashlookup.hashType?.toUpperCase()} />
                <InfoRow label="Found in Trusted Sets" value={hashlookup.found ? 'Yes' : 'No'} />
                <InfoRow label="Trust" value={hashlookup.trust !== undefined ? `${hashlookup.trust}/100` : 'Unknown'} />
                <InfoRow label="File Name" value={hashlookup.fileName || hashlookup.note || 'Unknown'} />
                <InfoRow label="Database" value={hashlookup.database} />
                <InfoRow label="Source" value={hashlookup.sourceName} />
                <InfoRow label="Product" value={hashlookup.productName} />
                <InfoRow label="App Type" value={hashlookup.applicationType} />
                {hashlookup.fileSize && <InfoRow label="File Size" value={`${hashlookup.fileSize} bytes`} />}
              </>
            )}
          </div>
        )}
      </div>

      <CommunityNotesPanel target={scan.target} targetType={scan.targetType} />
    </div>
  );
}
