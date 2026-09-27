import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingCart, ArrowRight, PackageOpen } from 'lucide-react';
import useCartStore from '../store/cartStore';
import { calcLineItem, formatCurrency } from '../utils/pricing';
import settings from '../data/settings.json';

export default function CartDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);

  const subtotal = items.reduce((sum, item) => {
    const { lineTotal } = calcLineItem(
      item.product, item.tier, item.dimensions, item.quantity, item.selectedAddons
    );
    return sum + lineTotal;
  }, 0);

  const goToCart = () => {
    onClose();
    navigate('/cart');
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col
                    transition-transform duration-300 ease-in-out
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Quotation cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-brand-500" />
            <h2 className="font-display font-semibold text-stone-800">
              My Quote ({items.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-stone-400 py-16">
              <PackageOpen size={48} className="mb-4 text-stone-200" />
              <p className="font-medium text-stone-500">Your quote is empty</p>
              <p className="text-sm mt-1">Browse products and add items to get started.</p>
              <button
                onClick={() => { onClose(); navigate('/categories'); }}
                className="mt-6 btn-primary text-sm"
              >
                Browse Products
              </button>
            </div>
          ) : (
            items.map((item) => {
              const { lineTotal } = calcLineItem(
                item.product, item.tier, item.dimensions, item.quantity, item.selectedAddons
              );
              return (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-stone-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">
                      {item.product?.name}
                    </p>
                    {item.roomLabel && (
                      <p className="text-xs text-brand-600 font-medium">{item.roomLabel}</p>
                    )}
                    <p className="text-xs text-stone-500 mt-0.5">
                      {item.tier?.tierName} tier
                      {item.product?.unitType !== 'per_unit' && (
                        <> · {item.dimensions?.length} × {item.dimensions?.width} ft</>
                      )}
                    </p>
                    <p className="text-sm font-bold text-stone-800 mt-1">
                      {formatCurrency(lineTotal, settings.currencySymbol)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    aria-label="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-100 px-5 py-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-500">Subtotal (excl. GST)</span>
              <span className="font-bold text-stone-800 text-base">
                {formatCurrency(subtotal, settings.currencySymbol)}
              </span>
            </div>
            <button onClick={goToCart} className="btn-primary w-full justify-center">
              Review & Generate Quote
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
