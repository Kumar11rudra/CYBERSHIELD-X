import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WAFRulesGenerator = ({ target, targetType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('iptables');

  // Only generate rules for IP or Domain, not hash
  if (targetType === 'hash') return null;

  const rules = {
    iptables: targetType === 'ip' 
      ? `sudo iptables -A INPUT -s ${target} -j DROP\nsudo iptables -A OUTPUT -d ${target} -j DROP`
      : `# iptables cannot block domains natively.\n# Block resolved IP instead, or use dnsmasq.\nsudo iptables -A INPUT -m string --algo bm --string "${target}" -j DROP`,
    nginx: targetType === 'ip'
      ? `deny ${target};\n# Add to your server {} block or nginx.conf`
      : `if ($http_host = "${target}") {\n    return 403;\n}\n# Add to your server {} block`,
    aws_waf: `{
  "Name": "Block-${targetType === 'ip' ? 'IP' : 'Domain'}-${target.replace(/[^a-zA-Z0-9]/g, '')}",
  "Priority": 0,
  "Action": { "Block": {} },
  "Statement": {
    "${targetType === 'ip' ? 'IPSetReferenceStatement' : 'ByteMatchStatement'}": {
      ${targetType === 'ip' ? `"ARN": "arn:aws:wafv2:..."` : `"SearchString": "${target}",\n      "FieldToMatch": { "SingleHeader": { "Name": "host" } },\n      "TextTransformations": [{ "Priority": 0, "Type": "LOWERCASE" }],\n      "PositionalConstraint": "EXACTLY"`}
    }
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "Block-${target.replace(/[^a-zA-Z0-9]/g, '')}"
  }
}`
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="mt-6 border border-cyber-accent/30 bg-cyber-accent/5 rounded-lg overflow-hidden">
      <div 
        className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-cyber-accent/10 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🧱</span>
          <h3 className="font-mono text-sm font-bold text-cyber-accent uppercase tracking-widest">
            WAF Rules Generator
          </h3>
          <span className="text-[10px] bg-cyber-accent/20 text-cyber-accent px-2 py-0.5 rounded border border-cyber-accent/30 font-mono uppercase">
            Auto-Mitigation
          </span>
        </div>
        <span className="text-cyber-accent font-mono text-xs">{isOpen ? 'COLLAPSE [ - ]' : 'EXPAND [ + ]'}</span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-cyber-accent/20"
          >
            <div className="p-4 bg-black/40">
              <p className="font-mono text-xs text-cyber-muted mb-4">
                Generate firewall block rules instantly for <span className="text-white">{target}</span> to prevent network compromise.
              </p>
              
              <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
                {['iptables', 'nginx', 'aws_waf'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`font-mono text-xs px-4 py-2 rounded-t uppercase transition-colors ${
                      activeTab === tab 
                      ? 'bg-cyber-accent/20 text-cyber-accent border-b-2 border-cyber-accent' 
                      : 'text-cyber-muted hover:text-white'
                    }`}
                  >
                    {tab.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="relative group">
                <pre className="font-mono text-[11px] text-cyber-text bg-black/80 border border-white/10 rounded p-4 overflow-x-auto whitespace-pre-wrap">
                  {rules[activeTab]}
                </pre>
                <button 
                  onClick={() => handleCopy(rules[activeTab])}
                  className="absolute top-2 right-2 bg-white/10 hover:bg-cyber-accent/20 text-white p-1.5 rounded border border-white/20 hover:border-cyber-accent hover:text-cyber-accent transition-all opacity-0 group-hover:opacity-100"
                  title="Copy Rule"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WAFRulesGenerator;
