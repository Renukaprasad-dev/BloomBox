'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X, Sparkles } from 'lucide-react';
import { getStoredCart } from '@/lib/store';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const updateCartBadge = () => {
    const cart = getStoredCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  };

  useEffect(() => {
    updateCartBadge();
    window.addEventListener('bloombox_cart_updated', updateCartBadge);
    window.addEventListener('storage', updateCartBadge);
    return () => {
      window.removeEventListener('bloombox_cart_updated', updateCartBadge);
      window.removeEventListener('storage', updateCartBadge);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: 'About', href: '/about' },
    { label: 'Billing', href: '/bloombox' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-5 custom:px-12 custom:py-7 bg-black/40 backdrop-blur-md border-b border-[#f5efe2]/10 transition-all duration-300">
        {/* Brand wordmark */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-[#f5efe2] transition-colors hover:text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#f5efe2]/30 bg-white/5 transition-transform duration-300 group-hover:scale-110">
            <Sparkles className="h-4 w-4 text-[#f5efe2]" />
          </span>
          <span
            className="text-[22px] tracking-[-0.015em] font-semibold text-[#f5efe2] custom:text-[26px]"
            style={{ fontFamily: 'var(--font-manrope), sans-serif' }}
          >
            BloomBox
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-9 custom:flex" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[13.5px] font-medium tracking-[0.08em] uppercase transition-all duration-300 ${
                  isActive
                    ? 'text-white border-b-2 border-[#f5efe2] pb-1'
                    : 'text-[#f5efe2]/70 hover:text-[#f5efe2]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Cart & CTA */}
        <div className="flex items-center gap-4">
          {/* Cart Icon */}
          <Link
            href="/shop"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#f5efe2]/20 bg-white/5 text-[#f5efe2] transition-all hover:bg-white/10 hover:border-[#f5efe2]/40"
            aria-label="View shopping cart"
          >
            <ShoppingBag className="h-4 w-4 stroke-[1.8]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black shadow-md animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Quick Billing CTA */}
          <Link
            href="/bloombox"
            className="hidden sm:inline-flex h-[42px] items-center justify-center rounded-full bg-[#f5efe2] px-6 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#151510] transition-all duration-300 hover:bg-white hover:scale-[1.02] active:scale-[0.98]"
          >
            Order Portal
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="custom:hidden flex h-10 w-10 items-center justify-center rounded-full border border-[#f5efe2]/20 bg-white/5 text-[#f5efe2] hover:bg-white/10"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 flex flex-col justify-between bg-black/95 backdrop-blur-xl px-8 pt-28 pb-12 custom:hidden animate-fade-in">
          <nav className="flex flex-col gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-2xl font-antonio tracking-wide uppercase transition-colors ${
                    isActive ? 'text-[#f5efe2]' : 'text-[#f5efe2]/50 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-[#f5efe2]/15 pt-6 space-y-4">
            <Link
              href="/bloombox"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-12 w-full items-center justify-center rounded-full bg-[#f5efe2] text-sm font-semibold uppercase tracking-wider text-[#151510]"
            >
              Order &amp; Billing Portal
            </Link>
            <p className="text-xs text-[#f5efe2]/40 text-center">
              BloomBox Regenerative Floral Design Studio
            </p>
          </div>
        </div>
      )}
    </>
  );
};
