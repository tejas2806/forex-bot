import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Download, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCartStore } from "@/stores/cart-store"
import { useAuthStore } from "@/stores/auth-store"
import { useOrdersStore } from "@/stores/orders-store"
import { getForexBotDownloadUrl } from "@/lib/downloads"
import {
  DEFAULT_ADMIN_EMAIL,
  getUsdtPaymentSettings,
  type UsdtPaymentSettings,
} from "@/lib/firestore"
import type { PaymentMethod } from "@/types"

export function Checkout() {
  const { items, totalPrice, clearCart } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const addOrder = useOrdersStore((s) => s.addOrder)
  const navigate = useNavigate()

  const [paymentMethod] = useState<PaymentMethod>("usdt_qr")
  const [address, setAddress] = useState("")
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [usdtSettings, setUsdtSettings] = useState<UsdtPaymentSettings>({
    enabled: false,
  })
  const forexBotExeUrl = getForexBotDownloadUrl()

  useEffect(() => {
    getUsdtPaymentSettings(DEFAULT_ADMIN_EMAIL)
      .then((settings) => setUsdtSettings(settings))
      .catch(() => setUsdtSettings({ enabled: false }))
  }, [])

  if (items.length === 0 && !done) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-2xl font-semibold text-zinc-100">Your cart is empty</h2>
        <Button asChild className="mt-6">
          <Link to="/shop">Browse products</Link>
        </Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      navigate("/login?redirect=/checkout")
      return
    }
    setError("")
    setProcessing(true)
    const orderPayload = {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      items: [...items],
      total: totalPrice(),
      paymentMethod,
      createdAt: new Date().toISOString(),
      shippingAddress: address || "Email for licenses / delivery",
    }
    if (!usdtSettings.enabled || !usdtSettings.qrImageUrl) {
      setError("USDT payment QR is not configured yet. Please contact admin.")
      setProcessing(false)
      return
    }

    const pendingOrder = await addOrder({
      ...orderPayload,
      status: "pending",
    })
    setProcessing(false)
    clearCart()
    setDone(true)
    navigate(`/account/orders?paid=${pendingOrder.id}`)
  }

  if (done) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/45">
          <div className="relative border-b border-zinc-800/70 bg-gradient-to-r from-emerald-500/15 via-orange-500/10 to-cyan-500/10 p-6 md:p-8">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="relative flex items-start gap-4">
              <div className="rounded-full border border-emerald-400/35 bg-emerald-500/20 p-2.5">
                <CheckCircle2 className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <p className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900/70 px-2.5 py-1 text-xs font-medium text-zinc-300">
                  <Sparkles className="h-3.5 w-3.5 text-orange-300" />
                  Order created
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-zinc-100">Order placed successfully</h2>
                <p className="mt-2 text-zinc-300">
                  Your USDT order is pending admin verification.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-400">
              <p>
                You can track status in <span className="text-zinc-200">My Orders</span>. Download access and license keys activate after payment verification.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild className="bg-orange-500 text-white hover:bg-orange-600">
                <a href={forexBotExeUrl} download className="inline-flex items-center justify-center gap-2">
                  <Download className="h-4 w-4 shrink-0" />
                  Download BotsApp.exe
                </a>
              </Button>
              <Button asChild variant="outline" className="border-zinc-700 hover:bg-zinc-800">
                <Link to="/account/orders">View orders</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-zinc-100 mb-8">Checkout</h1>

      {!user ? (
        <div className="rounded-xl border border-zinc-800 bg-card p-6 max-w-md">
          <p className="text-zinc-400">Please log in to complete your order.</p>
          <Button asChild className="mt-4">
            <Link to="/login?redirect=/checkout">Log in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <Label>Shipping address</Label>
              <Input
                className="mt-2"
                placeholder="Email for delivery (licenses / access)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-sm font-medium text-zinc-200">Payment method: USDT QR</p>
              <p className="mt-1 text-xs text-zinc-500">
                Scan the QR below and send the exact order amount in USDT.
              </p>
              {usdtSettings.network && (
                <p className="mt-2 text-xs text-zinc-400">
                  Network: <span className="font-medium text-zinc-200">{usdtSettings.network}</span>
                </p>
              )}
              {usdtSettings.walletAddress && (
                <p className="mt-1 break-all text-xs text-zinc-400">
                  Wallet: <span className="font-medium text-zinc-200">{usdtSettings.walletAddress}</span>
                </p>
              )}
              {usdtSettings.note && (
                <p className="mt-1 text-xs text-zinc-500">{usdtSettings.note}</p>
              )}
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              {!usdtSettings.qrImageUrl ? (
                <p className="text-sm text-amber-400">USDT QR is not available yet. Please contact admin.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Scan to pay</p>
                  <img
                    src={usdtSettings.qrImageUrl}
                    alt="USDT payment QR code"
                    className="h-56 w-56 rounded-lg border border-zinc-800 bg-zinc-950 object-contain"
                  />
                </div>
              )}
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <div>
            <div className="rounded-xl border border-zinc-800 bg-card p-6 sticky top-24">
              <h3 className="font-display text-lg font-semibold text-zinc-100">Order summary</h3>
              <p className="text-zinc-500 mt-1">{items.length} item(s)</p>
              <p className="mt-4 text-2xl font-bold text-zinc-100">{totalPrice().toFixed(2)} USDT</p>
              <Button
                type="submit"
                className="mt-6 w-full bg-orange-500 text-white hover:bg-orange-600"
                size="lg"
                disabled={processing || !usdtSettings.qrImageUrl}
              >
                {processing ? "Placing order…" : `I have paid ${totalPrice().toFixed(2)} USDT`}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
