import { create } from "zustand"
import type { License } from "@/types"
import { DEFAULT_ADMIN_EMAIL, getLicensesByUser, getLicensesByOrder } from "@/lib/firestore"

interface LicensesStore {
  licenses: License[]
  licensesLoaded: boolean
  loadLicensesForUser: (userId: string, adminEmail?: string) => Promise<void>
  getLicensesByOrderId: (orderId: string) => License[]
  getOrder: (orderId: string) => Promise<License[]>
}

export const useLicensesStore = create<LicensesStore>((set, get) => ({
  licenses: [],
  licensesLoaded: false,

  loadLicensesForUser: async (userId: string, adminEmail = DEFAULT_ADMIN_EMAIL) => {
    try {
      const list = await getLicensesByUser(adminEmail, userId)
      set({ licenses: list, licensesLoaded: true })
    } catch {
      set({ licenses: [], licensesLoaded: true })
    }
  },

  getLicensesByOrderId: (orderId: string) =>
    get().licenses.filter((l) => l.orderId === orderId),

  getOrder: async (orderId: string) => {
    return getLicensesByOrder(DEFAULT_ADMIN_EMAIL, orderId)
  },
}))
