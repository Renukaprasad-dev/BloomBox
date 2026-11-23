'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompletedOrder } from './store';
import { calculateOrderFinancials, formatINR, STUDIO_BANK_DETAILS } from './billingCalculations';

export const STUDIO_CONFIG = {
  name: 'BLOOMBOX BOTANICAL SANCTUARY',
  legalName: 'BloomBox Floriculture & Regenerative Design Pvt. Ltd.',
  tagline: 'Regenerative Botanical Sanctuary & Greenhouse Dispatch System',
  address: 'BloomBox Pavilion, Valley Reserve, Highland Estate, Pune - 411001, Maharashtra, India',
  phone: '+91 (800) 425-6629 / +91 98230 45678',
  email: 'orders@bloombox.studio',
  supportEmail: 'concierge@bloombox.studio',
  gstin: process.env.NEXT_PUBLIC_STUDIO_GSTIN || '27AABCB1234F1Z9',
  pan: 'AABCB1234F',
  state: 'Maharashtra',
  stateCode: '27',
  website: 'https://bloombox-pi.vercel.app',
};

/**
 * Builds an authentic, vector A4 Tax Invoice PDF using jsPDF and autoTable.
 * Strictly adheres to Indian Retail GST Tax Invoice standards (Sec. 31 of CGST Act, 2017).
 */
