import { useParams, Link } from "react-router-dom"
import { ShoppingCart, ArrowLeft } from "lucide-react"
import { useEffect, useState } from "react"
import { useProductsStore } from "@/stores/products-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/stores/cart-store"
import { useAuthStore } from "@/stores/auth-store"
import type { ProductPlan } from "@/types"

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const getBySlug = useProductsStore((s) => s.getBySlug)
  const productsLoaded = useProductsStore((s) => s.productsLoaded)
  const product = slug ? getBySlug(slug) : undefined
  const addItem = useCartStore((s) => s.addItem)
  const user = useAuthStore((s) => s.user)
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const [loginAlert, setLoginAlert] = useState("")
  const [showLoginAlert, setShowLoginAlert] = useState(false)

  useEffect(() => {
    if (!loginAlert) return
    setShowLoginAlert(true)
    const hideTimer = window.setTimeout(() => setShowLoginAlert(false), 2200)
    const clearTimer = window.setTimeout(() => setLoginAlert(""), 2800)
    return () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(clearTimer)
    }
  }, [loginAlert])

  if (!productsLoaded) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-zinc-500">Loading product…</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-zinc-500">Product not found.</p>
        <Button variant="link" asChild className="mt-4">
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    )
  }

  const plans = product.plans ?? []
  const selectedPlan =
    plans.find((plan) => plan.id === selectedPlanId) ??
    plans.find((plan) => plan.id === "lifetime") ??
    plans[0]
  const displayPrice = selectedPlan?.price ?? product.price

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to="/shop" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <img
            src={product.image}
            alt={product.name}
            className="h-72 w-full object-cover md:h-80 lg:h-[420px]"
          />
          <div className="border-t border-zinc-800 bg-gradient-to-r from-zinc-900/80 to-zinc-900/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Performance-ready asset</p>
            <p className="mt-1 text-sm text-zinc-300">
              Optimized for automation-first execution and risk-aware deployment.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 lg:p-7">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">{product.category}</Badge>
            {product.featured && <Badge>Featured</Badge>}
          </div>
          <h1 className="font-display text-3xl font-bold text-zinc-100">{product.name}</h1>
          <p className="text-2xl font-semibold text-orange-500 mt-2">
            {formatPrice(displayPrice)}
          </p>
          {selectedPlan && (
            <p className="mt-1 text-sm text-zinc-400">
              Selected plan: <span className="text-zinc-200">{selectedPlan.label}</span>
            </p>
          )}
          <p className="text-zinc-400 mt-6 leading-relaxed">{product.description}</p>
          {plans.length > 0 && (
            <div className="mt-7">
              <p className="mb-2 text-sm font-medium text-zinc-300">Choose plan</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      selectedPlan?.id === plan.id
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
                    }`}
                  >
                    <p className="text-sm font-medium text-zinc-100">{plan.label}</p>
                    <p className="text-sm text-orange-400">{formatPrice(plan.price)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              className="h-11 bg-orange-500 px-6 text-white transition-all hover:-translate-y-0.5 hover:bg-orange-600"
              onClick={() => {
                if (!user) {
                  setLoginAlert("Please log in first to add this product to cart.")
                  return
                }
                setLoginAlert("")
                addItem(product, 1, selectedPlan as ProductPlan | undefined)
              }}
              disabled={!product.inStock}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to cart
            </Button>
            <p className="text-sm text-zinc-500">
              Instant delivery in account after payment verification.
            </p>
            {!product.inStock && (
              <span className="text-sm text-zinc-500 self-center">Out of stock</span>
            )}
          </div>
          {loginAlert && (
            <div
              className={`mt-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 transition-all duration-500 ${
                showLoginAlert ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
              }`}
            >
              {loginAlert}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
