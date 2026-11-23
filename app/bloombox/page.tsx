'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, RotateCcw, CheckCircle, FileText, BarChart3, AlertCircle } from 'lucide-react';

interface FlowerItem {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface OrderLine {
  item: FlowerItem;
  quantity: number;
}

interface CompletedOrder {
  orderId: string;
  token: number;
  customerName: string;
  customerType: 'Regular' | 'Event Planner';
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  gst: number;
  finalTotal: number;
  rider: string;
  timestamp: string;
}

const INITIAL_ITEMS: FlowerItem[] = [
  { id: 101, name: 'Rose Bouquet', category: 'Bouquet', price: 450, stock: 15 },
  { id: 102, name: 'Jasmine Garland', category: 'Garland', price: 120, stock: 30 },
  { id: 103, name: 'Marigold (1 kg)', category: 'Loose', price: 90, stock: 25 },
  { id: 104, name: 'Orchid Stem', category: 'Stem', price: 150, stock: 20 },
  { id: 105, name: 'Table Decoration', category: 'Decor', price: 800, stock: 8 },
  { id: 106, name: 'Lily Bunch', category: 'Bouquet', price: 350, stock: 12 },
];

export default function BloomBoxPortal() {
  const [items, setItems] = useState<FlowerItem[]>(INITIAL_ITEMS);
  const [customerName, setCustomerName] = useState('');
  const [customerType, setCustomerType] = useState<'Regular' | 'Event Planner'>('Regular');
  const [currentOrderLines, setCurrentOrderLines] = useState<OrderLine[]>([]);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number>(101);
  const [quantity, setQuantity] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'order' | 'items' | 'report'>('order');
  const [lastBill, setLastBill] = useState<CompletedOrder | null>(null);

  // Reserved quantity in unconfirmed cart
  const reservedQty = (itemId: number) => {
    return currentOrderLines
      .filter((line) => line.item.id === itemId)
      .reduce((sum, line) => sum + line.quantity, 0);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const item = items.find((i) => i.id === selectedItemId);
    if (!item) {
      setErrorMessage('Flower item not found.');
      return;
    }

    const available = item.stock - reservedQty(item.id);
    if (quantity <= 0) {
      setErrorMessage('Quantity must be greater than zero.');
      return;
    }

    if (quantity > available) {
      setErrorMessage(`Insufficient stock for ${item.name}. Requested: ${quantity}, Available: ${available}`);
      return;
    }

    setCurrentOrderLines((prev) => [...prev, { item, quantity }]);
    setQuantity(1);
  };

  const handleUndo = () => {
    if (currentOrderLines.length === 0) return;
    setCurrentOrderLines((prev) => prev.slice(0, prev.length - 1));
    setErrorMessage(null);
  };

  const subtotal = currentOrderLines.reduce(
    (sum, line) => sum + line.item.price * line.quantity,
    0
  );
  const discountRate = customerType === 'Event Planner' ? 0.15 : 0.0;
  const discount = subtotal * discountRate;
  const gst = (subtotal - discount) * 0.05;
  const finalTotal = subtotal - discount + gst;

  const handleConfirmOrder = () => {
    if (!customerName.trim()) {
      setErrorMessage('Please enter the customer name.');
      return;
    }

    if (currentOrderLines.length === 0) {
      setErrorMessage('Order is empty. Please add items before confirming.');
      return;
    }

    // Reduce stock
    setItems((prevItems) =>
      prevItems.map((invItem) => {
        const qtyInOrder = currentOrderLines
          .filter((l) => l.item.id === invItem.id)
          .reduce((sum, l) => sum + l.quantity, 0);
        return {
          ...invItem,
          stock: invItem.stock - qtyInOrder,
        };
      })
    );

    const nextCounter = completedOrders.length + 1;
    const newOrder: CompletedOrder = {
      orderId: `FLW${nextCounter}`,
      token: nextCounter,
      customerName: customerName.trim(),
      customerType,
      lines: [...currentOrderLines],
      subtotal,
      discount,
      gst,
      finalTotal,
      rider: (nextCounter & 1) === 1 ? 'Rider 1' : 'Rider 2',
      timestamp: new Date().toLocaleTimeString(),
    };

    setCompletedOrders((prev) => [...prev, newOrder]);
    setLastBill(newOrder);
    setCurrentOrderLines([]);
    setCustomerName('');
    setErrorMessage(null);
  };

  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.finalTotal, 0);

