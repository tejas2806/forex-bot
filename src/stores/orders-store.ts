import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Order } from "@/types"

interface OrdersStore {
  orders: Order[]
  addOrder: (order: Omit<Order, "id">) => void
  getOrdersByUser: (userId: string) => Order[]
  updateOrderStatus: (orderId: string, status: Order["status"]) => void
  getOrder: (orderId: string) => Order | undefined
}

export const useOrdersStore = create<OrdersStore>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (order) => {
        const newOrder: Order = {
          ...order,
          id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        }
        set((state) => ({ orders: [newOrder, ...state.orders] }))
      },
      getOrdersByUser: (userId) =>
        get().orders.filter((o) => o.userId === userId),
      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status } : o
          ),
        })),
      getOrder: (orderId) => get().orders.find((o) => o.id === orderId),
    }),
    { name: "nexus-orders" }
  )
)
