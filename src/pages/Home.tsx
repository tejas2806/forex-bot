import { Link } from "react-router-dom"
import { ArrowRight, Bot, ShieldCheck, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProductCard } from "@/components/product/ProductCard"
import { ProductCardSkeleton } from "@/components/product/ProductCardSkeleton"
import { useProductsStore } from "@/stores/products-store"

export function Home() {
  const products = useProductsStore((s) => s.products)
  const productsLoaded = useProductsStore((s) => s.productsLoaded)
  const featured = products.filter((p) => p.featured).slice(0, 4)

  return (
    <div>
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent" />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <Badge variant="secondary" className="mb-4">
            Trusted by active traders worldwide
          </Badge>
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

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <Card className="bg-zinc-900/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-4 w-4 text-orange-500" />
                  Automated execution
                </CardTitle>
                <CardDescription>
                  Deploy battle-tested strategy bots with minimal setup.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-zinc-900/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  Transparent results
                </CardTitle>
                <CardDescription>
                  Validate strategy behavior with performance-focused analytics.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-zinc-900/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-orange-500" />
                  Risk-aware tooling
                </CardTitle>
                <CardDescription>
                  Use disciplined configurations made for serious capital protection.
                </CardDescription>
              </CardHeader>
            </Card>
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
        {!productsLoaded ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="container mx-auto px-4 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Why teams pick AlphaForge</CardTitle>
            <CardDescription>
              Built for traders who want execution consistency, measurable outcomes, and clean workflows.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
            <div>
              <p className="text-2xl font-display font-semibold text-orange-500">24/7</p>
              <p className="text-sm text-zinc-400 mt-1">Automated market monitoring and execution support.</p>
            </div>
            <div>
              <p className="text-2xl font-display font-semibold text-orange-500">Multi-product</p>
              <p className="text-sm text-zinc-400 mt-1">Bots, signals, and education in one organized stack.</p>
            </div>
            <div>
              <p className="text-2xl font-display font-semibold text-orange-500">Actionable data</p>
              <p className="text-sm text-zinc-400 mt-1">Performance analytics that guide practical decisions.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
