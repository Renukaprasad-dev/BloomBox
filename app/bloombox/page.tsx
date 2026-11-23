'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  FlowerItem,
  CartItem,
  CompletedOrder,
  getStoredInventory,
  saveStoredInventory,
  getStoredCart,
  saveStoredCart,
  getStoredOrders,
  saveStoredOrders,
} from '@/lib/store';
import {
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  FileText,
  BarChart3,
  AlertCircle,
  Truck,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function BloomBoxBillingPage() {
  const [inventory, setInventory] = useState<FlowerItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);

  const [customerName, setCustomerName] = useState('');
  const [customerType, setCustomerType] = useState<'Regular' | 'Event Planner'>('Regular');
  const [selectedItemId, setSelectedItemId] = useState<number>(101);
  const [inputQuantity, setInputQuantity] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBill, setSuccessBill] = useState<CompletedOrder | null>(null);
  const [activeTab, setActiveTab] = useState<'billing' | 'inventory' | 'reports'>('billing');

  // Load state from localStorage on mount
  useEffect(() => {
    const inv = getStoredInventory();
    const c = getStoredCart();
    const ords = getStoredOrders();
    setInventory(inv);
    setCart(c);
    setCompletedOrders(ords);
    if (inv.length > 0) {
      setSelectedItemId(inv[0].id);
    }
  }, []);

  // Compute quantity currently reserved in the cart for any item
  const getReservedQty = (itemId: number) => {
    return cart
      .filter((line) => line.item.id === itemId)
      .reduce((sum, line) => sum + line.quantity, 0);
  };

  // Add Item to Order Cart
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const item = inventory.find((i) => i.id === selectedItemId);
    if (!item) {
      setErrorMessage('Flower item not found.');
      return;
    }

    const available = item.stock - getReservedQty(item.id);
    if (inputQuantity <= 0) {
      setErrorMessage('Quantity must be greater than zero.');
      return;
    }

    if (inputQuantity > available) {
      setErrorMessage(
        `Insufficient stock for "${item.name}". Requested: ${inputQuantity}, Available in greenhouse: ${available}`
      );
      return;
    }

    // Push new line to cart stack
    const updatedCart = [...cart, { item, quantity: inputQuantity }];
    setCart(updatedCart);
    saveStoredCart(updatedCart);
    setInputQuantity(1);
  };

  // Undo Last Action (mirrors ItemStack.pop())
  const handleUndoLast = () => {
    if (cart.length === 0) return;
    const updatedCart = cart.slice(0, cart.length - 1);
    setCart(updatedCart);
    saveStoredCart(updatedCart);
    setErrorMessage(null);
  };

  // Clear Entire Basket
  const handleClearBasket = () => {
    setCart([]);
    saveStoredCart([]);
    setErrorMessage(null);
  };

  // Precise Java Business Calculations
  const subtotal = cart.reduce(
    (sum, line) => sum + line.item.price * line.quantity,
    0
  );
  const discountRate = customerType === 'Event Planner' ? 0.15 : 0.0;
  const discount = subtotal * discountRate;
  const taxableAmount = subtotal - discount;
  const gst = taxableAmount * 0.05;
  const finalTotal = taxableAmount + gst;

  // Confirm Order: Deducts stock, assigns order token & rider, creates bill
  const handleConfirmOrder = () => {
    setErrorMessage(null);
    if (!customerName.trim()) {
      setErrorMessage('Please enter the customer name before confirming.');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Cart is empty. Please add items to confirm order.');
      return;
    }

    // Double check stock availability
    for (const line of cart) {
      const invItem = inventory.find((i) => i.id === line.item.id);
      if (!invItem || invItem.stock < line.quantity) {
        setErrorMessage(`Cannot confirm: Insufficient stock for ${line.item.name}.`);
        return;
      }
    }

    // Atomically decrement stock
    const nextInventory = inventory.map((invItem) => {
      const totalQtyInOrder = cart
        .filter((l) => l.item.id === invItem.id)
        .reduce((sum, l) => sum + l.quantity, 0);
      return {
        ...invItem,
        stock: invItem.stock - totalQtyInOrder,
      };
    });

    setInventory(nextInventory);
    saveStoredInventory(nextInventory);

    // Assign Token and Rider (Odd tokens -> Rider 1, Even tokens -> Rider 2)
    const nextToken = completedOrders.length + 1;
    const rider = (nextToken & 1) === 1 ? 'Rider 1' : 'Rider 2';

    const confirmedOrder: CompletedOrder = {
      orderId: `FLW${nextToken}`,
      token: nextToken,
      customerName: customerName.trim(),
      customerType,
      lines: [...cart],
      subtotal,
      discount,
      gst,
      finalTotal,
      rider,
      timestamp: new Date().toLocaleString(),
    };

    const nextOrders = [confirmedOrder, ...completedOrders];
    setCompletedOrders(nextOrders);
    saveStoredOrders(nextOrders);

    // Reset current form
    setSuccessBill(confirmedOrder);
    setCart([]);
    saveStoredCart([]);
    setCustomerName('');
  };

  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.finalTotal, 0);

  return (
    <div className="min-h-screen bg-[#05070a] text-[#f5efe2] font-manrope selection:bg-[#f5efe2] selection:text-[#151510] flex flex-col justify-between">
      <Header />

      <main className="max-w-7xl mx-auto w-full px-6 pt-32 pb-20 custom:px-12">
        {/* Top Header & Navigation Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5efe2]/50 block mb-2">
              Java Engine Business Logic
            </span>
            <h1 className="font-antonio text-5xl custom:text-7xl text-white tracking-wide">
              Billing &amp; Order Engine
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-full border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'billing'
                  ? 'bg-[#f5efe2] text-[#151510] shadow-md'
                  : 'text-[#f5efe2]/70 hover:text-white'
              }`}
            >
              Order Billing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'inventory'
                  ? 'bg-[#f5efe2] text-[#151510] shadow-md'
                  : 'text-[#f5efe2]/70 hover:text-white'
              }`}
            >
              Live Stock ({inventory.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'reports'
                  ? 'bg-[#f5efe2] text-[#151510] shadow-md'
                  : 'text-[#f5efe2]/70 hover:text-white'
              }`}
            >
              Sales Ledger ({completedOrders.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Billing Engine */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Input & Selection (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Customer Setup Card */}
              <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-7 backdrop-blur-md shadow-xl">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#f5efe2]" /> 1. Customer Identification
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Maya Chen"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-[#f5efe2] focus:outline-none focus:border-[#f5efe2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                      Customer Category (Tier)
                    </label>
                    <select
                      value={customerType}
                      onChange={(e) => setCustomerType(e.target.value as 'Regular' | 'Event Planner')}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-[#f5efe2] focus:outline-none focus:border-[#f5efe2]"
                    >
                      <option value="Regular">Regular Customer (Standard 0% Discount)</option>
                      <option value="Event Planner">Event Planner (Wholesale 15% Discount)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Item Entry Card */}
              <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-7 backdrop-blur-md shadow-xl">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-5 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#f5efe2]" /> 2. Add Flower Items to Order
                </h2>

                <form onSubmit={handleAddItem}>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-5">
                    <div className="sm:col-span-8">
                      <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                        Select Floral Item
                      </label>
                      <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(Number(e.target.value))}
                        className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-[#f5efe2] focus:outline-none focus:border-[#f5efe2]"
                      >
                        {inventory.map((item) => {
                          const avail = item.stock - getReservedQty(item.id);
                          return (
                            <option key={item.id} value={item.id}>
                              #{item.id} {item.name} — ₹{item.price} ({avail} available)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={inputQuantity}
                        onChange={(e) => setInputQuantity(Number(e.target.value))}
                        className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-[#f5efe2] focus:outline-none focus:border-[#f5efe2]"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="mb-5 rounded-xl bg-red-950/50 border border-red-500/40 p-4 text-xs text-red-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-[#f5efe2] text-[#151510] py-3 px-6 text-xs font-semibold uppercase tracking-wider hover:bg-white active:scale-95 transition-all"
                    >
                      + Add Item to Order Line
                    </button>
                    <button
                      type="button"
                      onClick={handleUndoLast}
                      disabled={cart.length === 0}
                      className="rounded-xl border border-[#f5efe2]/30 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#f5efe2] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Undo Last
                    </button>
                    <button
                      type="button"
                      onClick={handleClearBasket}
                      disabled={cart.length === 0}
                      className="rounded-xl border border-red-500/30 px-4 py-3 text-xs font-medium uppercase tracking-wider text-red-300 hover:bg-red-950/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>

              {/* Informative Note */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] text-xs text-[#f5efe2]/60 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <p leading-relaxed>
                  <strong>Stock Guarantee:</strong> Stock is not deducted when items are added to the cart. It is only permanently reduced when you click <strong>Confirm Order &amp; Generate Bill</strong>.
                </p>
              </div>
            </div>

            {/* Right: Live Invoice Calculation (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border border-[#f5efe2]/20 bg-[#0a0d14]/90 p-7 backdrop-blur-md shadow-2xl flex flex-col justify-between min-h-[500px]">
                <div>
                  <div className="flex items-center justify-between border-b border-[#f5efe2]/10 pb-4 mb-4">
                    <h3 className="font-antonio text-2xl text-white">Live Billing Statement</h3>
                    <span className="text-xs text-[#f5efe2]/60">
                      {customerName ? `${customerName} (${customerType})` : 'Unassigned'}
                    </span>
                  </div>

                  {/* Cart Line Items */}
                  {cart.length === 0 ? (
                    <div className="py-12 text-center text-[#f5efe2]/40 text-xs italic">
                      <p>No active lines in order.</p>
                      <p className="mt-1">Add items from the left form or from the <Link href="/shop" className="underline text-[#f5efe2]">Shop</Link>.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 mb-6">
                      {cart.map((line, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-medium text-white">{line.item.name}</span>
                            <span className="text-[#f5efe2]/50 ml-2">× {line.quantity}</span>
                          </div>
                          <span className="font-mono text-white">
                            ₹{(line.item.price * line.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mathematical Financial Breakdown */}
                <div className="border-t border-[#f5efe2]/10 pt-5 space-y-2.5 text-xs">
                  <div className="flex justify-between text-[#f5efe2]/75">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-[#f5efe2]/75">
                    <span>
                      Discount ({customerType === 'Event Planner' ? '15% Wholesale' : '0% Regular'})
                    </span>
                    <span className={`font-mono font-semibold ${discount > 0 ? 'text-emerald-400' : ''}`}>
                      - ₹{discount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[#f5efe2]/60">
                    <span>Taxable Amount</span>
                    <span className="font-mono">₹{taxableAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-[#f5efe2]/75">
                    <span>GST (5% Statutory Rate)</span>
                    <span className="font-mono font-semibold">₹{gst.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-[#f5efe2]/15 pt-3 flex justify-between items-baseline">
                    <span className="text-base font-semibold text-white">Net Total Payable</span>
                    <span className="font-mono text-2xl font-bold text-[#f5efe2]">
                      ₹{finalTotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    disabled={cart.length === 0}
                    className="w-full mt-4 h-12 rounded-full bg-emerald-500 text-black text-xs font-semibold uppercase tracking-wider hover:bg-emerald-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.25)]"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirm Order &amp; Generate Bill
                  </button>
                </div>
              </div>

              {/* Order Confirmation Voucher Card */}
              {successBill && (
                <div className="rounded-3xl border border-emerald-500/40 bg-emerald-950/20 p-6 backdrop-blur-md text-xs space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                    <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Order #{successBill.orderId} Confirmed
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px]">
                      Token {successBill.token}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[#f5efe2]/80">
                    <p>Customer: <strong className="text-white">{successBill.customerName}</strong></p>
                    <p>Category: <strong className="text-white">{successBill.customerType}</strong></p>
                    <p>Dispatch: <strong className="text-emerald-300">{successBill.rider}</strong></p>
                    <p>Paid Amount: <strong className="font-mono text-white">₹{successBill.finalTotal.toFixed(2)}</strong></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Live Inventory */}
        {activeTab === 'inventory' && (
          <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="p-6 border-b border-[#f5efe2]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-antonio text-3xl text-white">Greenhouse Stock Inventory</h2>
                <p className="text-xs text-[#f5efe2]/60 mt-1">
                  Accurate count reflecting unreserved stock.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/50 text-[#f5efe2]/60 uppercase tracking-wider border-b border-white/5">
                  <tr>
                    <th className="p-5">ID</th>
                    <th className="p-5">Floral Name</th>
                    <th className="p-5">Category</th>
                    <th className="p-5">Unit Price</th>
                    <th className="p-5">Available Stock</th>
                    <th className="p-5">Threshold Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-5 font-mono font-bold text-white">#{item.id}</td>
                      <td className="p-5 font-medium text-white">{item.name}</td>
                      <td className="p-5 text-[#f5efe2]/70">{item.category}</td>
                      <td className="p-5 font-mono">₹{item.price.toFixed(2)}</td>
                      <td className="p-5 font-mono font-semibold">{item.stock} units</td>
                      <td className="p-5">
                        {item.stock <= 8 ? (
                          <span className="px-2.5 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-[10px] font-semibold">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Sales Report Ledger */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-6 backdrop-blur-md shadow-xl">
                <span className="text-xs uppercase tracking-wider text-[#f5efe2]/60">Total Confirmed Orders</span>
                <p className="font-antonio text-5xl text-white mt-2">{completedOrders.length}</p>
              </div>

              <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-6 backdrop-blur-md shadow-xl">
                <span className="text-xs uppercase tracking-wider text-[#f5efe2]/60">Total Ledger Revenue</span>
                <p className="font-antonio text-5xl text-emerald-400 mt-2 font-mono">₹{totalRevenue.toFixed(2)}</p>
              </div>

              <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-6 backdrop-blur-md shadow-xl">
                <span className="text-xs uppercase tracking-wider text-[#f5efe2]/60">Dispatch Couriers</span>
                <div className="mt-3 flex items-center gap-3 text-xs text-[#f5efe2]/80">
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Rider 1 (Odd)</span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Rider 2 (Even)</span>
                </div>
              </div>
            </div>

            {/* Orders Log */}
            <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-7 backdrop-blur-md shadow-xl">
              <h3 className="font-antonio text-2xl text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#f5efe2]" /> Order Confirmation Ledger
              </h3>

              {completedOrders.length === 0 ? (
                <div className="py-12 text-center text-[#f5efe2]/40 text-xs italic">
                  No confirmed orders recorded yet. Confirm an order in the Billing tab to generate audit records.
                </div>
              ) : (
                <div className="space-y-4">
                  {completedOrders.map((order) => (
                    <div
                      key={order.orderId}
                      className="p-5 rounded-2xl border border-white/10 bg-black/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">#{order.orderId}</span>
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white">
                            Token {order.token}
                          </span>
                          <span className="text-[#f5efe2]/40">|</span>
                          <span className="font-medium text-white">{order.customerName}</span>
                          <span className="text-[#f5efe2]/60">({order.customerType})</span>
                        </div>
                        <p className="text-[#f5efe2]/60">
                          {order.lines.map((l) => `${l.item.name} (×${l.quantity})`).join(', ')}
                        </p>
                        <p className="text-[10px] text-[#f5efe2]/40">{order.timestamp}</p>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="font-mono text-lg font-bold text-emerald-400">
                          ₹{order.finalTotal.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-[#f5efe2]/60 uppercase tracking-wider flex items-center gap-1 sm:justify-end mt-0.5">
                          <Truck className="w-3 h-3 text-emerald-400" /> Assigned to {order.rider}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
