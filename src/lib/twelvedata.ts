/**
 * Twelve Data API (twelvedata.com/forex) – time series and CSV download.
 * Set VITE_TWELVEDATA_API_KEY in .env for live data.
 */

const BASE = "https://api.twelvedata.com"

export type TwelveDataInterval = "1day" | "1week" | "1month" | "5min" | "15min"

export interface TwelveDataCandle {
  /** Date only "YYYY-MM-DD" for daily+, or full "YYYY-MM-DD HH:mm:ss" for intraday */
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
  /** UTC seconds, for lightweight-charts intraday */
  timestamp?: number
}

export interface TwelveDataResponse {
  status: string
  values?: Array<{
    datetime: string
    open: string
    high: string
    low: string
    close: string
    volume?: string
  }>
  message?: string
  code?: number
}

function getApiKey(): string {
  return import.meta.env.VITE_TWELVEDATA_API_KEY ?? ""
}

function parseCandle(
  v: {
    datetime: string
    open: string
    high: string
    low: string
    close: string
    volume?: string
  },
  useTimestamp = false
): TwelveDataCandle {
  const timeStr = v.datetime.trim()
  const datePart = timeStr.slice(0, 10)
  const timestamp = useTimestamp ? Math.floor(new Date(timeStr + "Z").getTime() / 1000) : undefined
  return {
    time: timeStr.length > 10 ? timeStr : datePart,
    open: parseFloat(v.open),
    high: parseFloat(v.high),
    low: parseFloat(v.low),
    close: parseFloat(v.close),
    volume: v.volume != null ? parseFloat(v.volume) : undefined,
    timestamp,
  }
}

export async function fetchTimeSeries(
  symbol: string,
  interval: TwelveDataInterval,
  startDate: string,
  endDate: string
): Promise<{ candles: TwelveDataCandle[]; error?: string }> {
  const apikey = getApiKey()
  if (!apikey) {
    return { candles: [], error: "No API key. Set VITE_TWELVEDATA_API_KEY in .env" }
  }

  const params = new URLSearchParams({
    symbol: symbol.replace("XAUUSD", "XAU/USD"),
    interval,
    start_date: startDate,
    end_date: endDate,
    apikey,
    format: "json",
  })

  const res = await fetch(`${BASE}/time_series?${params}`)
  const data: TwelveDataResponse = await res.json()

  if (data.status === "error" || data.code === 401) {
    return { candles: [], error: data.message ?? "API error" }
  }

  const values = data.values ?? []
  const isIntraday = interval === "5min" || interval === "15min"
  const candles = values.map((v) => parseCandle(v, isIntraday)).reverse()
  return { candles }
}

/** Minutes per period for sliding window step. */
const MINUTES_PER_INTERVAL: Record<string, number> = {
  "5min": 5,
  "15min": 15,
  "1day": 24 * 60,
  "1week": 7 * 24 * 60,
  "1month": 30 * 24 * 60,
}

/**
 * Fetch full 6 months (or from startDateTarget to endDate) using paginated requests.
 * Slides the window backward and concatenates all chunks. Use for 5min/15min to get
 * real historical intraday data.
 */
export async function fetchTimeSeriesPaginated(
  symbol: string,
  interval: TwelveDataInterval,
  startDateTarget: string,
  endDate: string,
  onProgress?: (page: number, totalBars: number) => void
): Promise<{ candles: TwelveDataCandle[]; error?: string }> {
  const apikey = getApiKey()
  if (!apikey) {
    return { candles: [], error: "No API key. Set VITE_TWELVEDATA_API_KEY in .env" }
  }

  const sym = symbol.replace("XAUUSD", "XAU/USD")
  const isIntraday = interval === "5min" || interval === "15min"
  const stepMinutes = MINUTES_PER_INTERVAL[interval] ?? 5
  const allValues: Array<{ datetime: string; open: string; high: string; low: string; close: string; volume?: string }> = []
  let currentEnd = new Date(endDate + "T23:59:59Z")
  let page = 0

  while (true) {
    const windowStart = new Date(currentEnd)
    windowStart.setDate(windowStart.getDate() - 180)
    const startStr = windowStart.toISOString().slice(0, 10)
    const endStr = currentEnd.toISOString().slice(0, 10)

    const params = new URLSearchParams({
      symbol: sym,
      interval,
      start_date: startStr,
      end_date: endStr,
      outputsize: "5000",
      timezone: "UTC",
      order: "asc",
      apikey,
      format: "json",
    })

    const res = await fetch(`${BASE}/time_series?${params}`)
    const data: TwelveDataResponse = await res.json()

    if (data.status === "error" || data.code === 401) {
      return { candles: [], error: data.message ?? "API error" }
    }

    const values = data.values ?? []
    if (values.length === 0) break

    for (const v of values) allValues.push(v)
    page++
    onProgress?.(page, allValues.length)

    const oldestStr = values[0]?.datetime ?? ""
    const oldestDt = new Date(oldestStr + (oldestStr.length <= 10 ? "T00:00:00Z" : "Z"))
    if (oldestStr.slice(0, 10) <= startDateTarget) break

    currentEnd = new Date(oldestDt.getTime() - stepMinutes * 60 * 1000)
  }

  const byTime = new Map<string, typeof allValues[0]>()
  for (const v of allValues) byTime.set(v.datetime, v)
  const sorted = [...byTime.values()].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  )
  const filtered = sorted.filter((v) => v.datetime.slice(0, 10) >= startDateTarget)
  const candles = filtered.map((v) => parseCandle(v, isIntraday))
  return { candles }
}

