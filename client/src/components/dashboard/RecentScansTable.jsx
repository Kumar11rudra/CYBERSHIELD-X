import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ROUTES from '../../constants/routes';

/**
 * RecentScansTable Component
 * Displays a list of target scans history with status and risk levels.
 */
export default function RecentScansTable({ recentScans = [] }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col border border-cyber-border/10 bg-cyber-card rounded-xl p-4 shadow-sm h-[300px]">
      <div className="border-b border-cyber-border/10 pb-3 mb-3 flex justify-between items-center">
        <span className="text-xs font-bold text-cyber-text tracking-widest uppercase">
          RECENT SCAN RUNS
        </span>
        <Link to={ROUTES.HISTORY} className="text-[10px] text-cyber-accent font-bold hover:underline">
          VIEW ALL &gt;
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {recentScans.length === 0 ? (
          <div className="text-center py-8 text-xs text-cyber-muted italic">
            No scans recorded. Launch a tool from the Security Toolkit to audit your target.
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono">
            <caption className="sr-only">List of recent target security scans</caption>
            <thead>
              <tr className="border-b border-cyber-border/10 text-cyber-muted">
                <th className="pb-2">TARGET</th>
                <th className="pb-2">TOOL</th>
                <th className="pb-2">SCORE</th>
                <th className="pb-2 text-center">RISK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/5">
              {recentScans.slice(0, 5).map((scan) => {
                let riskBadge = 'text-cyber-green bg-cyber-green/10';
                if (scan.riskLevel === 'dangerous') {
                  riskBadge = 'text-cyber-red bg-cyber-red/10';
                } else if (scan.riskLevel === 'medium') {
                  riskBadge = 'text-cyber-orange bg-cyber-orange/10';
                }

                return (
                  <tr
                    key={scan._id}
                    tabIndex={0}
                    role="link"
                    aria-label={`View scan report for target ${scan.target}`}
                    className="hover:bg-cyber-surface focus:bg-cyber-surface focus:outline-none cursor-pointer transition-colors"
                    onClick={() => navigate(`${ROUTES.HISTORY}/${scan._id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`${ROUTES.HISTORY}/${scan._id}`);
                      }
                    }}
                  >
                    <td className="py-2 font-bold text-cyber-text max-w-[100px] truncate">
                      {scan.target}
                    </td>
                    <td className="py-2 uppercase text-cyber-accent">{scan.tool || 'Port Scan'}</td>
                    <td className="py-2 font-bold">{scan.threatScore}/100</td>
                    <td className="py-2 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${riskBadge}`}>
                        {scan.riskLevel || 'SAFE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
