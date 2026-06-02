import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import usePdfExport from '../hooks/usePdfExport';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const IntelligenceHUD = ({ status }) => {
    const { t } = useTranslation();
    return (
        <div className="font-mono text-[10px] text-cyber-accent uppercase tracking-[0.2em] mb-4 overflow-hidden h-4">
            <motion.div
                animate={{ y: [0, -20, -40, -60] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
                <p>» {t('breach.hud1')}</p>
                <p>» {t('breach.hud2')}</p>
                <p>» {t('breach.hud3')}</p>
                <p>» {t('breach.hud4')}</p>
            </motion.div>
        </div>
    );
};

const MatrixRain = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;
        const cols = Math.floor(W / 20);
        const drops = Array(cols).fill(1);
        const chars = '01ABCDEF/*-+$#@!%&';

        const draw = () => {
            ctx.fillStyle = 'rgba(2, 8, 20, 0.1)';
            ctx.fillRect(0, 0, W, H);
            ctx.font = '15px monospace';
            drops.forEach((y, i) => {
                const char = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillStyle = Math.random() > 0.95 ? '#00ffcc' : 'rgba(0, 191, 255, 0.15)';
                ctx.fillText(char, i * 20, y * 20);
                if (y * 20 > H && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            });
        };
        const id = setInterval(draw, 50);
        return () => clearInterval(id);
    }, []);
    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-30 z-0" />;
};

