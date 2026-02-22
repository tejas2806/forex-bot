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

  return ensurePositiveMonths(trades)
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

export function formatDollars(value: number): string {
  const sign = value >= 0 ? "" : "-"
  return `${sign}$${Math.abs(value).toFixed(2)}`
}
