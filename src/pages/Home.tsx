import { Link, useLocation } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { ArrowRight, Bot, ChevronDown, ShieldCheck, Star, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Globe3DDemo from "@/components/3d-globe-demo"
import { ProductCard } from "@/components/product/ProductCard"
import { ProductCardSkeleton } from "@/components/product/ProductCardSkeleton"
import { HeroCandlestickAnimation } from "@/components/analytics/HeroCandlestickAnimation"
import { useProductsStore } from "@/stores/products-store"
import goldCoin from "@/assets/dollar-gold-coin.png"

export function Home() {
  const location = useLocation()
  const products = useProductsStore((s) => s.products)
  const productsLoaded = useProductsStore((s) => s.productsLoaded)
  const featured = products.filter((p) => p.featured).slice(0, 4)
  const featuredSectionRef = useRef<HTMLDivElement | null>(null)
  const [showFeaturedMotion, setShowFeaturedMotion] = useState(false)
  const [heroStats, setHeroStats] = useState({ volume: 0, years: 0, signals: 0 })
  const [openFaq, setOpenFaq] = useState(0)
  const testimonials = [
    {
      quote:
        "AlphaForge made my trading routine far more disciplined. I now deploy bots in minutes and track performance from one clean dashboard.",
      name: "Leslie Alexander",
      role: "Freelance React Developer",
      avatar: "https://cdn.rareblocks.xyz/collection/clarity/images/testimonial/4/avatar-male-1.png",
    },
    {
      quote:
        "The plan-based bot access and license flow is super smooth. For my team, this is the easiest way to manage multiple strategies confidently.",
      name: "Jacob Jones",
      role: "Digital Marketer",
      avatar: "https://cdn.rareblocks.xyz/collection/clarity/images/testimonial/4/avatar-male-2.png",
    },
    {
      quote:
        "What I like most is the reliability: transparent analytics, quick checkout, and fast support. It feels built for serious traders, not hype.",
      name: "Jenny Wilson",
      role: "Graphic Designer",
      avatar: "https://cdn.rareblocks.xyz/collection/clarity/images/testimonial/4/avatar-female.png",
    },
  ]
  const faqs = [
    {
      question: "How do I create an account and start buying bots?",
      answer:
        "Click Sign up, verify your email, and log in. Then open any product, choose your subscription plan, add to cart, and complete checkout to place your order.",
    },
    {
      question: "Which payment methods are supported?",
      answer:
        "You can pay through the currently enabled method shown at checkout (including USDT QR flow). Order status updates in your account once payment is processed.",
    },
    {
      question: "Can I cancel or change my subscription plan later?",
      answer:
        "Plan changes and cancellations are handled by support and policy terms. Share your order ID from the Orders page and our team will help with the best available option.",
    },
    {
      question: "When do I receive license keys and bot download access?",
      answer:
        "After your order is marked paid, license keys are generated and download access appears automatically in your order details.",
    },
    {
      question: "How can I contact support quickly?",
      answer:
        "Use the support channels listed in the footer and share your order ID, email, and issue details. This helps the team resolve requests faster.",
    },
  ]

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

  useEffect(() => {
    if (location.hash !== "#about") return
    const aboutSection = document.getElementById("about")
    if (!aboutSection) return

    const scrollTimer = window.setTimeout(() => {
      aboutSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 60)

    return () => window.clearTimeout(scrollTimer)
  }, [location.hash])

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-void to-void">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_30%,rgba(249,115,22,0.20),transparent_48%),radial-gradient(circle_at_72%_38%,rgba(56,189,248,0.14),transparent_45%)]" />
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto grid max-w-[1240px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_560px] lg:gap-16">
            <div className="max-w-[640px]">
              <Badge variant="secondary" className="hero-trust-badge mb-5 text-sm font-semibold">
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

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
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

              <div className="mt-9">
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
              <div className="mt-6 rounded-2xl border border-zinc-800/70 bg-zinc-900/35 p-4 lg:hidden">
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
              <div className="relative mx-auto w-full max-w-[560px] space-y-4">
                <div className="rounded-2xl bg-transparent p-4">
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
                <div className="rounded-2xl bg-transparent p-4">
                  <HeroCandlestickAnimation />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 space-y-4 lg:hidden">
            <HeroCandlestickAnimation />
          </div>

          <div className="mx-auto mt-14 grid max-w-[1240px] gap-4 md:grid-cols-3">
            <Card className="group relative h-full overflow-hidden bg-zinc-900/40 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-[0_14px_40px_rgba(249,115,22,0.18)]">
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
            <Card className="group relative h-full overflow-hidden bg-zinc-900/40 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-[0_14px_40px_rgba(249,115,22,0.18)]">
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
            <Card className="group relative h-full overflow-hidden bg-zinc-900/40 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-[0_14px_40px_rgba(249,115,22,0.18)]">
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

      <section className="px-4 py-14 md:py-16">
        <div className="mx-auto grid w-full max-w-[1240px] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
          <Card className="border-zinc-800 bg-zinc-900/65">
            <CardHeader>
              <CardTitle className="text-2xl text-zinc-100 md:text-3xl">Global trader activity</CardTitle>
              <CardDescription className="text-zinc-400">
                Explore how trading communities are connected across major markets. This demo block is ready for live geographic insight modules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <p>Live strategy reach across global trading cities</p>
              <p>Instant marker interactions prepared for future data hooks</p>
              <p>Designed to match the AlphaForge visual system</p>
            </CardContent>
          </Card>
          <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-3">
            <Globe3DDemo />
          </div>
        </div>
      </section>

      <section className="w-full py-14 md:py-16">
        <div className="relative p-0 px-4 md:px-6 smoky-featured-bg">
          <div className="pointer-events-none absolute inset-0 smoky-featured-layer smoky-featured-layer-a" />
          <div className="pointer-events-none absolute inset-0 smoky-featured-layer smoky-featured-layer-b" />
          <div className="pointer-events-none absolute inset-0 smoky-featured-vignette" />
          <div ref={featuredSectionRef} className="relative mb-8 flex flex-col items-center gap-3 text-center">
            <div className="w-full">
              <p className="featured-kicker text-sm font-semibold uppercase tracking-[0.24em]">
                Top performing strategies
              </p>
              <h2 className="featured-title mt-2 font-display text-3xl font-bold text-zinc-100 md:text-4xl">
                Featured bots & products
              </h2>
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
            <div className="relative mx-auto w-full max-w-[1240px] px-10 sm:px-12 lg:px-14">
              <Carousel
                opts={{ align: "start" }}
                className="w-full"
              >
                <CarouselContent>
                  {featured.map((product, index) => (
                    <CarouselItem
                      key={product.id}
                      className="basis-full sm:basis-1/2 xl:basis-1/3"
                    >
                      <div
                        className={`group w-full featured-card-reveal featured-card-glass-shell ${
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
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-14 md:py-16">
        <div className="mx-auto w-full max-w-[1240px]">
          <div className="flex flex-col items-center">
            <div className="text-center">
              <p className="text-base font-medium text-zinc-400">
                2,157 people have shared their experience with AlphaForge
              </p>
              <h2 className="mt-4 font-display text-3xl font-bold text-zinc-100 sm:text-4xl">
                Our happy clients say about us
              </h2>
            </div>

            <div className="relative mt-10 w-full md:mt-14">
              <div className="pointer-events-none absolute -inset-x-1 inset-y-10 md:-inset-x-2 md:-inset-y-5">
                <div
                  className="mx-auto h-full w-full max-w-5xl rounded-3xl opacity-25 blur-2xl"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(68,255,154,0.45) -0.55%, rgba(68,176,255,0.45) 22.86%, rgba(139,68,255,0.45) 48.36%, rgba(255,102,68,0.45) 73.33%, rgba(235,255,112,0.45) 99.34%)",
                  }}
                />
              </div>

              <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
                {testimonials.map((item) => (
                  <Card className="testimonial-card group h-full border-zinc-800 bg-zinc-900/75 shadow-xl" key={item.name}>
                    <CardContent className="flex h-full flex-col justify-between p-6 lg:px-7 lg:py-8">
                      <div>
                        <div className="flex items-center gap-1 text-amber-400 transition-transform duration-300 group-hover:scale-[1.03]">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star key={index} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                        <blockquote className="mt-6 text-base leading-relaxed text-zinc-200 transition-colors duration-300 group-hover:text-zinc-100">
                          "{item.quote}"
                        </blockquote>
                      </div>

                      <div className="mt-8 flex items-center transition-transform duration-300 group-hover:translate-y-[-1px]">
                        <img
                          className="h-11 w-11 shrink-0 rounded-full object-cover"
                          src={item.avatar}
                          alt={item.name}
                        />
                        <div className="ml-4">
                          <p className="text-sm font-semibold text-zinc-100">{item.name}</p>
                          <p className="mt-0.5 text-xs text-zinc-400">{item.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="px-4 py-14 md:py-16">
        <div className="mx-auto w-full max-w-[1240px]">
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
        </div>
      </section>

      <section className="px-4 py-14 md:py-16">
        <div className="mx-auto w-full max-w-[1240px]">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold leading-tight text-zinc-100 sm:text-4xl md:text-5xl">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
              Quick answers about accounts, payments, licenses, subscriptions, and support.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-3xl space-y-4 md:mt-12">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div
                  key={faq.question}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/70 shadow-lg transition-all duration-200 hover:border-zinc-700"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-5 text-left sm:px-6"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  >
                    <span className="text-base font-semibold text-zinc-100 sm:text-lg">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-zinc-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-6 sm:pb-6">
                      <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="mt-9 text-center text-sm text-zinc-400 sm:text-base">
            Didn&apos;t find the answer you are looking for?{" "}
            <a
              href="#"
              className="font-medium text-orange-400 transition-colors duration-200 hover:text-orange-300 hover:underline"
            >
              Contact our support
            </a>
          </p>
        </div>
      </section>
    </div>
  )
}
