import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Package, ShoppingBag, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useProductsStore } from "@/stores/products-store"
import { useOrdersStore } from "@/stores/orders-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BotCsvPerformanceChart } from "@/components/analytics/BotCsvPerformanceChart"
import {
  DEFAULT_ADMIN_EMAIL,
  getUsdtPaymentSettings,
  setUsdtPaymentSettings,
} from "@/lib/firestore"

export function AdminDashboard() {
  const products = useProductsStore((s) => s.products)
  const orders = useOrdersStore((s) => s.orders)

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((acc, o) => acc + o.total, 0)

  const completedOrders = orders.filter((o) => o.status === "delivered").length
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "paid").length
  const [qrImageUrl, setQrImageUrl] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [network, setNetwork] = useState("TRC20")
  const [note, setNote] = useState("")
  const [savingPayment, setSavingPayment] = useState(false)
  const [paymentMsg, setPaymentMsg] = useState("")

  useEffect(() => {
    getUsdtPaymentSettings(DEFAULT_ADMIN_EMAIL)
      .then((settings) => {
        setQrImageUrl(settings.qrImageUrl ?? "")
        setWalletAddress(settings.walletAddress ?? "")
        setNetwork(settings.network ?? "TRC20")
        setNote(settings.note ?? "")
      })
      .catch(() => {
        // Keep defaults if fetch fails.
      })
  }, [])

  const onQrFileChange = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      setQrImageUrl(result)
    }
    reader.readAsDataURL(file)
  }

  const saveUsdtSettings = async () => {
    setPaymentMsg("")
    if (!qrImageUrl.trim()) {
      setPaymentMsg("Please upload a QR image first.")
      return
    }
    setSavingPayment(true)
    try {
      await setUsdtPaymentSettings(DEFAULT_ADMIN_EMAIL, {
        enabled: true,
        qrImageUrl: qrImageUrl.trim(),
        walletAddress: walletAddress.trim(),
        network: network.trim(),
        note: note.trim(),
      })
      setPaymentMsg("USDT payment settings saved successfully.")
    } catch {
      setPaymentMsg("Failed to save USDT payment settings.")
    } finally {
      setSavingPayment(false)
    }
  }

  const stats: {
    label: string
    value: string | number
    icon: React.ComponentType<any>
    helper: string
    tone: "neutral" | "warn" | "success"
    link?: string
  }[] = [
    {
      label: "Total products",
      value: products.length,
      icon: Package,
      link: "/admin/products",
      helper: "Bots, indicators & courses",
      tone: "neutral",
    },
    {
      label: "Active orders",
      value: pendingOrders,
      icon: ShoppingBag,
      link: "/admin/orders",
      helper: `${completedOrders} completed`,
      tone: pendingOrders > 0 ? "warn" : "neutral",
    },
    {
      label: "Total revenue",
      value: `${totalRevenue.toFixed(2)} USDT`,
      icon: DollarSign,
      helper: "Demo data only",
      tone: "success",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-100">Overview</h1>
          <p className="text-sm text-zinc-500 mt-1">
            High-level performance of your AlphaForge products, orders, and revenue.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline">
            Demo environment – numbers update as you test flows
          </span>
          <span className="sm:hidden">Demo stats</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="relative overflow-hidden border-zinc-800 bg-gradient-to-br from-zinc-900/60 via-zinc-900 to-zinc-900/60"
          >
            <div className="pointer-events-none absolute inset-px rounded-[0.9rem] border border-white/5" />
            <CardHeader className="relative flex flex-row items-start justify-between pb-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {stat.label}
                </p>
                <p className="mt-1 text-[0.7rem] text-zinc-500">{stat.helper}</p>
              </div>
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80">
                <stat.icon className="h-4 w-4 text-zinc-400" />
              </div>
            </CardHeader>
            <CardContent className="relative pb-4">
              <div className="flex items-center justify-between">
                {stat.link ? (
                  <Link
                    to={stat.link}
                    className="text-2xl font-semibold text-zinc-50 hover:text-orange-400 transition-colors"
                  >
                    {stat.value}
                  </Link>
                ) : (
                  <p className="text-2xl font-semibold text-zinc-50">{stat.value}</p>
                )}
                <div className="flex items-center gap-1 text-xs">
                  {stat.tone === "success" && (
                    <>
                      <span className="inline-flex h-5 items-center gap-1 rounded-full bg-emerald-500/10 px-2 text-[0.7rem] font-medium text-emerald-400">
                        <ArrowUpRight className="h-3 w-3" />
                        Live
                      </span>
                    </>
                  )}
                  {stat.tone === "warn" && (
                    <span className="inline-flex h-5 items-center gap-1 rounded-full bg-amber-500/10 px-2 text-[0.7rem] font-medium text-amber-400">
                      <ArrowDownRight className="h-3 w-3" />
                      Attention
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-zinc-800 bg-zinc-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-200">
              Recent orders
            </CardTitle>
            <Link
              to="/admin/orders"
              className="text-xs font-medium text-zinc-400 hover:text-orange-400"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No orders yet. Place a test checkout to see data here.
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {orders.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    to={`/admin/orders?orderId=${encodeURIComponent(order.id)}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/80 px-3 py-2 transition-colors hover:border-orange-500/50 hover:bg-zinc-900"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-zinc-100">
                        #{order.id.slice(-8).toUpperCase()} ·{" "}
                        <span className="text-zinc-400">
                          {order.items[0]?.product.name}
                          {order.items.length > 1 && ` +${order.items.length - 1} more`}
                        </span>
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(order.createdAt).toLocaleString()} · {order.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-zinc-50">
                        {order.total.toFixed(2)} USDT
                      </p>
                      <p className="text-xs capitalize text-zinc-500">{order.status}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-zinc-200">
              Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Link
              to="/admin/products"
              className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/80 px-3 py-2 hover:border-orange-500/60 hover:bg-zinc-900 transition-colors"
            >
              <span>Add a new trading bot</span>
              <ArrowUpRight className="h-4 w-4 text-zinc-500" />
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/80 px-3 py-2 hover:border-orange-500/60 hover:bg-zinc-900 transition-colors"
            >
              <span>Review recent orders</span>
              <ArrowUpRight className="h-4 w-4 text-zinc-500" />
            </Link>
            <Link
              to="/shop?featured=1"
              className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/80 px-3 py-2 hover:border-orange-500/60 hover:bg-zinc-900 transition-colors"
            >
              <span>Preview featured products</span>
              <ArrowUpRight className="h-4 w-4 text-zinc-500" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-zinc-100">USDT payment QR setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>Upload QR code</Label>
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => onQrFileChange(e.target.files?.[0])}
              />
              <p className="text-xs text-zinc-500">
                Buyers will scan this QR during checkout.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Wallet address (optional)</Label>
              <Input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your USDT receiving wallet address"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>Network</Label>
              <Input
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                placeholder="e.g. TRC20 / ERC20 / BEP20"
              />
            </div>
            <div className="space-y-2">
              <Label>Buyer note (optional)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Send exact amount and keep transaction screenshot."
              />
            </div>
          </div>

          {qrImageUrl && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">QR preview</p>
              <img
                src={qrImageUrl}
                alt="USDT QR code preview"
                className="h-56 w-56 rounded-lg border border-zinc-800 object-contain"
              />
            </div>
          )}

          {paymentMsg && (
            <p className={`text-sm ${paymentMsg.includes("successfully") ? "text-emerald-400" : "text-red-400"}`}>
              {paymentMsg}
            </p>
          )}

          <Button
            type="button"
            className="bg-orange-500 text-white hover:bg-orange-600"
            onClick={() => void saveUsdtSettings()}
            disabled={savingPayment}
          >
            {savingPayment ? "Saving..." : "Save USDT payment settings"}
          </Button>
        </CardContent>
      </Card>

      <BotCsvPerformanceChart initialBot="1" />
    </div>
  )
}
