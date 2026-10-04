/**
 * xlsxExport.js  –  Full multi-column Excel quotation
 *
 * Columns (A–N):
 *  A  Sl No     B  Room       C  Product Name      D  Tier/Quality
 *  E  Material Specification  F  L (ft)  G  B (ft)  H  Qty / Area
 *  I  Unit      J  Rate/Unit  K  Add-ons            L  Line Total
 *  M  GST %     N  GST Amt    O  Net Amount (incl GST)
 */
import categoriesData from '../data/categories.json';
import addonsData     from '../data/addons.json';

const COLS = 15;   // A–O

function fmt(n, sym = '₹') {
  return `${sym}${Math.round(n).toLocaleString('en-IN')}`;
}

function groupByRoom(lineItems) {
  const map = new Map();
  lineItems.forEach(item => {
    const key = item.roomLabel?.trim() ||
      categoriesData.find(c => c.id === item.product?.categoryId)?.name ||
      'General';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
}

function unitStr(p) {
  return { per_sqft:'sq ft', per_rft:'rft', per_unit:'nos' }[p?.unitType] || '';
}

function getAddonNames(item) {
  if (!item.selectedAddonIds?.length) return '—';
  return item.selectedAddonIds
    .map(id => addonsData.find(a => a.id === id)?.name)
    .filter(Boolean)
    .join(', ');
}
function getAddonTotal(item) {
  if (!item.selectedAddonIds?.length) return 0;
  return item.selectedAddonIds.reduce((s, id) => {
    const a = addonsData.find(x => x.id === id);
    return s + (a?.price || 0);
  }, 0);
}

export async function downloadXLSX({
  lineItems, totals, customer, quotationNumber,
  quotationDate, settings, projectName,
}) {
  const XLSX = await import('xlsx');
  const sym  = settings.currencySymbol || '₹';
  const gst  = settings.gstPercent || 18;

  const dateStr = new Date(quotationDate).toLocaleDateString('en-IN', {
    day:'numeric', month:'long', year:'numeric',
  });
  const validStr = new Date(
    new Date(quotationDate).getTime() + settings.quotationValidityDays * 86400000
  ).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });

  const blank = Array(COLS).fill('');
  const rows  = [];

  /* ── Header block ── */
  rows.push([settings.companyName,       ...Array(COLS-1).fill('')]);
  rows.push([settings.companyTagline,    ...Array(COLS-1).fill('')]);
  rows.push([settings.companyAddress,    ...Array(COLS-1).fill('')]);
  rows.push([`${settings.companyPhone}  |  ${settings.companyEmail}`, ...Array(COLS-1).fill('')]);
  rows.push([`GSTIN: ${settings.companyGST}`, ...Array(COLS-1).fill('')]);
  rows.push([...blank]);

  /* ── Quotation meta row ── */
  rows.push([`QUOTATION: ${quotationNumber}`, '', '', '', '', '', '', `Date: ${dateStr}`, '', '', '', '', '', '', `Valid: ${validStr}`]);
  rows.push([`Project: ${projectName || customer.projectName || ''}`, ...Array(COLS-1).fill('')]);
  rows.push([...blank]);

  /* ── Customer block ── */
  rows.push(['BILL TO', ...Array(COLS-1).fill('')]);
  rows.push([`Name    : ${customer.name || '—'}`,    ...Array(COLS-1).fill('')]);
  rows.push([`Phone   : ${customer.phone || '—'}`,   ...Array(COLS-1).fill('')]);
  rows.push([`Email   : ${customer.email || '—'}`,   ...Array(COLS-1).fill('')]);
  rows.push([`Address : ${customer.address || '—'}, ${customer.city || ''}`, ...Array(COLS-1).fill('')]);
  rows.push([...blank]);

  /* ── Column header row ── */
  const HDR_ROW = rows.length;
  rows.push([
    'Sl No', 'Room', 'Product / Description', 'Quality Tier',
    'Material Specification',
    'L (ft)', 'B (ft)', 'Qty / Area', 'Unit',
    `Rate / Unit (${sym})`,
    `Add-ons (${sym})`,
    `Line Total (${sym})`,
    `GST %`,
    `GST Amt (${sym})`,
    `Net Amt incl GST (${sym})`,
  ]);

  /* ── Data rows ── */
  const grouped = groupByRoom(lineItems);
  let slNo = 1;

  grouped.forEach((roomItems, roomName) => {
    /* room section header */
    rows.push([`▸  ${roomName}`, ...Array(COLS-1).fill('')]);

    let roomSubtotal = 0;

    roomItems.forEach(item => {
      const addonAmt = getAddonTotal(item);
      const lineAmt  = item.lineTotal + addonAmt;
      const gstAmt   = (lineAmt * gst) / 100;
      const netAmt   = lineAmt + gstAmt;
      roomSubtotal  += lineAmt;

      const L = item.product?.unitType === 'per_sqft' ? item.dimensions?.length || 0
              : item.product?.unitType === 'per_rft'  ? item.dimensions?.length || 0
              : '';
      const B = item.product?.unitType === 'per_sqft' ? item.dimensions?.width  || 0 : '';
      const qtyArea = item.qty?.toFixed?.(1) || item.quantity || 1;

      rows.push([
        slNo++,
        roomName,
        item.product?.name || '',
        item.tier?.tierName || '',
        item.tier?.materialSpec || '',
        L,
        B,
        qtyArea,
        unitStr(item.product),
        item.unitRate || 0,
        addonAmt > 0 ? addonAmt : 0,
        lineAmt,
        gst,
        gstAmt,
        netAmt,
      ]);

      /* notes sub-row */
      if (item.notes) {
        rows.push(['', '', `  Notes: ${item.notes}`, ...Array(COLS-3).fill('')]);
      }
      /* addon names sub-row */
      if (item.selectedAddonIds?.length) {
        rows.push(['', '', `  Add-ons: ${getAddonNames(item)}`, ...Array(COLS-3).fill('')]);
      }
    });

    /* room subtotal */
    const roomGST = (roomSubtotal * gst) / 100;
    rows.push([
      '', `${roomName} — Subtotal`, ...Array(COLS-14).fill(''),
      '', '', '', '', '', '', '',
      roomSubtotal, gst, roomGST, roomSubtotal + roomGST,
    ]);
    rows.push([...blank]);
  });

  /* ── Grand totals block ── */
  const TOTALS_START = rows.length;
  const sub        = totals.subtotal;
  const disc       = totals.discountAmount || 0;
  const taxable    = sub - disc;
  const gstTotal   = totals.taxAmount;
  const install    = totals.installationCharge || 0;
  const transport  = totals.transportCharge    || 0;
  const grand      = taxable + gstTotal + install + transport;

  rows.push([...blank.slice(0,-4), '', 'Subtotal',           '', sub,    gst, sub*gst/100,   sub*(1+gst/100)].slice(-COLS).concat(Array(Math.max(0,COLS-15)).fill('')));
  // rebuild properly
  const totalRows = [
    ['','','','','','','','','','','Subtotal',           sub,    '',   '',           sub             ],
    ...(disc>0 ? [['','','','','','','','','','','Discount',          -disc,   '',  '',           -disc           ]] : []),
    ['','','','','','','','','','','Taxable Amount',     taxable,'',   '',           taxable         ],
    ['','','','','','','','','','',`CGST (${gst/2}%)`,  '',     gst/2,taxable*gst/2/100, taxable*gst/2/100],
    ['','','','','','','','','','',`SGST (${gst/2}%)`,  '',     gst/2,taxable*gst/2/100, taxable*gst/2/100],
    ...(install>0  ? [['','','','','','','','','','','Installation',      install, '',  '',           install         ]] : []),
    ...(transport>0? [['','','','','','','','','','','Transport',          transport,'', '',          transport       ]] : []),
    ['','','','','','','','','','','GRAND TOTAL',        grand,  '',   '',           grand           ],
  ];
  // pop the wrong row we pushed above
  rows.pop();
  totalRows.forEach(r => rows.push(r));

  /* ── Terms ── */
  rows.push([...blank]);
  const TERMS_START = rows.length;
  rows.push(['TERMS & CONDITIONS', ...Array(COLS-1).fill('')]);
  settings.termsAndConditions.forEach((t, i) => {
    rows.push([`${i+1}.  ${t}`, ...Array(COLS-1).fill('')]);
  });
  rows.push([...blank]);
  rows.push([
    `Computer-generated quotation  ·  ${settings.companyName}  ·  ${settings.companyPhone}`,
    ...Array(COLS-1).fill(''),
  ]);

  /* ── Create worksheet ── */
  const ws = XLSX.utils.aoa_to_sheet(rows);

  /* ── Column widths ── */
  ws['!cols'] = [
    { wch:5  }, // A  Sl
    { wch:16 }, // B  Room
    { wch:36 }, // C  Product
    { wch:11 }, // D  Tier
    { wch:42 }, // E  Spec
    { wch:7  }, // F  L
    { wch:7  }, // G  B
    { wch:10 }, // H  Qty
    { wch:6  }, // I  Unit
    { wch:14 }, // J  Rate
    { wch:14 }, // K  Add-ons
    { wch:15 }, // L  Line Total
    { wch:6  }, // M  GST%
    { wch:14 }, // N  GST Amt
    { wch:16 }, // O  Net Amt
  ];

  /* ── Number formats ── */
  const currFmt = `"${sym}"#,##0`;
  const pctFmt  = '0"%"';
  for (let r = 0; r < rows.length; r++) {
    // currency cols: J(9), K(10), L(11), N(13), O(14)
    [9,10,11,13,14].forEach(c => {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (ws[addr] && typeof ws[addr].v === 'number') {
        ws[addr].t = 'n'; ws[addr].z = currFmt;
      }
    });
    // pct col M(12)
    const mAddr = XLSX.utils.encode_cell({ r, c: 12 });
    if (ws[mAddr] && typeof ws[mAddr].v === 'number') {
      ws[mAddr].t = 'n'; ws[mAddr].z = pctFmt;
    }
  }

  /* ── Row heights ── */
  ws['!rows'] = rows.map((_, i) => {
    if (i === 0)        return { hpt: 22 };
    if (i === HDR_ROW)  return { hpt: 18 };
    return { hpt: 15 };
  });

  /* ── Merges (header block + terms) ── */
  const merges = [
    ...Array.from({ length: 14 }, (_, i) => ({
      s: { r: i, c: 0 }, e: { r: i, c: 10 },
    })),
    ...rows.slice(TERMS_START).map((_, i) => ({
      s: { r: TERMS_START+i, c: 0 }, e: { r: TERMS_START+i, c: COLS-1 },
    })),
  ];
  ws['!merges'] = merges;

  /* ── Page setup ── */
  ws['!pageSetup'] = { paperSize:9, orientation:'landscape', fitToPage:true, fitToWidth:1, fitToHeight:0 };

  /* ── Save ── */
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Quotation');
  XLSX.writeFile(wb, `${settings.companyName.replace(/\s+/g,'-')}-${quotationNumber}.xlsx`);
}
