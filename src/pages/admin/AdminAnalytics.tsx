import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Download, ShoppingBag, DollarSign, CheckCircle2, Clock3, TrendingUp, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useOrdersStore } from "@/stores/orders-store"
import { DEFAULT_ADMIN_EMAIL, getLicenses } from "@/lib/firestore"
import type { License, Order } from "@/types"

type TrendPoint = {
  key: string
  label: string
  orders: number
  sales: number
}

function isoDate(day: Date) {
  return day.toISOString().slice(0, 10)
}

function buildTrend(orders: Order[], days: number): TrendPoint[] {
  const points: TrendPoint[] = []
  const dayMap = new Map<string, TrendPoint>()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const key = isoDate(d)
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    const point: TrendPoint = { key, label, orders: 0, sales: 0 }
    dayMap.set(key, point)
    points.push(point)
  }

  for (const order of orders) {
    const created = new Date(order.createdAt)
    if (Number.isNaN(created.getTime())) continue
    created.setHours(0, 0, 0, 0)
    const key = isoDate(created)
    const target = dayMap.get(key)
    if (!target) continue
    target.orders += 1
    if (order.status !== "cancelled") {
      target.sales += order.total
    }
  }

  return points
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function parseCountry(address: string) {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean)
  return parts[parts.length - 1] ?? "Unknown"
}

