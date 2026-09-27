import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import useCartStore from '../store/cartStore';
import { calcLineItem, formatCurrency } from '../utils/pricing';
import settings from '../data/settings.json';

export default function FloatingCartBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const items = useCartStore((s) => s.items);

  // Don't show on cart or quotation page
  const hide = ['/cart', '/quotation'].some((p) => location.pathname.startsWith(p));
  if (hide || items.length === 0) return null;

  const subtotal = items.reduce((sum, item) => {
    const { lineTotal } = calcLineItem(
      item.product, item.tier, item.dimensions, item.quantity, item.selectedAddons
    );
    return sum + lineTotal;
  }, 0);

  return (
    <div className="no-print fixed bottom-4 inset-x-4 z-30 md:left-auto md:right-6 md:w-auto">
      <button
        onClick={() => navigate('/cart')}
        className="w-full md:w-auto flex items-center justify-between gap-4 px-5 py-3.5
                   bg-stone-900 text-white rounded-2xl shadow-2xl hover:bg-stone-800
                   transition-all duration-200 active:scale-98"
        aria-label="Go to cart"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart size={18} />
            <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-brand-500 text-[10px] font-bold flex items-center justify-center">
              {items.length}
            </span>
          </div>
          <div className="text-left">
            <p className="text-xs text-stone-400 leading-none">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
            <p className="font-bold text-sm leading-tight">
              {formatCurrency(subtotal, settings.currencySymbol)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-brand-400 text-sm font-semibold">
          View Quote <ArrowRight size={14} />
        </div>
      </button>
    </div>
  );
}
