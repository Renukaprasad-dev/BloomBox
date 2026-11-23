'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  FlowerItem,
  CartItem,
  getStoredInventory,
  getStoredCart,
  saveStoredCart,
} from '@/lib/store';
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Plus,
  Eye,
  Check,
  Search,
  Filter,
  X,
  ShieldCheck,
  Flower2,
  Calendar,
  Compass,
} from 'lucide-react';

export default function CollectionPage() {
  const [items, setItems] = useState<FlowerItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalItem, setActiveModalItem] = useState<FlowerItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setItems(getStoredInventory());
    setCart(getStoredCart());
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 2800);
  };

  const getAvailableStock = (item: FlowerItem) => {
    const inCart = cart.find((c) => c.item.id === item.id)?.quantity || 0;
    return item.stock - inCart;
  };

  const handleAddToCart = (product: FlowerItem) => {
    const existingIndex = cart.findIndex((c) => c.item.id === product.id);
    const currentInCart = existingIndex >= 0 ? cart[existingIndex].quantity : 0;

    if (currentInCart >= product.stock) {
      showNotification(`Maximum stock reached for ${product.name} (${product.stock} units).`);
      return;
    }

    let updatedCart: CartItem[];
    if (existingIndex >= 0) {
      updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart = [...cart, { item: product, quantity: 1 }];
    }

    setCart(updatedCart);
    saveStoredCart(updatedCart);
    showNotification(`Added ${product.collectionName} (${product.name}) to cart.`);
  };

  const categories = ['All', 'Bouquet', 'Garland', 'Loose', 'Stem', 'Decor'];

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.collectionName.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#05070a] text-[#f5efe2] font-manrope selection:bg-[#f5efe2] selection:text-[#151510] flex flex-col justify-between">
      <Header />

      <main className="max-w-7xl mx-auto w-full px-6 pt-32 pb-24 custom:px-12">
        {/* Cinematic Collection Hero */}
        <div className="relative mb-16 rounded-3xl border border-[#f5efe2]/15 bg-gradient-to-r from-rose-950/25 via-black/80 to-purple-950/25 p-8 md:p-16 overflow-hidden backdrop-blur-md">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#f5efe2]/80 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#f5efe2]" /> Curated Botanical Anthology
            </div>
            <h1 className="font-antonio text-5xl custom:text-7xl text-white tracking-wide leading-tight mb-4">
              Signature Collections
            </h1>
            <p className="text-sm custom:text-base text-[#f5efe2]/75 leading-relaxed mb-8">
              Explore our six heritage floral collections. Each arrangement is composed from hand-selected specimen stems harvested at peak morning vitality from our organic highland nurseries.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <Link
                href="/shop"
                className="h-11 inline-flex items-center justify-center gap-2 rounded-full bg-[#f5efe2] px-7 font-semibold uppercase tracking-wider text-[#151510] hover:bg-white transition-all shadow-lg"
              >
                <span>Browse Full Store Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/bloombox"
                className="h-11 inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-all"
              >
                Direct Invoicing
              </Link>
            </div>
          </div>

          {/* Ambient Glow Gradient */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,rgba(255,75,114,0.4),transparent_70%)]" />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/10 pb-6">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#f5efe2]/40 mr-2 flex items-center gap-1.5">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#f5efe2] text-[#151510] shadow-md font-semibold'
                    : 'bg-white/5 border border-white/10 text-[#f5efe2]/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Field */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#f5efe2]/40" />
            <input
              type="text"
              placeholder="Search by flower or collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-black/60 border border-[#f5efe2]/20 text-xs text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-8 right-8 z-50 rounded-2xl border border-[#f5efe2]/30 bg-black/90 backdrop-blur-md px-5 py-3 text-xs font-medium text-white shadow-2xl flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Curated Collection Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => {
            const available = getAvailableStock(item);
            const isOutOfStock = available <= 0;

            return (
              <div
                key={item.id}
                className="group rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/85 overflow-hidden backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-[#f5efe2]/40 hover:shadow-[0_20px_50px_rgba(245,239,226,0.06)] flex flex-col justify-between"
              >
                <div>
                  {/* Real Flower Photograph with Zoom Animation */}
                  <div className="relative h-64 w-full overflow-hidden bg-black/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-transparent to-black/30" />

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs">
                      <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white">
                        {item.category}
                      </span>
                      {item.stock <= 8 ? (
                        <span className="px-3 py-1 rounded-full bg-red-950/80 backdrop-blur-md border border-red-500/40 text-[10px] text-red-300 font-semibold">
                          LOW ({available} left)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-[10px] text-emerald-300 font-semibold">
                          IN STOCK ({available})
                        </span>
                      )}
                    </div>

                    {/* Bottom Title on Image */}
                    <div className="absolute bottom-4 left-5 right-5">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#f5efe2]/70 block">
                        #{item.id} &bull; {item.name}
                      </span>
                      <h3 className="font-antonio text-3xl text-white tracking-wide">
                        {item.collectionName}
                      </h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-[#f5efe2]/75 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-[#f5efe2]/60 pt-1">
                      <span>{item.stemCount || 'Hand-tied arrangement'}</span>
                      <span>&bull;</span>
                      <span>{item.botanicalOrigin || 'Organic nursery'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-0 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#f5efe2]/50 block">Starting at</span>
                      <span className="font-mono text-2xl font-bold text-white">₹{item.price}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveModalItem(item)}
                        className="h-10 px-4 rounded-full border border-white/20 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                        title="View Collection Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        disabled={isOutOfStock}
                        className="h-10 px-4 rounded-full bg-[#f5efe2] text-[#151510] text-xs font-semibold uppercase tracking-wider hover:bg-white active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  <Link
                    href={`/shop`}
                    className="w-full py-2.5 rounded-xl border border-white/10 hover:border-white/30 text-[11px] font-medium uppercase tracking-wider text-[#f5efe2]/70 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Explore in Shop Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* View Collection Details Modal */}
        {activeModalItem && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in"
            onClick={() => setActiveModalItem(null)}
          >
            <div
              className="relative max-w-xl w-full rounded-3xl border border-white/20 bg-[#0d1017] p-8 text-[#f5efe2] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Image */}
              <div className="relative h-56 w-full rounded-2xl overflow-hidden mb-6 border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeModalItem.imageUrl}
                  alt={activeModalItem.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <span className="text-[10px] font-mono text-[#f5efe2]/70 uppercase tracking-widest block">
                    Collection #{activeModalItem.id}
                  </span>
                  <h3 className="font-antonio text-3xl text-white">
                    {activeModalItem.collectionName}
                  </h3>
                </div>
              </div>

              {/* Info Details */}
              <div className="space-y-4 text-xs leading-relaxed text-[#f5efe2]/80">
                <p className="text-sm text-white font-normal">
                  {activeModalItem.description}
                </p>

                <div className="grid grid-cols-2 gap-4 border-t border-b border-white/10 py-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#f5efe2]/50 block">Botanical Origin</span>
                    <strong className="text-white text-xs">{activeModalItem.botanicalOrigin}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#f5efe2]/50 block">Specification</span>
                    <strong className="text-white text-xs">{activeModalItem.stemCount}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#f5efe2]/50 block">Unit Price</span>
                    <strong className="text-white font-mono text-sm">₹{activeModalItem.price.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#f5efe2]/50 block">Live Stock</span>
                    <strong className="text-emerald-400 font-mono text-sm">
                      {getAvailableStock(activeModalItem)} units available
                    </strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Dispatched in moisture-sealed transport wraps with courier assignment (Rider 1 or Rider 2) upon invoice confirmation.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleAddToCart(activeModalItem);
                    setActiveModalItem(null);
                  }}
                  disabled={getAvailableStock(activeModalItem) <= 0}
                  className="flex-1 h-12 rounded-full bg-[#f5efe2] text-[#151510] text-xs font-semibold uppercase tracking-wider hover:bg-white active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add To Order Basket</span>
                </button>
                <Link
                  href="/shop"
                  onClick={() => setActiveModalItem(null)}
                  className="h-12 px-6 rounded-full border border-white/20 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                  View In Shop
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
