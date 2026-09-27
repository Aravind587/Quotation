import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Ruler } from 'lucide-react';
import qualityTiers from '../data/qualityTiers.json';
import { formatCurrency } from '../utils/pricing';
import settings from '../data/settings.json';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const tiers = qualityTiers.filter((t) => t.productId === product.id);
  const lowestRate = tiers.length ? Math.min(...tiers.map((t) => t.ratePerUnit)) : 0;
  const highestRate = tiers.length ? Math.max(...tiers.map((t) => t.ratePerUnit)) : 0;

  const unitLabel = {
    per_sqft: '/ sq ft',
    per_rft: '/ rft',
    per_unit: '/ unit',
  }[product.unitType] || '';

  return (
    <div className="card group hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
      {/* Image placeholder */}
      <div className="relative h-44 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center overflow-hidden">
        <div className="text-stone-300">
          <Ruler size={48} strokeWidth={1} />
        </div>
        {product.tags?.includes('popular') && (
          <span className="absolute top-3 left-3 badge bg-brand-500 text-white">
            Popular
          </span>
        )}
        {product.tags?.includes('luxury') && (
          <span className="absolute top-3 left-3 badge bg-stone-800 text-white">
            Luxury
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-stone-800 text-base leading-snug">
          {product.name}
        </h3>
        <p className="text-stone-500 text-sm mt-1.5 leading-relaxed line-clamp-2">
          {product.description}
        </p>

        {/* Tier count */}
        <div className="flex items-center gap-1.5 mt-3">
          {[...Array(tiers.length)].map((_, i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full bg-brand-200" />
          ))}
          <span className="text-xs text-stone-400 ml-1">{tiers.length} tiers</span>
        </div>

        {/* Price range */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-xs text-stone-400">Starting from</p>
            <p className="text-lg font-bold text-stone-800">
              {formatCurrency(lowestRate, settings.currencySymbol)}
              <span className="text-xs font-normal text-stone-400 ml-1">{unitLabel}</span>
            </p>
          </div>
          <button
            onClick={() => navigate(`/configure/${product.id}`)}
            className="btn-primary text-xs px-3 py-2"
          >
            Configure <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
