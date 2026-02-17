import { useSearchParams } from "react-router-dom"
import { useMemo } from "react"
import { ProductCard } from "@/components/product/ProductCard"
import { categories } from "@/data/products"
import { useProductsStore } from "@/stores/products-store"
import { Button } from "@/components/ui/button"

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get("category") ?? ""
  const featured = searchParams.get("featured") === "1"
  const q = searchParams.get("q") ?? ""

  const products = useProductsStore((s) => s.products)
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
  }, [category, featured, q])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-zinc-100 mb-2">Products</h1>
      <p className="text-zinc-500 mb-8">Trading bots, indicators, signals, and education for forex traders.</p>

      <div className="flex flex-wrap gap-2 mb-8">
        <Button
          variant={!category && !featured ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchParams({})}
        >
          All
        </Button>
        {featured && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setSearchParams({ featured: "1" })}
          >
            Featured
          </Button>
        )}
        {categories.map((cat) => (
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

      {q && (
        <p className="text-sm text-zinc-500 mb-4">
          Results for &quot;{q}&quot;: {filtered.length} product(s)
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-card p-12 text-center text-zinc-500">
          No products match your filters. Try another category or search term.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