export function AdminAnalytics() {
  const navigate = useNavigate()
  const orders = useOrdersStore((s) => s.orders)
  const [licenses, setLicenses] = useState<License[]>([])
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("30d")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [monthlyTarget, setMonthlyTarget] = useState(25000)

  useEffect(() => {
    getLicenses(DEFAULT_ADMIN_EMAIL)
      .then(setLicenses)
      .catch(() => setLicenses([]))
  }, [])

  const filteredOrders = useMemo(() => {
    const now = new Date()
    let from: Date | null = null
    let to: Date | null = null
    if (range !== "all") {
      const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
      from = new Date(now)
      from.setHours(0, 0, 0, 0)
      from.setDate(from.getDate() - (days - 1))
      to = now
    }
    if (fromDate) from = new Date(`${fromDate}T00:00:00`)
    if (toDate) to = new Date(`${toDate}T23:59:59`)

    return orders.filter((o) => {
      const created = new Date(o.createdAt)
      if (Number.isNaN(created.getTime())) return false
      if (from && created < from) return false
      if (to && created > to) return false
      return true
    })
  }, [orders, range, fromDate, toDate])

  const totalOrders = filteredOrders.length
  const paidOrders = filteredOrders.filter((o) => o.status === "paid").length
  const pendingOrders = filteredOrders.filter((o) => o.status === "pending").length
  const cancelledOrders = filteredOrders.filter((o) => o.status === "cancelled").length
  const totalSales = filteredOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((acc, o) => acc + o.total, 0)
  const completedLike = filteredOrders.filter((o) => o.status === "paid" || o.status === "delivered").length
  const paidConversion = totalOrders ? (completedLike / totalOrders) * 100 : 0
  const aov = totalOrders ? totalSales / totalOrders : 0
  const uniqueBuyers = new Set(filteredOrders.map((o) => o.userEmail ?? o.userId)).size
  const arpu = uniqueBuyers ? totalSales / uniqueBuyers : 0

  const trendDays = range === "7d" ? 7 : range === "30d" ? 30 : 14
  const trend = useMemo(() => buildTrend(filteredOrders, trendDays), [filteredOrders, trendDays])
  const maxOrders = Math.max(1, ...trend.map((d) => d.orders))
  const maxSales = Math.max(1, ...trend.map((d) => d.sales))

  const ordersPoints = trend
    .map((p, i) => {
      const x = (i / Math.max(1, trend.length - 1)) * 100
      const y = 100 - (p.orders / maxOrders) * 100
      return `${x},${y}`
    })
    .join(" ")

  const salesPoints = trend
    .map((p, i) => {
      const x = (i / Math.max(1, trend.length - 1)) * 100
      const y = 100 - (p.sales / maxSales) * 100
      return `${x},${y}`
    })
    .join(" ")

  const byProduct = useMemo(() => {
    const map = new Map<string, { name: string; orders: number; sales: number }>()
    for (const order of filteredOrders) {
      for (const item of order.items) {
        const key = item.product.id
        const row = map.get(key) ?? { name: item.product.name, orders: 0, sales: 0 }
        row.orders += item.quantity
        row.sales += (item.unitPrice ?? item.product.price) * item.quantity
        map.set(key, row)
      }
    }
    return Array.from(map.values()).sort((a, b) => b.sales - a.sales).slice(0, 5)
  }, [filteredOrders])

  const byPlan = useMemo(() => {
    const map = new Map<string, { label: string; sales: number; orders: number }>()
    for (const order of filteredOrders) {
      for (const item of order.items) {
        const key = item.planId ?? "unknown"
        const label = item.planLabel ?? key
        const row = map.get(key) ?? { label, sales: 0, orders: 0 }
        row.orders += item.quantity
        row.sales += (item.unitPrice ?? item.product.price) * item.quantity
        map.set(key, row)
      }
    }
    return Array.from(map.values()).sort((a, b) => b.sales - a.sales)
  }, [filteredOrders])

  const paymentStats = useMemo(() => {
    const map = new Map<string, { count: number; sales: number }>()
    for (const order of filteredOrders) {
      const key = order.paymentMethod
      const row = map.get(key) ?? { count: 0, sales: 0 }
      row.count += 1
      if (order.status !== "cancelled") row.sales += order.total
      map.set(key, row)
    }
    return Array.from(map.entries()).map(([method, v]) => ({ method, ...v }))
  }, [filteredOrders])

  const regionStats = useMemo(() => {
    const map = new Map<string, number>()
    for (const order of filteredOrders) {
      const region = parseCountry(order.shippingAddress || "")
      map.set(region, (map.get(region) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [filteredOrders])

  const hourStats = useMemo(() => {
    const counts = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }))
    for (const order of filteredOrders) {
      const d = new Date(order.createdAt)
      if (Number.isNaN(d.getTime())) continue
      counts[d.getHours()].count += 1
    }
    return counts.sort((a, b) => b.count - a.count)[0]
  }, [filteredOrders])

  const weekdayStats = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const counts = days.map((day) => ({ day, count: 0 }))
    for (const order of filteredOrders) {
      const d = new Date(order.createdAt)
      if (Number.isNaN(d.getTime())) continue
      counts[d.getDay()].count += 1
    }
    return counts.sort((a, b) => b.count - a.count)[0]
  }, [filteredOrders])

  const buyerSegmentation = useMemo(() => {
    const ordersByBuyer = new Map<string, Order[]>()
    for (const order of orders) {
      const key = order.userEmail ?? order.userId
      const list = ordersByBuyer.get(key) ?? []
      list.push(order)
      ordersByBuyer.set(key, list)
    }
    let newBuyers = 0
    let returning = 0
    for (const [buyer, list] of ordersByBuyer) {
      const sorted = [...list].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      const first = sorted[0]
      const hasOrderInRange = filteredOrders.some((o) => (o.userEmail ?? o.userId) === buyer)
      if (!hasOrderInRange) continue
      const firstTime = new Date(first.createdAt).getTime()
      const inRangeFirst = filteredOrders.some(
        (o) => (o.userEmail ?? o.userId) === buyer && new Date(o.createdAt).getTime() === firstTime
      )
      if (inRangeFirst) newBuyers += 1
      else returning += 1
    }
    return { newBuyers, returning }
  }, [orders, filteredOrders])

  const repeatRate = uniqueBuyers ? (buyerSegmentation.returning / uniqueBuyers) * 100 : 0

  const pendingAging = useMemo(() => {
    const now = Date.now()
    let lt24 = 0
    let between24And72 = 0
    let gt72 = 0
    for (const order of filteredOrders.filter((o) => o.status === "pending")) {
      const created = new Date(order.createdAt).getTime()
      if (!Number.isFinite(created)) continue
      const hours = (now - created) / (1000 * 60 * 60)
      if (hours < 24) lt24 += 1
      else if (hours < 72) between24And72 += 1
      else gt72 += 1
    }
    return { lt24, between24And72, gt72 }
  }, [filteredOrders])

  const licenseStats = useMemo(() => {
    const active = licenses.filter((l) => l.status === "active").length
    const expired = licenses.filter((l) => l.status === "expired").length
    const revoked = licenses.filter((l) => l.status === "revoked").length
    const soonExpiring = licenses.filter((l) => {
      if (!l.expiresAt) return false
      const ms = new Date(l.expiresAt).getTime() - Date.now()
      return ms > 0 && ms <= 1000 * 60 * 60 * 24 * 14
    }).length
    return { total: licenses.length, active, expired, revoked, soonExpiring }
  }, [licenses])

  const monthlySales = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    return orders
      .filter((o) => new Date(o.createdAt) >= monthStart && o.status !== "cancelled")
      .reduce((acc, o) => acc + o.total, 0)
  }, [orders])
  const targetProgress = monthlyTarget > 0 ? Math.min(100, (monthlySales / monthlyTarget) * 100) : 0

  const forecastNext30Days = useMemo(() => {
    const recent = buildTrend(orders, 14)
    const avgDaily = recent.reduce((acc, d) => acc + d.sales, 0) / Math.max(1, recent.length)
    return avgDaily * 30
  }, [orders])

  const cohortRows = useMemo(() => {
    const firstMonthByBuyer = new Map<string, string>()
    const repeatByFirstMonth = new Map<string, { total: number; repeated: number }>()
    const sorted = [...orders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    const countByBuyer = new Map<string, number>()
    for (const order of sorted) {
      const buyer = order.userEmail ?? order.userId
      const key = monthKey(new Date(order.createdAt))
      if (!firstMonthByBuyer.has(buyer)) firstMonthByBuyer.set(buyer, key)
      countByBuyer.set(buyer, (countByBuyer.get(buyer) ?? 0) + 1)
    }
    for (const [buyer, firstMonth] of firstMonthByBuyer.entries()) {
      const row = repeatByFirstMonth.get(firstMonth) ?? { total: 0, repeated: 0 }
      row.total += 1
      if ((countByBuyer.get(buyer) ?? 0) > 1) row.repeated += 1
      repeatByFirstMonth.set(firstMonth, row)
    }
    return Array.from(repeatByFirstMonth.entries())
      .map(([cohort, v]) => ({
        cohort,
        users: v.total,
        retention: v.total ? (v.repeated / v.total) * 100 : 0,
      }))
      .sort((a, b) => b.cohort.localeCompare(a.cohort))
      .slice(0, 6)
  }, [orders])

  const alertMessages = [
    pendingAging.gt72 > 0 ? `${pendingAging.gt72} pending order(s) older than 72h` : "",
    paidConversion < 35 && totalOrders > 5 ? "Paid conversion is below 35%" : "",
    cancelledOrders > 0 && cancelledOrders / Math.max(1, totalOrders) > 0.25
      ? "Cancellation rate is above 25%"
      : "",
    licenseStats.soonExpiring > 0 ? `${licenseStats.soonExpiring} licenses expiring in 14 days` : "",
  ].filter(Boolean)

  const exportCsv = () => {
    const header = "order_id,created_at,status,payment_method,user_email,total_usdt\n"
    const rows = filteredOrders
      .map((o) =>
        [
          o.id,
          o.createdAt,
          o.status,
          o.paymentMethod,
          o.userEmail ?? "",
          o.total.toFixed(2),
        ]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n")
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-100">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Advanced business analytics across orders, sales, customer behavior, licenses, and forecasting.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["7d", "30d", "90d", "all"] as const).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? "default" : "outline"}
              className={range === r ? "bg-orange-500 text-white hover:bg-orange-600" : ""}
              onClick={() => setRange(r)}
            >
              {r.toUpperCase()}
            </Button>
          ))}
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 w-[150px]" />
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 w-[150px]" />
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="mr-1 h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-zinc-300">Total orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-zinc-100">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-zinc-300">Total sales</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-zinc-100">{totalSales.toFixed(2)} USDT</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-zinc-300">Paid orders</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-zinc-100">{paidOrders}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-zinc-300">Pending orders</CardTitle>
            <Clock3 className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-zinc-100">{pendingOrders}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-zinc-300">Paid conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-zinc-100">{paidConversion.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="text-base text-zinc-100">Trend graph (Orders and Sales)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <svg viewBox="0 0 100 100" className="h-64 w-full">
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="rgba(63,63,70,0.5)"
                  strokeWidth="0.35"
                />
              ))}
              <polyline
                points={salesPoints}
                fill="none"
                stroke="rgba(249,115,22,0.95)"
                strokeWidth="1.2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <polyline
                points={ordersPoints}
                fill="none"
                stroke="rgba(56,189,248,0.95)"
                strokeWidth="1.2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  Sales
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Orders
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {trend.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => navigate(`/admin/orders?date=${encodeURIComponent(d.key)}`)}
                    className="transition-colors hover:text-orange-400"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">Revenue breakdown by product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byProduct.map((row) => (
              <div key={row.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-zinc-200">{row.name}</span>
                  <span className="text-zinc-400">{row.sales.toFixed(2)} USDT</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-orange-500"
                    style={{ width: `${(row.sales / Math.max(1, byProduct[0]?.sales ?? 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">Plan performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {byPlan.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2">
                <span className="text-zinc-300">{row.label}</span>
                <span className="text-zinc-100">{row.sales.toFixed(2)} USDT</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader><CardTitle className="text-base text-zinc-100">Customer analytics</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p>Unique buyers: <span className="text-zinc-100">{uniqueBuyers}</span></p>
            <p>New buyers: <span className="text-zinc-100">{buyerSegmentation.newBuyers}</span></p>
            <p>Returning buyers: <span className="text-zinc-100">{buyerSegmentation.returning}</span></p>
            <p>Repeat purchase rate: <span className="text-zinc-100">{repeatRate.toFixed(1)}%</span></p>
            <p>AOV: <span className="text-zinc-100">{aov.toFixed(2)} USDT</span></p>
            <p>ARPU: <span className="text-zinc-100">{arpu.toFixed(2)} USDT</span></p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader><CardTitle className="text-base text-zinc-100">Operational insights</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p>Busiest hour: <span className="text-zinc-100">{hourStats?.hour ?? 0}:00</span></p>
            <p>Busiest day: <span className="text-zinc-100">{weekdayStats?.day ?? "N/A"}</span></p>
            <p>Pending &lt;24h: <span className="text-zinc-100">{pendingAging.lt24}</span></p>
            <p>Pending 24-72h: <span className="text-zinc-100">{pendingAging.between24And72}</span></p>
            <p>Pending &gt;72h: <span className="text-zinc-100">{pendingAging.gt72}</span></p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader><CardTitle className="text-base text-zinc-100">Payment and regions</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {paymentStats.map((p) => (
              <div key={p.method} className="flex items-center justify-between text-zinc-300">
                <span>{p.method === "usdt_qr" ? "USDT (QR)" : p.method}</span>
                <span>{p.count} / {p.sales.toFixed(2)} USDT</span>
              </div>
            ))}
            <div className="mt-3 border-t border-zinc-800 pt-2 text-zinc-400">Top regions</div>
            {regionStats.map((r) => (
              <div key={r.region} className="flex items-center justify-between text-zinc-300">
                <span>{r.region}</span>
                <span>{r.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader><CardTitle className="text-base text-zinc-100">Cohort retention (recent months)</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {cohortRows.map((row) => (
              <div key={row.cohort} className="grid grid-cols-3 rounded-lg border border-zinc-800 px-3 py-2 text-zinc-300">
                <span>{row.cohort}</span>
                <span>{row.users} users</span>
                <span className="text-right text-zinc-100">{row.retention.toFixed(1)}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader><CardTitle className="text-base text-zinc-100">License analytics</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p>Total licenses: <span className="text-zinc-100">{licenseStats.total}</span></p>
            <p>Active: <span className="text-zinc-100">{licenseStats.active}</span></p>
            <p>Expired: <span className="text-zinc-100">{licenseStats.expired}</span></p>
            <p>Revoked: <span className="text-zinc-100">{licenseStats.revoked}</span></p>
            <p>Expiring in 14 days: <span className="text-zinc-100">{licenseStats.soonExpiring}</span></p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader><CardTitle className="text-base text-zinc-100">Goals and forecast</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            <div className="flex items-center gap-2">
              <span>Monthly target:</span>
              <Input
                type="number"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(Number(e.target.value) || 0)}
                className="h-8 w-40"
              />
              <span>USDT</span>
            </div>
            <p>Current month sales: <span className="text-zinc-100">{monthlySales.toFixed(2)} USDT</span></p>
            <div className="h-2 rounded-full bg-zinc-800">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${targetProgress}%` }} />
            </div>
            <p>Target progress: <span className="text-zinc-100">{targetProgress.toFixed(1)}%</span></p>
            <p>Forecast next 30 days: <span className="text-zinc-100">{forecastNext30Days.toFixed(2)} USDT</span></p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base text-zinc-100">Operational alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {alertMessages.length === 0 ? (
              <p className="text-zinc-400">No critical alerts. System health looks stable.</p>
            ) : (
              alertMessages.map((a) => (
                <div key={a} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-300">
                  {a}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
