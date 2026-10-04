/**
 * ProductIcons.jsx
 * Hand-crafted SVG 2D outline illustrations for every interior product.
 * Each icon is a clean line-art silhouette at 64×64 viewBox.
 * Usage: <ProductIcon productId="wardrobe-sliding" size={48} />
 */

import React from 'react';

/* ── Individual SVG icons ──────────────────────────────────────── */

const KitchenLShape = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* base cabinets horizontal run */}
    <rect x="4" y="38" width="36" height="16" rx="1"/>
    <line x1="13" y1="38" x2="13" y2="54"/>
    <line x1="22" y1="38" x2="22" y2="54"/>
    <line x1="31" y1="38" x2="31" y2="54"/>
    {/* handles */}
    <circle cx="8.5" cy="46" r="0.8" fill="currentColor"/>
    <circle cx="17.5" cy="46" r="0.8" fill="currentColor"/>
    <circle cx="26.5" cy="46" r="0.8" fill="currentColor"/>
    {/* vertical run */}
    <rect x="40" y="10" width="16" height="44" rx="1"/>
    <line x1="40" y1="22" x2="56" y2="22"/>
    <line x1="40" y1="34" x2="56" y2="34"/>
    <line x1="40" y1="46" x2="56" y2="46"/>
    <circle cx="48" cy="28" r="0.8" fill="currentColor"/>
    <circle cx="48" cy="40" r="0.8" fill="currentColor"/>
    <circle cx="48" cy="52" r="0.8" fill="currentColor"/>
    {/* countertop */}
    <path d="M4 37h36V35H4z" strokeWidth="1"/>
    <path d="M39 10h18V8H39z" strokeWidth="1"/>
    {/* sink */}
    <rect x="7" y="26" width="12" height="8" rx="1"/>
    <circle cx="13" cy="30" r="1.5"/>
    <line x1="13" y1="28.5" x2="13" y2="25"/>
  </svg>
);

const KitchenStraight = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="36" width="56" height="18" rx="1"/>
    <line x1="17" y1="36" x2="17" y2="54"/>
    <line x1="30" y1="36" x2="30" y2="54"/>
    <line x1="43" y1="36" x2="43" y2="54"/>
    <circle cx="10.5" cy="45" r="0.8" fill="currentColor"/>
    <circle cx="23.5" cy="45" r="0.8" fill="currentColor"/>
    <circle cx="36.5" cy="45" r="0.8" fill="currentColor"/>
    <circle cx="49.5" cy="45" r="0.8" fill="currentColor"/>
    {/* wall cabinets */}
    <rect x="4" y="10" width="56" height="14" rx="1"/>
    <line x1="17" y1="10" x2="17" y2="24"/>
    <line x1="30" y1="10" x2="30" y2="24"/>
    <line x1="43" y1="10" x2="43" y2="24"/>
    <line x1="4" y1="35" x2="60" y2="35" strokeWidth="1"/>
    {/* hob */}
    <rect x="6" y="27" width="12" height="7" rx="1"/>
    <circle cx="9" cy="30.5" r="1.2"/>
    <circle cx="15" cy="30.5" r="1.2"/>
  </svg>
);

const KitchenIsland = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* U shape cabinets */}
    <rect x="4" y="4" width="12" height="36" rx="1"/>
    <rect x="4" y="4" width="56" height="12" rx="1"/>
    <rect x="48" y="4" width="12" height="36" rx="1"/>
    {/* island */}
    <rect x="18" y="40" width="28" height="14" rx="2"/>
    <line x1="18" y1="47" x2="46" y2="47"/>
    <circle cx="25" cy="43.5" r="0.8" fill="currentColor"/>
    <circle cx="32" cy="43.5" r="0.8" fill="currentColor"/>
    <circle cx="39" cy="43.5" r="0.8" fill="currentColor"/>
    {/* handles */}
    <circle cx="10" cy="20" r="0.8" fill="currentColor"/>
    <circle cx="54" cy="20" r="0.8" fill="currentColor"/>
    <circle cx="28" cy="10" r="0.8" fill="currentColor"/>
    <circle cx="40" cy="10" r="0.8" fill="currentColor"/>
  </svg>
);

const WardrobeSliding = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* carcass */}
    <rect x="4" y="6" width="56" height="54" rx="1"/>
    {/* centre divider */}
    <line x1="32" y1="6" x2="32" y2="60"/>
    {/* sliding door tracks */}
    <line x1="4" y1="8" x2="60" y2="8" strokeWidth="1"/>
    <line x1="4" y1="58" x2="60" y2="58" strokeWidth="1"/>
    {/* door panels */}
    <rect x="5" y="9" width="28" height="48" rx="0.5" strokeDasharray="0"/>
    <rect x="31" y="9" width="28" height="48" rx="0.5"/>
    {/* handles */}
    <line x1="20" y1="28" x2="20" y2="38"/>
    <line x1="44" y1="28" x2="44" y2="38"/>
    {/* mirror indication on one door */}
    <ellipse cx="44" cy="33" rx="5" ry="7" strokeDasharray="2 2"/>
    {/* bottom rail feet */}
    <line x1="8"  y1="60" x2="8"  y2="63"/>
    <line x1="32" y1="60" x2="32" y2="63"/>
    <line x1="56" y1="60" x2="56" y2="63"/>
  </svg>
);

