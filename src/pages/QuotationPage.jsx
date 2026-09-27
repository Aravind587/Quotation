import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, Printer, Share2, MessageCircle, Mail,
  CheckCircle2, ArrowLeft, Loader2
} from 'lucide-react';
import useCartStore from '../store/cartStore';
import { calcLineItem, calcQuotation, formatCurrency } from '../utils/pricing';
import { downloadQuotationPDF, printQuotation } from '../utils/pdfExport';
import settingsData from '../data/settings.json';

function LineItemRow({ item, sym }) {
  const { qty, unitRate, addonTotal, lineTotal } = calcLineItem(
    item.product, item.tier, item.dimensions, item.quantity, item.selectedAddons
  );
  const unitLabel = { per_sqft: 'sq ft', per_rft: 'rft', per_unit: 'unit' }[item.product?.unitType] || '';

  return (
    <tr className="border-b border-stone-100">
      <td className="py-3 pr-4">
        <p className="font-semibold text-stone-800 text-sm">{item.product?.name}</p>
        {item.roomLabel && <p className="text-xs text-brand-600">{item.roomLabel}</p>}
        {item.selectedAddons?.length > 0 && (
          <p className="text-xs text-stone-400 mt-0.5">
            Add-ons: {item.selectedAddons.map((a) => a.name).join(', ')}
          </p>
        )}
      </td>
      <td className="py-3 px-2 text-center text-xs text-stone-500">
        {item.tier?.tierName}
      </td>
      <td className="py-3 px-2 text-center text-xs text-stone-600">
        {qty.toFixed(1)} {unitLabel}
      </td>
      <td className="py-3 px-2 text-center text-xs text-stone-600">
        {formatCurrency(unitRate, sym)}
      </td>
      {addonTotal > 0 && (
        <td className="py-3 px-2 text-center text-xs text-stone-600">
          +{formatCurrency(addonTotal, sym)}
        </td>
      )}
      {addonTotal === 0 && <td className="py-3 px-2 text-center text-xs text-stone-400">—</td>}
      <td className="py-3 pl-2 text-right font-bold text-stone-800 text-sm">
        {formatCurrency(lineTotal, sym)}
      </td>
    </tr>
  );
}

