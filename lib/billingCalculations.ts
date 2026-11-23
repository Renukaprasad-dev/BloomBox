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
  srNo: number;
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitPricePaise: number;
  unitPrice: number;
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
  cgstPaise: number;
  cgst: number;
  sgstPaise: number;
  sgst: number;
  finalTotalPaise: number;
  finalTotal: number;
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
  igstRate: number;
  igstPercent: string;
  igstPaise: number;
  igst: number;
  deliveryChargesPaise: number;
  deliveryCharges: number;
  grandTotalPaise: number;
  grandTotal: number;
  amountInWords: string;
  jurisdiction: string;
  bankDetails: typeof STUDIO_BANK_DETAILS;
}

export const STUDIO_BANK_DETAILS = {
  bankName: 'HDFC Bank Ltd.',
  accountName: 'BloomBox Floriculture & Regenerative Design Pvt. Ltd.',
  accountNumber: '50200084729103',
  ifsc: 'HDFC0001234',
  branch: 'Highland Reserve Branch, Pune',
  upiId: 'bloombox@hdfcbank',
};

/**
 * Converts numeric INR currency into official Indian legal words format.
 * E.g., 1438.50 -> "Rupees One Thousand Four Hundred Thirty-Eight and Fifty Paise Only"
 */
export function numberToWordsINR(amount: number): string {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(num: number): string {
    if (num === 0) return '';
    let str = '';
    if (num >= 10000000) {
      str += inWords(Math.floor(num / 10000000)) + 'Crore ';
      num %= 10000000;
    }
    if (num >= 100000) {
      str += inWords(Math.floor(num / 100000)) + 'Lakh ';
      num %= 100000;
    }
    if (num >= 1000) {
      str += inWords(Math.floor(num / 1000)) + 'Thousand ';
      num %= 1000;
    }
    if (num >= 100) {
      str += inWords(Math.floor(num / 100)) + 'Hundred ';
      num %= 100;
    }
    if (num > 0) {
      if (num < 20) {
        str += a[num];
      } else {
        str += b[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + a[num % 10].trim() : '') + ' ';
      }
    }
    return str;
  }

  const rounded = Math.round(amount * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  let result = 'Rupees ' + (rupees === 0 ? 'Zero ' : inWords(rupees)).trim();
  if (paise > 0) {
    result += ' and ' + inWords(paise).trim() + ' Paise';
  }
  return result + ' Only';
}

export function calculateOrderFinancials(
  rawLines: RawLineInput[],
  customerCategory: 'Regular' | 'Event Planner' = 'Regular',
  isInterState = false
): BillingCalculationResult {
  const isWholesale = customerCategory === 'Event Planner';
  const discountRate = isWholesale ? 0.15 : 0.0;
  const gstRate = 0.05; // 5% total statutory GST
  const cgstRate = isInterState ? 0.0 : 0.025; // 2.5% Central GST
  const sgstRate = isInterState ? 0.0 : 0.025; // 2.5% State GST
  const igstRate = isInterState ? 0.05 : 0.0; // 5.0% Integrated GST

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
    const taxableAmountPaise = lineGrossPaise - discountPaise;

    const lineGstPaise = Math.round(taxableAmountPaise * gstRate);
    const cgstPaise = isInterState ? 0 : Math.floor(lineGstPaise / 2);
    const sgstPaise = isInterState ? 0 : lineGstPaise - cgstPaise;
    const finalTotalPaise = taxableAmountPaise + lineGstPaise;

    return {
      srNo: idx + 1,
      id,
      sku: `BB-${id}`,
      name,
      description,
      category,
      quantity,
      unit,
      unitPricePaise,
      unitPrice: unitPricePaise / 100,
      discountRate,
      discountPercent: isWholesale ? '15%' : '0%',
      discountPaise,
      discount: discountPaise / 100,
      taxableAmountPaise,
      taxableAmount: taxableAmountPaise / 100,
      gstRate,
      gstPercent: '5.0%',
      gstPaise: lineGstPaise,
      gst: lineGstPaise / 100,
      cgstPaise,
      cgst: cgstPaise / 100,
      sgstPaise,
      sgst: sgstPaise / 100,
      finalTotalPaise,
      finalTotal: finalTotalPaise / 100,
      lineTotalPaise: lineGrossPaise,
      lineTotal: lineGrossPaise / 100,
    };
  });

  const subtotalPaise = lines.reduce((acc, l) => acc + l.lineTotalPaise, 0);
  const discountPaise = Math.round(subtotalPaise * discountRate);
  const taxableAmountPaise = subtotalPaise - discountPaise;
  const gstPaise = Math.round(taxableAmountPaise * gstRate);

  // Exact division for CGST and SGST ensuring cgstPaise + sgstPaise === gstPaise
  const cgstPaise = isInterState ? 0 : Math.floor(gstPaise / 2);
  const sgstPaise = isInterState ? 0 : gstPaise - cgstPaise;
  const igstPaise = isInterState ? gstPaise : 0;

  const deliveryChargesPaise = 0; // Complimentary zero-emission courier
  const grandTotalPaise = taxableAmountPaise + gstPaise + deliveryChargesPaise;
  const grandTotal = grandTotalPaise / 100;

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
    cgstPercent: isInterState ? '0%' : '2.5%',
    cgstPaise,
    cgst: cgstPaise / 100,
    sgstRate,
    sgstPercent: isInterState ? '0%' : '2.5%',
    sgstPaise,
    sgst: sgstPaise / 100,
    igstRate,
    igstPercent: isInterState ? '5.0%' : '0%',
    igstPaise,
    igst: igstPaise / 100,
    deliveryChargesPaise,
    deliveryCharges: 0,
    grandTotalPaise,
    grandTotal,
    amountInWords: numberToWordsINR(grandTotal),
    jurisdiction: isInterState
      ? 'Inter-State Supply (IGST Applicable)'
      : 'Intra-State Supply (Maharashtra, State Code: 27)',
    bankDetails: STUDIO_BANK_DETAILS,
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
