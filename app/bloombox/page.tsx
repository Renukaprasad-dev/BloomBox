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
import { calculateOrderFinancials, formatINR, numberToWordsINR, STUDIO_BANK_DETAILS } from '@/lib/billingCalculations';
import { downloadInvoicePdf, shareInvoicePdf, STUDIO_CONFIG } from '@/lib/pdfInvoice';
import {
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  FileText,
  AlertCircle,
  Truck,
  Printer,
  Download,
  Share2,
  Trash2,
  Plus,
  Minus,
  Search,
  Eye,
  X,
  Copy,
  Sparkles,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Clock,
  Filter,
} from 'lucide-react';

export default function BloomBoxBillingPage() {
  const [inventory, setInventory] = useState<FlowerItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);

  // Customer Form Data
  const [customerName, setCustomerName] = useState('');
  const [customerCategory, setCustomerCategory] = useState<'Regular' | 'Event Planner'>('Regular');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI / NetBanking' | 'Card' | 'Cash on Delivery'>('UPI / NetBanking');

  // Product Selection Form
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<number>(101);
  const [inputQuantity, setInputQuantity] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active View / Modals
  const [activeTab, setActiveTab] = useState<'billing' | 'history' | 'inventory'>('billing');
  const [activeInvoiceModal, setActiveInvoiceModal] = useState<CompletedOrder | null>(null);
  const [isDuplicateCopy, setIsDuplicateCopy] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Order History Filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyCategory, setHistoryCategory] = useState<string>('All');
  const [historyStatus, setHistoryStatus] = useState<string>('All');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Load state on mount from API + fallback
  useEffect(() => {
    // Fetch products
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.products) {
          setInventory(data.products);
          saveStoredInventory(data.products);
          if (data.products.length > 0) setSelectedItemId(data.products[0].id);
        } else {
          setInventory(getStoredInventory());
        }
      })
      .catch(() => {
        setInventory(getStoredInventory());
      });

    // Fetch orders from API
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.orders && data.orders.length > 0) {
          setCompletedOrders(data.orders);
          saveStoredOrders(data.orders);
        } else {
          setCompletedOrders(getStoredOrders());
        }
      })
      .catch(() => {
        setCompletedOrders(getStoredOrders());
      });

    setCart(getStoredCart());
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
    showNotification(`Added ${inputQuantity}× ${item.name} to order.`);
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
    showNotification('Last line item removed (Undo).');
  };

  // Financial Calculations powered by integer paise engine
  const calc = calculateOrderFinancials(
    cart.map((c) => ({
      id: c.item.id,
      name: c.item.name,
      category: c.item.category,
      price: c.item.price,
      quantity: c.quantity,
    })),
    customerCategory
  );

  // Confirm Order Execution
  const handleConfirmOrder = async () => {
    setErrorMessage(null);

    // Validation
    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage('Please enter a valid customer name.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number (e.g. 9876543210).');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@') || !customerEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address (e.g. client@example.com).');
      return;
    }
    if (!billingAddress.trim() || billingAddress.trim().length < 5) {
      setErrorMessage('Please enter a complete billing address (Street, City, Pincode).');
      return;
    }
    if (cart.length === 0) {
      setErrorMessage('Order is empty. Please add flowers to generate an invoice.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Post to database API
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerCategory,
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          customerGstin: customerGstin.trim(),
          billingAddress: billingAddress.trim(),
          deliveryAddress: sameAsBilling ? billingAddress.trim() : deliveryAddress.trim(),
          customerNotes: customerNotes.trim(),
          lines: cart,
          paymentMethod,
          paymentStatus: paymentMethod === 'Cash on Delivery' ? 'CASH ON DELIVERY' : 'PAID',
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMessage(data.error || 'Failed to process order confirmation.');
        setIsSubmitting(false);
        return;
      }

      const confirmedOrder: CompletedOrder = data.order;

      // Update local storage and component state
      const nextOrders = [confirmedOrder, ...completedOrders.filter((o) => o.orderId !== confirmedOrder.orderId)];
      setCompletedOrders(nextOrders);
      saveStoredOrders(nextOrders);

      // Decrement inventory locally
      const nextInv = inventory.map((invItem) => {
        const qtyInOrder = cart
          .filter((l) => l.item.id === invItem.id)
          .reduce((sum, l) => sum + l.quantity, 0);
        return {
          ...invItem,
          stock: Math.max(0, invItem.stock - qtyInOrder),
        };
      });
      setInventory(nextInv);
      saveStoredInventory(nextInv);

      // Clear cart
      setCart([]);
      saveStoredCart([]);

      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setBillingAddress('');
      setDeliveryAddress('');
      setCustomerNotes('');
      setIsSubmitting(false);

      // Open Invoice Modal
      setIsDuplicateCopy(false);
      setActiveInvoiceModal(confirmedOrder);
      showNotification(`Order #${confirmedOrder.orderId} Confirmed & Invoiced!`);
    } catch (e) {
      console.error('Confirmation error:', e);
      setErrorMessage('Network or server error during order confirmation.');
      setIsSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(i.id).includes(searchQuery)
  );

  const filteredHistory = completedOrders.filter((ord) => {
    const q = historySearch.toLowerCase();
    const matchesSearch =
      ord.invoiceNumber.toLowerCase().includes(q) ||
      ord.customerName.toLowerCase().includes(q) ||
      ord.orderId.toLowerCase().includes(q);
    const matchesCategory = historyCategory === 'All' || ord.customerCategory === historyCategory;
    const matchesStatus = historyStatus === 'All' || ord.orderStatus === historyStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#05070a] text-[#f5efe2] font-manrope selection:bg-[#f5efe2] selection:text-[#151510] flex flex-col justify-between">
      {/* Hide Header when printing */}
      <div className="print:hidden">
        <Header />
      </div>

      <main className="max-w-7xl mx-auto w-full px-6 pt-32 pb-24 custom:px-12 print:pt-4 print:px-4">
        {/* Top Header & Navigation Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 print:hidden">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5efe2]/50 mb-2">
              <FileText className="w-3.5 h-3.5 text-[#f5efe2]" /> Retail Statutory Invoicing Engine
            </div>
            <h1 className="font-antonio text-5xl custom:text-7xl text-white tracking-wide">
              Billing &amp; Invoices
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

        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-8 right-8 z-50 rounded-2xl border border-emerald-500/40 bg-black/95 backdrop-blur-md px-5 py-3 text-xs font-semibold text-white shadow-2xl flex items-center gap-2.5 animate-fade-in print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* TAB 1: ORDER BILLING */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 print:block">
            {/* Left Column: Customer Form & Item Selector */}
            <div className="lg:col-span-7 space-y-6 print:hidden">
              {/* Section 1: Customer Details */}
              <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/85 p-7 backdrop-blur-md shadow-xl">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-5 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs">1</span>
                  Customer &amp; Tax Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Radhika Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                      Customer Category (Tier)
                    </label>
                    <select
                      value={customerCategory}
                      onChange={(e) => setCustomerCategory(e.target.value as 'Regular' | 'Event Planner')}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                    >
                      <option value="Regular">Regular Customer (0% Discount)</option>
                      <option value="Event Planner">Event Planner (15% Wholesale Discount)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                      Phone Number (10 Digits) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="98230 45678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="radhika@studio.in"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                      Billing Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Penthouse 402, High Street, Mumbai 400050"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                      Customer GSTIN (Optional B2B)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27AABCT1234F1Z5"
                      value={customerGstin}
                      onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2] font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="sameAddress"
                    checked={sameAsBilling}
                    onChange={(e) => setSameAsBilling(e.target.checked)}
                    className="rounded bg-black border-white/20 text-[#f5efe2] focus:ring-0"
                  />
                  <label htmlFor="sameAddress" className="text-xs text-[#f5efe2]/80 select-none cursor-pointer">
                    Delivery address is identical to billing address
                  </label>
                </div>

                {!sameAsBilling && (
                  <div className="mb-4 animate-fade-in">
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      placeholder="Banquet Hall, The Taj Hotel, Mumbai"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as 'UPI / NetBanking' | 'Card' | 'Cash on Delivery')}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                    >
                      <option value="UPI / NetBanking">UPI / Instant NetBanking</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="Cash on Delivery">Cash on Delivery (Courier Collect)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">
                      Courier / Delivery Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Leave with security desk"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Product Line Selector */}
              <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/85 p-7 backdrop-blur-md shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs">2</span>
                    Add Flower Products to Order
                  </h2>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#f5efe2]/40" />
                    <input
                      type="text"
                      placeholder="Search flora..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-full bg-black/60 border border-[#f5efe2]/20 text-xs text-white focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                <form onSubmit={handleAddItem}>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-5">
                    <div className="sm:col-span-8">
                      <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">Select Flower</label>
                      <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(Number(e.target.value))}
                        className="w-full rounded-xl bg-black/60 border border-[#f5efe2]/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5efe2]"
                      >
                        {filteredInventory.map((item) => {
                          const avail = item.stock - getReservedQty(item.id);
                          return (
                            <option key={item.id} value={item.id}>
                              #{item.id} {item.name} ({formatINR(item.price)}) — {avail} in greenhouse
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
                      + Add Product Line
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
              <div className="rounded-3xl border border-[#f5efe2]/20 bg-[#0a0d14]/90 p-7 backdrop-blur-md shadow-2xl flex flex-col justify-between min-h-[580px]">
                <div>
                  <div className="flex items-center justify-between border-b border-[#f5efe2]/10 pb-4 mb-4">
                    <div>
                      <h3 className="font-antonio text-2xl text-white">Live Invoice Estimate</h3>
                      <p className="text-[11px] text-[#f5efe2]/50">Official 5.0% GST Statutory Indian Invoice</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-300 font-medium">
                      {customerCategory}
                    </span>
                  </div>

                  {/* Active Line Items */}
                  {cart.length === 0 ? (
                    <div className="py-16 text-center text-[#f5efe2]/40 text-xs italic">
                      <p>No active lines in invoice.</p>
                      <p className="mt-1">Add flowers from the left form or from the <Link href="/shop" className="underline text-[#f5efe2]">Shop</Link>.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1 mb-6">
                      {calc.lines.map((line) => (
                        <div
                          key={line.id}
                          className="rounded-xl border border-white/5 bg-black/40 p-3 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-medium text-white block">#{line.id} {line.name}</span>
                            <span className="text-[11px] text-[#f5efe2]/50 font-mono">
                              {formatINR(line.unitPrice)} × {line.quantity}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">
                              {formatINR(line.lineTotal)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateLineQty(line.id, -1)}
                              className="h-6 w-6 rounded bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateLineQty(line.id, 1)}
                              className="h-6 w-6 rounded bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(line.id)}
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
                    <span className="font-mono font-semibold">{formatINR(calc.subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-[#f5efe2]/75">
                    <span>Discount ({customerCategory === 'Event Planner' ? '15% Wholesale' : '0% Regular'})</span>
                    <span className={`font-mono font-semibold ${calc.discount > 0 ? 'text-emerald-400' : ''}`}>
                      - {formatINR(calc.discount)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[#f5efe2]/60">
                    <span>Taxable Amount</span>
                    <span className="font-mono">{formatINR(calc.taxableAmount)}</span>
                  </div>

                  <div className="flex justify-between text-[#f5efe2]/75">
                    <span>Statutory CGST + SGST (5%)</span>
                    <span className="font-mono font-semibold">{formatINR(calc.gst)}</span>
                  </div>

                  <div className="border-t border-[#f5efe2]/15 pt-3 flex justify-between items-baseline">
                    <span className="text-base font-semibold text-white">Grand Total Payable</span>
                    <span className="font-mono text-2xl font-bold text-[#f5efe2]">
                      {formatINR(calc.grandTotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    disabled={cart.length === 0 || isSubmitting}
                    className="w-full mt-4 h-12 rounded-full bg-emerald-500 text-black text-xs font-semibold uppercase tracking-wider hover:bg-emerald-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                  >
                    {isSubmitting ? (
                      <span>Verifying &amp; Allocating Courier...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Order &amp; Generate Tax Invoice</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDER HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/85 p-8 backdrop-blur-md shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-antonio text-3xl text-white">Confirmed Order Ledger</h2>
                  <p className="text-xs text-[#f5efe2]/60">Immutable historical tax invoices preserved in database.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#f5efe2]/40" />
                    <input
                      type="text"
                      placeholder="Search invoice / name..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-full bg-black/60 border border-[#f5efe2]/20 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <select
                    value={historyCategory}
                    onChange={(e) => setHistoryCategory(e.target.value)}
                    className="px-3 py-1.5 rounded-full bg-black/60 border border-[#f5efe2]/20 text-xs text-white"
                  >
                    <option value="All">All Categories</option>
                    <option value="Regular">Regular</option>
                    <option value="Event Planner">Event Planner</option>
                  </select>

                  <select
                    value={historyStatus}
                    onChange={(e) => setHistoryStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-full bg-black/60 border border-[#f5efe2]/20 text-xs text-white"
                  >
                    <option value="All">All Statuses</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="OUT FOR DELIVERY">OUT FOR DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="py-16 text-center text-[#f5efe2]/40 text-xs italic">
                  No confirmed orders found matching your criteria.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHistory.map((ord) => (
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
                          <span className="text-[#f5efe2]/60">({ord.customerCategory || ord.customerType})</span>
                        </div>
                        <p className="text-[#f5efe2]/60">
                          {ord.lines.map((l) => `${l.item.name} × ${l.quantity}`).join(', ')}
                        </p>
                        <p className="text-[11px] text-[#f5efe2]/40">
                          {ord.timestamp} &bull; Courier: {ord.rider} &bull; Destination: {ord.deliveryAddress || ord.billingAddress}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-mono text-base font-bold text-white">{formatINR(ord.finalTotal)}</span>
                          <span className="block text-[10px] text-emerald-400 uppercase font-semibold">
                            {ord.paymentStatus || 'PAID'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsDuplicateCopy(false);
                              setActiveInvoiceModal(ord);
                            }}
                            className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
                            title="Preview Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadInvoicePdf(ord)}
                            className="p-2.5 rounded-xl bg-[#f5efe2] text-[#151510] hover:bg-white transition-colors"
                            title="Download Official A4 PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => shareInvoicePdf(ord)}
                            className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
                            title="Share Invoice (Web Share API)"
                          >
                            <Share2 className="w-4 h-4" />
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
          <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/85 overflow-hidden shadow-2xl backdrop-blur-md">
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
                      <td className="p-5 font-mono">{formatINR(item.price)}</td>
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

        {/* INVOICE MODAL & DEDICATED A4 PRINT VIEW */}
        {activeInvoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 print:p-0 print:static print:bg-white animate-fade-in overflow-y-auto">
            <div className="relative max-w-3xl w-full rounded-3xl border border-[#f5efe2]/20 bg-[#0d1017] p-8 md:p-10 text-[#f5efe2] shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0 print:max-w-none">
              {/* Modal Top Actions (Hidden in Print) */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 print:hidden">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-antonio text-xl text-white">
                    {isDuplicateCopy ? 'Duplicate Tax Invoice Copy' : 'Official Tax Invoice'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDuplicateCopy(!isDuplicateCopy)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/20 text-[#f5efe2] text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-all"
                  >
                    {isDuplicateCopy ? 'Copy: Duplicate' : 'Copy: Original'}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadInvoicePdf(activeInvoiceModal, isDuplicateCopy)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f5efe2] text-[#151510] text-xs font-semibold uppercase tracking-wider hover:bg-white transition-all shadow"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => shareInvoicePdf(activeInvoiceModal, isDuplicateCopy)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 text-white text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 text-white text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print A4
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
                    <p className="text-[11px] text-[#f5efe2]/70 print:text-gray-700">{STUDIO_CONFIG.name}</p>
                    <p className="text-[10px] text-[#f5efe2]/50 print:text-gray-500">{STUDIO_CONFIG.address}</p>
                    <p className="text-[10px] text-[#f5efe2]/50 print:text-gray-500">Phone: {STUDIO_CONFIG.phone} | Email: {STUDIO_CONFIG.email}</p>
                    <p className="text-[10px] text-[#f5efe2]/60 print:text-gray-600 font-semibold mt-1">
                      GSTIN: {STUDIO_CONFIG.gstin} | PAN: {STUDIO_CONFIG.pan} | State: Maharashtra (27)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-base font-bold text-white print:text-black">{activeInvoiceModal.invoiceNumber}</span>
                    <span className="block text-[10px] text-emerald-400 font-semibold uppercase">
                      {isDuplicateCopy ? 'DUPLICATE FOR TRANSPORTER' : 'ORIGINAL FOR RECIPIENT'}
                    </span>
                    <p className="text-[11px] text-[#f5efe2]/70 print:text-gray-600 mt-1">Order ID: #{activeInvoiceModal.orderId}</p>
                    <p className="text-[10px] text-[#f5efe2]/50 print:text-gray-500">{activeInvoiceModal.timestamp}</p>
                  </div>
                </div>

                {/* Billed To / Shipped To */}
                <div className="grid grid-cols-2 gap-4 border-b border-white/15 pb-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#f5efe2]/50 print:text-gray-500 block mb-1">Billed To</span>
                    <strong className="text-sm text-white print:text-black block">{activeInvoiceModal.customerName}</strong>
                    <span className="text-[#f5efe2]/80 print:text-gray-700 block">
                      {activeInvoiceModal.customerCategory || activeInvoiceModal.customerType} Client
                      {(activeInvoiceModal.customerCategory || activeInvoiceModal.customerType) === 'Event Planner' ? ' (15% Wholesale Member)' : ''}
                    </span>
                    <span className="text-[#f5efe2]/70 print:text-gray-600 block">Phone: {activeInvoiceModal.customerPhone}</span>
                    <span className="text-[#f5efe2]/70 print:text-gray-600 block">Email: {activeInvoiceModal.customerEmail}</span>
                    <span className="text-[#f5efe2]/70 print:text-gray-600 block mt-1">
                      Billing Address: {activeInvoiceModal.billingAddress}
                    </span>
                    {activeInvoiceModal.customerGstin && (
                      <span className="text-emerald-400 font-mono text-[10px] block mt-0.5">
                        GSTIN: {activeInvoiceModal.customerGstin}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#f5efe2]/50 print:text-gray-500 block mb-1">Dispatch Protocol</span>
                    <strong className="text-white print:text-black block">Token #{activeInvoiceModal.token}</strong>
                    <span className="text-emerald-400 print:text-gray-800 font-medium block">{activeInvoiceModal.rider}</span>
                    <span className="text-[10px] text-[#f5efe2]/60 print:text-gray-600 block">
                      Destination: {activeInvoiceModal.deliveryAddress || activeInvoiceModal.billingAddress}
                    </span>
                    <span className="text-[10px] text-emerald-400 uppercase font-semibold block mt-1">
                      Payment Mode: {activeInvoiceModal.paymentMethod || 'UPI / NetBanking'} ({activeInvoiceModal.paymentStatus || 'PAID'})
                    </span>
                    {activeInvoiceModal.customerNotes && (
                      <span className="text-[10px] text-[#f5efe2]/50 italic block mt-1">
                        Notes: {activeInvoiceModal.customerNotes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Table */}
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/15 text-[11px] uppercase tracking-wider text-[#f5efe2]/60 print:text-gray-600">
                      <th className="py-2">Item #</th>
                      <th className="py-2">Floral Arrangement &amp; Notes</th>
                      <th className="py-2">Unit</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Rate</th>
                      <th className="py-2 text-right">Discount</th>
                      <th className="py-2 text-right">Taxable Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 print:divide-gray-200">
                    {activeInvoiceModal.lines.map((l, i) => {
                      const isWholesale = (activeInvoiceModal.customerCategory || activeInvoiceModal.customerType) === 'Event Planner';
                      const discountRate = isWholesale ? 0.15 : 0;
                      const lineDiscount = l.item.price * l.quantity * discountRate;
                      const lineTaxable = l.item.price * l.quantity - lineDiscount;

                      return (
                        <tr key={i}>
                          <td className="py-2.5 font-mono text-[11px]">BB-{l.item.id}</td>
                          <td className="py-2.5">
                            <span className="font-medium text-white print:text-black block">{l.item.name}</span>
                            {l.item.description && (
                              <span className="text-[10px] text-[#f5efe2]/50 print:text-gray-600 block leading-tight">
                                {l.item.description}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-[11px] text-[#f5efe2]/60 print:text-gray-600">
                            {l.item.stemCount || 'Handcrafted'}
                          </td>
                          <td className="py-2.5 text-center font-mono">{l.quantity}</td>
                          <td className="py-2.5 text-right font-mono">{formatINR(l.item.price)}</td>
                          <td className="py-2.5 text-right font-mono text-emerald-400 print:text-black">
                            {discountRate > 0 ? `- ${formatINR(lineDiscount)}` : '₹0.00'}
                          </td>
                          <td className="py-2.5 text-right font-mono font-semibold">
                            {formatINR(lineTaxable)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Financial Summary */}
                <div className="border-t border-white/15 pt-4 space-y-1.5 text-right max-w-sm ml-auto">
                  <div className="flex justify-between">
                    <span className="text-[#f5efe2]/60 print:text-gray-600">Gross Subtotal:</span>
                    <span className="font-mono">{formatINR(activeInvoiceModal.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#f5efe2]/60 print:text-gray-600">
                      Wholesale Discount ({(activeInvoiceModal.customerCategory || activeInvoiceModal.customerType) === 'Event Planner' ? '15%' : '0%'}):
                    </span>
                    <span className="font-mono text-emerald-400 print:text-black">
                      - {formatINR(activeInvoiceModal.discount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#f5efe2]/60 print:text-gray-600">Net Taxable Value:</span>
                    <span className="font-mono">{formatINR(activeInvoiceModal.taxableAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#f5efe2]/60 print:text-gray-600">CGST (2.5%):</span>
                    <span className="font-mono">{formatINR(activeInvoiceModal.gst / 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#f5efe2]/60 print:text-gray-600">SGST (2.5%):</span>
                    <span className="font-mono">{formatINR(activeInvoiceModal.gst / 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#f5efe2]/60 print:text-gray-600">Total Statutory GST (5.0%):</span>
                    <span className="font-mono">{formatINR(activeInvoiceModal.gst)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-white/15 pt-2 text-white print:text-black">
                    <span>Grand Total:</span>
                    <span className="font-mono text-lg">{formatINR(activeInvoiceModal.finalTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#f5efe2]/60 print:text-gray-600 pt-1">
                    <span>Amount Received:</span>
                    <span className="font-mono text-white print:text-black">
                      {activeInvoiceModal.paymentStatus === 'PAID' ? formatINR(activeInvoiceModal.finalTotal) : '₹0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#f5efe2]/60 print:text-gray-600">
                    <span>Balance Due:</span>
                    <span className="font-mono text-white print:text-black">
                      {activeInvoiceModal.paymentStatus === 'PAID' ? '₹0.00' : formatINR(activeInvoiceModal.finalTotal)}
                    </span>
                  </div>
                </div>

                {/* Amount in Words & Bank Settlement */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5">
                    <span className="text-[10px] uppercase font-bold text-[#f5efe2]/50 print:text-gray-500 block mb-1">
                      Amount in Words (INR):
                    </span>
                    <p className="text-xs font-semibold text-white print:text-black">
                      {numberToWordsINR(activeInvoiceModal.finalTotal)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 text-[11px]">
                    <span className="text-[10px] uppercase font-bold text-[#f5efe2]/50 print:text-gray-500 block mb-1">
                      Settlement &amp; Bank Details:
                    </span>
                    <p className="text-[#f5efe2]/80 print:text-gray-700">
                      <strong>{STUDIO_BANK_DETAILS.bankName}</strong> &bull; A/C: {STUDIO_BANK_DETAILS.accountNumber}
                    </p>
                    <p className="text-[#f5efe2]/60 print:text-gray-600">
                      IFSC: {STUDIO_BANK_DETAILS.ifsc} &bull; UPI: {STUDIO_BANK_DETAILS.upiId}
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 text-[10px] text-[#f5efe2]/50 print:text-gray-500 text-center">
                  This document is a certified digital tax invoice issued under statutory GST provisions. Stems are hand-inspected and 100% biodegradable.
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
