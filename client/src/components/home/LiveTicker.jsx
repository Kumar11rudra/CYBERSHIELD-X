import React from "react";

const TICKER = [
  "⚠ CISA KEV: Critical RCE in Ivanti Connect Secure",
  "🔴 ALERT: New Lumma Stealer campaign targeting Indian banks",
  "⚡ UrlEngine: 2.3M new IOCs detected in last 24h",
  "🛡 UrlEngine: 14,000+ IPs reported for DDoS activity today",
  "⚠ NCIIPC Advisory: Phishing attacks targeting UPI users",
  "🔴 CERT-In: Ransomware targeting MSME sector in India",
];

export default function LiveTicker() {
  return (
    <div
      className="relative z-20 w-full bg-black/40 border-b border-cyber-accent/10 overflow-hidden whitespace-nowrap"
      style={{ padding: "8px 0" }}
    >
      <div
        className="inline-block whitespace-nowrap"
        style={{ animation: "ticker 40s linear infinite" }}
      >
        {[...TICKER, ...TICKER].map((text, i) => (
          <span
            key={i}
            className="text-cyber-accent text-[13px] tracking-wide font-semibold mr-[60px]"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
