'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  FlowerItem,
  CartItem,
  getStoredCart,
  saveStoredCart,
  getStoredInventory,
} from '@/lib/store';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, Check, AlertCircle } from 'lucide-react';

export default function ShopPage() {
  const [items, setItems] = useState<FlowerItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
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
      showNotification(`Cannot add more. Max stock for ${product.name} is ${product.stock}.`);
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
    showNotification(`Added ${product.name} to cart.`);
  };

  const handleUpdateQty = (productId: number, delta: number) => {
    const updatedCart = cart
      .map((c) => {
        if (c.item.id === productId) {
          const newQty = c.quantity + delta;
          if (newQty > c.item.stock) {
            showNotification(`Cannot exceed available stock of ${c.item.stock}.`);
            return c;
          }
          return newQty > 0 ? { ...c, quantity: newQty } : null;
        }
        return c;
      })
      .filter(Boolean) as CartItem[];

    setCart(updatedCart);
    saveStoredCart(updatedCart);
  };

  const handleRemoveFromCart = (productId: number) => {
    const updatedCart = cart.filter((c) => c.item.id !== productId);
    setCart(updatedCart);
    saveStoredCart(updatedCart);
    showNotification('Item removed from cart.');
  };

  const cartSubtotal = cart.reduce(
    (sum, c) => sum + c.item.price * c.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-[#05070a] text-[#f5efe2] font-manrope selection:bg-[#f5efe2] selection:text-[#151510] flex flex-col justify-between">
      <Header />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-6 pt-32 pb-20 custom:px-12">
        {/* Page Title & Subtitle */}
        <div className="mb-12">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5efe2]/50 block mb-2">
            Seasonal Botanical Catalog
          </span>
          <h1 className="font-antonio text-5xl custom:text-7xl text-white tracking-wide">
            Flower Shop
          </h1>
          <p className="mt-3 text-sm custom:text-base text-[#f5efe2]/70 max-w-xl">
            Choose from our 6 certified nocturnal arrangements. Quantities directly reflect active greenhouse stock.
          </p>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-8 right-8 z-50 rounded-2xl border border-[#f5efe2]/30 bg-black/90 backdrop-blur-md px-5 py-3 text-xs font-medium text-white shadow-2xl flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* 2-Column Layout: Catalog Grid + Cart Summary Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Products Grid (8 Cols) */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {items.map((product) => {
                const available = getAvailableStock(product);
                const isOutOfStock = available <= 0;

                return (
                  <div
                    key={product.id}
                    className="group rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-6 backdrop-blur-md transition-all duration-300 hover:border-[#f5efe2]/40 flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Header */}
                      <div className="flex items-center justify-between text-xs text-[#f5efe2]/60 mb-4">
                        <span className="font-mono">#{product.id}</span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-[#f5efe2]/80">
                            {product.category}
                          </span>
                          {product.stock <= 8 ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-950/60 border border-red-500/40 text-[10px] text-red-300">
                              LOW ({available})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[10px] text-emerald-300">
                              OK ({available})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Visual Header */}
                      <div
                        className={`h-40 w-full rounded-2xl bg-gradient-to-br ${product.imageColor} border border-white/10 flex items-center justify-center p-5 mb-5 relative overflow-hidden`}
                      >
                        <div
                          className="absolute inset-0 opacity-25 blur-lg"
                          style={{ backgroundColor: product.accentColor }}
                        />
                        <h3 className="font-antonio text-2xl tracking-wide text-white text-center relative z-10">
                          {product.name}
                        </h3>
                      </div>

                      <p className="text-xs text-[#f5efe2]/70 leading-relaxed mb-6">
                        {product.description}
                      </p>
                    </div>

                    {/* Price & Action */}
                    <div className="border-t border-[#f5efe2]/10 pt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#f5efe2]/50 block">Price</span>
                        <span className="font-mono text-xl font-bold text-white">₹{product.price}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#f5efe2] px-5 text-xs font-semibold uppercase tracking-wider text-[#151510] hover:bg-white active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Sidebar (4 Cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/90 p-6 backdrop-blur-md shadow-2xl flex flex-col justify-between min-h-[440px]">
              <div>
                <div className="flex items-center justify-between border-b border-[#f5efe2]/10 pb-4 mb-4">
                  <h3 className="font-antonio text-2xl tracking-wide text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#f5efe2]" /> Order Basket
                  </h3>
                  <span className="text-xs text-[#f5efe2]/60">
                    {cart.reduce((s, c) => s + c.quantity, 0)} items
                  </span>
                </div>

                {cart.length === 0 ? (
                  <div className="py-16 text-center text-[#f5efe2]/40 text-xs italic">
                    <p>Your basket is currently empty.</p>
                    <p className="mt-1">Add items from the catalog to prepare your order.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                    {cart.map((c) => (
                      <div
                        key={c.item.id}
                        className="rounded-xl border border-white/5 bg-black/40 p-3.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">{c.item.name}</h4>
                          <span className="font-mono text-[11px] text-[#f5efe2]/60">
                            ₹{c.item.price} each
                          </span>
                        </div>

                        {/* Qty Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(c.item.id, -1)}
                            className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 text-[#f5efe2]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-semibold text-white w-4 text-center">
                            {c.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(c.item.id, 1)}
                            className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 text-[#f5efe2]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(c.item.id)}
                            className="h-6 w-6 rounded-md text-red-400 hover:text-red-300 hover:bg-red-950/40 flex items-center justify-center ml-1"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Basket Footer & Checkout */}
              <div className="border-t border-[#f5efe2]/10 pt-5 mt-6 space-y-4">
                <div className="flex justify-between text-sm text-[#f5efe2]/70">
                  <span>Basket Subtotal</span>
                  <span className="font-mono font-bold text-white text-base">₹{cartSubtotal.toFixed(2)}</span>
                </div>

                <p className="text-[11px] text-[#f5efe2]/50 leading-relaxed">
                  Taxes (5% GST) and customer discounts (15% Event Planner) are calculated at the billing portal.
                </p>

                <Link
                  href="/bloombox"
                  className={`w-full h-12 rounded-full font-semibold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all ${
                    cart.length > 0
                      ? 'bg-[#f5efe2] text-[#151510] hover:bg-white active:scale-95 shadow-[0_0_25px_rgba(245,239,226,0.2)]'
                      : 'bg-white/10 text-[#f5efe2]/40 pointer-events-none'
                  }`}
                >
                  <span>Proceed to Billing Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
