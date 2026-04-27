import { Link } from "react-router-dom"
import { ShoppingCart, LineChart } from "lucide-react"
import type { Product } from "@/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/stores/cart-store"
import { toast } from "@/hooks/use-toast"

function getPerformancePath(product: Product): string {
  const bot = product.performanceBot ?? (product.id === "1" || product.id === "2" || product.id === "3" ? product.id : null)
  return bot ? `/performance/${bot}` : "/performance"
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const performancePath = getPerformancePath(product)
  const defaultPlan =
    product.plans?.find((plan) => plan.id === "lifetime") ?? product.plans?.[0]
  const displayPrice = defaultPlan?.price ?? product.price

  return (
    <Card className="group overflow-hidden transition-all hover:border-zinc-600 hover:shadow-lg">
      <Link to={`/product/${product.slug}`}>
        <div className="aspect-square overflow-hidden bg-zinc-900/50">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/product/${product.slug}`} className="flex-1 min-w-0">
            <h3 className="font-medium text-zinc-100 truncate group-hover:text-orange-500 transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.featured && (
            <Badge variant="default" className="shrink-0">Featured</Badge>
          )}
        </div>
        <p className="text-sm text-zinc-500 mt-0.5 line-clamp-2">{product.description}</p>
        <p className="font-display text-lg font-semibold text-orange-500 mt-2">
          {formatPrice(displayPrice)}
        </p>
        {defaultPlan && (
          <p className="mt-1 text-xs text-zinc-500">Default plan: {defaultPlan.label}</p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            className="flex-1 whitespace-nowrap bg-orange-500 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-600"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              addItem(product, 1, defaultPlan)
              toast({
                title: "Added to cart",
                description: `${product.name}${defaultPlan ? ` (${defaultPlan.label})` : ""} is ready for checkout.`,
              })
            }}
            disabled={!product.inStock}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            <span className="hidden whitespace-nowrap sm:inline">Add to cart</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 whitespace-nowrap" asChild>
            <Link to={performancePath} className="inline-flex w-full items-center justify-center gap-1 whitespace-nowrap">
              <LineChart className="h-4 w-4 mr-1" />
              <span className="hidden whitespace-nowrap sm:inline">Check performance</span>
              <span className="sm:hidden">Performance</span>
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
