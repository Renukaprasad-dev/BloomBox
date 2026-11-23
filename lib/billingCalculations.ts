/**
 * Centralized Indian retail statutory billing calculation engine for BloomBox.
 * Operates on integer paise to eliminate floating-point rounding errors.
 */

import { FlowerItem } from './store';

export interface RawLineInput {
  id?: number;
  sku?: string;
  name?: string;
  category?: string;
  price?: number;
  quantity: number;
  item?: FlowerItem;
}

export interface CalculatedLine {
  id: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
  description: string;
  quantity: number;
  unitPricePaise: number;
  unitPrice: number;
  discountPaise: number;
  discount: number;
  taxableTotalPaise: number;
  taxableTotal: number;
  lineTotalPaise: number;
  lineTotal: number;
}

export interface BillingCalculationResult {
  lines: CalculatedLine[];
  subtotalPaise: number;
  subtotal: number;
  discountRate: number;
  discountPercent: string;
  discountPaise: number;
  discount: number;
  taxableAmountPaise: number;
  taxableAmount: number;
  gstRate: number;
  gstPercent: string;
  gstPaise: number;
  gst: number;
  cgstRate: number;
  cgstPercent: string;
  cgstPaise: number;
  cgst: number;
  sgstRate: number;
  sgstPercent: string;
  sgstPaise: number;
  sgst: number;
  grandTotalPaise: number;
  grandTotal: number;
  jurisdiction: string;
}

export function calculateOrderFinancials(
  rawLines: RawLineInput[],
  customerCategory: 'Regular' | 'Event Planner' = 'Regular'
): BillingCalculationResult {
  const isWholesale = customerCategory === 'Event Planner';
  const discountRate = isWholesale ? 0.15 : 0.0;
  const gstRate = 0.05; // 5% total statutory GST
  const cgstRate = 0.025; // 2.5% Central GST
  const sgstRate = 0.025; // 2.5% State GST

  const lines: CalculatedLine[] = rawLines.map((entry, idx) => {
    const id = entry.item?.id ?? entry.id ?? 100 + idx + 1;
    const name = entry.item?.name ?? entry.name ?? 'Botanical Specimen';
    const category = entry.item?.category ?? entry.category ?? 'Bouquet';
    const unit = entry.item?.stemCount ?? 'Handcrafted Arrangement';
    const description = entry.item?.description ?? 'Fresh nursery harvested flora.';
    const rawPrice = entry.item?.price ?? entry.price ?? 0;
    const quantity = Math.max(1, entry.quantity || 1);

    const unitPricePaise = Math.round(rawPrice * 100);
    const lineGrossPaise = unitPricePaise * quantity;
    const discountPaise = Math.round(lineGrossPaise * discountRate);
    const taxableTotalPaise = lineGrossPaise - discountPaise;

    return {
      id,
      sku: `BB-${id}`,
      name,
      category,
      unit,
      description,
      quantity,
      unitPricePaise,
      unitPrice: unitPricePaise / 100,
      discountPaise,
      discount: discountPaise / 100,
      taxableTotalPaise,
      taxableTotal: taxableTotalPaise / 100,
      lineTotalPaise: lineGrossPaise,
      lineTotal: lineGrossPaise / 100,
    };
  });

  const subtotalPaise = lines.reduce((acc, l) => acc + l.lineTotalPaise, 0);
  const discountPaise = Math.round(subtotalPaise * discountRate);
  const taxableAmountPaise = subtotalPaise - discountPaise;
  const gstPaise = Math.round(taxableAmountPaise * gstRate);

  // Exact split for CGST and SGST ensuring cgstPaise + sgstPaise === gstPaise
  const cgstPaise = Math.floor(gstPaise / 2);
  const sgstPaise = gstPaise - cgstPaise;

  const grandTotalPaise = taxableAmountPaise + gstPaise;

  return {
    lines,
    subtotalPaise,
    subtotal: subtotalPaise / 100,
    discountRate,
    discountPercent: isWholesale ? '15%' : '0%',
    discountPaise,
    discount: discountPaise / 100,
    taxableAmountPaise,
    taxableAmount: taxableAmountPaise / 100,
    gstRate,
    gstPercent: '5.0%',
    gstPaise,
    gst: gstPaise / 100,
    cgstRate,
    cgstPercent: '2.5%',
    cgstPaise,
    cgst: cgstPaise / 100,
    sgstRate,
    sgstPercent: '2.5%',
    sgstPaise,
    sgst: sgstPaise / 100,
    grandTotalPaise,
    grandTotal: grandTotalPaise / 100,
    jurisdiction: 'Intra-State Supply (Maharashtra, State Code: 27)',
  };
}

/** Format currency safely with INR ₹ */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