const WardrobeHinged = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="6" width="56" height="54" rx="1"/>
    <line x1="32" y1="6" x2="32" y2="60"/>
    {/* hinges */}
    <rect x="4"  y="12" width="3" height="4" rx="0.5" fill="currentColor" fillOpacity="0.2"/>
    <rect x="4"  y="44" width="3" height="4" rx="0.5" fill="currentColor" fillOpacity="0.2"/>
    <rect x="57" y="12" width="3" height="4" rx="0.5" fill="currentColor" fillOpacity="0.2"/>
    <rect x="57" y="44" width="3" height="4" rx="0.5" fill="currentColor" fillOpacity="0.2"/>
    {/* handles */}
    <circle cx="27" cy="33" r="1.5"/>
    <circle cx="37" cy="33" r="1.5"/>
    {/* loft top compartment */}
    <line x1="4" y1="18" x2="60" y2="18"/>
    {/* bottom drawers */}
    <line x1="4"  y1="50" x2="32" y2="50"/>
    <line x1="32" y1="50" x2="60" y2="50"/>
    <circle cx="18" cy="55" r="0.8" fill="currentColor"/>
    <circle cx="46" cy="55" r="0.8" fill="currentColor"/>
  </svg>
);

const WardrobeWalkin = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* room outline */}
    <path d="M4 60V8h56v52"/>
    <line x1="4" y1="60" x2="60" y2="60"/>
    {/* left shelving unit */}
    <rect x="4" y="8" width="14" height="52"/>
    <line x1="4" y1="22" x2="18" y2="22"/>
    <line x1="4" y1="36" x2="18" y2="36"/>
    <line x1="4" y1="50" x2="18" y2="50"/>
    {/* right shelving unit */}
    <rect x="46" y="8" width="14" height="52"/>
    <line x1="46" y1="22" x2="60" y2="22"/>
    <line x1="46" y1="36" x2="60" y2="36"/>
    <line x1="46" y1="50" x2="60" y2="50"/>
    {/* centre island */}
    <rect x="22" y="36" width="20" height="18" rx="1"/>
    {/* hanging rod */}
    <line x1="6" y1="14" x2="16" y2="14" strokeWidth="2"/>
    <line x1="48" y1="14" x2="58" y2="14" strokeWidth="2"/>
    {/* clothes */}
    <path d="M8 14v8M10 14v8M12 14v8M14 14v8" strokeWidth="0.8"/>
    <path d="M50 14v8M52 14v8M54 14v8M56 14v8" strokeWidth="0.8"/>
  </svg>
);

const TVUnit = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* floor-to-ceiling unit */}
    <rect x="4" y="4" width="56" height="56" rx="1"/>
    {/* TV recess */}
    <rect x="16" y="18" width="32" height="20" rx="1"/>
    <rect x="17" y="19" width="30" height="18" rx="0.5" strokeDasharray="0"/>
    {/* TV screen cross */}
    <line x1="17" y1="19" x2="47" y2="37"/>
    <line x1="47" y1="19" x2="17" y2="37"/>
    {/* bottom cabinets */}
    <line x1="4"  y1="42" x2="60" y2="42"/>
    <line x1="22" y1="42" x2="22" y2="60"/>
    <line x1="42" y1="42" x2="42" y2="60"/>
    <circle cx="13" cy="51" r="0.8" fill="currentColor"/>
    <circle cx="32" cy="51" r="0.8" fill="currentColor"/>
    <circle cx="52" cy="51" r="0.8" fill="currentColor"/>
    {/* open shelves top */}
    <line x1="4"  y1="14" x2="16" y2="14"/>
    <line x1="48" y1="14" x2="60" y2="14"/>
    {/* side shelves */}
    <line x1="4"  y1="30" x2="16" y2="30"/>
    <line x1="48" y1="30" x2="60" y2="30"/>
  </svg>
);

