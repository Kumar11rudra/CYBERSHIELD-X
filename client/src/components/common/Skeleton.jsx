import React from 'react';

/**
 * Skeleton — A premium shimmering placeholder for loading states.
 */
const Skeleton = ({ className = '', variant = 'rect', width, height }) => {
  const baseClass = "relative overflow-hidden bg-cyber-accent/5 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-cyber-accent/10 before:to-transparent";
  
  const shapeClass = variant === 'circle' ? 'rounded-full' : 'rounded-xl';
  
  return (
    <div 
      className={`${baseClass} ${shapeClass} ${className}`}
      style={{ width: width || '100%', height: height || '20px' }}
    />
  );
};

export const BentoSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-pulse">
    {/* Score Gauge Skeleton */}
    <div className="md:col-span-4 cyber-bento-card p-6 flex flex-col items-center justify-center min-h-[320px]">
      <Skeleton variant="circle" width="160px" height="160px" className="mb-4" />
      <Skeleton width="120px" height="12px" className="mb-2" />
      <Skeleton width="80px" height="8px" />
    </div>

    {/* Map Skeleton */}
    <div className="md:col-span-8 cyber-bento-card min-h-[320px]">
      <Skeleton width="100%" height="100%" />
    </div>

    {/* Scanner Skeleton */}
    <div className="md:col-span-7 cyber-bento-card p-6 min-h-[280px]">
      <div className="flex justify-between mb-6">
        <div>
          <Skeleton width="140px" height="14px" className="mb-2" />
          <Skeleton width="200px" height="8px" />
        </div>
        <Skeleton width="60px" height="20px" className="rounded-full" />
      </div>
      <Skeleton width="100%" height="48px" className="mb-8" />
      <Skeleton width="100%" height="100px" />
    </div>

    {/* Risk Pie Skeleton */}
    <div className="md:col-span-5 cyber-bento-card p-6 min-h-[280px] flex flex-col items-center justify-center">
      <Skeleton variant="circle" width="140px" height="140px" className="mb-6" />
      <div className="grid grid-cols-2 gap-4 w-full">
        <Skeleton height="32px" />
        <Skeleton height="32px" />
        <Skeleton height="32px" />
        <Skeleton height="32px" />
      </div>
    </div>
  </div>
);

export default Skeleton;
