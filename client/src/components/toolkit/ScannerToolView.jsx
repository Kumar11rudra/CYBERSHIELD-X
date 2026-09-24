import React, { useState, useRef, useEffect, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { Play, RotateCw, Download, Copy, Check, Terminal, Shield, AlertTriangle, Activity } from 'lucide-react';

import toast from 'react-hot-toast';

import { getToolConfig } from './toolConfig';

import api from '../../services/api';

import { useAuth } from '../../context/AuthContext';

import usePdfExport from '../../hooks/usePdfExport';



/**

 * ⚡ ScannerToolView — CyberShield X

 * Execution-first view for scanner-type tools (Nmap, Port Scanner, Nikto, Nuclei, etc.).

 *

 * Features:

 * - Direct HTTP execution via POST /api/toolkit/execute with { toolId, target }

 * - Authoritative HTTP execution path (dead client-side /ws/toolkit fallback removed)

 * - Animated cyber scanning state with radar pulse

 * - Monospace output stream terminal with auto-scroll and terminal controls

 * - PDF Export functionality and clipboard log copy

 * - Structured result cards for Subdomains, IPv6, and Dnsx resolvers

 * - Accessible inputs, keyboard shortcuts (Enter to scan), and error handling

 */

export default function ScannerToolView({ toolId }) {

  const tool = getToolConfig(toolId);

  const [target, setTarget] = useState('');

  const [results, setResults] = useState('');

  const [scanning, setScanning] = useState(false);

  const [error, setError] = useState(null);

  const [copied, setCopied] = useState(false);

  const [structuredData, setStructuredData] = useState(null);



  const terminalRef = useRef(null);

  const { user } = useAuth();

  const navigate = useNavigate();

  const { exportToolReportPdf } = usePdfExport();



  // Auto-scroll terminal on new output

  useEffect(() => {

    if (terminalRef.current) {

      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;

    }

  }, [results]);



  const appendResult = useCallback((text) => {

    setResults((prev) => prev + text);

  }, []);



  const handleExportPdf = () => {

    if (!user) {

      toast.error('You must login first to download the report.');

      navigate('/login');

      return;

    }

    exportToolReportPdf(

      tool?.name || toolId,

      target,

      { rawAnalysis: results, structured: structuredData, riskLevel: 'safe', score: 0 },

      user

    );

  };



  const handleCopyLogs = () => {

    if (!results) return;

    navigator.clipboard.writeText(results);

    setCopied(true);

    toast.success('Terminal output copied to clipboard');

    setTimeout(() => setCopied(false), 2000);

  };



  // Authoritative HTTP execution pipeline

  const executeScanHTTP = useCallback(

    async (scanTarget) => {

      try {

        appendResult(`[*] Initializing ${tool?.name || toolId} against target: ${scanTarget}...\n`);

        appendResult(`[*] Dispatching scan probe to CyberShield execution engine...\n`);



        const response = await api.post('/toolkit/execute', {

          toolId,

          target: scanTarget,

        });



        const data = response.data;

        if (data?.results && typeof data.results === 'object') {

          setStructuredData(data.results);

        }



        if (data?.output) {

          appendResult(data.output);

        } else if (data?.results) {

          appendResult(

            typeof data.results === 'string'

              ? data.results

              : JSON.stringify(data.results, null, 2)

          );

        } else if (data?.rawOutput) {

          appendResult(data.rawOutput);

        } else {

          appendResult(JSON.stringify(data, null, 2));

        }



        appendResult('\n[✓] Diagnostic scan routine completed successfully.\n');

      } catch (err) {

        if (err.response?.status === 401) {

          setError('Authentication required: Create an account or sign in to use this security scanner.');

        } else {

          const msg =

            err.response?.data?.error ||

            err.response?.data?.message ||

            err.message ||

            'Scan execution failed';

          setError(msg);

          appendResult(`\n[!] Error: ${msg}\n`);

        }

      } finally {

        setScanning(false);

      }

    },

    [toolId, tool?.name, appendResult]

  );



  const handleScan = () => {

    const trimmed = target.trim();

    if (!trimmed || scanning) return;



    setResults('');

    setStructuredData(null);

    setError(null);

    setScanning(true);



    executeScanHTTP(trimmed);

  };



  const handleKeyDown = (e) => {

    if (e.key === 'Enter' && !scanning) {

      handleScan();

    }

  };



  if (!tool) return null;



  const defaultPlaceholder =

    tool.inputPlaceholder ||

    (tool.inputType === 'ip'

      ? 'e.g. 192.168.1.1'

      : tool.inputType === 'url'

      ? 'e.g. https://example.com'

      : 'e.g. scanme.nmap.org');



  return (

    <div className="space-y-6">



      {/* Execution Control Panel */}

      <section

        aria-label="Execution Panel"

        className="p-6 rounded-2xl bg-[#0c162d]/90 border border-slate-800/80 backdrop-blur-md shadow-xl space-y-4 font-mono"

      >

        <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3">

          <div className="flex items-center gap-2">

            <Terminal className="w-4 h-4 text-cyan-400" />

            <span className="text-xs font-bold text-white uppercase tracking-wider">

              EXECUTION PARAMETERS :: {tool.name.toUpperCase()}

            </span>

          </div>



          <span className="text-[11px] text-slate-400">

            Target Type: <strong className="text-cyan-400">{(tool.inputType || 'hostname').toUpperCase()}</strong>

          </span>

        </div>



        {/* Input & Execution Bar */}

        <div className="space-y-2">

          <label htmlFor="scan-target-input" className="block text-xs text-slate-300 font-semibold tracking-wide">

            Target Hostname, Domain, or IP Address

          </label>



          <div className="flex flex-col sm:flex-row items-stretch gap-3">

            <div className="flex-1 relative rounded-xl bg-[#071126] border border-slate-700/80 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all flex items-center px-4 py-3">

              <span className="text-cyan-400/70 text-xs font-bold mr-2 select-none">

                nexus@cybershield:~$

              </span>

              <input

                id="scan-target-input"

                type="text"

                value={target}

                onChange={(e) => setTarget(e.target.value)}

                onKeyDown={handleKeyDown}

                placeholder={defaultPlaceholder}

                disabled={scanning}

                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"

                aria-label={`Target for ${tool.name}`}

              />

            </div>



            <button

              type="button"

              onClick={handleScan}

              disabled={scanning || !target.trim()}

              className={`px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${

                scanning || !target.trim()

                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'

                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#020814] shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer'

              }`}

            >

              {scanning ? (

                <>

                  <RotateCw className="w-4 h-4 animate-spin text-slate-400" />

                  <span>Scanning...</span>

                </>

              ) : (

                <>

                  <Play className="w-4 h-4 fill-current" />

                  <span>Execute Scan</span>

                </>

              )}

            </button>

          </div>



          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">

            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Enter</kbd> to launch scan</span>

            <span className="text-slate-500">SSRF and command sanitization active</span>

          </div>

        </div>

      </section>



      {/* Error Alert Box */}

      {error && (

        <div

          role="alert"

          className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-red-300 text-xs font-mono"

        >

          <div className="flex items-center gap-2.5">

            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />

            <span>{error}</span>

          </div>



          {error.includes('sign in') && (

            <div className="flex items-center gap-2 flex-shrink-0">

              <button

                type="button"

                onClick={() => navigate('/login')}

                className="px-3 py-1.5 rounded-lg bg-cyan-500 text-[#020814] font-bold hover:bg-cyan-400 transition-colors"

              >

                Sign In

              </button>

              <button

                type="button"

                onClick={() => navigate('/signup')}

                className="px-3 py-1.5 rounded-lg border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 transition-colors"

              >

                Create Account

              </button>

            </div>

          )}

        </div>

      )}



      {/* Scanning Radar Progress Indicator */}

      {scanning && (

        <div className="p-4 rounded-xl bg-[#0c162d]/60 border border-cyan-500/30 flex items-center justify-between gap-4 font-mono text-xs">

          <div className="flex items-center gap-3">

            <span className="relative flex h-3 w-3">

              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />

              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />

            </span>

            <span className="text-cyan-400 font-bold">

              SCAN PROBE ACTIVE :: PROBING {target.trim()}

            </span>

          </div>



          <span className="text-slate-400 text-[11px] animate-pulse">

            Awaiting response stream...

          </span>

        </div>

      )}



      {/* Structured Visual Cards for Subdomains & Network Discoveries */}

      {structuredData?.subdomains && (

        <div className="p-6 rounded-2xl bg-[#0c162d]/90 border border-cyan-500/30 shadow-2xl space-y-4 font-mono">

          <div className="flex items-center justify-between border-b border-slate-800 pb-4">

            <div>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Discovered Subdomains</h3>

              <p className="text-[11px] text-slate-400 mt-0.5">{structuredData.summary}</p>

            </div>

            <div className="flex items-center gap-3 text-xs">

              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 font-bold">

                Total: {structuredData.totalCount}

              </span>

              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-bold">

                Live IPs: {structuredData.liveCount}

              </span>

            </div>

          </div>



          <div className="max-h-72 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-800">

            {structuredData.subdomains.map((sub, idx) => (

              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-slate-800 hover:border-cyan-500/40 transition-colors">

                <div className="flex items-center gap-2 min-w-0">

                  <span className="text-[10px] text-slate-500 font-bold">#{idx + 1}</span>

                  <span className="text-xs text-white font-bold truncate">{sub.subdomain}</span>

                  <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 uppercase">

                    {sub.type}

                  </span>

                </div>

                <div className="flex items-center gap-3 shrink-0">

                  <span className="text-xs font-mono text-cyan-400">{sub.ip}</span>

                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${sub.isLive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>

                    {sub.isLive ? '● Live' : '○ Passive'}

                  </span>

                </div>

              </div>

            ))}

          </div>

        </div>

      )}



      {/* Structured Visual Cards for IPv6 & Connectivity */}

      {structuredData?.hasIpv4 !== undefined && structuredData?.hasIpv6 !== undefined && (

        <div className="p-6 rounded-2xl bg-[#0c162d]/90 border border-teal-500/30 shadow-2xl space-y-4 font-mono">

          <div className="flex items-center justify-between border-b border-slate-800 pb-4">

            <div>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider">IPv6 Network Readiness</h3>

              <p className="text-[11px] text-slate-400 mt-0.5">{structuredData.summary}</p>

            </div>

            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${structuredData.isDualStack ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>

              {structuredData.status}

            </span>

          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="p-4 rounded-xl bg-black/40 border border-slate-800">

              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">IPv4 Addresses (A Records)</span>

              <div className="mt-2 space-y-1">

                {structuredData.ipv4Addresses?.length > 0 ? (

                  structuredData.ipv4Addresses.map((ip, i) => (

                    <div key={i} className="text-xs text-white font-mono">{ip}</div>

                  ))

                ) : (

                  <span className="text-xs text-slate-500">None detected</span>

                )}

              </div>

            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-slate-800">

              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">IPv6 Addresses (AAAA Records)</span>

              <div className="mt-2 space-y-1">

                {structuredData.ipv6Addresses?.length > 0 ? (

                  structuredData.ipv6Addresses.map((ip, i) => (

                    <div key={i} className="text-xs text-cyan-400 font-mono break-all">{ip}</div>

                  ))

                ) : (

                  <span className="text-xs text-amber-400/80">No IPv6 records configured</span>

                )}

              </div>

            </div>

          </div>

        </div>

      )}



      {/* Structured Visual Cards for Dnsx Multi-Record Resolver */}

      {structuredData?.records && structuredData?.latencyMs && (

        <div className="p-6 rounded-2xl bg-[#0c162d]/90 border border-cyan-500/30 shadow-2xl space-y-4 font-mono">

          <div className="flex items-center justify-between border-b border-slate-800 pb-4">

            <div>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dnsx Multi-Record Resolution</h3>

              <p className="text-[11px] text-slate-400 mt-0.5">{structuredData.summary}</p>

            </div>

            <div className="flex items-center gap-3 text-xs">

              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 font-bold">

                Records: {structuredData.totalRecords}

              </span>

              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-bold">

                ⚡ {structuredData.latencyMs}

              </span>

            </div>

          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

            {Object.entries(structuredData.records).map(([recType, val]) => {

              const count = Array.isArray(val) ? val.length : val ? 1 : 0;

              return (

                <div key={recType} className="p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1">

                  <div className="flex items-center justify-between">

                    <span className="text-[10px] text-cyan-400 font-bold tracking-wider">{recType}</span>

                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">{count}</span>

                  </div>

                  <div className="text-xs text-white truncate">

                    {Array.isArray(val)

                      ? val.length > 0 ? val[0] : <span className="text-slate-600 text-[11px]">None</span>

                      : val ? (typeof val === 'object' ? JSON.stringify(val).slice(0, 30) : String(val)) : <span className="text-slate-600 text-[11px]">None</span>}

                  </div>

                </div>

              );

            })}

          </div>

        </div>

      )}



      {/* Terminal Output Section */}

      <section

        aria-label="Terminal Stream Output"

        className="rounded-2xl border border-slate-800/80 bg-[#071126]/90 backdrop-blur-md overflow-hidden shadow-2xl font-mono"

      >

        {/* Terminal Header Bar */}

        <div className="px-4 py-3 bg-[#0c162d] border-b border-slate-800 flex items-center justify-between gap-4">

          <div className="flex items-center gap-2">

            <div className="flex items-center gap-1.5" aria-hidden="true">

              <span className="w-3 h-3 rounded-full bg-red-500/80" />

              <span className="w-3 h-3 rounded-full bg-amber-500/80" />

              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />

            </div>



            <span className="text-xs text-slate-300 font-bold tracking-wider uppercase ml-2 flex items-center gap-2">

              <Activity className="w-3.5 h-3.5 text-cyan-400" />

              <span>{scanning ? `SCANNING: ${target}` : results ? 'LIVE SCAN OUTPUT STREAM' : 'OUTPUT TERMINAL'}</span>

            </span>

          </div>



          {/* Action Buttons */}

          <div className="flex items-center gap-2">

            {results && (

              <button

                type="button"

                onClick={handleCopyLogs}

                className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors"

                title="Copy terminal logs"

              >

                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}

                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Logs'}</span>

              </button>

            )}



            {results && !scanning && (

              <button

                type="button"

                onClick={handleExportPdf}

                className="px-3 py-1 rounded-lg text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 flex items-center gap-1.5 transition-colors font-bold"

              >

                <Download className="w-3.5 h-3.5" />

                <span>Export PDF</span>

              </button>

            )}

          </div>

        </div>



        {/* Terminal Content Box */}

        <div

          ref={terminalRef}

          role="region"

          aria-label="Scan Output Console"

          aria-live="polite"

          className="p-4 bg-[#030712] min-h-[220px] max-h-[500px] overflow-y-auto text-xs font-mono scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"

        >

          {results ? (

            <pre className="text-emerald-400/90 whitespace-pre-wrap leading-relaxed select-text font-mono">

              {results}

            </pre>

          ) : (

            <div className="h-44 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">

              <Terminal className="w-8 h-8 text-slate-700" />

              <p className="text-xs">

                {scanning

                  ? 'Awaiting first telemetry frame...'

                  : `Enter target hostname or IP address above and execute scan to begin ${tool.name} analysis.`}

              </p>

            </div>

          )}

        </div>

      </section>



    </div>

  );

}
