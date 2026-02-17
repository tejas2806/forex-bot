import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/types"

const DEMO_ADMIN: User = {
  id: "admin-1",
  email: "admin@alphaforge.io",
  name: "Admin",
  role: "admin",
}

const DEMO_USERS: User[] = [
  DEMO_ADMIN,
  {
    id: "user-1",
    email: "trader@example.com",
    name: "Alex Trader",
    role: "customer",
  },
]

interface AuthStore {
  user: User | null
  login: (email: string, password: string) => boolean
  register: (email: string, name: string, password: string) => boolean
  logout: () => void
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      login: (email, _password) => {
        const found = DEMO_USERS.find((u) => u.email === email)
        if (found) {
          set({ user: found })
          return true
        }
        if (email === "admin@alphaforge.io") {
          set({ user: DEMO_ADMIN })
          return true
        }
        return false
      },
      register: (email, name, _password) => {
        const exists = DEMO_USERS.some((u) => u.email === email)
        if (exists) return false
        set({
          user: {
            id: `user-${Date.now()}`,
            email,
            name,
            role: "customer",
          },
        })
        return true
      },
      logout: () => set({ user: null }),
      isAdmin: () => get().user?.role === "admin",
    }),
    { name: "nexus-auth" }
  )
)
