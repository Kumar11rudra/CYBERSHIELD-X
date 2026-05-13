import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NetworkStatusHUD() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[9999] p-4 flex justify-center pointer-events-none"
        >
          <div className="bg-red-600/90 backdrop-blur-xl border-b-2 border-red-400 px-6 py-2 rounded-full shadow-[0_10px_40px_rgba(255,0,0,0.5)] flex items-center gap-3 pointer-events-auto">
            <span className="animate-pulse">📡</span>
            <div className="flex flex-col">
              <span className="font-display text-[10px] font-black text-white uppercase tracking-widest leading-none">Perimeter Compromised</span>
              <span className="font-mono text-[9px] text-white/80 uppercase tracking-tighter">Connection Lost — Local Defense Active</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
