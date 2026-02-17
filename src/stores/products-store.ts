import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Product } from "@/types"
import { products as seedProducts } from "@/data/products"

interface ProductsStore {
  products: Product[]
  getBySlug: (slug: string) => Product | undefined
  getById: (id: string) => Product | undefined
  getByCategory: (categoryId: string) => Product[]
  addProduct: (product: Omit<Product, "id">) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteProduct: (id: string) => void
}

export const useProductsStore = create<ProductsStore>()(
  persist(
    (set, get) => ({
      products: seedProducts,
      getBySlug: (slug) => get().products.find((p) => p.slug === slug),
      getById: (id) => get().products.find((p) => p.id === id),
      getByCategory: (categoryId) => get().products.filter((p) => p.categoryId === categoryId),
      addProduct: (product) => {
        const id = `p-${Date.now()}`
        const slug =
          product.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") + `-${id.slice(-6)}`
        set((state) => ({
          products: [...state.products, { ...product, id, slug }],
        }))
      },
      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      deleteProduct: (id) =>
        set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
    }),
    { name: "alphaforge-products" }
  )
)
