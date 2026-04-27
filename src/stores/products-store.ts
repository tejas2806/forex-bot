import { create } from "zustand"
import type { Product } from "@/types"
import { auth } from "@/lib/firebase"
import { products as seedProducts } from "@/data/products"
import {
  DEFAULT_ADMIN_EMAIL,
  getProducts,
  seedProductsIfEmpty,
  addProduct as firestoreAddProduct,
  updateProduct as firestoreUpdateProduct,
  deleteProduct as firestoreDeleteProduct,
} from "@/lib/firestore"

interface ProductsStore {
  products: Product[]
  productsLoaded: boolean
  loadProducts: (adminEmail?: string) => Promise<void>
  getBySlug: (slug: string) => Product | undefined
  getById: (id: string) => Product | undefined
  getByCategory: (categoryId: string) => Product[]
  addProduct: (product: Omit<Product, "id">) => Promise<void>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
}

export const useProductsStore = create<ProductsStore>()((set, get) => ({
  products: [],
  productsLoaded: false,

  loadProducts: async (adminEmail = DEFAULT_ADMIN_EMAIL) => {
    try {
      const list = await getProducts(adminEmail)
      set({ products: list, productsLoaded: true })

      // Seed is optional; failures must not wipe a successful read or surface as uncaught rejections.
      const signedIn = auth.currentUser?.email?.toLowerCase() ?? ""
      if (
        list.length === 0 &&
        signedIn &&
        signedIn === adminEmail.toLowerCase()
      ) {
        try {
          const seeded = await seedProductsIfEmpty(adminEmail, seedProducts)
          set({ products: seeded })
        } catch (seedErr) {
          console.error("seedProductsIfEmpty failed (check Firestore rules + deploy)", seedErr)
        }
      }
    } catch (e) {
      console.error("getProducts failed (deploy firestore.rules: firebase deploy --only firestore:rules)", e)
      set({ products: [], productsLoaded: true })
    }
  },

  getBySlug: (slug) => get().products.find((p) => p.slug === slug),
  getById: (id) => get().products.find((p) => p.id === id),
  getByCategory: (categoryId) => get().products.filter((p) => p.categoryId === categoryId),

  addProduct: async (product) => {
    const slug =
      product.slug ||
      product.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") + `-${Date.now().toString(36)}`
    const added = await firestoreAddProduct(DEFAULT_ADMIN_EMAIL, { ...product, slug } as Omit<Product, "id">)
    set((state) => ({ products: [...state.products, added] }))
  },

  updateProduct: async (id, updates) => {
    const product = get().products.find((p) => p.id === id)
    const slug = product?.slug ?? id
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))
    await firestoreUpdateProduct(DEFAULT_ADMIN_EMAIL, slug, updates)
  },

  deleteProduct: async (id) => {
    const product = get().products.find((p) => p.id === id)
    const slug = product?.slug ?? id
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }))
    await firestoreDeleteProduct(DEFAULT_ADMIN_EMAIL, slug)
  },
}))
