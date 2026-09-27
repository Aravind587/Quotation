import React from 'react';
import { Calculator } from 'lucide-react';
import { formatCurrency, unitLabel } from '../utils/pricing';
import settings from '../data/settings.json';

export default function PricePreviewBar({ product, tier, qty, addonTotal, lineTotal }) {
  if (!tier) return null;

  return (
    <div className="rounded-2xl bg-stone-900 text-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={16} className="text-brand-400" />
        <span className="text-sm font-semibold text-stone-300">Live Price Estimate</span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-stone-400">
            {qty.toFixed(1)} {unitLabel(product)} × {formatCurrency(tier.ratePerUnit, settings.currencySymbol)}
          </span>
          <span className="font-semibold">
            {formatCurrency(qty * tier.ratePerUnit, settings.currencySymbol)}
          </span>
        </div>

        {addonTotal > 0 && (
          <div className="flex justify-between">
            <span className="text-stone-400">Add-ons</span>
            <span className="font-semibold">+ {formatCurrency(addonTotal, settings.currencySymbol)}</span>
          </div>
        )}

        <div className="border-t border-stone-700 pt-2 mt-2 flex justify-between items-end">
          <div>
            <p className="text-xs text-stone-500">Line Total (excl. GST)</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(lineTotal, settings.currencySymbol)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-500">GST @{settings.gstPercent}%</p>
            <p className="text-sm font-semibold text-stone-300">
              + {formatCurrency(lineTotal * settings.gstPercent / 100, settings.currencySymbol)}
            </p>
          </div>
        </div>

        <p className="text-xs text-stone-500 pt-1">
          * Final total calculated at checkout. Prices excl. GST.
        </p>
      </div>
    </div>
  );
}
