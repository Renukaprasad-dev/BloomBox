'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { SoundToggle } from '@/components/SoundToggle';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Footer } from '@/components/Footer';
import { INITIAL_PRODUCTS } from '@/lib/store';
import { ArrowRight, Sparkles, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';

const ValleyScene = dynamic(
  () => import('@/components/ValleyScene').then((mod) => mod.ValleyScene),
  { ssr: false }
);

export default function BloomBoxHomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [uiVisible, setUiVisible] = useState(false);
  const [isCtaHovered, setIsCtaHovered] = useState(false);

  const handleSceneLoaded = () => {
    setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => {
        setUiVisible(true);
      }, 300);
    }, 500);
  };

  return (
    <main className="relative min-h-screen w-full bg-black text-[#f5efe2] selection:bg-[#f5efe2] selection:text-[#151510]">
      {/* 3D Night Flower Valley Background (Fixed) */}
      <div className="fixed inset-0 z-0 h-screen w-screen overflow-hidden pointer-events-none">
        <ValleyScene onLoaded={handleSceneLoaded} isCtaHovered={isCtaHovered} />
      </div>

      {/* Loading Screen */}
      <LoadingScreen isLoading={isLoading} />

      {/* Main Content Layer */}
      <div
        className={`relative z-20 flex min-h-screen w-full flex-col justify-between transition-opacity duration-1000 ease-out ${
          uiVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Unified Top Navigation */}
        <Header />

        {/* Hero Section */}
        <HeroSection
          onCtaHoverStart={() => setIsCtaHovered(true)}
          onCtaHoverEnd={() => setIsCtaHovered(false)}
        />

        {/* Bottom Sound & Wander Controls */}
        <SoundToggle isMuffled={isCtaHovered} />
      </div>

      {/* Featured Collection Section (Below the fold) */}
      <section className="relative z-20 bg-gradient-to-b from-transparent via-black/90 to-black px-6 py-24 custom:px-16 border-t border-[#f5efe2]/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#f5efe2]/60 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#f5efe2]" /> Curated Harvest
              </div>
              <h2 className="font-antonio text-4xl custom:text-6xl text-white tracking-wide">
                Signature Floral Works
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#f5efe2] hover:text-white transition-colors group"
            >
              <span>Explore All 6 Arrangements</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* 3 Featured Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {INITIAL_PRODUCTS.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="group relative rounded-3xl border border-[#f5efe2]/15 bg-black/60 p-7 backdrop-blur-md transition-all duration-500 hover:-translate-y-1.5 hover:border-[#f5efe2]/40 hover:shadow-[0_15px_40px_rgba(245,239,226,0.08)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#f5efe2]/60 mb-6 uppercase tracking-wider">
                    <span>#{item.id}</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white">
                      {item.category}
                    </span>
                  </div>

                  {/* Visual card header */}
                  <div
                    className={`h-44 w-full rounded-2xl bg-gradient-to-br ${item.imageColor} border border-white/10 flex items-center justify-center p-6 mb-6 relative overflow-hidden`}
                  >
                    <div
                      className="absolute inset-0 opacity-20 blur-xl"
                      style={{ backgroundColor: item.accentColor }}
                    />
                    <span
                      className="font-antonio text-3xl tracking-wider text-white text-center relative z-10"
                    >
                      {item.name}
                    </span>
                  </div>

                  <p className="text-xs text-[#f5efe2]/70 leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="border-t border-[#f5efe2]/10 pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#f5efe2]/50 block">Price</span>
                    <span className="font-mono text-lg font-bold text-white">₹{item.price}</span>
                  </div>
                  <Link
                    href="/shop"
                    className="inline-flex h-10 items-center justify-center rounded-full bg-[#f5efe2] px-5 text-xs font-semibold uppercase tracking-wider text-[#151510] hover:bg-white transition-colors"
                  >
                    View &amp; Order
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-[#f5efe2]/10 pt-12">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#f5efe2]">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Dual Dispatch System</h4>
                <p className="text-xs text-[#f5efe2]/60 mt-1 leading-relaxed">
                  Even/odd token routing through certified couriers (Rider 1 &amp; Rider 2).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#f5efe2]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Event Planner Privileges</h4>
                <p className="text-xs text-[#f5efe2]/60 mt-1 leading-relaxed">
                  Automatic 15% wholesale discount and priority reserve for accredited designers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#f5efe2]">
                <RefreshCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Atomic Stock Reservation</h4>
                <p className="text-xs text-[#f5efe2]/60 mt-1 leading-relaxed">
                  Inventory remains reserved and is only decremented when an order is verified.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Footer */}
      <Footer />
    </main>
  );
}
