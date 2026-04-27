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
    price: 349,
    image: chartImg,
    category: "Trading Bots",
    categoryId: "1",
    inStock: true,
    featured: true,
    performanceBot: "1",
  },
  {
    id: "velocity-alpha",
    name: "Velocity Alpha",
    slug: "velocity-alpha",
    description:
      "Momentum-focused trading bot designed for faster trend capture with configurable filters and position sizing.",
    price: 399,
    image: screenImg,
    category: "Trading Bots",
    categoryId: "1",
    inStock: true,
    featured: true,
    performanceBot: "2",
  },
  {
    id: "kinetic-nexus",
    name: "Kinetic Nexus",
    slug: "kinetic-nexus",
    description:
      "High-activity algorithmic bot tuned for intraday volatility with smart scaling and multi-session coverage.",
    price: 449,
    image: tradeImg,
    category: "Trading Bots",
    categoryId: "1",
    inStock: true,
    featured: true,
    performanceBot: "3",
  },
]
