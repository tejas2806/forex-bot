import { Link } from "react-router-dom"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/stores/cart-store"
import { formatPrice } from "@/lib/utils"

export function Cart() {
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCartStore()

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
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
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
                <p className="text-orange-500 font-medium mt-1">{formatPrice(product.price)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-300 ml-2"
                    onClick={() => removeItem(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="font-medium text-zinc-100 shrink-0">
                {formatPrice(product.price * quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-zinc-800 bg-card p-6 sticky top-24">
            <h3 className="font-display text-lg font-semibold text-zinc-100">Summary</h3>
            <p className="text-zinc-500 mt-1">{totalItems()} item(s)</p>
            <p className="mt-4 text-2xl font-bold text-zinc-100">{formatPrice(totalPrice())}</p>
            <Button asChild className="w-full mt-6" size="lg">
              <Link to="/checkout">Proceed to checkout</Link>
            </Button>
            <Button variant="outline" asChild className="w-full mt-2">
              <Link to="/shop">Continue browsing</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
