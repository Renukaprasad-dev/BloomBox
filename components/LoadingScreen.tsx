'use client';

import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      // Allow 1.0s fade out transition before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShouldRender(true);
    }
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-1000 pointer-events-none ${
        isLoading ? 'opacity-100' : 'opacity-0'
      }`}
      aria-live="polite"
      aria-busy={isLoading}
    >
      <div className="relative flex items-center justify-center">
        {/* Central 9px pulsing cream dot */}
        <div
          className="h-[9px] w-[9px] rounded-full bg-[#f5efe2] animate-pulse-dot shadow-[0_0_12px_rgba(245,239,226,0.6)]"
          role="status"
          aria-label="Loading Fernhollow experience"
        />
        {/* Delicate outer expanding halo */}
        <div
          className="absolute h-6 w-6 rounded-full border border-[#f5efe2]/20 animate-ping"
          style={{ animationDuration: '2.4s' }}
        />
      </div>
    </div>
  );
};
