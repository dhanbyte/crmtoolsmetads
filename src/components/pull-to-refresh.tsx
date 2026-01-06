"use client";

import { Loader2, RefreshCw } from "lucide-react";

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  progress: number;
}

export function PullToRefreshIndicator({
  isPulling,
  isRefreshing,
  pullDistance,
  progress,
}: PullToRefreshIndicatorProps) {
  if (!isPulling && !isRefreshing) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200 md:hidden"
      style={{ 
        height: `${pullDistance}px`,
        opacity: progress 
      }}
    >
      <div className="bg-white rounded-full p-3 shadow-lg">
        {isRefreshing ? (
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        ) : (
          <RefreshCw 
            className="h-6 w-6 text-blue-600 transition-transform" 
            style={{ transform: `rotate(${progress * 360}deg)` }}
          />
        )}
      </div>
    </div>
  );
}