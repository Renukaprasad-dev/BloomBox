'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onCtaHoverStart?: () => void;
  onCtaHoverEnd?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onCtaHoverStart,
  onCtaHoverEnd,
}) => {
  return (
    <section className="relative z-20 flex min-h-screen w-full flex-col items-center justify-center px-6 text-center pointer-events-none">
      <div className="flex flex-col items-center max-w-[1400px] pointer-events-auto">
        {/* Subtle pill tag */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f5efe2]/20 bg-black/40 px-4 py-1.5 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-[#f5efe2]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#f5efe2]/80">
            Regenerative Flower Valley &amp; Studio
          </span>
        </div>

        {/* Main headline: Let Nature Bloom. */}
        <h1
          className="font-antonio font-normal text-[#f5efe2] text-center select-none tracking-[-0.015em]"
          style={{ lineHeight: 0.94 }}
        >
          <span className="block text-[clamp(52px,16vw,92px)] custom:hidden text-center whitespace-normal">
            Let Nature
            <br />
            Bloom.
          </span>
          <span className="hidden custom:block text-[clamp(88px,9.2vw,148px)] whitespace-nowrap">
            Let Nature Bloom.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-7 custom:mt-10 max-w-2xl text-[#f5efe2]/75 text-[16px] custom:text-[20px] font-normal leading-[1.35] tracking-wide select-none">
          Beautiful flowers. Thoughtful moments. Naturally unforgettable.
        </p>

        {/* Action Buttons: Primary & Secondary CTA */}
        <div className="mt-9 custom:mt-12 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Primary CTA: Explore Flowers */}
          <Link
            href="/shop"
            onMouseEnter={onCtaHoverStart}
            onMouseLeave={onCtaHoverEnd}
            className="group relative flex h-[52px] items-center justify-center gap-3 rounded-full bg-[#f5efe2] px-8 text-sm font-semibold uppercase tracking-[0.08em] text-[#151510] shadow-[0_0_30px_rgba(245,239,226,0.25)] transition-all duration-300 hover:scale-105 hover:bg-white active:scale-95"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Explore Flowers</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          {/* Secondary CTA: Create an Order */}
          <Link
            href="/bloombox"
            className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-[#f5efe2]/40 bg-black/40 backdrop-blur-md px-8 text-sm font-semibold uppercase tracking-[0.08em] text-[#f5efe2] transition-all duration-300 hover:bg-white/10 hover:border-[#f5efe2] hover:text-white active:scale-95"
          >
            <span>Create an Order</span>
          </Link>
        </div>
      </div>
    </section>
  );
};
