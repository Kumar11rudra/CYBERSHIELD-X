import React from 'react';
import { getStatusBadge } from './toolConfig';

export default function ToolkitStatusBadge({ status }) {
  const badge = getStatusBadge(status);
  return (
    <span 
      className="text-[8px] font-mono font-bold px-2 py-0.5 rounded border tracking-wider uppercase transition-colors"
      style={{
        color: badge.color,
        borderColor: badge.color + '4d', // 30% opacity
        backgroundColor: badge.bg,
      }}
    >
      {badge.label}
    </span>
  );
}
