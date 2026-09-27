import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown, ChevronUp, FileSpreadsheet, User, Phone,
  Mail, MapPin, Briefcase, Building2, Tag, Info
} from 'lucide-react';
import products from '../data/products.json';
import categories from '../data/categories.json';
import qualityTiers from '../data/qualityTiers.json';
import addonsData from '../data/addons.json';
import settingsData from '../data/settings.json';
import useCartStore from '../store/cartStore';
import { calcLineItem, calcQuotation, formatCurrency } from '../utils/pricing';

/* ── Tier colour map ─────────────────────────────────────────────────── */
const TIER_COLORS = {
  Economy:  'bg-green-100 text-green-700 border-green-300',
  Standard: 'bg-blue-100 text-blue-700 border-blue-300',
  Premium:  'bg-purple-100 text-purple-700 border-purple-300',
  Luxury:   'bg-amber-100 text-amber-700 border-amber-300',
};

/* ── Toggle switch ───────────────────────────────────────────────────── */
function Toggle({ checked, onChange, id }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 ${
        checked ? 'bg-brand-500' : 'bg-stone-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

/* ── Single product row ──────────────────────────────────────────────── */
function ProductRow({ product, config, onChange }) {
  const tiers = qualityTiers.filter((t) => t.productId === product.id);
  const [expanded, setExpanded] = useState(false);

  const relevantAddons = addonsData.filter(
    (a) => a.applicableCategories?.includes(product.categoryId)
  );

  const selectedTier = tiers.find((t) => t.id === config.tierId) || tiers[1] || tiers[0];
  const selectedAddons = addonsData.filter((a) => config.addonIds?.includes(a.id));

  const { qty, lineTotal } = useMemo(
    () => calcLineItem(product, selectedTier, config.dimensions, config.quantity, selectedAddons),
    [product, selectedTier, config.dimensions, config.quantity, selectedAddons]
  );

  const unitLabel = { per_sqft: 'sq ft', per_rft: 'rft', per_unit: 'unit' }[product.unitType] || '';

  const update = (patch) => onChange({ ...config, ...patch });

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 ${
        config.enabled
          ? 'border-brand-300 bg-white shadow-sm'
          : 'border-stone-200 bg-stone-50'
      }`}
    >
      {/* ── Header row ── */}
      <div className="flex items-center gap-3 p-3 sm:p-4">
        {/* Toggle */}
        <Toggle
          id={`toggle-${product.id}`}
          checked={config.enabled}
          onChange={(val) => {
            update({ enabled: val });
            if (val) setExpanded(true);
          }}
        />

        {/* Name + summary */}
        <div className="flex-1 min-w-0">
          <label
            htmlFor={`toggle-${product.id}`}
            className={`font-semibold text-sm cursor-pointer select-none ${
              config.enabled ? 'text-stone-800' : 'text-stone-400'
            }`}
          >
            {product.name}
          </label>
          {config.enabled && (
            <p className="text-xs text-stone-500 mt-0.5">
              {selectedTier?.tierName} · {qty.toFixed(1)} {unitLabel}
            </p>
          )}
        </div>

        {/* Price badge */}
        {config.enabled && (
          <span className="shrink-0 font-bold text-sm text-brand-600">
            {formatCurrency(lineTotal, settingsData.currencySymbol)}
          </span>
        )}

        {/* Expand/collapse */}
        {config.enabled && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="p-1 rounded-lg hover:bg-stone-100 text-stone-400"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* ── Expanded config ── */}
      {config.enabled && expanded && (
        <div className="border-t border-stone-100 px-4 pb-4 pt-3 space-y-4">
          {/* Room label */}
          <div>
            <label className="label flex items-center gap-1">
              <Tag size={10} /> Room / Label
            </label>
            <input
              className="input-field max-w-xs text-sm"
              placeholder="e.g. Master Bedroom"
              value={config.roomLabel || ''}
              onChange={(e) => update({ roomLabel: e.target.value })}
            />
          </div>

          {/* Dimensions */}
          {product.dimensionType !== 'none' && (
            <div>
              <label className="label">Dimensions</label>
              <div className="flex flex-wrap items-center gap-2">
                {product.dimensionType === 'running_feet' ? (
                  <>
                    <input
                      type="number" min="1" step="0.5"
                      className="input-field w-24 text-sm"
                      value={config.dimensions.length}
                      onChange={(e) =>
                        update({ dimensions: { ...config.dimensions, length: parseFloat(e.target.value) || 0 } })
                      }
                    />
                    <span className="text-stone-400 text-sm">rft</span>
                  </>
                ) : (
                  <>
                    <input
                      type="number" min="1" step="0.5"
                      className="input-field w-24 text-sm"
                      value={config.dimensions.length}
                      onChange={(e) =>
                        update({ dimensions: { ...config.dimensions, length: parseFloat(e.target.value) || 0 } })
                      }
                    />
                    <span className="text-stone-400 text-sm">×</span>
                    <input
                      type="number" min="1" step="0.5"
                      className="input-field w-24 text-sm"
                      value={config.dimensions.width}
                      onChange={(e) =>
                        update({ dimensions: { ...config.dimensions, width: parseFloat(e.target.value) || 0 } })
                      }
                    />
                    <span className="text-stone-400 text-sm">ft</span>
                    <span className="text-xs text-stone-400">= {(config.dimensions.length * config.dimensions.width).toFixed(1)} sq ft</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Preset sizes for per_unit */}
          {product.dimensionType === 'none' && product.presetSizes?.length > 0 && (
            <div>
              <label className="label">Size</label>
              <select
                className="input-field max-w-xs text-sm"
                value={config.presetIndex ?? 0}
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  update({ presetIndex: idx });
                }}
              >
                {product.presetSizes.map((p, i) => (
                  <option key={i} value={i}>{p.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity for per_unit */}
          {product.unitType === 'per_unit' && (
            <div>
              <label className="label">Quantity</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => update({ quantity: Math.max(1, (config.quantity || 1) - 1) })}
                  className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold"
                >−</button>
                <span className="w-8 text-center font-bold">{config.quantity || 1}</span>
                <button
                  type="button"
                  onClick={() => update({ quantity: (config.quantity || 1) + 1 })}
                  className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold"
                >+</button>
              </div>
            </div>
          )}

          {/* Quality tier */}
          <div>
            <label className="label">Quality Tier</label>
            <div className="flex flex-wrap gap-2">
              {tiers.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => update({ tierId: tier.id })}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    config.tierId === tier.id
                      ? (TIER_COLORS[tier.tierName] || 'bg-brand-100 text-brand-700 border-brand-300') + ' ring-2 ring-offset-1 ring-brand-400'
                      : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {tier.tierName}
                  <span className="ml-1.5 font-normal opacity-75">
                    {formatCurrency(tier.ratePerUnit, settingsData.currencySymbol)}/unit
                  </span>
                </button>
              ))}
            </div>
            {selectedTier && (
              <p className="text-xs text-stone-400 mt-1.5 flex items-start gap-1">
                <Info size={10} className="shrink-0 mt-0.5" />
                {selectedTier.materialSpec}
              </p>
            )}
          </div>

          {/* Add-ons */}
          {relevantAddons.length > 0 && (
            <div>
              <label className="label">Add-ons</label>
              <div className="flex flex-wrap gap-2">
                {relevantAddons.map((addon) => {
                  const sel = config.addonIds?.includes(addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => {
                        const cur = config.addonIds || [];
                        update({
                          addonIds: sel
                            ? cur.filter((x) => x !== addon.id)
                            : [...cur, addon.id],
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        sel
                          ? 'bg-brand-50 border-brand-400 text-brand-700'
                          : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      {addon.name}{' '}
                      <span className="opacity-60">
                        +{formatCurrency(addon.price, settingsData.currencySymbol)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live price */}
          <div className="rounded-lg bg-stone-900 text-white px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-stone-400">Line Total (excl. GST)</span>
            <span className="font-bold text-base text-brand-400">
              {formatCurrency(lineTotal, settingsData.currencySymbol)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────── */
export default function QuoteBuilderPage() {
  const navigate = useNavigate();
  const setCustomer = useCartStore((s) => s.setCustomer);
  const customer = useCartStore((s) => s.customer);
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const generateQuotationNumber = useCartStore((s) => s.generateQuotationNumber);

  /* ── Per-product config state ── */
  const [configs, setConfigs] = useState(() => {
    const init = {};
    products.forEach((p) => {
      const tiers = qualityTiers.filter((t) => t.productId === p.id);
      const defaultTier = tiers[1] || tiers[0];
      init[p.id] = {
        enabled: false,
        tierId: defaultTier?.id || '',
        dimensions: { ...(p.defaultDimensions || { length: 1, width: 1 }) },
        quantity: 1,
        addonIds: [],
        roomLabel: '',
        presetIndex: 0,
      };
    });
    return init;
  });

  const updateConfig = (productId, patch) =>
    setConfigs((prev) => ({ ...prev, [productId]: { ...prev[productId], ...patch } }));

  /* ── Selected items ── */
  const enabledProducts = products.filter((p) => configs[p.id]?.enabled);

  /* ── Live totals ── */
  const lineItems = useMemo(() =>
    enabledProducts.map((product) => {
      const cfg = configs[product.id];
      const tiers = qualityTiers.filter((t) => t.productId === product.id);
      const tier = tiers.find((t) => t.id === cfg.tierId) || tiers[1] || tiers[0];
      const selectedAddons = addonsData.filter((a) => cfg.addonIds?.includes(a.id));
      const { qty, unitRate, addonTotal, lineTotal } = calcLineItem(
        product, tier, cfg.dimensions, cfg.quantity, selectedAddons
      );
      return { product, tier, cfg, qty, unitRate, addonTotal, lineTotal, selectedAddons };
    }),
    [enabledProducts, configs]
  );

  const totals = useMemo(
    () => calcQuotation(
      lineItems.map((li) => ({
        product: li.product,
        tier: li.tier,
        dimensions: li.cfg.dimensions,
        quantity: li.cfg.quantity,
        selectedAddons: li.selectedAddons,
      })),
      settingsData,
      0
    ),
    [lineItems]
  );

  /* ── Submit ── */
  const handleSubmit = () => {
    if (!customer.name || !customer.phone) {
      alert('Please enter your name and phone number before submitting.');
      return;
    }
    if (enabledProducts.length === 0) {
      alert('Please select at least one product.');
      return;
    }
    // Rebuild cart from current selections
    clearCart();
    lineItems.forEach(({ product, tier, cfg, selectedAddons }) => {
      addItem({
        product,
        tier,
        dimensions: cfg.dimensions,
        quantity: cfg.quantity,
        selectedAddons,
        roomLabel: cfg.roomLabel,
      });
    });
    generateQuotationNumber();
    navigate('/quotation');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-800">
            Build Your Quotation
          </h1>
          <p className="text-stone-500 mt-2">
            Toggle products you need, configure dimensions and quality, then submit to get your quote.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {/* ── Left: product list ── */}
          <div className="xl:col-span-2 space-y-8">
            {categories.map((cat) => {
              const catProducts = products.filter((p) => p.categoryId === cat.id);
              return (
                <div key={cat.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${cat.gradient || 'from-stone-400 to-stone-600'}`} />
                    <h2 className="font-display font-semibold text-stone-700 text-lg">{cat.name}</h2>
                    <span className="text-xs text-stone-400">
                      {catProducts.filter((p) => configs[p.id]?.enabled).length}/{catProducts.length} selected
                    </span>
                  </div>
                  <div className="space-y-2">
                    {catProducts.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        config={configs[product.id]}
                        onChange={(patch) => updateConfig(product.id, patch)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Right: sticky summary + customer form ── */}
          <div className="xl:sticky xl:top-20 space-y-4">
            {/* Customer details */}
            <div className="card p-5">
              <h2 className="font-display font-semibold text-stone-800 mb-4 text-base">
                Your Details
              </h2>
              <div className="space-y-3">
                {[
                  { key: 'name',        label: 'Name *',         icon: User,      placeholder: 'Rajesh Kumar',          type: 'text' },
                  { key: 'phone',       label: 'Phone *',        icon: Phone,     placeholder: '+91 98765 43210',       type: 'tel' },
                  { key: 'email',       label: 'Email',          icon: Mail,      placeholder: 'you@email.com',         type: 'email' },
                  { key: 'projectName', label: 'Project Name',   icon: Briefcase, placeholder: 'My Dream Home',         type: 'text' },
                  { key: 'address',     label: 'Address',        icon: MapPin,    placeholder: 'Flat 4B, Andheri West', type: 'text' },
                  { key: 'city',        label: 'City',           icon: Building2, placeholder: 'Mumbai',                type: 'text' },
                ].map(({ key, label, icon: Icon, placeholder, type }) => (
                  <div key={key}>
                    <label className="label flex items-center gap-1">
                      <Icon size={10} />{label}
                    </label>
                    <input
                      type={type}
                      className="input-field text-sm"
                      placeholder={placeholder}
                      value={customer[key] || ''}
                      onChange={(e) => setCustomer({ [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Live summary */}
            <div className="card p-5">
              <h2 className="font-display font-semibold text-stone-800 mb-3 text-base">
                Quote Summary
              </h2>

              {lineItems.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-4">
                  Toggle products on the left to see your quote here.
                </p>
              ) : (
                <div className="space-y-1.5 text-sm max-h-48 overflow-y-auto pr-1 mb-4">
                  {lineItems.map(({ product, lineTotal, cfg }) => (
                    <div key={product.id} className="flex justify-between gap-2">
                      <span className="text-stone-600 truncate text-xs">
                        {cfg.roomLabel ? `${cfg.roomLabel} — ` : ''}{product.name}
                      </span>
                      <span className="font-semibold text-stone-800 shrink-0 text-xs">
                        {formatCurrency(lineTotal, settingsData.currencySymbol)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {lineItems.length > 0 && (
                <div className="border-t border-stone-100 pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-stone-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totals.subtotal, settingsData.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>GST ({settingsData.gstPercent}%)</span>
                    <span>{formatCurrency(totals.taxAmount, settingsData.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-800 text-base pt-1 border-t border-stone-200 mt-1">
                    <span>Grand Total</span>
                    <span className="text-brand-600">
                      {formatCurrency(totals.grandTotal, settingsData.currencySymbol)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={enabledProducts.length === 0}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl
                         bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-base
                         shadow-lg transition-all duration-150
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <FileSpreadsheet size={20} />
              Submit & Download Quotation
            </button>
            {enabledProducts.length === 0 && (
              <p className="text-xs text-stone-400 text-center -mt-2">
                Select at least one product above
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
