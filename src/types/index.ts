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
  /** Which performance chart to show when "Check performance" is clicked: "1" = Bot1, "2" = Bot2, "3" = Bot3 */
  performanceBot?: "1" | "2" | "3"
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
