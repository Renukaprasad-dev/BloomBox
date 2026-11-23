'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  FlowerItem,
  CompletedOrder,
  getStoredInventory,
  saveStoredInventory,
  getStoredOrders,
} from '@/lib/store';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle,
  Truck,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [inventory, setInventory] = useState<FlowerItem[]>([]);
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'orders'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Product Form Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Bouquet',
    price: 250,
    stock: 20,
    description: '',
  });

  useEffect(() => {
    setInventory(getStoredInventory());
    setOrders(getStoredOrders());
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + o.finalTotal, 0);
  const totalOrdersCount = orders.length;
  const lowStockCount = inventory.filter((i) => i.stock <= 8).length;

  // Calculate Product Sales Volume
  const productSalesMap: Record<number, { name: string; qty: number; revenue: number }> = {};
  orders.forEach((ord) => {
    ord.lines.forEach((l) => {
      if (!productSalesMap[l.item.id]) {
        productSalesMap[l.item.id] = { name: l.item.name, qty: 0, revenue: 0 };
      }
      productSalesMap[l.item.id].qty += l.quantity;
      productSalesMap[l.item.id].revenue += l.item.price * l.quantity;
    });
  });
  const topSelling = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty);

  const handleUpdateStock = (productId: number, newStock: number) => {
    const updated = inventory.map((item) =>
      item.id === productId ? { ...item, stock: Math.max(0, newStock) } : item
    );
    setInventory(updated);
    saveStoredInventory(updated);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim()) return;

    const nextId = Math.max(...inventory.map((i) => i.id), 100) + 1;
    const created: FlowerItem = {
      id: nextId,
      name: newProduct.name.trim(),
      category: newProduct.category,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
      description: newProduct.description.trim() || 'Hand-harvested botanical arrangement.',
      imageColor: 'from-emerald-950/40 to-black',
      accentColor: '#10b981',
    };

    const nextInv = [...inventory, created];
    setInventory(nextInv);
    saveStoredInventory(nextInv);
    setShowAddModal(false);
    setNewProduct({
      name: '',
      category: 'Bouquet',
      price: 250,
      stock: 20,
      description: '',
    });
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-[#f5efe2] font-manrope selection:bg-[#f5efe2] selection:text-[#151510] flex flex-col justify-between">
      <Header />

      <main className="max-w-7xl mx-auto w-full px-6 pt-32 pb-24 custom:px-12">
        {/* Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5efe2]/50 mb-2">
              <LayoutDashboard className="w-3.5 h-3.5 text-[#f5efe2]" /> Greenhouse Operations
            </div>
            <h1 className="font-antonio text-5xl custom:text-7xl text-white tracking-wide">
              Management Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="h-10 px-5 rounded-full bg-[#f5efe2] text-[#151510] text-xs font-semibold uppercase tracking-wider hover:bg-white transition-all shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add New Flora
            </button>
          </div>
        </div>

        {/* Demo Warning Notice */}
        <div className="mb-8 p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-200/80 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong>Local Storage Management Console:</strong> Metrics and records displayed below are derived directly from actual browser storage transactions.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-6 backdrop-blur-md">
            <span className="text-[11px] uppercase tracking-wider text-[#f5efe2]/50 block mb-1">Total Revenue</span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-bold text-white">₹{totalRevenue.toFixed(2)}</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-[11px] text-emerald-400 mt-2">Realized from verified orders</p>
          </div>

          <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-6 backdrop-blur-md">
            <span className="text-[11px] uppercase tracking-wider text-[#f5efe2]/50 block mb-1">Total Orders</span>
            <div className="flex items-baseline justify-between">
              <span className="font-antonio text-4xl font-bold text-white">{totalOrdersCount}</span>
              <ShoppingBag className="w-5 h-5 text-[#f5efe2]" />
            </div>
            <p className="text-[11px] text-[#f5efe2]/60 mt-2">Dispatched to Rider 1 &amp; Rider 2</p>
          </div>

          <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-6 backdrop-blur-md">
            <span className="text-[11px] uppercase tracking-wider text-[#f5efe2]/50 block mb-1">Live Flower SKUs</span>
            <div className="flex items-baseline justify-between">
              <span className="font-antonio text-4xl font-bold text-white">{inventory.length}</span>
              <Package className="w-5 h-5 text-[#f5efe2]" />
            </div>
            <p className="text-[11px] text-[#f5efe2]/60 mt-2">Certified varieties in stock</p>
          </div>

          <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-6 backdrop-blur-md">
            <span className="text-[11px] uppercase tracking-wider text-[#f5efe2]/50 block mb-1">Low Stock Alerts</span>
            <div className="flex items-baseline justify-between">
              <span className="font-antonio text-4xl font-bold text-amber-400">{lowStockCount}</span>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-[11px] text-amber-300 mt-2">Below 8 units threshold</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-3 mb-8 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`text-xs font-semibold uppercase tracking-wider pb-1 transition-all ${
              activeTab === 'overview'
                ? 'text-white border-b-2 border-white'
                : 'text-[#f5efe2]/50 hover:text-white'
            }`}
          >
            Overview &amp; Top Flora
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`text-xs font-semibold uppercase tracking-wider pb-1 transition-all ${
              activeTab === 'inventory'
                ? 'text-white border-b-2 border-white'
                : 'text-[#f5efe2]/50 hover:text-white'
            }`}
          >
            Inventory Management
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`text-xs font-semibold uppercase tracking-wider pb-1 transition-all ${
              activeTab === 'orders'
                ? 'text-white border-b-2 border-white'
                : 'text-[#f5efe2]/50 hover:text-white'
            }`}
          >
            All Recorded Orders
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-8 backdrop-blur-md">
              <h3 className="font-antonio text-2xl text-white mb-6">Top-Selling Flowers</h3>
              {topSelling.length === 0 ? (
                <p className="text-xs text-[#f5efe2]/40 italic py-8 text-center">No transactions recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {topSelling.map((ts, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div>
                        <span className="font-medium text-white block">{ts.name}</span>
                        <span className="text-[#f5efe2]/50 font-mono">{ts.qty} stems / units sold</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-emerald-400">₹{ts.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-8 backdrop-blur-md">
              <h3 className="font-antonio text-2xl text-white mb-6">Recent Dispatches</h3>
              {orders.length === 0 ? (
                <p className="text-xs text-[#f5efe2]/40 italic py-8 text-center">No orders confirmed yet.</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((o) => (
                    <div key={o.orderId} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-mono font-bold text-white">#{o.invoiceNumber}</span>
                        <p className="text-[#f5efe2]/60 mt-0.5">{o.customerName} &bull; {o.rider}</p>
                      </div>
                      <span className="font-mono font-bold text-white">₹{o.finalTotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Inventory */}
        {activeTab === 'inventory' && (
          <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/50 text-[#f5efe2]/60 uppercase tracking-wider border-b border-white/5">
                  <tr>
                    <th className="p-5">ID</th>
                    <th className="p-5">Flower Name</th>
                    <th className="p-5">Category</th>
                    <th className="p-5">Price (₹)</th>
                    <th className="p-5">Stock Level</th>
                    <th className="p-5">Adjust Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="p-5 font-mono font-bold text-white">#{item.id}</td>
                      <td className="p-5 font-medium text-white">{item.name}</td>
                      <td className="p-5 text-[#f5efe2]/70">{item.category}</td>
                      <td className="p-5 font-mono">₹{item.price}</td>
                      <td className="p-5">
                        <span className={`font-mono font-bold ${item.stock <= 8 ? 'text-amber-400' : 'text-white'}`}>
                          {item.stock} units
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateStock(item.id, item.stock - 5)}
                            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStock(item.id, item.stock + 5)}
                            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStock(item.id, item.stock + 20)}
                            className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold"
                          >
                            +20 Restock
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Orders */}
        {activeTab === 'orders' && (
          <div className="rounded-3xl border border-[#f5efe2]/15 bg-[#0a0d14]/80 p-8 backdrop-blur-md">
            <h3 className="font-antonio text-2xl text-white mb-6">Master Order Ledger</h3>
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.invoiceNumber} className="p-4 rounded-xl border border-white/5 bg-black/40 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-mono font-bold text-white">#{o.invoiceNumber}</span> ({o.orderId})
                    <p className="text-[#f5efe2]/60 mt-1">{o.customerName} &bull; {o.customerType} &bull; {o.timestamp}</p>
                    <p className="text-[#f5efe2]/40 text-[11px] mt-0.5">{o.lines.map((l) => `${l.item.name} (×${l.quantity})`).join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 text-sm">₹{o.finalTotal.toFixed(2)}</span>
                    <span className="block text-[10px] text-[#f5efe2]/50 uppercase mt-0.5">{o.rider}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Add New Flora */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
            <div className="max-w-md w-full rounded-3xl border border-white/20 bg-[#0d1017] p-8 text-white shadow-2xl">
              <h3 className="font-antonio text-2xl mb-4">Add Floral Arrangement</h3>
              <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
                <div>
                  <label className="block uppercase text-[#f5efe2]/60 mb-1">Flower Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Blue Iris Bouquet"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full rounded-xl bg-black/50 border border-white/20 p-2.5 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase text-[#f5efe2]/60 mb-1">Category</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full rounded-xl bg-black/50 border border-white/20 p-2.5 text-sm"
                    >
                      <option value="Bouquet">Bouquet</option>
                      <option value="Garland">Garland</option>
                      <option value="Stem">Stem</option>
                      <option value="Loose">Loose</option>
                      <option value="Decor">Decor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block uppercase text-[#f5efe2]/60 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      className="w-full rounded-xl bg-black/50 border border-white/20 p-2.5 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block uppercase text-[#f5efe2]/60 mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                    className="w-full rounded-xl bg-black/50 border border-white/20 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block uppercase text-[#f5efe2]/60 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full rounded-xl bg-black/50 border border-white/20 p-2.5 text-sm"
                  />
                </div>
                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-full bg-[#f5efe2] text-[#151510] font-semibold uppercase tracking-wider"
                  >
                    Add to Catalog
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3 rounded-full border border-white/20 text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
