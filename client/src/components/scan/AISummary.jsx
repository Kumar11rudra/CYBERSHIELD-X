import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const COLORS = {
  dangerous: '#ff2244',
  medium: '#ff8c00',
  low: '#ffdd00',
  safe: '#00ff88',
};

export default function AISummary({ scan, onAnalysisLoaded }) {
  const [model, setModel] = useState('llama3');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [source, setSource] = useState('');

  const fetchAnalysis = async (selectedModel = model) => {
    if (!scan?._id) return;
    setLoading(true);
    try {
      const res = await api.post('/ai/analyze-scan', {
        scanId: scan._id,
        model: selectedModel
      });
      if (res.data?.success) {
        setAnalysis(res.data.analysis);
        setSource(res.data.source);
        if (onAnalysisLoaded) {
          onAnalysisLoaded(res.data.analysis);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to run AI Security Triage.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scan?._id) {
      fetchAnalysis('llama3');
    }
  }, [scan?._id]);

  if (!scan) return null;

  const severity = scan.riskLevel || 'safe';
  const c = COLORS[severity] || COLORS.safe;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl p-5 border border-white/5 bg-[#0a1223]/70 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#224466]/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <span className="font-mono text-xs font-bold text-white tracking-widest uppercase">
            AI Scan Triage Analyst
          </span>
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-2">
          <select
            value={model}
            onChange={(e) => {
              const val = e.target.value;
              setModel(val);
              fetchAnalysis(val);
            }}
            disabled={loading}
            className="bg-black/60 border border-[#00bfff]/30 rounded px-2.5 py-1 text-[10px] text-cyan-400 focus:outline-none focus:border-cyan-400 font-mono"
          >
            <option value="llama3">Llama 3</option>
            <option value="deepseek-r1">DeepSeek R1</option>
            <option value="mistral">Mistral</option>
          </select>

          <button
            onClick={() => fetchAnalysis(model)}
            disabled={loading}
            className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-400/30 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-mono rounded transition-all"
          >
            {loading ? 'RUNNING...' : '⚡ RE-RUN'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-[#5a7fa8] uppercase tracking-widest animate-pulse font-mono">
            Senior AI Analyst is correlating threat indicators...
          </p>
        </div>
      ) : analysis ? (
        <div className="space-y-4 font-mono text-xs">
          
          {/* Executive Summary */}
          <div className="space-y-1">
            <h4 className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Executive Summary</h4>
            <p className="text-[#cbd5e1] leading-relaxed bg-black/30 p-3 rounded-lg border border-[#224466]/10 font-sans">
              {analysis.executiveSummary}
            </p>
          </div>

          {/* Findings */}
          {analysis.findings && analysis.findings.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Critical Threat Findings</h4>
              <ul className="list-disc pl-4 text-[#cbd5e1] space-y-1 font-sans">
                {analysis.findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Recommended Hardening Policies</h4>
              <ul className="list-disc pl-4 text-[#cbd5e1] space-y-1 font-sans">
                {analysis.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Remediation Plan */}
          <div className="space-y-1">
            <h4 className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Remediation Roadmap</h4>
            <p className="text-[#cbd5e1] leading-relaxed bg-black/30 p-3 rounded-lg border border-[#224466]/10 font-sans">
              {analysis.remediationPlan}
            </p>
          </div>

          <div className="flex justify-between items-center text-[9px] text-[#5a7fa8] border-t border-[#224466]/20 pt-2.5">
            <span>SOURCE: {source}</span>
            <span>EVALUATED AT: {new Date(analysis.createdAt || Date.now()).toLocaleTimeString()}</span>
          </div>

        </div>
      ) : (
        <div className="py-6 text-center text-xs text-[#5a7fa8] italic">
          No triage reports loaded. Click Re-run to analyze this scan with AI.
        </div>
      )}
    </motion.div>
  );
}
