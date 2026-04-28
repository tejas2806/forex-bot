import { Link } from "react-router-dom"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { useCartStore } from "@/stores/cart-store"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/utils"

export function Cart() {
  const { items, updateQuantity, removeItem, updateItemPlan, totalPrice, totalItems } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-2xl font-semibold text-zinc-100">Your cart is empty</h2>
        <p className="text-zinc-500 mt-2">Add bots, indicators, or courses from the store to get started.</p>
        <Button asChild className="mt-6">
          <Link to="/shop">Browse products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-zinc-100 mb-8">Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ id, product, quantity, planId, planLabel, unitPrice }) => {
            const price = unitPrice ?? product.price
            const itemId = id ?? `${product.id}:${planId ?? "base"}`
            return (
            <div
              key={itemId}
              className="flex gap-4 rounded-xl border border-zinc-800 bg-card p-4"
            >
              <img
                src={product.image}
                alt={product.name}
                className="h-24 w-24 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${product.slug}`}
                  className="font-medium text-zinc-100 hover:text-orange-500"
                >
                  {product.name}
                </Link>
                <p className="text-orange-500 font-medium mt-1">{formatPrice(price)}</p>
                {planLabel && (
                  <p className="text-xs text-zinc-500 mt-0.5">Plan: {planLabel}</p>
                )}
                {product.plans?.length ? (
                  <div className="mt-2 w-full max-w-xs">
                    <label className="text-[11px] uppercase tracking-wide text-zinc-500">Subscription plan</label>
                    <select
                      value={planId ?? "lifetime"}
                      onChange={(e) => updateItemPlan(itemId, e.target.value as "3m" | "6m" | "12m" | "lifetime")}
                      className="mt-1 h-9 w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-2 text-sm text-zinc-200"
                    >
                      {product.plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.label} - {formatPrice(plan.price)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(itemId, quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(itemId, quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-300 ml-2"
                    onClick={() => removeItem(itemId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="font-medium text-zinc-100 shrink-0">
                {formatPrice(price * quantity)}
              </p>
            </div>
            )
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-zinc-800 bg-card p-6 sticky top-24">
            <h3 className="font-display text-lg font-semibold text-zinc-100">Summary</h3>
            <p className="text-zinc-500 mt-1">{totalItems()} item(s)</p>
            <p className="mt-4 text-2xl font-bold text-zinc-100">{formatPrice(totalPrice())}</p>
            <Link
              to="/checkout"
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-6 w-full bg-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.3)] transition-all hover:-translate-y-0.5 hover:bg-orange-600"
              )}
            >
              Proceed to checkout
            </Link>
            <Link
              to="/shop"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-2 w-full border-zinc-600 bg-zinc-900 text-zinc-100 shadow-[0_6px_18px_rgba(0,0,0,0.25)] hover:border-orange-500/70 hover:bg-zinc-800"
              )}
            >
              Continue browsing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