const FalseCeiling = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* room cross section */}
    <path d="M8 56V16l24-8 24 8v40"/>
    <line x1="8" y1="56" x2="56" y2="56"/>
    {/* false ceiling layers */}
    <path d="M12 18h40" />
    <path d="M8 22h48"/>
    {/* cove profile */}
    <path d="M12 22 Q12 26 16 26 h32 Q44 26 44 22" strokeWidth="1"/>
    {/* LED strip */}
    <path d="M16 26h32" strokeDasharray="2 1" strokeWidth="1.5"/>
    {/* downlights */}
    <circle cx="22" cy="30" r="2"/>
    <circle cx="32" cy="30" r="2"/>
    <circle cx="42" cy="30" r="2"/>
    {/* glow lines */}
    <line x1="22" y1="32" x2="22" y2="36" strokeDasharray="1 1"/>
    <line x1="32" y1="32" x2="32" y2="36" strokeDasharray="1 1"/>
    <line x1="42" y1="32" x2="42" y2="36" strokeDasharray="1 1"/>
  </svg>
);

const FeatureWall = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* wall boundary */}
    <rect x="4" y="4" width="56" height="56" rx="1"/>
    {/* vertical fluted panels */}
    {[10, 16, 22, 28, 34, 40, 46, 52].map(x => (
      <line key={x} x1={x} y1="4" x2={x} y2="60"/>
    ))}
    {/* accent strip top + bottom */}
    <rect x="4" y="4"  width="56" height="4"  fill="currentColor" fillOpacity="0.08"/>
    <rect x="4" y="56" width="56" height="4"  fill="currentColor" fillOpacity="0.08"/>
    {/* LED profile */}
    <rect x="4" y="28" width="56" height="2" fill="currentColor" fillOpacity="0.15"/>
  </svg>
);

const BedPlatform = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* headboard */}
    <rect x="6" y="8" width="52" height="16" rx="3"/>
    <path d="M10 10 Q32 6 54 10" strokeWidth="1" strokeDasharray="2 1"/>
    {/* platform base */}
    <rect x="6" y="24" width="52" height="28" rx="2"/>
    {/* mattress */}
    <rect x="8" y="26" width="48" height="24" rx="2" strokeDasharray="2 2"/>
    {/* pillows */}
    <rect x="11" y="28" width="14" height="8" rx="3"/>
    <rect x="39" y="28" width="14" height="8" rx="3"/>
    {/* storage drawers */}
    <line x1="6"  y1="44" x2="58" y2="44"/>
    <line x1="32" y1="44" x2="32" y2="52"/>
    <circle cx="19" cy="48" r="0.8" fill="currentColor"/>
    <circle cx="45" cy="48" r="0.8" fill="currentColor"/>
    {/* legs */}
    <line x1="10" y1="52" x2="10" y2="58"/>
    <line x1="54" y1="52" x2="54" y2="58"/>
  </svg>
);

const StudyUnit = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* overhead cabinets */}
    <rect x="4" y="4" width="56" height="16" rx="1"/>
    <line x1="24" y1="4" x2="24" y2="20"/>
    <line x1="44" y1="4" x2="44" y2="20"/>
    <circle cx="14" cy="12" r="0.8" fill="currentColor"/>
    <circle cx="34" cy="12" r="0.8" fill="currentColor"/>
    <circle cx="54" cy="12" r="0.8" fill="currentColor"/>
    {/* desktop */}
    <rect x="4" y="36" width="56" height="4" rx="0.5"/>
    {/* monitor */}
    <rect x="22" y="22" width="20" height="13" rx="1"/>
    <line x1="32" y1="35" x2="32" y2="36"/>
    <line x1="28" y1="36" x2="36" y2="36"/>
    {/* keyboard */}
    <rect x="20" y="38" width="24" height="5" rx="1"/>
    {/* under-desk drawers */}
    <rect x="44" y="40" width="16" height="18" rx="1"/>
    <line x1="44" y1="49" x2="60" y2="49"/>
    <circle cx="52" cy="44.5" r="0.8" fill="currentColor"/>
    <circle cx="52" cy="53.5" r="0.8" fill="currentColor"/>
    {/* bookshelf side */}
    <rect x="4" y="40" width="14" height="18" rx="1"/>
    <line x1="4" y1="48" x2="18" y2="48"/>
    <line x1="4" y1="54" x2="18" y2="54"/>
  </svg>
);

const BathroomVanity = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* mirror cabinet */}
    <rect x="8" y="4" width="48" height="26" rx="1"/>
    <line x1="32" y1="4" x2="32" y2="30"/>
    <circle cx="28" cy="17" r="0.8" fill="currentColor"/>
    <circle cx="36" cy="17" r="0.8" fill="currentColor"/>
    {/* mirror reflection */}
    <rect x="10" y="6" width="20" height="22" rx="0.5" strokeDasharray="2 2"/>
    <rect x="34" y="6" width="20" height="22" rx="0.5" strokeDasharray="2 2"/>
    {/* countertop */}
    <rect x="6" y="34" width="52" height="4" rx="0.5"/>
    {/* basin */}
    <path d="M20 38 Q20 48 32 48 Q44 48 44 38"/>
    <path d="M22 38h20"/>
    {/* tap */}
    <line x1="30" y1="34" x2="30" y2="38"/>
    <line x1="34" y1="34" x2="34" y2="38"/>
    <path d="M28 34h8"/>
    {/* vanity cabinet */}
    <rect x="6" y="48" width="52" height="12" rx="1"/>
    <line x1="32" y1="48" x2="32" y2="60"/>
    <circle cx="19" cy="54" r="0.8" fill="currentColor"/>
    <circle cx="45" cy="54" r="0.8" fill="currentColor"/>
  </svg>
);

