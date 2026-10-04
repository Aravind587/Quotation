/**
 * CustomerFormPage.jsx
 * Step 2: Fill in customer / site details for the active project
 * before entering the product builder.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, MapPin, Briefcase, Building2,
  ArrowRight, ArrowLeft, Folder, Package, IndianRupee,
  CheckCircle2, FileText,
} from 'lucide-react';
import useCartStore from '../store/cartStore';
import settings from '../data/settings.json';

/* step indicator (reused across pages) */
export function StepBar({ active }) {
  const steps = [
    { n: 1, label: 'Project',         icon: Folder,       path: '/'         },
    { n: 2, label: 'Customer',        icon: FileText,     path: '/customer' },
    { n: 3, label: 'Products',        icon: Package,      path: '/build'    },
    { n: 4, label: 'Download',        icon: IndianRupee,  path: '/quotation'},
  ];
  return (
    <div className="flex items-center gap-0 overflow-x-auto no-scrollbar">
      {steps.map(({ n, label, icon: Icon }, i) => {
        const done = n < active;
        const cur  = n === active;
        return (
          <React.Fragment key={n}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap
              ${cur  ? 'bg-brand-500 text-white'
              : done ? 'bg-brand-100 text-brand-700'
              :        'bg-stone-100 text-stone-400'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold
                ${cur ? 'bg-white text-brand-600' : done ? 'bg-brand-500 text-white' : 'bg-stone-200 text-stone-500'}`}>
                {done ? '✓' : n}
              </span>
              <Icon size={11}/>
              {label}
            </div>
            {i < 3 && <div className="w-4 sm:w-6 h-0.5 bg-stone-200 shrink-0"/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const FIELDS = [
  { key: 'name',        label: 'Full Name',        required: true,  icon: User,      type: 'text',  ph: 'Rajesh Kumar'          },
  { key: 'phone',       label: 'Phone Number',     required: true,  icon: Phone,     type: 'tel',   ph: '+91 98765 43210'       },
  { key: 'email',       label: 'Email Address',    required: false, icon: Mail,      type: 'email', ph: 'rajesh@example.com'    },
  { key: 'projectName', label: 'Project / Site',   required: false, icon: Briefcase, type: 'text',  ph: 'My Dream Home'         },
  { key: 'address',     label: 'Site Address',     required: false, icon: MapPin,    type: 'text',  ph: 'Flat 4B, Andheri West' },
  { key: 'city',        label: 'City',             required: false, icon: Building2, type: 'text',  ph: 'Mumbai'                },
];

export default function CustomerFormPage() {
  const navigate       = useNavigate();
  const projects       = useCartStore(s => s.projects);
  const activeId       = useCartStore(s => s.activeProjectId);
  const setCustomer    = useCartStore(s => s.setCustomer);
  const setActiveProj  = useCartStore(s => s.setActiveProject);

  const activeProject  = projects.find(p => p.id === activeId) || projects[0];
  const customer       = activeProject?.customer || {};

  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!customer.name?.trim())  e.name  = 'Name is required';
    if (!customer.phone?.trim()) e.phone = 'Phone is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    navigate('/build');
  };

  if (!activeProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500 mb-4">No active project found.</p>
          <button onClick={() => navigate('/')} className="btn-primary">← Back to Projects</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-brand-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold font-display">IQ</span>
            </div>
            <span className="font-display font-bold text-stone-800 hidden sm:block">{settings.companyName}</span>
          </div>
          <StepBar active={2}/>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Back */}
        <button onClick={() => navigate('/')} className="btn-ghost text-stone-500 mb-6 -ml-2 text-sm">
          <ArrowLeft size={14}/> All Projects
        </button>

        {/* Project badge */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-3 py-1.5">
            <Folder size={13} className="text-brand-500"/>
            <span className="text-sm font-semibold text-brand-700">{activeProject.name}</span>
          </div>
        </div>

        <h1 className="font-display text-3xl font-bold text-stone-800 mb-2">Customer Details</h1>
        <p className="text-stone-500 mb-8">
          These details appear on the final quotation document.
          Name and phone are required.
        </p>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-5">
          {FIELDS.map(({ key, label, required, icon: Icon, type, ph }) => (
            <div key={key}>
              <label className="label flex items-center gap-1.5">
                <Icon size={11}/>
                {label}
                {required && <span className="text-red-400">*</span>}
              </label>
              <input
                type={type}
                className={`input-field ${errors[key] ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                placeholder={ph}
                value={customer[key] || ''}
                onChange={e => {
                  setCustomer({ [key]: e.target.value });
                  if (errors[key]) setErrors(prev => { const n = {...prev}; delete n[key]; return n; });
                }}
              />
              {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
            </div>
          ))}

          {/* Extra charges (optional) */}
          <div className="pt-2 border-t border-stone-100">
            <p className="label mb-3">Additional Charges (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { field: 'installationCharge', label: `Installation (${settings.currencySymbol})` },
                { field: 'transportCharge',    label: `Transport (${settings.currencySymbol})` },
              ].map(({ field, label }) => {
                const setField = useCartStore.getState().setProjectField;
                return (
                  <div key={field}>
                    <label className="label">{label}</label>
                    <input
                      type="number" min="0" step="500"
                      className="input-field"
                      placeholder="0"
                      value={activeProject[field] || ''}
                      onChange={e => setField(field, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => navigate('/')} className="btn-ghost text-stone-500">
            <ArrowLeft size={15}/> Back
          </button>
          <button onClick={handleNext} className="btn-primary px-8 py-3 text-sm">
            Continue to Products <ArrowRight size={15}/>
          </button>
        </div>

        {/* Completion indicator */}
        {customer.name && customer.phone && (
          <div className="mt-4 flex items-center gap-2 text-green-600 text-sm justify-center">
            <CheckCircle2 size={14}/>
            Ready to continue
          </div>
        )}
      </main>
    </div>
  );
}
