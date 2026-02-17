export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  image: string
  category: string
  categoryId: string
  inStock: boolean
  featured?: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  productCount: number
}

export interface User {
  id: string
  email: string
  name: string
  role: "customer" | "admin"
  avatar?: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export type PaymentMethod = "card" | "paypal" | "cod"

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  total: number
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled"
  paymentMethod: PaymentMethod
  createdAt: string
  shippingAddress: string
}
