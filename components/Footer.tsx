'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-20 border-t border-[#f5efe2]/10 bg-black/80 backdrop-blur-md px-6 py-12 custom:px-16 text-[#f5efe2]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        {/* Col 1: Brand */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 border border-[#f5efe2]/20">
              <Sparkles className="h-3.5 w-3.5 text-[#f5efe2]" />
            </span>
            <span className="text-2xl font-semibold tracking-tight text-[#f5efe2]">BloomBox</span>
          </div>
          <p className="text-sm text-[#f5efe2]/60 max-w-sm leading-relaxed">
            Cultivating living botanical artistry and regenerative floral experiences. Hand-crafted bouquets, night-blooming garlands, and architectural floral installations.
          </p>
        </div>

        {/* Col 2: Navigation */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[#f5efe2]/40">Navigation</h4>
          <ul className="space-y-2 text-sm text-[#f5efe2]/75">
            <li>
              <Link href="/" className="hover:text-white transition-colors">Home Experience</Link>
            </li>
            <li>
              <Link href="/shop" className="hover:text-white transition-colors">Flower Shop Catalog</Link>
            </li>
            <li>
              <Link href="/bloombox" className="hover:text-white transition-colors">Billing &amp; Invoicing</Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white transition-colors">Studio Philosophy</Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Contact & Direct */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[#f5efe2]/40">Studio Dispatch</h4>
          <p className="text-xs text-[#f5efe2]/60">Dispatching twice daily with certified floral couriers (Rider 1 &amp; Rider 2).</p>
          <a
            href="mailto:orders@bloombox.studio"
            className="inline-flex items-center gap-1 text-sm text-[#f5efe2] hover:underline"
          >
            orders@bloombox.studio <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[#f5efe2]/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#f5efe2]/40 gap-4">
        <p>&copy; {new Date().getFullYear()} BloomBox Studio. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/shop" className="hover:text-white">Shop</Link>
          <Link href="/bloombox" className="hover:text-white">Billing Engine</Link>
          <Link href="/contact" className="hover:text-white">Inquiries</Link>
        </div>
      </div>
    </footer>
  );
};
