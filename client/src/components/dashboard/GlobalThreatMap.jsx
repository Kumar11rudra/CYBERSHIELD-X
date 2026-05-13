import React, { useRef, useEffect, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// PRESETS: Global Node Coordinates for Simulated Threat Arcs
const NODES = [
  { lat: 20.5937, lng: 78.9629, label: 'Mumbai Node', color: '#00d4ff' }, // India
  { lat: 51.5074, lng: -0.1278, label: 'London Edge', color: '#00d4ff' }, // UK
  { lat: 37.7749, lng: -122.4194, label: 'SF Perimeter', color: '#a855f7' }, // USA
  { lat: 35.6762, lng: 139.6503, label: 'Tokyo Uplink', color: '#00ff88' }, // Japan
  { lat: -33.8688, lng: 151.2093, label: 'Sydney Relay', color: '#ff8c00' }, // Australia
  { lat: -23.5505, lng: -46.6333, label: 'São Paulo Auth', color: '#00d4ff' }, // Brazil
  { lat: 55.7558, lng: 37.6173, label: 'Moscow Command', color: '#ff2244' }, // Russia
];

export default function GlobalThreatMap() {
  const { t } = useTranslation();
  const globeRef = useRef();
  const [arcsData, setArcsData] = useState([]);
  const [pointsData, setPointsData] = useState(NODES);

  // Generate random arcs to simulate real-time attacks
  useEffect(() => {
    const generateArc = () => {
      const start = NODES[Math.floor(Math.random() * NODES.length)];
      const end = NODES[Math.floor(Math.random() * NODES.length)];
      if (start === end) return;

      const newArc = {
        startLat: start.lat,
        startLng: start.lng,
        endLat: end.lat,
        endLng: end.lng,
        color: ['#00d4ff', '#ff2244', '#a855f7', '#00ff88'][Math.floor(Math.random() * 4)],
        label: `Attack Blocked: ${start.label} -> ${end.label}`
      };

      setArcsData(prev => [...prev.slice(-15), newArc]);
    };

    const interval = setInterval(generateArc, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cyber-bento-card overflow-hidden h-[400px] relative group border border-white/5 bg-[#02050b]">
      {/* HUD Overlays */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest">{t('dashboard.nexusMap')}</h3>
        <p className="text-[10px] font-mono text-cyber-accent uppercase tracking-tighter mt-1">{t('dashboard.activePerception')}</p>
      </div>

      <div className="absolute bottom-4 right-4 z-10 text-right pointer-events-none">
        <p className="font-mono text-[9px] text-cyber-muted uppercase mb-1">{t('dashboard.intelligenceFeed')}</p>
        <div className="flex gap-2 justify-end">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-accent animate-pulse delay-700" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse delay-1000" />
        </div>
      </div>

      <div className="absolute inset-0 z-0">
        <Globe
          ref={globeRef}
          backgroundColor="rgba(0,0,0,0)"
          width={window.innerWidth < 1024 ? 400 : 700} // Responsive-ish sizing
          height={400}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

          // Arcs (Threats)
          arcsData={arcsData}
          arcColor="color"
          arcDashLength={() => Math.random()}
          arcDashGap={() => Math.random()}
          arcDashAnimateTime={() => Math.random() * 4000 + 500}
          arcStroke={0.5}

          // Points (Nodes)
          pointsData={pointsData}
          pointColor="color"
          pointAltitude={0.1}
          pointRadius={0.5}
          pointsMerge={true}
          pointLabel="label"

          // Interactive
          animateIn={true}
          onGlobeClick={() => globeRef.current.pointOfView({ altitude: 2.5 }, 1000)}
        />
      </div>

      {/* Grid Scan Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20"
        style={{ backgroundSize: '100% 4px, 3px 100%' }} />
    </div>
  );
}