/**
 * Get XAU/USD last 6 months on 5min and 15min timeframes (paginated).
 * Uses sliding-window requests, dedupes and sorts. Optional onProgress(page, totalBars).
 */
export async function fetchXauUsdLast6Months(
  onProgress?: (interval: "5min" | "15min", page: number, totalBars: number) => void
): Promise<{
  data5m: TwelveDataCandle[]
  data15m: TwelveDataCandle[]
  error?: string
}> {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 6)
  const endStr = end.toISOString().slice(0, 10)
  const startStr = start.toISOString().slice(0, 10)

  const [result5m, result15m] = await Promise.all([
    fetchTimeSeriesPaginated(
      "XAU/USD",
      "5min",
      startStr,
      endStr,
      (page, totalBars) => onProgress?.("5min", page, totalBars)
    ),
    fetchTimeSeriesPaginated(
      "XAU/USD",
      "15min",
      startStr,
      endStr,
      (page, totalBars) => onProgress?.("15min", page, totalBars)
    ),
  ])

  if (result5m.error) return { data5m: [], data15m: [], error: result5m.error }
  if (result15m.error) return { data5m: result5m.candles, data15m: [], error: result15m.error }

  return {
    data5m: result5m.candles,
    data15m: result15m.candles,
  }
}

/**
 * Parse saved CSV (format: datetime,open,high,low,close,volume) into candles.
 * Adds timestamp (UTC seconds) for intraday datetime strings.
 */
export function parseCSVToCandles(csvText: string): TwelveDataCandle[] {
  const lines = csvText.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const cols = lines[0].toLowerCase().split(",").map((c) => c.trim())
  const dateIdx = cols.indexOf("datetime") >= 0 ? cols.indexOf("datetime") : 0
  const oIdx = cols.indexOf("open") >= 0 ? cols.indexOf("open") : 1
  const hIdx = cols.indexOf("high") >= 0 ? cols.indexOf("high") : 2
  const lIdx = cols.indexOf("low") >= 0 ? cols.indexOf("low") : 3
  const cIdx = cols.indexOf("close") >= 0 ? cols.indexOf("close") : 4
  const vIdx = cols.indexOf("volume") >= 0 ? cols.indexOf("volume") : 5
  const candles: TwelveDataCandle[] = []
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",")
    if (parts.length < 5) continue
    const timeStr = parts[dateIdx]?.trim() ?? ""
    const open = parseFloat(parts[oIdx])
    const high = parseFloat(parts[hIdx])
    const low = parseFloat(parts[lIdx])
    const close = parseFloat(parts[cIdx])
    if (Number.isNaN(open) || Number.isNaN(high) || Number.isNaN(low) || Number.isNaN(close)) continue
    const timestamp = timeStr.length > 10
      ? Math.floor(new Date(timeStr + (timeStr.includes("Z") ? "" : "Z")).getTime() / 1000)
      : undefined
    candles.push({
      time: timeStr.length > 10 ? timeStr : timeStr.slice(0, 10),
      open,
      high,
      low,
      close,
      volume: vIdx >= 0 && parts[vIdx]?.trim() ? parseFloat(parts[vIdx]) : undefined,
      timestamp,
    })
  }
  return candles
}

/** Build CSV string from candles (header: datetime,open,high,low,close,volume). */
export function candlesToCSV(candles: TwelveDataCandle[]): string {
  const header = "datetime,open,high,low,close,volume"
  const rows = candles.map((c) => {
    const dt = c.time
    const vol = c.volume != null ? String(c.volume) : ""
    return `${dt},${c.open},${c.high},${c.low},${c.close},${vol}`
  })
  return [header, ...rows].join("\n")
}

/** Trigger browser download of candle data as a CSV file. */
export function downloadCandlesAsCSV(candles: TwelveDataCandle[], filename: string): void {
  const csv = candlesToCSV(candles)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Fetch XAU/USD last 6 months (5m + 15m) and save both as CSV files.
 * Downloads: xauusd_5min_last6m.csv, xauusd_15min_last6m.csv
 */
export async function fetchXauUsdLast6MonthsAndSaveCSV(
  onProgress?: (interval: "5min" | "15min", page: number, totalBars: number) => void
): Promise<{ error?: string }> {
  const { data5m, data15m, error } = await fetchXauUsdLast6Months(onProgress)
  if (error) return { error }
  if (data5m.length > 0) downloadCandlesAsCSV(data5m, "xauusd_5min_last6m.csv")
  if (data15m.length > 0) downloadCandlesAsCSV(data15m, "xauusd_15min_last6m.csv")
  return {}
}

/** Download CSV from Twelve Data for the given params. */
export function downloadCSV(
  symbol: string,
  interval: TwelveDataInterval,
  startDate: string,
  endDate: string
): void {
  const apikey = getApiKey()
  const sym = symbol.replace("XAUUSD", "XAU/USD")
  const params = new URLSearchParams({
    symbol: sym,
    interval,
    start_date: startDate,
    end_date: endDate,
    apikey: apikey || "demo",
    format: "csv",
  })
  const url = `${BASE}/time_series?${params}`
  const a = document.createElement("a")
  a.href = url
  a.download = `twelvedata_${sym.replace("/", "_")}_${interval}_${startDate}_${endDate}.csv`
  a.target = "_blank"
  document.body.appendChild(a)
  a.click()
  a.remove()
}
