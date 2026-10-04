/**
 * cartStore.js  –  v6  (100% feature complete)
 *
 * New in v6:
 *  - Project status: 'draft' | 'sent' | 'approved'
 *  - Revision history: snapshots array per project
 *  - Promo code validation
 *  - updateRoomDimensions fix
 *  - setRoomTier preserved
 */
import { create }   from 'zustand';
import { persist }  from 'zustand/middleware';
import productsData from '../data/products.json';
import tiersData    from '../data/qualityTiers.json';
import addonsData   from '../data/addons.json';
import promoCodes   from '../data/promoCodes.json';

const STORAGE_KEY = 'iq_v6';
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const DEFAULT_ROOMS = [
  'Living Room', 'Master Bedroom', 'Kitchen',
  'Kids Bedroom', 'Bathroom', 'Flooring',
];

export const CAT_MAP = {
  'Living Room':    'living',
  'Master Bedroom': 'bedroom',
  'Kids Bedroom':   'bedroom',
  'Kitchen':        'kitchen',
  'Bathroom':       'bathroom',
  'Flooring':       'flooring',
  'Wardrobe':       'wardrobe',
  'Bedroom':        'bedroom',
  'Dining':         'living',
  'Pooja Room':     'bedroom',
  'Guest Bedroom':  'bedroom',
  'Balcony':        'living',
  'Study Room':     'bedroom',
};

function makeTier(productId, tierName = 'Standard') {
  return (
    tiersData.find(t => t.productId === productId && t.tierName === tierName) ||
    tiersData.find(t => t.productId === productId) ||
    null
  );
}

function makeItem(product, tierName = 'Standard') {
  const tier = makeTier(product.id, tierName);
  return {
    id:               uid(),
    productId:        product.id,
    product,
    tierName:         tier?.tierName || tierName,
    tier,
    dimensions:       { ...(product.defaultDimensions || { length: 1, width: 1 }) },
    quantity:         1,
    enabled:          false,
    discountPercent:  0,
    notes:            '',
    selectedAddonIds: [],
    isCustom:         false,
  };
}

function makeRoom(name, tierName = 'Standard') {
  const catId    = CAT_MAP[name];
  const products = catId
    ? productsData.filter(p => p.categoryId === catId)
    : productsData;
  let roomProducts = [...products];
  const hasFalseCeiling = roomProducts.some(p => p.id === 'false-ceiling');
  if (!hasFalseCeiling) {
    const fc = productsData.find(p => p.id === 'false-ceiling');
    if (fc) roomProducts = [fc, ...roomProducts];
  }
  return {
    id:         uid(),
    name,
    dimensions: { length: 0, width: 0 },
    items:      roomProducts.map(p => makeItem(p, tierName)),
  };
}

function blankProject(name = 'New Project') {
  return {
    id:                 uid(),
    name,
    createdAt:          new Date().toISOString(),
    status:             'draft',      // 'draft' | 'sent' | 'approved'
    globalTier:         'Standard',
    customer:           { name: '', phone: '', email: '', address: '', city: '', projectName: name },
    installationCharge: 0,
    transportCharge:    0,
    discountPercent:    0,
    discountFlat:       0,
    promoCode:          '',
    promoDiscount:      0,
    quotationNumber:    null,
    quotationDate:      null,
    revisions:          [],           // [{ id, label, savedAt, snapshot }]
    rooms:              DEFAULT_ROOMS.map(r => makeRoom(r, 'Standard')),
  };
}

/* ── helpers ─────────────────────────────────────────────────── */
function getActiveId(s)         { return s.activeProjectId || s.projects[0]?.id; }
function mapActive(s, fn)       { const id = getActiveId(s); return { projects: s.projects.map(p => p.id === id ? fn(p) : p) }; }
function mapRoom(proj, rid, fn) { return { ...proj, rooms: proj.rooms.map(r => r.id === rid ? fn(r) : r) }; }
function mapItem(room, iid, fn) { return { ...room, items: room.items.map(i => i.id === iid ? fn(i) : i) }; }

