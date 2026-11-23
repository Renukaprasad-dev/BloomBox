'use client';

export interface InvoiceData {
  invoiceNumber: string;
  orderId: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  billingAddress?: string;
  customerType: 'Regular' | 'Event Planner';
  lines: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discount: number;
  taxableAmount: number;
  gst: number;
  finalTotal: number;
  rider: string;
  token: number;
}

/**
 * Generates an authentic PDF-1.4 binary document and triggers a client download.
 */
export function downloadInvoicePdf(invoice: InvoiceData): void {
  const sanitize = (str: string) => str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  // Build PDF content streams
  const streamLines: string[] = [];
  streamLines.push('BT');
  streamLines.push('/F1 20 Tf');
  streamLines.push('50 760 Td');
  streamLines.push('(BLOOMBOX FLORAL STUDIO) Tj');
  streamLines.push('ET');

  streamLines.push('BT');
  streamLines.push('/F2 9 Tf');
  streamLines.push('50 745 Td');
  streamLines.push('(Regenerative Botanical Sanctuary & Greenhouse Dispatch) Tj');
  streamLines.push('ET');

  // Horizontal separator
  streamLines.push('50 735 m 545 735 l S');

  // Invoice Title & Meta
  streamLines.push('BT');
  streamLines.push('/F1 14 Tf');
  streamLines.push('50 710 Td');
  streamLines.push(`(TAX INVOICE: ${sanitize(invoice.invoiceNumber)}) Tj`);
  streamLines.push('ET');

  streamLines.push('BT');
  streamLines.push('/F2 10 Tf');
  streamLines.push('50 690 Td');
  streamLines.push(`(Order ID: ${sanitize(invoice.orderId)}  |  Token: ${invoice.token}  |  Dispatch: ${sanitize(invoice.rider)}) Tj`);
  streamLines.push('50 675 Td');
  streamLines.push(`(Date & Time: ${sanitize(invoice.date)}) Tj`);
  streamLines.push('ET');

  // Customer Block
  streamLines.push('50 660 m 545 660 l S');
  streamLines.push('BT');
  streamLines.push('/F1 11 Tf');
  streamLines.push('50 645 Td');
  streamLines.push('(BILLED TO:) Tj');
  streamLines.push('ET');

  streamLines.push('BT');
  streamLines.push('/F2 10 Tf');
  streamLines.push('50 630 Td');
  streamLines.push(`(Customer: ${sanitize(invoice.customerName)} [${sanitize(invoice.customerType)}]) Tj`);
  if (invoice.customerPhone) {
    streamLines.push('50 615 Td');
    streamLines.push(`(Phone: ${sanitize(invoice.customerPhone)}) Tj`);
  }
  if (invoice.customerEmail) {
    streamLines.push('50 600 Td');
    streamLines.push(`(Email: ${sanitize(invoice.customerEmail)}) Tj`);
  }
  if (invoice.billingAddress) {
    streamLines.push('50 585 Td');
    streamLines.push(`(Address: ${sanitize(invoice.billingAddress)}) Tj`);
  }
  streamLines.push('ET');

  // Table Header
  const tableTop = invoice.billingAddress ? 560 : 590;
  streamLines.push(`50 ${tableTop} m 545 ${tableTop} l S`);

  streamLines.push('BT');
  streamLines.push('/F1 9 Tf');
  streamLines.push(`50 ${tableTop - 15} Td (ITEM #) Tj`);
  streamLines.push(`110 ${tableTop - 15} Td (DESCRIPTION) Tj`);
  streamLines.push(`330 ${tableTop - 15} Td (QTY) Tj`);
  streamLines.push(`390 ${tableTop - 15} Td (RATE (INR)) Tj`);
  streamLines.push(`475 ${tableTop - 15} Td (TOTAL (INR)) Tj`);
  streamLines.push('ET');

  streamLines.push(`50 ${tableTop - 22} m 545 ${tableTop - 22} l S`);

  // Table Rows
  let currentY = tableTop - 36;
  streamLines.push('BT');
  streamLines.push('/F2 9 Tf');
  invoice.lines.forEach((line) => {
    const lineTotal = line.price * line.quantity;
    streamLines.push(`50 ${currentY} Td (#${line.id}) Tj`);
    streamLines.push(`110 ${currentY} Td (${sanitize(line.name)}) Tj`);
    streamLines.push(`330 ${currentY} Td (${line.quantity}) Tj`);
    streamLines.push(`390 ${currentY} Td (Rs. ${line.price.toFixed(2)}) Tj`);
    streamLines.push(`475 ${currentY} Td (Rs. ${lineTotal.toFixed(2)}) Tj`);
    currentY -= 16;
  });
  streamLines.push('ET');

  // Summary Lines
  const summaryTop = currentY - 10;
  streamLines.push(`50 ${summaryTop} m 545 ${summaryTop} l S`);

  streamLines.push('BT');
  streamLines.push('/F2 10 Tf');
  streamLines.push(`340 ${summaryTop - 20} Td (Subtotal:) Tj`);
  streamLines.push(`460 ${summaryTop - 20} Td (Rs. ${invoice.subtotal.toFixed(2)}) Tj`);

  streamLines.push(`340 ${summaryTop - 35} Td (Discount (${invoice.customerType === 'Event Planner' ? '15%' : '0%'}):) Tj`);
  streamLines.push(`460 ${summaryTop - 35} Td (- Rs. ${invoice.discount.toFixed(2)}) Tj`);

  streamLines.push(`340 ${summaryTop - 50} Td (Taxable Amount:) Tj`);
  streamLines.push(`460 ${summaryTop - 50} Td (Rs. ${invoice.taxableAmount.toFixed(2)}) Tj`);

  streamLines.push(`340 ${summaryTop - 65} Td (Statutory GST (5%):) Tj`);
  streamLines.push(`460 ${summaryTop - 65} Td (Rs. ${invoice.gst.toFixed(2)}) Tj`);
  streamLines.push('ET');

  // Grand Total Box
  streamLines.push(`335 ${summaryTop - 75} m 545 ${summaryTop - 75} l S`);
  streamLines.push('BT');
  streamLines.push('/F1 12 Tf');
  streamLines.push(`340 ${summaryTop - 95} Td (GRAND TOTAL:) Tj`);
  streamLines.push(`450 ${summaryTop - 95} Td (Rs. ${invoice.finalTotal.toFixed(2)}) Tj`);
  streamLines.push('ET');

  // Footer Note
  streamLines.push('BT');
  streamLines.push('/F2 8 Tf');
  streamLines.push('50 60 Td');
  streamLines.push('(Thank you for supporting regenerative floristry. All stems are compostable and sustainably farmed.) Tj');
  streamLines.push('50 48 Td');
  streamLines.push('(Inquiries: orders@bloombox.studio | Courier Token Routing: Odd = Rider 1, Even = Rider 2) Tj');
  streamLines.push('ET');

  const contentStream = streamLines.join('\n');
  const streamLength = contentStream.length;

  const pdfParts = [
    '%PDF-1.4\n',
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  // Calculate offsets for xref
  let currentOffset = 0;
  const offsets: number[] = [0]; // 0th object
  for (let i = 0; i < pdfParts.length; i++) {
    offsets.push(currentOffset);
    currentOffset += pdfParts[i].length;
  }

  const xrefOffset = currentOffset;
  let xref = `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 1; i <= 6; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const fullPdf = pdfParts.join('') + xref + trailer;
  const blob = new Blob([fullPdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `BloomBox_${invoice.invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
