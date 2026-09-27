/**
 * cartStore.js — Zustand store for the quotation cart.
 * Persisted to localStorage so a page refresh doesn't lose progress.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'iq_cart_v1';

const useCartStore = create(
  persist(
    (set, get) => ({
      // ── Cart items ────────────────────────────────────────────────────────
      items: [],       // Array of CartItem (see shape below)

      // ── Customer details (captured on cart page) ─────────────────────────
      customer: {
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        projectName: '',
      },

      // ── Discount / promo ─────────────────────────────────────────────────
      promoCode: '',          // raw string entered by user
      promoResult: null,      // result from resolvePromoCode()
      manualDiscountPercent: 0, // optional manual % override

      // ── Extra charges (can be overridden per-quote) ───────────────────────
      installationCharge: 0,
      transportCharge: 0,

      // ── Quotation metadata ────────────────────────────────────────────────
      quotationNumber: null,   // set when user hits "Generate Quote"
      quotationDate: null,

      // ──────────────────────────────────────────────────────────────────────
      //  ACTIONS
      // ──────────────────────────────────────────────────────────────────────

      /**
       * Add a new item to the cart.
       * CartItem shape:
       * {
       *   id: string (uuid-ish),
       *   product: Object,
       *   tier: Object,
       *   dimensions: { length: number, width: number },
       *   quantity: number,
       *   selectedAddons: Array<Object>,
       *   roomLabel: string   (e.g. "Master Bedroom")
       * }
       */
      addItem: (item) =>
        set((state) => ({
          items: [
            ...state.items,
            {
              ...item,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            },
          ],
        })),

      /** Replace an existing cart item by id */
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),

      /** Remove an item from the cart */
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      /** Clear all cart items */
      clearCart: () =>
        set({
          items: [],
          promoCode: '',
          promoResult: null,
          quotationNumber: null,
          quotationDate: null,
        }),

      /** Update customer details (partial) */
      setCustomer: (fields) =>
        set((state) => ({ customer: { ...state.customer, ...fields } }),
      ),

      /** Store the resolved promo code result */
      setPromo: (code, result) =>
        set({ promoCode: code, promoResult: result }),

      /** Clear the applied promo */
      clearPromo: () =>
        set({ promoCode: '', promoResult: null }),

      setManualDiscountPercent: (pct) =>
        set({ manualDiscountPercent: pct }),

      setInstallationCharge: (val) =>
        set({ installationCharge: val }),

      setTransportCharge: (val) =>
        set({ transportCharge: val }),

      /** Stamp the quotation with a number and date */
      generateQuotationNumber: () => {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const num = `IQ-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
        set({ quotationNumber: num, quotationDate: now.toISOString() });
        return num;
      },

      // ── Derived helpers ───────────────────────────────────────────────────

      /** Total number of line items */
      itemCount: () => get().items.length,

      /** Resolved flat discount amount from promo or manual % */
      resolvedDiscountAmount: (subtotal) => {
        const { promoResult, manualDiscountPercent } = get();
        if (promoResult?.valid) return promoResult.discountAmount;
        if (manualDiscountPercent > 0) return (subtotal * manualDiscountPercent) / 100;
        return 0;
      },
    }),

    {
      name: STORAGE_KEY,
      // Only persist essential fields; skip derived/transient state
      partialize: (state) => ({
        items: state.items,
        customer: state.customer,
        promoCode: state.promoCode,
        promoResult: state.promoResult,
        manualDiscountPercent: state.manualDiscountPercent,
        installationCharge: state.installationCharge,
        transportCharge: state.transportCharge,
        quotationNumber: state.quotationNumber,
        quotationDate: state.quotationDate,
      }),
    }
  )
);

export default useCartStore;
