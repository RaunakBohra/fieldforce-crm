import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Visit, Order, Contact, Payment } from '../services/api';

/**
 * Export data to CSV file
 * @param data - Array of objects to export
 * @param filename - Name of the CSV file
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string
): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Export visits to CSV
 * @param visits - Array of visit objects
 */
export function exportVisitsToCSV(visits: Visit[]): void {
  const exportData = visits.map(visit => ({
    'Visit ID': visit.id,
    'Date': new Date(visit.checkInTime).toLocaleString(),
    'Contact Name': visit.contact?.name || 'N/A',
    'Contact Type': visit.contact?.contactType || 'N/A',
    'Location': visit.locationName || 'N/A',
    'Purpose': visit.purpose || 'N/A',
    'Outcome': visit.outcome || 'N/A',
    'Duration (min)': visit.checkOutTime
      ? Math.round((new Date(visit.checkOutTime).getTime() - new Date(visit.checkInTime).getTime()) / 60000)
      : 'Ongoing',
    'Products Discussed': visit.products?.join(', ') || 'None',
    'Samples Given': visit.samplesGiven
      ? Object.entries(visit.samplesGiven).map(([k, v]) => `${k}: ${v}`).join('; ')
      : 'None',
    'Follow-up Required': visit.followUpRequired ? 'Yes' : 'No',
    'Notes': visit.notes || 'N/A',
  }));

  const filename = `visits_export_${new Date().toISOString().split('T')[0]}.csv`;
  exportToCSV(exportData, filename);
}

/**
 * Export orders to CSV
 * @param orders - Array of order objects
 */
export function exportOrdersToCSV(orders: Order[]): void {
  const exportData = orders.map(order => ({
    'Order ID': order.id,
    'Date': new Date(order.createdAt).toLocaleString(),
    'Contact Name': order.contact?.name || 'N/A',
    'Contact Type': order.contact?.contactType || 'N/A',
    'Contact Phone': order.contact?.phone || 'N/A',
    'Contact City': order.contact?.city || 'N/A',
    'Total Amount': `₹${order.totalAmount.toFixed(2)}`,
    'Status': order.status,
    'Payment Status': order.paymentStatus || 'PENDING',
    'Items Count': order.items?.length || 0,
    'Products': order.items?.map((item: any) =>
      `${item.product?.name || 'Unknown'} (${item.quantity} x ₹${item.unitPrice})`
    ).join('; ') || 'N/A',
    'Notes': order.notes || 'N/A',
    'Created By': order.createdBy?.name || 'N/A',
  }));

  const filename = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
  exportToCSV(exportData, filename);
}

/**
 * Export payments to PDF
 * @param payments - Array of payment objects
 */
export function exportPaymentsToPDF(payments: Payment[]): void {
  if (payments.length === 0) {
    alert('No payments to export');
    return;
  }

  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(55, 48, 163); // Primary color
  doc.text('Payment Report', 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  doc.text(`Total Payments: ${payments.length}`, 14, 36);

  // Calculate totals
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 14, 42);

  // Table data
  const tableData = payments.map(payment => [
    payment.id.substring(0, 8),
    new Date(payment.paymentDate).toLocaleDateString(),
    payment.order?.contact?.name || 'N/A',
    `₹${payment.amount.toFixed(2)}`,
    payment.paymentMode,
    payment.status,
    payment.referenceNumber || 'N/A',
  ]);

  autoTable(doc, {
    head: [['ID', 'Date', 'Contact', 'Amount', 'Method', 'Status', 'Reference']],
    body: tableData,
    startY: 50,
    theme: 'striped',
    headStyles: {
      fillColor: [55, 48, 163], // Primary color
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [238, 242, 255], // Primary-50
    },
    margin: { top: 50 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} | Field Force CRM`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  const filename = `payments_report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Export visit report to PDF (detailed)
 * @param visits - Array of visit objects
 */
export function exportVisitReportToPDF(visits: Visit[]): void {
  if (visits.length === 0) {
    alert('No visits to export');
    return;
  }

  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(55, 48, 163);
  doc.text('Visit Report', 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  doc.text(`Total Visits: ${visits.length}`, 14, 36);

  // Table data
  const tableData = visits.map(visit => [
    visit.id.substring(0, 8),
    new Date(visit.checkInTime).toLocaleDateString(),
    visit.contact?.name || 'N/A',
    visit.outcome || 'N/A',
    visit.checkOutTime
      ? `${Math.round((new Date(visit.checkOutTime).getTime() - new Date(visit.checkInTime).getTime()) / 60000)} min`
      : 'Ongoing',
  ]);

  autoTable(doc, {
    head: [['ID', 'Date', 'Contact', 'Outcome', 'Duration']],
    body: tableData,
    startY: 44,
    theme: 'striped',
    headStyles: {
      fillColor: [55, 48, 163],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [238, 242, 255],
    },
    margin: { top: 44 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} | Field Force CRM`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const filename = `visit_report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
