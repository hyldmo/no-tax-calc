import React from 'react';
import { ProcessedBucket } from '../types';

interface DistributionChartProps {
  data: ProcessedBucket[];
  userMonthly: number;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({ data, userMonthly }) => {
  // Chart Configuration
  // const width = 100; // Percent - Unused but kept for context
  // const height = 100; // Percent - Unused but kept for context
  const maxCount = Math.max(...data.map(d => d.count));
  const barWidth = 100 / data.length;
  
  // Find active bucket index for highlighting
  const activeBucketIndex = data.findIndex(b => userMonthly >= b.min && userMonthly < b.max);

  return (
    <div className="relative w-full h-full min-h-[250px]">
      <svg width="100%" height="100%" preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Bars */}
        {data.map((bucket, index) => {
          const barHeight = (bucket.count / maxCount) * 100;
          const isActive = index === activeBucketIndex;
          const x = index * barWidth;
          const y = 100 - barHeight;

          return (
            <g key={bucket.min} className="group">
              {/* The visible bar */}
              <rect
                x={`${x}%`}
                y={`${y}%`}
                width={`${barWidth - 0.2}%`}
                height={`${barHeight}%`}
                fill={isActive ? "url(#activeGradient)" : "url(#barGradient)"}
                className="transition-all duration-500 ease-out"
                rx="2"
              />
              
              {/* Invisible hover hit area */}
              <rect
                x={`${x}%`}
                y="0"
                width={`${barWidth}%`}
                height="100%"
                fill="transparent"
              >
                 <title>{`${bucket.min}-${bucket.max} kr: ${bucket.count.toLocaleString()} personer`}</title>
              </rect>
            </g>
          );
        })}

        {/* User Line Marker */}
        {userMonthly > 0 && userMonthly <= 200000 && (
           <g className="transition-all duration-700 ease-out" style={{ transform: `translateX(${(userMonthly / 200000) * 100}%)` }}>
             <line
               x1="0"
               y1="-10%"
               x2="0"
               y2="100%"
               stroke="#2563eb"
               strokeWidth="2"
               strokeDasharray="4 2"
             />
             <circle cx="0" cy="-10%" r="4" fill="#2563eb" />
             <rect x="-30" y="-20%" width="60" height="20" rx="4" fill="#1e293b" />
             <text x="0" y="-15%" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Du er her</text>
           </g>
        )}
      </svg>
    </div>
  );
};

