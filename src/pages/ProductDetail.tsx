import { useParams, Link } from "react-router-dom"
import { ShoppingCart, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useProductsStore } from "@/stores/products-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/stores/cart-store"
import type { ProductPlan } from "@/types"

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const getBySlug = useProductsStore((s) => s.getBySlug)
  const productsLoaded = useProductsStore((s) => s.productsLoaded)
  const product = slug ? getBySlug(slug) : undefined
  const addItem = useCartStore((s) => s.addItem)
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")

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

      <div className="grid md:grid-cols-2 gap-12">
        <div className="aspect-square overflow-hidden rounded-xl bg-zinc-900/50">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
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
            <div className="mt-6">
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
          <div className="mt-8 flex flex-wrap gap-4">
            <Button
              size="lg"
              onClick={() => addItem(product, 1, selectedPlan as ProductPlan | undefined)}
              disabled={!product.inStock}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to cart
            </Button>
            {!product.inStock && (
              <span className="text-sm text-zinc-500 self-center">Out of stock</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
