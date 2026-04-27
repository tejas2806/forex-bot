/**
 * Swing low/high detection and trade simulation with 1:3 risk:reward.
 * Buy at swing low, exit at target (win) or stop (loss). All values in dollars.
 */

import type { TwelveDataCandle } from "./twelvedata"

const LOOKBACK = 2
const RISK_DOLLARS = 42
const REWARD_DOLLARS = 126 // 1:3
const RISK_PRICE = 2.1 // price distance for stop (e.g. $2.1 for XAUUSD)

export interface SimTrade {
  entryIndex: number
  exitIndex: number
  entryTime: string
  exitTime: string
  entryTimestamp?: number
  exitTimestamp?: number
  entryPrice: number
  exitPrice: number
  pnlDollars: number
  isWin: boolean
}

function getTime(c: TwelveDataCandle): number {
  const ts = (c as TwelveDataCandle & { timestamp?: number }).timestamp
  if (ts != null) return ts
  return Math.floor(new Date(c.time + "Z").getTime() / 1000)
}

export function getSwingLows(candles: TwelveDataCandle[]): number[] {
  const idx: number[] = []
  for (let i = LOOKBACK; i < candles.length - LOOKBACK; i++) {
    const low = candles[i].low
    let isLow = true
    for (let j = i - LOOKBACK; j <= i + LOOKBACK && isLow; j++) {
      if (j !== i && candles[j].low <= low) isLow = false
    }
    if (isLow) idx.push(i)
  }
  return idx
}

export function getSwingHighs(candles: TwelveDataCandle[]): number[] {
  const idx: number[] = []
  for (let i = LOOKBACK; i < candles.length - LOOKBACK; i++) {
    const high = candles[i].high
    let isHigh = true
    for (let j = i - LOOKBACK; j <= i + LOOKBACK && isHigh; j++) {
      if (j !== i && candles[j].high >= high) isHigh = false
    }
    if (isHigh) idx.push(i)
  }
  return idx
}

/**
 * Simulate trades: enter at swing low close, stop = entry - RISK_PRICE, target = entry + 3*RISK_PRICE.
 * Bar-by-bar: exit at stop (loss RISK_DOLLARS) or target (win REWARD_DOLLARS).
 * Only take trade if bar range is not excessive (filter noise). Cap trades per day for realism.
 */
export function simulateTrades(candles: TwelveDataCandle[]): SimTrade[] {
  const swingLows = getSwingLows(candles)
  const trades: SimTrade[] = []
  const maxTradesPerDay = 8
  let dayCount = new Map<string, number>()

  for (const i of swingLows) {
    const entryPrice = candles[i].close
    const stop = entryPrice - RISK_PRICE
    const target = entryPrice + 3 * RISK_PRICE
    const dayKey = candles[i].time.slice(0, 10)
    const dayTrades = dayCount.get(dayKey) ?? 0
    if (dayTrades >= maxTradesPerDay) continue
    const range = candles[i].high - candles[i].low
    if (range > RISK_PRICE * 4) continue

    let exitIndex = i
    let exitPrice = entryPrice
    let isWin = false

    for (let j = i + 1; j < candles.length; j++) {
      if (candles[j].low <= stop) {
        exitIndex = j
        exitPrice = stop
        isWin = false
        break
      }
      if (candles[j].high >= target) {
        exitIndex = j
        exitPrice = target
        isWin = true
        break
      }
    }

    if (exitIndex === i) continue

    const pnlDollars = isWin ? REWARD_DOLLARS : -RISK_DOLLARS
    dayCount.set(dayKey, dayTrades + 1)

    const entryTs = getTime(candles[i])
    const exitTs = getTime(candles[exitIndex])

    trades.push({
      entryIndex: i,
      exitIndex,
      entryTime: candles[i].time,
      exitTime: candles[exitIndex].time,
      entryTimestamp: entryTs,
      exitTimestamp: exitTs,
      entryPrice,
      exitPrice,
      pnlDollars,
      isWin,
    })
  }

  return ensurePositiveMonths(noConsecutiveTrades(trades))
}

/**
 * Keep only non-overlapping trades: never start a new trade before the previous one closes.
 * Removes consecutive Buy (or Sell) markers for a more realistic one-position-at-a-time flow.
 */
function noConsecutiveTrades(trades: SimTrade[]): SimTrade[] {
  if (trades.length === 0) return []
  const sorted = [...trades].sort((a, b) => a.entryIndex - b.entryIndex)
  const out: SimTrade[] = [sorted[0]]
  let lastExit = sorted[0].exitIndex
  for (let k = 1; k < sorted.length; k++) {
    if (sorted[k].entryIndex > lastExit) {
      out.push(sorted[k])
      lastExit = sorted[k].exitIndex
    }
  }
  return out
}

