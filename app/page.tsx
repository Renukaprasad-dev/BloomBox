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
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  RefreshCcw,
  Flower2,
  Heart,
  Award,
  Clock,
  CheckCircle,
} from 'lucide-react';

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
    }, 450);
  };

  return (
    <main className="relative min-h-screen w-full bg-black text-[#f5efe2] selection:bg-[#f5efe2] selection:text-[#151510]">
      {/* 1. Full-Screen 3D Flower Sanctuary Background */}
      <div className="fixed inset-0 z-0 h-screen w-screen overflow-hidden pointer-events-none">
        <ValleyScene onLoaded={handleSceneLoaded} isCtaHovered={isCtaHovered} />
      </div>

      {/* 2. Loading Screen */}
      <LoadingScreen isLoading={isLoading} />

      {/* 3. Hero Layer */}
      <div
        className={`relative z-20 flex min-h-screen w-full flex-col justify-between transition-opacity duration-1000 ease-out ${
          uiVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Header />
        <HeroSection
          onCtaHoverStart={() => setIsCtaHovered(true)}
          onCtaHoverEnd={() => setIsCtaHovered(false)}
        />
        <SoundToggle isMuffled={isCtaHovered} />
      </div>

      {/* SECTION 1: Featured Collections */}
      <section
        id="collection"
        className="relative z-20 bg-gradient-to-b from-transparent via-[#06080e]/95 to-[#06080e] px-6 py-28 custom:px-14 border-t border-[#f5efe2]/10 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5efe2]/50 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#f5efe2]" /> Botanical Haute Couture
              </div>
              <h2 className="font-antonio text-4xl custom:text-6xl text-white tracking-wide">
                Featured Collections
              </h2>
            </div>
            <p className="text-xs custom:text-sm text-[#f5efe2]/70 max-w-md leading-relaxed">
              From ceremonial night-blooming garlands to delicate exotic orchid stems, each piece is harvested at peak nocturnal fragrance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group rounded-3xl border border-white/10 bg-gradient-to-b from-rose-950/30 via-black/80 to-black p-8 backdrop-blur-md hover:border-rose-400/40 transition-all duration-500">
              <span className="text-[11px] font-mono text-rose-300 uppercase tracking-widest block mb-3">Bouquets &amp; Bunches</span>
              <h3 className="font-antonio text-3xl text-white mb-3">Crimson &amp; Lily Symphony</h3>
              <p className="text-xs text-[#f5efe2]/70 leading-relaxed mb-6">
                Velvety garden roses hand-tied with fresh Asiatic lilies and cascading woodland foliage.
              </p>
              <Link href="/shop" className="text-xs font-semibold uppercase tracking-wider text-[#f5efe2] hover:text-white flex items-center gap-2">
                Explore Bouquets <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="group rounded-3xl border border-white/10 bg-gradient-to-b from-amber-950/30 via-black/80 to-black p-8 backdrop-blur-md hover:border-amber-400/40 transition-all duration-500">
              <span className="text-[11px] font-mono text-amber-300 uppercase tracking-widest block mb-3">Rituals &amp; Sacred Scents</span>
              <h3 className="font-antonio text-3xl text-white mb-3">Night Jasmine &amp; Marigold</h3>
              <p className="text-xs text-[#f5efe2]/70 leading-relaxed mb-6">
                Heirloom ceremonial garlands woven with fragrant night-blooming jasmine and golden sun marigolds.
              </p>
              <Link href="/shop" className="text-xs font-semibold uppercase tracking-wider text-[#f5efe2] hover:text-white flex items-center gap-2">
                Explore Sacred Flora <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="group rounded-3xl border border-white/10 bg-gradient-to-b from-purple-950/30 via-black/80 to-black p-8 backdrop-blur-md hover:border-purple-400/40 transition-all duration-500">
              <span className="text-[11px] font-mono text-purple-300 uppercase tracking-widest block mb-3">Architectural Table Decor</span>
              <h3 className="font-antonio text-3xl text-white mb-3">Centerpiece Installations</h3>
              <p className="text-xs text-[#f5efe2]/70 leading-relaxed mb-6">
                Structural table installations sculpted with cascading orchids and architectural greenhouse foliage.
              </p>
              <Link href="/shop" className="text-xs font-semibold uppercase tracking-wider text-[#f5efe2] hover:text-white flex items-center gap-2">
                Explore Installations <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Bestselling Flowers (All 6 Java Products) */}
      <section className="relative z-20 bg-[#06080e] px-6 py-24 custom:px-14 border-t border-[#f5efe2]/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5efe2]/50 mb-3">
                <Flower2 className="w-3.5 h-3.5 text-[#f5efe2]" /> Greenhouse Favorites
              </div>
              <h2 className="font-antonio text-4xl custom:text-6xl text-white tracking-wide">
                Bestselling Flowers
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#f5efe2] hover:text-white group"
            >
              <span>View Full Catalog &amp; Cart</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {INITIAL_PRODUCTS.map((item) => (
              <div
                key={item.id}
                className="group rounded-3xl border border-[#f5efe2]/15 bg-black/60 p-7 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-[#f5efe2]/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#f5efe2]/60 mb-5">
                    <span className="font-mono">#{item.id}</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white text-[11px]">
                      {item.category}
                    </span>
                  </div>

                  <div className="h-44 w-full rounded-2xl border border-white/10 mb-5 relative overflow-hidden bg-black/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <h4 className="font-antonio text-3xl tracking-wide text-white absolute bottom-3 left-3 right-3 drop-shadow-md">
                      {item.name}
                    </h4>
                  </div>

                  <p className="text-xs text-[#f5efe2]/70 leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="border-t border-[#f5efe2]/10 pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#f5efe2]/50 block">Price</span>
                    <span className="font-mono text-xl font-bold text-white">₹{item.price}</span>
                  </div>
                  <Link
                    href="/shop"
                    className="inline-flex h-10 items-center justify-center rounded-full bg-[#f5efe2] px-5 text-xs font-semibold uppercase tracking-wider text-[#151510] hover:bg-white transition-all shadow-md"
                  >
                    Order Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Our Story */}
      <section className="relative z-20 bg-gradient-to-b from-[#06080e] to-black px-6 py-28 custom:px-14 border-t border-[#f5efe2]/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs uppercase tracking-widest text-[#f5efe2]/50 font-semibold block">
              Regenerative Lineage
            </span>
            <h2 className="font-antonio text-4xl custom:text-6xl text-white leading-tight">
              Crafted in Harmony With the Night Earth.
            </h2>
            <p className="text-sm text-[#f5efe2]/75 leading-relaxed">
              BloomBox was founded on a simple conviction: flowers should inspire awe without harming the earth. From our organic highland nurseries to our algorithmic courier routing, every stem is grown, packaged, and dispatched with environmental stewardship.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div>
                <p className="font-antonio text-4xl text-white">100%</p>
                <p className="text-xs text-[#f5efe2]/60 mt-1">Chemical-free soil cultivation</p>
              </div>
              <div>
                <p className="font-antonio text-4xl text-white">0%</p>
                <p className="text-xs text-[#f5efe2]/60 mt-1">Single-use plastic floral foam</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md space-y-5">
            <h3 className="font-antonio text-2xl text-white">The BloomBox Guarantee</h3>
            <ul className="space-y-4 text-xs text-[#f5efe2]/80">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Hand-inspected stems picked at peak morning vitality.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Dual courier dispatch (Rider 1 &amp; Rider 2) with climate-controlled crates.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Transparent wholesale billing with immediate PDF receipt generation.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 4: Custom Arrangements */}
      <section className="relative z-20 bg-black px-6 py-24 custom:px-14 border-t border-[#f5efe2]/10">
        <div className="max-w-7xl mx-auto rounded-3xl border border-[#f5efe2]/15 bg-gradient-to-r from-purple-950/20 via-black to-rose-950/20 p-10 md:p-16">
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-widest text-[#f5efe2]/50 font-semibold block mb-3">
              Event Designers &amp; Planners
            </span>
            <h2 className="font-antonio text-4xl custom:text-5xl text-white mb-4">
              Bespoke Banquets &amp; Stage Decor
            </h2>
            <p className="text-xs custom:text-sm text-[#f5efe2]/75 leading-relaxed mb-8">
              Registered Event Planners receive an automated 15% wholesale allowance, priority reservation of rare Orchid and Jasmine stocks, and instant GST invoices.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/bloombox"
                className="h-12 inline-flex items-center justify-center gap-2 rounded-full bg-[#f5efe2] px-8 text-xs font-semibold uppercase tracking-wider text-[#151510] hover:bg-white transition-all shadow-lg"
              >
                Access Billing Portal
              </Link>
              <Link
                href="/contact"
                className="h-12 inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-all"
              >
                Book Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Why BloomBox */}
      <section className="relative z-20 bg-black px-6 py-24 custom:px-14 border-t border-[#f5efe2]/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest text-[#f5efe2]/50 font-semibold block mb-2">
              Our Core Standards
            </span>
            <h2 className="font-antonio text-4xl custom:text-5xl text-white">
              Why Discerning Clients Choose BloomBox
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] text-center space-y-3">
              <Clock className="w-8 h-8 text-[#f5efe2] mx-auto mb-2" />
              <h3 className="font-antonio text-2xl text-white">Same-Day Dispatch</h3>
              <p className="text-xs text-[#f5efe2]/70 leading-relaxed">
                Orders placed before 2:00 PM are hand-assembled and handed to certified riders for evening arrival.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] text-center space-y-3">
              <Award className="w-8 h-8 text-[#f5efe2] mx-auto mb-2" />
              <h3 className="font-antonio text-2xl text-white">Botanical Integrity</h3>
              <p className="text-xs text-[#f5efe2]/70 leading-relaxed">
                Never refrigerated past freshness limits. Every petal retains natural essential oils and vibrancy.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] text-center space-y-3">
              <ShieldCheck className="w-8 h-8 text-[#f5efe2] mx-auto mb-2" />
              <h3 className="font-antonio text-2xl text-white">Instant GST Invoicing</h3>
              <p className="text-xs text-[#f5efe2]/70 leading-relaxed">
                Legally compliant tax invoices with downloadable PDF records generated on the spot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Footer */}
      <Footer />
    </main>
  );
}
