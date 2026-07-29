import React from "react";

const TOOLKIT_CATEGORIES = [
  {
    id: 'web',
    title: 'Web Security',
    icon: '🌍',
    desc: 'Audit web applications for header exposures, SSL grade compliance, and stack vulnerabilities.',
    previews: ['HTTP Header Inspector', 'Technology Detector', 'SSL Trust Evaluator'],
    count: '+4 More Tools',
    color: 'blue'
  },
  {
    id: 'vulnerability',
    title: 'Vulnerability Assessment',
    icon: '🛡️',
    desc: 'Scan remote nodes to identify active daemon exposures and outdated package hashes.',
    previews: ['Port Scanner', 'OS Fingerprinter', 'Service Version Auditer'],
    count: '+6 More Tools',
    color: 'green'
  },
  {
    id: 'recon',
    title: 'Reconnaissance & OSINT',
    icon: '🔍',
    desc: 'Gather registry coordinates and domain mapping configurations globally.',
    previews: ['DNS Zone Mapper', 'WHOIS Record Finder', 'Subdomain Lookup'],
    count: '+5 More Tools',
    color: 'orange'
  },
  {
    id: 'malware',
    title: 'Malware & Threat Analysis',
    icon: '☣️',
    desc: 'Correlate files, hashes, and URLs against international threat intelligence feeds.',
    previews: ['Vulnerability Tracker', 'URL Reputation Scanner', 'IP Abuse Reporter'],
    count: '+3 More Tools',
    color: 'red'
  },
  {
    id: 'intelligence',
    title: 'Threat Intelligence Feeds',
    icon: '⚡',
    desc: 'Retrieve active threat indicators directly from top global defense databases.',
    previews: ['CISA KEV Feeds', 'IP Risk Correlation', 'SSL Expiry Tracker'],
    count: '+2 More Tools',
    color: 'purple'
  },
  {
    id: 'utility',
    title: 'Diagnostics & Utilities',
    icon: '🔧',
    desc: 'Essential networking helper utilities for operational network triaging.',
    previews: ['Ping Triage Diagnostics', 'Network Speed Tester', 'Hash Entropy Calculator'],
    count: '+3 More Tools',
    color: 'green'
  }
];

export default function ModulesSection({ navigate, t }) {
  return (
    <section className="py-8 px-5 md:px-6 bg-cyber-bg border-t border-cyber-border/10">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Section Header */}
        <div className="text-center space-y-2">
          <p className="text-[10px] font-mono text-cyber-accent uppercase tracking-[0.3em]">
            EXPLORE THE PLATFORM
          </p>
          <h2 className="font-display text-2xl font-black text-cyber-text uppercase tracking-tight">
            Explore Security Toolkit
          </h2>
          <p className="max-w-lg mx-auto text-xs text-cyber-muted font-body leading-relaxed">
            Select a primary security category. Each category provides automated diagnostic tools, audit modules, and diagnostic utilities.
          </p>
          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-cyber-accent to-transparent mx-auto pt-2" />
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLKIT_CATEGORIES.map((cat, i) => (
            <div 
              key={cat.id}
              className="bg-cyber-card border border-cyber-border/10 hover:border-cyber-accent/30 rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Icon & Title */}
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyber-accent/10 text-cyber-accent uppercase tracking-wider">
                    Category Gateway
                  </span>
                </div>

                <h3 className="font-display text-base font-black text-cyber-text group-hover:text-cyber-accent transition-colors">
                  {cat.title}
                </h3>

                <p className="text-xs text-cyber-muted font-body leading-relaxed">
                  {cat.desc}
                </p>

                {/* Previews List */}
                <div className="pt-1 space-y-2">
                  <div className="text-[9px] font-mono text-cyber-accent uppercase tracking-wider font-bold">
                    Included Tools
                  </div>
                  <ul className="space-y-1 text-xs text-cyber-text/80 font-mono">
                    {cat.previews.map((toolName, tIdx) => (
                      <li key={tIdx} className="flex items-center gap-2">
                        <span className="text-cyber-accent/50 text-[9px]">•</span>
                        <span>{toolName}</span>
                      </li>
                    ))}
                    <li className="text-[10px] text-cyber-muted font-bold pt-1">
                      {cat.count}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <button
                  onClick={() => navigate(`/toolkit?category=${cat.id}`)}
                  className="w-full py-2.5 bg-cyber-primary/5 hover:bg-cyber-accent hover:text-cyber-bg border border-cyber-accent/20 rounded-xl text-cyber-accent font-display text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  Explore Category →
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
