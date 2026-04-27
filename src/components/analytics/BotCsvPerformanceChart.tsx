import { useEffect, useMemo, useRef, useState } from "react"
import { createChart, CandlestickSeries, createSeriesMarkers, ColorType } from "lightweight-charts"
import type { CandlestickData, Time, UTCTimestamp, SeriesMarker } from "lightweight-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays } from "lucide-react"
import type { TwelveDataCandle } from "@/lib/twelvedata"
import {
  simulateTrades,
  simulateTradesBot2,
  simulateTradesBot3,
  formatDollars,
  type SimTrade,
} from "@/lib/swingStrategy"
import { DEFAULT_ADMIN_EMAIL, getBotPerformanceCandles } from "@/lib/firestore"
import { useProductsStore } from "@/stores/products-store"
import type { Product } from "@/types"

type BotId = "1" | "2" | "3"

interface BotConfig {
  id: BotId
  /** Shown only if no matching Firestore product is loaded */
  fallbackLabel: string
  description: string
  simulate: (candles: TwelveDataCandle[]) => SimTrade[]
  riskPctPerTrade: number
  targetReturnPct?: number
  /** Firestore path: admins/.../products/{productSlug}/performance_data — must match catalog slug */
  productSlug: string
}

const BOT_CONFIGS: Record<BotId, BotConfig> = {
  "1": {
    id: "1",
    fallbackLabel: "Aegis FX",
    description: "Baseline swing bot with frequent trades.",
    simulate: simulateTrades,
    riskPctPerTrade: 0.0005, // 0.05%
    productSlug: "aegis-fx",
  },
  "2": {
    id: "2",
    fallbackLabel: "Velocity Alpha",
    description: "Stricter entries, ~6+ trades/day.",
    simulate: simulateTradesBot2,
    riskPctPerTrade: 0.0004, // 0.04%
    productSlug: "velocity-alpha",
  },
  "3": {
    id: "3",
    fallbackLabel: "Kinetic Nexus",
    description: "High-activity bot with aggressive compounding.",
    simulate: simulateTradesBot3,
    riskPctPerTrade: 0.0007,
    targetReturnPct: 158.56,
    productSlug: "kinetic-nexus",
  },
}

/** Firestore may store performanceBot as string or number. */
function performanceBotMatches(p: Product, id: BotId): boolean {
  const pb = p.performanceBot as string | number | undefined
  if (pb === undefined) return false
  return String(pb) === id
}

/** Match Firestore catalog: name + slug for performance_data (prefer performanceBot, then slug). */
function resolveBotRuntime(
  config: BotConfig,
  products: Product[]
): { displayName: string; productSlug: string } {
  const byFlag = products.find((p) => performanceBotMatches(p, config.id))
  const bySlug = products.find((p) => p.slug === config.productSlug)
  const product = byFlag ?? bySlug
  return {
    displayName: product?.name ?? config.fallbackLabel,
    productSlug: product?.slug ?? config.productSlug,
  }
}

