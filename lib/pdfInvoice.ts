'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompletedOrder } from './store';
import { calculateOrderFinancials, formatINR } from './billingCalculations';

export const STUDIO_CONFIG = {
  name: 'BLOOMBOX BOTANICAL SANCTUARY',
  legalName: 'BloomBox Floriculture & Regenerative Design Pvt. Ltd.',
  tagline: 'Regenerative Botanical Sanctuary & Greenhouse Dispatch',
  address: 'BloomBox Pavilion, Valley Reserve, Highland Estate, Pune - 411001, Maharashtra, India',
  phone: '+91 (800) 425-6629 / +91 98230 45678',
  email: 'orders@bloombox.studio',
  supportEmail: 'concierge@bloombox.studio',
  gstin: process.env.NEXT_PUBLIC_STUDIO_GSTIN || '27AABCB1234F1Z9',
  pan: 'AABCB1234F',
  state: 'Maharashtra',
  stateCode: '27',
};

/**
 * Builds an authentic, vector A4 Tax Invoice PDF using jsPDF and autoTable.
 * Strictly adheres to Indian Retail GST Tax Invoice standards.
 */
export function generateInvoiceDocument(order: CompletedOrder, isDuplicate = false): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Ensure calculations are sourced from the centralized integer paise engine
  const calc = calculateOrderFinancials(
    order.lines.map((l) => ({
      id: l.item.id,
      name: l.item.name,
      category: l.item.category,
      price: l.item.price,
      quantity: l.quantity,
      item: l.item,
    })),
    order.customerCategory || order.customerType
  );

  // 1. Top Header Background Bar (Deep obsidian botanical dark)
  doc.setFillColor(10, 14, 20);
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Gold accent accent line
  doc.setFillColor(212, 175, 55); // Gold
  doc.rect(0, 33.2, pageWidth, 0.8, 'F');

  // BloomBox Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(245, 239, 226); // Warm Cream
  doc.text('BLOOMBOX', margin, 13);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(215, 210, 200);
  doc.text(STUDIO_CONFIG.tagline.toUpperCase(), margin, 18.5);
  doc.text(STUDIO_CONFIG.address, margin, 23.5);
  doc.text(
    `Phone: ${STUDIO_CONFIG.phone}  |  Email: ${STUDIO_CONFIG.email}`,
    margin,
    28
  );

  // Top Right "TAX INVOICE" Badge
  const badgeWidth = 44;
  const badgeX = pageWidth - margin - badgeWidth;
  doc.setFillColor(245, 239, 226);
  doc.roundedRect(badgeX, 7, badgeWidth, 19, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 20, 28);
  doc.text('TAX INVOICE', badgeX + badgeWidth / 2, 14, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text(
    isDuplicate ? 'DUPLICATE FOR TRANSPORTER' : 'ORIGINAL FOR RECIPIENT',
    badgeX + badgeWidth / 2,
    19,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(130, 130, 130);
  doc.text('SEC. 31 OF CGST ACT, 2017', badgeX + badgeWidth / 2, 23, { align: 'center' });

  // 2. Invoice & Dispatch Metadata Block
  let y = 41;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 35);
  doc.text(`Invoice No: ${order.invoiceNumber}`, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 75, 85);
  doc.text(`Date & Time: ${order.timestamp}`, margin, y + 4.5);
  doc.text(`Order ID: ${order.orderId}  |  Dispatch Token: #${order.token}`, margin, y + 9);
  doc.text(
    `Supplier GSTIN: ${STUDIO_CONFIG.gstin}  |  PAN: ${STUDIO_CONFIG.pan}  |  State: ${STUDIO_CONFIG.state} (${STUDIO_CONFIG.stateCode})`,
    margin,
    y + 13.5
  );

  // Right Side: Courier Allocation & Payment Telemetry
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 35);
  doc.text('Courier Dispatch:', pageWidth - margin, y, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 120, 70); // Emerald Green
  doc.text(`${order.rider}`, pageWidth - margin, y + 4.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 75, 85);
  const paymentStatus = order.paymentStatus || 'PAID';
  const paymentMethod = order.paymentMethod || 'UPI / NetBanking';
  doc.text(`Payment Status: ${paymentStatus}`, pageWidth - margin, y + 9, { align: 'right' });
  doc.text(`Payment Mode: ${paymentMethod}`, pageWidth - margin, y + 13.5, { align: 'right' });

  // Thin dividing line
  y += 18;
  doc.setDrawColor(220, 225, 230);
  doc.line(margin, y, pageWidth - margin, y);

  // 3. Customer Information (Two Columns: Billed To / Shipped To)
  y += 4;
  const colGap = 6;
  const colWidth = (contentWidth - colGap) / 2; // 88mm each
  const boxHeight = 36;

  // Box A: Billed To
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colWidth, boxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO (CUSTOMER DETAILS)', margin + 3.5, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(order.customerName, margin + 3.5, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const isWholesale = (order.customerCategory || order.customerType) === 'Event Planner';
  doc.text(
    `Category: ${order.customerCategory || order.customerType} (${isWholesale ? '15% Wholesale Member' : 'Retail Consumer'})`,
    margin + 3.5,
    y + 14.5
  );
  doc.text(`Phone: ${order.customerPhone || 'N/A'}  |  Email: ${order.customerEmail || 'N/A'}`, margin + 3.5, y + 19);

  const customerGstin = order.customerGstin ? `GSTIN: ${order.customerGstin}` : 'Customer GSTIN: Unregistered Consumer (B2C)';
  doc.text(customerGstin, margin + 3.5, y + 23.5);

  const splitBillAddr = doc.splitTextToSize(`Billing Address: ${order.billingAddress || 'Studio Walk-in Customer'}`, colWidth - 7);
  doc.text(splitBillAddr.slice(0, 2), margin + 3.5, y + 28);

  // Box B: Shipped To / Courier Destination
  const rightColX = margin + colWidth + colGap;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightColX, y, colWidth, boxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SHIPPED TO (COURIER DESTINATION)', rightColX + 3.5, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Recipient: ${order.customerName}`, rightColX + 3.5, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Assigned Rider: ${order.rider} (Token #${order.token})`, rightColX + 3.5, y + 14.5);

  const deliveryAddr = order.deliveryAddress || order.billingAddress || 'Studio Walk-in Handover';
  const splitDelivAddr = doc.splitTextToSize(`Delivery Address: ${deliveryAddr}`, colWidth - 7);
  doc.text(splitDelivAddr.slice(0, 2), rightColX + 3.5, y + 19);

  const notesText = order.customerNotes
    ? `Instructions: ${order.customerNotes}`
    : 'Instructions: Eco-friendly hand delivery in temperature-controlled cooler.';
  const splitNotes = doc.splitTextToSize(notesText, colWidth - 7);
  doc.text(splitNotes.slice(0, 2), rightColX + 3.5, y + 28);

  // 4. Product Table with Descriptions, Units, and Rates
  y += boxHeight + 5;

  const tableData = calc.lines.map((line, idx) => {
    const itemDescription = line.description
      ? `${line.name}\n${line.description}`
      : line.name;

    return [
      String(idx + 1),
      line.sku,
      itemDescription,
      line.category,
      line.unit,
      String(line.quantity),
      `Rs. ${line.unitPrice.toFixed(2)}`,
      line.discount > 0 ? `- Rs. ${line.discount.toFixed(2)}` : 'Rs. 0.00',
      `Rs. ${line.taxableTotal.toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'SKU', 'Floral Arrangement & Botanical Notes', 'Category', 'Unit', 'Qty', 'Unit Rate', 'Discount', 'Taxable Total']],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: 'grid',
    showHead: 'everyPage',
    headStyles: {
      fillColor: [15, 23, 35],
      textColor: [245, 239, 226],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 30, 30],
      cellPadding: 2.2,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 62 }, // Wide for botanical description
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 10, halign: 'center' },
      6: { cellWidth: 16, halign: 'right' },
      7: { cellWidth: 16, halign: 'right' },
      8: { cellWidth: 16, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [252, 253, 255],
    },
  });

  // Calculate position after product table
  // @ts-expect-error autoTable extends jsPDF instance
  let finalY = doc.lastAutoTable.finalY + 6;

  // Multi-page protection: if table ends near bottom of page, start fresh page for summary
  if (finalY > 200) {
    doc.addPage();
    finalY = 22;
  }

  // 5. Complete Financial Breakdown (Right-Aligned)
  const summaryBoxWidth = 88;
  const summaryX = pageWidth - margin - summaryBoxWidth;
  const summaryBoxHeight = 52;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, finalY, summaryBoxWidth, summaryBoxHeight, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  let sumY = finalY + 5.5;
  doc.text('Gross Subtotal:', summaryX + 4, sumY);
  doc.text(`Rs. ${calc.subtotal.toFixed(2)}`, pageWidth - margin - 4, sumY, { align: 'right' });

  sumY += 5;
  doc.text(`Wholesale Discount (${calc.discountPercent}):`, summaryX + 4, sumY);
  doc.setTextColor(16, 120, 70);
  doc.text(`- Rs. ${calc.discount.toFixed(2)}`, pageWidth - margin - 4, sumY, { align: 'right' });

  sumY += 5;
  doc.setTextColor(71, 85, 105);
  doc.text('Net Taxable Value:', summaryX + 4, sumY);
  doc.text(`Rs. ${calc.taxableAmount.toFixed(2)}`, pageWidth - margin - 4, sumY, { align: 'right' });

  sumY += 5;
  doc.text(`CGST (${calc.cgstPercent}):`, summaryX + 4, sumY);
  doc.text(`Rs. ${calc.cgst.toFixed(2)}`, pageWidth - margin - 4, sumY, { align: 'right' });

  sumY += 5;
  doc.text(`SGST (${calc.sgstPercent}):`, summaryX + 4, sumY);
  doc.text(`Rs. ${calc.sgst.toFixed(2)}`, pageWidth - margin - 4, sumY, { align: 'right' });

  sumY += 5;
  doc.text(`Total Statutory GST (${calc.gstPercent}):`, summaryX + 4, sumY);
  doc.text(`Rs. ${calc.gst.toFixed(2)}`, pageWidth - margin - 4, sumY, { align: 'right' });

  // Divider above Grand Total
  sumY += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX + 3, sumY - 1, pageWidth - margin - 3, sumY - 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('GRAND TOTAL:', summaryX + 4, sumY + 3.5);
  doc.text(`Rs. ${calc.grandTotal.toFixed(2)}`, pageWidth - margin - 4, sumY + 3.5, { align: 'right' });

  sumY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const amountPaid = paymentStatus === 'PAID' ? calc.grandTotal : 0;
  const balanceDue = paymentStatus === 'PAID' ? 0 : calc.grandTotal;
  doc.text(`Amount Received: Rs. ${amountPaid.toFixed(2)}  |  Balance Due: Rs. ${balanceDue.toFixed(2)}`, summaryX + 4, sumY);

  // 6. Left Column: Statutory Terms & Authorized Signatory Block
  const notesWidth = contentWidth - summaryBoxWidth - 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('TERMS & CONDITIONS:', margin, finalY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const termsText = [
    '1. All floral stems are harvested from regenerative soils and verified 100% biodegradable.',
    '2. Store blooms in chilled water (16–21°C) away from direct sunlight to preserve peak beauty.',
    '3. This digital tax invoice is generated under Sec. 31 of CGST Act, 2017 and is legally binding.',
    '4. For inquiries or replacements, please contact orders@bloombox.studio within 24 hours.',
  ];
  termsText.forEach((t, i) => {
    doc.text(t, margin, finalY + 9.5 + i * 4);
  });

  // Authorized Signatory Block
  const sigY = finalY + 32;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, sigY + 11, margin + 50, sigY + 11);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('For BLOOMBOX BOTANICAL SANCTUARY', margin, sigY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Digital Signatory', margin, sigY + 15);

  // 7. Dynamic Footer across all generated pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);

    const footerY = 290;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY - 2.5, pageWidth - margin, footerY - 2.5);

    doc.text(
      'BloomBox Studio • 100% Compostable Flora • Zero Plastic • Courier Routing: Odd = Rider 1, Even = Rider 2',
      margin,
      footerY
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  }

  return doc;
}

/**
 * Downloads the invoice PDF with correct standardized filename:
 * e.g., BloomBox_INV-2026-0003.pdf
 */
export function downloadInvoicePdf(order: CompletedOrder, isDuplicate = false): void {
  const doc = generateInvoiceDocument(order, isDuplicate);
  const cleanInvNum = order.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `BloomBox_${cleanInvNum}${isDuplicate ? '_Duplicate' : ''}.pdf`;
  doc.save(filename);
}

/**
 * Shares the invoice via Web Share API when supported, or falls back to direct download.
 */
export async function shareInvoicePdf(order: CompletedOrder, isDuplicate = false): Promise<boolean> {
  const doc = generateInvoiceDocument(order, isDuplicate);
  const cleanInvNum = order.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `BloomBox_${cleanInvNum}.pdf`;

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const blob = doc.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `BloomBox Tax Invoice ${order.invoiceNumber}`,
          text: `Official tax invoice for BloomBox order #${order.orderId} (Grand Total: ${formatINR(order.finalTotal)}).`,
          files: [file],
        });
        return true;
      }
    } catch (e) {
      console.warn('Web Share API aborted or failed, falling back to download:', e);
    }
  }

  // Fallback to direct download
  downloadInvoicePdf(order, isDuplicate);
  return false;
}
