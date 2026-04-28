import { useSearchParams } from "react-router-dom"
import { useMemo } from "react"
import { SlidersHorizontal } from "lucide-react"
import { ProductCard } from "@/components/product/ProductCard"
import { categories } from "@/data/products"
import { useProductsStore } from "@/stores/products-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProductCardSkeleton } from "@/components/product/ProductCardSkeleton"

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get("category") ?? ""
  const featured = searchParams.get("featured") === "1"
  const q = searchParams.get("q") ?? ""

  const products = useProductsStore((s) => s.products)
  const productsLoaded = useProductsStore((s) => s.productsLoaded)
  const filtered = useMemo(() => {
    let list = products
    if (category) {
      const cat = categories.find((c) => c.slug === category)
      if (cat) list = list.filter((p) => p.categoryId === cat.id)
    }
    if (featured) list = list.filter((p) => p.featured)
    if (q.trim()) {
      const lower = q.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower) ||
          p.category.toLowerCase().includes(lower)
      )
    }
    return list
  }, [products, category, featured, q])

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-3xl">Products</CardTitle>
              <CardDescription className="mt-2">
                Trading bots, indicators, signals, and education for forex traders.
              </CardDescription>
            </div>
            <Badge variant="outline" className="h-fit">
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-zinc-400">
            <SlidersHorizontal className="h-4 w-4" />
            Filter by category
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!category && !featured ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchParams({})}
            >
              All products
            </Button>
            <Button
              variant={featured && !category ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchParams({ featured: "1" })}
            >
              Featured
            </Button>
            {categories
              .filter((cat) => cat.slug !== "trading-bots")
              .map((cat) => (
              <Button
                key={cat.id}
                variant={category === cat.slug ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setSearchParams(featured ? { category: cat.slug, featured: "1" } : { category: cat.slug })
                }
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {q && (
        <p className="text-sm text-zinc-500 mb-4">
          Results for &quot;{q}&quot;: {filtered.length} product(s)
        </p>
      )}

      {!productsLoaded ? (
        <Card>
          <CardContent className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-zinc-500">
            No products match your filters. Try another category or search term.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
