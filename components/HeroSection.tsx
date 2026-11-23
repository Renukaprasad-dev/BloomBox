'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onCtaHoverStart?: () => void;
  onCtaHoverEnd?: () => void;
  onCtaClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onCtaHoverStart,
  onCtaHoverEnd,
  onCtaClick,
}) => {
  return (
    <section className="relative z-20 flex min-h-screen w-full flex-col items-center justify-center px-4 text-center pointer-events-none">
      <div className="flex flex-col items-center max-w-[1400px] pointer-events-auto">
        {/* Main headline */}
        <h1
          className="font-antonio font-normal text-[#f5efe2] text-center select-none"
          style={{
            lineHeight: 0.92,
            letterSpacing: '-0.012em',
          }}
        >
          <span className="block text-[clamp(56px,18vw,96px)] custom:hidden text-center whitespace-normal">
            Grown,
            <br />
            not built.
          </span>
          <span className="hidden custom:block text-[clamp(96px,9.8vw,158px)] whitespace-nowrap">
            Grown, not built.
          </span>
        </h1>

        {/* Caption */}
        <div className="mt-8 custom:mt-12 text-[#f5efe2]/75 text-[17px] custom:text-[20px] font-normal leading-[1.3] tracking-wide select-none">
          <p>Rooted in nature.</p>
          <p>Built for what&apos;s next.</p>
        </div>

        {/* Circular CTA Arrow Button */}
        <div className="mt-10 custom:mt-14 flex items-center justify-center">
          <button
            type="button"
            aria-label="Explore the valley"
            onClick={onCtaClick}
            onMouseEnter={onCtaHoverStart}
            onMouseLeave={onCtaHoverEnd}
            className="group relative flex h-[58px] w-[58px] items-center justify-center rounded-full border border-[#f5efe2] bg-transparent text-[#f5efe2] transition-all duration-500 ease-out hover:scale-105 hover:bg-[#f5efe2] hover:text-[#151510] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#f5efe2]/50"
          >
            <ArrowRight
              className="h-5 w-5 stroke-[1.75] transition-transform duration-500 group-hover:translate-x-0.5 group-hover:text-[#151510]"
            />
            {/* Subtle glow ring on hover */}
            <span
              className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:shadow-[0_0_25px_rgba(245,239,226,0.35)]"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </section>
  );
};