export default function QuotationPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const customer = useCartStore((s) => s.customer);
  const promoResult = useCartStore((s) => s.promoResult);
  const quotationNumber = useCartStore((s) => s.quotationNumber);
  const quotationDate = useCartStore((s) => s.quotationDate);
  const installationCharge = useCartStore((s) => s.installationCharge);
  const transportCharge = useCartStore((s) => s.transportCharge);

  const [pdfLoading, setPdfLoading] = useState(false);

  const sym = settingsData.currencySymbol;
  const discountAmount = promoResult?.valid ? promoResult.discountAmount : 0;

  const settings = { ...settingsData, installationCharge, transportCharge };
  const totals = useMemo(
    () => calcQuotation(items, settings, discountAmount),
    [items, settings, discountAmount]
  );

  const dateStr = quotationDate
    ? new Date(quotationDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const validUntil = quotationDate
    ? new Date(
        new Date(quotationDate).getTime() +
          settingsData.quotationValidityDays * 24 * 60 * 60 * 1000
      ).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      await downloadQuotationPDF(
        'quotation-printable',
        `${settingsData.companyName.replace(/\s+/g, '-')}-Quote-${quotationNumber || 'draft'}`
      );
    } catch {
      alert('PDF generation failed. Please try printing instead.');
    } finally {
      setPdfLoading(false);
    }
  };

  const whatsappSummary = () => {
    const lines = [
      `*${settingsData.companyName} — Quotation ${quotationNumber || ''}*`,
      `Customer: ${customer.name}`,
      `Date: ${dateStr}`,
      '',
      ...items.map((item) => {
        const { lineTotal } = calcLineItem(
          item.product, item.tier, item.dimensions, item.quantity, item.selectedAddons
        );
        return `• ${item.product?.name} (${item.tier?.tierName}): ${formatCurrency(lineTotal, sym)}`;
      }),
      '',
      discountAmount > 0 ? `Discount: -${formatCurrency(discountAmount, sym)}` : '',
      `GST (${settingsData.gstPercent}%): ${formatCurrency(totals.taxAmount, sym)}`,
      `*Grand Total: ${formatCurrency(totals.grandTotal, sym)}*`,
      '',
      `Valid till: ${validUntil}`,
    ].filter(Boolean).join('\n');
    return encodeURIComponent(lines);
  };

  const mailtoLink = () => {
    const subject = encodeURIComponent(
      `Interior Quotation ${quotationNumber || ''} — ${customer.name}`
    );
    const body = encodeURIComponent(
      [
        `Dear ${customer.name},`,
        '',
        `Please find your quotation from ${settingsData.companyName}.`,
        '',
        `Quotation No: ${quotationNumber || 'Draft'}`,
        `Date: ${dateStr}`,
        `Valid Until: ${validUntil}`,
        '',
        ...items.map((item) => {
          const { lineTotal } = calcLineItem(
            item.product, item.tier, item.dimensions, item.quantity, item.selectedAddons
          );
          return `${item.product?.name} (${item.tier?.tierName}): ${formatCurrency(lineTotal, sym)}`;
        }),
        '',
        `Grand Total: ${formatCurrency(totals.grandTotal, sym)}`,
        '',
        `Regards,`,
        settingsData.companyName,
        settingsData.companyPhone,
      ].join('\n')
    );
    return `mailto:${customer.email || ''}?subject=${subject}&body=${body}`;
  };

  if (!quotationNumber) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h2 className="font-display text-2xl font-bold text-stone-800 mb-3">
          No quotation generated yet
        </h2>
        <p className="text-stone-500 mb-6">Please go to the cart and click "Generate Final Quotation".</p>
        <button onClick={() => navigate('/cart')} className="btn-primary">
          Go to Cart
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Actions bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-8">
        <button onClick={() => navigate('/cart')} className="btn-ghost text-stone-500">
          <ArrowLeft size={16} /> Back to Cart
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePDF}
            disabled={pdfLoading}
            className="btn-primary text-sm"
          >
            {pdfLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {pdfLoading ? 'Generating…' : 'Download PDF'}
          </button>
          <button onClick={printQuotation} className="btn-secondary text-sm">
            <Printer size={15} /> Print
          </button>
          <a
            href={`https://wa.me/?text=${whatsappSummary()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm border-green-500 text-green-600 hover:bg-green-50"
          >
            <MessageCircle size={15} /> WhatsApp
          </a>
          <a href={mailtoLink()} className="btn-secondary text-sm">
            <Mail size={15} /> Email
          </a>
        </div>
      </div>

      {/* ─── Printable quotation document ─────────────────────────────── */}
      <div
        id="quotation-printable"
        className="bg-white rounded-2xl shadow-card p-6 md:p-10 space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-6 border-b border-stone-200">
          {/* Company */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
                <span className="text-white font-bold font-display text-base">IQ</span>
              </div>
              <div>
                <h1 className="font-display font-bold text-stone-900 text-xl leading-tight">
                  {settingsData.companyName}
                </h1>
                <p className="text-stone-400 text-xs">{settingsData.companyTagline}</p>
              </div>
            </div>
            <div className="text-xs text-stone-500 space-y-0.5 ml-0.5 mt-3">
              <p>{settingsData.companyAddress}</p>
              <p>{settingsData.companyPhone} · {settingsData.companyEmail}</p>
              <p>GSTIN: {settingsData.companyGST}</p>
            </div>
          </div>

          {/* Quotation meta */}
          <div className="text-right shrink-0">
            <div className="inline-block bg-brand-50 border border-brand-200 rounded-xl px-5 py-3">
              <p className="text-xs text-brand-500 font-semibold uppercase tracking-wide mb-1">
                Quotation
              </p>
              <p className="font-display font-bold text-stone-800 text-lg">{quotationNumber}</p>
            </div>
            <div className="text-xs text-stone-500 mt-3 space-y-1">
              <p>Date: <span className="font-medium text-stone-700">{dateStr}</span></p>
              <p>Valid Until: <span className="font-medium text-stone-700">{validUntil}</span></p>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-stone-100">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
              Quotation For
            </p>
            <p className="font-bold text-stone-800">{customer.name}</p>
            {customer.projectName && (
              <p className="text-sm text-brand-600 font-medium">{customer.projectName}</p>
            )}
            <p className="text-sm text-stone-500 mt-1">{customer.phone}</p>
            {customer.email && <p className="text-sm text-stone-500">{customer.email}</p>}
            {customer.address && (
              <p className="text-sm text-stone-500 mt-1">{customer.address}, {customer.city}</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
              Payment Terms
            </p>
            <p className="text-sm text-stone-600">50% advance · 40% on delivery · 10% on completion</p>
            <p className="text-xs text-stone-400 mt-2">
              All amounts in {settingsData.currencyCode}. GST included in grand total.
            </p>
          </div>
        </div>

        {/* Line items */}
        <div>
          <h2 className="font-display font-semibold text-stone-700 text-base mb-4">
            Itemised Scope of Work
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 rounded-xl text-xs uppercase tracking-wide text-stone-400">
                  <th className="text-left py-2.5 px-3 rounded-l-lg font-semibold">Description</th>
                  <th className="text-center py-2.5 px-2 font-semibold">Tier</th>
                  <th className="text-center py-2.5 px-2 font-semibold">Qty/Area</th>
                  <th className="text-center py-2.5 px-2 font-semibold">Rate</th>
                  <th className="text-center py-2.5 px-2 font-semibold">Add-ons</th>
                  <th className="text-right py-2.5 px-3 rounded-r-lg font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <LineItemRow key={item.id} item={item} sym={sym} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between py-1 text-stone-600">
              <span>Subtotal</span>
              <span className="font-semibold">{formatCurrency(totals.subtotal, sym)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between py-1 text-green-600">
                <span>Discount</span>
                <span className="font-semibold">− {formatCurrency(totals.discountAmount, sym)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 text-stone-600">
              <span>Taxable Amount</span>
              <span className="font-semibold">{formatCurrency(totals.taxableAmount, sym)}</span>
            </div>
            <div className="flex justify-between py-1 text-stone-600">
              <span>CGST ({totals.gstPercent / 2}%)</span>
              <span className="font-semibold">{formatCurrency(totals.taxAmount / 2, sym)}</span>
            </div>
            <div className="flex justify-between py-1 text-stone-600">
              <span>SGST ({totals.gstPercent / 2}%)</span>
              <span className="font-semibold">{formatCurrency(totals.taxAmount / 2, sym)}</span>
            </div>
            {totals.installationCharge > 0 && (
              <div className="flex justify-between py-1 text-stone-600">
                <span>Installation</span>
                <span className="font-semibold">{formatCurrency(totals.installationCharge, sym)}</span>
              </div>
            )}
            {totals.transportCharge > 0 && (
              <div className="flex justify-between py-1 text-stone-600">
                <span>Transport</span>
                <span className="font-semibold">{formatCurrency(totals.transportCharge, sym)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 pb-1 border-t-2 border-stone-800">
              <span className="font-bold text-stone-800 text-base">Grand Total</span>
              <span className="font-bold text-brand-600 text-xl">
                {formatCurrency(totals.grandTotal, sym)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="border-t border-stone-100 pt-6">
          <h3 className="font-semibold text-stone-700 text-sm mb-3">Terms & Conditions</h3>
          <ol className="space-y-1.5">
            {settingsData.termsAndConditions.map((term, i) => (
              <li key={i} className="flex gap-2.5 text-xs text-stone-500 leading-relaxed">
                <span className="shrink-0 font-semibold text-stone-400">{i + 1}.</span>
                {term}
              </li>
            ))}
          </ol>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <p>
            This is a computer-generated quotation and does not require a signature.
          </p>
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 size={13} />
            <span>Thank you for choosing {settingsData.companyName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
