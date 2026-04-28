import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { DEFAULT_ADMIN_EMAIL, syncUserInfo } from "@/lib/firestore"
import type { User } from "@/types"

function mapFirebaseUser(fb: FirebaseUser): User {
  const email = fb.email ?? ""
  const name = fb.displayName ?? email.split("@")[0] ?? "User"
  const role = email === "admin@alphaforge.io" ? "admin" : "customer"
  return {
    id: fb.uid,
    email,
    name,
    role,
    avatar: fb.photoURL ?? undefined,
  }
}

interface AuthStore {
  user: User | null
  authReady: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAdmin: () => boolean
  initAuthListener: () => () => void
}

function shouldUseRedirectFallback(code: string) {
  return (
    code === "auth/popup-blocked" ||
    code === "auth/popup-closed-by-user" ||
    code === "auth/network-request-failed" ||
    code === "auth/web-storage-unsupported" ||
    code === "auth/cancelled-popup-request"
  )
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      authReady: false,

      initAuthListener: () => {
        // Handle users returning from Google redirect flow.
        void getRedirectResult(auth)
          .then((result) => {
            if (!result?.user) return
            const mapped = mapFirebaseUser(result.user)
            set({ user: mapped })
            return syncUserInfo(DEFAULT_ADMIN_EMAIL, mapped)
          })
          .catch((err) => {
            console.warn("getRedirectResult failed", err)
          })

        const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
          const user = fbUser ? mapFirebaseUser(fbUser) : null
          set({ authReady: true, user })
          if (user) {
            void syncUserInfo(DEFAULT_ADMIN_EMAIL, user).catch((err) =>
              console.warn("syncUserInfo failed", err)
            )
          }
        })
        return unsubscribe
      },

      login: async (email, password) => {
        const { user } = await signInWithEmailAndPassword(auth, email, password)
        const mapped = mapFirebaseUser(user)
        set({ user: mapped })
        await syncUserInfo(DEFAULT_ADMIN_EMAIL, mapped)
      },

      loginWithGoogle: async () => {
        const provider = new GoogleAuthProvider()
        try {
          const { user } = await signInWithPopup(auth, provider)
          const mapped = mapFirebaseUser(user)
          set({ user: mapped })
          await syncUserInfo(DEFAULT_ADMIN_EMAIL, mapped)
        } catch (err: unknown) {
          const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : ""
          if (!shouldUseRedirectFallback(code)) throw err
          await signInWithRedirect(auth, provider)
        }
      },

      register: async (email, name, password) => {
        const { user } = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(user, { displayName: name })
        const mapped = mapFirebaseUser({ ...user, displayName: name })
        set({ user: mapped })
        await syncUserInfo(DEFAULT_ADMIN_EMAIL, mapped)
      },

      logout: async () => {
        await signOut(auth)
        set({ user: null })
      },

      isAdmin: () => get().user?.role === "admin",
    }),
    { name: "nexus-auth", partialize: (s) => ({ user: s.user }) }
  )
)
