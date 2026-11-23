'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompletedOrder } from './store';
import { formatINR } from './billingCalculations';

export const STUDIO_CONFIG = {
  name: 'BLOOMBOX BOTANICAL SANCTUARY',
  legalName: 'BloomBox Floriculture & Regenerative Design Pvt. Ltd.',
  address: 'BloomBox Pavilion, Valley Reserve, Highland Estate, Pune - 411001, Maharashtra, India',
  phone: '+91 (800) 425-6629 / +91 98230 45678',
  email: 'orders@bloombox.studio',
  gstin: process.env.NEXT_PUBLIC_STUDIO_GSTIN || '27AABCB1234F1Z9',
  pan: 'AABCB1234F',
};

/**
 * Builds an authentic, vector A4 PDF invoice using jsPDF and autoTable.
 */
export function generateInvoiceDocument(order: CompletedOrder): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Header Background Bar
  doc.setFillColor(10, 14, 20); // Deep botanical dark
  doc.rect(0, 0, pageWidth, 32, 'F');

  // BloomBox Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(245, 239, 226); // Cream
  doc.text('BLOOMBOX', margin, 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 195, 185);
  doc.text('REGENERATIVE FLORAL SANCTUARY & HAUTE BOTANICAL LOGISTICS', margin, 20);
  doc.text(`${STUDIO_CONFIG.address} | Phone: ${STUDIO_CONFIG.phone}`, margin, 25);

  // Top Right "TAX INVOICE" Badge
  doc.setFillColor(245, 239, 226);
  doc.roundedRect(pageWidth - margin - 40, 8, 40, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(21, 21, 16);
  doc.text('TAX INVOICE', pageWidth - margin - 20, 15, { align: 'center' });
  doc.setFontSize(7);
  doc.text('ORIGINAL FOR RECIPIENT', pageWidth - margin - 20, 19, { align: 'center' });

  // Metadata Block: Invoice #, Date, Order ID, Dispatch Token
  let y = 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);

  // Left side: Invoice details
  doc.text(`Invoice No: ${order.invoiceNumber}`, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`Invoice Date & Time: ${order.timestamp}`, margin, y + 5);
  doc.text(`Order ID: ${order.orderId} (Sequential Token #${order.token})`, margin, y + 10);
  doc.text(`GSTIN: ${STUDIO_CONFIG.gstin} | PAN: ${STUDIO_CONFIG.pan}`, margin, y + 15);

  // Right side: Dispatch & Payment Status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  doc.text(`Courier Allocation:`, pageWidth - margin, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 120, 70); // Green
  doc.text(`${order.rider}`, pageWidth - margin, y + 5, { align: 'right' });
  doc.setTextColor(60, 60, 60);
  doc.text(`Payment Status: ${order.paymentStatus || 'PAID'}`, pageWidth - margin, y + 10, { align: 'right' });
  doc.text(`Payment Mode: ${order.paymentMethod || 'UPI / NetBanking'}`, pageWidth - margin, y + 15, { align: 'right' });

  // Divider
  y += 22;
  doc.setDrawColor(210, 210, 210);
  doc.line(margin, y, pageWidth - margin, y);

  // Customer Information (Two-column: Billed To / Shipped To)
  y += 6;
  const colWidth = (contentWidth - 6) / 2;

  // Billed To Box
  doc.setFillColor(248, 248, 246);
  doc.roundedRect(margin, y, colWidth, 34, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('BILLED TO (CUSTOMER DETAILS)', margin + 3, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(10, 10, 10);
  doc.text(order.customerName, margin + 3, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(`Category: ${order.customerCategory || order.customerType} (${order.customerCategory === 'Event Planner' ? '15% Wholesale Member' : 'Retail Standard'})`, margin + 3, y + 16);
  doc.text(`Phone: ${order.customerPhone || 'N/A'} | Email: ${order.customerEmail || 'N/A'}`, margin + 3, y + 21);
  const splitBillAddr = doc.splitTextToSize(`Address: ${order.billingAddress || 'N/A'}`, colWidth - 6);
  doc.text(splitBillAddr, margin + 3, y + 26);

  // Delivery Destination Box
  const rightColX = margin + colWidth + 6;
  doc.setFillColor(248, 248, 246);
  doc.roundedRect(rightColX, y, colWidth, 34, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('DELIVERY / COURIER DESTINATION', rightColX + 3, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(10, 10, 10);
  doc.text(`Recipient: ${order.customerName}`, rightColX + 3, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(`Courier Service: ${order.rider}`, rightColX + 3, y + 16);
  const deliveryAddr = order.deliveryAddress || order.billingAddress || 'Studio Pickup';
  const splitDelivAddr = doc.splitTextToSize(`Destination: ${deliveryAddr}`, colWidth - 6);
  doc.text(splitDelivAddr, rightColX + 3, y + 21);
  if (order.customerNotes) {
    doc.text(`Instructions: ${order.customerNotes}`, rightColX + 3, y + 30);
  }

  // Product Table using autoTable
  y += 40;
  const tableData = order.lines.map((line, idx) => {
    const unitPrice = line.item.price;
    const qty = line.quantity;
    const discountRate = order.customerCategory === 'Event Planner' ? 0.15 : 0;
    const lineDiscount = unitPrice * qty * discountRate;
    const lineTotal = unitPrice * qty - lineDiscount;

    return [
      String(idx + 1),
      `BB-${line.item.id}`,
      line.item.name,
      line.item.category,
      String(qty),
      `Rs. ${unitPrice.toFixed(2)}`,
      discountRate > 0 ? `- Rs. ${lineDiscount.toFixed(2)}` : 'Rs. 0.00',
      `Rs. ${lineTotal.toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'SKU', 'Floral Arrangement', 'Category', 'Qty', 'Unit Rate', 'Discount', 'Taxable Total']],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 35],
      textColor: [245, 239, 226],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 30, 30],
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 50 },
      3: { cellWidth: 22 },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 26, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [252, 252, 250],
    },
  });

  // Calculate final Y after table
  // @ts-expect-error autoTable extends jsPDF instance
  let finalY = doc.lastAutoTable.finalY + 6;

  // Check if we need to add a new page for the summary if table ends too low
  if (finalY > 215) {
    doc.addPage();
    finalY = 20;
  }

  // Summary & Totals Block (Right-aligned)
  const summaryBoxWidth = 85;
  const summaryX = pageWidth - margin - summaryBoxWidth;

  doc.setFillColor(248, 248, 246);
  doc.roundedRect(summaryX, finalY, summaryBoxWidth, 42, 1.5, 1.5, 'F');
  doc.setDrawColor(210, 210, 210);
  doc.roundedRect(summaryX, finalY, summaryBoxWidth, 42, 1.5, 1.5, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  let sumY = finalY + 6;
  doc.text('Subtotal:', summaryX + 4, sumY);
  doc.text(`Rs. ${order.subtotal.toFixed(2)}`, pageWidth - margin - 4, sumY, { align: 'right' });

  sumY += 5.5;
  const discPercent = order.customerCategory === 'Event Planner' ? '15%' : '0%';
  doc.text(`Wholesale Discount (${discPercent}):`, summaryX + 4, sumY);
  doc.setTextColor(16, 120, 70);
  doc.text(`- Rs. ${order.discount.toFixed(2)}`, pageWidth - margin - 4, sumY, { align: 'right' });

  sumY += 5.5;
  doc.setTextColor(60, 60, 60);
  doc.text('Net Taxable Amount:', summaryX + 4, sumY);
  doc.text(`Rs. ${order.taxableAmount.toFixed(2)}`, pageWidth - margin - 4, sumY, { align: 'right' });

  sumY += 5.5;
  doc.text('CGST + SGST (5.0%):', summaryX + 4, sumY);
  doc.text(`Rs. ${order.gst.toFixed(2)}`, pageWidth - margin - 4, sumY, { align: 'right' });

  sumY += 7;
  doc.setDrawColor(180, 180, 180);
  doc.line(summaryX + 2, sumY - 2, pageWidth - margin - 2, sumY - 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(10, 14, 25);
  doc.text('Grand Total:', summaryX + 4, sumY + 3);
  doc.text(`Rs. ${order.finalTotal.toFixed(2)}`, pageWidth - margin - 4, sumY + 3, { align: 'right' });

  // Left side notes: Terms and Authorized Signatory
  const notesWidth = contentWidth - summaryBoxWidth - 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 70, 70);
  doc.text('TERMS & CONDITIONS:', margin, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  const termsText = [
    '1. Fresh floral specimens are perishable and certified hand-inspected upon courier dispatch.',
    '2. Store in fresh water at 16–22°C away from direct drafts to maximize vase life.',
    '3. This invoice is digitally generated under GST statutory rules and constitutes a valid tax document.',
  ];
  termsText.forEach((t, i) => {
    doc.text(t, margin, finalY + 11 + i * 4.5);
  });

  // Authorized Signature Box
  const sigY = finalY + 28;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, sigY + 12, margin + 45, sigY + 12);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('For BLOOMBOX FLORAL STUDIO', margin, sigY + 9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Authorized Signatory', margin, sigY + 16);

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);

    const footerY = 290;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

    doc.text(
      'Thank you for nurturing nature with BloomBox. Handcrafted with organic botanical integrity.',
      margin,
      footerY
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  }

  return doc;
}

/**
 * Downloads the invoice PDF with proper naming: BloomBox_INV-2026-0001.pdf
 */
export function downloadInvoicePdf(order: CompletedOrder): void {
  const doc = generateInvoiceDocument(order);
  const filename = `BloomBox_${order.invoiceNumber}.pdf`;
  doc.save(filename);
}

/**
 * Shares the invoice via Web Share API when supported, or falls back to download.
 */
export async function shareInvoicePdf(order: CompletedOrder): Promise<boolean> {
  const doc = generateInvoiceDocument(order);
  const filename = `BloomBox_${order.invoiceNumber}.pdf`;

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const blob = doc.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `BloomBox Invoice ${order.invoiceNumber}`,
          text: `Your official BloomBox tax invoice for order #${order.orderId} (Grand Total: ${formatINR(order.finalTotal)}).`,
          files: [file],
        });
        return true;
      }
    } catch (e) {
      console.warn('Web Share API aborted or failed, falling back to download:', e);
    }
  }

  // Fallback to direct download
  downloadInvoicePdf(order);
  return false;
}
