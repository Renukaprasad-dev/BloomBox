'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { SoundToggle } from '@/components/SoundToggle';
import { LoadingScreen } from '@/components/LoadingScreen';

// Client-only dynamic import of the 3D Valley to prevent any SSR window/WebGL errors
const ValleyScene = dynamic(
  () => import('@/components/ValleyScene').then((mod) => mod.ValleyScene),
  { ssr: false }
);

export default function FernhollowPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [uiVisible, setUiVisible] = useState(false);
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleSceneLoaded = () => {
    // Reveal scene once 3D world is generated
    setTimeout(() => {
      setIsLoading(false);
      // Reveal UI with organic 1.6s ease after loader begins fading out
      setTimeout(() => {
        setUiVisible(true);
      }, 350);
    }, 600);
  };

  const handleNavClick = (section: string) => {
    if (section === 'work' || section === 'about' || section === 'journal' || section === 'contact') {
      setActiveModal(section);
    } else {
      setActiveModal(null);
    }
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black select-none">
      {/* 1. Full-screen 3D Flower Valley */}
      <ValleyScene onLoaded={handleSceneLoaded} isCtaHovered={isCtaHovered} />

      {/* 2. Loading Experience: Centered 9px pulsing dot */}
      <LoadingScreen isLoading={isLoading} />

      {/* 3. Website Interface Layer (Fades in over 1.6s after loading) */}
      <div
        className={`relative z-20 flex h-full w-full flex-col justify-between transition-opacity duration-[1600ms] ease-out pointer-events-none ${
          uiVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Fixed Header */}
        <Header onNavClick={handleNavClick} />

        {/* Hero Section */}
        <HeroSection
          onCtaHoverStart={() => setIsCtaHovered(true)}
          onCtaHoverEnd={() => setIsCtaHovered(false)}
          onCtaClick={() => handleNavClick('contact')}
        />

        {/* Bottom Wander indicator & Sound Toggle */}
        <SoundToggle isMuffled={isCtaHovered} />
      </div>

      {/* 4. Elegant Minimalist Drawer / Info Dialog for Header Navigation */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 animate-fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="relative max-w-lg w-full rounded-2xl border border-[#f5efe2]/20 bg-[#0a0c10]/95 p-8 text-[#f5efe2] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#f5efe2]/15 pb-4 mb-6">
              <h2 className="text-2xl font-antonio uppercase tracking-wide">
                {activeModal === 'work' && 'Selected Works'}
                {activeModal === 'about' && 'About Fernhollow'}
                {activeModal === 'journal' && 'Field Journal'}
                {activeModal === 'contact' && "Let's Talk"}
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close dialog"
                className="rounded-full p-1.5 text-[#f5efe2]/60 hover:text-[#f5efe2] hover:bg-[#f5efe2]/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-[15px] leading-relaxed text-[#f5efe2]/80 font-normal">
              {activeModal === 'work' && (
                <p>
                  Exploring the threshold between synthetic biology, ecological architecture, and generative spatial computing. We partner with visionary institutions to sculpt living systems.
                </p>
              )}
              {activeModal === 'about' && (
                <p>
                  Fernhollow is a regenerative design studio based in the nocturnal highlands. We cultivate experiences rooted in natural intelligence and engineered for enduring resilience.
                </p>
              )}
              {activeModal === 'journal' && (
                <p>
                  Notes on nocturnal flora phototropism, computational mycorrhizal networks, and dark-sky atmospheric aesthetics. Issue 04 publishing Spring 2026.
                </p>
              )}
              {activeModal === 'contact' && (
                <div>
                  <p className="mb-4">
                    Inquire about collaborations, landscape installations, or computational botanical commissions:
                  </p>
                  <a
                    href="mailto:hello@fernhollow.studio"
                    className="inline-block rounded-full bg-[#f5efe2] px-6 py-2.5 text-sm font-medium text-[#151510] hover:bg-white transition-all"
                  >
                    hello@fernhollow.studio
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
