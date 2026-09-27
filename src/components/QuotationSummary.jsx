import React from 'react';
import { formatCurrency, unitLabel } from '../utils/pricing';
import settings from '../data/settings.json';

export default function QuotationSummary({ totals }) {
  if (!totals) return null;
  const sym = settings.currencySymbol;

  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex justify-between py-1">
        <span className="text-stone-500">Subtotal</span>
        <span className="font-semibold">{formatCurrency(totals.subtotal, sym)}</span>
      </div>
      {totals.discountAmount > 0 && (
        <div className="flex justify-between py-1 text-green-600">
          <span>Discount</span>
          <span className="font-semibold">− {formatCurrency(totals.discountAmount, sym)}</span>
        </div>
      )}
      <div className="flex justify-between py-1">
        <span className="text-stone-500">Taxable Amount</span>
        <span className="font-semibold">{formatCurrency(totals.taxableAmount, sym)}</span>
      </div>
      <div className="flex justify-between py-1">
        <span className="text-stone-500">GST ({totals.gstPercent}%)</span>
        <span className="font-semibold">{formatCurrency(totals.taxAmount, sym)}</span>
      </div>
      {totals.installationCharge > 0 && (
        <div className="flex justify-between py-1">
          <span className="text-stone-500">Installation</span>
          <span className="font-semibold">{formatCurrency(totals.installationCharge, sym)}</span>
        </div>
      )}
      {totals.transportCharge > 0 && (
        <div className="flex justify-between py-1">
          <span className="text-stone-500">Transport</span>
          <span className="font-semibold">{formatCurrency(totals.transportCharge, sym)}</span>
        </div>
      )}
      <div className="flex justify-between pt-3 border-t-2 border-stone-800">
        <span className="font-bold text-stone-800 text-base">Grand Total</span>
        <span className="font-bold text-brand-600 text-xl">{formatCurrency(totals.grandTotal, sym)}</span>
      </div>
    </div>
  );
}
