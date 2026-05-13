import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '../common/BrandLogo';
import { useTranslation } from 'react-i18next';

/**
 * AIReportModal — A professional "Security Certificate" view.
 */
const AIReportModal = ({ isOpen, onClose, scanData }) => {
  const { t } = useTranslation();
  const [mitigating, setMitigating] = React.useState(false);
  const [mitigationStep, setMitigationStep] = React.useState(0);

  if (!scanData) return null;

  const { target, riskLevel, threatScore, targetType, analysis, createdAt } = scanData;
  const isSafe = riskLevel === 'safe';
  const color = isSafe ? '#00ff88' : threatScore > 75 ? '#ff2244' : '#ff8c00';

  const mitigationSteps = [
    t('scanner.report.mitigation.step1'),
    t('scanner.report.mitigation.step2'),
    t('scanner.report.mitigation.step3'),
    t('scanner.report.mitigation.step4'),
    t('scanner.report.mitigation.step5'),
    t('scanner.report.mitigation.step6')
  ];

  const handleMitigate = () => {
    setMitigating(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setMitigationStep(step);
      if (step >= mitigationSteps.length - 1) {
        clearInterval(interval);
      }
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!mitigating ? onClose : undefined}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-[#0a0f18] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Mitigation Overlay */}
            <AnimatePresence>
              {mitigating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-50 bg-[#0a0f18] flex flex-col items-center justify-center p-12 text-center"
                >
                   <div className="w-20 h-20 mb-8 relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-2 border-cyber-accent border-t-transparent rounded-full shadow-[0_0_20px_var(--cyber-accent)]"
                      />
                      <div className="absolute inset-4 flex items-center justify-center">
                         <div className="w-2 h-2 rounded-full bg-cyber-accent animate-ping" />
                      </div>
                   </div>
                   
                   <h3 className="font-display text-2xl font-black text-white uppercase tracking-tighter mb-4">
                      {mitigationStep < mitigationSteps.length - 1 ? t('scanner.report.mitigation.executing') : t('scanner.report.mitigation.secured')}
                   </h3>
                   
                   <div className="w-full max-w-sm font-mono text-[10px] text-left p-4 bg-black/60 rounded-xl border border-white/5 h-32 overflow-hidden">
                      {mitigationSteps.slice(0, mitigationStep + 1).map((step, i) => (
                        <motion.p 
                          key={i} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`mb-1 ${i === mitigationStep ? 'text-cyber-accent' : 'text-white/40'}`}
                        >
                          {i === mitigationStep ? '> ' : '✓ '}{step}
                        </motion.p>
                      ))}
                   </div>

                   {mitigationStep >= mitigationSteps.length - 1 && (
                     <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => { setMitigating(false); setMitigationStep(0); onClose(); }}
                        className="mt-8 px-8 py-3 rounded-xl bg-cyber-accent text-cyber-bg font-black uppercase tracking-widest text-xs"
                     >
                        {t('scanner.report.mitigation.confirm')}
                     </motion.button>
                   )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Certificate Header */}
            <div className="relative p-8 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
               <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <BrandLogo size={32} />
                      <span className="font-display font-black tracking-widest text-white text-lg">CYBERSHIELD X</span>
                    </div>
                    <p className="text-[10px] font-mono text-cyber-accent uppercase tracking-[.3em]">{t('scanner.report.assessment')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-mono text-cyber-muted uppercase">{t('scanner.report.documentId')}</p>
                    <p className="text-[11px] font-mono text-white font-bold">{scanData._id?.slice(-12).toUpperCase()}</p>
                  </div>
               </div>
            </div>

            {/* Content Body */}
            <div className="p-10 text-center">
               <motion.div 
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ delay: 0.2 }}
                 className="inline-block mb-6 p-4 rounded-full bg-white/5 border-2"
                 style={{ borderColor: color, boxShadow: `0 0 30px ${color}20` }}
               >
                 <div className="text-4xl font-display font-black" style={{ color }}>
                   {threatScore}
                 </div>
                 <div className="text-[9px] font-mono uppercase tracking-widest opacity-60">{t('scanner.report.threatIndex')}</div>
               </motion.div>

               <h2 className="text-2xl font-display font-bold text-white mb-2">{t('scanner.report.assessmentFor', { target })}</h2>
               <p className="text-cyber-muted font-mono text-xs uppercase tracking-widest mb-8">{t('scanner.report.targetType')}: {targetType}</p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-lg mx-auto">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[9px] font-mono text-cyber-muted uppercase mb-1">{t('scanner.report.status')}</p>
                    <p className="text-sm font-bold uppercase tracking-wider" style={{ color }}>{riskLevel}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[9px] font-mono text-cyber-muted uppercase mb-1">{t('scanner.report.detectionDate')}</p>
                    <p className="text-sm text-white font-bold">{new Date(createdAt).toLocaleDateString()}</p>
                  </div>
               </div>

               <div className="mt-8 p-6 rounded-2xl bg-cyber-accent/5 border border-cyber-accent/10 text-left">
                  <p className="text-[10px] font-mono text-cyber-accent uppercase tracking-widest mb-3">{t('scanner.report.aiBrief')}</p>
                  <p className="text-sm text-cyber-text leading-relaxed italic opacity-80 font-mono">
                    {analysis || t('scanner.report.defaultAnalysis')}
                  </p>
               </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
               <p className="text-[9px] font-mono text-cyber-muted uppercase tracking-widest">
                 {t('scanner.report.verifiedBy')}
               </p>
               <div className="flex gap-3">
                  <button onClick={onClose} className="px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-cyber-muted hover:text-white transition-all">
                    {t('scanner.report.dismiss')}
                  </button>
                  {!isSafe ? (
                    <button 
                      onClick={handleMitigate}
                      className="px-5 py-2 rounded-xl bg-cyber-red text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-cyber-red/20 active:scale-95 transition-all"
                    >
                      {t('scanner.report.executeMitigation')}
                    </button>
                  ) : (
                    <button className="px-5 py-2 rounded-xl bg-cyber-accent text-cyber-bg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-cyber-accent/20">
                      {t('scanner.report.downloadCertificate')}
                    </button>
                  )}
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AIReportModal;
