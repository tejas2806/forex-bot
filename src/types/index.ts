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
  /** Who ordered – stored in orders collection */
  userEmail?: string
  userName?: string
  items: CartItem[]
  total: number
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled"
  paymentMethod: PaymentMethod
  createdAt: string
  shippingAddress: string
}

/** License for a purchased bot (executable). Validated by Python/GUI app via license key. */
export interface License {
  id: string
  licenseKey: string
  userId: string
  userEmail: string
  productId: string
  productSlug: string
  productName: string
  orderId: string
  status: "active" | "revoked" | "expired"
  createdAt: string
  /** ISO date; optional expiry for subscriptions */
  expiresAt?: string
  /** Optional: URL to download the bot executable (Python + GUI) */
  downloadUrl?: string
  /** Hardware binding: first device that activated this license */
  deviceId?: string
  deviceInfo?: unknown
  firstActivatedAt?: string
}
