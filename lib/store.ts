'use client';

export interface FlowerItem {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  imageColor: string;
  accentColor: string;
}

export interface CartItem {
  item: FlowerItem;
  quantity: number;
}

export interface CompletedOrder {
  orderId: string;
  token: number;
  customerName: string;
  customerType: 'Regular' | 'Event Planner';
  lines: CartItem[];
  subtotal: number;
  discount: number;
  gst: number;
  finalTotal: number;
  rider: string;
  timestamp: string;
}

export const INITIAL_PRODUCTS: FlowerItem[] = [
  {
    id: 101,
    name: 'Rose Bouquet',
    category: 'Bouquet',
    price: 450,
    stock: 15,
    description: 'Fresh crimson garden roses hand-tied with seasonal woodland foliage.',
    imageColor: 'from-rose-950/40 to-black',
    accentColor: '#ff4b72',
  },
  {
    id: 102,
    name: 'Jasmine Garland',
    category: 'Garland',
    price: 120,
    stock: 30,
    description: 'Intricately woven night-blooming white jasmine with sweet ceremonial fragrance.',
    imageColor: 'from-amber-950/30 to-black',
    accentColor: '#f5efe2',
  },
  {
    id: 103,
    name: 'Marigold (1 kg)',
    category: 'Loose',
    price: 90,
    stock: 25,
    description: 'Vibrant golden marigold blossoms harvested at peak morning vitality.',
    imageColor: 'from-orange-950/40 to-black',
    accentColor: '#f59e0b',
  },
  {
    id: 104,
    name: 'Orchid Stem',
    category: 'Stem',
    price: 150,
    stock: 20,
    description: 'Graceful arching purple and lavender Phalaenopsis orchid stem.',
    imageColor: 'from-purple-950/40 to-black',
    accentColor: '#a855f7',
  },
  {
    id: 105,
    name: 'Table Decoration',
    category: 'Decor',
    price: 800,
    stock: 8,
    description: 'Architectural botanical centerpiece designed for intimate nocturnal dining.',
    imageColor: 'from-emerald-950/40 to-black',
    accentColor: '#10b981',
  },
  {
    id: 106,
    name: 'Lily Bunch',
    category: 'Bouquet',
    price: 350,
    stock: 12,
    description: 'Velvety Asiatic oriental lilies accented with eucalyptus and fern.',
    imageColor: 'from-cyan-950/30 to-black',
    accentColor: '#06b6d4',
  },
];

const CART_STORAGE_KEY = 'bloombox_cart_items_v1';
const INVENTORY_STORAGE_KEY = 'bloombox_inventory_v1';
const ORDERS_STORAGE_KEY = 'bloombox_orders_v1';

export function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredCart(cart: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event('bloombox_cart_updated'));
  } catch (e) {
    console.error('Failed to save cart to localStorage', e);
  }
}

export function getStoredInventory(): FlowerItem[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_PRODUCTS;
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveStoredInventory(items: FlowerItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('bloombox_inventory_updated'));
  } catch (e) {
    console.error('Failed to save inventory to localStorage', e);
  }
}

export function getStoredOrders(): CompletedOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredOrders(orders: CompletedOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders to localStorage', e);
  }
}
