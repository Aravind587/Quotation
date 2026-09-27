import React from 'react';
import { Check, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '../utils/pricing';
import settings from '../data/settings.json';

export default function AddonSelector({ addons, selectedIds, onChange, categoryId }) {
  // Filter addons relevant to this category
  const relevant = addons.filter(
    (a) => !a.applicableCategories || a.applicableCategories.includes(categoryId)
  );

  if (relevant.length === 0) return null;

  const toggle = (addon) => {
    if (selectedIds.includes(addon.id)) {
      onChange(selectedIds.filter((id) => id !== addon.id));
    } else {
      onChange([...selectedIds, addon.id]);
    }
  };

  return (
    <div className="space-y-2">
      {relevant.map((addon) => {
        const selected = selectedIds.includes(addon.id);
        return (
          <button
            key={addon.id}
            type="button"
            onClick={() => toggle(addon)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-150
              ${selected
                ? 'border-brand-400 bg-brand-50'
                : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            aria-pressed={selected}
          >
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors
                ${selected ? 'bg-brand-500 border-brand-500' : 'border-stone-300'}`}
            >
              {selected && <Check size={11} className="text-white" strokeWidth={3} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-800">{addon.name}</p>
              <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{addon.description}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-stone-800">
                + {formatCurrency(addon.price, settings.currencySymbol)}
              </p>
              <p className="text-xs text-stone-400">flat</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
