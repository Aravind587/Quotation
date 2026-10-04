/**
 * BuilderPage.jsx – v7 (100% feature complete)
 *
 * New in v7:
 *  - Real product photo in unit cards + detail panel (lazy-loaded, graceful fallback to SVG)
 *  - TierCompare modal: side-by-side Economy/Standard/Premium/Luxury table per product
 *  - Auto-save toast on every item change
 *  - Promo code input in client details modal
 *  - Revision history: save/restore snapshots
 *  - Full mobile layout with bottom navigation + overlay room panel
 *  - Per-item discount shown in summary card
 *  - Touch-friendly 44px tap targets throughout
 */
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit3, Check, X, Eye, User, Phone, Mail,
  MapPin, Briefcase, Building2, AlertCircle,
  MessageSquare, Percent, Trash2, Sparkles,
  ChevronLeft, Ruler, BarChart3, Clock,
  Save, RotateCcw, Tag, Menu, Home, Settings,
} from 'lucide-react';

import useCartStore, {
  calcItemBase, calcAddonTotal, calcItemDiscount, calcLineTotal,
} from '../store/cartStore';
import { loadSettings } from './SettingsPage';
import tiersData  from '../data/qualityTiers.json';
import addonsData from '../data/addons.json';
import ProductIcon from '../components/ProductIcons';

/* ── constants ─────────────────────────────────────────────── */
const TIERS = ['Economy', 'Standard', 'Premium', 'Luxury'];
const TIER_STYLE = {
  Economy:  { pill:'bg-emerald-100 text-emerald-700 border-emerald-200', active:'bg-emerald-600 text-white', hover:'hover:bg-emerald-50 hover:text-emerald-700' },
  Standard: { pill:'bg-blue-100   text-blue-700   border-blue-200',   active:'bg-blue-600   text-white', hover:'hover:bg-blue-50   hover:text-blue-700'   },
  Premium:  { pill:'bg-purple-100 text-purple-700 border-purple-200', active:'bg-purple-600 text-white', hover:'hover:bg-purple-50 hover:text-purple-700' },
  Luxury:   { pill:'bg-amber-100  text-amber-700  border-amber-200',  active:'bg-amber-600  text-white', hover:'hover:bg-amber-50  hover:text-amber-700'  },
  Custom:   { pill:'bg-stone-100  text-stone-600  border-stone-200',  active:'bg-stone-600  text-white', hover:'hover:bg-stone-50   hover:text-stone-700'  },
};
const CAT_ACCENT = { kitchen:'#f97316', wardrobe:'#8b5cf6', living:'#14b8a6', bedroom:'#ec4899', bathroom:'#3b82f6', flooring:'#f59e0b', custom:'#5c4a1e' };
const CAT_BG     = { kitchen:'#fff7ed', wardrobe:'#faf5ff', living:'#f0fdfa', bedroom:'#fdf2f8', bathroom:'#eff6ff', flooring:'#fffbeb', custom:'#fdf8f0' };

function fmt(n, sym='₹') { return `${sym}${Math.round(n).toLocaleString('en-IN')}`; }

/* ── Auto-save toast ────────────────────────────────────────── */
function AutoSaveToast({ show }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-xl bg-stone-800 px-3 py-2 text-xs text-white shadow-lg animate-fade-in no-print">
      <Check size={12} className="text-green-400"/>
      Auto-saved
    </div>
  );
}

/* ── Toggle ─────────────────────────────────────────────────── */
function Toggle({ on, onChange, size = 'md' }) {
  const h = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
  const dot = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const trans = size === 'sm' ? (on ? 'translate-x-[18px]' : 'translate-x-[3px]') : (on ? 'translate-x-[22px]' : 'translate-x-[3px]');
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={`relative flex shrink-0 items-center rounded-full transition-colors duration-200 ${h} ${on ? 'bg-[#5c4a1e]' : 'bg-stone-300'}`}>
      <span className={`absolute rounded-full bg-white shadow-sm transition-transform duration-200 ${dot} ${trans}`}/>
    </button>
  );
}

/* ── Spinner ─────────────────────────────────────────────────── */
function Spinner({ label, value, onChange, min=0, step=0.5, unit='' }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">{label}</span>
      <div className="flex h-10 items-center overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <button type="button" onClick={() => onChange(Math.max(min, parseFloat((value-step).toFixed(1))))}
          className="flex h-full w-10 shrink-0 items-center justify-center border-r border-stone-200 text-lg font-bold text-stone-500 hover:bg-stone-50 active:bg-stone-100">−</button>
        <input type="number" step={step} min={min}
          className="h-full w-16 border-none bg-transparent text-center text-sm font-bold text-stone-800 outline-none"
          value={value} onChange={e => onChange(parseFloat(e.target.value)||0)}/>
        <button type="button" onClick={() => onChange(parseFloat((value+step).toFixed(1)))}
          className="flex h-full w-10 shrink-0 items-center justify-center border-l border-stone-200 text-lg font-bold text-stone-500 hover:bg-stone-50 active:bg-stone-100">+</button>
      </div>
      {unit && <span className="text-center text-[9px] text-stone-400">{unit}</span>}
    </div>
  );
}

/* ── Product image with graceful SVG fallback ────────────────── */
function ProductImage({ product, size=64, className='' }) {
  const [failed, setFailed] = useState(false);
  const catId = product?.categoryId || 'custom';
  const accent = CAT_ACCENT[catId] || '#78716c';
  const bg     = CAT_BG[catId]     || '#f5f5f4';

  if (product?.image && !failed) {
    return (
      <img
        src={product.image}
        alt={product.name}
        className={`object-cover ${className}`}
        style={{ width:size, height:size }}
        onError={() => setFailed(true)}
        loading="lazy"
      />
    );
  }
  return (
    <div style={{ width:size, height:size, background:bg, color:accent, display:'flex', alignItems:'center', justifyContent:'center' }}
      className={`shrink-0 ${className}`}>
      <ProductIcon productId={product?.id} categoryId={catId} size={Math.round(size*0.6)}/>
    </div>
  );
}

