import type { Product, Category } from "@/types"

export const categories: Category[] = [
  { id: "1", name: "Trading Bots", slug: "trading-bots", productCount: 3 },
]

const chartImg = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=400&fit=crop"
const screenImg = "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=400&fit=crop"
const tradeImg = "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=400&fit=crop"

export const products: Product[] = [
  {
    id: "aegis-fx",
    name: "Aegis FX",
    slug: "aegis-fx",
    description:
      "Adaptive forex trading bot built for stable execution with dynamic risk controls and disciplined entries.",
    price: 899,
    image: chartImg,
    category: "Trading Bots",
    categoryId: "1",
    inStock: true,
    featured: true,
    performanceBot: "1",
    plans: [
      { id: "3m", label: "3 Months", months: 3, price: 349 },
      { id: "6m", label: "6 Months", months: 6, price: 549 },
      { id: "12m", label: "12 Months", months: 12, price: 749 },
      { id: "lifetime", label: "Lifetime", months: null, price: 899 },
    ],
  },
  {
    id: "velocity-alpha",
    name: "Velocity Alpha",
    slug: "velocity-alpha",
    description:
      "Momentum-focused trading bot designed for faster trend capture with configurable filters and position sizing.",
    price: 949,
    image: screenImg,
    category: "Trading Bots",
    categoryId: "1",
    inStock: true,
    featured: true,
    performanceBot: "2",
    plans: [
      { id: "3m", label: "3 Months", months: 3, price: 399 },
      { id: "6m", label: "6 Months", months: 6, price: 599 },
      { id: "12m", label: "12 Months", months: 12, price: 799 },
      { id: "lifetime", label: "Lifetime", months: null, price: 949 },
    ],
  },
  {
    id: "kinetic-nexus",
    name: "Kinetic Nexus",
    slug: "kinetic-nexus",
    description:
      "High-activity algorithmic bot tuned for intraday volatility with smart scaling and multi-session coverage.",
    price: 999,
    image: tradeImg,
    category: "Trading Bots",
    categoryId: "1",
    inStock: true,
    featured: true,
    performanceBot: "3",
    plans: [
      { id: "3m", label: "3 Months", months: 3, price: 449 },
      { id: "6m", label: "6 Months", months: 6, price: 649 },
      { id: "12m", label: "12 Months", months: 12, price: 849 },
      { id: "lifetime", label: "Lifetime", months: null, price: 999 },
    ],
  },
]
