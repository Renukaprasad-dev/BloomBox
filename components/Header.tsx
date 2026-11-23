'use client';

import React from 'react';

interface HeaderProps {
  onNavClick?: (target: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-[18px] py-6 custom:px-[44px] custom:py-8 pointer-events-auto transition-opacity duration-1000">
      {/* Brand wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavClick?.('home');
        }}
        className="group flex items-center gap-2 text-[22px] tracking-[-0.01em] text-[#f5efe2] transition-colors duration-300 hover:text-white custom:text-[26px]"
        style={{ fontFamily: 'var(--font-manrope), sans-serif', fontWeight: 500 }}
      >
        <span className="font-medium tracking-tight">Fernhollow</span>
      </a>

      {/* Navigation links & CTA */}
      <nav className="flex items-center gap-6 custom:gap-[44px]" aria-label="Main Navigation">
        <ul className="hidden items-center gap-[44px] custom:flex">
          <li>
            <a
              href="#work"
              onClick={(e) => {
                e.preventDefault();
                onNavClick?.('work');
              }}
              className="text-[14.5px] font-medium tracking-[0.08em] uppercase text-[#f5efe2]/75 transition-all duration-300 hover:text-[#f5efe2]"
            >
              Work
            </a>
          </li>
          <li>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                onNavClick?.('about');
              }}
              className="text-[14.5px] font-medium tracking-[0.08em] uppercase text-[#f5efe2]/75 transition-all duration-300 hover:text-[#f5efe2]"
            >
              About
            </a>
          </li>
          <li>
            <a
              href="#journal"
              onClick={(e) => {
                e.preventDefault();
                onNavClick?.('journal');
              }}
              className="text-[14.5px] font-medium tracking-[0.08em] uppercase text-[#f5efe2]/75 transition-all duration-300 hover:text-[#f5efe2]"
            >
              Journal
            </a>
          </li>
        </ul>

        {/* Pill CTA button */}
        <a
          href="#contact"
          onClick={(e) => {
            e.preventDefault();
            onNavClick?.('contact');
          }}
          className="inline-flex h-[40px] items-center justify-center rounded-full bg-[#f5efe2] px-6 text-[13px] font-medium uppercase tracking-[0.08em] text-[#151510] transition-all duration-300 hover:bg-white hover:scale-[1.02] active:scale-[0.98] custom:h-[46px] custom:px-7 custom:text-[14px]"
        >
          Let&apos;s Talk
        </a>
      </nav>
    </header>
  );
};
