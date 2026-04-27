import { useParams, Link } from "react-router-dom"
import { ShoppingCart, ArrowLeft } from "lucide-react"
import { useProductsStore } from "@/stores/products-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/stores/cart-store"

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const getBySlug = useProductsStore((s) => s.getBySlug)
  const productsLoaded = useProductsStore((s) => s.productsLoaded)
  const product = slug ? getBySlug(slug) : undefined
  const addItem = useCartStore((s) => s.addItem)

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
            {formatPrice(product.price)}
          </p>
          <p className="text-zinc-400 mt-6 leading-relaxed">{product.description}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button
              size="lg"
              onClick={() => addItem(product)}
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