export function generateInvoiceDocument(order: CompletedOrder, isDuplicate = false): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 11;
  const contentWidth = pageWidth - margin * 2; // 188mm

  // Sourced from centralized integer paise calculation engine
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

  // 1. Top Header Bar (Obsidian Black with Gold Accent Ribbon)
  doc.setFillColor(10, 14, 20);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setFillColor(212, 175, 55); // Gold ribbon
  doc.rect(0, 31.4, pageWidth, 0.6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(245, 239, 226); // Cream
  doc.text('BLOOMBOX', margin, 12);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(215, 210, 200);
  doc.text(STUDIO_CONFIG.tagline.toUpperCase(), margin, 17);
  doc.text(STUDIO_CONFIG.address, margin, 21.5);
  doc.text(
    `Tel: ${STUDIO_CONFIG.phone}  |  Email: ${STUDIO_CONFIG.email}  |  Web: ${STUDIO_CONFIG.website}`,
    margin,
    26
  );

  // Top Right "TAX INVOICE" Badge
  const badgeWidth = 46;
  const badgeX = pageWidth - margin - badgeWidth;
  doc.setFillColor(245, 239, 226);
  doc.roundedRect(badgeX, 6, badgeWidth, 20, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 20, 28);
  doc.text('TAX INVOICE', badgeX + badgeWidth / 2, 13, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    isDuplicate ? 'DUPLICATE FOR TRANSPORTER' : 'ORIGINAL FOR RECIPIENT',
    badgeX + badgeWidth / 2,
    18,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(120, 120, 120);
  doc.text('SEC. 31 OF CGST ACT, 2017', badgeX + badgeWidth / 2, 22.5, { align: 'center' });

  // 2. Metadata Bar: Invoice No, Date, Order ID, Dispatch Token & Payment Status
  let y = 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 35);
  doc.text(`Invoice No: ${order.invoiceNumber}`, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 75, 85);
  doc.text(`Issue Date & Time: ${order.timestamp}`, margin, y + 4);
  doc.text(`Order Reference: ${order.orderId}  |  Dispatch Token: #${order.token}`, margin, y + 8);
  doc.text(
    `Supplier GSTIN: ${STUDIO_CONFIG.gstin}  |  PAN: ${STUDIO_CONFIG.pan}  |  State: ${STUDIO_CONFIG.state} (Code ${STUDIO_CONFIG.stateCode})`,
    margin,
    y + 12
  );

  // Right Side Dispatch Telemetry
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 35);
  doc.text('Dispatch Courier & Status:', pageWidth - margin, y, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 120, 70); // Emerald Green
  doc.text(`${order.rider} • PREPARED & INSPECTED`, pageWidth - margin, y + 4, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 75, 85);
  const paymentStatus = order.paymentStatus || 'PAID';
  const paymentMethod = order.paymentMethod || 'UPI / NetBanking';
  doc.text(`Payment: ${paymentStatus} (${paymentMethod})`, pageWidth - margin, y + 8, { align: 'right' });
  doc.text(`Dispatch Priority: Certified White-Glove Eco Transport`, pageWidth - margin, y + 12, { align: 'right' });

  // Divider
  y += 16;
  doc.setDrawColor(220, 225, 230);
  doc.line(margin, y, pageWidth - margin, y);

  // 3. Three Address Cards: SELLER DETAILS | BILL TO | SHIP TO
  y += 3.5;
  const colGap = 4;
  const colWidth = (contentWidth - colGap * 2) / 3; // ~60mm each
  const cardHeight = 32;

  // Card 1: SELLER DETAILS
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colWidth, cardHeight, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SELLER DETAILS', margin + 3, y + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(STUDIO_CONFIG.name, margin + 3, y + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`GSTIN: ${STUDIO_CONFIG.gstin}`, margin + 3, y + 12.5);
  doc.text(`Email: ${STUDIO_CONFIG.email}`, margin + 3, y + 16.5);
  doc.text(`Phone: ${STUDIO_CONFIG.phone}`, margin + 3, y + 20.5);
  const sellerAddr = doc.splitTextToSize(STUDIO_CONFIG.address, colWidth - 6);
  doc.text(sellerAddr.slice(0, 2), margin + 3, y + 24.5);

  // Card 2: BILL TO
  const col2X = margin + colWidth + colGap;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, y, colWidth, cardHeight, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('BILL TO (CUSTOMER)', col2X + 3, y + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(order.customerName, col2X + 3, y + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  const isWholesale = (order.customerCategory || order.customerType) === 'Event Planner';
  doc.text(
    `Type: ${order.customerCategory || order.customerType} (${isWholesale ? '15% Wholesale' : 'Retail Standard'})`,
    col2X + 3,
    y + 12.5
  );
  doc.text(`Phone: ${order.customerPhone || 'N/A'}`, col2X + 3, y + 16.5);
  doc.text(`Email: ${order.customerEmail || 'N/A'}`, col2X + 3, y + 20.5);
  const billGstinText = order.customerGstin ? `GSTIN: ${order.customerGstin}` : 'GSTIN: Unregistered Consumer';
  doc.text(billGstinText, col2X + 3, y + 24.5);
  const billAddr = doc.splitTextToSize(`Addr: ${order.billingAddress || 'Studio Handover'}`, colWidth - 6);
  doc.text(billAddr[0] || '', col2X + 3, y + 28.5);

  // Card 3: SHIP TO
  const col3X = col2X + colWidth + colGap;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col3X, y, colWidth, cardHeight, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SHIP TO (COURIER DESTINATION)', col3X + 3, y + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(order.customerName, col3X + 3, y + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Assigned: ${order.rider}`, col3X + 3, y + 12.5);
  doc.text(`Contact: ${order.customerPhone || 'N/A'}`, col3X + 3, y + 16.5);
  const delivAddr = doc.splitTextToSize(`Address: ${order.deliveryAddress || order.billingAddress || 'Studio Handover'}`, colWidth - 6);
  doc.text(delivAddr.slice(0, 2), col3X + 3, y + 20.5);
  if (order.customerNotes) {
    const notes = doc.splitTextToSize(`Note: ${order.customerNotes}`, colWidth - 6);
    doc.text(notes[0], col3X + 3, y + 28.5);
  } else {
    doc.text('Note: Handcrafted eco-friendly delivery', col3X + 3, y + 28.5);
  }

  // 4. Detailed 13-Column Product Table
  y += cardHeight + 4;

  const tableHead = [[
    'Sr',
    'SKU',
    'Flower Name & Description',
    'Category',
    'Qty',
    'Unit',
    'Unit Price',
    'Discount',
    'Taxable',
    'GST %',
    'GST Amt',
    'Total'
  ]];

  const tableBody = calc.lines.map((line) => {
    return [
      String(line.srNo),
      line.sku,
      `${line.name}\n${line.description}`,
      line.category,
      String(line.quantity),
      line.unit,
      `Rs. ${line.unitPrice.toFixed(2)}`,
      line.discount > 0 ? `- Rs. ${line.discount.toFixed(2)}` : 'Rs. 0.00',
      `Rs. ${line.taxableAmount.toFixed(2)}`,
      line.gstPercent,
      `Rs. ${line.gst.toFixed(2)}`,
      `Rs. ${line.finalTotal.toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    margin: { left: margin, right: margin },
    theme: 'grid',
    showHead: 'everyPage',
    headStyles: {
      fillColor: [15, 23, 35],
      textColor: [245, 239, 226],
      fontSize: 6.8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 1.8,
    },
    bodyStyles: {
      fontSize: 6.8,
      textColor: [30, 30, 30],
      cellPadding: 1.8,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 6, halign: 'center' },   // Sr No
      1: { cellWidth: 13, halign: 'center' },  // SKU
      2: { cellWidth: 46 },                    // Flower Name & Description
      3: { cellWidth: 16 },                    // Category
      4: { cellWidth: 8, halign: 'center' },   // Qty
      5: { cellWidth: 16 },                    // Unit
      6: { cellWidth: 15, halign: 'right' },   // Unit Price
      7: { cellWidth: 14, halign: 'right' },   // Discount
      8: { cellWidth: 15, halign: 'right' },   // Taxable
      9: { cellWidth: 10, halign: 'center' },  // GST %
      10: { cellWidth: 13, halign: 'right' },  // GST Amt
      11: { cellWidth: 16, halign: 'right' },  // Total
    },
    alternateRowStyles: {
      fillColor: [253, 253, 251],
    },
  });

  // Calculate position after product table
  // @ts-expect-error autoTable extends jsPDF instance
  let finalY = doc.lastAutoTable.finalY + 4;

  // Multi-page protection: if table ends near bottom of page, start fresh page for summary
  if (finalY > 195) {
    doc.addPage();
    finalY = 20;
  }

  // 5. Financial Summary Block (Right-Aligned)
  const summaryBoxWidth = 86;
  const summaryX = pageWidth - margin - summaryBoxWidth;
  const summaryBoxHeight = 54;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, finalY, summaryBoxWidth, summaryBoxHeight, 1.2, 1.2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  let sumY = finalY + 5;
  doc.text('Subtotal (Gross):', summaryX + 3.5, sumY);
  doc.text(`Rs. ${calc.subtotal.toFixed(2)}`, pageWidth - margin - 3.5, sumY, { align: 'right' });

  sumY += 4.5;
  doc.text(`Wholesale Discount (${calc.discountPercent}):`, summaryX + 3.5, sumY);
  doc.setTextColor(16, 120, 70);
  doc.text(`- Rs. ${calc.discount.toFixed(2)}`, pageWidth - margin - 3.5, sumY, { align: 'right' });

  sumY += 4.5;
  doc.setTextColor(71, 85, 105);
  doc.text('Net Taxable Amount:', summaryX + 3.5, sumY);
  doc.text(`Rs. ${calc.taxableAmount.toFixed(2)}`, pageWidth - margin - 3.5, sumY, { align: 'right' });

  sumY += 4.5;
  doc.text(`CGST (${calc.cgstPercent}):`, summaryX + 3.5, sumY);
  doc.text(`Rs. ${calc.cgst.toFixed(2)}`, pageWidth - margin - 3.5, sumY, { align: 'right' });

  sumY += 4.5;
  doc.text(`SGST (${calc.sgstPercent}):`, summaryX + 3.5, sumY);
  doc.text(`Rs. ${calc.sgst.toFixed(2)}`, pageWidth - margin - 3.5, sumY, { align: 'right' });

  sumY += 4.5;
  doc.text(`Total Statutory GST (5.0%):`, summaryX + 3.5, sumY);
  doc.text(`Rs. ${calc.gst.toFixed(2)}`, pageWidth - margin - 3.5, sumY, { align: 'right' });

  sumY += 4.5;
  doc.text(`Eco Courier Delivery:`, summaryX + 3.5, sumY);
  doc.setTextColor(16, 120, 70);
  doc.text('FREE (Complimentary)', pageWidth - margin - 3.5, sumY, { align: 'right' });

  // Divider above Grand Total
  sumY += 3.5;
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX + 2, sumY - 0.5, pageWidth - margin - 2, sumY - 0.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('GRAND TOTAL:', summaryX + 3.5, sumY + 4);
  doc.text(`Rs. ${calc.grandTotal.toFixed(2)}`, pageWidth - margin - 3.5, sumY + 4, { align: 'right' });

  sumY += 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const amountPaid = paymentStatus === 'PAID' ? calc.grandTotal : 0;
  const balanceDue = paymentStatus === 'PAID' ? 0 : calc.grandTotal;
  doc.text(
    `Amount Paid: Rs. ${amountPaid.toFixed(2)}  |  Balance Due: Rs. ${balanceDue.toFixed(2)}`,
    summaryX + 3.5,
    sumY
  );

  // 6. Left Column: Amount in Words, Bank Details, Terms & Signatory
  const leftColWidth = contentWidth - summaryBoxWidth - 5;
  let leftY = finalY;

  // Amount in Words Banner
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, leftY, leftColWidth, 11, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('AMOUNT IN WORDS (INR):', margin + 3, leftY + 3.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  const splitWords = doc.splitTextToSize(calc.amountInWords, leftColWidth - 6);
  doc.text(splitWords.slice(0, 2), margin + 3, leftY + 7.5);

  // Bank & Settlement Details
  leftY += 13.5;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, leftY, leftColWidth, 19, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('SETTLEMENT & BANK ACCOUNT DETAILS:', margin + 3, leftY + 3.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Bank: ${STUDIO_BANK_DETAILS.bankName}  |  A/C: ${STUDIO_BANK_DETAILS.accountNumber}`, margin + 3, leftY + 7.5);
  doc.text(`A/C Name: ${STUDIO_BANK_DETAILS.accountName}`, margin + 3, leftY + 11.5);
  doc.text(`IFSC: ${STUDIO_BANK_DETAILS.ifsc}  |  UPI ID: ${STUDIO_BANK_DETAILS.upiId}`, margin + 3, leftY + 15.5);

  // Statutory Terms & Cancellation Policy
  leftY += 21;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text('STATUTORY TERMS & PERISHABLE RETURN POLICY:', margin, leftY + 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  const termsText = [
    '1. Fresh floral specimens are perishable and certified hand-inspected upon courier dispatch.',
    '2. Stems are 100% biodegradable, harvested from regenerative botanical nurseries with zero plastic.',
    '3. Claims for damage or replacement must be reported to orders@bloombox.studio within 12 hours.',
    '4. Generated electronically under Sec. 31 of CGST Act, 2017 and constitutes a legal statutory invoice.',
  ];
  termsText.forEach((t, i) => {
    doc.text(t, margin, leftY + 6.5 + i * 3.5);
  });

  // Authorized Signatory Block
  const sigY = leftY + 22;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, sigY + 8, margin + 45, sigY + 8);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('For BLOOMBOX BOTANICAL SANCTUARY', margin, sigY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Digital Signatory', margin, sigY + 11.5);

  // Online Verification Link
  const verifyUrl = `${STUDIO_CONFIG.website}/bloombox?inv=${order.invoiceNumber}`;
  doc.text(`Verify Online: ${verifyUrl}`, margin + 50, sigY + 11.5);

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
 * Downloads the invoice PDF with standardized professional filename:
 * e.g., BloomBox_Invoice_INV-2026-0001.pdf
 */
export function downloadInvoicePdf(order: CompletedOrder, isDuplicate = false): void {
  const doc = generateInvoiceDocument(order, isDuplicate);
  const cleanInvNum = order.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `BloomBox_Invoice_${cleanInvNum}${isDuplicate ? '_Duplicate' : ''}.pdf`;
  doc.save(filename);
}

/**
 * Shares the invoice via Web Share API when supported, or falls back to direct download.
 */
export async function shareInvoicePdf(order: CompletedOrder, isDuplicate = false): Promise<boolean> {
  const doc = generateInvoiceDocument(order, isDuplicate);
  const cleanInvNum = order.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `BloomBox_Invoice_${cleanInvNum}.pdf`;

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

  downloadInvoicePdf(order, isDuplicate);
  return false;
}