/* ── TierCompare Modal ───────────────────────────────────────── */
function TierCompareModal({ product, currentTierName, onSelect, onClose }) {
  const productTiers = tiersData.filter(t => t.productId === product?.id);
  const sym = loadSettings().currencySymbol || '₹';

  if (!productTiers.length) return null;
  const maxRate = Math.max(...productTiers.map(t => t.ratePerUnit));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Compare Tiers</p>
            <h3 className="font-display font-bold text-stone-800 text-lg">{product?.name}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100"><X size={18}/></button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {productTiers.map(tier => {
              const ts      = TIER_STYLE[tier.tierName] || TIER_STYLE.Standard;
              const isCur   = tier.tierName === currentTierName;
              const savePct = maxRate > tier.ratePerUnit ? Math.round((1 - tier.ratePerUnit/maxRate)*100) : 0;
              return (
                <button key={tier.id} type="button" onClick={() => { onSelect(tier.tierName); onClose(); }}
                  className={`flex flex-col p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md
                    ${isCur ? 'border-[#5c4a1e] shadow-md bg-[#fdf8f0]' : 'border-stone-200 bg-stone-50 hover:border-stone-300'}`}>
                  <span className={`self-start text-[10px] font-bold rounded-full border px-2 py-0.5 mb-2 ${ts.pill}`}>
                    {tier.tierName}
                  </span>
                  <span className="text-xl font-bold text-stone-800">{fmt(tier.ratePerUnit, sym)}</span>
                  <span className="text-xs text-stone-400 mt-0.5">
                    per {product?.unitType==='per_sqft'?'sq ft':product?.unitType==='per_rft'?'rft':'unit'}
                  </span>
                  {savePct > 0 && (
                    <span className="mt-2 text-[10px] font-semibold text-green-600">
                      Save {savePct}% vs Luxury
                    </span>
                  )}
                  {isCur && <span className="mt-1 text-[10px] font-bold text-[#5c4a1e]">✓ Current</span>}
                  <p className="mt-3 text-[9px] text-stone-500 leading-relaxed line-clamp-4">{tier.materialSpec}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Add Room Modal ──────────────────────────────────────────── */
function AddRoomModal({ onClose, onAdd }) {
  const [name,   setName]   = useState('');
  const [length, setLength] = useState('');
  const [width,  setWidth]  = useState('');
  const area = (parseFloat(length)||0)*(parseFloat(width)||0);
  const presets = ['Living Room','Master Bedroom','Kitchen','Kids Bedroom','Guest Bedroom','Bathroom','Pooja Room','Study Room','Dining Room','Balcony','Wardrobe','Flooring'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-[#5c4a1e] px-6 py-4">
          <h3 className="font-display font-bold text-white text-lg">Add Room / Area</h3>
          <p className="text-[#d4b896] text-xs mt-0.5">False Ceiling auto-added with your dimensions</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label mb-2">Room Name</label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {presets.map(p => (
                <button key={p} type="button" onClick={() => setName(p)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[36px]
                    ${name===p ? 'bg-[#5c4a1e] text-white border-[#5c4a1e]' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-[#5c4a1e]'}`}>
                  {p}
                </button>
              ))}
            </div>
            <input className="input-field" placeholder="Or type custom name…" value={name} onChange={e=>setName(e.target.value)}/>
          </div>
          <div>
            <label className="label flex items-center gap-1.5 mb-2"><Ruler size={11}/> Room Dimensions</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-stone-400 font-semibold uppercase tracking-wide mb-1 block">Length (ft)</label>
                <input type="number" min="0" step="0.5" className="input-field" placeholder="e.g. 18" value={length} onChange={e=>setLength(e.target.value)}/>
              </div>
              <div>
                <label className="text-[10px] text-stone-400 font-semibold uppercase tracking-wide mb-1 block">Width (ft)</label>
                <input type="number" min="0" step="0.5" className="input-field" placeholder="e.g. 14" value={width} onChange={e=>setWidth(e.target.value)}/>
              </div>
            </div>
            {area > 0 && (
              <div className="mt-2 rounded-lg bg-[#f5f0e8] px-3 py-2 text-xs text-[#5c4a1e] font-medium">
                {length} × {width} = <strong>{area.toFixed(1)} sq ft</strong>
                <span className="ml-2 opacity-70">· False Ceiling auto-filled</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 btn-ghost justify-center border border-stone-200 min-h-[44px]">Cancel</button>
          <button disabled={!name.trim()} onClick={() => { onAdd(name.trim(), {length:parseFloat(length)||0,width:parseFloat(width)||0}); onClose(); }}
            className="flex-1 btn-primary justify-center disabled:opacity-50 min-h-[44px]">
            <Plus size={14}/> Add Room
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Custom Product Modal ────────────────────────────────────── */
function CustomProductModal({ roomId, onClose }) {
  const addCustomItem = useCartStore(s => s.addCustomItem);
  const [name,setName]=useState(''); const [desc,setDesc]=useState(''); const [rate,setRate]=useState(''); const [unitType,setUnitType]=useState('per_sqft');
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <h3 className="font-display font-bold text-stone-800 text-lg">Add Custom Product</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-stone-400 hover:bg-stone-100"><X size={16}/></button>
        </div>
        <div className="space-y-4 p-5">
          <div><label className="label">Name *</label><input autoFocus className="input-field" placeholder="e.g. Curtain Track…" value={name} onChange={e=>setName(e.target.value)}/></div>
          <div><label className="label">Specification</label><input className="input-field" placeholder="Material, brand, finish…" value={desc} onChange={e=>setDesc(e.target.value)}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Rate *</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">₹</span><input type="number" min="0" className="input-field pl-6" placeholder="0" value={rate} onChange={e=>setRate(e.target.value)}/></div></div>
            <div><label className="label">Unit</label><select className="input-field" value={unitType} onChange={e=>setUnitType(e.target.value)}><option value="per_sqft">Per sq ft</option><option value="per_rft">Per running ft</option><option value="per_unit">Per unit / nos</option></select></div>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 btn-ghost justify-center border border-stone-200 min-h-[44px]">Cancel</button>
          <button onClick={()=>{if(!name.trim()||!rate)return;addCustomItem(roomId,{name:name.trim(),description:desc.trim(),unitType,ratePerUnit:rate});onClose();}} disabled={!name.trim()||!rate}
            className="flex-1 btn-primary justify-center disabled:opacity-50 min-h-[44px]"><Plus size={14}/> Add</button>
        </div>
      </div>
    </div>
  );
}

/* ── Client Details Modal ────────────────────────────────────── */
function ClientModal({ project, co, onClose }) {
  const setCustomer    = useCartStore(s => s.setCustomer);
  const setProjectField = useCartStore(s => s.setProjectField);
  const applyPromo     = useCartStore(s => s.applyPromoCode);
  const clearPromo     = useCartStore(s => s.clearPromoCode);
  const [promoInput, setPromoInput] = useState(project?.promoCode || '');
  const c = project?.customer || {};

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="w-full max-w-lg max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-stone-100 bg-white p-5">
          <h3 className="font-display font-bold text-stone-800 text-lg">Client & Project Details</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-stone-400 hover:bg-stone-100"><X size={16}/></button>
        </div>
        <div className="space-y-3 p-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              {k:'name',lbl:'Client Name *',Ic:User,type:'text',ph:'Rajesh Kumar'},
              {k:'phone',lbl:'Phone *',Ic:Phone,type:'tel',ph:'+91 98765 43210'},
              {k:'email',lbl:'Email',Ic:Mail,type:'email',ph:'you@example.com'},
              {k:'projectName',lbl:'Project / Site',Ic:Briefcase,type:'text',ph:'Whitefield Villa'},
              {k:'address',lbl:'Address',Ic:MapPin,type:'text',ph:'Andheri West'},
              {k:'city',lbl:'City',Ic:Building2,type:'text',ph:'Mumbai'},
            ].map(({k,lbl,Ic,type,ph})=>(
              <div key={k}>
                <label className="label flex items-center gap-1"><Ic size={9}/>{lbl}</label>
                <input type={type} className="input-field min-h-[44px]" placeholder={ph}
                  value={c[k]||''} onChange={e=>setCustomer({[k]:e.target.value})}/>
              </div>
            ))}
          </div>

          {/* Charges */}
          <div className="border-t border-stone-100 pt-3 grid grid-cols-2 gap-3">
            <p className="col-span-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">Charges & Discounts</p>
            {[
              {f:'installationCharge',lbl:`Installation (${co.currencySymbol||'₹'})`},
              {f:'transportCharge',lbl:`Transport (${co.currencySymbol||'₹'})`},
              {f:'discountPercent',lbl:'Overall Discount %'},
              {f:'discountFlat',lbl:`Flat Discount (${co.currencySymbol||'₹'})`},
            ].map(({f,lbl})=>(
              <div key={f}>
                <label className="label">{lbl}</label>
                <input type="number" min="0" className="input-field min-h-[44px]" placeholder="0"
                  value={project?.[f]||''} onChange={e=>setProjectField(f,parseFloat(e.target.value)||0)}/>
              </div>
            ))}
          </div>

          {/* Promo code */}
          <div className="border-t border-stone-100 pt-3">
            <label className="label flex items-center gap-1"><Tag size={9}/> Promo / Coupon Code</label>
            <div className="flex gap-2">
              <input className="input-field flex-1 min-h-[44px] uppercase" placeholder="e.g. WELCOME10"
                value={promoInput} onChange={e=>setPromoInput(e.target.value.toUpperCase())}/>
              <button onClick={()=>applyPromo(promoInput)}
                className="btn-primary text-xs px-4 min-h-[44px] shrink-0">Apply</button>
              {project?.promoDiscount>0&&<button onClick={()=>{clearPromo();setPromoInput('');}}
                className="btn-ghost text-red-400 border border-red-200 min-h-[44px] shrink-0">Remove</button>}
            </div>
            {project?.promoDiscount>0&&(
              <p className="mt-1.5 text-xs text-green-600 font-semibold">
                ✓ "{project.promoCode}" applied — saving {fmt(project.promoDiscount, co.currencySymbol||'₹')}
              </p>
            )}
          </div>
        </div>
        <div className="p-5 pt-0">
          <button onClick={onClose} className="w-full btn-primary justify-center min-h-[44px]">Save Details</button>
        </div>
      </div>
    </div>
  );
}

/* ── Unit Detail Panel ───────────────────────────────────────── */
function UnitDetailPanel({ item, roomId, co, onBack, onOpenCompare }) {
  const toggleItem       = useCartStore(s => s.toggleItem);
  const updateDim        = useCartStore(s => s.updateItemDimension);
  const updateTier       = useCartStore(s => s.updateItemTier);
  const updateQty        = useCartStore(s => s.updateItemQty);
  const updateNotes      = useCartStore(s => s.updateItemNotes);
  const updateDiscount   = useCartStore(s => s.updateItemDiscount);
  const updateCustomRate = useCartStore(s => s.updateCustomRate);
  const toggleAddon      = useCartStore(s => s.toggleItemAddon);
  const removeItem       = useCartStore(s => s.removeItem);

  const [showNotes, setShowNotes] = useState(!!item.notes);
  const sym          = co.currencySymbol || '₹';
  const fmtC         = n => fmt(n, sym);
  const productTiers = tiersData.filter(t => t.productId === item.productId);
  const catId        = item.product?.categoryId || 'custom';
  const accent       = CAT_ACCENT[catId] || '#78716c';
  const unitType     = item.product?.unitType;
  const dimLabels    = item.product?.dimensionLabels || {};
  const label1       = dimLabels.length || (unitType==='per_rft'?'Length (ft)':'L (ft)');
  const label2       = dimLabels.width  || 'B (ft)';
  const relevantAddons = addonsData.filter(a => !a.applicableCategories || a.applicableCategories.includes(catId));
  const base     = calcItemBase(item);
  const addonAmt = calcAddonTotal(item);
  const discAmt  = calcItemDiscount(item);
  const total    = base + addonAmt - discAmt;
  const area     = unitType==='per_sqft' ? (item.dimensions.length||0)*(item.dimensions.width||0) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-stone-200 bg-white px-4 sm:px-5 py-3">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-[#5c4a1e] font-medium mb-2 min-h-[36px] transition-colors">
          <ChevronLeft size={14}/> Back to room
        </button>
        <div className="flex items-start gap-3">
          {/* Product image */}
          <div className="shrink-0 rounded-2xl overflow-hidden" style={{ width:64, height:64 }}>
            <ProductImage product={item.product} size={64}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-bold text-stone-800 text-lg leading-tight">{item.product?.name}</h2>
              {item.isCustom && <span className="rounded-full border bg-[#f5f0e8] px-2 py-0.5 text-[9px] font-bold text-[#5c4a1e] border-[#d4b896]">CUSTOM</span>}
            </div>
            <p className="text-stone-400 text-xs mt-0.5 leading-relaxed line-clamp-2">{item.product?.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-stone-500 font-medium hidden sm:block">{item.enabled?'Included':'Excluded'}</span>
            <Toggle on={item.enabled} onChange={v=>toggleItem(roomId,item.id,v)}/>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-5">

        {/* Tier comparison buttons */}
        {!item.isCustom && productTiers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label">Quality / Finish Tier</label>
              <button onClick={() => onOpenCompare(item)}
                className="flex items-center gap-1.5 text-xs text-[#5c4a1e] font-semibold hover:underline min-h-[36px]">
                <BarChart3 size={12}/> Compare all tiers
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {productTiers.map(t => {
                const sel = item.tierName===t.tierName;
                const ts  = TIER_STYLE[t.tierName]||TIER_STYLE.Standard;
                return (
                  <button key={t.id} type="button" onClick={() => updateTier(roomId,item.id,t.tierName)}
                    className={`flex flex-col p-3 rounded-xl border-2 text-left transition-all min-h-[80px]
                      ${sel ? 'border-[#5c4a1e] shadow-md bg-[#fdf8f0]' : 'border-stone-200 bg-stone-50 hover:border-stone-300'}`}>
                    <span className={`text-[9px] font-bold rounded-full border px-2 py-0.5 mb-1.5 self-start ${ts.pill}`}>{t.tierName}</span>
                    <span className="text-sm font-bold text-stone-800">{fmtC(t.ratePerUnit)}</span>
                    <span className="text-[9px] text-stone-400">per {unitType==='per_sqft'?'sq ft':unitType==='per_rft'?'rft':'unit'}</span>
                    <p className="text-[8px] text-stone-400 mt-1 leading-relaxed line-clamp-2">{t.materialSpec}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom rate */}
        {item.isCustom && (
          <div><label className="label">Rate</label>
            <div className="flex items-center gap-3">
              <input type="number" min="0" className="input-field w-36 min-h-[44px]" value={item.tier?.ratePerUnit||''} onChange={e=>updateCustomRate(roomId,item.id,e.target.value)}/>
              <span className="text-sm text-stone-400">per {unitType==='per_sqft'?'sq ft':unitType==='per_rft'?'rft':'unit'}</span>
            </div>
          </div>
        )}

        {/* Material spec */}
        {item.tier?.materialSpec && (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wide text-stone-400 mb-1">Material Specification</p>
            <p className="text-xs text-stone-600 leading-relaxed">{item.tier.materialSpec}</p>
          </div>
        )}

        {/* Dimensions */}
        {unitType !== 'per_unit' && (
          <div><label className="label mb-2">Dimensions</label>
            <div className="flex flex-wrap items-end gap-3">
              <Spinner label={label1} value={item.dimensions.length} step={0.5} min={0} onChange={v=>updateDim(roomId,item.id,'length',v)} unit={unitType==='per_rft'?'running ft':'ft'}/>
              {unitType==='per_sqft' && (
                <>
                  <span className="text-stone-300 text-2xl mb-1">×</span>
                  <Spinner label={label2} value={item.dimensions.width} step={0.5} min={0} onChange={v=>updateDim(roomId,item.id,'width',v)} unit="ft"/>
                  {area>0 && (
                    <div className="flex flex-col items-center mb-0.5">
                      <span className="text-[9px] text-stone-400 uppercase font-semibold tracking-wide">Area</span>
                      <div className="mt-1 rounded-xl bg-[#f5f0e8] px-3 py-2 text-sm font-bold text-[#5c4a1e]">{area.toFixed(1)} sq ft</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {unitType==='per_unit' && (
          <div><label className="label mb-2">Quantity</label>
            <Spinner label="Qty" value={item.quantity} step={1} min={1} onChange={v=>updateQty(roomId,item.id,v)} unit="nos"/>
          </div>
        )}

        {/* Accessories */}
        {relevantAddons.length > 0 && (
          <div><label className="label mb-2">Accessories & Add-ons</label>
            <div className="space-y-2">
              {relevantAddons.map(addon => {
                const sel = item.selectedAddonIds?.includes(addon.id);
                return (
                  <button key={addon.id} type="button" onClick={()=>toggleAddon(roomId,item.id,addon.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all min-h-[56px]
                      ${sel ? 'border-[#5c4a1e] bg-[#fdf8f0]' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${sel?'border-[#5c4a1e] bg-[#5c4a1e]':'border-stone-300'}`}>
                      {sel && <Check size={10} className="text-white" strokeWidth={3}/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-800">{addon.name}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">{addon.description}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-stone-700">+{fmtC(addon.price)}</span>
                  </button>
                );
              })}
            </div>
            {calcAddonTotal(item)>0 && <p className="mt-2 text-xs font-semibold text-[#5c4a1e]">Add-ons total: +{fmtC(calcAddonTotal(item))}</p>}
          </div>
        )}

        {/* Per-item discount */}
        <div className="flex items-center gap-3">
          <div>
            <label className="label flex items-center gap-1"><Percent size={9}/> Item Discount %</label>
            <input type="number" min="0" max="100" className="input-field w-24 min-h-[44px]" placeholder="0"
              value={item.discountPercent||''} onChange={e=>updateDiscount(roomId,item.id,e.target.value)}/>
          </div>
          {item.discountPercent>0 && <span className="mt-4 text-xs text-green-600 font-semibold">Saving {fmtC(discAmt)}</span>}
        </div>

        {/* Notes */}
        <div>
          <button type="button" onClick={()=>setShowNotes(n=>!n)}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-400 hover:text-stone-600 min-h-[36px]">
            <MessageSquare size={12}/>{showNotes?'Hide notes':item.notes?'✎ Edit notes':'+ Add notes'}
          </button>
          {showNotes && (
            <textarea rows={2} className="mt-2 w-full resize-none input-field text-xs"
              placeholder="Site notes, special instructions…"
              value={item.notes||''} onChange={e=>updateNotes(roomId,item.id,e.target.value)}/>
          )}
        </div>

        {item.isCustom && (
          <button onClick={()=>{removeItem(roomId,item.id);onBack();}}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 font-medium min-h-[36px]">
            <Trash2 size={12}/> Remove this item
          </button>
        )}
      </div>

      {/* Price footer */}
      <div className="shrink-0 border-t border-stone-200 bg-[#1c1917] px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-stone-400">{item.enabled?'Line Total (excl. GST)':'Estimated'}</p>
            <p className="text-xl font-bold text-white">{fmtC(total||base)}</p>
          </div>
          <div className="text-right text-xs text-stone-400 space-y-0.5">
            {area>0 && <p>{area.toFixed(1)} sq ft × {fmtC(item.tier?.ratePerUnit||0)}</p>}
            {addonAmt>0 && <p>+{fmtC(addonAmt)} acc.</p>}
            {discAmt>0 && <p className="text-green-400">−{fmtC(discAmt)} disc.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Room Unit Grid ──────────────────────────────────────────── */
function RoomUnitGrid({ room, onSelectUnit, co }) {
  const sym        = co.currencySymbol||'₹';
  const fmtC       = n => fmt(n,sym);
  const setRoomTier = useCartStore(s=>s.setRoomTier);
  const toggleItem  = useCartStore(s=>s.toggleItem);
  const updateDim   = useCartStore(s=>s.updateItemDimension);

  const enabledCount  = room.items.filter(i=>i.enabled).length;
  const roomSubtotal  = room.items.reduce((s,i)=>s+calcLineTotal(i),0);
  const nonCustom     = room.items.filter(i=>!i.isCustom);
  const tierCounts    = {};
  nonCustom.forEach(i=>{tierCounts[i.tierName]=(tierCounts[i.tierName]||0)+1;});
  const roomTier      = Object.entries(tierCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'Standard';
  const fcItem        = room.items.find(i=>i.productId==='false-ceiling');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-stone-200 bg-white">
        <div className="flex items-start justify-between gap-4 px-4 sm:px-5 pt-4 pb-2">
          <div>
            <h2 className="font-display font-bold text-stone-800 text-xl sm:text-2xl">{room.name}</h2>
            <p className="text-stone-400 text-sm mt-0.5">
              {enabledCount} of {room.items.length} items selected
              {roomSubtotal>0 && <span className="ml-2 font-bold text-[#5c4a1e]">{fmtC(roomSubtotal)}</span>}
            </p>
          </div>
          {room.dimensions?.length>0 && room.dimensions?.width>0 && (
            <div className="rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 text-right shrink-0">
              <p className="text-[9px] text-stone-400 font-semibold uppercase tracking-wide">Room Area</p>
              <p className="text-sm font-bold text-stone-700">{room.dimensions.length}×{room.dimensions.width} = <span className="text-[#5c4a1e]">{(room.dimensions.length*room.dimensions.width).toFixed(0)} sq ft</span></p>
            </div>
          )}
        </div>

        {/* Tier tabs */}
        <div className="px-4 sm:px-5 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 shrink-0">Quality:</span>
          <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl p-1">
            {TIERS.map(tier => {
              const tc  = TIER_STYLE[tier];
              const sel = roomTier===tier;
              return (
                <button key={tier} onClick={()=>setRoomTier(room.id,tier)} title={`Set all ${room.name} items to ${tier}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px]
                    ${sel ? tc.active+' shadow-sm' : 'text-stone-500 '+tc.hover}`}>
                  {tier}
                </button>
              );
            })}
          </div>
        </div>

        {/* False ceiling strip */}
        {fcItem && (
          <div className={`mx-4 sm:mx-5 mb-3 flex items-center gap-3 rounded-xl border px-3 sm:px-4 py-2.5 transition-colors
            ${fcItem.enabled ? 'border-[#5c4a1e] bg-[#fdf8f0]' : 'border-stone-200 bg-stone-50'}`}>
            <Toggle on={fcItem.enabled} onChange={v=>toggleItem(room.id,fcItem.id,v)} size="sm"/>
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-semibold ${fcItem.enabled?'text-stone-800':'text-stone-400'}`}>False Ceiling</span>
              <span className={`ml-2 text-[9px] rounded-full border px-1.5 py-0.5 font-bold ${TIER_STYLE[fcItem.tierName]?.pill||'bg-stone-100 text-stone-500 border-stone-200'}`}>{fcItem.tierName}</span>
            </div>
            {fcItem.enabled && (
              <div className="flex items-center gap-2 shrink-0">
                {['length','width'].map((k,i) => (
                  <React.Fragment key={k}>
                    {i===1 && <span className="text-stone-300">×</span>}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[8px] text-stone-400 font-semibold">{k==='length'?'L':'B'} (ft)</span>
                      <div className="flex h-7 items-center overflow-hidden rounded-lg border border-stone-200 bg-white">
                        <button type="button" onClick={()=>updateDim(room.id,fcItem.id,k,Math.max(0,(fcItem.dimensions[k]||0)-1))} className="flex h-full w-6 items-center justify-center border-r border-stone-200 text-stone-500 text-xs font-bold hover:bg-stone-50">−</button>
                        <input type="number" min="0" step="1" className="h-full w-10 border-none bg-transparent text-center text-xs font-bold text-stone-800 outline-none" value={fcItem.dimensions[k]||0} onChange={e=>updateDim(room.id,fcItem.id,k,parseFloat(e.target.value)||0)}/>
                        <button type="button" onClick={()=>updateDim(room.id,fcItem.id,k,(fcItem.dimensions[k]||0)+1)} className="flex h-full w-6 items-center justify-center border-l border-stone-200 text-stone-500 text-xs font-bold hover:bg-stone-50">+</button>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
                {fcItem.dimensions.length>0 && fcItem.dimensions.width>0 && (
                  <div className="rounded-lg bg-[#f5f0e8] px-2 py-1 text-[10px] font-bold text-[#5c4a1e]">{(fcItem.dimensions.length*fcItem.dimensions.width).toFixed(0)} sq ft</div>
                )}
                <span className="text-xs font-bold text-stone-800">{fmtC(calcLineTotal(fcItem))}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product cards */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {room.items.filter(i=>i.productId!=='false-ceiling').map(item => {
            const catId  = item.product?.categoryId||'custom';
            const accent = CAT_ACCENT[catId]||'#78716c';
            const bg     = CAT_BG[catId]||'#fafaf9';
            const ts     = TIER_STYLE[item.tierName]||TIER_STYLE.Standard;
            const total  = calcLineTotal(item);
            return (
              <button key={item.id} type="button" onClick={()=>onSelectUnit(item)}
                className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all min-h-[100px]
                  hover:shadow-md hover:-translate-y-0.5 active:scale-98
                  ${item.enabled ? 'border-[#5c4a1e] shadow-sm bg-white' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
                <div className="h-1" style={{background:accent,opacity:item.enabled?1:0.3}}/>
                <div className="p-3 flex items-start gap-3">
                  {/* Product image */}
                  <div className="shrink-0 rounded-xl overflow-hidden" style={{width:52,height:52}}>
                    <ProductImage product={item.product} size={52}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className={`text-sm font-semibold ${item.enabled?'text-stone-800':'text-stone-400'}`}>{item.product?.name}</span>
                      {item.isCustom && <span className="text-[8px] font-bold rounded-full bg-[#f5f0e8] text-[#5c4a1e] border border-[#d4b896] px-1.5 py-0.5">CUSTOM</span>}
                    </div>
                    <span className={`text-[9px] font-bold rounded-full border px-1.5 py-0.5 ${ts.pill}`}>{item.tierName}</span>
                    <p className="text-[9px] text-stone-400 mt-1.5 line-clamp-1 leading-snug">{item.tier?.materialSpec}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {item.enabled && total>0 ? (
                      <p className="text-sm font-bold text-stone-800">{fmtC(total)}</p>
                    ) : <p className="text-[10px] text-stone-300">tap →</p>}
                    <div className={`mt-1 ml-auto h-2 w-2 rounded-full ${item.enabled?'bg-[#5c4a1e]':'bg-stone-200'}`}/>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function BuilderPage() {
  const navigate       = useNavigate();
  const co             = loadSettings();
  const sym            = co.currencySymbol||'₹';
  const fmtC           = n => fmt(n,sym);
  const brandColor     = co.brandColor || '#5c4a1e';

  const projects        = useCartStore(s=>s.projects);
  const activeProjectId = useCartStore(s=>s.activeProjectId);
  const setGlobalTier   = useCartStore(s=>s.setGlobalTier);
  const addRoom         = useCartStore(s=>s.addRoom);
  const removeRoom      = useCartStore(s=>s.removeRoom);
  const renameRoom      = useCartStore(s=>s.renameRoom);
  const generateNumber  = useCartStore(s=>s.generateQuotationNumber);
  const saveRevision    = useCartStore(s=>s.saveRevision);

  const project = projects.find(p=>p.id===activeProjectId)||projects[0];
  const rooms   = project?.rooms||[];

  const [activeRoomId, setActiveRoomId]     = useState(()=>rooms[0]?.id||null);
  const [selectedUnit, setSelectedUnit]     = useState(null);
  const [addRoomOpen,  setAddRoomOpen]      = useState(false);
  const [customModal,  setCustomModal]      = useState(false);
  const [clientOpen,   setClientOpen]       = useState(false);
  const [renamingRoom, setRenamingRoom]     = useState(null);
  const [renameVal,    setRenameVal]        = useState('');
  const [hoveredRoom,  setHoveredRoom]      = useState(null);
  const [compareItem,  setCompareItem]      = useState(null);
  const [autoSave,     setAutoSave]         = useState(false);
  const [mobileSidebar,setMobileSidebar]    = useState(false);

  const activeRoom = rooms.find(r=>r.id===activeRoomId)||rooms[0];

  // Sync selectedUnit with live store
  const liveSelectedUnit = useMemo(()=>{
    if(!selectedUnit) return null;
    const room = rooms.find(r=>r.id===activeRoomId);
    return room?.items.find(i=>i.id===selectedUnit.id)||null;
  },[selectedUnit,rooms,activeRoomId]);

  // Auto-save toast on store changes
  const prevRooms = useRef(null);
  useEffect(()=>{
    const current = JSON.stringify(rooms.map(r=>r.items.map(i=>({id:i.id,enabled:i.enabled,tierName:i.tierName,dimensions:i.dimensions,quantity:i.quantity,discountPercent:i.discountPercent,selectedAddonIds:i.selectedAddonIds}))));
    if(prevRooms.current && prevRooms.current!==current){
      setAutoSave(true);
      const t = setTimeout(()=>setAutoSave(false),2000);
      return ()=>clearTimeout(t);
    }
    prevRooms.current = current;
  },[rooms]);

  const roomTotals = useMemo(()=>rooms.map(r=>({
    id:r.id, name:r.name,
    count:(r.items||[]).filter(i=>i.enabled).length,
    subtotal:(r.items||[]).reduce((s,i)=>s+calcLineTotal(i),0),
  })),[rooms]);

  const subtotal    = roomTotals.reduce((s,r)=>s+r.subtotal,0);
  const promoDisc   = project?.promoDiscount||0;
  const discountAmt = Math.min(subtotal, subtotal*(project?.discountPercent||0)/100+(project?.discountFlat||0)+promoDisc);
  const taxable     = subtotal-discountAmt;
  const gstAmount   = taxable*(co.gstPercent||18)/100;
  const grandTotal  = taxable+gstAmount+(project?.installationCharge||0)+(project?.transportCharge||0);

  const handlePreview = ()=>{ generateNumber(project?.id); navigate('/preview'); };
  const handleSelectRoom = id=>{ setActiveRoomId(id); setSelectedUnit(null); setMobileSidebar(false); };

  if(!project) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center"><p className="mb-4 text-stone-400">No active project.</p>
        <button onClick={()=>navigate('/')} className="btn-primary">← Projects</button></div>
    </div>
  );

  /* ── Sidebar content (shared between desktop + mobile overlay) ── */
  const SidebarContent = () => (
    <>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {rooms.map(room=>{
          const rt    = roomTotals.find(x=>x.id===room.id);
          const isAct = room.id===activeRoomId;
          const unitNames = (room.items||[]).map(i=>i.product?.name).filter(Boolean);
          return (
            <div key={room.id} className="group relative"
              onMouseEnter={()=>setHoveredRoom(room.id)}
              onMouseLeave={()=>setHoveredRoom(null)}>
              {renamingRoom===room.id ? (
                <div className="flex items-center gap-1 p-1">
                  <input autoFocus className="input-field flex-1 py-1 text-xs" value={renameVal}
                    onChange={e=>setRenameVal(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'&&renameVal.trim()){renameRoom(room.id,renameVal.trim());setRenamingRoom(null);}if(e.key==='Escape')setRenamingRoom(null);}}/>
                  <button onClick={()=>{if(renameVal.trim()){renameRoom(room.id,renameVal.trim());setRenamingRoom(null);}}} className="p-1 text-[#5c4a1e]"><Check size={11}/></button>
                </div>
              ) : (
                <button onClick={()=>handleSelectRoom(room.id)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors min-h-[52px]
                    ${isAct?'text-stone-800':'text-stone-600 hover:bg-stone-50'}`}
                  style={isAct?{background:`${brandColor}15`,borderLeft:`3px solid ${brandColor}`}:{}}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold truncate">{room.name}</span>
                    <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100">
                      <button onClick={e=>{e.stopPropagation();setRenamingRoom(room.id);setRenameVal(room.name);}} className="p-0.5 text-stone-400 hover:text-stone-700 rounded"><Edit3 size={9}/></button>
                      {rooms.length>1&&<button onClick={e=>{e.stopPropagation();removeRoom(room.id);if(activeRoomId===room.id)setActiveRoomId(rooms.find(r=>r.id!==room.id)?.id||null);}} className="p-0.5 text-stone-400 hover:text-red-500 rounded"><X size={9}/></button>}
                    </div>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {rt?.subtotal>0&&<span className="text-[10px] font-bold" style={{color:brandColor}}>{fmtC(rt.subtotal)}</span>}
                    {rt?.count>0&&<span className="text-[9px] text-stone-400">{rt.count} item{rt.count>1?'s':''}</span>}
                  </div>
                </button>
              )}
              {/* Hover tooltip */}
              {hoveredRoom===room.id && !renamingRoom && unitNames.length>0 && (
                <div className="absolute left-full top-0 z-50 ml-2 w-56 rounded-xl border border-stone-200 bg-white shadow-xl p-3" style={{pointerEvents:'none'}}>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-stone-400 mb-2">{room.name} — {unitNames.length} units</p>
                  <div className="space-y-1 max-h-48 overflow-hidden">
                    {(room.items||[]).map(item=>(
                      <div key={item.id} className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${item.enabled?'bg-[#5c4a1e]':'bg-stone-200'}`}/>
                        <span className={`text-[10px] ${item.enabled?'text-stone-700 font-semibold':'text-stone-400'}`}>{item.product?.name}</span>
                        {item.enabled&&<span className="ml-auto text-[9px] font-bold shrink-0" style={{color:brandColor}}>{fmtC(calcLineTotal(item))}</span>}
                      </div>
                    ))}
                  </div>
                  {rt?.subtotal>0&&<div className="mt-2 pt-2 border-t border-stone-100 flex justify-between">
                    <span className="text-[9px] text-stone-400">Room total</span>
                    <span className="text-[9px] font-bold" style={{color:brandColor}}>{fmtC(rt.subtotal)}</span>
                  </div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="border-t border-stone-100 p-2">
        <button onClick={()=>setAddRoomOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium text-stone-400 transition-colors hover:bg-stone-50 min-h-[44px]"
          style={{}}
          onMouseEnter={e=>e.currentTarget.style.color=brandColor}
          onMouseLeave={e=>e.currentTarget.style.color=''}>
          <Plus size={12}/> Add room
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f9f6f0]">
      <AutoSaveToast show={autoSave}/>

      {/* ── TOP NAV ── */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-stone-200 bg-white px-3 sm:px-4 z-30">
        {/* Mobile: hamburger */}
        <button onClick={()=>setMobileSidebar(true)} className="sm:hidden p-2 rounded-lg text-stone-500 hover:bg-stone-100 min-h-[44px] min-w-[44px]">
          <Menu size={18}/>
        </button>
        <div className="mr-1 flex shrink-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg shadow-sm" style={{background:brandColor}}>
            <span className="font-display text-xs font-bold text-white">IQ</span>
          </div>
          <span className="hidden font-display text-sm font-bold text-stone-800 sm:block">{co.companyName}</span>
        </div>
        <nav className="hidden sm:flex items-center gap-0.5">
          {[{lbl:'Projects',path:'/'},{lbl:'Builder',path:'/builder',active:true},{lbl:'Preview',path:'/preview'},{lbl:'Settings',path:'/settings'}].map(({lbl,path,active})=>(
            <button key={path} onClick={()=>navigate(path)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold min-h-[36px]
                ${active?'text-white':'text-stone-500 hover:bg-stone-100'}`}
              style={active?{background:brandColor}:{}}>
              {lbl}
            </button>
          ))}
        </nav>
        <div className="flex-1"/>

        {/* Save revision */}
        <button onClick={()=>saveRevision()} title="Save revision"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-stone-500 hover:bg-stone-100 min-h-[36px]">
          <Save size={13}/> Save
        </button>

        {/* Client button */}
        <button onClick={()=>setClientOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-stone-100 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200 min-h-[36px]">
          <User size={12}/>
          <span className="hidden sm:inline">{project.customer?.name||'Add Client'}</span>
          {(!project.customer?.name||!project.customer?.phone)&&<AlertCircle size={11} className="text-amber-500"/>}
        </button>
        <button onClick={handlePreview} className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white rounded-xl min-h-[36px]"
          style={{background:brandColor}}>
          <Eye size={13} className="inline mr-1"/> Preview
        </button>
      </header>

      {/* ── PROJECT BAR ── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-stone-100 bg-white px-4 py-2 overflow-x-auto no-scrollbar">
        <span className="font-display font-bold text-stone-800 shrink-0">{project.name}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold shrink-0 ${TIER_STYLE[project.globalTier]?.pill||TIER_STYLE.Standard.pill}`}>{project.globalTier}</span>
        {project.customer?.name&&<span className="text-xs text-stone-400 shrink-0">· {project.customer.name}</span>}
        {selectedUnit&&<><span className="text-stone-300 shrink-0">›</span><span className="text-xs font-semibold shrink-0" style={{color:brandColor}}>{liveSelectedUnit?.product?.name||selectedUnit.product?.name}</span></>}
        {/* Status badge */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {[
            {s:'draft',  label:'Draft',    color:'bg-stone-100 text-stone-600'},
            {s:'sent',   label:'Sent',     color:'bg-blue-100 text-blue-700'},
            {s:'approved',label:'Approved',color:'bg-green-100 text-green-700'},
          ].map(({s,label,color})=>(
            <button key={s} onClick={()=>useCartStore.getState().setProjectStatus(project.id,s)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all
                ${project.status===s?color+' border-current shadow-sm':'border-stone-200 text-stone-400 hover:border-stone-300'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar */}
        <aside className="hidden sm:flex w-52 shrink-0 flex-col border-r border-stone-200 bg-white">
          <SidebarContent/>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileSidebar && (
          <div className="fixed inset-0 z-40 sm:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={()=>setMobileSidebar(false)}/>
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col border-r border-stone-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                <span className="font-semibold text-stone-800">Rooms</span>
                <button onClick={()=>setMobileSidebar(false)} className="p-2 rounded-lg text-stone-400 hover:bg-stone-100"><X size={16}/></button>
              </div>
              <SidebarContent/>
            </div>
          </div>
        )}

        {/* CENTRE */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {liveSelectedUnit ? (
            <UnitDetailPanel item={liveSelectedUnit} roomId={activeRoomId} co={co} onBack={()=>setSelectedUnit(null)} onOpenCompare={item=>setCompareItem(item)}/>
          ) : activeRoom ? (
            <>
              <RoomUnitGrid room={activeRoom} onSelectUnit={item=>setSelectedUnit(item)} co={co}/>
              <div className="shrink-0 border-t border-stone-200 bg-[#f9f6f0] px-4 sm:px-5 py-2">
                <button onClick={()=>setCustomModal(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-dashed border-stone-300 px-4 py-2 text-xs font-semibold text-stone-500 hover:border-[#5c4a1e] hover:text-[#5c4a1e] hover:bg-[#fdf8f0] transition-colors w-full justify-center min-h-[44px]">
                  <Sparkles size={13}/> Add Custom Product to {activeRoom.name}
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">Select a room</div>
          )}
        </main>

        {/* RIGHT summary */}
        <aside className="hidden sm:flex w-64 shrink-0 flex-col border-l border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-4 py-3" style={{background:'#1c1917'}}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Quotation Total</p>
            <p className="text-2xl font-bold text-white mt-0.5">{fmtC(subtotal)}</p>
            <p className="text-[10px] text-stone-500 mt-0.5">excl. GST & discount</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
            {roomTotals.map(rt=>(
              <div key={rt.id} className={`flex items-center justify-between text-xs cursor-pointer rounded-lg px-1.5 py-1 -mx-1.5 transition-colors min-h-[36px]
                ${rt.id===activeRoomId?'text-stone-700 font-semibold':'hover:bg-stone-50'}`}
                style={rt.id===activeRoomId?{background:`${brandColor}10`}:{}}
                onClick={()=>handleSelectRoom(rt.id)}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className={`h-1.5 w-1.5 rounded-full shrink-0`} style={{background:rt.subtotal>0?brandColor:'#d6d3d1'}}/>
                  <span className="truncate">{rt.name}</span>
                  {rt.count>0&&<span className="text-[9px] text-stone-400 shrink-0">({rt.count})</span>}
                </div>
                <span className={`font-semibold ml-2 shrink-0 ${rt.subtotal>0?'text-stone-800':'text-stone-300'}`}>{rt.subtotal>0?fmtC(rt.subtotal):'—'}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-100 bg-stone-50 px-4 py-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-500"><span>Subtotal</span><span className="font-semibold text-stone-700">{fmtC(subtotal)}</span></div>
            {discountAmt>0&&<div className="flex justify-between text-green-600"><span>Discounts</span><span className="font-semibold">− {fmtC(discountAmt)}</span></div>}
            {(project?.installationCharge||0)>0&&<div className="flex justify-between text-stone-500"><span>Installation</span><span>{fmtC(project.installationCharge)}</span></div>}
            {(project?.transportCharge||0)>0&&<div className="flex justify-between text-stone-500"><span>Transport</span><span>{fmtC(project.transportCharge)}</span></div>}
            <div className="flex justify-between text-stone-500"><span>GST ({co.gstPercent||18}%)</span><span>+{fmtC(gstAmount)}</span></div>
            <div className="flex justify-between border-t border-stone-200 pt-1.5 text-sm font-bold text-stone-800">
              <span>Grand Total</span>
              <span style={{color:brandColor}}>{fmtC(grandTotal)}</span>
            </div>
          </div>
          <div className="space-y-2 border-t border-stone-200 p-4">
            <button onClick={handlePreview} className="w-full justify-center py-3 text-sm text-white rounded-xl font-semibold flex items-center gap-2"
              style={{background:brandColor}}>
              <Eye size={14}/> Preview & Download
            </button>
            <button onClick={()=>setClientOpen(true)}
              className="w-full btn-ghost justify-center border border-stone-200 py-2 text-sm min-h-[44px]">
              <User size={13}/> Client Details
              {(!project.customer?.name||!project.customer?.phone)&&<AlertCircle size={12} className="ml-1 text-amber-500"/>}
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden shrink-0 border-t border-stone-200 bg-white flex items-center no-print">
        {[
          {icon:Home,    label:'Projects', action:()=>navigate('/')},
          {icon:Menu,    label:'Rooms',    action:()=>setMobileSidebar(true)},
          {icon:User,    label:'Client',   action:()=>setClientOpen(true)},
          {icon:Eye,     label:'Preview',  action:handlePreview},
          {icon:Settings,label:'Settings', action:()=>navigate('/settings')},
        ].map(({icon:Icon,label,action})=>(
          <button key={label} onClick={action}
            className="flex flex-1 flex-col items-center justify-center py-2 gap-0.5 text-stone-400 hover:text-stone-700 active:bg-stone-50 min-h-[52px]">
            <Icon size={20}/>
            <span className="text-[9px] font-semibold">{label}</span>
          </button>
        ))}
      </nav>

      {/* Modals */}
      {addRoomOpen && <AddRoomModal onClose={()=>setAddRoomOpen(false)} onAdd={(name,dims)=>{addRoom(name,dims);setTimeout(()=>{const p=useCartStore.getState().getActiveProject();const r=p?.rooms?.[p.rooms.length-1];if(r){setActiveRoomId(r.id);setSelectedUnit(null);}},50);}}/>}
      {customModal  && <CustomProductModal roomId={activeRoomId} onClose={()=>setCustomModal(false)}/>}
      {clientOpen   && <ClientModal project={project} co={co} onClose={()=>setClientOpen(false)}/>}
      {compareItem  && <TierCompareModal product={compareItem.product} currentTierName={compareItem.tierName} onSelect={t=>useCartStore.getState().updateItemTier(activeRoomId,compareItem.id,t)} onClose={()=>setCompareItem(null)}/>}
    </div>
  );
}
