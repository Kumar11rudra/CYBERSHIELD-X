import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { buttonHover, fadeUp } from '../../../../utils/motion';
import ScanIcon from './ScanIcon';

/**
 * ScanTargetForm Component
 * Renders target address fields, heuristic warnings, and target selector tags.
 */
export default function ScanTargetForm({
  target,
  setTarget,
  loading,
  inputFocused,
  setInputFocused,
  heuristics,
  detectedType,
  extractedTargets,
  setExtractedTargets,
  onSubmitScan,
  copy,
}) {
  const examples = [
    '8.8.8.8',
    'openai.com',
    'https://example.com/login',
    '44d88612fea8a8f36de82e1278abb02f',
  ];

  return (
    <motion.form onSubmit={onSubmitScan} className="space-y-3" variants={fadeUp}>
      <motion.div
        className={`relative rounded-lg p-[1px] transition-all duration-500 ${
          heuristics.suspicious
            ? 'bg-gradient-to-r from-cyber-red/50 via-cyber-orange/30 to-cyber-red/50'
            : ''
        }`}
        animate={
          inputFocused
            ? {
                scale: 1.005,
                boxShadow: heuristics.suspicious
                  ? '0 0 30px rgba(255, 34, 68, 0.2)'
                  : '0 0 28px rgba(0, 212, 255, 0.16)',
              }
            : { scale: 1, boxShadow: '0 0 0 0 rgba(0, 212, 255, 0)' }
        }
      >
        <div className="bg-cyber-bg rounded-lg relative overflow-hidden">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-cyber-muted text-xs select-none z-10">
            &gt;_
          </div>
          <input
            type="text"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              if (extractedTargets.length > 0) setExtractedTargets([]);
            }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={copy.placeholder}
            className={`cyber-input pl-10 pr-36 h-14 text-base border-none ring-0 focus:ring-0 ${
              heuristics.suspicious ? 'text-cyber-orange' : ''
            }`}
            disabled={loading}
            autoComplete="off"
            spellCheck="false"
          />

          <motion.button
            type="submit"
            disabled={loading || !target.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 cyber-button-primary disabled:opacity-40 disabled:cursor-not-allowed h-10 flex items-center gap-2 haptic-press"
            whileHover={!loading && target.trim() ? buttonHover.whileHover : undefined}
            whileTap={!loading && target.trim() ? buttonHover.whileTap : undefined}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-cyber-bg border-t-transparent rounded-full animate-spin" />
                <span>{copy.scanning}</span>
              </div>
            ) : (
              <>
                <ScanIcon />
                <span>{copy.scan}</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Heuristic Warnings & Helpers */}
      <AnimatePresence>
        {heuristics.suspicious && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-2 px-2 text-cyber-red font-mono text-[10px] uppercase tracking-wider"
          >
            <span className="animate-pulse">⚠️</span>
            <span>HEURISTIC ALERT: {heuristics.reason}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4 flex-wrap px-1">
        <motion.div variants={fadeUp} className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-cyber-muted text-xs">{copy.quickTest}</span>
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setTarget(ex)}
              className="font-mono text-xs text-cyber-muted hover:text-cyber-accent border border-cyber-border/40 hover:border-cyber-accent/40 px-2 py-1 rounded transition-all"
            >
              {ex}
            </button>
          ))}
        </motion.div>

        <motion.p
          variants={fadeUp}
          className={`font-mono text-[10px] uppercase tracking-widest ${
            detectedType
              ? 'text-cyber-accent'
              : target.trim()
              ? 'text-cyber-orange'
              : 'text-cyber-muted'
          }`}
        >
          {!target.trim()
            ? copy.helperEmpty
            : detectedType
            ? copy.helperValid
            : copy.helperInvalid}
        </motion.p>
      </div>

      {/* Extracted Targets List */}
      <AnimatePresence>
        {extractedTargets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-4 rounded-xl border border-cyber-accent/30 bg-cyber-accent/5 backdrop-blur-sm"
          >
            <p className="font-mono text-[11px] text-cyber-accent uppercase tracking-[0.2em] mb-3">
              {copy.helperExtracted(extractedTargets.length)}
            </p>
            <div className="flex flex-wrap gap-2">
              {extractedTargets.map((ext, idx) => (
                <button
                  key={`${ext.value}-${idx}`}
                  type="button"
                  onClick={() => onSubmitScan(null, ext.value)}
                  className="flex items-center gap-2 bg-black/40 border border-cyber-border hover:border-cyber-accent transition-all px-3 py-1.5 rounded-lg group"
                >
                  <span className="font-mono text-[10px] text-cyber-muted uppercase group-hover:text-cyber-accent">
                    {ext.type}
                  </span>
                  <span className="font-mono text-xs text-cyber-text">{ext.value}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
}
