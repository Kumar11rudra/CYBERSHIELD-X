import React, { useMemo, useState } from 'react';

import {

  Shield, Globe, Lock, Server, CheckCircle2, AlertTriangle,

  XCircle, Activity, ArrowRight, Hash, Database, Compass,

  FileText, Eye, Code, Layers

} from 'lucide-react';



/**

 * Parses Nmap CLI output into structured port records

 */

function parseNmapPorts(rawText) {

  if (!rawText || !rawText.includes('PORT') || !rawText.includes('STATE')) return null;



  const lines = rawText.split('\n');

  const portLines = [];

  let readingPorts = false;



  for (const line of lines) {

    const trimmed = line.trim();

    if (/^PORT\s+STATE\s+SERVICE/i.test(trimmed)) {

      readingPorts = true;

      continue;

    }

    if (readingPorts) {

      if (!trimmed || trimmed.startsWith('Nmap done') || trimmed.startsWith('Host is')) {

        break;

      }

      const match = trimmed.match(/^(\d+\/(?:tcp|udp))\s+([a-zA-Z|-]+)\s+([^\s]+)(?:\s+(.*))?/);

      if (match) {

        portLines.push({

          port: match[1],

          state: match[2].toLowerCase(),

          service: match[3],

          version: match[4] || '-'

        });

      }

    }

  }



  return portLines.length > 0 ? portLines : null;

}



/**

 * Parses Dig DNS output into structured record objects

 */

function parseDigDns(rawText) {

  if (!rawText || (!rawText.includes('IN') && !rawText.includes('ANSWER SECTION'))) return null;



  const lines = rawText.split('\n');

  const records = [];



  for (const line of lines) {

    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue;



    // Pattern: name  [ttl]  IN  TYPE  value...

    const parts = trimmed.split(/\s+/);

    const inIdx = parts.findIndex(p => p.toUpperCase() === 'IN');

    if (inIdx >= 1 && inIdx < parts.length - 2) {

      const name = parts[0];

      const ttl = inIdx === 2 ? parts[1] : '-';

      const type = parts[inIdx + 1].toUpperCase();

      const value = parts.slice(inIdx + 2).join(' ');

      if (['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'PTR'].includes(type)) {

        records.push({ name, ttl, type, value });

      }

    }

  }



  return records.length > 0 ? records : null;

}



/**

 * Parses HTTP response headers (from curl -IL)

 */

function parseHttpHeaders(rawText) {

  if (!rawText || (!rawText.includes('HTTP/') && !rawText.includes('date:') && !rawText.includes('server:'))) return null;



  const lines = rawText.split('\n');

  const headers = [];

  let statusLine = null;



  for (const line of lines) {

    const trimmed = line.trim();

    if (!trimmed) continue;



    if (/^HTTP\/[\d.]+\s+\d+/i.test(trimmed)) {

      statusLine = trimmed;

      continue;

    }



    const colonIdx = trimmed.indexOf(':');

    if (colonIdx > 0) {

      const key = trimmed.slice(0, colonIdx).trim();

      const value = trimmed.slice(colonIdx + 1).trim();

      headers.push({ key, value });

    }

  }



  return (statusLine || headers.length > 0) ? { statusLine, headers } : null;

}



/**

 * Parses OpenSSL s_client TLS certificate information

 */

function parseOpenSslTls(rawText) {

  if (!rawText || (!rawText.includes('CONNECTED') && !rawText.includes('Certificate chain') && !rawText.includes('Cipher is'))) {

    return null;

  }



  const subjectMatch = rawText.match(/s:([^\n\r]+)/);

  const issuerMatch = rawText.match(/i:([^\n\r]+)/);

  const cipherMatch = rawText.match(/Cipher is ([^\n\r,]+)/);

  const tlsVerMatch = rawText.match(/(TLSv[\d.]+|SSLv[\d.]+)/);

  const protocolMatch = rawText.match(/Protocol\s*:\s*([^\n\r]+)/);



  return {

    subject: subjectMatch ? subjectMatch[1].trim() : null,

    issuer: issuerMatch ? issuerMatch[1].trim() : null,

    cipher: cipherMatch ? cipherMatch[1].trim() : null,

    protocol: (tlsVerMatch ? tlsVerMatch[1] : (protocolMatch ? protocolMatch[1] : 'TLS 1.2/1.3')).trim()

  };

}



/**

 * Parses Ping latency and packet statistics

 */

function parsePingStats(rawText) {

  if (!rawText || !rawText.includes('packets transmitted')) return null;



  const txMatch = rawText.match(/(\d+)\s+packets transmitted/i);

  const rxMatch = rawText.match(/(\d+)\s+(?:packets\s+)?received/i);

  const lossMatch = rawText.match(/([\d.]+)%\s+packet loss/i);

  const rttMatch = rawText.match(/(?:round-trip|rtt)[^=]*=\s*([^\n\r]+)/i);



  if (txMatch && rxMatch) {

    return {

      transmitted: txMatch[1],

      received: rxMatch[1],

      packetLoss: lossMatch ? `${lossMatch[1]}%` : '0%',

      rtt: rttMatch ? rttMatch[1].trim() : null

    };

  }

  return null;

}



/**

 * Parses Traceroute network hop entries

 */

function parseTracerouteHops(rawText) {

  if (!rawText || (!rawText.includes('hops max') && !rawText.includes('traceroute to') && !rawText.match(/^\s*1\s+/m))) {

    return null;

  }



  const lines = rawText.split('\n');

  const hops = [];



  for (const line of lines) {

    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('traceroute') || trimmed.startsWith('---')) continue;



    // Pattern: 1  gateway.local (192.168.1.1)  1.234 ms

    const hopMatch = trimmed.match(/^(\d+)\s+([^\s]+)(?:\s+\(([\d.]+)\))?(?:\s+(.*))?/);

    if (hopMatch) {

      const hopNum = hopMatch[1];

      let host = hopMatch[2];

      let ip = hopMatch[3] || (host.match(/^[\d.]+$/) ? host : '-');

      let rtt = hopMatch[4] ? hopMatch[4].trim() : '*';



      if (host === '*' || host === '* * *') {

        host = '* (Request timed out)';

        ip = '*';

        rtt = '*';

      }



      hops.push({

        hop: hopNum,

        host,

        ip,

        rtt

      });

    }

  }



  return hops.length > 0 ? hops : null;

}



