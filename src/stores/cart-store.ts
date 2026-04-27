import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Product, CartItem, ProductPlan, ProductPlanId } from "@/types"

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, quantity?: number, plan?: ProductPlan) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  updateItemPlan: (cartItemId: string, planId: ProductPlanId) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1, plan) => {
        const cartItemId = `${product.id}:${plan?.id ?? "base"}`
        const unitPrice = plan?.price ?? product.price
        set((state) => {
          const existing = state.items.find((i) => i.id === cartItemId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === cartItemId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              {
                id: cartItemId,
                product,
                quantity,
                planId: plan?.id,
                planLabel: plan?.label,
                unitPrice,
              },
            ],
          }
        })
      },
      removeItem: (cartItemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== cartItemId),
        })),
      updateQuantity: (cartItemId, quantity) => {
        if (quantity < 1) return get().removeItem(cartItemId)
        set((state) => ({
          items: state.items.map((i) =>
            i.id === cartItemId ? { ...i, quantity } : i
          ),
        }))
      },
      updateItemPlan: (cartItemId, planId) => {
        set((state) => {
          const source = state.items.find((i) => i.id === cartItemId)
          if (!source) return state

          const plan = source.product.plans?.find((p) => p.id === planId)
          if (!plan) return state

          const nextId = `${source.product.id}:${plan.id}`
          if (nextId === cartItemId) return state

          const target = state.items.find((i) => i.id === nextId)
          const remaining = state.items.filter((i) => i.id !== cartItemId && i.id !== nextId)

          const updated: CartItem = {
            ...source,
            id: nextId,
            planId: plan.id,
            planLabel: plan.label,
            unitPrice: plan.price,
            quantity: source.quantity + (target?.quantity ?? 0),
          }

          return { items: [...remaining, updated] }
        })
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((acc, i) => acc + (i.unitPrice ?? i.product.price) * i.quantity, 0),
    }),
    { name: "nexus-cart" }
  )
)
