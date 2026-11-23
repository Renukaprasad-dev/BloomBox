'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Sparkles, ArrowRight, Flower2, HeartHandshake, Leaf, Sprout } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#05070a] text-[#f5efe2] font-manrope selection:bg-[#f5efe2] selection:text-[#151510] flex flex-col justify-between">
      <Header />

      <main className="max-w-7xl mx-auto w-full px-6 pt-32 pb-24 custom:px-12">
        {/* Hero Banner */}
        <div className="max-w-3xl mb-20">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5efe2]/50 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#f5efe2]" /> Studio Philosophy
          </div>
          <h1 className="font-antonio text-5xl custom:text-7xl text-white tracking-wide leading-tight">
            Regenerative Floristry, Grown For Tomorrow.
          </h1>
          <p className="mt-6 text-base custom:text-lg text-[#f5efe2]/75 leading-relaxed">
            BloomBox unites algorithmic botanical design with traditional artisan floristry. We source exclusively from organic highland growers, honoring seasonal vitality while engineering precision dispatch systems for our local community.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-8 backdrop-blur-md">
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#f5efe2] mb-6">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="font-antonio text-2xl text-white mb-3">100% Sustainable</h3>
            <p className="text-xs text-[#f5efe2]/70 leading-relaxed">
              Every stem in our catalog is cultivated without synthetic pesticides or non-biodegradable floral foam. We return composted cuttings to fertilize next season&apos;s crop.
            </p>
          </div>

          <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-8 backdrop-blur-md">
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#f5efe2] mb-6">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="font-antonio text-2xl text-white mb-3">Event Planner Network</h3>
            <p className="text-xs text-[#f5efe2]/70 leading-relaxed">
              We empower event designers and banquet planners with wholesale reservation priority, volume discounts (15%), and automated invoicing calculated in real time.
            </p>
          </div>

          <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-8 backdrop-blur-md">
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#f5efe2] mb-6">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="font-antonio text-2xl text-white mb-3">Precision Logistics</h3>
            <p className="text-xs text-[#f5efe2]/70 leading-relaxed">
              Utilizing alternating token parity dispatch, our dedicated couriers (Rider 1 &amp; Rider 2) deliver sensitive blooms in climate-balanced transit boxes.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="rounded-3xl border border-[#f5efe2]/15 bg-gradient-to-br from-[#0e121a] to-black p-8 md:p-14 mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <span className="text-xs uppercase tracking-widest text-[#f5efe2]/50 font-semibold">
                Our Genesis
              </span>
              <h2 className="font-antonio text-3xl custom:text-5xl text-white">
                From Console Billing to Immersive 3D Experience
              </h2>
              <p className="text-xs custom:text-sm text-[#f5efe2]/75 leading-relaxed">
                BloomBox originated as a robust, menu-driven Java console application engineered with rigorous object-oriented discipline: recursive billing totals, checked stock exceptions, and atomic order confirmation.
              </p>
              <p className="text-xs custom:text-sm text-[#f5efe2]/75 leading-relaxed">
                Today, that same computational foundation powers our interactive web platform, blending real-time inventory management with an atmospheric 3D nocturnal flower valley rendered entirely in Three.js.
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="p-6 rounded-2xl bg-black/60 border border-white/10">
                <span className="text-xs font-mono text-[#f5efe2]/60">6 Signature Flora</span>
                <p className="text-sm font-medium text-white mt-1">Roses, Jasmine, Marigolds, Orchids, Lilies &amp; Table Decor</p>
              </div>
              <div className="p-6 rounded-2xl bg-black/60 border border-white/10">
                <span className="text-xs font-mono text-[#f5efe2]/60">Transparent Billing</span>
                <p className="text-sm font-medium text-white mt-1">5% Statutory GST with instant line item calculation</p>
              </div>
              <div className="p-6 rounded-2xl bg-black/60 border border-white/10">
                <span className="text-xs font-mono text-[#f5efe2]/60">Zero Waste Policy</span>
                <p className="text-sm font-medium text-white mt-1">Compostable wraps &amp; zero single-use plastics</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="text-center py-12">
          <h2 className="font-antonio text-4xl text-white mb-4">Ready to Experience BloomBox?</h2>
          <p className="text-xs custom:text-sm text-[#f5efe2]/70 max-w-lg mx-auto mb-8">
            Wander our digital greenhouse catalog or create your next custom wholesale order today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/shop"
              className="h-12 inline-flex items-center justify-center gap-2 rounded-full bg-[#f5efe2] px-8 text-xs font-semibold uppercase tracking-wider text-[#151510] hover:bg-white transition-all shadow-lg"
            >
              <Flower2 className="w-4 h-4" /> Explore Flower Catalog
            </Link>
            <Link
              href="/bloombox"
              className="h-12 inline-flex items-center justify-center gap-2 rounded-full border border-[#f5efe2]/30 px-8 text-xs font-semibold uppercase tracking-wider text-[#f5efe2] hover:bg-white/10 transition-all"
            >
              Order &amp; Billing Portal <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
