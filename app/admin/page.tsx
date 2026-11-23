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
  Lock,
  Unlock,
  Key,
  RefreshCw,
  Database,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [inventory, setInventory] = useState<FlowerItem[]>([]);
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'orders'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [dataSource, setDataSource] = useState<'neon' | 'local'>('local');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

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
    // Check if session is authenticated
    if (typeof window !== 'undefined') {
      const savedAuth = sessionStorage.getItem('bloombox_admin_auth');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
      }
    }

    setInventory(getStoredInventory());
    setOrders(getStoredOrders());
    fetchDatabaseProducts();
  }, []);

  const fetchDatabaseProducts = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          setInventory(data.products);
          saveStoredInventory(data.products);
          setDataSource(data.source === 'neon' ? 'neon' : 'local');
        }
      }
    } catch {
      // Keep local
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setPasscodeError('');

    const targetCode = 'bloombox@2026';
    if (passcodeInput.trim() === targetCode) {
      setIsAuthenticated(true);
      sessionStorage.setItem('bloombox_admin_auth', 'true');
      sessionStorage.setItem('bloombox_admin_pass', passcodeInput.trim());
      setPasscodeInput('');
    } else {
      setPasscodeError('Invalid passcode. Please use the administrative key.');
    }
    setIsVerifying(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('bloombox_admin_auth');
    sessionStorage.removeItem('bloombox_admin_pass');
  };

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

  const handleUpdateStock = async (productId: number, newStock: number) => {
    const safeStock = Math.max(0, newStock);
    const updated = inventory.map((item) =>
      item.id === productId ? { ...item, stock: safeStock } : item
    );
    setInventory(updated);
    saveStoredInventory(updated);

    // Sync with database API
    const pass = sessionStorage.getItem('bloombox_admin_pass') || 'bloombox@2026';
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_stock',
          passcode: pass,
          productId,
          newStock: safeStock,
        }),
      });
      setSyncMessage(`Stock for #${productId} synced.`);
      setTimeout(() => setSyncMessage(''), 3000);
    } catch {
      // Local fallback handled
    }
  };

  const handleUpdatePrice = async (productId: number, newPrice: number) => {
    const safePrice = Math.max(1, newPrice);
    const updated = inventory.map((item) =>
      item.id === productId ? { ...item, price: safePrice } : item
    );
    setInventory(updated);
    saveStoredInventory(updated);

    const pass = sessionStorage.getItem('bloombox_admin_pass') || 'bloombox@2026';
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_price',
          passcode: pass,
          productId,
          newPrice: safePrice,
        }),
      });
      setSyncMessage(`Price for #${productId} updated.`);
      setTimeout(() => setSyncMessage(''), 3000);
    } catch {
      // Local fallback handled
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
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
      imageUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1000&q=80',
      collectionName: `${newProduct.name.trim()} Collection`,
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

    const pass = sessionStorage.getItem('bloombox_admin_pass') || 'bloombox@2026';
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_product',
          passcode: pass,
          product: created,
        }),
      });
      setSyncMessage(`Created ${created.name} in master catalog.`);
      setTimeout(() => setSyncMessage(''), 3000);
    } catch {
      // Local fallback handled
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-[#f5efe2] font-manrope selection:bg-[#f5efe2] selection:text-[#151510] flex flex-col justify-between">
      <Header />

      <main className="max-w-7xl mx-auto w-full px-6 pt-32 pb-24 custom:px-12">
        {/* Passcode Protection Gate */}
        {!isAuthenticated ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-md w-full rounded-3xl border border-white/15 bg-[#0a0d14]/90 p-8 sm:p-10 backdrop-blur-xl shadow-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-amber-400" />
              </div>
              <h1 className="font-antonio text-3xl sm:text-4xl text-white tracking-wide mb-2">
                Operations Portal
              </h1>
              <p className="text-xs text-[#f5efe2]/60 mb-8 leading-relaxed">
                Enter your authorized studio passcode to access live inventory telemetry, dispatch logs, and pricing controls.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Key className="w-4 h-4 text-[#f5efe2]/40 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Enter Admin Passcode"
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-black/50 border border-white/20 text-sm text-white focus:outline-none focus:border-white transition-all font-mono"
                    autoFocus
                  />
                </div>

                {passcodeError && (
                  <p className="text-xs text-rose-400 text-left flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {passcodeError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isVerifying || !passcodeInput.trim()}
                  className="w-full h-12 rounded-xl bg-[#f5efe2] text-[#151510] text-xs font-semibold uppercase tracking-wider hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" /> Authenticate &amp; Enter
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/10 text-[11px] text-[#f5efe2]/40 flex items-center justify-center gap-2">
                <span>Default Studio Passcode:</span>
                <code className="text-amber-300 font-mono bg-white/5 px-2 py-0.5 rounded">bloombox@2026</code>
              </div>
            </div>
          </div>
        ) : (
          <div>
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
                  onClick={fetchDatabaseProducts}
                  disabled={isSyncing}
                  className="h-10 px-4 rounded-full border border-white/20 hover:border-white/40 text-xs font-semibold uppercase tracking-wider text-white transition-all flex items-center gap-2"
                  title="Refresh from Neon DB"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="h-10 px-5 rounded-full bg-[#f5efe2] text-[#151510] text-xs font-semibold uppercase tracking-wider hover:bg-white transition-all shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add New Flora
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="h-10 px-4 rounded-full border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  Lock
                </button>
              </div>
            </div>

            {/* Status Bar */}
            <div className="mb-8 p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-xs text-[#f5efe2]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                <p>
                  <strong>Persistence Engine:</strong>{' '}
                  {dataSource === 'neon' ? (
                    <span className="text-emerald-300">Connected to Neon PostgreSQL (`bloombox_products`, `bloombox_orders`)</span>
                  ) : (
                    <span className="text-amber-300">Local Cache Active with PostgreSQL sync ready</span>
                  )}
                </p>
              </div>
              {syncMessage && (
                <span className="text-emerald-300 font-mono text-[11px] animate-pulse">
                  {syncMessage}
                </span>
              )}
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
                          <td className="p-5 font-mono">
                            <input
                              type="number"
                              min="1"
                              value={item.price}
                              onChange={(e) => handleUpdatePrice(item.id, Number(e.target.value))}
                              className="w-20 px-2 py-1 bg-white/5 border border-white/20 rounded font-mono text-white text-xs"
                            />
                          </td>
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
                {orders.length === 0 ? (
                  <p className="text-xs text-[#f5efe2]/40 italic py-8 text-center">No transactions recorded yet.</p>
                ) : (
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
                )}
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
                          <option value="Loose Flowers">Loose Flowers</option>
                          <option value="Exotic Stem">Exotic Stem</option>
                          <option value="Centerpiece">Centerpiece</option>
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
                      <label className="block uppercase text-[#f5efe2]/60 mb-1">Initial Stock</label>
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
                        rows={3}
                        placeholder="Curated botanical notes..."
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        className="w-full rounded-xl bg-black/50 border border-white/20 p-2.5 text-sm"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/5 uppercase tracking-wider text-[11px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-full bg-[#f5efe2] text-[#151510] font-semibold hover:bg-white uppercase tracking-wider text-[11px]"
                      >
                        Save SKU
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
