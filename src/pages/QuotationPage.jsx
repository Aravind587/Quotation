/**
 * QuotationPage.jsx
 * Renders an A4-style printable quotation for every project in the store.
 * Each project gets its own sheet section grouped by room/category.
 * Buttons: Download XLSX (per project), Download PDF (all), Print.
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Printer, FileSpreadsheet,
  Loader2, CheckCircle2,
} from 'lucide-react';

import useCartStore from '../store/cartStore';
import { calcLineItem, calcQuotation, formatCurrency } from '../utils/pricing';
import { downloadXLSX } from '../utils/xlsxExport';
import { printQuotation, downloadPDF } from '../utils/pdfExport';
import settings from '../data/settings.json';
import categoriesData from '../data/categories.json';

const SYM = settings.currencySymbol;

/* ─── tiny helpers ───────────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
  return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
}
function validUntil(iso) {
  if (!iso) return '';
  return new Date(new Date(iso).getTime() + settings.quotationValidityDays * 86400000)
    .toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
}
function unitSuffix(p) {
  return { per_sqft:'sq ft', per_rft:'rft', per_unit:'unit' }[p?.unitType] || '';
}
const TIER_COLOR = {
  Economy:'#d1fae5', Standard:'#dbeafe', Premium:'#ede9fe', Luxury:'#fef3c7',
};

/* ─── Single A4 quotation sheet for one project ──────────────────── */
function QuotationSheet({ project, index }) {
  const customer = project.customer || {};
  const items    = project.items    || [];

  /* group items by roomLabel → if no room label, fall back to category name */
  const grouped = useMemo(() => {
    const map = {};
    items.forEach(item => {
      const key = item.roomLabel?.trim() ||
        categoriesData.find(c => c.id === item.product?.categoryId)?.name ||
        'General';
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [items]);

  const totals = useMemo(() => calcQuotation(
    items,
    { ...settings, installationCharge: project.installationCharge || 0, transportCharge: project.transportCharge || 0 },
    0
  ), [items, project]);

  const sn = project.quotationNumber || `IQ-DRAFT-${index + 1}`;
  const date = fmtDate(project.quotationDate);
  const valid = validUntil(project.quotationDate);

  return (
    <div
      id={`quotation-sheet-${project.id}`}
      className="bg-white w-full shadow-sm border border-stone-200 mb-8"
      style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px' }}
    >
      {/* ══ HEADER ══════════════════════════════════════════════════ */}
      <div style={{ borderBottom: '3px solid #d4822a', padding: '20px 24px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          {/* Company block */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:'#d4822a',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', fontWeight:'bold', fontSize:'13px', fontFamily:'Georgia,serif' }}>IQ</div>
              <div>
                <div style={{ fontWeight:'700', fontSize:'18px', color:'#1c1917', fontFamily:'Georgia,serif' }}>
                  {settings.companyName}
                </div>
                <div style={{ fontSize:'10px', color:'#78716c' }}>{settings.companyTagline}</div>
              </div>
            </div>
            <div style={{ fontSize:'10px', color:'#78716c', lineHeight:'1.6' }}>
              <div>{settings.companyAddress}</div>
              <div>{settings.companyPhone} &nbsp;|&nbsp; {settings.companyEmail}</div>
              <div>GSTIN: {settings.companyGST} &nbsp;|&nbsp; {settings.companyWebsite}</div>
            </div>
          </div>

          {/* Quotation badge */}
          <div style={{ textAlign:'right' }}>
            <div style={{ background:'#fff7ed', border:'1px solid #fed7aa',
              borderRadius:'10px', padding:'10px 16px', display:'inline-block', marginBottom:'6px' }}>
              <div style={{ fontSize:'10px', color:'#d4822a', fontWeight:'700', textTransform:'uppercase', letterSpacing:'1px' }}>Quotation</div>
              <div style={{ fontSize:'16px', fontWeight:'800', color:'#1c1917' }}>{sn}</div>
            </div>
            <div style={{ fontSize:'10px', color:'#78716c', lineHeight:'1.7' }}>
              <div>Date: <strong style={{ color:'#1c1917' }}>{date}</strong></div>
              <div>Valid until: <strong style={{ color:'#1c1917' }}>{valid}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ CUSTOMER + PROJECT ══════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'#e7e5e4',
        borderBottom:'1px solid #e7e5e4' }}>
        <div style={{ background:'#fafaf9', padding:'12px 16px' }}>
          <div style={{ fontSize:'9px', fontWeight:'700', textTransform:'uppercase',
            letterSpacing:'1px', color:'#a8a29e', marginBottom:'6px' }}>Bill To</div>
          <div style={{ fontWeight:'700', fontSize:'13px', color:'#1c1917' }}>{customer.name || '—'}</div>
          {customer.projectName && <div style={{ fontSize:'10px', color:'#d4822a', fontWeight:'600' }}>{customer.projectName}</div>}
          <div style={{ fontSize:'10px', color:'#78716c', lineHeight:'1.7', marginTop:'3px' }}>
            {customer.phone && <div>📞 {customer.phone}</div>}
            {customer.email && <div>✉ {customer.email}</div>}
            {customer.address && <div>📍 {customer.address}{customer.city ? `, ${customer.city}` : ''}</div>}
          </div>
        </div>
        <div style={{ background:'#fafaf9', padding:'12px 16px' }}>
          <div style={{ fontSize:'9px', fontWeight:'700', textTransform:'uppercase',
            letterSpacing:'1px', color:'#a8a29e', marginBottom:'6px' }}>Payment Terms</div>
          <div style={{ fontSize:'10px', color:'#57534e', lineHeight:'1.7' }}>
            <div>• 50% advance to commence work</div>
            <div>• 40% on material delivery</div>
            <div>• 10% on project completion</div>
          </div>
          <div style={{ marginTop:'8px', fontSize:'9px', color:'#a8a29e' }}>
            All amounts in {settings.currencyCode}. GST included in grand total.
          </div>
        </div>
      </div>

      {/* ══ ITEMS TABLE ═════════════════════════════════════════════ */}
      <div style={{ padding:'0' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11px' }}>
          <thead>
            <tr style={{ background:'#1c1917', color:'white' }}>
              <th style={{ padding:'8px 10px', textAlign:'left', width:'28px', fontWeight:'600', fontSize:'10px' }}>#</th>
              <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:'600', fontSize:'10px' }}>Description & Specification</th>
              <th style={{ padding:'8px 8px', textAlign:'center', width:'70px', fontWeight:'600', fontSize:'10px' }}>Quality Tier</th>
              <th style={{ padding:'8px 8px', textAlign:'center', width:'80px', fontWeight:'600', fontSize:'10px' }}>Qty / Area</th>
              <th style={{ padding:'8px 8px', textAlign:'right', width:'90px', fontWeight:'600', fontSize:'10px' }}>Unit Rate</th>
              <th style={{ padding:'8px 8px', textAlign:'right', width:'90px', fontWeight:'600', fontSize:'10px' }}>Add-ons</th>
              <th style={{ padding:'8px 10px', textAlign:'right', width:'100px', fontWeight:'600', fontSize:'10px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([roomName, roomItems], gi) => {
              const roomTotal = roomItems.reduce((s, item) => {
                const { lineTotal } = calcLineItem(item.product, item.tier, item.dimensions, item.quantity, item.selectedAddons);
                return s + lineTotal;
              }, 0);

              return (
                <React.Fragment key={gi}>
                  {/* Room/section header row */}
                  <tr>
                    <td colSpan={7} style={{
                      background:'#f5f5f4', padding:'7px 10px',
                      fontWeight:'700', fontSize:'11px', color:'#44403c',
                      borderTop:'1px solid #e7e5e4', borderBottom:'1px solid #e7e5e4',
                      letterSpacing:'0.3px',
                    }}>
                      ▸ {roomName}
                    </td>
                  </tr>

                  {/* Product rows */}
                  {roomItems.map((item, ii) => {
                    const { qty, unitRate, addonTotal, lineTotal } = calcLineItem(
                      item.product, item.tier, item.dimensions, item.quantity, item.selectedAddons
                    );
                    const rowBg = ii % 2 === 0 ? '#ffffff' : '#fafaf9';
                    const tierColor = TIER_COLOR[item.tier?.tierName] || '#f5f5f4';

                    return (
                      <tr key={item.id} style={{ background: rowBg, borderBottom:'1px solid #f5f5f4' }}>
                        {/* # */}
                        <td style={{ padding:'8px 10px', color:'#a8a29e', verticalAlign:'top', textAlign:'center' }}>
                          {ii + 1}
                        </td>
                        {/* Description */}
                        <td style={{ padding:'8px 10px', verticalAlign:'top' }}>
                          <div style={{ fontWeight:'600', color:'#1c1917', marginBottom:'2px' }}>{item.product?.name}</div>
                          <div style={{ fontSize:'9px', color:'#78716c', lineHeight:'1.5' }}>{item.tier?.materialSpec}</div>
                          {(item.selectedAddons?.length > 0) && (
                            <div style={{ fontSize:'9px', color:'#a8a29e', marginTop:'2px' }}>
                              + {item.selectedAddons.map(a => a.name).join(', ')}
                            </div>
                          )}
                        </td>
                        {/* Tier */}
                        <td style={{ padding:'8px', textAlign:'center', verticalAlign:'top' }}>
                          <span style={{
                            background: tierColor, borderRadius:'4px',
                            padding:'2px 6px', fontSize:'9px', fontWeight:'700',
                            color:'#1c1917', display:'inline-block',
                          }}>{item.tier?.tierName}</span>
                        </td>
                        {/* Qty */}
                        <td style={{ padding:'8px', textAlign:'center', verticalAlign:'top', color:'#44403c' }}>
                          {qty.toFixed(1)}<br/>
                          <span style={{ fontSize:'9px', color:'#a8a29e' }}>{unitSuffix(item.product)}</span>
                        </td>
                        {/* Unit rate */}
                        <td style={{ padding:'8px', textAlign:'right', verticalAlign:'top', color:'#44403c' }}>
                          {formatCurrency(unitRate, SYM)}
                        </td>
                        {/* Add-ons */}
                        <td style={{ padding:'8px', textAlign:'right', verticalAlign:'top', color:'#78716c' }}>
                          {addonTotal > 0 ? `+${formatCurrency(addonTotal, SYM)}` : '—'}
                        </td>
                        {/* Amount */}
                        <td style={{ padding:'8px 10px', textAlign:'right', verticalAlign:'top',
                          fontWeight:'700', color:'#1c1917' }}>
                          {formatCurrency(lineTotal, SYM)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Room subtotal */}
                  <tr>
                    <td colSpan={6} style={{ padding:'5px 10px', textAlign:'right',
                      fontSize:'10px', color:'#78716c', background:'#f5f5f4',
                      borderTop:'1px solid #e7e5e4', fontStyle:'italic' }}>
                      {roomName} subtotal
                    </td>
                    <td style={{ padding:'5px 10px', textAlign:'right', fontWeight:'700',
                      color:'#d4822a', background:'#fff7ed', borderTop:'1px solid #e7e5e4',
                      fontSize:'11px' }}>
                      {formatCurrency(roomTotal, SYM)}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ══ TOTALS BLOCK ════════════════════════════════════════════ */}
      <div style={{ display:'flex', justifyContent:'flex-end', borderTop:'2px solid #e7e5e4', padding:'16px 24px' }}>
        <table style={{ fontSize:'11px', minWidth:'280px' }}>
          <tbody>
            <tr>
              <td style={{ padding:'4px 12px 4px 0', color:'#78716c' }}>Subtotal</td>
              <td style={{ padding:'4px 0', textAlign:'right', fontWeight:'600', color:'#1c1917' }}>
                {formatCurrency(totals.subtotal, SYM)}
              </td>
            </tr>
            {totals.discountAmount > 0 && (
              <tr>
                <td style={{ padding:'4px 12px 4px 0', color:'#16a34a' }}>Discount</td>
                <td style={{ padding:'4px 0', textAlign:'right', fontWeight:'600', color:'#16a34a' }}>
                  − {formatCurrency(totals.discountAmount, SYM)}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ padding:'4px 12px 4px 0', color:'#78716c' }}>Taxable Amount</td>
              <td style={{ padding:'4px 0', textAlign:'right', fontWeight:'600', color:'#1c1917' }}>
                {formatCurrency(totals.taxableAmount, SYM)}
              </td>
            </tr>
            <tr>
              <td style={{ padding:'4px 12px 4px 0', color:'#78716c' }}>CGST ({totals.gstPercent / 2}%)</td>
              <td style={{ padding:'4px 0', textAlign:'right', color:'#57534e' }}>
                {formatCurrency(totals.taxAmount / 2, SYM)}
              </td>
            </tr>
            <tr>
              <td style={{ padding:'4px 12px 4px 0', color:'#78716c' }}>SGST ({totals.gstPercent / 2}%)</td>
              <td style={{ padding:'4px 0', textAlign:'right', color:'#57534e' }}>
                {formatCurrency(totals.taxAmount / 2, SYM)}
              </td>
            </tr>
            {totals.installationCharge > 0 && (
              <tr>
                <td style={{ padding:'4px 12px 4px 0', color:'#78716c' }}>Installation</td>
                <td style={{ padding:'4px 0', textAlign:'right', color:'#57534e' }}>
                  {formatCurrency(totals.installationCharge, SYM)}
                </td>
              </tr>
            )}
            {totals.transportCharge > 0 && (
              <tr>
                <td style={{ padding:'4px 12px 4px 0', color:'#78716c' }}>Transport</td>
                <td style={{ padding:'4px 0', textAlign:'right', color:'#57534e' }}>
                  {formatCurrency(totals.transportCharge, SYM)}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={2}>
                <div style={{ borderTop:'2px solid #1c1917', marginTop:'4px', paddingTop:'6px',
                  display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                  <span style={{ fontWeight:'800', fontSize:'13px', color:'#1c1917' }}>GRAND TOTAL</span>
                  <span style={{ fontWeight:'800', fontSize:'18px', color:'#d4822a' }}>
                    {formatCurrency(totals.grandTotal, SYM)}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ══ TERMS ═══════════════════════════════════════════════════ */}
      <div style={{ borderTop:'1px solid #e7e5e4', padding:'12px 24px 16px', background:'#fafaf9' }}>
        <div style={{ fontSize:'9px', fontWeight:'700', textTransform:'uppercase',
          letterSpacing:'1px', color:'#a8a29e', marginBottom:'6px' }}>Terms & Conditions</div>
        <ol style={{ paddingLeft:'14px', margin:0, color:'#78716c', fontSize:'9px', lineHeight:'1.7' }}>
          {settings.termsAndConditions.map((t, i) => (
            <li key={i} style={{ marginBottom:'2px' }}>{t}</li>
          ))}
        </ol>
      </div>

      {/* ══ FOOTER ══════════════════════════════════════════════════ */}
      <div style={{ borderTop:'1px solid #e7e5e4', padding:'8px 24px',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        background:'#1c1917', color:'white', fontSize:'9px' }}>
        <span style={{ color:'#a8a29e' }}>Computer-generated quotation. No signature required.</span>
        <span style={{ color:'#d4822a', fontWeight:'600' }}>Thank you for choosing {settings.companyName}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN QUOTATION PAGE
═══════════════════════════════════════════════════════════════════ */
export default function QuotationPage() {
  const navigate  = useNavigate();
  const projects  = useCartStore(s => s.projects);

  const [xlsxLoading, setXlsxLoading] = useState(null);  // project id
  const [pdfLoading,  setPdfLoading]  = useState(false);

  /* only show projects that have items + a quotation number */
  const readyProjects = projects.filter(p => p.items?.length > 0);

  if (readyProjects.length === 0) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 shadow text-center max-w-sm">
          <FileSpreadsheet size={48} className="mx-auto text-stone-200 mb-4"/>
          <h2 className="font-display font-bold text-stone-800 text-xl mb-2">No quotation yet</h2>
          <p className="text-stone-400 text-sm mb-6">Add products to a project and click Generate.</p>
          <button onClick={() => navigate('/')} className="btn-primary">← Back to Products</button>
        </div>
      </div>
    );
  }

  const handleXLSX = async (project) => {
    setXlsxLoading(project.id);
    try {
      const items = project.items || [];
      const totals = calcQuotation(
        items,
        { ...settings, installationCharge: project.installationCharge || 0, transportCharge: project.transportCharge || 0 },
        0
      );
      const lineItems = totals.lineItems;
      await downloadXLSX({
        lineItems,
        totals,
        customer: project.customer || {},
        quotationNumber: project.quotationNumber || `IQ-DRAFT`,
        quotationDate: project.quotationDate || new Date().toISOString(),
        settings: { ...settings, installationCharge: project.installationCharge || 0, transportCharge: project.transportCharge || 0 },
        projectName: project.name,
      });
    } catch (e) {
      console.error(e);
      alert('XLSX export failed: ' + e.message);
    } finally {
      setXlsxLoading(null);
    }
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      await downloadPDF('quotation-print-area', `InteriorCraft-Quotation`);
    } catch (e) {
      console.error(e);
      alert('PDF export failed. Use Print → Save as PDF instead.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100">
      {/* ── Action bar (no-print) ── */}
      <div className="no-print sticky top-0 z-20 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate('/')} className="btn-ghost text-stone-500 text-sm">
            <ArrowLeft size={15}/> Back to Products
          </button>

          <div className="flex flex-wrap gap-2">
            <button onClick={handlePDF} disabled={pdfLoading} className="btn-secondary text-sm">
              {pdfLoading ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
              {pdfLoading ? 'Generating…' : 'Download PDF'}
            </button>
            <button onClick={printQuotation} className="btn-ghost text-sm border border-stone-200">
              <Printer size={14}/> Print
            </button>
          </div>
        </div>
      </div>

      {/* ── Sheets ── */}
      <div id="quotation-print-area" className="max-w-4xl mx-auto px-4 py-8 space-y-0">
        {readyProjects.map((project, i) => (
          <div key={project.id}>
            {/* Per-project toolbar (no-print) */}
            <div className="no-print flex items-center justify-between mb-3">
              <div>
                <h2 className="font-display font-bold text-stone-800 text-lg">{project.name}</h2>
                <p className="text-stone-400 text-xs">{project.items.length} line item{project.items.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => handleXLSX(project)}
                disabled={xlsxLoading === project.id}
                className="btn-primary text-sm"
              >
                {xlsxLoading === project.id
                  ? <><Loader2 size={14} className="animate-spin"/> Generating…</>
                  : <><FileSpreadsheet size={14}/> Download Excel</>}
              </button>
            </div>

            <QuotationSheet project={project} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