const FlooringTile = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* perspective floor grid */}
    <path d="M4 56 L32 4 L60 56 Z"/>
    {/* horizontal grout lines */}
    <path d="M10 48 L32 14 L54 48"/>
    <path d="M16 40 L32 22 L48 40"/>
    <path d="M22 32 L32 30 L42 32"/>
    {/* vertical grout lines */}
    <line x1="32" y1="4"  x2="4"  y2="56"/>
    <line x1="32" y1="4"  x2="60" y2="56"/>
    <line x1="21" y1="35" x2="32" y2="56"/>
    <line x1="43" y1="35" x2="32" y2="56"/>
    {/* tile texture dots */}
    <circle cx="18" cy="46" r="1" fill="currentColor" fillOpacity="0.3"/>
    <circle cx="32" cy="46" r="1" fill="currentColor" fillOpacity="0.3"/>
    <circle cx="46" cy="46" r="1" fill="currentColor" fillOpacity="0.3"/>
    <circle cx="25" cy="36" r="1" fill="currentColor" fillOpacity="0.3"/>
    <circle cx="39" cy="36" r="1" fill="currentColor" fillOpacity="0.3"/>
  </svg>
);

const FlooringLaminate = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* floor boards perspective */}
    <path d="M4 56 L8 16 L56 16 L60 56 Z"/>
    {/* board joints horizontal */}
    <line x1="6"  y1="28" x2="58" y2="28"/>
    <line x1="6"  y1="40" x2="58" y2="40"/>
    <line x1="5"  y1="52" x2="59" y2="52"/>
    {/* board joints vertical – offset rows */}
    <line x1="20" y1="16" x2="18" y2="28"/>
    <line x1="36" y1="16" x2="34" y2="28"/>
    <line x1="50" y1="16" x2="49" y2="28"/>
    <line x1="15" y1="28" x2="13" y2="40"/>
    <line x1="33" y1="28" x2="32" y2="40"/>
    <line x1="50" y1="28" x2="49" y2="40"/>
    <line x1="18" y1="40" x2="16" y2="52"/>
    <line x1="38" y1="40" x2="37" y2="52"/>
    <line x1="56" y1="40" x2="55" y2="52"/>
    {/* wood grain */}
    <path d="M10 20 Q18 18 26 20" strokeWidth="0.6" strokeDasharray="1 1"/>
    <path d="M28 20 Q36 22 44 20" strokeWidth="0.6" strokeDasharray="1 1"/>
  </svg>
);

/* ── Icon map ───────────────────────────────────────────────────── */
const ICON_MAP = {
  'kitchen-lshape':    KitchenLShape,
  'kitchen-straight':  KitchenStraight,
  'kitchen-island':    KitchenIsland,
  'wardrobe-sliding':  WardrobeSliding,
  'wardrobe-hinged':   WardrobeHinged,
  'wardrobe-walkin':   WardrobeWalkin,
  'tv-unit':           TVUnit,
  'false-ceiling':     FalseCeiling,
  'feature-wall':      FeatureWall,
  'bed-platform':      BedPlatform,
  'study-unit':        StudyUnit,
  'vanity-bathroom':   BathroomVanity,
  'flooring-tile':     FlooringTile,
  'flooring-laminate': FlooringLaminate,
};

/* Category fallbacks */
const CATEGORY_ICONS = {
  kitchen:  KitchenStraight,
  wardrobe: WardrobeHinged,
  living:   TVUnit,
  bedroom:  BedPlatform,
  bathroom: BathroomVanity,
  flooring: FlooringTile,
};

/**
 * ProductIcon component
 * @param {string}  productId   - from products.json
 * @param {string}  categoryId  - fallback lookup
 * @param {number}  size        - pixel size (default 48)
 * @param {string}  className   - extra classes
 * @param {string}  color       - stroke color (default "currentColor")
 */
export default function ProductIcon({ productId, categoryId, size = 48, className = '', color }) {
  const Icon = ICON_MAP[productId] || CATEGORY_ICONS[categoryId] || TVUnit;
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size, color: color || 'currentColor' }}>
      <Icon/>
    </span>
  );
}

export { ICON_MAP, CATEGORY_ICONS };