  return (
    <div className="min-h-screen bg-[#05070a] text-[#f5efe2] font-manrope selection:bg-[#f5efe2] selection:text-[#151510]">
      {/* Top Bar */}
      <header className="border-b border-[#f5efe2]/10 bg-black/60 backdrop-blur-md sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-[#f5efe2]/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Fernhollow Valley
          </Link>
          <div className="h-4 w-[1px] bg-[#f5efe2]/20" />
          <span className="font-antonio text-xl tracking-wide text-[#f5efe2]">
            BloomBox <span className="text-xs uppercase font-manrope tracking-widest text-[#f5efe2]/50">Flower Shop Billing Portal</span>
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('order')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
              activeTab === 'order'
                ? 'bg-[#f5efe2] text-[#151510]'
                : 'text-[#f5efe2]/70 hover:text-[#f5efe2] hover:bg-white/5'
            }`}
          >
            New Order
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
              activeTab === 'items'
                ? 'bg-[#f5efe2] text-[#151510]'
                : 'text-[#f5efe2]/70 hover:text-[#f5efe2] hover:bg-white/5'
            }`}
          >
            Inventory
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
              activeTab === 'report'
                ? 'bg-[#f5efe2] text-[#151510]'
                : 'text-[#f5efe2]/70 hover:text-[#f5efe2] hover:bg-white/5'
            }`}
          >
            Sales Report ({completedOrders.length})
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-6 md:p-10">
        {/* Info Banner */}
        <div className="mb-8 rounded-2xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-5 flex items-start gap-4">
          <FileText className="w-5 h-5 text-[#f5efe2]/60 mt-0.5 shrink-0" />
          <div className="text-sm leading-relaxed text-[#f5efe2]/80">
            <span className="font-semibold text-white">Java Program Source Context:</span> This interface mirrors the
            original Java 17 billing system found in <code className="text-xs bg-black/60 px-2 py-0.5 rounded border border-white/10 text-[#f5efe2]">bloombox/src/bloombox/app/BloomBox.java</code>.
            Stock reduction occurs only upon order confirmation, supporting item undos, 15% Event Planner discounts, 5% GST, and odd/even rider dispatch tokens.
          </div>
        </div>

        {/* Tab 1: New Order */}
        {activeTab === 'order' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Order Form */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-2xl border border-[#f5efe2]/10 bg-[#0d1117] p-6 shadow-xl">
                <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#f5efe2]/70" /> Customer &amp; Item Entry
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">Customer Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-lg bg-black/50 border border-[#f5efe2]/20 px-3.5 py-2.5 text-sm text-[#f5efe2] focus:outline-none focus:border-[#f5efe2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">Customer Type</label>
                    <select
                      value={customerType}
                      onChange={(e) => setCustomerType(e.target.value as 'Regular' | 'Event Planner')}
                      className="w-full rounded-lg bg-black/50 border border-[#f5efe2]/20 px-3.5 py-2.5 text-sm text-[#f5efe2] focus:outline-none focus:border-[#f5efe2]"
                    >
                      <option value="Regular">Regular Customer (0% Discount)</option>
                      <option value="Event Planner">Event Planner (15% Discount)</option>
                    </select>
                  </div>
                </div>

                <form onSubmit={handleAddItem} className="border-t border-[#f5efe2]/10 pt-4">
                  <label className="block text-xs uppercase tracking-wider text-[#f5efe2]/60 mb-2">Select Flower Item</label>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(Number(e.target.value))}
                      className="sm:col-span-8 rounded-lg bg-black/50 border border-[#f5efe2]/20 px-3.5 py-2.5 text-sm text-[#f5efe2] focus:outline-none focus:border-[#f5efe2]"
                    >
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          #{item.id} - {item.name} (Rs. {item.price}) — {item.stock - reservedQty(item.id)} available
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="sm:col-span-4 rounded-lg bg-black/50 border border-[#f5efe2]/20 px-3.5 py-2.5 text-sm text-[#f5efe2] focus:outline-none focus:border-[#f5efe2]"
                      placeholder="Qty"
                    />
                  </div>

                  {errorMessage && (
                    <div className="mb-4 rounded-lg bg-red-950/40 border border-red-500/40 p-3 text-xs text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-[#f5efe2] text-[#151510] py-2.5 px-4 text-xs font-semibold uppercase tracking-wider hover:bg-white transition-all"
                    >
                      + Add Item to Cart
                    </button>
                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={currentOrderLines.length === 0}
                      className="rounded-lg border border-[#f5efe2]/30 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[#f5efe2]/80 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Undo Last
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Live Cart & Invoice Preview */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-[#f5efe2]/10 bg-[#0d1117] p-6 shadow-xl flex flex-col justify-between min-h-[380px]">
                <div>
                  <div className="flex items-center justify-between border-b border-[#f5efe2]/10 pb-3 mb-4">
                    <h3 className="font-antonio text-xl tracking-wide text-white">Current Order</h3>
                    <span className="text-xs text-[#f5efe2]/60">
                      {customerName ? `${customerName} (${customerType})` : 'Guest'}
                    </span>
                  </div>

                  {currentOrderLines.length === 0 ? (
                    <p className="text-xs text-[#f5efe2]/40 italic py-8 text-center">Cart is empty. Add flowers to begin.</p>
                  ) : (
                    <ul className="space-y-3 mb-6">
                      {currentOrderLines.map((line, idx) => (
                        <li key={idx} className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-medium text-white">{line.item.name}</span>
                            <span className="text-[#f5efe2]/50 ml-2">× {line.quantity}</span>
                          </div>
                          <span className="font-mono text-[#f5efe2]/90">
                            Rs. {(line.item.price * line.quantity).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Calculation Breakdown */}
                <div className="border-t border-[#f5efe2]/10 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-[#f5efe2]/70">
                    <span>Subtotal</span>
                    <span className="font-mono">Rs. {subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Event Planner Discount (15%)</span>
                      <span className="font-mono">- Rs. {discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#f5efe2]/70">
                    <span>GST (5%)</span>
                    <span className="font-mono">Rs. {gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-white border-t border-[#f5efe2]/10 pt-2">
                    <span>Total Amount</span>
                    <span className="font-mono text-[#f5efe2]">Rs. {finalTotal.toFixed(2)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    disabled={currentOrderLines.length === 0}
                    className="w-full mt-4 rounded-xl bg-emerald-600 text-white py-3 text-xs font-semibold uppercase tracking-wider hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Confirm Order &amp; Generate Bill
                  </button>
                </div>
              </div>

              {/* Last Confirmed Bill Ticket */}
              {lastBill && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-xs space-y-3">
                  <div className="flex items-center justify-between text-emerald-400 font-semibold border-b border-emerald-500/20 pb-2">
                    <span>Order #{lastBill.orderId} Confirmed</span>
                    <span>Token: {lastBill.token} ({lastBill.rider})</span>
                  </div>
                  <p className="text-[#f5efe2]/70">Customer: <strong className="text-white">{lastBill.customerName}</strong></p>
                  <p className="text-[#f5efe2]/70">Total Paid: <strong className="text-emerald-300 font-mono">Rs. {lastBill.finalTotal.toFixed(2)}</strong></p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Inventory */}
        {activeTab === 'items' && (
          <div className="rounded-2xl border border-[#f5efe2]/10 bg-[#0d1117] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#f5efe2]/10 flex items-center justify-between">
              <div>
                <h2 className="font-antonio text-2xl text-white">Flower Inventory</h2>
                <p className="text-xs text-[#f5efe2]/60">Live stock catalog from BloomBox database.</p>
              </div>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-black/50 text-[#f5efe2]/60 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Item ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Unit Price</th>
                  <th className="p-4">Stock In Store</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5efe2]/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono font-bold text-[#f5efe2]/80">#{item.id}</td>
                    <td className="p-4 font-medium text-white">{item.name}</td>
                    <td className="p-4 text-[#f5efe2]/70">{item.category}</td>
                    <td className="p-4 font-mono">Rs. {item.price.toFixed(2)}</td>
                    <td className="p-4 font-mono">{item.stock} units</td>
                    <td className="p-4">
                      {item.stock <= 5 ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-950/60 border border-red-500/30 text-red-300 text-[10px] uppercase">
                          LOW
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] uppercase">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Sales Report */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-[#f5efe2]/10 bg-[#0d1117] p-6 shadow-xl">
                <span className="text-xs uppercase tracking-wider text-[#f5efe2]/60">Total Confirmed Orders</span>
                <p className="font-antonio text-4xl text-white mt-2">{completedOrders.length}</p>
              </div>
              <div className="rounded-2xl border border-[#f5efe2]/10 bg-[#0d1117] p-6 shadow-xl">
                <span className="text-xs uppercase tracking-wider text-[#f5efe2]/60">Total Revenue Generated</span>
                <p className="font-antonio text-4xl text-emerald-400 mt-2 font-mono">Rs. {totalRevenue.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border border-[#f5efe2]/10 bg-[#0d1117] p-6 shadow-xl">
                <span className="text-xs uppercase tracking-wider text-[#f5efe2]/60">Items In Catalog</span>
                <p className="font-antonio text-4xl text-white mt-2">{items.length}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#f5efe2]/10 bg-[#0d1117] p-6 shadow-xl">
              <h3 className="font-antonio text-xl text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#f5efe2]/70" /> Order History Log
              </h3>
              {completedOrders.length === 0 ? (
                <p className="text-xs text-[#f5efe2]/40 italic py-6 text-center">No orders confirmed yet.</p>
              ) : (
                <div className="space-y-4">
                  {completedOrders.map((order) => (
                    <div
                      key={order.orderId}
                      className="p-4 rounded-xl border border-[#f5efe2]/10 bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-white">#{order.orderId}</span>
                          <span className="text-[#f5efe2]/40">|</span>
                          <span className="text-[#f5efe2]/80">{order.customerName} ({order.customerType})</span>
                        </div>
                        <p className="text-[#f5efe2]/50">
                          {order.lines.map((l) => `${l.item.name} × ${l.quantity}`).join(', ')}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-sm font-semibold text-emerald-400">
                          Rs. {order.finalTotal.toFixed(2)}
                        </span>
                        <div className="text-[10px] text-[#f5efe2]/40 uppercase mt-0.5">
                          Assigned to {order.rider} (Token {order.token})
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
    </div>
  );
}
