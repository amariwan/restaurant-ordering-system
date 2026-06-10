import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export interface CartItem {
  menuItemId: number;
  menuItemName: string;
  menuItemNameKu: string;
  price: number;
  quantity: number;
  note?: string;
}

interface CartState {
  items: CartItem[];
  tableId: number | null;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, delta: number) => void;
  updateNote: (menuItemId: number, note: string) => void;
  setTableId: (id: number | null) => void;
  clear: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.menuItemId === item.menuItemId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.menuItemId === item.menuItemId
                  ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: item.quantity ?? 1 }],
          };
        }),

      removeItem: (menuItemId) =>
        set((state) => ({ items: state.items.filter((i) => i.menuItemId !== menuItemId) })),

      updateQuantity: (menuItemId, delta) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.menuItemId === menuItemId
              ? { ...i, quantity: Math.max(1, i.quantity + delta) }
              : i
          ),
        })),

      updateNote: (menuItemId, note) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.menuItemId === menuItemId
              ? { ...i, note }
              : i
          ),
        })),

      setTableId: (id) => set({ tableId: id }),

      clear: () => set({ items: [], tableId: null }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'restaurant_cart',
    }
  )
);
