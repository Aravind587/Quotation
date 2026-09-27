import React from 'react';
import { Check, Star } from 'lucide-react';
import { formatCurrency } from '../utils/pricing';
import settings from '../data/settings.json';

const TIER_COLORS = {
  Economy:  { ring: 'border-green-400 bg-green-50',   badge: 'bg-green-100 text-green-700',  dot: 'bg-green-400'  },
  Standard: { ring: 'border-blue-400 bg-blue-50',     badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-400'   },
  Premium:  { ring: 'border-purple-400 bg-purple-50', badge: 'bg-purple-100 text-purple-700',dot: 'bg-purple-400' },
  Luxury:   { ring: 'border-amber-400 bg-amber-50',   badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400'  },
};

const TIER_STARS = { Economy: 1, Standard: 2, Premium: 3, Luxury: 4 };

export default function QualityTierSelector({ tiers, selectedTierId, onChange }) {
  if (!tiers || tiers.length === 0) {
    return <p className="text-sm text-stone-400">No quality tiers available for this product.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {tiers.map((tier) => {
        const selected = tier.id === selectedTierId;
        const colors = TIER_COLORS[tier.tierName] || TIER_COLORS.Standard;
        const stars = TIER_STARS[tier.tierName] || 2;

        return (
          <button
            key={tier.id}
            type="button"
            onClick={() => onChange(tier)}
            className={`tier-card text-left ${selected ? `tier-card-selected ${colors.ring}` : 'tier-card-unselected'}`}
            aria-pressed={selected}
          >
            {/* Header row */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className={`badge ${colors.badge} text-xs mb-1.5`}>{tier.tierName}</span>
                <div className="flex gap-0.5">
                  {[...Array(4)].map((_, i) => (
                    <Star
                      key={i}
                      size={10}
                      className={i < stars ? 'text-amber-400 fill-amber-400' : 'text-stone-200 fill-stone-200'}
                    />
                  ))}
                </div>
              </div>
              {selected && (
                <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Rate */}
            <p className="text-xl font-bold text-stone-800">
              {formatCurrency(tier.ratePerUnit, settings.currencySymbol)}
              <span className="text-xs font-normal text-stone-400 ml-1">/ unit</span>
            </p>

            {/* Spec */}
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              {tier.materialSpec}
            </p>
          </button>
        );
      })}
    </div>
  );
}
