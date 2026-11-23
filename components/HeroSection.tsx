'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Sparkles, Flower2 } from 'lucide-react';

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
      <div className="flex flex-col items-center max-w-[1300px] pointer-events-auto pt-16">
        {/* Small label */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f5efe2]/25 bg-black/50 px-5 py-2 backdrop-blur-md shadow-lg animate-fade-in">
          <Sparkles className="h-3.5 w-3.5 text-[#f5efe2]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f5efe2]/90">
            A World of Natural Beauty
          </span>
        </div>

        {/* Main headline: Let Nature Bloom. */}
        <h1
          className="font-antonio font-normal text-[#f5efe2] text-center select-none tracking-[-0.02em] drop-shadow-2xl"
          style={{ lineHeight: 0.92 }}
        >
          <span className="block text-[clamp(54px,16vw,96px)] custom:hidden text-center whitespace-normal">
            Let Nature
            <br />
            Bloom.
          </span>
          <span className="hidden custom:block text-[clamp(90px,9.5vw,156px)] whitespace-nowrap">
            Let Nature Bloom.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-7 custom:mt-9 max-w-2xl text-[#f5efe2]/80 text-[16px] custom:text-[20px] font-normal leading-[1.4] tracking-wide select-none drop-shadow">
          Thoughtfully curated flowers for life&apos;s most beautiful moments.
        </p>

        {/* Action Buttons: EXPLORE COLLECTION & CREATE AN ORDER */}
        <div className="mt-10 custom:mt-12 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <Link
            href="/shop"
            onMouseEnter={onCtaHoverStart}
            onMouseLeave={onCtaHoverEnd}
            className="group relative flex h-[54px] items-center justify-center gap-3 rounded-full bg-[#f5efe2] px-9 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#151510] shadow-[0_0_35px_rgba(245,239,226,0.3)] transition-all duration-300 hover:scale-105 hover:bg-white active:scale-95"
          >
            <Flower2 className="h-4 w-4" />
            <span>Explore Collection</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/bloombox"
            className="flex h-[54px] items-center justify-center gap-2 rounded-full border border-[#f5efe2]/40 bg-black/50 backdrop-blur-md px-9 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#f5efe2] transition-all duration-300 hover:bg-white/10 hover:border-[#f5efe2] hover:text-white active:scale-95"
          >
            <span>Create an Order</span>
          </Link>
        </div>
      </div>
    </section>
  );
};