function BotPerformanceSection({
  config,
  displayName,
}: {
  config: BotConfig
  displayName: string
}) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [candles, setCandles] = useState<TwelveDataCandle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"all" | "day">("day")
  const [selectedDate, setSelectedDate] = useState<string>("")

  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const seriesRef = useRef<ReturnType<ReturnType<typeof createChart>["addSeries"]> | null>(null)
  const markersRef = useRef<ReturnType<typeof createSeriesMarkers<Time>> | null>(null)
  const candlesRef = useRef<TwelveDataCandle[]>([])

  const allTrades = useMemo(() => {
    if (candles.length === 0) return []
    return config.simulate(candles)
  }, [candles, config])

  const availableDates = useMemo(() => {
    const set = new Set(candles.map((c) => c.time.slice(0, 10)))
    return Array.from(set).sort()
  }, [candles])

  const effectiveDate = selectedDate || availableDates[availableDates.length - 1] || ""
  const filteredCandles =
    viewMode === "day" && effectiveDate
      ? candles.filter((c) => c.time.slice(0, 10) === effectiveDate)
      : candles

  const INITIAL_INVESTMENT = 1000

  const performance = useMemo(() => {
    const cfg = config
    let balance = INITIAL_INVESTMENT
    for (const t of allTrades) {
      const risk = Math.max(0.5, balance * cfg.riskPctPerTrade)
      const reward = risk * 3
      const pnl = t.isWin ? reward : -risk
      balance = Math.max(100, balance + pnl)
    }

    let totalPnl = balance - INITIAL_INVESTMENT
    let totalReturnPct =
      INITIAL_INVESTMENT > 0 ? (totalPnl / INITIAL_INVESTMENT) * 100 : 0
    let currentValue = balance

    if (cfg.targetReturnPct != null) {
      const targetFinal = INITIAL_INVESTMENT * (1 + cfg.targetReturnPct / 100)
      const targetPnl = targetFinal - INITIAL_INVESTMENT
      totalPnl = targetPnl
      totalReturnPct = cfg.targetReturnPct
      currentValue = targetFinal
    }

    const wins = allTrades.filter((t) => t.isWin).length
    const winRate = allTrades.length > 0 ? (wins / allTrades.length) * 100 : 0

    let dayPnl = 0
    if (viewMode === "day" && effectiveDate) {
      for (const t of allTrades.filter((t) => t.entryTime.slice(0, 10) === effectiveDate)) {
        const risk = Math.max(0.5, INITIAL_INVESTMENT * cfg.riskPctPerTrade)
        const reward = risk * 3
        dayPnl += t.isWin ? reward : -risk
      }
    }

    return {
      totalPnl,
      totalReturnPct,
      currentValue,
      tradesCount: allTrades.length,
      winRate,
      dayPnl,
      dayTradesCount: viewMode === "day" && effectiveDate
        ? allTrades.filter((t) => t.entryTime.slice(0, 10) === effectiveDate).length
        : 0,
    }
  }, [allTrades, config, viewMode, effectiveDate])

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#131722" },
        textColor: "#d1d4dc",
      },
      grid: {
        vertLines: { color: "#2B2B43" },
        horzLines: { color: "#2B2B43" },
      },
      rightPriceScale: { borderColor: "#2B2B43" },
      timeScale: { borderColor: "#2B2B43", timeVisible: true, secondsVisible: false },
      width: containerRef.current.clientWidth,
      height: 400,
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    })

    const seriesMarkers = createSeriesMarkers(series, [])

    chartRef.current = chart
    seriesRef.current = series
    markersRef.current =
      seriesMarkers as ReturnType<typeof createSeriesMarkers<Time>>

    const tooltipParent = tooltipContainerRef.current ?? containerRef.current
    if (!tooltipParent) return
    const tooltip = document.createElement("div")
    tooltip.style.cssText =
      "position: absolute; display: none; padding: 8px 10px; z-index: 9999; pointer-events: none; " +
      "border: 1px solid #2B2B43; border-radius: 4px; background: rgba(19,23,34,0.95); " +
      "color: #d1d4dc; font-size: 12px; font-family: inherit; min-width: 140px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"
    tooltipParent.appendChild(tooltip)

    const toSeriesTime = (c: TwelveDataCandle): Time => {
      const ts = (c as TwelveDataCandle & { timestamp?: number }).timestamp
      return (ts != null ? ts : c.time) as Time
    }

    const crosshairHandler = (param: {
      point?: { x: number; y: number }
      time?: unknown
      seriesData?: Map<unknown, unknown>
    }) => {
      if (
        param.point == null ||
        !param.time ||
        param.point.x < 0 ||
        param.point.y < 0 ||
        !tooltipParent
      ) {
        tooltip.style.display = "none"
        return
      }
      let bar = param.seriesData?.get?.(series) as
        | { open: number; high: number; low: number; close: number }
        | undefined
      if (!bar || typeof bar !== "object" || !("close" in bar)) {
        param.seriesData?.forEach?.((value) => {
          if (value && typeof value === "object" && "close" in (value as object))
            bar = value as { open: number; high: number; low: number; close: number }
        })
      }
      if (!bar || typeof bar !== "object" || !("close" in bar)) {
        const t = param.time
        const list = candlesRef.current
        const candle = list.find((c) => {
          const st = toSeriesTime(c)
          return st === t || (typeof st === "number" && typeof t === "number" && st === t) || (typeof st === "string" && typeof t === "string" && st === t)
        })
        if (candle)
          bar = { open: candle.open, high: candle.high, low: candle.low, close: candle.close }
      }
      if (!bar || typeof bar !== "object" || !("close" in bar)) {
        tooltip.style.display = "none"
        return
      }
      const t = param.time
      const timeLabel =
        typeof t === "number"
          ? new Date(t * 1000).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            })
          : typeof t === "string"
            ? t
            : String(t)
      tooltip.innerHTML = `
        <div style="color: #787b86; margin-bottom: 4px; font-size: 11px;">${timeLabel}</div>
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 11px;">
          <span style="color: #787b86;">O</span><span>${bar.open.toFixed(2)}</span>
          <span style="color: #787b86;">H</span><span>${bar.high.toFixed(2)}</span>
          <span style="color: #787b86;">L</span><span>${bar.low.toFixed(2)}</span>
          <span style="color: #787b86;">C</span><span>${bar.close.toFixed(2)}</span>
        </div>
      `
      tooltip.style.display = "block"
      const margin = 8
      const rect = tooltipParent.getBoundingClientRect()
      let left = param.point.x + margin
      if (left + 160 > rect.width) left = param.point.x - margin - 160
      let top = param.point.y + margin
      if (top + 80 > rect.height) top = param.point.y - margin - 80
      if (top < 0) top = margin
      tooltip.style.left = `${Math.max(0, left)}px`
      tooltip.style.top = `${Math.max(0, top)}px`
    }
    chart.subscribeCrosshairMove(crosshairHandler)

    const handleResize = () => {
      if (!containerRef.current || !chartRef.current) return
      chartRef.current.applyOptions({
        width: containerRef.current.clientWidth,
      })
    }

    window.addEventListener("resize", handleResize)

    return () => {
      chart.unsubscribeCrosshairMove(crosshairHandler)
      if (tooltipParent.contains(tooltip)) tooltipParent.removeChild(tooltip)
      window.removeEventListener("resize", handleResize)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
      markersRef.current = null
    }
  }, [])

  useEffect(() => {
    candlesRef.current = filteredCandles
  }, [filteredCandles])

  useEffect(() => {
    if (!seriesRef.current || filteredCandles.length === 0) {
      if (seriesRef.current) {
        seriesRef.current.setData([])
        markersRef.current?.setMarkers([])
      }
      return
    }

    const candleData: CandlestickData<Time>[] = filteredCandles.map((c) => {
      const t: Time =
        (c as TwelveDataCandle & { timestamp?: number }).timestamp != null
          ? ((c as TwelveDataCandle & { timestamp?: number }).timestamp as UTCTimestamp)
          : (c.time as Time)
      return {
        time: t,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }
    })

    seriesRef.current.setData(candleData)

    const toSeriesTime = (c: TwelveDataCandle): Time => {
      const ts = (c as TwelveDataCandle & { timestamp?: number }).timestamp
      return (ts != null ? ts : c.time) as Time
    }

    const markers: SeriesMarker<Time>[] = []
    for (const c of filteredCandles) {
      const signal = (c as TwelveDataCandle & { signal?: string }).signal?.toLowerCase()
      if (!signal) continue
      const time = toSeriesTime(c)
      if (signal === "buy") {
        markers.push({
          time,
          position: "belowBar",
          shape: "arrowUp",
          color: "#26a69a",
          text: "Buy",
        })
      } else if (signal === "sell") {
        markers.push({
          time,
          position: "aboveBar",
          shape: "arrowDown",
          color: "#ef5350",
          text: "Sell",
        })
      }
    }

    requestAnimationFrame(() => {
      markersRef.current?.setMarkers(markers)
    })
    chartRef.current?.timeScale().fitContent()
  }, [filteredCandles])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError(null)
      setLoading(true)
      try {
        const candles = await getBotPerformanceCandles(DEFAULT_ADMIN_EMAIL, config.productSlug)
        if (cancelled) return
        if (candles.length === 0) {
          setCandles([])
          setFileName(null)
          setError("No performance data found in Firestore.")
          return
        }
        setCandles(candles)
        const dates = [...new Set(candles.map((c) => c.time.slice(0, 10)))].sort()
        if (dates.length > 0) setSelectedDate(dates[dates.length - 1])
        setFileName(`${config.productSlug} (${dates.length} day(s))`)
      } catch (err) {
        if (!cancelled) {
          setCandles([])
          setFileName(null)
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load performance data from Firestore."
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [config.productSlug])

  return (
    <Card className="border-zinc-800 bg-zinc-900/70">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold text-zinc-100">
            {displayName}
          </CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            Performance data is loaded from Firestore.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded border border-zinc-700 bg-zinc-900/80 p-0.5">
              {(["all", "day"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? "bg-emerald-600 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {mode === "all" ? "All data" : "Day"}
                </button>
              ))}
            </div>
            {viewMode === "day" && availableDates.length > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1.5">
                <CalendarDays className="h-4 w-4 text-zinc-500" />
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={availableDates[0]}
                  max={availableDates[availableDates.length - 1]}
                  className="bg-transparent text-sm text-zinc-300 outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-zinc-500">
          <span className="text-zinc-300 font-medium">{displayName}</span> · {config.description}
          {config.targetReturnPct != null && (
            <>
              {" "}
              · Target display return:{" "}
              <span className="text-emerald-400 font-medium">
                {config.targetReturnPct.toFixed(2)}%
              </span>
            </>
          )}
        </p>
        {fileName && (
          <p className="text-xs text-zinc-500">
            CSV: <span className="text-zinc-300 font-medium">{fileName}</span> ·{" "}
            {candles.length} bars
            {viewMode === "day" && (
              <> · Viewing <span className="text-zinc-300 font-medium">{effectiveDate}</span> ({filteredCandles.length} bars)</>
            )}
          </p>
        )}
        {error && <p className="text-xs text-amber-500">{error}</p>}
        {candles.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs">
              <span className="text-zinc-500">
                Investment:{" "}
                <span className="text-zinc-300 font-medium">
                  {formatDollars(INITIAL_INVESTMENT)}
                </span>
              </span>
              <span>
                Current value:{" "}
                <span
                  className={
                    performance.currentValue >= INITIAL_INVESTMENT
                      ? "text-emerald-400 font-medium"
                      : "text-red-400 font-medium"
                  }
                >
                  {formatDollars(performance.currentValue)}
                </span>
              </span>
              <span>
                Total P&L:{" "}
                <span
                  className={
                    performance.totalPnl >= 0
                      ? "text-emerald-400 font-medium"
                      : "text-red-400 font-medium"
                  }
                >
                  {formatDollars(performance.totalPnl)} (
                  {performance.totalPnl >= 0 ? "+" : ""}
                  {performance.totalReturnPct.toFixed(1)}%)
                </span>
              </span>
              <span className="text-zinc-500">
                Win rate:{" "}
                <span className="text-zinc-300 font-medium">
                  {performance.winRate.toFixed(1)}%
                </span>
                {" · "}
                {performance.tradesCount} trades (1:3 R:R)
              </span>
              {viewMode === "day" && (
                <span>
                  Selected day:{" "}
                  <span
                    className={
                      performance.dayPnl >= 0
                        ? "text-emerald-400 font-medium"
                        : "text-red-400 font-medium"
                    }
                  >
                    {formatDollars(performance.dayPnl)}
                  </span>
                  {" · "}
                  <span className="text-zinc-300 font-medium">
                    {performance.dayTradesCount} trades
                  </span>
                </span>
              )}
            </div>
          </div>
        )}
        <div className="relative rounded-lg border border-zinc-800 bg-[#131722] overflow-hidden">
          <div className="relative h-[400px] w-full">
            <div ref={containerRef} className="relative h-full w-full" />
            <div ref={tooltipContainerRef} className="pointer-events-none absolute inset-0 z-10" />
          </div>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#131722]/90 pointer-events-none">
              <p className="text-sm text-zinc-500">Reading CSV…</p>
            </div>
          )}
          {!loading && candles.length === 0 && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#131722]/90 pointer-events-none">
              <div className="text-center space-y-1">
                <p className="text-sm text-zinc-400">
                  Upload a CSV file with OHLC data to see bot performance.
                </p>
                <p className="text-xs text-zinc-500">
                  Expected columns: time, open, high, low, close (same as existing XAUUSD CSVs).
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface BotCsvPerformanceChartProps {
  initialBot?: BotId
}

export function BotCsvPerformanceChart(_props: BotCsvPerformanceChartProps) {
  const products = useProductsStore((s) => s.products)

  const b1 = resolveBotRuntime(BOT_CONFIGS["1"], products)
  const b2 = resolveBotRuntime(BOT_CONFIGS["2"], products)
  const b3 = resolveBotRuntime(BOT_CONFIGS["3"], products)

  return (
    <div className="space-y-6">
      <BotPerformanceSection
        config={{ ...BOT_CONFIGS["1"], productSlug: b1.productSlug }}
        displayName={b1.displayName}
      />
      <BotPerformanceSection
        config={{ ...BOT_CONFIGS["2"], productSlug: b2.productSlug }}
        displayName={b2.displayName}
      />
      <BotPerformanceSection
        config={{ ...BOT_CONFIGS["3"], productSlug: b3.productSlug }}
        displayName={b3.displayName}
      />
    </div>
  )
}

