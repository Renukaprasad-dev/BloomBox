'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Sparkles, Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Event Booking Inquiry',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-[#f5efe2] font-manrope selection:bg-[#f5efe2] selection:text-[#151510] flex flex-col justify-between">
      <Header />

      <main className="max-w-7xl mx-auto w-full px-6 pt-32 pb-24 custom:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Info */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5efe2]/50 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#f5efe2]" /> Inquiries &amp; Commissions
              </div>
              <h1 className="font-antonio text-5xl custom:text-6xl text-white tracking-wide">
                Let&apos;s Connect.
              </h1>
              <p className="mt-4 text-sm text-[#f5efe2]/75 leading-relaxed">
                Whether you require bespoke arrangements for a private gala, recurring restaurant table decor, or event planner wholesale access, our studio florists are available.
              </p>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#f5efe2]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#f5efe2]/50">Email Studio</h4>
                  <a href="mailto:orders@bloombox.studio" className="text-sm font-medium text-white hover:underline mt-0.5 block">
                    orders@bloombox.studio
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#f5efe2]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#f5efe2]/50">Telephone Dispatch</h4>
                  <p className="text-sm font-medium text-white mt-0.5">+91 (800) 425-6629</p>
                  <p className="text-[11px] text-[#f5efe2]/50">Mon – Sat, 7:00 AM – 8:00 PM IST</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#f5efe2]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#f5efe2]/50">Greenhouse &amp; Studio</h4>
                  <p className="text-sm font-medium text-white mt-0.5">BloomBox Botanical Pavilion, Valley Road</p>
                  <p className="text-[11px] text-[#f5efe2]/50">Courier Dispatches: Rider 1 &amp; Rider 2 Daily</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/90 p-8 md:p-10 backdrop-blur-md shadow-2xl">
              {submitted ? (
                <div className="py-16 text-center space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-antonio text-3xl text-white">Inquiry Transmitted</h3>
                  <p className="text-xs text-[#f5efe2]/70 max-w-md mx-auto leading-relaxed">
                    Thank you, {formData.name || 'friend'}. Our head florist will review your specifications and contact you shortly with catalog availability.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-white/10 px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/20 transition-all"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="font-antonio text-2xl text-white mb-2">Send an Inquiry</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alok Roy"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-[#f5efe2] focus:outline-none focus:border-[#f5efe2]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. alok@design.studio"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-[#f5efe2] focus:outline-none focus:border-[#f5efe2]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                      Inquiry Category
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-[#f5efe2] focus:outline-none focus:border-[#f5efe2]"
                    >
                      <option value="Event Booking Inquiry">Event &amp; Wedding Floral Booking</option>
                      <option value="Wholesale Event Planner Registration">Event Planner Wholesale Registration (15% Discount)</option>
                      <option value="Custom Table Decoration Commission">Custom Table Decoration / Installation Commission</option>
                      <option value="General Question">General Greenhouse Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                      Details / Requirements *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Tell us about your event date, preferred flowers (Marigolds, Jasmine, Roses, Orchids, Lilies), or volume requirements..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-[#f5efe2] focus:outline-none focus:border-[#f5efe2]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 rounded-full bg-[#f5efe2] text-[#151510] text-xs font-semibold uppercase tracking-wider hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Send className="w-4 h-4" /> Transmit Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
