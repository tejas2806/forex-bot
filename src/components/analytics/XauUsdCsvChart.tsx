import { useEffect, useMemo, useRef, useState } from "react"
import { createChart, CandlestickSeries, createSeriesMarkers, ColorType } from "lightweight-charts"
import type { CandlestickData, Time, UTCTimestamp } from "lightweight-charts"
import type { SeriesMarker } from "lightweight-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { parseCSVToCandles, type TwelveDataCandle } from "@/lib/twelvedata"
import { simulateTrades, formatDollars } from "@/lib/swingStrategy"
import { CalendarDays } from "lucide-react"

const CSV_URLS = {
  "5min": "/xauusd_5min_last6m.csv",
  "15min": "/xauusd_15min_last6m.csv",
} as const

type Timeframe = "5min" | "15min"

export function XauUsdCsvChart() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [timeframe, setTimeframe] = useState<Timeframe>("15min")
  const [candles, setCandles] = useState<TwelveDataCandle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const seriesRef = useRef<ReturnType<ReturnType<typeof createChart>["addSeries"]> | null>(null)
  const markersRef = useRef<ReturnType<typeof createSeriesMarkers<Time>> | null>(null)

  useEffect(() => {
    setError(null)
    setLoading(true)
    fetch(CSV_URLS[timeframe])
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load CSV: ${res.status}`)
        return res.text()
      })
      .then((text) => {
        const parsed = parseCSVToCandles(text)
        if (parsed.length === 0) throw new Error("No valid rows in CSV")
        setCandles(parsed)
        const lastDate = parsed[parsed.length - 1]?.time.slice(0, 10)
        if (lastDate) setSelectedDate(lastDate)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load data"))
      .finally(() => setLoading(false))
  }, [timeframe])

  const filteredCandles = candles.filter((c) => c.time.slice(0, 10) === selectedDate)

  const allTrades = useMemo(() => (candles.length > 0 ? simulateTrades(candles) : []), [candles])
  const dayTrades = useMemo(
    () => allTrades.filter((t) => t.entryTime.slice(0, 10) === selectedDate),
    [allTrades, selectedDate]
  )
  const monthKey = selectedDate.slice(0, 7)

  const INITIAL_INVESTMENT = 1000
  const RISK_PCT_PER_TRADE = 0.0005 // 0.05% of balance at risk per trade (1:3 R:R) for realistic growth

  const performance = useMemo(() => {
    let balance = INITIAL_INVESTMENT
    const pnlByTrade: { date: string; monthKey: string; pnl: number }[] = []
    for (const t of allTrades) {
      const risk = Math.max(0.5, balance * RISK_PCT_PER_TRADE)
      const reward = risk * 3
      const pnl = t.isWin ? reward : -risk
      balance = Math.max(100, balance + pnl)
      pnlByTrade.push({
        date: t.entryTime.slice(0, 10),
        monthKey: t.entryTime.slice(0, 7),
        pnl,
      })
    }
    const totalPnl = balance - INITIAL_INVESTMENT
    const totalReturnPct = INITIAL_INVESTMENT > 0 ? (totalPnl / INITIAL_INVESTMENT) * 100 : 0
    const dayPnl = pnlByTrade.filter((p) => p.date === selectedDate).reduce((s, p) => s + p.pnl, 0)
    const monthPnl = pnlByTrade.filter((p) => p.monthKey === monthKey).reduce((s, p) => s + p.pnl, 0)
    const wins = allTrades.filter((t) => t.isWin).length
    const winRate = allTrades.length > 0 ? (wins / allTrades.length) * 100 : 0
    return {
      dayPnl,
      monthPnl,
      totalPnl,
      winRate,
      tradesCount: allTrades.length,
      currentValue: balance,
      totalReturnPct,
    }
  }, [allTrades, selectedDate, monthKey])

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
    markersRef.current = seriesMarkers as ReturnType<typeof createSeriesMarkers<Time>>

    const container = containerRef.current
    const tooltip = document.createElement("div")
    tooltip.style.cssText =
      "position: absolute; display: none; padding: 8px 10px; z-index: 1000; pointer-events: none; " +
      "border: 1px solid #2B2B43; border-radius: 4px; background: rgba(19,23,34,0.95); " +
      "color: #d1d4dc; font-size: 12px; font-family: inherit; min-width: 140px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"
    container.appendChild(tooltip)

    const crosshairHandler = (param: { point?: { x: number; y: number }; time?: unknown; seriesData: Map<unknown, unknown> }) => {
      if (param.point == null || !param.time || param.point.x < 0 || param.point.y < 0 || !container) {
        tooltip.style.display = "none"
        return
      }
      const bar = param.seriesData.get(series) as { open: number; high: number; low: number; close: number } | undefined
      if (!bar || typeof bar !== "object" || !("close" in bar)) {
        tooltip.style.display = "none"
        return
      }
      const t = param.time
      const timeLabel =
        typeof t === "number"
          ? new Date(t * 1000).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
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
      let left = param.point.x + margin
      if (left + 160 > container.clientWidth) left = param.point.x - margin - 160
      let top = param.point.y + margin
      if (top + 80 > container.clientHeight) top = param.point.y - margin - 80
      if (top < 0) top = margin
      tooltip.style.left = `${Math.max(0, left)}px`
      tooltip.style.top = `${Math.max(0, top)}px`
    }
    chart.subscribeCrosshairMove(crosshairHandler)

    const resize = () => {
      if (containerRef.current && chartRef.current)
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
    }
    window.addEventListener("resize", resize)

    return () => {
      chart.unsubscribeCrosshairMove(crosshairHandler)
      if (container.contains(tooltip)) container.removeChild(tooltip)
      window.removeEventListener("resize", resize)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
      markersRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current || filteredCandles.length === 0) return

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
    for (const trade of dayTrades) {
      const entryCandle = filteredCandles.find(
        (c) =>
          (c as TwelveDataCandle & { timestamp?: number }).timestamp === trade.entryTimestamp ||
          c.time === trade.entryTime
      )
      const exitCandle = filteredCandles.find(
        (c) =>
          (c as TwelveDataCandle & { timestamp?: number }).timestamp === trade.exitTimestamp ||
          c.time === trade.exitTime
      )
      if (entryCandle) {
        markers.push({
          time: toSeriesTime(entryCandle),
          position: "belowBar" as const,
          shape: "arrowUp" as const,
          color: "#26a69a",
          text: "Buy",
        })
      }
      if (exitCandle) {
        markers.push({
          time: toSeriesTime(exitCandle),
          position: "aboveBar" as const,
          shape: "arrowDown" as const,
          color: "#ef5350",
          text: "Sell",
        })
      }
    }
    requestAnimationFrame(() => {
      markersRef.current?.setMarkers(markers)
    })
    chartRef.current?.timeScale().fitContent()
  }, [filteredCandles, dayTrades])

  return (
    <Card className="border-zinc-800 bg-zinc-900/70">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-semibold text-zinc-100">
          Bot1 performance
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1.5">
            <CalendarDays className="h-4 w-4 text-zinc-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm text-zinc-300 outline-none"
            />
          </div>
          <div className="inline-flex rounded border border-zinc-700 bg-zinc-900/80 p-0.5">
            {(["5min", "15min"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeframe === tf
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tf === "5min" ? "5 Min" : "15 Min"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <p className="text-sm text-amber-500">{error}</p>
        )}
        {!loading && candles.length > 0 && (
          <>
            <p className="text-xs text-zinc-500">
              {candles.length} bars · {filteredCandles.length} on {selectedDate} · {timeframe === "5min" ? "5 Min" : "15 Min"}
            </p>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs">
                <span className="text-zinc-500">
                  Investment: <span className="text-zinc-300 font-medium">{formatDollars(INITIAL_INVESTMENT)}</span>
                </span>
                <span>
                  Current value:{" "}
                  <span className={performance.currentValue >= INITIAL_INVESTMENT ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
                    {formatDollars(performance.currentValue)}
                  </span>
                </span>
                <span>
                  Total P&L:{" "}
                  <span className={performance.totalPnl >= 0 ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
                    {formatDollars(performance.totalPnl)} ({performance.totalPnl >= 0 ? "+" : ""}{performance.totalReturnPct.toFixed(1)}%)
                  </span>
                </span>
                <span className="text-zinc-500">
                  Win rate: <span className="text-zinc-300 font-medium">{performance.winRate.toFixed(1)}%</span>
                  {" · "}
                  {performance.tradesCount} trades (1:3 R:R)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-1.5 text-xs text-zinc-500">
                <span>
                  Today:{" "}
                  <span className={performance.dayPnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {formatDollars(performance.dayPnl)}
                  </span>
                </span>
                <span>
                  This month:{" "}
                  <span className={performance.monthPnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {formatDollars(performance.monthPnl)}
                  </span>
                </span>
              </div>
            </div>
          </>
        )}
        <div className="relative rounded-lg border border-zinc-800 bg-[#131722] overflow-hidden">
          <div ref={containerRef} className="h-[400px] w-full" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#131722]/90 pointer-events-none">
              <p className="text-sm text-zinc-500">Loading {timeframe === "5min" ? "5 min" : "15 min"} data…</p>
            </div>
          )}
          {!loading && candles.length === 0 && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#131722]/90 pointer-events-none">
              <p className="text-sm text-zinc-500">No data. Add xauusd_5min_last6m.csv and xauusd_15min_last6m.csv to public/</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
