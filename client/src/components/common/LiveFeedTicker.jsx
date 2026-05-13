import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import { resolveRealtimeServerUrl } from '../../services/api';

const SEVERITY_CONFIG = {
  CRITICAL: { color: '#ff2244', bg: 'rgba(255,34,68,0.12)', border: 'rgba(255,34,68,0.4)', label: '🔴 CRITICAL' },
  HIGH:     { color: '#ff8c00', bg: 'rgba(255,140,0,0.12)', border: 'rgba(255,140,0,0.4)',  label: '🟠 HIGH' },
  MEDIUM:   { color: '#e5c100', bg: 'rgba(229,193,0,0.12)', border: 'rgba(229,193,0,0.4)', label: '🟡 MEDIUM' },
  LOW:      { color: '#00d4ff', bg: 'rgba(0,212,255,0.12)', border: 'rgba(0,212,255,0.4)', label: '🔵 LOW' },
};

const MAX_FEED_SIZE = 20;

const LiveFeedTicker = () => {
  const { t } = useTranslation();
  const [threats, setThreats] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [latestThreat, setLatestThreat] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const SERVER_URL = resolveRealtimeServerUrl();
    
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('⚡ Nexus Socket Connected:', socket.id);
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('threat:new', (threat) => {
      setLatestThreat(threat);
      setThreats(prev => [threat, ...prev].slice(0, MAX_FEED_SIZE));
    });

    return () => socket.disconnect();
  }, []);

  const cfg = latestThreat ? SEVERITY_CONFIG[latestThreat.severity] || SEVERITY_CONFIG.LOW : null;

  return (
    <div className="w-full">
      {/* Connection Status Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span 
            className={`w-2 h-2 rounded-full ${isConnected ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: isConnected ? '#00ff88' : '#ff2244', boxShadow: isConnected ? '0 0 6px #00ff88' : 'none' }}
          />
          <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: isConnected ? '#00ff88' : '#ff2244' }}>
            {isConnected ? t('dashboard.feed.live') : t('dashboard.feed.disconnected')}
          </span>
        </div>
        {isConnected && (
          <span className="font-mono text-[9px] text-cyber-muted uppercase tracking-widest ml-auto">
            {t('dashboard.feed.eventsCaptured', { count: threats.length })}
          </span>
        )}
      </div>

      {/* Latest Alert Banner */}
      <AnimatePresence mode="wait">
        {latestThreat && cfg && (
          <motion.div
            key={latestThreat.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl p-4 mb-4 border relative overflow-hidden"
            style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
          >
            {/* Animated left border */}
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: cfg.color }} />
            
            <div className="pl-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: cfg.color }}>
                  {cfg.label} • {latestThreat.type}
                </span>
                <span className="font-mono text-[8px] text-cyber-muted">
                  {new Date(latestThreat.timestamp).toLocaleTimeString('en-IN')} IST
                </span>
              </div>
              <p className="text-xs text-white font-mono leading-relaxed">{latestThreat.message}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[9px] font-mono text-cyber-muted">📍 {latestThreat.region}</span>
                <span className="text-[9px] font-mono text-cyber-muted">🔍 {latestThreat.source}</span>
                <span className="text-[9px] font-mono text-cyber-muted">✅ {t('dashboard.feed.confidence')}: {latestThreat.confidence}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable Feed Log */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
        {threats.length === 0 && (
          <div className="text-center py-6">
            <p className="font-mono text-[10px] text-cyber-muted animate-pulse uppercase tracking-widest">
              {isConnected ? t('dashboard.feed.scanning') : t('dashboard.feed.reconnecting')}
            </p>
          </div>
        )}
        {threats.slice(1).map((threat) => {
          const c = SEVERITY_CONFIG[threat.severity] || SEVERITY_CONFIG.LOW;
          return (
            <motion.div
              key={threat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: c.color }} />
              <div className="min-w-0">
                <p className="text-[10px] text-white/80 font-mono leading-relaxed truncate">{threat.message}</p>
                <span className="text-[8px] font-mono text-cyber-muted">
                  {threat.type} • {threat.region} • {new Date(threat.timestamp).toLocaleTimeString('en-IN')}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveFeedTicker;
