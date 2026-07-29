import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ROUTES from '../../constants/routes';
import toast from 'react-hot-toast';

/**
 * ThreatIntelCenterCard Component
 * Displays a quick input card to search and correlate indicators of compromise (IOCs).
 */
export default function ThreatIntelCenterCard() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = () => {
    if (!searchValue.trim()) {
      toast.error('Please enter a valid IP, Domain, or Hash to correlate.');
      return;
    }
    navigate(`${ROUTES.THREAT_INTEL}?target=${encodeURIComponent(searchValue.trim())}`);
  };

  return (
    <div className="flex flex-col border border-cyber-border/10 bg-cyber-card rounded-xl p-4 shadow-sm justify-between h-[300px]">
      <div>
        <div className="border-b border-cyber-border/10 pb-3 mb-3 flex justify-between items-center">
          <span className="text-xs font-bold text-cyber-text tracking-widest uppercase">
            THREAT INTEL CENTER
          </span>
          <Link to={ROUTES.THREAT_INTEL} className="text-[10px] text-cyber-accent font-bold hover:underline">
            OPEN &gt;
          </Link>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] text-cyber-text leading-relaxed">
            Correlate indicators of compromise (IP, Domain, File Hash, URL, Email) against passive
            offline databases.
          </p>

          {/* Quick search form */}
          <div className="space-y-2">
            <input
              id="ioc-search-input"
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="IP, Domain, Hash..."
              className="w-full bg-cyber-surface border border-cyber-border/15 rounded-lg px-2.5 py-1.5 text-[10.5px] text-cyber-text focus:outline-none focus:border-cyber-accent focus:ring-2 focus:ring-cyber-accent/15 font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <button
              onClick={handleSearch}
              className="w-full py-1.5 bg-cyber-accent/10 border border-cyber-accent/30 hover:bg-cyber-accent/20 text-cyber-accent text-[9.5px] font-mono rounded-lg transition-all font-bold uppercase tracking-wider focus:ring-2 focus:ring-cyber-accent/40 outline-none"
            >
              ⚡ CORRELATE IOC
            </button>
          </div>
        </div>
      </div>

      {/* Quick stats / summary */}
      <div className="bg-cyber-surface border border-cyber-border/10 rounded-lg p-2 flex items-center justify-between text-[9px] mt-2">
        <div className="text-center flex-1 border-r border-cyber-border/10">
          <span className="block text-cyber-muted uppercase text-[7px] font-bold">Active Threats</span>
          <span className="block text-cyber-red font-bold text-xs mt-0.5">842</span>
        </div>
        <div className="text-center flex-1">
          <span className="block text-cyber-muted uppercase text-[7px] font-bold">Verified Safe</span>
          <span className="block text-cyber-green font-bold text-xs mt-0.5">14,204</span>
        </div>
      </div>
    </div>
  );
}
