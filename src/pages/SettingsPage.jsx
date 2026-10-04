/**
 * SettingsPage.jsx
 * Editable company profile saved to localStorage.
 * Sections: Company Info · Logo · GST & Tax · Bank Details · Terms & Conditions
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save, Building2, Phone, Mail, Globe, Hash,
  Percent, CreditCard, FileText, Image, Plus,
  Trash2, Check, ChevronLeft, Upload, RefreshCw,
  Settings,
} from 'lucide-react';
import settings from '../data/settings.json';

export const SETTINGS_KEY = 'iq_company_settings';

/* Load from localStorage, fallback to bundled defaults */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...settings, ...JSON.parse(raw) };
  } catch {}
  return { ...settings };
}

/* Save to localStorage */
export function saveSettings(data) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(data)); } catch {}
}

const SECTION = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-stone-100 bg-stone-50">
      <Icon size={16} className="text-[#5c4a1e]"/>
      <h2 className="font-display font-bold text-stone-800 text-base">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="label flex items-center gap-1 mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-stone-400 mt-1">{hint}</p>}
  </div>
);

export default function SettingsPage() {
  const navigate = useNavigate();
  const logoRef  = useRef();
  const [saved, setSaved]   = useState(false);
  const [data,  setData]    = useState(() => loadSettings());

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { alert('Logo must be under 500 KB'); return; }
    const reader = new FileReader();
    reader.onload = ev => set('logoDataUrl', ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    saveSettings(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (!window.confirm('Reset all settings to defaults?')) return;
    localStorage.removeItem(SETTINGS_KEY);
    setData({ ...settings });
  };

  // Terms array helpers
  const setTerm = (i, val) => {
    const arr = [...(data.termsAndConditions || [])];
    arr[i] = val;
    set('termsAndConditions', arr);
  };
  const addTerm    = () => set('termsAndConditions', [...(data.termsAndConditions||[]), '']);
  const removeTerm = (i) => set('termsAndConditions', (data.termsAndConditions||[]).filter((_,j)=>j!==i));

  return (
    <div className="min-h-screen bg-[#f9f6f0]">
      {/* ── Header ── */}
      <header className="bg-white border-b border-stone-200 h-12 flex items-center px-5 gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 rounded-lg bg-[#5c4a1e] flex items-center justify-center">
            <span className="text-white text-xs font-bold">IQ</span>
          </div>
          <span className="font-display font-bold text-stone-800 text-sm hidden sm:block">{data.companyName}</span>
        </div>
        <nav className="flex items-center gap-0.5 flex-1">
          <button onClick={() => navigate('/')}
            className="px-3 py-1.5 text-xs font-semibold text-stone-500 hover:bg-stone-100 rounded-lg">Projects</button>
          <span className="px-3 py-1.5 text-xs font-semibold bg-[#f5f0e8] text-[#5c4a1e] rounded-lg flex items-center gap-1">
            <Settings size={11}/> Settings
          </span>
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={handleReset}
            className="btn-ghost text-xs text-stone-400 border border-stone-200">
            <RefreshCw size={12}/> Reset
          </button>
          <button onClick={handleSave}
            className="btn-primary text-xs py-2">
            {saved ? <><Check size={13}/> Saved!</> : <><Save size={13}/> Save Settings</>}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-stone-800 mb-1">Company Settings</h1>
          <p className="text-stone-400 text-sm">These details appear on every quotation you generate.</p>
        </div>

        {/* ── 1. Company Info ── */}
        <SECTION title="Company Information" icon={Building2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company Name" required>
              <input className="input-field" value={data.companyName||''} onChange={e=>set('companyName',e.target.value)} placeholder="InteriorCraft Studio"/>
            </Field>
            <Field label="Tagline / Slogan">
              <input className="input-field" value={data.companyTagline||''} onChange={e=>set('companyTagline',e.target.value)} placeholder="Crafting Beautiful Living Spaces"/>
            </Field>
            <Field label="Phone" required>
              <input className="input-field" value={data.companyPhone||''} onChange={e=>set('companyPhone',e.target.value)} placeholder="+91 98765 43210"/>
            </Field>
            <Field label="Email" required>
              <input type="email" className="input-field" value={data.companyEmail||''} onChange={e=>set('companyEmail',e.target.value)} placeholder="hello@company.in"/>
            </Field>
            <Field label="Website">
              <input className="input-field" value={data.companyWebsite||''} onChange={e=>set('companyWebsite',e.target.value)} placeholder="www.company.in"/>
            </Field>
            <Field label="GST Registration Number">
              <input className="input-field" value={data.companyGST||''} onChange={e=>set('companyGST',e.target.value)} placeholder="27AABCI1234D1ZX"/>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Full Address">
                <textarea rows={2} className="input-field resize-none" value={data.companyAddress||''} onChange={e=>set('companyAddress',e.target.value)} placeholder="42, Design District, Bandra West, Mumbai - 400050"/>
              </Field>
            </div>
          </div>
        </SECTION>

        {/* ── 2. Logo ── */}
        <SECTION title="Company Logo" icon={Image}>
          <div className="flex items-start gap-6 flex-wrap">
            {/* Preview */}
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-stone-200 flex items-center justify-center bg-stone-50 overflow-hidden shrink-0">
              {data.logoDataUrl
                ? <img src={data.logoDataUrl} alt="logo" className="w-full h-full object-contain p-2"/>
                : <div className="text-center text-stone-300">
                    <Image size={28} className="mx-auto mb-1"/>
                    <p className="text-[10px]">No logo</p>
                  </div>}
            </div>
            <div className="flex-1 space-y-3">
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload}/>
              <button onClick={() => logoRef.current?.click()}
                className="btn-secondary text-sm flex items-center gap-2">
                <Upload size={14}/> Upload Logo
              </button>
              {data.logoDataUrl && (
                <button onClick={() => set('logoDataUrl', null)}
                  className="btn-ghost text-xs text-red-400 border border-red-200">
                  <Trash2 size={11}/> Remove Logo
                </button>
              )}
              <p className="text-xs text-stone-400 leading-relaxed">
                PNG, JPG or SVG. Max 500 KB.<br/>
                The logo appears in the top-left of every quotation.
              </p>
            </div>
          </div>
        </SECTION>

        {/* ── Tax & Pricing ── */}
        <SECTION title="Tax, Pricing & Branding" icon={Percent}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="GST %" required hint="Applied on taxable amount">
              <input type="number" min="0" max="100" className="input-field" value={data.gstPercent||18} onChange={e=>set('gstPercent',parseFloat(e.target.value)||0)}/>
            </Field>
            <Field label="Currency Symbol">
              <input className="input-field" value={data.currencySymbol||'₹'} onChange={e=>set('currencySymbol',e.target.value)} placeholder="₹"/>
            </Field>
            <Field label="Currency Code">
              <input className="input-field" value={data.currencyCode||'INR'} onChange={e=>set('currencyCode',e.target.value)} placeholder="INR"/>
            </Field>
            <Field label="Quote Valid (days)">
              <input type="number" min="1" className="input-field" value={data.quotationValidityDays||30} onChange={e=>set('quotationValidityDays',parseInt(e.target.value)||30)}/>
            </Field>
            <Field label="Quote Number Prefix" hint="e.g. IQ, QT, EST — appears as IQ-20240101-1234">
              <input className="input-field" value={data.quotePrefix||'IQ'} onChange={e=>set('quotePrefix',e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6))} placeholder="IQ" maxLength={6}/>
            </Field>
            <Field label="Brand Accent Colour" hint="Used in quotation header & accents">
              <div className="flex items-center gap-2">
                <input type="color" className="h-10 w-16 rounded-lg border border-stone-200 cursor-pointer p-1"
                  value={data.brandColor||'#5c4a1e'} onChange={e=>set('brandColor',e.target.value)}/>
                <input className="input-field flex-1" value={data.brandColor||'#5c4a1e'} onChange={e=>set('brandColor',e.target.value)} placeholder="#5c4a1e"/>
              </div>
            </Field>
          </div>
        </SECTION>

        {/* ── 4. Bank Details ── */}
        <SECTION title="Bank Details" icon={CreditCard}>
          <p className="text-xs text-stone-400 mb-4">Printed on quotations so clients can transfer the advance directly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { k:'bankName',          lbl:'Bank Name',       ph:'HDFC Bank'                },
              { k:'bankAccountName',   lbl:'Account Name',    ph:'InteriorCraft Studio'     },
              { k:'bankAccountNumber', lbl:'Account Number',  ph:'50100123456789'           },
              { k:'bankIFSC',          lbl:'IFSC Code',       ph:'HDFC0001234'              },
              { k:'bankBranch',        lbl:'Branch',          ph:'Bandra West, Mumbai'      },
              { k:'bankUPI',           lbl:'UPI ID (optional)',ph:'business@hdfcbank'       },
            ].map(({ k, lbl, ph }) => (
              <Field key={k} label={lbl}>
                <input className="input-field" placeholder={ph}
                  value={data[k]||''} onChange={e=>set(k, e.target.value)}/>
              </Field>
            ))}
          </div>
        </SECTION>

        {/* ── 5. Terms & Conditions ── */}
        <SECTION title="Terms & Conditions" icon={FileText}>
          <p className="text-xs text-stone-400 mb-4">These lines appear at the bottom of every quotation.</p>
          <div className="space-y-2">
            {(data.termsAndConditions||[]).map((term, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs text-stone-400 font-semibold mt-2.5 w-5 shrink-0">{i+1}.</span>
                <input className="input-field flex-1 text-sm" value={term}
                  onChange={e => setTerm(i, e.target.value)}/>
                <button onClick={() => removeTerm(i)}
                  className="p-2 mt-0.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 shrink-0">
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>
          <button onClick={addTerm}
            className="mt-3 flex items-center gap-1.5 text-xs text-[#5c4a1e] font-semibold hover:underline">
            <Plus size={12}/> Add term
          </button>
        </SECTION>

        {/* ── Save ── */}
        <div className="flex items-center justify-between pb-8">
          <button onClick={() => navigate('/')} className="btn-ghost text-stone-500">
            <ChevronLeft size={14}/> Back to Projects
          </button>
          <button onClick={handleSave}
            className="btn-primary px-8 py-3 text-sm">
            {saved
              ? <><Check size={15}/> Settings Saved!</>
              : <><Save size={15}/> Save All Settings</>}
          </button>
        </div>
      </main>
    </div>
  );
}
