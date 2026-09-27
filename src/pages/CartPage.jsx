import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Trash2, Edit2, Check, X, Tag, Plus,
  ChevronRight, PackageOpen, ArrowRight
} from 'lucide-react';
import useCartStore from '../store/cartStore';
import CustomerDetailsForm from '../components/CustomerDetailsForm';
import QuotationSummary from '../components/QuotationSummary';
import { calcLineItem, calcQuotation, resolvePromoCode, formatCurrency } from '../utils/pricing';
import settingsData from '../data/settings.json';
import promoCodes from '../data/promoCodes.json';

export default function CartPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateItem = useCartStore((s) => s.updateItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const promoCode = useCartStore((s) => s.promoCode);
  const promoResult = useCartStore((s) => s.promoResult);
  const setPromo = useCartStore((s) => s.setPromo);
  const clearPromo = useCartStore((s) => s.clearPromo);
  const generateQuotationNumber = useCartStore((s) => s.generateQuotationNumber);
  const installationCharge = useCartStore((s) => s.installationCharge);
  const transportCharge = useCartStore((s) => s.transportCharge);
  const setInstallationCharge = useCartStore((s) => s.setInstallationCharge);
  const setTransportCharge = useCartStore((s) => s.setTransportCharge);
  const customer = useCartStore((s) => s.customer);

  const [promoInput, setPromoInput] = useState(promoCode || '');
  const [promoMsg, setPromoMsg] = useState(promoResult?.message || '');
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState(1);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const { lineTotal } = calcLineItem(
          item.product, item.tier, item.dimensions, item.quantity, item.selectedAddons
        );
        return sum + lineTotal;
      }, 0),
    [items]
  );

  const discountAmount = promoResult?.valid ? promoResult.discountAmount : 0;

  const settings = {
    ...settingsData,
    installationCharge,
    transportCharge,
  };

  const totals = useMemo(
    () => calcQuotation(items, settings, discountAmount),
    [items, settings, discountAmount]
  );

  const applyPromo = () => {
    const result = resolvePromoCode(promoInput, promoCodes, subtotal);
    setPromo(promoInput, result);
    setPromoMsg(result.message);
  };

  const handleGenerate = () => {
    generateQuotationNumber();
    navigate('/quotation');
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditQty(item.quantity);
  };

  const saveEdit = (id) => {
    updateItem(id, { quantity: editQty });
    setEditingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-title">My Quotation Cart</h1>
        {items.length > 0 && (
          <button
            onClick={() => { if (window.confirm('Clear all items?')) clearCart(); }}
            className="btn-ghost text-red-500 hover:bg-red-50 text-xs"
          >
            <Trash2 size={14} /> Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24">
          <PackageOpen size={64} className="mx-auto text-stone-200 mb-4" />
          <h2 className="font-display text-2xl font-bold text-stone-700 mb-2">Your cart is empty</h2>
          <p className="text-stone-500 mb-6">Browse our products and add items to get started.</p>
          <button onClick={() => navigate('/categories')} className="btn-primary">
            Browse Products <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items + Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Line items table */}
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                    <th className="text-left p-4 font-semibold">Item</th>
                    <th className="text-center p-4 font-semibold hidden sm:table-cell">Tier</th>
                    <th className="text-center p-4 font-semibold hidden md:table-cell">Qty/Area</th>
                    <th className="text-right p-4 font-semibold">Total</th>
                    <th className="p-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {items.map((item) => {
                    const { qty, lineTotal } = calcLineItem(
                      item.product, item.tier, item.dimensions, item.quantity, item.selectedAddons
                    );
                    return (
                      <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-4">
                          <p className="font-semibold text-stone-800">{item.product?.name}</p>
                          {item.roomLabel && (
                            <p className="text-xs text-brand-600 font-medium">{item.roomLabel}</p>
                          )}
                          <p className="text-xs text-stone-400 mt-0.5">
                            {item.product?.unitType !== 'per_unit'
                              ? `${item.dimensions?.length} × ${item.dimensions?.width} ft`
                              : `${item.quantity} unit${item.quantity !== 1 ? 's' : ''}`}
                          </p>
                          {item.selectedAddons?.length > 0 && (
                            <p className="text-xs text-stone-400">
                              +{item.selectedAddons.length} add-on{item.selectedAddons.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-center hidden sm:table-cell">
                          <span className="badge bg-stone-100 text-stone-600 text-xs">
                            {item.tier?.tierName}
                          </span>
                        </td>
                        <td className="p-4 text-center hidden md:table-cell text-stone-600">
                          {editingId === item.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number" min="1"
                                className="input-field w-16 text-center text-xs py-1"
                                value={editQty}
                                onChange={(e) => setEditQty(parseInt(e.target.value) || 1)}
                              />
                              <button onClick={() => saveEdit(item.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                <Check size={14} />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1 text-stone-400 hover:bg-stone-100 rounded">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <span>{qty.toFixed(1)}</span>
                              {item.product?.unitType === 'per_unit' && (
                                <button onClick={() => startEdit(item)} className="p-1 text-stone-400 hover:text-stone-600">
                                  <Edit2 size={11} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right font-bold text-stone-800">
                          {formatCurrency(lineTotal, settingsData.currencySymbol)}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate('/categories')}
                className="btn-ghost text-brand-600 hover:bg-brand-50 text-sm"
              >
                <Plus size={15} /> Add More Products
              </button>
            </div>

            {/* Customer details */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-stone-800 text-lg mb-5">
                Customer Details
              </h2>
              <CustomerDetailsForm />
            </div>

            {/* Extra charges */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-stone-800 text-lg mb-5">
                Additional Charges
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Installation Charge ({settingsData.currencySymbol})</label>
                  <input
                    type="number" min="0" step="500"
                    className="input-field"
                    value={installationCharge}
                    onChange={(e) => setInstallationCharge(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label">Transport / Delivery ({settingsData.currencySymbol})</label>
                  <input
                    type="number" min="0" step="500"
                    className="input-field"
                    value={transportCharge}
                    onChange={(e) => setTransportCharge(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Summary */}
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-display font-semibold text-stone-800 mb-4">Order Summary</h2>

              {/* Promo code */}
              <div className="mb-5">
                <label className="label flex items-center gap-1">
                  <Tag size={11} /> Promo Code
                </label>
                {promoResult?.valid ? (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                    <Check size={14} className="text-green-600 shrink-0" />
                    <p className="text-xs text-green-700 flex-1">{promoResult.message}</p>
                    <button onClick={() => { clearPromo(); setPromoInput(''); setPromoMsg(''); }} className="text-stone-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        className="input-field uppercase text-xs"
                        placeholder="Enter code (e.g. WELCOME10)"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                      />
                      <button onClick={applyPromo} className="btn-primary text-xs px-3 whitespace-nowrap">
                        Apply
                      </button>
                    </div>
                    {promoMsg && (
                      <p className="text-xs mt-1.5 text-red-500">{promoMsg}</p>
                    )}
                  </>
                )}
              </div>

              <QuotationSummary totals={totals} />
            </div>

            {/* Generate CTA */}
            <button
              onClick={handleGenerate}
              disabled={!customer.name || !customer.phone}
              className="w-full btn-primary py-4 justify-center text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Final Quotation <ChevronRight size={18} />
            </button>
            {(!customer.name || !customer.phone) && (
              <p className="text-xs text-stone-400 text-center">
                Please fill in your name and phone number above.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
