import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product/ProductCard"
import { useProductsStore } from "@/stores/products-store"

export function Home() {
  const products = useProductsStore((s) => s.products)
  const featured = products.filter((p) => p.featured).slice(0, 4)

  return (
    <div>
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent" />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <h1 className="font-display text-4xl md:text-6xl font-bold text-zinc-100 max-w-2xl">
            Forex trading, <span className="text-orange-500">automated</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-xl">
            Professional trading bots, indicators, and signal services for serious forex traders. Automate your edge and scale your results.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button size="lg" asChild>
              <Link to="/shop">
                Browse products <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/shop?featured=1">Featured bots & signals</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl font-semibold text-zinc-100">Featured bots & products</h2>
          <Button variant="ghost" asChild>
            <Link to="/shop?featured=1">View all</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}