/**

 * Parses WHOIS registry data into structured key-value intelligence

 */

function parseWhoisDossier(rawText) {

  if (!rawText || (!rawText.includes('Domain Name:') && !rawText.includes('Registrar:') && !rawText.includes('registry domain id') && !rawText.includes('netname:'))) {

    return null;

  }



  const lines = rawText.split('\n');

  const attributes = [];

  const nameServers = [];

  const seenKeys = new Set();



  for (const line of lines) {

    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('%') || trimmed.startsWith('#') || trimmed.startsWith('>>>')) continue;



    const colonIdx = trimmed.indexOf(':');

    if (colonIdx > 0) {

      const rawKey = trimmed.slice(0, colonIdx).trim();

      const val = trimmed.slice(colonIdx + 1).trim();



      if (!val) continue;



      if (/^name server/i.test(rawKey) || /^nserver/i.test(rawKey)) {

        if (!nameServers.includes(val.toLowerCase())) {

          nameServers.push(val.toLowerCase());

        }

      } else if (!seenKeys.has(rawKey.toLowerCase())) {

        seenKeys.add(rawKey.toLowerCase());

        attributes.push({ key: rawKey, value: val });

      }

    }

  }



  return (attributes.length > 0 || nameServers.length > 0) ? { attributes, nameServers } : null;

}



/**

 * Primary Safe Output Formatter Component (Step 3)

 * Renders deterministic structured cards with toggleable raw monospace text stream.

 * Strictly guarantees ZERO execution of HTML/JS or Markdown.

 */

