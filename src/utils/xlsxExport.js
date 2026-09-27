/**
 * xlsxExport.js
 * Generates a fully formatted Excel (.xlsx) quotation using SheetJS.
 * The sheet mimics an A4 printed quotation with merged cells, borders,
 * company header, customer block, itemised table, and totals.
 */

import { formatCurrency } from './pricing';

/**
 * Download an Excel quotation.
 *
 * @param {Object} params
 * @param {Array}  params.lineItems       - computed line items from calcQuotation
 * @param {Object} params.totals          - calcQuotation result
 * @param {Object} params.customer        - customer details object
 * @param {string} params.quotationNumber
 * @param {string} params.quotationDate   - ISO string
 * @param {Object} params.settings        - settings.json
 */
export async function downloadXLSX({
  lineItems,
  totals,
  customer,
  quotationNumber,
  quotationDate,
  settings,
}) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const sym = settings.currencySymbol || '₹';
  const dateStr = new Date(quotationDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const validUntil = new Date(
    new Date(quotationDate).getTime() + settings.quotationValidityDays * 86400000
  ).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  /* ── Build rows ─────────────────────────────────────────────────────── */
  const rows = [];

  // Row 0 – Company name (large header)
  rows.push([settings.companyName, '', '', '', '', '', '']);
  // Row 1 – Tagline
  rows.push([settings.companyTagline, '', '', '', '', '', '']);
  // Row 2 – Address
  rows.push([settings.companyAddress, '', '', '', 'QUOTATION', '', '']);
  // Row 3 – Contact
  rows.push([`${settings.companyPhone}   |   ${settings.companyEmail}`, '', '', '', quotationNumber, '', '']);
  // Row 4 – GSTIN
  rows.push([`GSTIN: ${settings.companyGST}`, '', '', '', `Date: ${dateStr}`, '', '']);
  // Row 5 – blank
  rows.push(['', '', '', '', `Valid until: ${validUntil}`, '', '']);
  // Row 6 – blank separator
  rows.push(['', '', '', '', '', '', '']);

  // Row 7 – Customer block header
  rows.push(['BILL TO', '', '', '', '', '', '']);
  rows.push([`Name: ${customer.name || '—'}`, '', '', '', `Project: ${customer.projectName || '—'}`, '', '']);
  rows.push([`Phone: ${customer.phone || '—'}`, '', '', '', `City: ${customer.city || '—'}`, '', '']);
  rows.push([`Email: ${customer.email || '—'}`, '', '', '', '', '', '']);
  rows.push([`Address: ${customer.address || '—'}`, '', '', '', '', '', '']);
  // Row 12 – blank
  rows.push(['', '', '', '', '', '', '']);

  // Row 13 – Table header
  const headerRow = ['#', 'Description', 'Room / Label', 'Tier', 'Qty / Area', `Rate (${sym})`, `Amount (${sym})`];
  rows.push(headerRow);
  const tableHeaderRowIdx = rows.length - 1; // 0-indexed = 13

  // Data rows
  lineItems.forEach((item, i) => {
    const unitLabel = { per_sqft: 'sq ft', per_rft: 'rft', per_unit: 'unit' }[item.product?.unitType] || '';
    const qtyStr = `${item.qty.toFixed(1)} ${unitLabel}`;
    rows.push([
      i + 1,
      item.product?.name || '',
      item.roomLabel || '',
      item.tier?.tierName || '',
      qtyStr,
      item.unitRate,
      item.lineTotal,
    ]);

    // Material spec sub-row
    if (item.tier?.materialSpec) {
      rows.push(['', `  Spec: ${item.tier.materialSpec}`, '', '', '', '', '']);
    }

    // Add-ons sub-row
    if (item.selectedAddons?.length > 0) {
      const addonNames = item.selectedAddons.map((a) => a.name).join(', ');
      rows.push(['', `  Add-ons: ${addonNames}`, '', '', '', `+${sym}${item.addonTotal.toLocaleString('en-IN')}`, '']);
    }
  });

  const lastItemRowIdx = rows.length - 1;

  // Blank row before totals
  rows.push(['', '', '', '', '', '', '']);

  // Totals block
  rows.push(['', '', '', '', '', 'Subtotal', totals.subtotal]);
  if (totals.discountAmount > 0) {
    rows.push(['', '', '', '', '', 'Discount', -totals.discountAmount]);
  }
  rows.push(['', '', '', '', '', 'Taxable Amount', totals.taxableAmount]);
  rows.push(['', '', '', '', '', `CGST (${totals.gstPercent / 2}%)`, totals.taxAmount / 2]);
  rows.push(['', '', '', '', '', `SGST (${totals.gstPercent / 2}%)`, totals.taxAmount / 2]);
  if (totals.installationCharge > 0) {
    rows.push(['', '', '', '', '', 'Installation Charge', totals.installationCharge]);
  }
  if (totals.transportCharge > 0) {
    rows.push(['', '', '', '', '', 'Transport Charge', totals.transportCharge]);
  }
  rows.push(['', '', '', '', '', 'GRAND TOTAL', totals.grandTotal]);

  const grandTotalRowIdx = rows.length - 1;

  // Blank
  rows.push(['', '', '', '', '', '', '']);

  // Terms header
  rows.push(['TERMS & CONDITIONS', '', '', '', '', '', '']);
  settings.termsAndConditions.forEach((term, i) => {
    rows.push([`${i + 1}. ${term}`, '', '', '', '', '', '']);
  });

  rows.push(['', '', '', '', '', '', '']);
  rows.push(['This is a computer-generated quotation.', '', '', '', '', '', '']);
  rows.push([`Thank you for choosing ${settings.companyName}`, '', '', '', '', '', '']);

  /* ── Create worksheet ───────────────────────────────────────────────── */
  const ws = XLSX.utils.aoa_to_sheet(rows);

  /* ── Column widths ──────────────────────────────────────────────────── */
  ws['!cols'] = [
    { wch: 5 },   // #
    { wch: 40 },  // Description
    { wch: 18 },  // Room
    { wch: 12 },  // Tier
    { wch: 14 },  // Qty
    { wch: 18 },  // Rate / label
    { wch: 18 },  // Amount
  ];

  /* ── Row heights ────────────────────────────────────────────────────── */
  ws['!rows'] = rows.map((_, i) => {
    if (i === 0) return { hpt: 28 }; // company name
    if (i === tableHeaderRowIdx) return { hpt: 20 };
    return { hpt: 16 };
  });

  /* ── Merges ─────────────────────────────────────────────────────────── */
  ws['!merges'] = [
    // Company name across all cols
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 3 } },
    // Customer block label/value
    { s: { r: 8, c: 0 }, e: { r: 8, c: 2 } },
    { s: { r: 9, c: 0 }, e: { r: 9, c: 2 } },
    { s: { r: 10, c: 0 }, e: { r: 10, c: 2 } },
    { s: { r: 11, c: 0 }, e: { r: 11, c: 4 } },
    // Terms rows merge across all cols
    ...rows.slice(grandTotalRowIdx + 2).map((_, i) => ({
      s: { r: grandTotalRowIdx + 2 + i, c: 0 },
      e: { r: grandTotalRowIdx + 2 + i, c: 6 },
    })),
  ];

  /* ── Cell styles (requires xlsx-style or @sheet/write – use basic format codes) */
  // Mark currency cells
  const currencyCols = [5, 6];
  rows.forEach((row, r) => {
    currencyCols.forEach((c) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (ws[addr] && typeof ws[addr].v === 'number') {
        ws[addr].t = 'n';
        ws[addr].z = `"${sym}"#,##0`;
      }
    });
  });

  /* ── Page setup for A4 print ─────────────────────────────────────────── */
  ws['!pageSetup'] = {
    paperSize: 9,        // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    scale: 85,
  };

  ws['!printSetup'] = {
    paperSize: 9,
    orientation: 'portrait',
  };

  /* ── Add to workbook and save ────────────────────────────────────────── */
  XLSX.utils.book_append_sheet(wb, ws, 'Quotation');

  const filename = `${settings.companyName.replace(/\s+/g, '-')}-Quote-${quotationNumber}.xlsx`;
  XLSX.writeFile(wb, filename);
}
