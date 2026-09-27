import React from 'react';
import { Ruler } from 'lucide-react';

export default function DimensionInput({ product, dimensions, onChange }) {
  if (!product) return null;

  const { dimensionType, dimensionLabels = {}, defaultDimensions = {}, presetSizes = [] } = product;

  // per_unit products with preset sizes use a dropdown selector instead
  if (dimensionType === 'none' && presetSizes.length > 0) {
    return (
      <div>
        <label className="label">Select Size</label>
        <select
          className="input-field"
          value={dimensions.presetIndex ?? 0}
          onChange={(e) => {
            const idx = parseInt(e.target.value, 10);
            const preset = presetSizes[idx];
            onChange({ ...dimensions, presetIndex: idx, presetLabel: preset.label, multiplier: preset.multiplier });
          }}
        >
          {presetSizes.map((p, i) => (
            <option key={i} value={i}>{p.label}</option>
          ))}
        </select>
      </div>
    );
  }

  // running feet — only one input
  if (dimensionType === 'running_feet') {
    return (
      <div>
        <label className="label">
          <Ruler size={12} className="inline mr-1" />
          {dimensionLabels.length || 'Running Feet'} (ft)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            step="0.5"
            className="input-field max-w-[160px]"
            value={dimensions.length}
            onChange={(e) => onChange({ ...dimensions, length: parseFloat(e.target.value) || 0 })}
          />
          <span className="text-stone-400 text-sm">rft</span>
        </div>
        <p className="text-xs text-stone-400 mt-1.5">
          Total: <span className="font-semibold text-stone-600">{dimensions.length} running feet</span>
        </p>
      </div>
    );
  }

  // length × width / height
  const label1 = dimensionLabels.length || 'Length (ft)';
  const label2 = dimensionLabels.width || (dimensionType === 'length_height' ? 'Height (ft)' : 'Width (ft)');
  const area = (parseFloat(dimensions.length) || 0) * (parseFloat(dimensions.width) || 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">
            <Ruler size={12} className="inline mr-1" />
            {label1}
          </label>
          <input
            type="number"
            min="1"
            step="0.5"
            className="input-field"
            value={dimensions.length}
            onChange={(e) => onChange({ ...dimensions, length: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="label">
            <Ruler size={12} className="inline mr-1 rotate-90" />
            {label2}
          </label>
          <input
            type="number"
            min="1"
            step="0.5"
            className="input-field"
            value={dimensions.width}
            onChange={(e) => onChange({ ...dimensions, width: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
      <p className="text-xs text-stone-400 mt-2">
        Total area:{' '}
        <span className="font-semibold text-stone-600">
          {dimensions.length} × {dimensions.width} = {area.toFixed(1)} sq ft
        </span>
      </p>
    </div>
  );
}
