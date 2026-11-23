/**
 * Shared Indian retail statutory billing calculation engine for BloomBox.
 * Operates on integer paise to eliminate floating-point rounding errors.
 */

export interface RawLineInput {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

export interface CalculatedLine {
  id: number;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unitPricePaise: number;
  unitPrice: number;
  discountPaise: number;
  discount: number;
  lineTotalPaise: number;
  lineTotal: number;
}

export interface BillingCalculationResult {
  lines: CalculatedLine[];
  subtotalPaise: number;
  subtotal: number;
  discountRate: number;
  discountPaise: number;
  discount: number;
  taxableAmountPaise: number;
  taxableAmount: number;
  gstRate: number;
  gstPaise: number;
  gst: number;
  grandTotalPaise: number;
  grandTotal: number;
}

export function calculateOrderFinancials(
  rawLines: RawLineInput[],
  customerCategory: 'Regular' | 'Event Planner'
): BillingCalculationResult {
  const discountRate = customerCategory === 'Event Planner' ? 0.15 : 0.0;
  const gstRate = 0.05;

  const lines: CalculatedLine[] = rawLines.map((item) => {
    const unitPricePaise = Math.round(item.price * 100);
    const lineTotalPaise = unitPricePaise * item.quantity;
    const discountPaise = Math.round(lineTotalPaise * discountRate);

    return {
      id: item.id,
      sku: `BB-${item.id}`,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unitPricePaise,
      unitPrice: unitPricePaise / 100,
      discountPaise,
      discount: discountPaise / 100,
      lineTotalPaise,
      lineTotal: lineTotalPaise / 100,
    };
  });

  const subtotalPaise = lines.reduce((acc, l) => acc + l.lineTotalPaise, 0);
  const discountPaise = Math.round(subtotalPaise * discountRate);
  const taxableAmountPaise = subtotalPaise - discountPaise;
  const gstPaise = Math.round(taxableAmountPaise * gstRate);
  const grandTotalPaise = taxableAmountPaise + gstPaise;

  return {
    lines,
    subtotalPaise,
    subtotal: subtotalPaise / 100,
    discountRate,
    discountPaise,
    discount: discountPaise / 100,
    taxableAmountPaise,
    taxableAmount: taxableAmountPaise / 100,
    gstRate,
    gstPaise,
    gst: gstPaise / 100,
    grandTotalPaise,
    grandTotal: grandTotalPaise / 100,
  };
}

/** Format currency safely with ₹ */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
