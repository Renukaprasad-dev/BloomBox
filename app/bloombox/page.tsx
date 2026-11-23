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
import { downloadInvoicePdf } from '@/lib/pdfInvoice';
import {
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  FileText,
  BarChart3,
  AlertCircle,
  Truck,
  Printer,
  Download,
  Trash2,
  Plus,
  Minus,
  Search,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';

export default function BloomBoxBillingPage() {
  const [inventory, setInventory] = useState<FlowerItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);

  // Customer Form Data
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [customerType, setCustomerType] = useState<'Regular' | 'Event Planner'>('Regular');

  // Product Selection Form
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<number>(101);
  const [inputQuantity, setInputQuantity] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active View / Modals
  const [activeTab, setActiveTab] = useState<'billing' | 'history' | 'inventory'>('billing');
  const [activeInvoiceModal, setActiveInvoiceModal] = useState<CompletedOrder | null>(null);
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<CompletedOrder | null>(null);

  // Load state on mount
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

  const getReservedQty = (itemId: number) => {
    return cart
      .filter((line) => line.item.id === itemId)
      .reduce((sum, line) => sum + line.quantity, 0);
  };

  // Add Item to Order Line
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const item = inventory.find((i) => i.id === selectedItemId);
    if (!item) {
      setErrorMessage('Flower item not found in catalog.');
      return;
    }

    const available = item.stock - getReservedQty(item.id);
    if (inputQuantity <= 0) {
      setErrorMessage('Quantity must be at least 1.');
      return;
    }

    if (inputQuantity > available) {
      setErrorMessage(
        `Insufficient stock for "${item.name}". Requested: ${inputQuantity}, Available in nursery: ${available}`
      );
      return;
    }

    const updatedCart = [...cart, { item, quantity: inputQuantity }];
    setCart(updatedCart);
    saveStoredCart(updatedCart);
    setInputQuantity(1);
  };

  // Update quantity directly in cart table
  const handleUpdateLineQty = (itemId: number, delta: number) => {
    setErrorMessage(null);
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;

    const line = cart.find((l) => l.item.id === itemId);
    if (!line) return;

    const newQty = line.quantity + delta;
    if (newQty > item.stock) {
      setErrorMessage(`Cannot exceed greenhouse stock of ${item.stock} for ${item.name}.`);
      return;
    }

    let updated: CartItem[];
    if (newQty <= 0) {
      updated = cart.filter((l) => l.item.id !== itemId);
    } else {
      updated = cart.map((l) => (l.item.id === itemId ? { ...l, quantity: newQty } : l));
    }
    setCart(updated);
    saveStoredCart(updated);
  };

  const handleRemoveLine = (itemId: number) => {
    const updated = cart.filter((l) => l.item.id !== itemId);
    setCart(updated);
    saveStoredCart(updated);
  };

  // Undo Last Action (mirrors ItemStack.pop())
  const handleUndoLast = () => {
    if (cart.length === 0) return;
    const updated = cart.slice(0, cart.length - 1);
    setCart(updated);
    saveStoredCart(updated);
    setErrorMessage(null);
  };

  // Financial Calculations
  const subtotal = cart.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const discountRate = customerType === 'Event Planner' ? 0.15 : 0.0;
  const discount = subtotal * discountRate;
  const taxableAmount = subtotal - discount;
  const gst = taxableAmount * 0.05;
  const grandTotal = taxableAmount + gst;

  // Confirm Order Execution
  const handleConfirmOrder = () => {
    setErrorMessage(null);
    if (!customerName.trim()) {
      setErrorMessage('Please provide the customer name before generating the invoice.');
      return;
    }
    if (cart.length === 0) {
      setErrorMessage('Order is empty. Add floral items to generate bill.');
      return;
    }

    // Verify stock
    for (const line of cart) {
      const invItem = inventory.find((i) => i.id === line.item.id);
      if (!invItem || invItem.stock < line.quantity) {
        setErrorMessage(`Cannot confirm order: stock depleted for ${line.item.name}.`);
        return;
      }
    }

    // Deduct stock atomically
    const nextInventory = inventory.map((invItem) => {
      const qtyInOrder = cart
        .filter((l) => l.item.id === invItem.id)
        .reduce((sum, l) => sum + l.quantity, 0);
      return {
        ...invItem,
        stock: invItem.stock - qtyInOrder,
      };
    });
    setInventory(nextInventory);
    saveStoredInventory(nextInventory);

    // Numbering & Courier Dispatch
    const token = completedOrders.length + 1;
    const padded = String(token).padStart(4, '0');
    const invoiceNumber = `INV-2026-${padded}`;
    const orderId = `FLW${token}`;
    const rider = (token & 1) === 1 ? 'Rider 1 (Certified Express)' : 'Rider 2 (Eco Cargo)';

    const newOrder: CompletedOrder = {
      orderId,
      invoiceNumber,
      token,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      billingAddress: billingAddress.trim() || undefined,
      customerType,
      lines: [...cart],
      subtotal,
      discount,
      taxableAmount,
      gst,
      finalTotal: grandTotal,
      rider,
      timestamp: new Date().toLocaleString(),
    };

    const nextOrders = [newOrder, ...completedOrders];
    setCompletedOrders(nextOrders);
    saveStoredOrders(nextOrders);

    // Reset and open invoice modal
    setLastConfirmedOrder(newOrder);
    setActiveInvoiceModal(newOrder);
    setCart([]);
    saveStoredCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setBillingAddress('');
  };

  // PDF Trigger
  const handleDownloadPdf = (order: CompletedOrder) => {
    downloadInvoicePdf({
      invoiceNumber: order.invoiceNumber,
      orderId: order.orderId,
      date: order.timestamp,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      billingAddress: order.billingAddress,
      customerType: order.customerType,
      lines: order.lines.map((l) => ({
        id: l.item.id,
        name: l.item.name,
        quantity: l.quantity,
        price: l.item.price,
      })),
      subtotal: order.subtotal,
      discount: order.discount,
      taxableAmount: order.taxableAmount,
      gst: order.gst,
      finalTotal: order.finalTotal,
      rider: order.rider,
      token: order.token,
    });
  };

  // Browser Print Trigger
  const handlePrint = () => {
    window.print();
  };

  const filteredInventory = inventory.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(i.id).includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#05070a] text-[#f5efe2] font-manrope selection:bg-[#f5efe2] selection:text-[#151510] flex flex-col justify-between">
      {/* Hide Header when printing */}
      <div className="print:hidden">
        <Header />
      </div>

      <main className="max-w-7xl mx-auto w-full px-6 pt-32 pb-24 custom:px-12 print:pt-4 print:px-4">
        {/* Page Title & Navigation Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 print:hidden">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5efe2]/50 mb-2">
              <FileText className="w-3.5 h-3.5 text-[#f5efe2]" /> Invoicing &amp; Dispatch Engine
            </div>
            <h1 className="font-antonio text-5xl custom:text-7xl text-white tracking-wide">
              Billing Portal
            </h1>
          </div>

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
              Order &amp; Billing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'history'
                  ? 'bg-[#f5efe2] text-[#151510] shadow-md'
                  : 'text-[#f5efe2]/70 hover:text-white'
              }`}
            >
              Order History ({completedOrders.length})
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
              Greenhouse Stock ({inventory.length})
            </button>
          </div>
        </div>

        {/* TAB 1: ORDER BILLING */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 print:block">
            {/* Left Column: Customer Form & Item Selector */}
            <div className="lg:col-span-7 space-y-6 print:hidden">
              {/* Section A: Customer Details */}
              <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-7 backdrop-blur-md shadow-xl">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-5 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs">1</span>
                  Customer &amp; Tax Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">Customer Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Radhika Sen"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">Customer Type (Wholesale)</label>
                    <select
                      value={customerType}
                      onChange={(e) => setCustomerType(e.target.value as 'Regular' | 'Event Planner')}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                    >
                      <option value="Regular">Regular Customer (0% Discount)</option>
                      <option value="Event Planner">Event Planner (15% Wholesale Discount)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">Email Address</label>
                    <input
                      type="email"
                      placeholder="radhika@events.in"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">Billing / Delivery Address</label>
                  <input
                    type="text"
                    placeholder="Suite 402, High Street, Mumbai"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                  />
                </div>
              </div>

              {/* Section B: Product Selection */}
              <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-7 backdrop-blur-md shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs">2</span>
                    Select Product Lines
                  </h2>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#f5efe2]/40" />
                    <input
                      type="text"
                      placeholder="Filter flora..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-full bg-black/60 border border-[#f5efe2]/20 text-xs text-white focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                <form onSubmit={handleAddItem}>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-5">
                    <div className="sm:col-span-8">
                      <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">Flower Item</label>
                      <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(Number(e.target.value))}
                        className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                      >
                        {filteredInventory.map((item) => {
                          const avail = item.stock - getReservedQty(item.id);
                          return (
                            <option key={item.id} value={item.id}>
                              #{item.id} {item.name} (₹{item.price}) — {avail} available
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={inputQuantity}
                        onChange={(e) => setInputQuantity(Number(e.target.value))}
                        className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="mb-5 rounded-xl bg-red-950/60 border border-red-500/40 p-4 text-xs text-red-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-[#f5efe2] text-[#151510] py-3 px-6 text-xs font-semibold uppercase tracking-wider hover:bg-white active:scale-95 transition-all shadow-md"
                    >
                      + Add Item To Line
                    </button>
                    <button
                      type="button"
                      onClick={handleUndoLast}
                      disabled={cart.length === 0}
                      className="rounded-xl border border-[#f5efe2]/30 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Undo Last
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: Live Invoice Preview & Actions */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border border-[#f5efe2]/20 bg-[#0a0d14]/90 p-7 backdrop-blur-md shadow-2xl flex flex-col justify-between min-h-[540px]">
                <div>
                  <div className="flex items-center justify-between border-b border-[#f5efe2]/10 pb-4 mb-4">
                    <div>
                      <h3 className="font-antonio text-2xl text-white">Live Invoice Estimate</h3>
                      <p className="text-[11px] text-[#f5efe2]/50">Official 5% GST Statutory Accounting</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-300">
                      {customerType}
                    </span>
                  </div>

                  {/* Active Line Items */}
                  {cart.length === 0 ? (
                    <div className="py-14 text-center text-[#f5efe2]/40 text-xs italic">
                      <p>No active lines in invoice.</p>
                      <p className="mt-1">Add flowers from the left form or from the <Link href="/shop" className="underline text-[#f5efe2]">Shop</Link>.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 mb-6">
                      {cart.map((line) => (
                        <div
                          key={line.item.id}
                          className="rounded-xl border border-white/5 bg-black/40 p-3 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-medium text-white block">#{line.item.id} {line.item.name}</span>
                            <span className="text-[11px] text-[#f5efe2]/50 font-mono">
                              ₹{line.item.price} × {line.quantity}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">
                              ₹{(line.item.price * line.quantity).toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateLineQty(line.item.id, -1)}
                              className="h-6 w-6 rounded bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateLineQty(line.item.id, 1)}
                              className="h-6 w-6 rounded bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(line.item.id)}
                              className="h-6 w-6 text-red-400 hover:text-red-300 ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mathematical Calculation Breakdown */}
                <div className="border-t border-[#f5efe2]/10 pt-5 space-y-2 text-xs">
                  <div className="flex justify-between text-[#f5efe2]/75">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-[#f5efe2]/75">
                    <span>Discount ({customerType === 'Event Planner' ? '15% Wholesale' : '0% Regular'})</span>
                    <span className={`font-mono font-semibold ${discount > 0 ? 'text-emerald-400' : ''}`}>
                      - ₹{discount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[#f5efe2]/60">
                    <span>Taxable Amount</span>
                    <span className="font-mono">₹{taxableAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-[#f5efe2]/75">
                    <span>Statutory GST (5%)</span>
                    <span className="font-mono font-semibold">₹{gst.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-[#f5efe2]/15 pt-3 flex justify-between items-baseline">
                    <span className="text-base font-semibold text-white">Grand Total</span>
                    <span className="font-mono text-2xl font-bold text-[#f5efe2]">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    disabled={cart.length === 0}
                    className="w-full mt-4 h-12 rounded-full bg-emerald-500 text-black text-xs font-semibold uppercase tracking-wider hover:bg-emerald-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirm Order &amp; Generate Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDER HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-8 backdrop-blur-md shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-antonio text-3xl text-white">Confirmed Order Ledger</h2>
                  <p className="text-xs text-[#f5efe2]/60">Permanent audit records saved to local storage.</p>
                </div>
                <div className="text-xs text-[#f5efe2]/60">
                  Total Orders: <strong className="text-white">{completedOrders.length}</strong>
                </div>
              </div>

              {completedOrders.length === 0 ? (
                <div className="py-16 text-center text-[#f5efe2]/40 text-xs italic">
                  No confirmed orders recorded. Generate your first invoice to view historical records.
                </div>
              ) : (
                <div className="space-y-4">
                  {completedOrders.map((ord) => (
                    <div
                      key={ord.invoiceNumber}
                      className="p-5 rounded-2xl border border-white/10 bg-black/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-white text-sm">{ord.invoiceNumber}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                            {ord.orderId} (Token {ord.token})
                          </span>
                          <span className="text-[#f5efe2]/40">|</span>
                          <span className="font-medium text-white">{ord.customerName}</span>
                          <span className="text-[#f5efe2]/60">({ord.customerType})</span>
                        </div>
                        <p className="text-[#f5efe2]/60">
                          {ord.lines.map((l) => `${l.item.name} × ${l.quantity}`).join(', ')}
                        </p>
                        <p className="text-[11px] text-[#f5efe2]/40">{ord.timestamp} &bull; Courier: {ord.rider}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-mono text-base font-bold text-white">₹{ord.finalTotal.toFixed(2)}</span>
                          <span className="block text-[10px] text-emerald-400 uppercase font-semibold">PAID / VERIFIED</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveInvoiceModal(ord)}
                            className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(ord)}
                            className="p-2.5 rounded-xl bg-[#f5efe2] text-[#151510] hover:bg-white transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: GREENHOUSE STOCK INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="p-7 border-b border-[#f5efe2]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-antonio text-3xl text-white">Greenhouse Stock Inventory</h2>
                <p className="text-xs text-[#f5efe2]/60 mt-1">
                  Protected stock counters decrement only upon confirmed order invoices.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/50 text-[#f5efe2]/60 uppercase tracking-wider border-b border-white/5">
                  <tr>
                    <th className="p-5">Item ID</th>
                    <th className="p-5">Floral Name</th>
                    <th className="p-5">Category</th>
                    <th className="p-5">Unit Price</th>
                    <th className="p-5">Available Stock</th>
                    <th className="p-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-5 font-mono font-bold text-white">#{item.id}</td>
                      <td className="p-5 font-medium text-white">{item.name}</td>
                      <td className="p-5 text-[#f5efe2]/70">{item.category}</td>
                      <td className="p-5 font-mono">₹{item.price.toFixed(2)}</td>
                      <td className="p-5 font-mono font-bold text-white">{item.stock} units</td>
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

        {/* INVOICE MODAL & PRINT VIEW */}
        {activeInvoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 print:p-0 print:static print:bg-white animate-fade-in overflow-y-auto">
            <div className="relative max-w-2xl w-full rounded-3xl border border-[#f5efe2]/20 bg-[#0d1017] p-8 md:p-10 text-[#f5efe2] shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
              {/* Modal Top Actions (Hidden in Print) */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 print:hidden">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-antonio text-xl text-white">Official Tax Invoice</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(activeInvoiceModal)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f5efe2] text-[#151510] text-xs font-semibold uppercase tracking-wider hover:bg-white transition-all shadow"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 text-white text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInvoiceModal(null)}
                    className="p-2 rounded-full text-white/50 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Sheet */}
              <div className="space-y-6 text-xs print:text-black">
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b border-white/15 pb-6">
                  <div>
                    <h2 className="font-antonio text-3xl font-bold tracking-tight text-white print:text-black">BLOOMBOX</h2>
                    <p className="text-[11px] text-[#f5efe2]/60 print:text-gray-600">Regenerative Botanical Studio &amp; Greenhouse</p>
                    <p className="text-[11px] text-[#f5efe2]/60 print:text-gray-600">orders@bloombox.studio | GSTIN: 27AABCB1234F1Z9</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-base font-bold text-white print:text-black">{activeInvoiceModal.invoiceNumber}</span>
                    <p className="text-[11px] text-[#f5efe2]/60 print:text-gray-600">Order ID: {activeInvoiceModal.orderId}</p>
                    <p className="text-[11px] text-[#f5efe2]/60 print:text-gray-600">{activeInvoiceModal.timestamp}</p>
                  </div>
                </div>

                {/* Billed To */}
                <div className="grid grid-cols-2 gap-4 border-b border-white/15 pb-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#f5efe2]/50 print:text-gray-500 block mb-1">Billed To</span>
                    <strong className="text-sm text-white print:text-black block">{activeInvoiceModal.customerName}</strong>
                    <span className="text-[#f5efe2]/80 print:text-gray-700 block">{activeInvoiceModal.customerType} Client</span>
                    {activeInvoiceModal.billingAddress && (
                      <span className="text-[#f5efe2]/70 print:text-gray-600 block mt-1">{activeInvoiceModal.billingAddress}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#f5efe2]/50 print:text-gray-500 block mb-1">Dispatch Protocol</span>
                    <strong className="text-white print:text-black block">Token #{activeInvoiceModal.token}</strong>
                    <span className="text-emerald-400 print:text-gray-800 font-medium block">{activeInvoiceModal.rider}</span>
                    <span className="text-[10px] text-emerald-400 uppercase font-semibold">Payment Confirmed</span>
                  </div>
                </div>

                {/* Product Table */}
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/15 text-[11px] uppercase tracking-wider text-[#f5efe2]/60 print:text-gray-600">
                      <th className="py-2">Item ID</th>
                      <th className="py-2">Description</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 print:divide-gray-200">
                    {activeInvoiceModal.lines.map((l, i) => (
                      <tr key={i}>
                        <td className="py-2.5 font-mono">#{l.item.id}</td>
                        <td className="py-2.5 font-medium">{l.item.name}</td>
                        <td className="py-2.5 text-center font-mono">{l.quantity}</td>
                        <td className="py-2.5 text-right font-mono">₹{l.item.price.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono font-semibold">
                          ₹{(l.item.price * l.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Financial Summary */}
                <div className="border-t border-white/15 pt-4 space-y-1.5 text-right max-w-xs ml-auto">
                  <div className="flex justify-between">
                    <span className="text-[#f5efe2]/60 print:text-gray-600">Subtotal:</span>
                    <span className="font-mono">₹{activeInvoiceModal.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#f5efe2]/60 print:text-gray-600">
                      Discount ({activeInvoiceModal.customerType === 'Event Planner' ? '15%' : '0%'}):
                    </span>
                    <span className="font-mono text-emerald-400 print:text-black">
                      - ₹{activeInvoiceModal.discount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#f5efe2]/60 print:text-gray-600">Taxable Value:</span>
                    <span className="font-mono">₹{activeInvoiceModal.taxableAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#f5efe2]/60 print:text-gray-600">Statutory GST (5%):</span>
                    <span className="font-mono">₹{activeInvoiceModal.gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-white/15 pt-2 text-white print:text-black">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base">₹{activeInvoiceModal.finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6 text-[10px] text-[#f5efe2]/50 print:text-gray-500 text-center">
                  Thank you for supporting regenerative floristry. All stems are sustainably harvested and 100% biodegradable.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
