import React, { useState, useEffect, useCallback } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import {

  X,

  ExternalLink,

  Shield,

  ShieldAlert,

  AlertTriangle,

  CheckCircle2,

  Info,

  Lock,

  ArrowRight

} from 'lucide-react';

import { getCategoryTheme } from './toolThemes';

import AnimatedToolAvatar from './AnimatedToolAvatar';

import { getToolAlternativesEntry } from './externalAlternatives';



/**

 * 🛡️ ExternalAlternativesModal

 * Presents verified external tool equivalents and industry-standard SaaS platforms

 * for a canonical CyberShield X tool.

 *

 * Security Principles:

 * - Outbound informational navigation only (target="_blank" rel="noopener noreferrer").

 * - Zero automatic target or parameter propagation.

 * - Zero credentials, tokens, cookies, or tenant context forwarding.

 * - Mandatory acknowledgment gate for HIGH and CRITICAL privacy risk providers.

 * - Verified informational fallback for native-only engines with NO public equivalent.

 */

export default function ExternalAlternativesModal({

  tool,

  isOpen,

  onClose,

  onOpenNativeTool,

}) {

  const [acknowledgedRisks, setAcknowledgedRisks] = useState({});



  // Reset acknowledgment state when modal opens or tool changes

  useEffect(() => {

    if (isOpen) {

      setAcknowledgedRisks({});

    }

  }, [isOpen, tool?.id]);



  // Handle Escape key to close modal

  const handleKeyDown = useCallback((e) => {

    if (e.key === 'Escape') {

      onClose?.();

    }

  }, [onClose]);



  useEffect(() => {

    if (isOpen) {

      window.addEventListener('keydown', handleKeyDown);

      return () => window.removeEventListener('keydown', handleKeyDown);

    }

  }, [isOpen, handleKeyDown]);



  if (!isOpen || !tool) return null;



  const toolName = tool.name || 'Security Tool';

  const toolCategory = tool.category || 'General Security';

  const theme = getCategoryTheme(toolCategory);

  const entry = getToolAlternativesEntry(tool.id);

  const alternatives = entry?.alternatives || [];

  const hasAlts = entry?.hasAlternative && alternatives.length > 0;



  const toggleAcknowledge = (index) => {

    setAcknowledgedRisks(prev => ({

      ...prev,

      [index]: !prev[index]

    }));

  };



  const getMatchBadge = (match) => {

    switch (match) {

      case 'EXACT':

        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

      case 'STRONG':

        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';

      case 'PARTIAL':

        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';

      default:

        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';

    }

  };



  const getPrivacyBadge = (risk) => {

    switch (risk) {

      case 'CRITICAL':

        return 'bg-rose-500/15 text-rose-300 border-rose-500/40';

      case 'HIGH':

        return 'bg-amber-500/15 text-amber-300 border-amber-500/40';

      case 'MEDIUM':

        return 'bg-blue-500/15 text-blue-300 border-blue-500/40';

      case 'LOW':

      default:

        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';

    }

  };



  return (

    <AnimatePresence>

      <div

        role="dialog"

        aria-modal="true"

        aria-labelledby="alt-modal-title"

        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"

        onClick={onClose}

      >

        <motion.div

          initial={{ opacity: 0, scale: 0.96, y: 8 }}

          animate={{ opacity: 1, scale: 1, y: 0 }}

          exit={{ opacity: 0, scale: 0.96, y: 8 }}

          transition={{ duration: 0.2, ease: 'easeOut' }}

          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0c162d] border border-slate-800 shadow-2xl overflow-hidden"

          onClick={(e) => e.stopPropagation()}

        >

          {/* Header */}

          <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-800/80 bg-[#091024]">

            <div className="flex items-center gap-3.5">

              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">

                <AnimatedToolAvatar

                  archetype={tool.avatarArchetype}

                  accent={theme.accent}

                  size={42}

                />

              </div>

              <div>

                <div className="flex items-center gap-2">

                  <span

                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border"

                    style={{

                      backgroundColor: theme.badgeBg,

                      borderColor: theme.badgeBorder,

                      color: theme.badgeText,

                    }}

                  >

                    {toolCategory}

                  </span>

                  <span className="text-[10px] font-mono text-slate-500 uppercase">

                    ID: {tool.id}

                  </span>

                </div>

                <h2 id="alt-modal-title" className="text-base sm:text-lg font-bold text-slate-100 mt-1">

                  External Alternatives :: {toolName}

                </h2>

              </div>

            </div>



            <button

              type="button"

              onClick={onClose}

              aria-label="Close modal"

              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"

            >

              <X size={18} />

            </button>

          </div>



          {/* Body Content */}

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">



            {/* Informational Privacy Boundary Notice */}

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-3">

              <Info size={16} className="text-cyan-400 shrink-0 mt-0.5" />

              <div>

                <strong className="text-slate-200">Outbound Provider Policy:</strong> External alternatives are independent services evaluated for operational equivalence. CyberShield X <span className="text-cyan-300 font-semibold">never forwards your session tokens, credentials, or target scan inputs</span> to third parties.

              </div>

            </div>



            {hasAlts ? (

              <div className="space-y-4">

                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">

                  Verified Industry Alternative Providers ({alternatives.length})

                </div>



                {alternatives.map((alt, idx) => {

                  const isHighRisk = alt.privacyRisk === 'HIGH' || alt.privacyRisk === 'CRITICAL';

                  const isAcknowledged = Boolean(acknowledgedRisks[idx]);

                  const canNavigate = !isHighRisk || isAcknowledged;



                  return (

                    <div

                      key={idx}

                      className="p-4 sm:p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-colors space-y-3.5"

                    >

                      {/* Provider Header */}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">

                        <div>

                          <div className="text-sm font-bold text-slate-100 flex items-center gap-2">

                            {alt.product}

                            <span className="text-xs font-normal text-slate-400">

                              by {alt.provider}

                            </span>

                          </div>

                        </div>



                        {/* Badges */}

                        <div className="flex items-center gap-2 flex-wrap">

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getMatchBadge(alt.capabilityMatch)}`}>

                            {alt.capabilityMatch} Match

                          </span>

                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">

                            {alt.accessModel}

                          </span>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1 ${getPrivacyBadge(alt.privacyRisk)}`}>

                            {alt.privacyRisk === 'CRITICAL' && <ShieldAlert size={11} />}

                            {alt.privacyRisk === 'HIGH' && <AlertTriangle size={11} />}

                            {alt.privacyRisk} Risk

                          </span>

                        </div>

                      </div>



                      {/* Data Exposure Details */}

                      <div className="text-xs text-slate-400 bg-black/30 p-2.5 rounded-lg border border-slate-800/60 flex items-start gap-2">

                        <span className="text-slate-500 font-mono shrink-0">Evaluates:</span>

                        <span className="text-slate-300">{alt.dataExposure}</span>

                      </div>



                      {/* HIGH / CRITICAL Warning Gate */}

                      {isHighRisk && (

                        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200/90 space-y-2">

                          <div className="flex items-center gap-1.5 font-semibold text-amber-300">

                            <AlertTriangle size={14} className="shrink-0 text-amber-400" />

                            <span>Privacy & Data Security Notice</span>

                          </div>

                          <p className="text-[11px] leading-relaxed text-amber-200/80">

                            {alt.privacyRisk === 'CRITICAL'

                              ? 'This external tool processes sensitive authentication tokens, credentials, or deep memory structures. NEVER paste production secrets or private cryptographic keys into external web tools.'

                              : 'This tool performs active security scanning or ingests source code/configurations. Ensure you possess authorized permission before scanning external targets.'}

                          </p>

                          <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-[11px] text-slate-200">

                            <input

                              type="checkbox"

                              checked={isAcknowledged}

                              onChange={() => toggleAcknowledge(idx)}

                              className="w-3.5 h-3.5 rounded bg-slate-900 border-amber-600/50 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-950"

                            />

                            <span>I acknowledge the security risk and will not submit confidential production secrets.</span>

                          </label>

                        </div>

                      )}



                      {/* Action Bar */}

                      <div className="flex items-center justify-between pt-1">

                        <span className="text-[11px] text-slate-500 font-mono">

                          Verified: {alt.verifiedAt}

                        </span>



                        <a

                          href={canNavigate ? alt.officialUrl : undefined}

                          target="_blank"

                          rel="noopener noreferrer"

                          onClick={(e) => {

                            if (!canNavigate) {

                              e.preventDefault();

                            }

                          }}

                          aria-disabled={!canNavigate}

                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${

                            canNavigate

                              ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-sm'

                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'

                          }`}

                        >

                          <span>Visit Official Provider</span>

                          <ExternalLink size={13} />

                        </a>

                      </div>

                    </div>

                  );

                })}

              </div>

            ) : (

              /* Verified No-Alternative State (remediation, playbook-runner, sms, upi) */

              <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-4">

                <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">

                  <Lock size={22} />

                </div>



                <div className="space-y-1.5 max-w-md mx-auto">

                  <h3 className="text-sm font-bold text-slate-100">

                    Proprietary CyberShield X Architecture

                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">

                    This security engine operates as an integrated, first-party CyberShield X capability. In accordance with the Phase 2B Step 10A Audit, <strong className="text-slate-300">no suitable verified external public alternative</strong> exists that satisfies enterprise security and privacy standards.

                  </p>

                </div>



                <div className="p-3 rounded-lg bg-black/40 border border-slate-800/80 text-xs font-mono text-slate-400 text-left max-w-md mx-auto">

                  <div className="text-cyan-400 font-bold mb-1">AUDIT RATIONALE:</div>

                  <div>{entry?.rationale || 'Native platform orchestrator with zero safe public equivalent.'}</div>

                </div>



                <div className="pt-2">

                  <button

                    type="button"

                    onClick={() => {

                      onClose?.();

                      onOpenNativeTool?.(tool);

                    }}

                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)]"

                  >

                    <span>Deploy Native {toolName}</span>

                    <ArrowRight size={14} />

                  </button>

                </div>

              </div>

            )}

          </div>



          {/* Footer */}

          <div className="p-4 border-t border-slate-800/80 bg-[#091024] flex items-center justify-between text-xs text-slate-500">

            <span className="font-mono text-[11px]">

              CyberShield X Security Registry v62.2.0

            </span>

            <button

              type="button"

              onClick={onClose}

              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"

            >

              Close

            </button>

          </div>

        </motion.div>

      </div>

    </AnimatePresence>

  );

}
