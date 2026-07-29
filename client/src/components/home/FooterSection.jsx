import React, { useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../common/ThemeToggle";

export default function FooterSection({
  t,
  user,
  team,
  COLOR_MAP,
  selectedMember,
  setSelectedMember,
}) {
  const [teamExpanded, setTeamExpanded] = useState(false);

  return (
    <>
      {/* ── PREMIUM FOOTER ── */}
      <footer className="w-full bg-cyber-bg border-t border-cyber-border/10 py-8 px-6 flex flex-col items-center gap-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="font-display text-lg font-black tracking-tight text-cyber-text">
            CYBER
            <span className="text-cyber-accent"> SHIELD</span>
            <span className="text-cyber-green text-[0.7em] ml-1">X</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] text-cyber-muted font-mono">
            <span className="text-cyber-accent">✉</span>
            <a 
              href="mailto:official.cybershieldx@gmail.com" 
              className="text-cyber-muted hover:text-cyber-accent transition-colors"
            >
              official.cybershieldx@gmail.com
            </a>
          </div>
        </div>

        {/* Directory Links */}
        <div className="flex flex-wrap justify-center gap-6 text-[10px] uppercase font-mono tracking-widest font-bold">
          {[
            { label: 'Platform', path: '/login' },
            { label: 'Security', path: '/security' },
            { label: 'Live Modules', path: '/login' },
            { label: 'Sign Up', path: '/signup' },
            { label: 'Contact Support', path: 'tel:+919351636193', external: true },
            ...(user?.role === 'admin' ? [{ label: 'Admin Portal', path: '/nexus-admin' }] : [])
          ].map((item, i) => (
            item.external ? (
              <a 
                key={i} 
                href={item.path} 
                className="text-cyber-muted hover:text-cyber-accent transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <Link 
                key={i} 
                to={item.path} 
                className="text-cyber-muted hover:text-cyber-accent transition-colors"
              >
                {item.label}
              </Link>
            )
          ))}
        </div>

        {/* Command Team — Accordion */}
        <div className="flex flex-col items-center w-full max-w-2xl">
          <button
            onClick={() => setTeamExpanded((prev) => !prev)}
            className="flex items-center gap-2 text-[9px] text-cyber-muted font-mono tracking-[0.2em] uppercase font-bold hover:text-cyber-accent transition-colors cursor-pointer py-2"
          >
            <span
              className="inline-block transition-transform duration-200"
              style={{ transform: teamExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              ▶
            </span>
            Nexus Command Core
          </button>

          <div
            className="overflow-hidden transition-all duration-300 ease-in-out w-full"
            style={{
              maxHeight: teamExpanded ? "500px" : "0px",
              opacity: teamExpanded ? 1 : 0,
            }}
          >
            <div className="flex flex-col items-center gap-4 w-full pt-4">
              {/* Founder Card */}
              {team.find(t => t.isFounder) && (
                <div 
                  onClick={() => setSelectedMember(team.find(t => t.isFounder))}
                  className="flex flex-col items-center gap-2 bg-cyber-card border border-cyber-border/10 hover:border-cyber-accent/30 p-4 rounded-2xl cursor-pointer transition-all shadow-md hover:shadow-lg min-w-[180px] text-center"
                >
                  <div className="relative">
                    <img 
                      src="https://ui-avatars.com/api/?name=Anil+Kumar&background=004741&color=fff&rounded=true&bold=true" 
                      alt="Anil Kumar" 
                      className="w-8 h-8 rounded-full border border-cyber-border/10" 
                    />
                    <div className="absolute inset-[-4px] rounded-full border border-cyber-accent/20 animate-pulse" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-display font-black text-cyber-text">Anil Kumar</span>
                    <span className="text-[8px] text-cyber-accent font-mono uppercase tracking-wider font-bold">Founder & Analyst</span>
                  </div>
                </div>
              )}

              {/* Tree connector */}
              <div className="w-[1px] h-6 bg-cyber-border/15" />

              {/* Team Members */}
              <div className="flex flex-wrap gap-4 justify-center max-w-2xl">
                {team.filter(t => !t.isFounder).map((member, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedMember(member)}
                    className="flex flex-col items-center gap-2 bg-cyber-card border border-cyber-border/10 hover:border-cyber-accent/30 p-3 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md min-w-[130px] text-center"
                  >
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=${member.color}&color=fff&rounded=true&bold=true`} 
                      alt={member.name} 
                      className="w-6 h-6 rounded-full border border-cyber-border/10" 
                    />
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-display font-bold text-cyber-text">{member.name}</span>
                      <span className="text-[7px] text-cyber-muted font-mono uppercase tracking-wider">{member.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="w-full max-w-3xl border-t border-cyber-border/10 pt-6 flex flex-col items-center gap-4">
          <div className="text-[10px] text-cyber-muted text-center font-body flex flex-col gap-2 items-center">
            <span>© {new Date().getFullYear()} CYBERSHIELD X. All rights reserved.</span>
            <div className="flex gap-4">
              <Link to="/privacy" className="text-cyber-accent hover:underline">Privacy Policy</Link>
              <span className="text-cyber-border/20">|</span>
              <Link to="/terms" className="text-cyber-accent hover:underline">Terms of Service</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[9px] text-cyber-muted font-mono tracking-wider uppercase font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyber-green display-inline-block shadow-[0_0_8px_rgba(34,139,94,0.4)] animate-pulse" />
              All systems operational
            </div>
            <span className="text-cyber-border/20">|</span>
            <ThemeToggle />
          </div>
        </div>

      </footer>
    </>
  );
}