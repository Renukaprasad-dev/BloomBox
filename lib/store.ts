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
  imageUrl: string;
  collectionName: string;
  botanicalOrigin?: string;
  stemCount?: string;
}

export interface CartItem {
  item: FlowerItem;
  quantity: number;
}

export interface CompletedOrder {
  orderId: string;
  invoiceNumber: string;
  token: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  billingAddress?: string;
  customerType: 'Regular' | 'Event Planner';
  lines: CartItem[];
  subtotal: number;
  discount: number;
  taxableAmount: number;
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
    description: 'Fresh crimson garden roses hand-tied with seasonal woodland foliage and eucalyptus.',
    imageColor: 'from-rose-950/40 to-black',
    accentColor: '#ff4b72',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80',
    collectionName: 'Rose Collection',
    botanicalOrigin: 'Highland Mountain Valleys',
    stemCount: '12 Luxury Stems',
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
    imageUrl: 'https://images.unsplash.com/photo-1592727137075-cad6ec46fe36?auto=format&fit=crop&w=1000&q=80',
    collectionName: 'Jasmine Collection',
    botanicalOrigin: 'Nocturnal Shaded Orchards',
    stemCount: 'Standard 4ft Garland',
  },
  {
    id: 103,
    name: 'Marigold (1 kg)',
    category: 'Loose',
    price: 90,
    stock: 25,
    description: 'Vibrant golden marigold blossoms harvested at peak morning vitality for festive decor.',
    imageColor: 'from-orange-950/40 to-black',
    accentColor: '#f59e0b',
    imageUrl: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=1000&q=80',
    collectionName: 'Golden Harvest',
    botanicalOrigin: 'Sunlit Terraced Fields',
    stemCount: '1 Kilogram Loose Heads',
  },
  {
    id: 104,
    name: 'Orchid Stem',
    category: 'Stem',
    price: 150,
    stock: 20,
    description: 'Graceful arching purple and lavender Phalaenopsis orchid stem with delicate velvet petals.',
    imageColor: 'from-purple-950/40 to-black',
    accentColor: '#a855f7',
    imageUrl: 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1000&q=80',
    collectionName: 'Orchid Elegance',
    botanicalOrigin: 'Humid Rainforest Greenhouses',
    stemCount: '1 Specimen Stem (6–8 Blooms)',
  },
  {
    id: 105,
    name: 'Table Decoration',
    category: 'Decor',
    price: 800,
    stock: 8,
    description: 'Architectural botanical centerpiece designed for intimate nocturnal dining and banquets.',
    imageColor: 'from-emerald-950/40 to-black',
    accentColor: '#10b981',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
    collectionName: 'Celebration Decor',
    botanicalOrigin: 'Artisan Floral Workshop',
    stemCount: 'Full Structural Arrangement',
  },
  {
    id: 106,
    name: 'Lily Bunch',
    category: 'Bouquet',
    price: 350,
    stock: 12,
    description: 'Velvety Asiatic oriental lilies accented with fresh eucalyptus sprigs and forest fern.',
    imageColor: 'from-cyan-950/30 to-black',
    accentColor: '#06b6d4',
    imageUrl: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=1000&q=80',
    collectionName: 'Lily Collection',
    botanicalOrigin: 'Sub-Alpine River Banks',
    stemCount: '5 Premium Lily Stalks',
  },
];

const CART_STORAGE_KEY = 'bloombox_cart_items_v2';
const INVENTORY_STORAGE_KEY = 'bloombox_inventory_v3';
const ORDERS_STORAGE_KEY = 'bloombox_orders_v2';

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
    if (!raw) {
      saveStoredInventory(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    // Ensure all items have imageUrl and collectionName
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].imageUrl) {
      return parsed;
    }
    saveStoredInventory(INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
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
    window.dispatchEvent(new Event('bloombox_orders_updated'));
  } catch (e) {
    console.error('Failed to save orders to localStorage', e);
  }
}