export default function TerminalOutputFormatter({ output, toolName = '', className = '' }) {

  const cleanOutput = typeof output === 'string' ? output : (output ? JSON.stringify(output, null, 2) : '');

  const [viewMode, setViewMode] = useState('ALL'); // 'ALL' | 'STRUCTURED' | 'RAW'



  // Structured parses

  const parsedData = useMemo(() => {

    if (!cleanOutput) return null;



    const lowerTool = (toolName || '').toLowerCase();



    // 1. Port scans (nmap or port alias)

    if (lowerTool === 'nmap' || lowerTool === 'port' || cleanOutput.includes('PORT     STATE')) {

      const ports = parseNmapPorts(cleanOutput);

      if (ports) return { type: 'PORTS', data: ports };

    }



    // 2. DNS Queries (dig or dns alias)

    if (lowerTool === 'dig' || lowerTool === 'dns' || cleanOutput.includes(';; ANSWER SECTION:') || cleanOutput.includes('+noall')) {

      const dnsRecords = parseDigDns(cleanOutput);

      if (dnsRecords) return { type: 'DNS', data: dnsRecords };

    }



    // 3. TLS / SSL (openssl or ssl alias)

    if (lowerTool === 'openssl' || lowerTool === 'ssl' || cleanOutput.includes('Cipher is') || cleanOutput.includes('Certificate chain')) {

      const tls = parseOpenSslTls(cleanOutput);

      if (tls && (tls.subject || tls.cipher)) return { type: 'TLS', data: tls };

    }



    // 4. HTTP Headers (curl or http alias)

    if (lowerTool === 'curl' || lowerTool === 'http' || cleanOutput.includes('HTTP/1.') || cleanOutput.includes('HTTP/2')) {

      const http = parseHttpHeaders(cleanOutput);

      if (http && (http.statusLine || http.headers.length > 2)) return { type: 'HTTP', data: http };

    }



    // 5. Ping statistics

    if (lowerTool === 'ping' || cleanOutput.includes('packets transmitted')) {

      const ping = parsePingStats(cleanOutput);

      if (ping) return { type: 'PING', data: ping };

    }



    // 6. Traceroute hop route

    if (lowerTool === 'traceroute' || lowerTool === 'trace' || cleanOutput.includes('hops max')) {

      const hops = parseTracerouteHops(cleanOutput);

      if (hops) return { type: 'TRACEROUTE', data: hops };

    }



    // 7. WHOIS intelligence dossier

    if (lowerTool === 'whois' || cleanOutput.includes('Domain Name:') || cleanOutput.includes('Registrar:')) {

      const whois = parseWhoisDossier(cleanOutput);

      if (whois) return { type: 'WHOIS', data: whois };

    }



    return null;

  }, [cleanOutput, toolName]);



  // Fallback line-by-line renderer

  const renderMonospaceLines = (text) => {

    const lines = text.split('\n');

    return (

      <div className="font-mono text-xs leading-relaxed space-y-0.5 overflow-x-auto select-text">

        {lines.map((line, idx) => {

          let lineClass = 'text-slate-300';

          if (line.startsWith('[+]') || line.includes('open') || line.includes('SUCCESS')) {

            lineClass = 'text-emerald-400 font-medium';

          } else if (line.startsWith('[-]') || line.startsWith('Host is up')) {

            lineClass = 'text-cyan-400';

          } else if (line.startsWith('[*]') || line.startsWith('Starting') || line.startsWith('Nmap done')) {

            lineClass = 'text-cyan-300/80';

          } else if (line.startsWith('[!]') || line.toLowerCase().includes('error') || line.toLowerCase().includes('failed') || line.includes('closed')) {

            lineClass = 'text-rose-400 font-semibold';

          } else if (line.startsWith(';') || line.startsWith('#')) {

            lineClass = 'text-slate-500 italic';

          }



          return (

            <div key={idx} className="flex items-start gap-2 hover:bg-white/[0.02] px-1 rounded">

              <span className="text-slate-600 select-none text-[10px] w-6 text-right flex-shrink-0 pt-0.5">

                {idx + 1}

              </span>

              <span className={`break-all whitespace-pre-wrap ${lineClass}`}>

                {line}

              </span>

            </div>

          );

        })}

      </div>

    );

  };



  if (!cleanOutput) {

    return (

      <div className="text-slate-500 font-mono text-xs italic py-2">

        (No standard output returned)

      </div>

    );

  }



  const showStructured = Boolean(parsedData) && (viewMode === 'ALL' || viewMode === 'STRUCTURED');

  const showRaw = viewMode === 'ALL' || viewMode === 'RAW' || !parsedData;



  return (

    <div className={`space-y-3 ${className}`}>

      {/* ── View Controls (Structured vs Raw Stream) ────────────────── */}

      {parsedData && (

        <div className="flex items-center justify-between px-1 text-[10px] font-mono text-slate-400 border-b border-white/5 pb-1">

          <div className="flex items-center gap-1.5">

            <Layers size={11} className="text-cyan-400" />

            <span className="font-bold text-slate-300 uppercase">View Mode:</span>

          </div>

          <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">

            <button

              onClick={() => setViewMode('ALL')}

              className={`px-2 py-0.5 rounded text-[10px] transition-all ${

                viewMode === 'ALL'

                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'

                  : 'text-slate-500 hover:text-slate-300'

              }`}

            >

              Both

            </button>

            <button

              onClick={() => setViewMode('STRUCTURED')}

              className={`px-2 py-0.5 rounded text-[10px] transition-all ${

                viewMode === 'STRUCTURED'

                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'

                  : 'text-slate-500 hover:text-slate-300'

              }`}

            >

              Structured Only

            </button>

            <button

              onClick={() => setViewMode('RAW')}

              className={`px-2 py-0.5 rounded text-[10px] transition-all ${

                viewMode === 'RAW'

                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'

                  : 'text-slate-500 hover:text-slate-300'

              }`}

            >

              Raw Stream Only

            </button>

          </div>

        </div>

      )}



      {/* ── Structured Port Scan Table ─────────────────────────── */}

      {showStructured && parsedData?.type === 'PORTS' && (

        <div className="bg-[#030919] border border-cyan-500/20 rounded-xl overflow-hidden shadow-lg">

          <div className="px-3 py-2 bg-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between">

            <div className="flex items-center gap-2">

              <Server size={14} className="text-cyan-400" />

              <span className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider">

                Audited Network Sockets ({parsedData.data.length} Detected)

              </span>

            </div>

            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">

              NMAP PARSED

            </span>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left font-mono text-xs">

              <thead className="bg-slate-900/60 text-slate-400 border-b border-white/5 uppercase text-[10px]">

                <tr>

                  <th className="px-3 py-2">Port / Protocol</th>

                  <th className="px-3 py-2">Socket State</th>

                  <th className="px-3 py-2">Service</th>

                  <th className="px-3 py-2">Version / Extra</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-white/5">

                {parsedData.data.map((row, i) => (

                  <tr key={i} className="hover:bg-white/[0.03] transition-colors">

                    <td className="px-3 py-2 font-bold text-white">{row.port}</td>

                    <td className="px-3 py-2">

                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${

                        row.state === 'open'

                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'

                          : (row.state === 'filtered'

                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'

                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30')

                      }`}>

                        {row.state === 'open' ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}

                        {row.state}

                      </span>

                    </td>

                    <td className="px-3 py-2 text-cyan-300">{row.service}</td>

                    <td className="px-3 py-2 text-slate-400">{row.version}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}



      {/* ── Structured DNS Records Table ────────────────────────── */}

      {showStructured && parsedData?.type === 'DNS' && (

        <div className="bg-[#030919] border border-cyan-500/20 rounded-xl overflow-hidden shadow-lg">

          <div className="px-3 py-2 bg-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between">

            <div className="flex items-center gap-2">

              <Globe size={14} className="text-cyan-400" />

              <span className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider">

                Resolved DNS Zone Records ({parsedData.data.length})

              </span>

            </div>

            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">

              DIG PARSED

            </span>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left font-mono text-xs">

              <thead className="bg-slate-900/60 text-slate-400 border-b border-white/5 uppercase text-[10px]">

                <tr>

                  <th className="px-3 py-2">Domain Name</th>

                  <th className="px-3 py-2">TTL</th>

                  <th className="px-3 py-2">Record Type</th>

                  <th className="px-3 py-2">Resolved Value / Target</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-white/5">

                {parsedData.data.map((rec, i) => (

                  <tr key={i} className="hover:bg-white/[0.03] transition-colors">

                    <td className="px-3 py-2 text-slate-300 font-semibold">{rec.name}</td>

                    <td className="px-3 py-2 text-slate-500">{rec.ttl}</td>

                    <td className="px-3 py-2">

                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">

                        {rec.type}

                      </span>

                    </td>

                    <td className="px-3 py-2 text-emerald-400 font-mono break-all">{rec.value}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}



      {/* ── Structured TLS Certificate Dossier ─────────────────────── */}

      {showStructured && parsedData?.type === 'TLS' && (

        <div className="bg-[#030919] border border-cyan-500/20 rounded-xl p-3.5 shadow-lg space-y-2.5 font-mono text-xs">

          <div className="flex items-center justify-between border-b border-white/5 pb-2">

            <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase tracking-wider">

              <Lock size={14} className="text-emerald-400" />

              <span>TLS Handshake & Cryptographic Cipher Dossier</span>

            </div>

            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">

              OPENSSL PARSED

            </span>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">

            <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-1">

              <div className="text-slate-500 text-[10px] uppercase font-bold">Subject (Peer Common Name)</div>

              <div className="text-emerald-400 font-bold break-all">{parsedData.data.subject || 'Unknown'}</div>

            </div>

            <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-1">

              <div className="text-slate-500 text-[10px] uppercase font-bold">Issuing Authority (CA)</div>

              <div className="text-cyan-300 break-all">{parsedData.data.issuer || 'Unknown'}</div>

            </div>

            <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-1">

              <div className="text-slate-500 text-[10px] uppercase font-bold">Negotiated Cipher Suite</div>

              <div className="text-white font-mono break-all">{parsedData.data.cipher || 'Standard TLS'}</div>

            </div>

            <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-1">

              <div className="text-slate-500 text-[10px] uppercase font-bold">Protocol Version</div>

              <div className="text-cyan-400 font-bold">{parsedData.data.protocol}</div>

            </div>

          </div>

        </div>

      )}



      {/* ── Structured HTTP Headers Table ─────────────────────────── */}

      {showStructured && parsedData?.type === 'HTTP' && (

        <div className="bg-[#030919] border border-cyan-500/20 rounded-xl overflow-hidden shadow-lg font-mono text-xs">

          <div className="px-3 py-2 bg-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between">

            <div className="flex items-center gap-2">

              <Globe size={14} className="text-cyan-400" />

              <span className="font-bold text-cyan-300">

                HTTP Headers {parsedData.data.statusLine ? `• ${parsedData.data.statusLine}` : ''}

              </span>

            </div>

            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">

              CURL PARSED

            </span>

          </div>

          <div className="overflow-x-auto max-h-60 overflow-y-auto">

            <table className="w-full text-left font-mono text-xs">

              <thead className="bg-slate-900/60 text-slate-400 border-b border-white/5 uppercase text-[10px] sticky top-0">

                <tr>

                  <th className="px-3 py-1.5">Header</th>

                  <th className="px-3 py-1.5">Value</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-white/5">

                {parsedData.data.headers.map((hdr, i) => (

                  <tr key={i} className="hover:bg-white/[0.03] transition-colors">

                    <td className="px-3 py-1.5 font-bold text-cyan-300 whitespace-nowrap">{hdr.key}</td>

                    <td className="px-3 py-1.5 text-slate-300 break-all">{hdr.value}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}



      {/* ── Structured Ping / Latency Metrics ──────────────────────── */}

      {showStructured && parsedData?.type === 'PING' && (

        <div className="bg-[#030919] border border-cyan-500/20 rounded-xl p-3 shadow-lg flex flex-wrap items-center gap-3 font-mono text-xs">

          <div className="flex items-center gap-2">

            <Activity size={14} className="text-emerald-400" />

            <span className="font-bold text-white">ICMP Network Reachability:</span>

          </div>

          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">

            Packets: {parsedData.data.received}/{parsedData.data.transmitted} ({parsedData.data.packetLoss} loss)

          </span>

          {parsedData.data.rtt && (

            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">

              RTT: {parsedData.data.rtt}

            </span>

          )}

          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 ml-auto">

            PING PARSED

          </span>

        </div>

      )}



      {/* ── Structured Traceroute Hop Table ────────────────────────── */}

      {showStructured && parsedData?.type === 'TRACEROUTE' && (

        <div className="bg-[#030919] border border-cyan-500/20 rounded-xl overflow-hidden shadow-lg font-mono text-xs">

          <div className="px-3 py-2 bg-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between">

            <div className="flex items-center gap-2">

              <Compass size={14} className="text-cyan-400" />

              <span className="font-bold text-cyan-300 uppercase tracking-wider">

                Network Gateway Transit Hops ({parsedData.data.length} Identified)

              </span>

            </div>

            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">

              TRACEROUTE PARSED

            </span>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left font-mono text-xs">

              <thead className="bg-slate-900/60 text-slate-400 border-b border-white/5 uppercase text-[10px]">

                <tr>

                  <th className="px-3 py-1.5 w-12">Hop</th>

                  <th className="px-3 py-1.5">Route Hostname / Node</th>

                  <th className="px-3 py-1.5">Resolved IP</th>

                  <th className="px-3 py-1.5">RTT Latency</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-white/5">

                {parsedData.data.map((h, i) => (

                  <tr key={i} className="hover:bg-white/[0.03] transition-colors">

                    <td className="px-3 py-1.5 font-bold text-cyan-400">{h.hop}</td>

                    <td className="px-3 py-1.5 text-white font-medium">{h.host}</td>

                    <td className="px-3 py-1.5 text-slate-400">{h.ip}</td>

                    <td className="px-3 py-1.5 text-emerald-400 font-mono">{h.rtt}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}



      {/* ── Structured WHOIS Intelligence Dossier ─────────────────── */}

      {showStructured && parsedData?.type === 'WHOIS' && (

        <div className="bg-[#030919] border border-cyan-500/20 rounded-xl p-3.5 shadow-lg space-y-2.5 font-mono text-xs">

          <div className="px-1 flex items-center justify-between border-b border-white/5 pb-2">

            <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase tracking-wider">

              <FileText size={14} className="text-cyan-400" />

              <span>WHOIS Domain & Registrar Intelligence Dossier</span>

            </div>

            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">

              WHOIS PARSED

            </span>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 max-h-64 overflow-y-auto">

            {parsedData.data.attributes.slice(0, 10).map((attr, idx) => (

              <div key={idx} className="bg-black/40 p-2 rounded-lg border border-white/5">

                <div className="text-slate-500 text-[10px] uppercase font-bold">{attr.key}</div>

                <div className="text-slate-200 font-medium break-all">{attr.value}</div>

              </div>

            ))}

          </div>

          {parsedData.data.nameServers && parsedData.data.nameServers.length > 0 && (

            <div className="bg-black/30 p-2 rounded-lg border border-white/5 pt-1.5">

              <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Authoritative Name Servers</div>

              <div className="flex flex-wrap gap-1.5">

                {parsedData.data.nameServers.map((ns, idx) => (

                  <span key={idx} className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px]">

                    {ns}

                  </span>

                ))}

              </div>

            </div>

          )}

        </div>

      )}



      {/* ── Monospace CLI Output Stream (Always available for full forensic fidelity) ── */}

      {showRaw && (

        <div className="mt-2 pt-2 border-t border-white/5">

          <div className="text-[10px] font-mono text-slate-500 mb-1 flex items-center justify-between select-none">

            <span>RAW HOST EXECUTION BUFFER</span>

            <span>{cleanOutput.split('\n').length} lines</span>

          </div>

          {renderMonospaceLines(cleanOutput)}

        </div>

      )}

    </div>

  );

}
