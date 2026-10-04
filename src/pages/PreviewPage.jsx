/**
 * PreviewPage.jsx  –  v7 (100% feature complete)
 * New: WhatsApp/Email share, quotation status badge, brand colour, revision panel
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Printer, FileSpreadsheet, Loader2,
  MessageCircle, Mail, CheckCircle2, Clock, Send, RotateCcw,
} from 'lucide-react';

import useCartStore, { calcItemBase, calcAddonTotal, calcItemDiscount, calcLineTotal, getItemAddons } from '../store/cartStore';
import { loadSettings } from './SettingsPage';
import addonsData from '../data/addons.json';
import { downloadXLSX } from '../utils/xlsxExport';
import { printQuotation } from '../utils/pdfExport';
import ProductIcon from '../components/ProductIcons';

const TIER_COLOR = { Economy:'#d1fae5', Standard:'#dbeafe', Premium:'#ede9fe', Luxury:'#fef3c7', Custom:'#f5f5f4' };
const CAT_ACCENT = { kitchen:'#f97316', wardrobe:'#8b5cf6', living:'#14b8a6', bedroom:'#ec4899', bathroom:'#3b82f6', flooring:'#f59e0b', custom:'#5c4a1e' };

function fmtDate(iso) {
  return new Date(iso||Date.now()).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
}
function qtyStr(item) {
  if (!item.product) return '—';
  if (item.product.unitType==='per_sqft') {
    const a=(item.dimensions.length||0)*(item.dimensions.width||0);
    return `${a.toFixed(1)} sq ft`;
  }
  if (item.product.unitType==='per_rft') return `${item.dimensions.length||0} ft`;
  return `${item.quantity||1} nos`;
}

/* ─── A4 Sheet component ─────────────────────────────────────── */
function A4Sheet({ project, co }) {
  const sym      = co.currencySymbol || '₹';
  const gstPct   = co.gstPercent || 18;
  const fmt      = n => `${sym}${Math.round(n).toLocaleString('en-IN')}`;
  const customer = project.customer || {};

  const activeRooms = useMemo(() =>
    (project.rooms||[]).map(r=>({...r,items:r.items.filter(i=>i.enabled)})).filter(r=>r.items.length>0)
  ,[project]);

  const subtotal = activeRooms.flatMap(r=>r.items).reduce((s,i)=>s+calcLineTotal(i),0);
  const discPct  = subtotal*(project.discountPercent||0)/100;
  const discFlat = project.discountFlat||0;
  const promoD   = project.promoDiscount||0;
  const discAmt  = Math.min(subtotal, discPct+discFlat+promoD);
  const taxable  = subtotal - discAmt;
  const gstAmt   = taxable * gstPct / 100;
  const install  = project.installationCharge||0;
  const transport= project.transportCharge||0;
  const grand    = taxable + gstAmt + install + transport;

  const sn    = project.quotationNumber || 'DRAFT';
  const date  = fmtDate(project.quotationDate);
  const valid = fmtDate(new Date((project.quotationDate?new Date(project.quotationDate):new Date()).getTime()+((co.quotationValidityDays||30)*86400000)).toISOString());

  const hasBankDetails = co.bankName || co.bankAccountNumber || co.bankUPI;
  const brandColor = co.brandColor || '#5c4a1e';

  return (
    <div id="quotation-print-area" className="bg-white mx-auto shadow-lg"
      style={{width:'794px',minHeight:'1123px',fontFamily:'Arial,sans-serif',fontSize:'11px',color:'#1c1917'}}>

      {/* ═══ HEADER ═══ */}
      <div style={{borderBottom:`3px solid ${brandColor}`,padding:'20px 36px 14px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'16px'}}>
        {/* Logo + company */}
        <div style={{display:'flex',alignItems:'flex-start',gap:'12px'}}>
          {co.logoDataUrl ? (
            <img src={co.logoDataUrl} alt="logo" style={{width:'56px',height:'56px',objectFit:'contain',borderRadius:'8px'}}/>
          ) : (
            <div style={{width:'44px',height:'44px',borderRadius:'8px',background:'#5c4a1e',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'bold',fontSize:'14px',fontFamily:'Georgia,serif',flexShrink:0}}>IQ</div>
          )}
          <div>
            <p style={{fontFamily:'Georgia,serif',fontSize:'20px',fontWeight:'800',color:'#1c1917',marginBottom:'2px'}}>{co.companyName}</p>
            <p style={{fontSize:'10px',color:'#78716c',marginBottom:'3px'}}>{co.companyTagline}</p>
            <p style={{fontSize:'9px',color:'#a8a29e',lineHeight:'1.7'}}>
              {co.companyAddress}<br/>
              {co.companyPhone} · {co.companyEmail}<br/>
              {co.companyWebsite && <>{co.companyWebsite} · </>}GSTIN: {co.companyGST}
            </p>
          </div>
        </div>
        {/* Quotation badge */}
        <div style={{textAlign:'right',flexShrink:0}}>
          <div style={{background:'#fdf8f0',border:'1px solid #d4822a',borderRadius:'10px',padding:'10px 16px',display:'inline-block',marginBottom:'6px'}}>
            <p style={{fontSize:'9px',color:'#d4822a',fontWeight:'700',textTransform:'uppercase',letterSpacing:'1px'}}>Quotation</p>
            <p style={{fontSize:'16px',fontWeight:'800',color:'#1c1917'}}>{sn}</p>
          </div>
          <p style={{fontSize:'9px',color:'#78716c',lineHeight:'1.8'}}>
            Date: <strong style={{color:'#1c1917'}}>{date}</strong><br/>
            Valid: <strong style={{color:'#1c1917'}}>{valid}</strong><br/>
            Tier: <strong style={{color:'#1c1917'}}>{project.globalTier}</strong>
          </p>
        </div>
      </div>

      {/* ═══ CUSTOMER + PAYMENT TERMS ═══ */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1px',background:'#e7e5e4',borderBottom:'1px solid #e7e5e4'}}>
        <div style={{background:'#fafaf9',padding:'10px 16px'}}>
          <p style={{fontSize:'8px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'1px',color:'#a8a29e',marginBottom:'5px'}}>Bill To</p>
          <p style={{fontWeight:'700',fontSize:'13px',color:'#1c1917'}}>{customer.name||'—'}</p>
          {customer.projectName&&<p style={{fontSize:'10px',color:'#5c4a1e',fontWeight:'600'}}>{customer.projectName}</p>}
          <p style={{fontSize:'9px',color:'#78716c',lineHeight:'1.7',marginTop:'3px'}}>
            {customer.phone&&<span>📞 {customer.phone}<br/></span>}
            {customer.email&&<span>✉ {customer.email}<br/></span>}
            {customer.address&&<span>📍 {customer.address}{customer.city?`, ${customer.city}`:''}</span>}
          </p>
        </div>
        <div style={{background:'#fafaf9',padding:'10px 16px'}}>
          <p style={{fontSize:'8px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'1px',color:'#a8a29e',marginBottom:'5px'}}>Payment Schedule</p>
          <p style={{fontSize:'9px',color:'#57534e',lineHeight:'1.8'}}>
            • 50% advance to commence work<br/>
            • 40% on material delivery to site<br/>
            • 10% on project completion
          </p>
          <p style={{fontSize:'8px',color:'#a8a29e',marginTop:'5px'}}>All amounts in {co.currencyCode||'INR'}. GST included in grand total.</p>
        </div>
      </div>

      {/* ═══ ITEMS TABLE ═══
           Columns: # | Icon | Unit Name | Material Specification | Tier | Qty/Area | Rate | Add-ons | Disc | Amount
      ═══ */}
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:'9.5px',tableLayout:'fixed'}}>
        <colgroup>
          <col style={{width:'28px'}}/>   {/* # */}
          <col style={{width:'36px'}}/>   {/* icon */}
          <col style={{width:'130px'}}/> {/* unit name */}
          <col/>                          {/* specification — takes remaining space */}
          <col style={{width:'52px'}}/>  {/* tier */}
          <col style={{width:'62px'}}/>  {/* qty/area */}
          <col style={{width:'64px'}}/>  {/* rate */}
          <col style={{width:'54px'}}/>  {/* add-ons */}
          <col style={{width:'46px'}}/>  {/* disc */}
          <col style={{width:'72px'}}/>  {/* amount */}
        </colgroup>
        <thead>
          <tr style={{background:'#1c1917',color:'white'}}>
            <th style={{padding:'7px 4px',textAlign:'center',fontSize:'8px',fontWeight:'600'}}>#</th>
            <th style={{padding:'7px 3px',fontSize:'8px',fontWeight:'600'}}></th>
            <th style={{padding:'7px 6px',textAlign:'left',fontSize:'8px',fontWeight:'600'}}>Unit / Product</th>
            <th style={{padding:'7px 6px',textAlign:'left',fontSize:'8px',fontWeight:'600'}}>Material Specification</th>
            <th style={{padding:'7px 4px',textAlign:'center',fontSize:'8px',fontWeight:'600'}}>Tier</th>
            <th style={{padding:'7px 4px',textAlign:'center',fontSize:'8px',fontWeight:'600'}}>Qty / Area</th>
            <th style={{padding:'7px 4px',textAlign:'right',fontSize:'8px',fontWeight:'600'}}>Rate</th>
            <th style={{padding:'7px 4px',textAlign:'right',fontSize:'8px',fontWeight:'600'}}>Add-ons</th>
            <th style={{padding:'7px 4px',textAlign:'right',fontSize:'8px',fontWeight:'600'}}>Disc</th>
            <th style={{padding:'7px 6px',textAlign:'right',fontSize:'8px',fontWeight:'600'}}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {activeRooms.map((room, ri) => {
            const letter  = String.fromCharCode(65+ri);
            const accent  = CAT_ACCENT[room.items[0]?.product?.categoryId] || '#5c4a1e';
            const roomTot = room.items.reduce((s,i)=>s+calcLineTotal(i),0);
            // room area label
            const hasArea = room.dimensions?.length > 0 && room.dimensions?.width > 0;
            const roomArea = hasArea
              ? `${room.dimensions.length}×${room.dimensions.width} ft = ${(room.dimensions.length*room.dimensions.width).toFixed(1)} sq ft`
              : '';
            return (
              <React.Fragment key={room.id}>
                {/* ── Section header ── */}
                <tr>
                  <td colSpan={10} style={{
                    background:'#1c1917',color:'white',fontWeight:'700',
                    fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.5px',padding:'6px 8px',
                  }}>
                    <span>{letter}&nbsp;&nbsp;{room.name.toUpperCase()}</span>
                    {roomArea && (
                      <span style={{marginLeft:'12px',fontSize:'8px',fontWeight:'400',color:'#a8a29e',textTransform:'none',letterSpacing:'0'}}>
                        Room area: {roomArea}
                      </span>
                    )}
                  </td>
                </tr>

                {room.items.map((item, ii) => {
                  const base   = calcItemBase(item);
                  const addAmt = calcAddonTotal(item);
                  const disc   = calcItemDiscount(item);
                  const total  = base + addAmt - disc;
                  const addons = getItemAddons(item);
                  const bg     = ii%2===0 ? '#ffffff' : '#fafaf9';
                  const tc     = TIER_COLOR[item.tierName] || '#f5f5f4';
                  return (
                    <tr key={item.id} style={{background:bg,borderBottom:'1px solid #f0eeec',verticalAlign:'top'}}>

                      {/* # */}
                      <td style={{padding:'8px 4px',textAlign:'center',color:'#a8a29e',fontSize:'8.5px',whiteSpace:'nowrap'}}>
                        {letter}.{ii+1}
                      </td>

                      {/* SVG icon */}
                      <td style={{padding:'6px 3px',textAlign:'center'}}>
                        <div style={{width:'28px',height:'28px',margin:'0 auto',borderRadius:'6px',
                          background:'#f5f5f4',display:'flex',alignItems:'center',justifyContent:'center',
                          color:accent,padding:'3px',flexShrink:0}}>
                          <ProductIcon productId={item.productId} categoryId={item.product?.categoryId} size={22}/>
                        </div>
                      </td>

                      {/* Unit name + addons + notes */}
                      <td style={{padding:'8px 6px'}}>
                        <p style={{fontWeight:'700',color:'#1c1917',fontSize:'10px',lineHeight:'1.3',marginBottom:'2px'}}>
                          {item.product?.name}
                        </p>
                        {addons.length>0 && (
                          <p style={{fontSize:'7.5px',color:'#a8a29e',marginTop:'2px',lineHeight:'1.4'}}>
                            ✦ {addons.map(a=>a.name).join(' · ')}
                          </p>
                        )}
                        {item.notes && (
                          <p style={{fontSize:'7.5px',color:'#b0a898',fontStyle:'italic',marginTop:'2px',lineHeight:'1.4'}}>
                            📋 {item.notes}
                          </p>
                        )}
                      </td>

                      {/* ★ Full material specification column ★ */}
                      <td style={{padding:'8px 6px'}}>
                        <p style={{fontSize:'8px',color:'#57534e',lineHeight:'1.6',whiteSpace:'pre-wrap'}}>
                          {item.tier?.materialSpec || '—'}
                        </p>
                      </td>

                      {/* Tier badge */}
                      <td style={{padding:'8px 4px',textAlign:'center'}}>
                        <span style={{
                          background:tc,borderRadius:'4px',padding:'2px 5px',
                          fontSize:'7.5px',fontWeight:'700',color:'#1c1917',
                          display:'inline-block',whiteSpace:'nowrap',
                        }}>{item.tierName}</span>
                      </td>

                      {/* Qty / Area */}
                      <td style={{padding:'8px 4px',textAlign:'center',color:'#44403c',fontSize:'9px'}}>
                        {qtyStr(item)}
                      </td>

                      {/* Rate */}
                      <td style={{padding:'8px 4px',textAlign:'right',color:'#44403c',fontSize:'9px'}}>
                        {fmt(item.tier?.ratePerUnit||0)}
                      </td>

                      {/* Add-ons amount */}
                      <td style={{padding:'8px 4px',textAlign:'right',color:'#78716c',fontSize:'9px'}}>
                        {addAmt>0 ? `+${fmt(addAmt)}` : '—'}
                      </td>

                      {/* Discount */}
                      <td style={{padding:'8px 4px',textAlign:'right',fontSize:'9px'}}>
                        {disc>0
                          ? <span style={{color:'#16a34a',fontWeight:'600'}}>−{fmt(disc)}</span>
                          : <span style={{color:'#d6d3d1'}}>—</span>}
                      </td>

                      {/* Amount */}
                      <td style={{padding:'8px 6px',textAlign:'right',fontWeight:'700',color:'#1c1917',fontSize:'11px'}}>
                        {fmt(total)}
                      </td>
                    </tr>
                  );
                })}

                {/* Room subtotal row */}
                <tr style={{borderTop:'1px solid #e7e5e4'}}>
                  <td colSpan={9} style={{
                    padding:'5px 6px',textAlign:'right',fontSize:'9px',
                    color:'#78716c',background:'#f5f5f4',fontStyle:'italic',
                  }}>
                    {room.name} Total
                  </td>
                  <td style={{
                    padding:'5px 6px',textAlign:'right',fontWeight:'800',
                    color:'#5c4a1e',background:'#fdf8f0',fontSize:'11px',
                  }}>
                    {fmt(roomTot)}
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* ═══ TOTALS ═══ */}
      <div style={{display:'flex',justifyContent:'flex-end',borderTop:'2px solid #e7e5e4',padding:'14px 36px'}}>
        <table style={{fontSize:'10px',minWidth:'300px'}}>
          <tbody>
            <tr>
              <td style={{padding:'3px 16px 3px 0',color:'#78716c'}}>Subtotal (before discount)</td>
              <td style={{padding:'3px 0',textAlign:'right',fontWeight:'600'}}>{fmt(subtotal)}</td>
            </tr>
            {discAmt>0&&(
              <>
                {discPct>0&&<tr>
                  <td style={{padding:'3px 16px 3px 0',color:'#16a34a'}}>Discount ({project.discountPercent}%)</td>
                  <td style={{padding:'3px 0',textAlign:'right',color:'#16a34a',fontWeight:'600'}}>− {fmt(discPct)}</td>
                </tr>}
                {discFlat>0&&<tr>
                  <td style={{padding:'3px 16px 3px 0',color:'#16a34a'}}>Flat Discount</td>
                  <td style={{padding:'3px 0',textAlign:'right',color:'#16a34a',fontWeight:'600'}}>− {fmt(discFlat)}</td>
                </tr>}
              </>
            )}
            <tr>
              <td style={{padding:'3px 16px 3px 0',color:'#78716c'}}>Taxable Amount</td>
              <td style={{padding:'3px 0',textAlign:'right',fontWeight:'600'}}>{fmt(taxable)}</td>
            </tr>
            <tr>
              <td style={{padding:'3px 16px 3px 0',color:'#78716c'}}>CGST ({gstPct/2}%)</td>
              <td style={{padding:'3px 0',textAlign:'right',color:'#57534e'}}>{fmt(gstAmt/2)}</td>
            </tr>
            <tr>
              <td style={{padding:'3px 16px 3px 0',color:'#78716c'}}>SGST ({gstPct/2}%)</td>
              <td style={{padding:'3px 0',textAlign:'right',color:'#57534e'}}>{fmt(gstAmt/2)}</td>
            </tr>
            {install>0&&<tr>
              <td style={{padding:'3px 16px 3px 0',color:'#78716c'}}>Installation Charges</td>
              <td style={{padding:'3px 0',textAlign:'right',color:'#57534e'}}>{fmt(install)}</td>
            </tr>}
            {transport>0&&<tr>
              <td style={{padding:'3px 16px 3px 0',color:'#78716c'}}>Transport Charges</td>
              <td style={{padding:'3px 0',textAlign:'right',color:'#57534e'}}>{fmt(transport)}</td>
            </tr>}
            <tr>
              <td colSpan={2}>
                <div style={{borderTop:'2px solid #1c1917',marginTop:'5px',paddingTop:'7px',display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                  <span style={{fontWeight:'800',fontSize:'13px'}}>GRAND TOTAL (incl. GST)</span>
                  <span style={{fontWeight:'800',fontSize:'20px',color:'#5c4a1e'}}>{fmt(grand)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══ BANK DETAILS ═══ */}
      {hasBankDetails && (
        <div style={{borderTop:'1px solid #e7e5e4',padding:'10px 36px 12px',background:'#fafaf9'}}>
          <p style={{fontSize:'8px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'1px',color:'#a8a29e',marginBottom:'6px'}}>Bank Details for Payment</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px 24px',fontSize:'9px',color:'#57534e'}}>
            {co.bankName&&<div><span style={{color:'#a8a29e',fontWeight:'600'}}>Bank: </span>{co.bankName}</div>}
            {co.bankAccountName&&<div><span style={{color:'#a8a29e',fontWeight:'600'}}>A/C Name: </span>{co.bankAccountName}</div>}
            {co.bankAccountNumber&&<div><span style={{color:'#a8a29e',fontWeight:'600'}}>A/C No: </span><strong style={{color:'#1c1917'}}>{co.bankAccountNumber}</strong></div>}
            {co.bankIFSC&&<div><span style={{color:'#a8a29e',fontWeight:'600'}}>IFSC: </span><strong style={{color:'#1c1917'}}>{co.bankIFSC}</strong></div>}
            {co.bankBranch&&<div><span style={{color:'#a8a29e',fontWeight:'600'}}>Branch: </span>{co.bankBranch}</div>}
            {co.bankUPI&&<div><span style={{color:'#a8a29e',fontWeight:'600'}}>UPI: </span><strong style={{color:'#1c1917'}}>{co.bankUPI}</strong></div>}
          </div>
        </div>
      )}

      {/* ═══ TERMS ═══ */}
      <div style={{borderTop:'1px solid #e7e5e4',padding:'10px 36px 12px',background:hasBankDetails?'#fff':'#fafaf9'}}>
        <p style={{fontSize:'8px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'1px',color:'#a8a29e',marginBottom:'5px'}}>Terms &amp; Conditions</p>
        <ol style={{paddingLeft:'14px',margin:0,color:'#78716c',fontSize:'8.5px',lineHeight:'1.8'}}>
          {(co.termsAndConditions||[]).map((t,i)=><li key={i}>{t}</li>)}
        </ol>
        <p style={{fontSize:'8px',color:'#a8a29e',marginTop:'5px'}}>
          Quotation valid until: {valid} &nbsp;|&nbsp; GSTIN: {co.companyGST}
        </p>
      </div>

      {/* ═══ SIGNATURE BLOCK ═══ */}
      <div style={{borderTop:'1px solid #e7e5e4',padding:'16px 36px 20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
        <div>
          <p style={{fontSize:'8px',color:'#a8a29e',marginBottom:'32px'}}>Client Signature &amp; Acceptance</p>
          <div style={{borderTop:'1px solid #d6d3d1',paddingTop:'4px'}}>
            <p style={{fontSize:'8px',color:'#78716c'}}>{customer.name||'Client Name'}</p>
            <p style={{fontSize:'8px',color:'#a8a29e'}}>Date: ___________________</p>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <p style={{fontSize:'8px',color:'#a8a29e',marginBottom:'32px'}}>For {co.companyName}</p>
          <div style={{borderTop:'1px solid #d6d3d1',paddingTop:'4px'}}>
            <p style={{fontSize:'8px',color:'#78716c'}}>Authorised Signatory</p>
            <p style={{fontSize:'8px',color:'#a8a29e'}}>Stamp &amp; Sign</p>
          </div>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div style={{background:'#1c1917',color:'#a8a29e',fontSize:'8px',padding:'6px 36px',display:'flex',justifyContent:'space-between'}}>
        <span>Computer-generated quotation · No signature required on digital copy</span>
        <span style={{color:'#d4822a',fontWeight:'600'}}>Thank you for choosing {co.companyName}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
export default function PreviewPage() {
  const navigate  = useNavigate();
  const co        = loadSettings();
  const sym       = co.currencySymbol || '₹';
  const fmt       = n => `${sym}${Math.round(n).toLocaleString('en-IN')}`;
  const gstPct    = co.gstPercent || 18;
  const brandColor = co.brandColor || '#5c4a1e';

  const projects         = useCartStore(s => s.projects);
  const activeId         = useCartStore(s => s.activeProjectId);
  const setProjectStatus = useCartStore(s => s.setProjectStatus);
  const restoreRevision  = useCartStore(s => s.restoreRevision);
  const deleteRevision   = useCartStore(s => s.deleteRevision);
  const project   = projects.find(p => p.id === activeId) || projects[0];

  const [xlsxLoad,      setXlsxLoad]      = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);

  const activeRooms = useMemo(() =>
    (project?.rooms||[]).map(r=>({...r,items:r.items.filter(i=>i.enabled)})).filter(r=>r.items.length>0)
  ,[project]);

  const lineItems = useMemo(() => activeRooms.flatMap(r => r.items.map(item => {
    const qty = item.product?.unitType==='per_sqft'
      ? (item.dimensions.length||0)*(item.dimensions.width||0)
      : item.product?.unitType==='per_rft'
        ? (item.dimensions.length||0)
        : (item.quantity||1);
    const addonTotal = calcAddonTotal(item);
    const discAmt    = calcItemDiscount(item);
    const lineTotal  = calcItemBase(item) + addonTotal - discAmt;
    return {
      ...item, roomLabel:r.name,
      qty, unitRate: item.tier?.ratePerUnit||0,
      addonTotal, lineTotal,
      dimensions: item.dimensions,
      selectedAddonIds: item.selectedAddonIds||[],
      notes: item.notes||'',
    };
  })), [activeRooms]);

  const subtotal  = lineItems.reduce((s,li) => s + li.lineTotal, 0);
  const discPct   = subtotal*(project?.discountPercent||0)/100;
  const discFlat  = project?.discountFlat||0;
  const promoDisc = project?.promoDiscount||0;
  const discAmt   = Math.min(subtotal, discPct+discFlat+promoDisc);
  const taxable   = subtotal - discAmt;
  const gstAmt    = taxable * gstPct / 100;
  const grand     = taxable + gstAmt + (project?.installationCharge||0) + (project?.transportCharge||0);

  const totals = {
    subtotal, discountAmount:discAmt, taxableAmount:taxable,
    gstPercent:gstPct, taxAmount:gstAmt,
    installationCharge:project?.installationCharge||0,
    transportCharge:project?.transportCharge||0,
    grandTotal:grand, lineItems,
  };

  const handleXLSX = async () => {
    setXlsxLoad(true);
    try {
      await downloadXLSX({
        lineItems, totals,
        customer: project?.customer||{},
        quotationNumber: project?.quotationNumber||'DRAFT',
        quotationDate: project?.quotationDate||new Date().toISOString(),
        settings:{ ...co, installationCharge:project?.installationCharge||0, transportCharge:project?.transportCharge||0 },
        projectName: project?.name||'',
      });
    } catch(e) { alert('XLSX export failed: '+e.message); }
    finally { setXlsxLoad(false); }
  };

  /* ── WhatsApp share ── */
  const whatsappShare = () => {
    const c = project?.customer||{};
    const lines = [
      `*${co.companyName} — Quotation ${project?.quotationNumber||'DRAFT'}*`,
      `Client: ${c.name||'—'} | ${c.phone||'—'}`,
      `Date: ${new Date(project?.quotationDate||Date.now()).toLocaleDateString('en-IN')}`,
      '',
      ...activeRooms.map(r => {
        const rt = r.items.reduce((s,i)=>s+calcLineTotal(i),0);
        return `▸ ${r.name}: ${sym}${Math.round(rt).toLocaleString('en-IN')}`;
      }),
      '',
      `Grand Total (incl GST): *${fmt(grand)}*`,
      `Valid until: ${new Date((project?.quotationDate?new Date(project.quotationDate):new Date()).getTime()+((co.quotationValidityDays||30)*86400000)).toLocaleDateString('en-IN')}`,
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank');
  };

  /* ── Email share ── */
  const emailShare = () => {
    const c    = project?.customer||{};
    const subj = encodeURIComponent(`Quotation ${project?.quotationNumber||'DRAFT'} from ${co.companyName}`);
    const body = encodeURIComponent(
      `Dear ${c.name||'Sir/Madam'},\n\nPlease find your interior design quotation.\n\nQuotation No: ${project?.quotationNumber||'DRAFT'}\nGrand Total: ${fmt(grand)} (incl. GST)\n\nFor any queries, contact us at ${co.companyPhone}.\n\nRegards,\n${co.companyName}`
    );
    window.location.href = `mailto:${c.email||''}?subject=${subj}&body=${body}`;
  };

  if (!project || activeRooms.length===0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f6f0]">
        <div className="rounded-2xl bg-white p-10 shadow text-center max-w-sm">
          <p className="mb-4 text-stone-500">No items enabled yet. Go to Builder and toggle on some products.</p>
          <button onClick={() => navigate('/builder')} className="btn-primary">← Back to Builder</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f6f0]">
      {/* ── Nav ── */}
      <header className="no-print sticky top-0 z-30 flex h-auto min-h-12 flex-wrap items-center gap-2 border-b border-stone-200 bg-white px-3 sm:px-4 py-2">
        <div className="mr-2 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{background:brandColor}}>
            <span className="text-[10px] font-bold text-white">IQ</span>
          </div>
          <span className="hidden font-display text-sm font-bold text-stone-800 sm:block">{co.companyName}</span>
        </div>
        <nav className="flex items-center gap-0.5">
          {[{label:'Projects',path:'/'},{label:'Builder',path:'/builder'},{label:'Preview',path:'/preview',active:true},{label:'Settings',path:'/settings'}].map(({label,path,active})=>(
            <button key={path} onClick={()=>navigate(path)}
              className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold min-h-[36px]
                ${active?'text-white':'text-stone-500 hover:bg-stone-100'}`}
              style={active?{background:brandColor}:{}}>
              {label}
            </button>
          ))}
        </nav>
        <div className="flex-1"/>

        {/* Status badges */}
        <div className="hidden sm:flex items-center gap-1 bg-stone-100 rounded-lg p-0.5">
          {[{s:'draft',lbl:'Draft'},{s:'sent',lbl:'Sent'},{s:'approved',lbl:'Approved'}].map(({s,lbl})=>(
            <button key={s} onClick={()=>setProjectStatus(project?.id,s)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all min-h-[32px]
                ${{draft:'text-stone-500',sent:'bg-blue-600 text-white',approved:'bg-green-600 text-white'}[project?.status===s?s:'none']||'text-stone-500'}
                ${project?.status===s?'shadow-sm':' hover:bg-stone-200'}`}>
              {lbl}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {/* Revisions */}
          <button onClick={()=>setShowRevisions(r=>!r)}
            className="btn-ghost text-xs py-1.5 px-2.5 border border-stone-200 min-h-[36px]">
            <Clock size={13}/> <span className="hidden sm:inline">Revisions</span>
          </button>
          {/* Share */}
          <button onClick={whatsappShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500 text-white text-xs font-semibold hover:bg-green-600 min-h-[36px]">
            <MessageCircle size={13}/> <span className="hidden sm:inline">WhatsApp</span>
          </button>
          <button onClick={emailShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 min-h-[36px]">
            <Mail size={13}/> <span className="hidden sm:inline">Email</span>
          </button>
          <button onClick={printQuotation} className="btn-primary text-xs py-1.5 px-3 min-h-[36px]" style={{background:brandColor}}>
            <Printer size={13}/> <span className="hidden sm:inline">Print/PDF</span>
          </button>
          <button onClick={handleXLSX} disabled={xlsxLoad} className="btn-secondary text-xs py-1.5 px-3 min-h-[36px]">
            {xlsxLoad?<Loader2 size={13} className="animate-spin"/>:<FileSpreadsheet size={13}/>}
            <span className="hidden sm:inline">{xlsxLoad?'…':'XLSX'}</span>
          </button>
        </div>
      </header>

      {/* Revision history panel */}
      {showRevisions && (
        <div className="no-print bg-white border-b border-stone-200 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Revision History</p>
            {(project?.revisions||[]).length===0 ? (
              <p className="text-sm text-stone-400">No revisions saved yet. Use "Save" in Builder to create snapshots.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(project?.revisions||[]).map(rev=>(
                  <div key={rev.id} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                    <Clock size={12} className="text-stone-400"/>
                    <div>
                      <p className="text-xs font-semibold text-stone-700">{rev.label}</p>
                      <p className="text-[10px] text-stone-400">{new Date(rev.savedAt).toLocaleString('en-IN')}</p>
                    </div>
                    <button onClick={()=>{if(window.confirm(`Restore "${rev.label}"? Current changes will be replaced.`)) restoreRevision(rev.id);}}
                      className="ml-2 p-1.5 rounded-lg text-stone-400 hover:text-[#5c4a1e] hover:bg-[#f5f0e8]" title="Restore">
                      <RotateCcw size={12}/>
                    </button>
                    <button onClick={()=>deleteRevision(rev.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50" title="Delete">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-center px-2 sm:px-4 py-8">
        <A4Sheet project={project} co={co}/>
      </div>
    </div>
  );
}