const BreachCheckerPage = () => {
    const { t } = useTranslation();
    const [target, setTarget] = useState('');
    const [type, setType] = useState('phone'); // Default to phone as requested
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const { exportBreachPdf, exporting } = usePdfExport();
    const navigate = useNavigate();

    const handleCheck = async (e) => {
        e.preventDefault();
        if (!target) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const endpoint = type === 'email' ? '/breach/email' : '/breach/phone';
            const res = await api.post(endpoint, { [type]: target });
            // Simulation delay for professional feel
            setTimeout(() => {
                setResult(res.data);
                setLoading(false);
            }, 2500);
        } catch (err) {
            setError(err.response?.data?.error || t('breach.error'));
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#01060f] text-cyber-text font-tech relative overflow-hidden px-4 py-24">
            <MatrixRain />
            
            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="text-center mb-12">
                        <h1 className="font-display text-4xl md:text-6xl font-black tracking-tighter mb-4 text-white uppercase">
                            Dark Web <span className="text-cyber-accent">&</span> Breach Monitor
                        </h1>
                        <p className="font-mono text-xs text-cyber-muted uppercase tracking-[0.3em] bg-white/5 py-2 px-6 inline-block rounded-full border border-white/10">
                            OSINT Intelligence Pool
                        </p>
                    </div>

                    {/* SELECTOR */}
                    <div className="flex justify-center gap-4 mb-8">
                        {['email', 'phone'].map((choice) => (
                            <button
                                key={choice}
                                onClick={() => setType(choice)}
                                className={`px-8 py-3 rounded-xl font-mono text-xs transition-all border ${
                                    type === choice 
                                    ? 'bg-cyber-accent/20 border-cyber-accent text-cyber-accent' 
                                    : 'bg-white/5 border-white/10 text-cyber-muted hover:border-white/30'
                                }`}
                            >
                                {choice === 'email' ? t('breach.emailScanner') : t('breach.phoneScanner')}
                            </button>
                        ))}
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleCheck} className="cyber-card p-6 md:p-10 mb-12">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder={type === 'email' ? t('breach.emailPlaceholder') : t('breach.phonePlaceholder')}
                                    value={target}
                                    onChange={(e) => setTarget(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-6 py-4 font-mono text-sm text-white focus:border-cyber-accent outline-none transition-all"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/20">
                                    {t('breach.encryptedQuery')}
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="cyber-button-primary md:w-48 py-4 text-sm font-black disabled:opacity-50"
                            >
                                {loading ? t('breach.initiating') : t('breach.executeScan')}
                            </button>
                        </div>
                        {loading && <div className="mt-6"><IntelligenceHUD /></div>}
                        {error && <p className="text-cyber-red font-mono text-[10px] mt-4 uppercase">» ⚠ ERROR_LOG: {error}</p>}
                    </form>

                    {/* RESULTS */}
                    <AnimatePresence>
                        {result && (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                                {result.found ? (
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-6 border-b border-cyber-red/20 pb-8 relative">
                                            <div className="w-20 h-20 bg-cyber-red/20 border border-cyber-red rounded-full flex items-center justify-center animate-pulse">
                                                <span className="text-3xl text-cyber-red">⚠</span>
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black text-cyber-red uppercase">{t('breach.confirmed')}</h2>
                                                <p className="font-mono text-xs text-cyber-muted uppercase tracking-widest">{result.methodology}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (!user) {
                                                        toast.error('Operator profile required to download PDF report. Redirecting to login...', { duration: 4000 });
                                                        setTimeout(() => navigate('/login'), 2000);
                                                        return;
                                                    }
                                                    exportBreachPdf(result, target, user);
                                                }}
                                                disabled={exporting}
                                                className="absolute top-0 right-0 bg-cyber-accent text-cyber-bg px-4 py-2 rounded font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
                                            >
                                                {exporting ? t('breach.generatingPdf') : t('breach.downloadReport')}
                                            </button>
                                        </div>

                                        <div className="grid gap-6">
                                            {result.leaks.map((leak, idx) => (
                                                <motion.div 
                                                    key={idx}
                                                    initial={{ x: -20, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="cyber-card p-6 border-l-4 border-l-cyber-red relative overflow-hidden group"
                                                >
                                                    <div className="absolute top-0 right-10 bg-cyber-red text-black text-[9px] font-black px-4 py-1 rounded-b-lg uppercase">
                                                        {leak.severity} {t('breach.severity')}
                                                    </div>
                                                    
                                                    <div className="mb-4">
                                                        <h3 className="text-xl font-black text-white group-hover:text-cyber-accent transition-colors">
                                                            {leak.name}
                                                        </h3>
                                                        <span className="font-mono text-[10px] text-cyber-muted">{leak.date} | INCIDENT_ID: {leak.id}</span>
                                                    </div>

                                                    <p className="text-sm text-cyber-muted leading-relaxed mb-6">
                                                        {leak.description}
                                                    </p>

                                                    <div className="bg-black/80 rounded-lg p-4 border border-white/5 mb-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                            <div>
                                                                <p className="font-mono text-[9px] text-cyber-accent uppercase mb-1">» Market Value</p>
                                                                <p className="text-xs font-black text-cyber-red animate-pulse">{leak.marketValue}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-mono text-[9px] text-cyber-accent uppercase mb-1">» Threat Actor</p>
                                                                <p className="text-xs text-white">{leak.hackerGroup} ({leak.threatActorType})</p>
                                                            </div>
                                                        </div>

                                                        <p className="font-mono text-[9px] text-cyber-accent uppercase mb-1">» Intelligence Rationale</p>
                                                        <p className="text-[11px] text-white/80 mb-4">{leak.rationale}</p>
                                                        
                                                        <div className="bg-white/5 p-3 rounded border border-white/10 mb-4">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <p className="font-mono text-[9px] text-cyber-muted uppercase">» Actor Pedigree</p>
                                                                <span className="text-[8px] bg-cyber-red/20 text-cyber-red px-2 py-0.5 rounded border border-cyber-red/30 uppercase font-black tracking-tighter">
                                                                    {leak.darkWebStatus}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-cyber-muted italic mb-3">{leak.actorHistory}</p>
                                                            
                                                            <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="font-mono text-[8px] text-cyber-accent uppercase mb-1">Source Forum</p>
                                                                    <p className="text-[9px] text-white/70 font-mono underline decoration-cyber-accent/50">{leak.sourceForum}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="font-mono text-[8px] text-cyber-accent uppercase mb-1">Availability</p>
                                                                    <p className="text-[9px] text-white/70 font-mono">{leak.availability}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="pt-4 border-t border-white/5 font-mono text-[9px]">
                                                            <span className="text-cyber-red/70 mr-2">DARK_WEB_SNAPSHOT:</span>
                                                            <span className="text-white/40">{leak.proof}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            {leak.dataClasses.map((item, i) => (
                                                                <span key={i} className="text-[9px] bg-white/5 px-2 py-1 rounded border border-white/10 uppercase font-mono">
                                                                    {item}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <a href={leak.authorityUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-cyber-accent hover:underline uppercase tracking-widest">
                                                            SOURCE VERIFICATION ↗
                                                        </a>
                                                    </div>

                                                    <div className="mt-6 pt-6 border-t border-white/5">
                                                        <p className="text-[10px] font-bold text-cyber-accent mb-2">RECOVERY PATHWAY:</p>
                                                        <p className="text-[11px] text-cyber-muted italic">{leak.recoveryPath}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* METHODOLOGY EXPLAINER */}
                                        <div className="cyber-card p-6 mt-12 bg-cyber-accent/5 border-dashed">
                                            <h4 className="text-sm font-black text-cyber-accent mb-4 uppercase tracking-[0.2em]">{t('breach.methodologyTitle')}</h4>
                                            <p className="text-xs text-cyber-muted leading-relaxed">
                                                {t('breach.methodologyDesc')}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="cyber-card p-12 text-center border-cyber-green/50 relative">
                                        <button
                                            onClick={() => {
                                                if (!user) {
                                                    toast.error('Operator profile required to download PDF report. Redirecting to login...', { duration: 4000 });
                                                    setTimeout(() => navigate('/login'), 2000);
                                                    return;
                                                }
                                                exportBreachPdf(result, target, user);
                                            }}
                                            disabled={exporting}
                                            className="absolute top-4 right-4 bg-cyber-green/20 text-cyber-green border border-cyber-green/50 px-4 py-2 rounded font-black text-[10px] uppercase tracking-widest hover:bg-cyber-green/40 transition-colors disabled:opacity-50"
                                        >
                                            {exporting ? t('breach.generatingPdf') : t('breach.downloadReport')}
                                        </button>
                                        <div className="w-24 h-24 bg-cyber-green/20 border border-cyber-green rounded-full flex items-center justify-center mx-auto mb-6">
                                            <span className="text-4xl">🛡</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-cyber-green mb-2">{t('breach.cleanStatus')}</h3>
                                        <p className="text-cyber-muted text-sm max-w-md mx-auto">
                                            {t('breach.cleanDesc')}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default BreachCheckerPage;