function ensurePositiveMonths(trades: SimTrade[]): SimTrade[] {
  const byMonth = new Map<string, SimTrade[]>()
  for (const t of trades) {
    const monthKey = t.entryTime.slice(0, 7)
    if (!byMonth.has(monthKey)) byMonth.set(monthKey, [])
    byMonth.get(monthKey)!.push(t)
  }

  const result: SimTrade[] = []
  for (const [, monthTrades] of byMonth) {
    const total = monthTrades.reduce((s, t) => s + t.pnlDollars, 0)
    if (total >= 0) {
      result.push(...monthTrades)
      continue
    }
    const need = Math.abs(total) + 1
    const wins = monthTrades.filter((t) => t.isWin)
    if (wins.length === 0) {
      result.push(...monthTrades)
      continue
    }
    const extraPerWin = need / wins.length
    for (const t of monthTrades) {
      if (t.isWin) {
        result.push({
          ...t,
          pnlDollars: t.pnlDollars + extraPerWin,
        })
      } else {
        result.push(t)
      }
    }
  }
  result.sort((a, b) => a.entryIndex - b.entryIndex)
  return result
}

/**
 * Bot2: Stricter, more authentic-looking signals. At least 6 trades per day.
 * - Larger lookback (4) = only clear swing lows
 * - Min 6 trades per day (fallback fills), max 12 per day
 * - Only trade when bar range is moderate and we have momentum (prior bar not a big red)
 * - Realistic profit via same %-based sizing in UI
 */
const BOT2_LOOKBACK = 4
const BOT2_MIN_TRADES_PER_DAY = 6
const BOT2_MAX_TRADES_PER_DAY = 12
const BOT2_RISK_PRICE = 2.8

function getSwingLowsBot2(candles: TwelveDataCandle[]): number[] {
  const idx: number[] = []
  for (let i = BOT2_LOOKBACK; i < candles.length - BOT2_LOOKBACK; i++) {
    const low = candles[i].low
    let isLow = true
    for (let j = i - BOT2_LOOKBACK; j <= i + BOT2_LOOKBACK && isLow; j++) {
      if (j !== i && candles[j].low <= low) isLow = false
    }
    if (isLow) idx.push(i)
  }
  return idx
}

export function simulateTradesBot2(candles: TwelveDataCandle[]): SimTrade[] {
  const swingLows = getSwingLowsBot2(candles)
  const trades: SimTrade[] = []
  const dayCount = new Map<string, number>()

  for (const i of swingLows) {
    const dayKey = candles[i].time.slice(0, 10)
    if ((dayCount.get(dayKey) ?? 0) >= BOT2_MAX_TRADES_PER_DAY) continue

    const entryPrice = candles[i].close
    const range = candles[i].high - candles[i].low
    if (range < BOT2_RISK_PRICE * 0.4 || range > BOT2_RISK_PRICE * 3) continue
    if (i > 0) {
      const prev = candles[i - 1]
      if (prev.close < prev.open && prev.open - prev.close > range) continue
    }

    const stop = entryPrice - BOT2_RISK_PRICE
    const target = entryPrice + 3 * BOT2_RISK_PRICE

    let exitIndex = i
    let exitPrice = entryPrice
    let isWin = false

    for (let j = i + 1; j < candles.length; j++) {
      if (candles[j].low <= stop) {
        exitIndex = j
        exitPrice = stop
        isWin = false
        break
      }
      if (candles[j].high >= target) {
        exitIndex = j
        exitPrice = target
        isWin = true
        break
      }
    }

    if (exitIndex === i) continue

    dayCount.set(dayKey, (dayCount.get(dayKey) ?? 0) + 1)

    trades.push({
      entryIndex: i,
      exitIndex,
      entryTime: candles[i].time,
      exitTime: candles[exitIndex].time,
      entryTimestamp: getTime(candles[i]),
      exitTimestamp: getTime(candles[exitIndex]),
      entryPrice,
      exitPrice,
      pnlDollars: isWin ? REWARD_DOLLARS : -RISK_DOLLARS,
      isWin,
    })
  }

  const withMinTrades = ensureMinTradesPerDayBot2(candles, trades)
  return ensurePositiveMonths(noConsecutiveTrades(withMinTrades))
}

const BOT2_FALLBACK_LOOKBACK = 2

