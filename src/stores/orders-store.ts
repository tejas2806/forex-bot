import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Order } from "@/types"
import {
  DEFAULT_ADMIN_EMAIL,
  getOrders,
  getOrdersForUser,
  subscribeOrders as firestoreSubscribeOrders,
  addOrder as firestoreAddOrder,
  updateOrderStatus as firestoreUpdateOrderStatus,
} from "@/lib/firestore"

let ordersRealtimeUnsub: (() => void) | null = null

interface OrdersStore {
  orders: Order[]
  ordersLoaded: boolean
  loadOrders: (adminEmail?: string) => Promise<void>
  startOrdersRealtime: (adminEmail?: string) => void
  stopOrdersRealtime: () => void
  /** Load orders from new schema path: admins/{adminId}/users/{userEmail}/orders (for "My orders" page). */
  loadOrdersForUser: (adminEmail?: string, userEmail?: string) => Promise<void>
  addOrder: (order: Omit<Order, "id">) => Promise<Order>
  getOrdersByUser: (userId: string) => Order[]
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>
  getOrder: (orderId: string) => Order | undefined
}

export const useOrdersStore = create<OrdersStore>()(
  persist(
    (set, get) => ({
      orders: [],
      ordersLoaded: false,

      loadOrders: async (adminEmail = DEFAULT_ADMIN_EMAIL) => {
        try {
          const list = await getOrders(adminEmail)
          set({ orders: list, ordersLoaded: true })
        } catch {
          set({ orders: [], ordersLoaded: true })
        }
      },

      startOrdersRealtime: (adminEmail = DEFAULT_ADMIN_EMAIL) => {
        if (ordersRealtimeUnsub) return
        set({ ordersLoaded: false })
        ordersRealtimeUnsub = firestoreSubscribeOrders(
          adminEmail,
          (orders) => set({ orders, ordersLoaded: true }),
          () => set({ ordersLoaded: true })
        )
      },

      stopOrdersRealtime: () => {
        if (!ordersRealtimeUnsub) return
        ordersRealtimeUnsub()
        ordersRealtimeUnsub = null
      },

      loadOrdersForUser: async (
        adminEmail = DEFAULT_ADMIN_EMAIL,
        userEmail?: string
      ) => {
        if (!userEmail) {
          set({ orders: [], ordersLoaded: true })
          return
        }
        try {
          const list = await getOrdersForUser(adminEmail, userEmail)
          set({ orders: list, ordersLoaded: true })
        } catch {
          set({ orders: [], ordersLoaded: true })
        }
      },

      addOrder: async (order) => {
        const newOrder = await firestoreAddOrder(DEFAULT_ADMIN_EMAIL, order)
        set((state) => ({ orders: [newOrder, ...state.orders] }))
        return newOrder
      },

      getOrdersByUser: (userId) =>
        get().orders.filter((o) => o.userId === userId),

      updateOrderStatus: async (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status } : o
          ),
        }))
        await firestoreUpdateOrderStatus(DEFAULT_ADMIN_EMAIL, orderId, status)
      },

      getOrder: (orderId) => get().orders.find((o) => o.id === orderId),
    }),
    { name: "nexus-orders", partialize: (s) => ({ orders: s.orders }) }
  )
)