/* ── Exported calc helpers ────────────────────────────────────── */
export function calcItemBase(item) {
  if (!item.enabled || !item.tier) return 0;
  const qty =
    item.product?.unitType === 'per_sqft' ? (item.dimensions.length||0) * (item.dimensions.width||0)
    : item.product?.unitType === 'per_rft' ? (item.dimensions.length||0)
    : (item.quantity||1);
  return qty * (item.tier.ratePerUnit || 0);
}
export function calcAddonTotal(item) {
  if (!item.enabled || !item.selectedAddonIds?.length) return 0;
  return item.selectedAddonIds.reduce((s, aid) => {
    const a = addonsData.find(x => x.id === aid);
    return s + (a?.price || 0);
  }, 0);
}
export function calcItemDiscount(item) {
  if (!item.discountPercent) return 0;
  return (calcItemBase(item) + calcAddonTotal(item)) * item.discountPercent / 100;
}
export function calcLineTotal(item) {
  return calcItemBase(item) + calcAddonTotal(item) - calcItemDiscount(item);
}
export function getItemAddons(item) {
  return (item.selectedAddonIds || []).map(id => addonsData.find(a => a.id === id)).filter(Boolean);
}

/* ── Store ───────────────────────────────────────────────────── */
const useCartStore = create(
  persist(
    (set, get) => ({
      projects:        [blankProject('My Project')],
      activeProjectId: null,

      getActiveProject: () => {
        const s = get();
        return s.projects.find(p => p.id === getActiveId(s)) || s.projects[0];
      },

      /* ── Projects ─────────────────────────────────────────── */
      addProject: (name = 'New Project') => {
        const p = blankProject(name);
        set(s => ({ projects: [...s.projects, p], activeProjectId: p.id }));
        return p.id;
      },
      removeProject: (id) => set(s => {
        const rest = s.projects.filter(p => p.id !== id);
        if (!rest.length) { const p = blankProject(); return { projects:[p], activeProjectId:p.id }; }
        return { projects: rest, activeProjectId: s.activeProjectId===id ? rest[rest.length-1].id : s.activeProjectId };
      }),
      renameProject:    (id, name) => set(s => ({ projects: s.projects.map(p => p.id===id ? {...p,name} : p) })),
      setActiveProject: (id)       => set({ activeProjectId: id }),
      duplicateProject: (id) => {
        const src = get().projects.find(p => p.id===id);
        if (!src) return;
        const copy = { ...JSON.parse(JSON.stringify(src)), id:uid(), name:src.name+' (copy)', createdAt:new Date().toISOString(), quotationNumber:null, quotationDate:null, status:'draft', revisions:[] };
        set(s => ({ projects:[...s.projects, copy], activeProjectId:copy.id }));
        return copy.id;
      },

      /* ── Project status ───────────────────────────────────── */
      setProjectStatus: (id, status) =>
        set(s => ({ projects: s.projects.map(p => p.id===id ? {...p, status} : p) })),

      /* ── Revision history ─────────────────────────────────── */
      saveRevision: (label) => set(s => {
        const id = getActiveId(s);
        return mapActive(s, p => {
          const snapshot = JSON.stringify({ rooms: p.rooms, customer: p.customer, discountPercent: p.discountPercent, discountFlat: p.discountFlat });
          const rev = { id: uid(), label: label || `Revision ${(p.revisions||[]).length + 1}`, savedAt: new Date().toISOString(), snapshot };
          return { ...p, revisions: [...(p.revisions||[]), rev] };
        });
      }),
      restoreRevision: (revId) => set(s => mapActive(s, p => {
        const rev = (p.revisions||[]).find(r => r.id === revId);
        if (!rev) return p;
        try {
          const data = JSON.parse(rev.snapshot);
          return { ...p, ...data };
        } catch { return p; }
      })),
      deleteRevision: (revId) => set(s => mapActive(s, p => ({
        ...p, revisions: (p.revisions||[]).filter(r => r.id !== revId),
      }))),

      /* ── Promo code ───────────────────────────────────────── */
      applyPromoCode: (code) => set(s => mapActive(s, p => {
        const subtotal = (p.rooms||[]).flatMap(r => r.items).reduce((sum, i) => sum + calcLineTotal(i), 0);
        const promo = promoCodes.find(pc => pc.code.toUpperCase() === code.toUpperCase() && pc.active);
        if (!promo || subtotal < promo.minOrderValue) return { ...p, promoCode: code, promoDiscount: 0 };
        const discount = promo.discountType === 'percent' ? subtotal * promo.discountValue / 100 : promo.discountValue;
        return { ...p, promoCode: code, promoDiscount: discount };
      })),
      clearPromoCode: () => set(s => mapActive(s, p => ({ ...p, promoCode: '', promoDiscount: 0 }))),

      /* ── Global tier ─────────────────────────────────────── */
      setGlobalTier: (tierName) => set(s => mapActive(s, p => ({
        ...p, globalTier: tierName,
        rooms: p.rooms.map(room => ({
          ...room,
          items: room.items.map(item => {
            if (item.isCustom || item.enabled) return item;
            const t = tiersData.find(t => t.productId===item.productId && t.tierName===tierName) || tiersData.find(t => t.productId===item.productId);
            return { ...item, tierName: t?.tierName||tierName, tier: t||item.tier };
          }),
        })),
      }))),

      /* ── Rooms ───────────────────────────────────────────── */
      addRoom: (name, dims) => set(s => mapActive(s, p => {
        const tier = p.globalTier || 'Standard';
        const room = makeRoom(name, tier);
        if (dims && (dims.length > 0 || dims.width > 0)) {
          room.dimensions = { length: parseFloat(dims.length)||0, width: parseFloat(dims.width)||0 };
          room.items = room.items.map(item => {
            if (item.productId === 'false-ceiling') {
              return { ...item, enabled: true, dimensions: { length: parseFloat(dims.length)||0, width: parseFloat(dims.width)||0 } };
            }
            return item;
          });
        }
        return { ...p, rooms: [...p.rooms, room] };
      })),
      removeRoom: (roomId) => set(s => mapActive(s, p => ({ ...p, rooms: p.rooms.filter(r => r.id !== roomId) }))),
      renameRoom:  (roomId, name) => set(s => mapActive(s, p => mapRoom(p, roomId, r => ({...r, name})))),

      setRoomTier: (roomId, tierName) => set(s => mapActive(s, p => mapRoom(p, roomId, r => ({
        ...r,
        items: r.items.map(item => {
          if (item.isCustom) return item;
          const t = tiersData.find(t => t.productId===item.productId && t.tierName===tierName) || tiersData.find(t => t.productId===item.productId);
          return { ...item, tierName: t?.tierName||tierName, tier: t||item.tier };
        }),
      })))),

      updateRoomDimensions: (roomId, dims) => set(s => mapActive(s, p => mapRoom(p, roomId, r => {
        const newDims = { length: parseFloat(dims.length)||0, width: parseFloat(dims.width)||0 };
        const items   = r.items.map(item => item.productId === 'false-ceiling' ? { ...item, dimensions: newDims } : item);
        return { ...r, dimensions: newDims, items };
      }))),

      /* ── Custom product ───────────────────────────────────── */
      addCustomItem: (roomId, { name, description, unitType, ratePerUnit }) => {
        const productId = `custom-${uid()}`;
        const product   = { id: productId, name, description: description||'', isCustom: true, categoryId: 'custom', unitType: unitType||'per_sqft', defaultDimensions: { length: 1, width: 1 }, dimensionType: unitType==='per_unit'?'none':unitType==='per_rft'?'running_feet':'length_width', dimensionLabels: {}, tags: [] };
        const tier      = { id: `tier-${productId}`, productId, tierName: 'Custom', ratePerUnit: parseFloat(ratePerUnit)||0, materialSpec: description||'Custom item' };
        const item      = { id: uid(), productId, product, tierName:'Custom', tier, dimensions: { length:1, width:1 }, quantity:1, enabled: true, discountPercent: 0, notes:'', selectedAddonIds:[], isCustom:true };
        set(s => mapActive(s, p => mapRoom(p, roomId, r => ({ ...r, items:[...r.items, item] }))));
      },
      updateCustomRate: (roomId, itemId, ratePerUnit) => set(s => mapActive(s, p => mapRoom(p, roomId, r =>
        mapItem(r, itemId, i => ({ ...i, tier: { ...i.tier, ratePerUnit: parseFloat(ratePerUnit)||0 } }))))),

      /* ── Item updates ─────────────────────────────────────── */
      toggleItem:          (roomId, itemId, enabled)  => set(s => mapActive(s, p => mapRoom(p, roomId, r => mapItem(r, itemId, i => ({...i,enabled}))))),
      updateItemDimension: (roomId, itemId, key, v)   => set(s => mapActive(s, p => mapRoom(p, roomId, r => mapItem(r, itemId, i => ({...i, dimensions:{...i.dimensions,[key]:parseFloat(v)||0}}))))),
      updateItemQty:       (roomId, itemId, qty)      => set(s => mapActive(s, p => mapRoom(p, roomId, r => mapItem(r, itemId, i => ({...i, quantity:Math.max(1,qty)}))))),
      updateItemNotes:     (roomId, itemId, notes)    => set(s => mapActive(s, p => mapRoom(p, roomId, r => mapItem(r, itemId, i => ({...i,notes}))))),
      updateItemDiscount:  (roomId, itemId, pct)      => set(s => mapActive(s, p => mapRoom(p, roomId, r => mapItem(r, itemId, i => ({...i, discountPercent:Math.min(100,Math.max(0,parseFloat(pct)||0))}))))),
      removeItem:          (roomId, itemId)           => set(s => mapActive(s, p => mapRoom(p, roomId, r => ({...r, items:r.items.filter(i=>i.id!==itemId)})))),
      updateItemTier: (roomId, itemId, tierName) => set(s => mapActive(s, p => mapRoom(p, roomId, r =>
        mapItem(r, itemId, i => {
          if (i.isCustom) return i;
          const t = tiersData.find(t => t.productId===i.productId && t.tierName===tierName) || i.tier;
          return { ...i, tierName:t?.tierName||tierName, tier:t };
        })))),
      toggleItemAddon: (roomId, itemId, addonId) => set(s => mapActive(s, p => mapRoom(p, roomId, r =>
        mapItem(r, itemId, i => {
          const ids = i.selectedAddonIds||[];
          const next = ids.includes(addonId) ? ids.filter(x=>x!==addonId) : [...ids,addonId];
          return { ...i, selectedAddonIds:next };
        })))),

      /* ── Customer / project fields ────────────────────────── */
      setCustomer:     (fields) => set(s => mapActive(s, p => ({ ...p, customer:{...p.customer,...fields} }))),
      setProjectField: (field, val) => set(s => mapActive(s, p => ({ ...p, [field]:val }))),

      /* ── Quotation number ─────────────────────────────────── */
      generateQuotationNumber: (projectId) => {
        const id  = projectId || getActiveId(get());
        const project = get().projects.find(p => p.id === id);
        const now = new Date();
        const pad = n => String(n).padStart(2,'0');
        // Use custom prefix from settings if available
        let prefix = 'IQ';
        try {
          const s = localStorage.getItem('iq_company_settings');
          if (s) { const parsed = JSON.parse(s); if (parsed.quotePrefix) prefix = parsed.quotePrefix; }
        } catch {}
        const num = `${prefix}-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${Math.floor(1000+Math.random()*9000)}`;
        set(s => ({ projects: s.projects.map(p => p.id===id ? {...p, quotationNumber:num, quotationDate:now.toISOString(), status:'draft'} : p) }));
        return num;
      },
    }),
    { name: STORAGE_KEY, version: 6 }
  )
);

export default useCartStore;