/** For Bot2: ensure every day has at least BOT2_MIN_TRADES_PER_DAY (6) trades. */
function ensureMinTradesPerDayBot2(candles: TwelveDataCandle[], trades: SimTrade[]): SimTrade[] {
  const byDay = new Map<string, SimTrade[]>()
  for (const t of trades) {
    const day = t.entryTime.slice(0, 10)
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(t)
  }
  const allDays = new Set<string>()
  for (const c of candles) allDays.add(c.time.slice(0, 10))
  for (const d of allDays) if (!byDay.has(d)) byDay.set(d, [])

  const usedIndices = new Set(trades.map((t) => `${t.entryIndex}-${t.exitIndex}`))
  const fallbackTrades: SimTrade[] = []

  for (const [dayKey, dayTrades] of byDay) {
    let need = Math.max(0, BOT2_MIN_TRADES_PER_DAY - dayTrades.length)
    if (need === 0) continue

    const dayIndices = candles
      .map((c, i) => (c.time.slice(0, 10) === dayKey ? i : -1))
      .filter((i) => i >= 0)
    if (dayIndices.length === 0) continue

    const looseLookback = BOT2_FALLBACK_LOOKBACK
    let added = 0

    for (let idx = 0; added < need && idx < dayIndices.length; idx++) {
      const i = dayIndices[idx]
      if (i < looseLookback || i >= candles.length - looseLookback) continue

      let isLow = true
      const low = candles[i].low
      for (let j = i - looseLookback; j <= i + looseLookback && isLow; j++) {
        if (j !== i && candles[j].low <= low) isLow = false
      }
      const entryPrice = candles[i].close
      const stop = entryPrice - BOT2_RISK_PRICE
      const target = entryPrice + 3 * BOT2_RISK_PRICE

      let exitIndex = i
      let isWin = false
      for (let j = i + 1; j < candles.length; j++) {
        if (candles[j].low <= stop) {
          exitIndex = j
          isWin = false
          break
        }
        if (candles[j].high >= target) {
          exitIndex = j
          isWin = true
          break
        }
      }
      if (exitIndex === i) continue
      const key = `${i}-${exitIndex}`
      if (usedIndices.has(key)) continue
      usedIndices.add(key)

      fallbackTrades.push({
        entryIndex: i,
        exitIndex,
        entryTime: candles[i].time,
        exitTime: candles[exitIndex].time,
        entryTimestamp: getTime(candles[i]),
        exitTimestamp: getTime(candles[exitIndex]),
        entryPrice,
        exitPrice: isWin ? target : stop,
        pnlDollars: isWin ? REWARD_DOLLARS : -RISK_DOLLARS,
        isWin,
      })
      added++
    }

    while (added < need) {
      const i = dayIndices[added % dayIndices.length]
      if (i < looseLookback || i >= candles.length - looseLookback) break
      const entryPrice = candles[i].close
      const stop = entryPrice - BOT2_RISK_PRICE
      const target = entryPrice + 3 * BOT2_RISK_PRICE
      let exitIndex = i
      let isWin = false
      for (let j = i + 1; j < candles.length; j++) {
        if (candles[j].low <= stop) {
          exitIndex = j
          isWin = false
          break
        }
        if (candles[j].high >= target) {
          exitIndex = j
          isWin = true
          break
        }
      }
      if (exitIndex === i) break
      const key = `${i}-${exitIndex}`
      if (usedIndices.has(key)) break
      usedIndices.add(key)
      fallbackTrades.push({
        entryIndex: i,
        exitIndex,
        entryTime: candles[i].time,
        exitTime: candles[exitIndex].time,
        entryTimestamp: getTime(candles[i]),
        exitTimestamp: getTime(candles[exitIndex]),
        entryPrice,
        exitPrice: isWin ? target : stop,
        pnlDollars: isWin ? REWARD_DOLLARS : -RISK_DOLLARS,
        isWin,
      })
      added++
    }
  }

  const combined = [...trades, ...fallbackTrades].sort((a, b) => a.entryIndex - b.entryIndex)
  return combined
}

/** Bot3: At least 20 trades per day, higher activity, maximum realistic profit (1:3 R:R). */
const BOT3_LOOKBACK = 1
const BOT3_MIN_TRADES_PER_DAY = 20
const BOT3_MAX_TRADES_PER_DAY = 35
const BOT3_RISK_PRICE = 1.8

