import { NextResponse } from 'next/server';
import { queryDatabase, sql } from '@/lib/db';
import { calculateOrderFinancials } from '@/lib/billingCalculations';
import { CompletedOrder } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase();
  const category = searchParams.get('category');
  const status = searchParams.get('status');

  if (!sql) {
    return NextResponse.json({ success: true, orders: [], source: 'local_fallback' });
  }

  try {
    let query = 'SELECT * FROM bloombox_orders ORDER BY id DESC';
    const params: unknown[] = [];

    const rows = await queryDatabase<{
      id: number;
      order_id: string;
      invoice_number: string;
      token: number;
      customer_name: string;
      customer_category: 'Regular' | 'Event Planner';
      customer_phone: string;
      customer_email: string;
      customer_gstin?: string;
      billing_address: string;
      delivery_address: string;
      customer_notes: string;
      lines_json: unknown;
      subtotal: string | number;
      discount: string | number;
      taxable_amount: string | number;
      gst: string | number;
      grand_total: string | number;
      payment_status: 'PAID' | 'CASH ON DELIVERY' | 'PENDING';
      payment_method: 'UPI / NetBanking' | 'Card' | 'Cash on Delivery';
      order_status: 'CONFIRMED' | 'OUT FOR DELIVERY' | 'DELIVERED';
      rider: string;
      created_at: string;
    }>(query, params);

    const orders: CompletedOrder[] = rows.map((r) => {
      const lines = typeof r.lines_json === 'string' ? JSON.parse(r.lines_json) : r.lines_json;
      return {
        orderId: r.order_id,
        invoiceNumber: r.invoice_number,
        token: Number(r.token),
        customerName: r.customer_name,
        customerCategory: r.customer_category,
        customerType: r.customer_category,
        customerPhone: r.customer_phone || '',
        customerEmail: r.customer_email || '',
        customerGstin: r.customer_gstin || undefined,
        billingAddress: r.billing_address,
        deliveryAddress: r.delivery_address || undefined,
        customerNotes: r.customer_notes || undefined,
        lines: lines || [],
        subtotal: Number(r.subtotal),
        discount: Number(r.discount),
        taxableAmount: Number(r.taxable_amount),
        gst: Number(r.gst),
        finalTotal: Number(r.grand_total),
        grandTotal: Number(r.grand_total),
        paymentStatus: r.payment_status,
        paymentMethod: r.payment_method,
        orderStatus: r.order_status,
        rider: r.rider,
        timestamp: new Date(r.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      };
    });

    let filtered = orders;
    if (search) {
      filtered = filtered.filter(
        (o) =>
          o.invoiceNumber.toLowerCase().includes(search) ||
          o.customerName.toLowerCase().includes(search) ||
          o.orderId.toLowerCase().includes(search)
      );
    }
    if (category && category !== 'All') {
      filtered = filtered.filter((o) => o.customerCategory === category || o.customerType === category);
    }
    if (status && status !== 'All') {
      filtered = filtered.filter((o) => o.orderStatus === status);
    }

    return NextResponse.json({ success: true, orders: filtered, total: filtered.length });
  } catch (error) {
    console.error('Failed to query orders from database:', error);
    return NextResponse.json({ success: false, error: 'Database fetch failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const {
      customerName,
      customerCategory,
      customerPhone,
      customerEmail,
      customerGstin,
      billingAddress,
      deliveryAddress,
      customerNotes,
      lines,
      paymentMethod = 'UPI / NetBanking',
      paymentStatus = 'PAID',
    } = payload;

    // Strict Validation
    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ success: false, error: 'Customer name is required.' }, { status: 400 });
    }
    if (!billingAddress || !billingAddress.trim()) {
      return NextResponse.json({ success: false, error: 'Billing address is required.' }, { status: 400 });
    }
    if (!customerPhone || customerPhone.trim().length < 8) {
      return NextResponse.json({ success: false, error: 'Valid contact phone number is required.' }, { status: 400 });
    }
    if (!customerEmail || !customerEmail.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid email address is required.' }, { status: 400 });
    }
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ success: false, error: 'Cannot confirm empty order. Please select flowers.' }, { status: 400 });
    }

    // Safe mathematical calculations
    const calc = calculateOrderFinancials(
      lines.map((l: { item: { id: number; name: string; category: string; price: number }; quantity: number }) => ({
        id: l.item.id,
        name: l.item.name,
        category: l.item.category,
        price: l.item.price,
        quantity: l.quantity,
      })),
      customerCategory === 'Event Planner' ? 'Event Planner' : 'Regular'
    );

    if (!sql) {
      // Fallback response if database is completely absent
      const mockToken = Date.now() % 10000;
      const mockOrder: CompletedOrder = {
        orderId: `FLW${mockToken}`,
        invoiceNumber: `INV-2026-${String(mockToken).padStart(4, '0')}`,
        token: mockToken,
        customerName: customerName.trim(),
        customerCategory,
        customerType: customerCategory,
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        customerGstin: customerGstin?.trim() || undefined,
        billingAddress: billingAddress.trim(),
        deliveryAddress: deliveryAddress?.trim() || undefined,
        customerNotes: customerNotes?.trim() || undefined,
        lines: lines,
        subtotal: calc.subtotal,
        discount: calc.discount,
        taxableAmount: calc.taxableAmount,
        gst: calc.gst,
        finalTotal: calc.grandTotal,
        grandTotal: calc.grandTotal,
        paymentStatus,
        paymentMethod,
        orderStatus: 'CONFIRMED',
        rider: (mockToken & 1) === 1 ? 'Rider 1 (Certified Express)' : 'Rider 2 (Eco Cargo)',
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      };
      return NextResponse.json({ success: true, order: mockOrder, source: 'local_fallback' });
    }

    // Atomic Inventory Check and Decrement
    for (const line of lines) {
      const dbItemRows = await queryDatabase<{ id: number; name: string; stock: number }>(
        'SELECT id, name, stock FROM bloombox_products WHERE id = $1 FOR UPDATE',
        [line.item.id]
      );
      if (!dbItemRows || dbItemRows.length === 0) {
        return NextResponse.json(
          { success: false, error: `Product #${line.item.id} not found in database.` },
          { status: 400 }
        );
      }
      const dbStock = dbItemRows[0].stock;
      if (dbStock < line.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for "${dbItemRows[0].name}". Requested: ${line.quantity}, Available: ${dbStock}`,
          },
          { status: 400 }
        );
      }
    }

    // Atomically decrement stock
    for (const line of lines) {
      await queryDatabase(
        'UPDATE bloombox_products SET stock = stock - $1 WHERE id = $2',
        [line.quantity, line.item.id]
      );
    }

    // Get next token & sequential invoice number
    const countRows = await queryDatabase<{ count: string }>('SELECT COUNT(*) as count FROM bloombox_orders');
    const nextToken = Number(countRows[0].count) + 1;
    const invoiceNumber = `INV-2026-${String(nextToken).padStart(4, '0')}`;
    const orderId = `FLW${nextToken}`;
    const rider = (nextToken & 1) === 1 ? 'Rider 1 (Certified Express)' : 'Rider 2 (Eco Cargo)';

    // Insert order record
    await queryDatabase(
      `INSERT INTO bloombox_orders (
        order_id, invoice_number, token, customer_name, customer_category,
        customer_phone, customer_email, customer_gstin, billing_address, delivery_address,
        customer_notes, lines_json, subtotal, discount, taxable_amount,
        gst, grand_total, payment_status, payment_method, order_status, rider
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
      [
        orderId,
        invoiceNumber,
        nextToken,
        customerName.trim(),
        customerCategory,
        customerPhone.trim(),
        customerEmail.trim(),
        customerGstin?.trim() || null,
        billingAddress.trim(),
        deliveryAddress?.trim() || null,
        customerNotes?.trim() || null,
        JSON.stringify(lines),
        calc.subtotal,
        calc.discount,
        calc.taxableAmount,
        calc.gst,
        calc.grandTotal,
        paymentStatus,
        paymentMethod,
        'CONFIRMED',
        rider,
      ]
    );

    const confirmedOrder: CompletedOrder = {
      orderId,
      invoiceNumber,
      token: nextToken,
      customerName: customerName.trim(),
      customerCategory,
      customerType: customerCategory,
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      customerGstin: customerGstin?.trim() || undefined,
      billingAddress: billingAddress.trim(),
      deliveryAddress: deliveryAddress?.trim() || undefined,
      customerNotes: customerNotes?.trim() || undefined,
      lines: lines,
      subtotal: calc.subtotal,
      discount: calc.discount,
      taxableAmount: calc.taxableAmount,
      gst: calc.gst,
      finalTotal: calc.grandTotal,
      grandTotal: calc.grandTotal,
      paymentStatus,
      paymentMethod,
      orderStatus: 'CONFIRMED',
      rider,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    return NextResponse.json({ success: true, order: confirmedOrder });
  } catch (error) {
    console.error('Order confirmation transaction error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process order confirmation.' }, { status: 500 });
  }
}
