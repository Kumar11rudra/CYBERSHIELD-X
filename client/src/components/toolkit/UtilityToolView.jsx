import React, { useState, useMemo, useEffect } from 'react';
import { Copy, Check, Terminal, Key, FileText, Link2, Bot, Send, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { getToolConfig } from './toolConfig';

// ─── 1. JWT Parser Component (100% Client-side) ─────────────────────────────
const JwtParserView = () => {
  const [token, setToken] = useState('');
  const [copiedSection, setCopiedSection] = useState(null);

  const decoded = useMemo(() => {
    if (!token.trim()) return null;
    try {
      const parts = token.trim().split('.');
      if (parts.length !== 3) {
        return { error: 'Invalid JWT structure. A JWT must consist of three dot-separated Base64URL segments (Header.Payload.Signature).' };
      }
      const [headerB64, payloadB64, signature] = parts;
      const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
      return { header, payload, signature };
    } catch {
      return { error: 'Failed to decode JWT token. Ensure payload contains valid Base64URL-encoded JSON.' };
    }
  }, [token]);

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast.success(`${section} copied to clipboard`);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Input Token Card */}
      <div className="p-6 rounded-2xl bg-[#0c162d]/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
            <Key className="w-4 h-4 text-cyan-400" />
            <span>ENCODED JWT BEARER TOKEN</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-bold">100% Client-Side Private</span>
        </div>

        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={4}
          className="w-full p-3.5 bg-[#071126] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 font-mono resize-y"
          placeholder="Paste encoded JWT token here (e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
          aria-label="Encoded JWT token"
        />

        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Tokens are parsed locally in browser memory and never transmitted over the network.</span>
          {token && (
            <button
              type="button"
              onClick={() => setToken('')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Decoded Result Sections */}
      {decoded && (
        <div className="space-y-4">
          {decoded.error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{decoded.error}</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Header Section */}
                <div className="p-5 rounded-2xl bg-[#0c162d]/90 border border-amber-500/30 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      HEADER :: ALGORITHM & TOKEN TYPE
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(JSON.stringify(decoded.header, null, 2), 'Header')}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Copy header"
                    >
                      {copiedSection === 'Header' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="text-xs text-amber-300/90 whitespace-pre-wrap leading-relaxed overflow-x-auto p-3 bg-black/40 rounded-xl border border-slate-800">
                    {JSON.stringify(decoded.header, null, 2)}
                  </pre>
                </div>

                {/* Payload Section */}
                <div className="p-5 rounded-2xl bg-[#0c162d]/90 border border-emerald-500/30 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      PAYLOAD :: CLAIMS & DATA
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(JSON.stringify(decoded.payload, null, 2), 'Payload')}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Copy payload"
                    >
                      {copiedSection === 'Payload' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="text-xs text-emerald-300/90 whitespace-pre-wrap leading-relaxed overflow-x-auto p-3 bg-black/40 rounded-xl border border-slate-800">
                    {JSON.stringify(decoded.payload, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Signature Section */}
              <div className="p-5 rounded-2xl bg-[#0c162d]/90 border border-red-500/30 shadow-xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                    SIGNATURE VERIFICATION HASH
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(decoded.signature, 'Signature')}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="Copy signature"
                  >
                    {copiedSection === 'Signature' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-slate-800 text-xs text-red-300/90 break-all leading-relaxed">
                  HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), "{decoded.signature}")
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── 2. Base64 Decoder Component (100% Client-side) ────────────────────────
const Base64DecoderView = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('decode');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      return mode === 'decode' ? atob(input.trim()) : btoa(input);
    } catch {
      return 'Error: Invalid base64 sequence or encoding mismatch.';
    }
  }, [input, mode]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Output copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0c162d]/90 border border-slate-800 shadow-xl space-y-4 font-mono">
      {/* Mode Controls Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            BASE64 TRANSLATOR ENGINE
          </h3>
        </div>

        <div className="flex items-center bg-[#071126] p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => { setMode('decode'); setInput(''); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              mode === 'decode'
                ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Decode Base64
          </button>
          <button
            type="button"
            onClick={() => { setMode('encode'); setInput(''); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              mode === 'encode'
                ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Encode Plaintext
          </button>
        </div>
      </div>

      {/* Inputs & Outputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-bold">
              {mode === 'decode' ? 'Base64 Encoded Input' : 'Plaintext Input'}
            </label>
            <span className="text-[11px] text-slate-500">{input.length} chars</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
            className="w-full p-3.5 bg-[#071126] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-mono resize-y"
            placeholder={mode === 'decode' ? 'Paste Base64 string to decode...' : 'Enter plaintext to encode...'}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-bold">
              {mode === 'decode' ? 'Decoded Plaintext Output' : 'Base64 Encoded Output'}
            </label>
            {output && !output.startsWith('Error:') && (
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
          <textarea
            value={output}
            readOnly
            rows={8}
            className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-xs text-purple-300 placeholder-slate-600 font-mono resize-y"
            placeholder="Translation result will appear here in real-time..."
          />
        </div>
      </div>
    </div>
  );
};

// ─── 3. URL Sanitizer Component (100% Client-side) ─────────────────────────
const UrlSanitizerView = () => {
  const [url, setUrl] = useState('');

  const analyzed = useMemo(() => {
    if (!url.trim()) return null;
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      const params = Object.fromEntries(parsed.searchParams.entries());
      return {
        success: true,
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        pathname: parsed.pathname,
        params,
      };
    } catch {
      return { success: false, error: 'Malformed URL pattern. Ensure valid host and syntax.' };
    }
  }, [url]);

  return (
    <div className="space-y-6 font-mono">
      {/* URL Input Card */}
      <div className="p-6 rounded-2xl bg-[#0c162d]/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
            <Link2 className="w-4 h-4 text-cyan-400" />
            <span>URL PAYLOAD & QUERY PARAMETER SANITIZER</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-bold">Client-Side Parser</span>
        </div>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-4 py-3 bg-[#071126] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 font-mono"
          placeholder="Paste URL parameters to analyze (e.g. example.com/pay?user=123&token=abc)..."
        />

        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Isolates query parameters and validates against open-redirect or parameter pollution risks.</span>
          {url && (
            <button
              type="button"
              onClick={() => setUrl('')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Diagnostic Parameter Breakdown */}
      {analyzed && (
        <div className="p-6 rounded-2xl bg-[#0c162d]/90 border border-slate-800 shadow-xl space-y-4">
          {analyzed.error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{analyzed.error}</span>
            </div>
          ) : (
            <>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
                DIAGNOSTIC NETWORK PARAMETERS
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#071126] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Protocol</span>
                  <p className="text-xs text-cyan-400 font-bold">{analyzed.protocol}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#071126] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Hostname</span>
                  <p className="text-xs text-emerald-400 font-bold">{analyzed.hostname}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#071126] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Pathname</span>
                  <p className="text-xs text-white font-bold">{analyzed.pathname}</p>
                </div>
              </div>

              {/* Decoded Query Parameters Table */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Decoded Query Matrix</span>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#071126] text-slate-400 text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Key</th>
                        <th className="py-2.5 px-4">Decoded Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-black/40">
                      {Object.entries(analyzed.params).length === 0 ? (
                        <tr>
                          <td colSpan={2} className="py-4 px-4 text-center text-slate-500">
                            No query parameters present in URL string.
                          </td>
                        </tr>
                      ) : (
                        Object.entries(analyzed.params).map(([k, v]) => (
                          <tr key={k} className="hover:bg-slate-800/30">
                            <td className="py-2 px-4 text-cyan-400 font-bold">{k}</td>
                            <td className="py-2 px-4 text-white break-all">{v}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── 4. Conversational Sidekick for Utility Decoders ─────────────────────────
const UtilitySidekick = ({ toolId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    let greeting = '';
    if (toolId === 'jwt-parser') {
      greeting =
        '👋 **JWT Parser sidekick active!** Paste any JWT token on the left, and I will dissect its Claims and Signatures instantly. Remember: Always verify the "exp" (expiration) claim and signature key.';
    } else if (toolId === 'base64-decoder') {
      greeting =
        '👋 **Base64 Translator sidekick active!** Paste Base64 or plaintext on the left to encode/decode in real-time. Remember: Base64 is encoding, not encryption!';
    } else {
      greeting =
        '👋 **URL Sanitizer sidekick active!** Paste a URL on the left to isolate query parameters and inspect for dangerous open-redirect or parameter pollution vectors.';
    }
    setMessages([{ text: greeting, isBot: true }]);
  }, [toolId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { text: userMsg, isBot: false }]);

    setTimeout(() => {
      let botResponse = '';
      if (toolId === 'jwt-parser') {
        botResponse = `🔍 **Intelligence**: When analyzing JWTs, inspect the "alg" header field. Setting "alg": "none" was a classic CVE vulnerability in broken JWT validation libraries.`;
      } else if (toolId === 'base64-decoder') {
        botResponse = `📝 **Encoding Tip**: Base64 strings will often end with "=" or "==" padding characters to satisfy 24-bit alignment constraints.`;
      } else {
        botResponse = `🔗 **URL Security**: Check for double-encoded characters in URL query strings (e.g. %252f), which can bypass simple WAF rules.`;
      }
      setMessages((prev) => [...prev, { text: botResponse, isBot: true }]);
    }, 600);
  };

  return (
    <div className="p-5 rounded-2xl bg-[#0c162d]/90 border border-slate-800 shadow-xl space-y-4 font-mono flex flex-col h-full min-h-[380px]">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Bot className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          CONVERSATIONAL ASSISTANT
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs max-h-[360px] scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl border text-xs leading-relaxed ${
              m.isBot
                ? 'bg-[#071126] border-slate-800 text-slate-300'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 self-end'
            }`}
          >
            <div className="text-[10px] text-slate-500 font-bold mb-1">
              {m.isBot ? '🤖 CYBOBOT ASSISTANT' : '🕵️ OPERATOR'}
            </div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Sidekick..."
          className="flex-1 px-3 py-2 bg-[#071126] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-xl bg-cyan-500 text-[#020814] font-bold hover:bg-cyan-400 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

// ─── Main UtilityToolView Component ──────────────────────────────────────────
export default function UtilityToolView({ toolId }) {
  const tool = getToolConfig(toolId);
  if (!tool) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 space-y-6">
        {toolId === 'jwt-parser' && <JwtParserView />}
        {toolId === 'base64-decoder' && <Base64DecoderView />}
        {toolId === 'url-sanitizer' && <UrlSanitizerView />}
      </div>

      <div className="lg:col-span-4">
        <UtilitySidekick toolId={toolId} />
      </div>
    </div>
  );
}