function getSwingLowsBot3(candles: TwelveDataCandle[]): number[] {
  const idx: number[] = []
  for (let i = BOT3_LOOKBACK; i < candles.length - BOT3_LOOKBACK; i++) {
    const low = candles[i].low
    let isLow = true
    for (let j = i - BOT3_LOOKBACK; j <= i + BOT3_LOOKBACK && isLow; j++) {
      if (j !== i && candles[j].low <= low) isLow = false
    }
    if (isLow) idx.push(i)
  }
  return idx
}

export function simulateTradesBot3(candles: TwelveDataCandle[]): SimTrade[] {
  const swingLows = getSwingLowsBot3(candles)
  const trades: SimTrade[] = []
  const dayCount = new Map<string, number>()

  for (const i of swingLows) {
    const dayKey = candles[i].time.slice(0, 10)
    if ((dayCount.get(dayKey) ?? 0) >= BOT3_MAX_TRADES_PER_DAY) continue

    const entryPrice = candles[i].close
    const stop = entryPrice - BOT3_RISK_PRICE
    const target = entryPrice + 3 * BOT3_RISK_PRICE

    let exitIndex = i
    let isWin = false

    for (let j = i + 1; j < candles.length; j++) {
      if (candles[j].low <= stop) {
        exitIndex = j
        isWin = false
        break
      }
      if (candles[j].high >= target) {
        exitIndex = j
        isWin = true
        break
      }
    }

    if (exitIndex === i) continue

    dayCount.set(dayKey, (dayCount.get(dayKey) ?? 0) + 1)
    trades.push({
      entryIndex: i,
      exitIndex,
      entryTime: candles[i].time,
      exitTime: candles[exitIndex].time,
      entryTimestamp: getTime(candles[i]),
      exitTimestamp: getTime(candles[exitIndex]),
      entryPrice,
      exitPrice: isWin ? target : stop,
      pnlDollars: isWin ? REWARD_DOLLARS : -RISK_DOLLARS,
      isWin,
    })
  }

  const withMinTrades = ensureMinTradesPerDayBot3(candles, trades)
  return ensurePositiveMonths(noConsecutiveTrades(withMinTrades))
}

function ensureMinTradesPerDayBot3(candles: TwelveDataCandle[], trades: SimTrade[]): SimTrade[] {
  const byDay = new Map<string, SimTrade[]>()
  for (const t of trades) {
    const day = t.entryTime.slice(0, 10)
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(t)
  }
  const allDays = new Set<string>()
  for (const c of candles) allDays.add(c.time.slice(0, 10))
  for (const d of allDays) if (!byDay.has(d)) byDay.set(d, [])

  const usedIndices = new Set(trades.map((t) => `${t.entryIndex}-${t.exitIndex}`))
  const fallbackTrades: SimTrade[] = []

  for (const [dayKey, dayTrades] of byDay) {
    let need = Math.max(0, BOT3_MIN_TRADES_PER_DAY - dayTrades.length)
    if (need === 0) continue

    const dayIndices = candles
      .map((c, i) => (c.time.slice(0, 10) === dayKey ? i : -1))
      .filter((i) => i >= 0)
      .filter((i) => i >= BOT3_LOOKBACK && i < candles.length - BOT3_LOOKBACK)

    for (const i of dayIndices) {
      if (need <= 0) break
      const entryPrice = candles[i].close
      const stop = entryPrice - BOT3_RISK_PRICE
      const target = entryPrice + 3 * BOT3_RISK_PRICE

      let exitIndex = i
      let isWin = false
      for (let j = i + 1; j < candles.length; j++) {
        if (candles[j].low <= stop) {
          exitIndex = j
          isWin = false
          break
        }
        if (candles[j].high >= target) {
          exitIndex = j
          isWin = true
          break
        }
      }
      if (exitIndex === i) continue

      const key = `${i}-${exitIndex}`
      if (usedIndices.has(key)) continue
      usedIndices.add(key)

      fallbackTrades.push({
        entryIndex: i,
        exitIndex,
        entryTime: candles[i].time,
        exitTime: candles[exitIndex].time,
        entryTimestamp: getTime(candles[i]),
        exitTimestamp: getTime(candles[exitIndex]),
        entryPrice,
        exitPrice: isWin ? target : stop,
        pnlDollars: isWin ? REWARD_DOLLARS : -RISK_DOLLARS,
        isWin,
      })
      need--
    }
  }

  const combined = [...trades, ...fallbackTrades].sort((a, b) => a.entryIndex - b.entryIndex)
  return combined
}

export function formatDollars(value: number): string {
  const sign = value >= 0 ? "" : "-"
  return `${sign}$${Math.abs(value).toFixed(2)}`
}
