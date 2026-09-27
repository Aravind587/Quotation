import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChefHat, Package, Sofa, Bed, Droplets, Grid3X3 } from 'lucide-react';

const ICON_MAP = {
  ChefHat, Package, Sofa, Bed, Droplets, Grid: Grid3X3,
};

export default function CategoryCard({ category }) {
  const navigate = useNavigate();

  const Icon = ICON_MAP[category.icon] || Grid3X3;

  const gradients = {
    'from-orange-400 to-red-500': 'bg-gradient-to-br from-orange-400 to-red-500',
    'from-purple-400 to-indigo-500': 'bg-gradient-to-br from-purple-400 to-indigo-500',
    'from-teal-400 to-cyan-500': 'bg-gradient-to-br from-teal-400 to-cyan-500',
    'from-pink-400 to-rose-500': 'bg-gradient-to-br from-pink-400 to-rose-500',
    'from-blue-400 to-sky-500': 'bg-gradient-to-br from-blue-400 to-sky-500',
    'from-amber-400 to-yellow-500': 'bg-gradient-to-br from-amber-400 to-yellow-500',
  };

  const gradientClass = gradients[category.gradient] || 'bg-gradient-to-br from-stone-400 to-stone-600';

  return (
    <button
      onClick={() => navigate(`/categories/${category.id}`)}
      className="card group text-left hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 w-full"
    >
      {/* Icon block */}
      <div className={`${gradientClass} p-6 flex items-center justify-center`}>
        <Icon size={40} className="text-white drop-shadow" strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-stone-800 text-lg leading-snug">
          {category.name}
        </h3>
        <p className="text-stone-500 text-sm mt-1 leading-relaxed">
          {category.description}
        </p>
        <div className="flex items-center gap-1 text-brand-500 text-sm font-semibold mt-3 group-hover:gap-2 transition-all">
          Explore <ArrowRight size={14} />
        </div>
      </div>
    </button>
  );
}
