/**
 * ShopPage.jsx — Main three-panel layout
 * LEFT: sidebar (categories, projects, customer form)
 * CENTRE: product grid filtered by selected category
 * RIGHT: cart panel for the active project
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChefHat, Package, Sofa, Bed, Droplets, LayoutGrid,
  ShoppingCart, Trash2, Plus, Minus, X, Edit3, Check,
  FolderPlus, FileText, User, Phone, Mail, MapPin,
  Briefcase, Building2, Tag, FileSpreadsheet, ChevronDown,
  ChevronUp, AlertCircle,
} from 'lucide-react';

import categoriesData from '../data/categories.json';
import productsData   from '../data/products.json';
import tiersData      from '../data/qualityTiers.json';
import addonsData     from '../data/addons.json';
import settings       from '../data/settings.json';
import useCartStore   from '../store/cartStore';
import { calcLineItem, calcQuotation, formatCurrency } from '../utils/pricing';

const SYM = settings.currencySymbol;

const ICONS = { ChefHat, Package, Sofa, Bed, Droplets, Grid: LayoutGrid, Grid3X3: LayoutGrid };
const CatIcon = ({ name, size = 16 }) => { const C = ICONS[name] || LayoutGrid; return <C size={size} />; };

const TIER_BADGE = {
  Economy:  'bg-emerald-100 text-emerald-700 border-emerald-300',
  Standard: 'bg-blue-100   text-blue-700   border-blue-300',
  Premium:  'bg-purple-100 text-purple-700 border-purple-300',
  Luxury:   'bg-amber-100  text-amber-700  border-amber-300',
};

function unitSuffix(p) {
  return { per_sqft: 'sq ft', per_rft: 'rft', per_unit: 'unit' }[p?.unitType] || '';
}

/* ─── Add / Edit Item Modal ─────────────────────────────────────── */
function ItemModal({ product, existingItem, onClose, onConfirm }) {
  const isEdit = !!existingItem;
  const productTiers = tiersData.filter(t => t.productId === product.id);
  const relevantAddons = addonsData.filter(
    a => !a.applicableCategories || a.applicableCategories.includes(product.categoryId)
  );

  const [tier,       setTier]       = useState(existingItem?.tier || productTiers[1] || productTiers[0]);
  const [dimensions, setDimensions] = useState({ ...(existingItem?.dimensions || product.defaultDimensions || { length: 1, width: 1 }) });
  const [quantity,   setQuantity]   = useState(existingItem?.quantity || 1);
  const [addonIds,   setAddonIds]   = useState((existingItem?.selectedAddons || []).map(a => a.id));
  const [roomLabel,  setRoomLabel]  = useState(existingItem?.roomLabel || '');

  const selectedAddons = addonsData.filter(a => addonIds.includes(a.id));
  const { qty, addonTotal, lineTotal } = useMemo(
    () => calcLineItem(product, tier, dimensions, quantity, selectedAddons),
    [product, tier, dimensions, quantity, selectedAddons]
  );

  const toggleAddon = id =>
    setAddonIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const dimL = k => product.dimensionLabels?.[k] || (k === 'length' ? 'Length (ft)' : 'Width/Height (ft)');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-stone-100 sticky top-0 bg-white z-10">
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide">{isEdit ? 'Edit Item' : 'Add to Quote'}</p>
            <h3 className="font-display font-bold text-stone-800 text-lg leading-tight">{product.name}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 shrink-0 ml-3"><X size={18}/></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Room label */}
          <div>
            <label className="label"><Tag size={10} className="inline mr-1"/>Room / Area Label</label>
            <input className="input-field" placeholder="e.g. Master Bedroom, Kitchen, Living Room"
              value={roomLabel} onChange={e => setRoomLabel(e.target.value)} />
          </div>

          {/* Dimensions */}
          {product.dimensionType !== 'none' && (
            <div>
              <label className="label">Dimensions</label>
              {product.dimensionType === 'running_feet' ? (
                <div className="flex items-center gap-2">
                  <input type="number" min="1" step="0.5" className="input-field w-32"
                    value={dimensions.length}
                    onChange={e => setDimensions(d => ({ ...d, length: parseFloat(e.target.value) || 0 }))} />
                  <span className="text-stone-400 text-sm">running feet</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <p className="text-xs text-stone-400 mb-1">{dimL('length')}</p>
                    <input type="number" min="1" step="0.5" className="input-field w-28"
                      value={dimensions.length}
                      onChange={e => setDimensions(d => ({ ...d, length: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <span className="text-stone-300 mt-4 text-xl">×</span>
                  <div>
                    <p className="text-xs text-stone-400 mb-1">{dimL('width')}</p>
                    <input type="number" min="1" step="0.5" className="input-field w-28"
                      value={dimensions.width}
                      onChange={e => setDimensions(d => ({ ...d, width: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <p className="text-xs text-stone-400 mt-4 self-end pb-2">
                    = <strong>{(dimensions.length * dimensions.width).toFixed(1)}</strong> sq ft
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preset sizes */}
          {product.dimensionType === 'none' && product.presetSizes?.length > 0 && (
            <div>
              <label className="label">Size</label>
              <div className="flex flex-wrap gap-2">
                {product.presetSizes.map((ps, i) => (
                  <button key={i} type="button"
                    onClick={() => setDimensions({ length: ps.multiplier, width: 1 })}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                      ${dimensions.length === ps.multiplier
                        ? 'bg-brand-50 border-brand-400 text-brand-700 ring-1 ring-brand-400'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                    {ps.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          {product.unitType === 'per_unit' && (
            <div>
              <label className="label">Quantity</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl border border-stone-200 flex items-center justify-center hover:bg-stone-100">
                  <Minus size={14}/>
                </button>
                <span className="w-10 text-center text-xl font-bold">{quantity}</span>
                <button type="button" onClick={() => setQuantity(q => q + 1)}
                  className="w-9 h-9 rounded-xl border border-stone-200 flex items-center justify-center hover:bg-stone-100">
                  <Plus size={14}/>
                </button>
              </div>
            </div>
          )}

          {/* Quality tier */}
          <div>
            <label className="label">Quality Tier</label>
            <div className="grid grid-cols-2 gap-2">
              {productTiers.map(t => (
                <button key={t.id} type="button" onClick={() => setTier(t)}
                  className={`flex flex-col p-3 rounded-xl border-2 text-left transition-all
                    ${tier?.id === t.id
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-300 ring-offset-1'
                      : 'border-stone-200 bg-stone-50 hover:border-stone-300'}`}>
                  <span className={`badge border text-xs mb-1.5 ${TIER_BADGE[t.tierName] || 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                    {t.tierName}
                  </span>
                  <span className="font-bold text-stone-800">
                    {formatCurrency(t.ratePerUnit, SYM)}
                    <span className="text-xs font-normal text-stone-400 ml-0.5">/{unitSuffix(product)}</span>
                  </span>
                  <span className="text-[10px] text-stone-400 mt-1.5 leading-relaxed line-clamp-3">{t.materialSpec}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          {relevantAddons.length > 0 && (
            <div>
              <label className="label">Add-ons (optional)</label>
              <div className="space-y-2">
                {relevantAddons.map(addon => {
                  const sel = addonIds.includes(addon.id);
                  return (
                    <button key={addon.id} type="button" onClick={() => toggleAddon(addon.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                        ${sel ? 'border-brand-400 bg-brand-50' : 'border-stone-200 hover:border-stone-300'}`}>
                      <div className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center
                        ${sel ? 'bg-brand-500 border-brand-500' : 'border-stone-300'}`}>
                        {sel && <Check size={10} className="text-white" strokeWidth={3}/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-800">{addon.name}</p>
                        <p className="text-xs text-stone-400 line-clamp-1">{addon.description}</p>
                      </div>
                      <span className="text-sm font-bold text-stone-700 shrink-0">+{formatCurrency(addon.price, SYM)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live price preview */}
          <div className="rounded-xl bg-stone-900 text-white p-4 space-y-1.5">
            <p className="text-xs text-stone-400 uppercase tracking-wide font-semibold mb-2">Price Estimate</p>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">{qty.toFixed(1)} {unitSuffix(product)} × {formatCurrency(tier?.ratePerUnit || 0, SYM)}</span>
              <span>{formatCurrency(qty * (tier?.ratePerUnit || 0), SYM)}</span>
            </div>
            {addonTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Add-ons</span>
                <span>+{formatCurrency(addonTotal, SYM)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline border-t border-stone-700 pt-2 mt-1">
              <span className="text-xs text-stone-400">Line Total (excl. GST)</span>
              <span className="text-2xl font-bold text-brand-400">{formatCurrency(lineTotal, SYM)}</span>
            </div>
            <p className="text-xs text-stone-500">GST {settings.gstPercent}% = +{formatCurrency(lineTotal * settings.gstPercent / 100, SYM)}</p>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 p-5 pt-2 sticky bottom-0 bg-white border-t border-stone-100">
          <button onClick={onClose} className="flex-1 btn-ghost justify-center">Cancel</button>
          <button
            disabled={!tier}
            onClick={() => { onConfirm({ tier, dimensions, quantity, selectedAddons, roomLabel }); onClose(); }}
            className="flex-1 btn-primary justify-center disabled:opacity-50">
            <ShoppingCart size={15}/>{isEdit ? 'Save Changes' : 'Add to Quote'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRODUCT CARD
═══════════════════════════════════════════════════════════════════ */
function ProductCard({ product, activeItems, onAdd, onEdit, onRemove }) {
  const tiers = tiersData.filter(t => t.productId === product.id);
  const minRate = tiers.length ? Math.min(...tiers.map(t => t.ratePerUnit)) : 0;
  const existingItems = activeItems.filter(i => i.product.id === product.id);
  const isAdded = existingItems.length > 0;

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden
      ${isAdded ? 'border-brand-400 shadow-md' : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'}`}>
      {/* Colour strip per category */}
      <div className={`h-1.5 bg-gradient-to-r ${
        { kitchen:'from-orange-400 to-red-400', wardrobe:'from-purple-400 to-indigo-400',
          living:'from-teal-400 to-cyan-400',   bedroom:'from-pink-400 to-rose-400',
          bathroom:'from-blue-400 to-sky-400',  flooring:'from-amber-400 to-yellow-400' }[product.categoryId] || 'from-stone-300 to-stone-400'
      }`}/>

      <div className="p-4">
        {/* Name + tags */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-stone-800 text-sm leading-snug">{product.name}</h3>
          {product.tags?.includes('popular') && (
            <span className="badge bg-brand-100 text-brand-700 shrink-0 text-[10px]">Popular</span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-stone-400 leading-relaxed line-clamp-2 mb-3">{product.description}</p>

        {/* Tier dots */}
        <div className="flex items-center gap-1 mb-3">
          {tiers.map(t => (
            <span key={t.id} className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${TIER_BADGE[t.tierName] || 'bg-stone-100 text-stone-500 border-stone-200'}`}>
              {t.tierName}
            </span>
          ))}
        </div>

        {/* Price + button */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] text-stone-400">Starting from</p>
            <p className="font-bold text-stone-800 text-base">
              {formatCurrency(minRate, SYM)}
              <span className="text-xs font-normal text-stone-400 ml-1">/{unitSuffix(product)}</span>
            </p>
          </div>

          {isAdded ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-brand-600 font-semibold">
                {existingItems.length}× added
              </span>
              <button onClick={() => onEdit(existingItems[0])}
                className="p-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100">
                <Edit3 size={13}/>
              </button>
              <button onClick={() => onAdd(product)}
                className="p-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200">
                <Plus size={13}/>
              </button>
            </div>
          ) : (
            <button onClick={() => onAdd(product)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors shadow-sm">
              <Plus size={12}/> Add
            </button>
          )}
        </div>

        {/* Already-added items summary */}
        {isAdded && (
          <div className="mt-3 pt-3 border-t border-stone-100 space-y-1">
            {existingItems.map(item => {
              const { lineTotal } = calcLineItem(item.product, item.tier, item.dimensions, item.quantity, item.selectedAddons);
              return (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">
                    {item.roomLabel ? <><strong className="text-stone-700">{item.roomLabel}</strong> · </> : ''}
                    {item.tier?.tierName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-stone-700">{formatCurrency(lineTotal, SYM)}</span>
                    <button onClick={() => onRemove(item.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                      <X size={11}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CART PANEL  (right side)
═══════════════════════════════════════════════════════════════════ */
function CartPanel({ project, onEditItem, navigate }) {
  const removeItem        = useCartStore(s => s.removeItem);
  const setCustomer       = useCartStore(s => s.setCustomer);
  const setProjectField   = useCartStore(s => s.setProjectField);
  const generateNumber    = useCartStore(s => s.generateQuotationNumber);
  const [customerOpen, setCustomerOpen] = useState(false);

  const items = project?.items || [];
  const customer = project?.customer || {};

  const totals = useMemo(() => calcQuotation(
    items, { ...settings, installationCharge: project?.installationCharge || 0, transportCharge: project?.transportCharge || 0 }, 0
  ), [items, project]);

  const handleGenerate = () => {
    if (!customer.name || !customer.phone) { alert('Please fill in Name and Phone in Customer Details.'); setCustomerOpen(true); return; }
    if (items.length === 0) { alert('Add at least one product to the quote.'); return; }
    generateNumber(project.id);
    navigate('/quotation');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <ShoppingCart size={32} className="text-stone-200 mb-3"/>
            <p className="text-stone-400 text-sm font-medium">No items yet</p>
            <p className="text-stone-300 text-xs mt-1">Browse products and click Add</p>
          </div>
        ) : (
          items.map(item => {
            const { qty, lineTotal } = calcLineItem(item.product, item.tier, item.dimensions, item.quantity, item.selectedAddons);
            return (
              <div key={item.id} className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-800 text-xs leading-snug truncate">{item.product?.name}</p>
                    {item.roomLabel && <p className="text-[10px] text-brand-600 font-medium mt-0.5">{item.roomLabel}</p>}
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      <span className={`badge border text-[9px] mr-1 ${TIER_BADGE[item.tier?.tierName] || 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                        {item.tier?.tierName}
                      </span>
                      {qty.toFixed(1)} {unitSuffix(item.product)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs font-bold text-stone-800">{formatCurrency(lineTotal, SYM)}</span>
                    <button onClick={() => onEditItem(item)} className="p-1 rounded hover:bg-stone-200 text-stone-400 hover:text-stone-700">
                      <Edit3 size={11}/>
                    </button>
                    <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-500">
                      <X size={11}/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customer details collapsible */}
      <div className="border-t border-stone-100 bg-white">
        <button
          onClick={() => setCustomerOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50">
          <span className="flex items-center gap-2">
            <User size={14}/>
            Customer Details
            {(!customer.name || !customer.phone) && (
              <AlertCircle size={12} className="text-amber-500"/>
            )}
          </span>
          {customerOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        </button>

        {customerOpen && (
          <div className="px-4 pb-4 space-y-2.5 border-t border-stone-50">
            {[
              { k:'name',        lbl:'Name *',       ph:'Rajesh Kumar',          ic: User },
              { k:'phone',       lbl:'Phone *',      ph:'+91 98765 43210',       ic: Phone },
              { k:'email',       lbl:'Email',        ph:'you@example.com',       ic: Mail },
              { k:'projectName', lbl:'Project Name', ph:'My Dream Home',         ic: Briefcase },
              { k:'address',     lbl:'Address',      ph:'Flat 4B, Andheri West', ic: MapPin },
              { k:'city',        lbl:'City',         ph:'Mumbai',                ic: Building2 },
            ].map(({ k, lbl, ph, ic: Icon }) => (
              <div key={k}>
                <label className="label flex items-center gap-1 mt-2"><Icon size={9}/>{lbl}</label>
                <input className="input-field text-xs" placeholder={ph}
                  value={customer[k] || ''}
                  onChange={e => setCustomer({ [k]: e.target.value })} />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <label className="label">Installation ({SYM})</label>
                <input type="number" min="0" className="input-field text-xs"
                  value={project?.installationCharge || 0}
                  onChange={e => setProjectField('installationCharge', +e.target.value || 0)} />
              </div>
              <div>
                <label className="label">Transport ({SYM})</label>
                <input type="number" min="0" className="input-field text-xs"
                  value={project?.transportCharge || 0}
                  onChange={e => setProjectField('transportCharge', +e.target.value || 0)} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="border-t border-stone-100 px-4 py-3 space-y-1 bg-stone-50">
          <div className="flex justify-between text-xs text-stone-500">
            <span>Subtotal</span><span>{formatCurrency(totals.subtotal, SYM)}</span>
          </div>
          <div className="flex justify-between text-xs text-stone-500">
            <span>GST ({settings.gstPercent}%)</span><span>+{formatCurrency(totals.taxAmount, SYM)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-stone-800 pt-1 border-t border-stone-200">
            <span>Grand Total</span>
            <span className="text-brand-600">{formatCurrency(totals.grandTotal, SYM)}</span>
          </div>
        </div>
      )}

      {/* Submit button */}
      <div className="p-4 border-t border-stone-200 bg-white">
        <button onClick={handleGenerate}
          disabled={items.length === 0}
          className="w-full btn-primary justify-center py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
          <FileSpreadsheet size={16}/>
          Generate & Download Quote
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
export default function ShopPage() {
  const navigate = useNavigate();

  // Store
  const projects          = useCartStore(s => s.projects);
  const activeProjectId   = useCartStore(s => s.activeProjectId);
  const setActiveProject  = useCartStore(s => s.setActiveProject);
  const addProject        = useCartStore(s => s.addProject);
  const removeProject     = useCartStore(s => s.removeProject);
  const renameProject     = useCartStore(s => s.renameProject);
  const addItem           = useCartStore(s => s.addItem);
  const updateItem        = useCartStore(s => s.updateItem);
  const removeItem        = useCartStore(s => s.removeItem);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  // UI state
  const [selectedCat,    setSelectedCat]    = useState(categoriesData[0]?.id || '');
  const [modalProduct,   setModalProduct]   = useState(null);   // product to Add
  const [editItem,       setEditItem]       = useState(null);   // cart item to Edit
  const [cartOpen,       setCartOpen]       = useState(false);  // mobile cart toggle
  const [renamingId,     setRenamingId]     = useState(null);
  const [renameVal,      setRenameVal]      = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [addingProject,  setAddingProject]  = useState(false);

  const filteredProducts = useMemo(
    () => productsData.filter(p => p.categoryId === selectedCat),
    [selectedCat]
  );

  const activeItems = activeProject?.items || [];

  const handleAdd = (product) => setModalProduct(product);
  const handleEdit = (item) => setEditItem(item);

  const confirmAdd = (product) => (config) => {
    addItem({ product, ...config });
    setModalProduct(null);
  };

  const confirmEdit = (config) => {
    updateItem(editItem.id, { ...config });
    setEditItem(null);
  };

  const cartCount = activeItems.length;
  const cartTotal = useMemo(() => activeItems.reduce((s, item) => {
    const { lineTotal } = calcLineItem(item.product, item.tier, item.dimensions, item.quantity, item.selectedAddons);
    return s + lineTotal;
  }, 0), [activeItems]);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* ── Top bar ── */}
      <header className="bg-white border-b border-stone-200 h-14 flex items-center px-4 gap-4 shrink-0 z-30 sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold font-display">IQ</span>
          </div>
          <span className="font-display font-bold text-stone-800 text-base hidden sm:block">InteriorCraft</span>
        </div>

        {/* Project switcher in header */}
        <div className="flex items-center gap-2 flex-1 overflow-x-auto no-scrollbar">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveProject(p.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap
                ${(p.id === activeProjectId || (!activeProjectId && p === projects[0]))
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
              <FileText size={10}/>
              {p.name}
              {p.items.length > 0 && (
                <span className={`rounded-full px-1.5 py-0 text-[9px] font-bold
                  ${(p.id === activeProjectId || (!activeProjectId && p === projects[0]))
                    ? 'bg-white text-brand-600' : 'bg-stone-300 text-stone-600'}`}>
                  {p.items.length}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => setAddingProject(true)}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-500 hover:bg-stone-200 whitespace-nowrap">
            <FolderPlus size={11}/> New Project
          </button>
        </div>

        {/* Mobile cart toggle */}
        <button
          onClick={() => setCartOpen(o => !o)}
          className="relative lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-semibold shrink-0">
          <ShoppingCart size={14}/>
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="hidden sm:inline">{formatCurrency(cartTotal, SYM)}</span>
        </button>
      </header>

      {/* ── New-project input bar ── */}
      {addingProject && (
        <div className="bg-brand-50 border-b border-brand-200 px-4 py-2 flex items-center gap-2 shrink-0">
          <input autoFocus className="input-field flex-1 max-w-xs text-sm py-1.5"
            placeholder="Project name e.g. Whitefield Villa"
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newProjectName.trim()) {
                addProject(newProjectName.trim());
                setNewProjectName(''); setAddingProject(false);
              }
              if (e.key === 'Escape') { setNewProjectName(''); setAddingProject(false); }
            }} />
          <button
            disabled={!newProjectName.trim()}
            onClick={() => { addProject(newProjectName.trim()); setNewProjectName(''); setAddingProject(false); }}
            className="btn-primary text-xs py-1.5 disabled:opacity-50">
            <Check size={13}/> Create
          </button>
          <button onClick={() => { setNewProjectName(''); setAddingProject(false); }}
            className="btn-ghost text-xs py-1.5"><X size={13}/></button>
        </div>
      )}

      {/* ── Three-column body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── LEFT SIDEBAR ─── */}
        <aside className="w-52 shrink-0 bg-white border-r border-stone-200 overflow-y-auto hidden md:flex flex-col">
          <div className="p-3">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide px-2 mb-2">
              Rooms & Categories
            </p>
            <nav className="space-y-0.5">
              {categoriesData.map(cat => {
                const count = productsData.filter(p => p.categoryId === cat.id &&
                  activeItems.some(i => i.product.categoryId === cat.id)).length;
                const selected = selectedCat === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                      ${selected ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'}`}>
                    <span className="flex items-center gap-2">
                      <CatIcon name={cat.icon} size={15}/>
                      {cat.name}
                    </span>
                    {count > 0 && (
                      <span className="bg-brand-100 text-brand-700 rounded-full px-1.5 py-0 text-[10px] font-bold">{count}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Project list in sidebar */}
          <div className="mt-auto border-t border-stone-100 p-3">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide px-2 mb-2">Projects</p>
            <div className="space-y-1">
              {projects.map(p => {
                const isActive = p.id === activeProjectId || (!activeProjectId && p === projects[0]);
                return (
                  <div key={p.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${isActive ? 'bg-brand-50' : 'hover:bg-stone-50'}`}>
                    {renamingId === p.id ? (
                      <>
                        <input autoFocus className="input-field text-xs py-0.5 flex-1"
                          value={renameVal}
                          onChange={e => setRenameVal(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { renameProject(p.id, renameVal); setRenamingId(null); }
                            if (e.key === 'Escape') setRenamingId(null);
                          }} />
                        <button onClick={() => { renameProject(p.id, renameVal); setRenamingId(null); }}
                          className="text-brand-500 hover:text-brand-700"><Check size={12}/></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setActiveProject(p.id)} className="flex-1 text-left text-xs font-medium text-stone-700 truncate">
                          {p.name}
                        </button>
                        <button onClick={() => { setRenamingId(p.id); setRenameVal(p.name); }}
                          className="p-0.5 text-stone-300 hover:text-stone-600"><Edit3 size={10}/></button>
                        {projects.length > 1 && (
                          <button onClick={() => removeProject(p.id)}
                            className="p-0.5 text-stone-300 hover:text-red-500"><X size={10}/></button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              <button onClick={() => setAddingProject(true)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-stone-400 hover:text-stone-600 hover:bg-stone-50">
                <FolderPlus size={11}/> Add project
              </button>
            </div>
          </div>
        </aside>

        {/* ─── CENTRE: product grid ─── */}
        <main className="flex-1 overflow-y-auto">
          {/* Category header */}
          <div className="sticky top-0 bg-stone-100/95 backdrop-blur-sm border-b border-stone-200 px-5 py-3 z-10">
            {(() => {
              const cat = categoriesData.find(c => c.id === selectedCat);
              return (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display font-bold text-stone-800 text-lg">{cat?.name}</h2>
                    <p className="text-stone-400 text-xs">{cat?.description}</p>
                  </div>
                  {/* Mobile category picker */}
                  <select
                    className="md:hidden input-field text-xs py-1.5 w-36"
                    value={selectedCat}
                    onChange={e => setSelectedCat(e.target.value)}>
                    {categoriesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              );
            })()}
          </div>

          {/* Product cards grid */}
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                activeItems={activeItems}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onRemove={removeItem}
              />
            ))}
          </div>
        </main>

        {/* ─── RIGHT: Cart panel (desktop always visible, mobile drawer) ─── */}
        <>
          {/* Mobile backdrop */}
          {cartOpen && (
            <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setCartOpen(false)}/>
          )}
          <aside className={`
            w-72 shrink-0 bg-white border-l border-stone-200 flex flex-col
            lg:relative lg:translate-x-0 lg:flex
            fixed right-0 top-14 bottom-0 z-40 transition-transform duration-300
            ${cartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}>
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart size={15} className="text-brand-500"/>
                <span className="font-semibold text-stone-800 text-sm">
                  {activeProject?.name || 'My Project'}
                </span>
                {cartCount > 0 && (
                  <span className="pop bg-brand-500 text-white rounded-full text-[10px] font-bold px-1.5">{cartCount}</span>
                )}
              </div>
              <button onClick={() => setCartOpen(false)} className="lg:hidden p-1 text-stone-400 hover:text-stone-700">
                <X size={16}/>
              </button>
            </div>

            <CartPanel
              project={activeProject}
              onEditItem={setEditItem}
              navigate={navigate}
            />
          </aside>
        </>
      </div>

      {/* ── Add item modal ── */}
      {modalProduct && (
        <ItemModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onConfirm={cfg => { addItem({ product: modalProduct, ...cfg }); setModalProduct(null); }}
        />
      )}

      {/* ── Edit item modal ── */}
      {editItem && (
        <ItemModal
          product={editItem.product}
          existingItem={editItem}
          onClose={() => setEditItem(null)}
          onConfirm={cfg => { updateItem(editItem.id, cfg); setEditItem(null); }}
        />
      )}
    </div>
  );
}
