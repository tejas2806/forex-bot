import type { CSSProperties } from "react"

type Signal = "buy" | "sell"

interface CandleData {
  open: number
  high: number
  low: number
  close: number
  signal?: Signal
}

const OHLC: CandleData[] = [
  { open: 2318, high: 2322, low: 2312, close: 2315 },
  { open: 2315, high: 2326, low: 2313, close: 2323, signal: "buy" },
  { open: 2323, high: 2332, low: 2320, close: 2330 },
  { open: 2330, high: 2334, low: 2324, close: 2327 },
  { open: 2327, high: 2338, low: 2325, close: 2336 },
  { open: 2336, high: 2344, low: 2331, close: 2342 },
  { open: 2342, high: 2347, low: 2337, close: 2339, signal: "sell" },
  { open: 2339, high: 2343, low: 2331, close: 2334 },
  { open: 2334, high: 2340, low: 2328, close: 2338, signal: "buy" },
  { open: 2338, high: 2349, low: 2334, close: 2346 },
  { open: 2346, high: 2352, low: 2341, close: 2343 },
  { open: 2343, high: 2348, low: 2336, close: 2339, signal: "sell" },
  { open: 2339, high: 2344, low: 2331, close: 2335 },
  { open: 2335, high: 2342, low: 2332, close: 2338 },
]

export function HeroCandlestickAnimation() {
  const maxPrice = Math.max(...OHLC.map((c) => c.high))
  const minPrice = Math.min(...OHLC.map((c) => c.low))
  const range = Math.max(maxPrice - minPrice, 1)

  const toY = (price: number) => ((maxPrice - price) / range) * 100

  return (
    <div className="relative mt-10 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 hero-candle-scan" />
      <div className="mb-3 flex items-center justify-between text-xs text-zinc-500">
        <span>XAUUSD · 5m</span>
        <span>Live strategy pulse: automation + signals</span>
      </div>
      <div className="relative h-56 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-4 pb-5 pt-3">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-zinc-800/80" />
        <div className="pointer-events-none absolute inset-x-0 top-[25%] border-t border-zinc-900" />
        <div className="pointer-events-none absolute inset-x-0 top-[75%] border-t border-zinc-900" />

        <div className="relative h-full w-full">
          {OHLC.map((candle, index) => {
            const left = (index / (OHLC.length - 1)) * 100
            const delay = `${index * 150}ms`
            const bullish = candle.close >= candle.open
            const bodyTop = Math.min(toY(candle.open), toY(candle.close))
            const bodyBottom = Math.max(toY(candle.open), toY(candle.close))
            const bodyHeight = Math.max(bodyBottom - bodyTop, 2)
            const wickTop = toY(candle.high)
            const wickHeight = Math.max(toY(candle.low) - wickTop, 2)

            return (
              <div
                key={index}
                className="absolute inset-y-0 w-5"
                style={{ left: `${left}%`, transform: "translateX(-50%)" }}
              >
                <div
                  className={`hero-candle-wick absolute left-1/2 w-[4px] -translate-x-1/2 rounded-full ${
                    bullish ? "bg-emerald-400/70" : "bg-rose-400/70"
                  }`}
                  style={
                    {
                      "--delay": delay,
                      top: `${wickTop}%`,
                      height: `${wickHeight}%`,
                    } as CSSProperties
                  }
                />
                <div
                  className={`hero-candle-body absolute left-1/2 w-[14px] -translate-x-1/2 rounded-sm shadow-[0_0_10px_rgba(0,0,0,0.25)] ${
                    bullish ? "bg-emerald-400/90" : "bg-rose-400/90"
                  }`}
                  style={
                    {
                      "--delay": delay,
                      top: `${bodyTop}%`,
                      height: `${bodyHeight}%`,
                    } as CSSProperties
                  }
                />
                {candle.signal && (
                  <div
                    className="hero-signal absolute left-1/2 -translate-x-1/2"
                    style={
                      {
                        "--delay": `calc(${delay} + 220ms)`,
                        top: candle.signal === "buy" ? `${Math.max(bodyTop - 17, 2)}%` : `${bodyBottom + 2}%`,
                      } as CSSProperties
                    }
                  >
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        candle.signal === "buy"
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                          : "border-rose-400/40 bg-rose-500/15 text-rose-300"
                      }`}
                    >
                      {candle.signal}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        We build forex bots that detect high-probability setups and trigger actionable buy/sell signals in real time.
      </p>
    </div>
  )
}
