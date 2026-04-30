import { Link } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { ArrowRight, Bot, ShieldCheck, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProductCard } from "@/components/product/ProductCard"
import { ProductCardSkeleton } from "@/components/product/ProductCardSkeleton"
import { HeroCandlestickAnimation } from "@/components/analytics/HeroCandlestickAnimation"
import { useProductsStore } from "@/stores/products-store"
import goldCoin from "@/assets/dollar-gold-coin.png"

export function Home() {
  const products = useProductsStore((s) => s.products)
  const productsLoaded = useProductsStore((s) => s.productsLoaded)
  const featured = products.filter((p) => p.featured).slice(0, 4)
  const featuredGridCols =
    featured.length >= 4
      ? "lg:grid-cols-4"
      : featured.length === 3
        ? "lg:grid-cols-3"
        : featured.length === 2
          ? "lg:grid-cols-2"
          : "lg:grid-cols-1"
  const featuredSectionRef = useRef<HTMLDivElement | null>(null)
  const [showFeaturedMotion, setShowFeaturedMotion] = useState(false)
  const [heroStats, setHeroStats] = useState({ volume: 0, years: 0, signals: 0 })

  useEffect(() => {
    const node = featuredSectionRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowFeaturedMotion(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const animationDurationMs = 900
    const animationStart = performance.now()
    let frameId = 0

    const animateStats = (now: number) => {
      const progress = Math.min((now - animationStart) / animationDurationMs, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)

      setHeroStats({
        volume: Math.floor(60 * easedProgress),
        years: Math.floor(6 * easedProgress),
        signals: Math.floor(5 * easedProgress),
      })

      if (progress < 1) {
        frameId = requestAnimationFrame(animateStats)
      }
    }

    frameId = requestAnimationFrame(animateStats)
    return () => cancelAnimationFrame(frameId)
  }, [])

  return (
    <div>
      <section className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-b from-zinc-900 via-void to-void">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_30%,rgba(249,115,22,0.20),transparent_48%),radial-gradient(circle_at_72%_38%,rgba(56,189,248,0.14),transparent_45%)]" />
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_560px] lg:gap-14">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-5">
                Trusted by active traders worldwide
              </Badge>
              <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight text-zinc-100">
                Leading Forex Bot <br />
                Platform for the{" "}
                <span className="text-orange-500">modern trader</span>
              </h1>
              <p className="mt-5 text-lg text-zinc-400">
                Professional trading bots, indicators, and real-time signal workflows built to scale consistency and reduce emotion in execution.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                  <p className="font-display text-2xl font-semibold text-zinc-100">{heroStats.volume}B+</p>
                  <p className="text-xs text-zinc-500">Monthly trading volume</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                  <p className="font-display text-2xl font-semibold text-zinc-100">{heroStats.years} Years</p>
                  <p className="text-xs text-zinc-500">Strategy research cycle</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                  <p className="font-display text-2xl font-semibold text-zinc-100">{heroStats.signals}M+</p>
                  <p className="text-xs text-zinc-500">Signal events processed</p>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 w-full max-w-md rounded-full border-orange-500 text-lg text-orange-500 hover:bg-orange-500/10"
                  asChild
                >
                  <Link to="/login">
                    <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                      Continue with Google <ArrowRight className="h-5 w-5" />
                    </span>
                  </Link>
                </Button>
              </div>
              <p className="mt-3 text-sm text-zinc-300">
                Sign Up and Claim up to 10,000 USDT in Rewards
              </p>
              <div className="mt-5 lg:hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/35 p-4">
                <div className="flex justify-center">
                  <div className="hero-coin-drop">
                    <div className="hero-coin-flip">
                      <img
                        src={goldCoin}
                        alt="Gold coin showing trading value"
                        className="h-44 w-44 object-contain drop-shadow-[0_20px_28px_rgba(249,115,22,0.4)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-3 rounded-3xl bg-orange-500/15 blur-3xl" />
              <div className="relative space-y-4">
                <div className="rounded-2xl border border-zinc-800/70 bg-transparent p-4">
                  <div className="flex justify-center">
                    <div className="hero-coin-drop">
                      <div className="hero-coin-flip">
                        <img
                          src={goldCoin}
                          alt="Gold coin showing trading value"
                          className="h-44 w-44 object-contain drop-shadow-[0_20px_24px_rgba(249,115,22,0.34)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-zinc-800/70 bg-transparent p-4">
                  <HeroCandlestickAnimation />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-4 lg:hidden">
            <HeroCandlestickAnimation />
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <Card className="group relative overflow-hidden bg-zinc-900/40 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-[0_14px_40px_rgba(249,115,22,0.18)]">
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-orange-500/12 via-transparent to-transparent" />
              <CardHeader className="pb-3">
                <CardTitle className="relative flex items-center gap-2 text-base transition-colors duration-300 group-hover:text-orange-300">
                  <Bot className="h-4 w-4 text-orange-500 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
                  Automated execution
                </CardTitle>
                <CardDescription className="relative transition-colors duration-300 group-hover:text-zinc-300">
                  Deploy battle-tested strategy bots with minimal setup.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="group relative overflow-hidden bg-zinc-900/40 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-[0_14px_40px_rgba(249,115,22,0.18)]">
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-orange-500/12 via-transparent to-transparent" />
              <CardHeader className="pb-3">
                <CardTitle className="relative flex items-center gap-2 text-base transition-colors duration-300 group-hover:text-orange-300">
                  <TrendingUp className="h-4 w-4 text-orange-500 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
                  Transparent results
                </CardTitle>
                <CardDescription className="relative transition-colors duration-300 group-hover:text-zinc-300">
                  Validate strategy behavior with performance-focused analytics.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="group relative overflow-hidden bg-zinc-900/40 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-[0_14px_40px_rgba(249,115,22,0.18)]">
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-orange-500/12 via-transparent to-transparent" />
              <CardHeader className="pb-3">
                <CardTitle className="relative flex items-center gap-2 text-base transition-colors duration-300 group-hover:text-orange-300">
                  <ShieldCheck className="h-4 w-4 text-orange-500 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
                  Risk-aware tooling
                </CardTitle>
                <CardDescription className="relative transition-colors duration-300 group-hover:text-zinc-300">
                  Use disciplined configurations made for serious capital protection.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="w-full py-16">
        <div className="relative overflow-x-hidden p-0 px-4 md:px-6 smoky-featured-bg">
          <div className="pointer-events-none absolute inset-0 smoky-featured-layer smoky-featured-layer-a" />
          <div className="pointer-events-none absolute inset-0 smoky-featured-layer smoky-featured-layer-b" />
          <div className="pointer-events-none absolute inset-0 smoky-featured-vignette" />
          <div ref={featuredSectionRef} className="relative mb-8 flex flex-col items-center gap-3 text-center">
            <div className="w-full">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-300 drop-shadow-[0_2px_10px_rgba(15,23,42,0.6)]">
                Top performing strategies
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-zinc-100">Featured bots & products</h2>
            </div>
            <Button variant="ghost" asChild className="md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2">
              <Link to="/shop?featured=1">View all</Link>
            </Button>
          </div>
          {!productsLoaded ? (
            <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="w-full max-w-sm">
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
          ) : (
            <div className={`relative mx-auto grid max-w-[1240px] grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 ${featuredGridCols}`}>
              {featured.map((product, index) => (
                <div
                  key={product.id}
                  className={`group w-full max-w-sm featured-card-reveal featured-card-glass-shell ${
                    index === 1 ? "featured-card-hover-demo" : ""
                  } ${
                    showFeaturedMotion ? "featured-card-reveal-visible" : ""
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="pointer-events-none absolute inset-0 -z-10 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br from-orange-500/20 to-cyan-500/10" />
                  <div className="featured-card-shine">
                    <ProductCard product={product} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
