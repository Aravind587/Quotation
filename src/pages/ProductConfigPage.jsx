import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, CheckCircle2, Tag } from 'lucide-react';
import products from '../data/products.json';
import categories from '../data/categories.json';
import qualityTiers from '../data/qualityTiers.json';
import addonsData from '../data/addons.json';
import QualityTierSelector from '../components/QualityTierSelector';
import DimensionInput from '../components/DimensionInput';
import AddonSelector from '../components/AddonSelector';
import PricePreviewBar from '../components/PricePreviewBar';
import useCartStore from '../store/cartStore';
import { calcLineItem } from '../utils/pricing';

export default function ProductConfigPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const product = products.find((p) => p.id === productId);
  const category = product ? categories.find((c) => c.id === product.categoryId) : null;
  const tiers = qualityTiers.filter((t) => t.productId === productId);

  const [selectedTier, setSelectedTier] = useState(tiers[1] || tiers[0] || null); // default to Standard
  const [dimensions, setDimensions] = useState(
    product?.defaultDimensions || { length: 1, width: 1 }
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [roomLabel, setRoomLabel] = useState('');
  const [added, setAdded] = useState(false);

  const selectedAddons = useMemo(
    () => addonsData.filter((a) => selectedAddonIds.includes(a.id)),
    [selectedAddonIds]
  );

  const { qty, addonTotal, lineTotal } = useMemo(
    () => calcLineItem(product, selectedTier, dimensions, quantity, selectedAddons),
    [product, selectedTier, dimensions, quantity, selectedAddons]
  );

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-2xl font-bold text-stone-800 mb-3">Product not found</h2>
        <button onClick={() => navigate('/categories')} className="btn-primary">
          Browse Products
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedTier) return;
    addItem({
      product,
      tier: selectedTier,
      dimensions,
      quantity,
      selectedAddons,
      roomLabel,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate(category ? `/categories/${category.id}` : '/categories')}
        className="btn-ghost mb-6 text-stone-500"
      >
        <ChevronLeft size={16} />
        {category?.name || 'Products'}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: config */}
        <div className="lg:col-span-3 space-y-7">
          {/* Title */}
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {product.tags?.map((tag) => (
                <span key={tag} className="badge bg-brand-100 text-brand-700 capitalize">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="font-display text-3xl font-bold text-stone-800">{product.name}</h1>
            <p className="text-stone-500 mt-2 leading-relaxed">{product.description}</p>
          </div>

          {/* Room label */}
          <div>
            <label className="label flex items-center gap-1">
              <Tag size={11} /> Room / Label (optional)
            </label>
            <input
              className="input-field max-w-xs"
              placeholder="e.g. Master Bedroom, Kitchen"
              value={roomLabel}
              onChange={(e) => setRoomLabel(e.target.value)}
            />
          </div>

          {/* Dimensions */}
          {product.dimensionType !== 'none' && (
            <div>
              <h3 className="font-semibold text-stone-700 mb-3 text-sm uppercase tracking-wide">
                Dimensions
              </h3>
              <DimensionInput
                product={product}
                dimensions={dimensions}
                onChange={setDimensions}
              />
            </div>
          )}

          {/* Preset sizes (for per_unit products) */}
          {product.dimensionType === 'none' && product.presetSizes?.length > 0 && (
            <div>
              <h3 className="font-semibold text-stone-700 mb-3 text-sm uppercase tracking-wide">
                Size
              </h3>
              <DimensionInput
                product={product}
                dimensions={dimensions}
                onChange={setDimensions}
              />
            </div>
          )}

          {/* Quantity (for per_unit) */}
          {product.unitType === 'per_unit' && (
            <div>
              <label className="label">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 text-lg font-bold"
                >
                  −
                </button>
                <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-9 h-9 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 text-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Quality tier */}
          <div>
            <h3 className="font-semibold text-stone-700 mb-3 text-sm uppercase tracking-wide">
              Quality Tier
            </h3>
            <QualityTierSelector
              tiers={tiers}
              selectedTierId={selectedTier?.id}
              onChange={setSelectedTier}
            />
          </div>

          {/* Add-ons */}
          {addonsData.some(
            (a) => a.applicableCategories?.includes(product.categoryId)
          ) && (
            <div>
              <h3 className="font-semibold text-stone-700 mb-3 text-sm uppercase tracking-wide">
                Optional Add-ons
              </h3>
              <AddonSelector
                addons={addonsData}
                selectedIds={selectedAddonIds}
                onChange={setSelectedAddonIds}
                categoryId={product.categoryId}
              />
            </div>
          )}
        </div>

        {/* Right: sticky price panel */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24 space-y-4">
            <PricePreviewBar
              product={product}
              tier={selectedTier}
              qty={qty}
              addonTotal={addonTotal}
              lineTotal={lineTotal}
            />

            {/* Add to cart */}
            {added ? (
              <div className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-green-500 text-white font-semibold text-sm">
                <CheckCircle2 size={18} />
                Added to Quote!
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={!selectedTier}
                className="w-full btn-primary justify-center py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={16} />
                Add to Quote
              </button>
            )}

            <button
              onClick={() => navigate('/cart')}
              className="w-full btn-secondary justify-center text-sm"
            >
              Review My Quote
            </button>

            {/* Material spec */}
            {selectedTier && (
              <div className="rounded-xl bg-stone-50 border border-stone-200 p-4">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Material Specification
                </p>
                <p className="text-sm text-stone-700 leading-relaxed">
                  {selectedTier.materialSpec}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
