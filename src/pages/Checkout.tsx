import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { CreditCard, Wallet, Banknote, Download, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCartStore } from "@/stores/cart-store"
import { useAuthStore } from "@/stores/auth-store"
import { useOrdersStore } from "@/stores/orders-store"
import { formatPrice } from "@/lib/utils"
import { getForexBotDownloadUrl } from "@/lib/downloads"
import {
  createRazorpayOrder,
  getPaymentApiUrl,
  getRazorpayKeyId,
  loadRazorpayScript,
  verifyRazorpayPayment,
} from "@/lib/payment"
import type { PaymentMethod } from "@/types"

export function Checkout() {
  const { items, totalPrice, clearCart } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const addOrder = useOrdersStore((s) => s.addOrder)
  const navigate = useNavigate()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  const [address, setAddress] = useState("")
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const forexBotExeUrl = getForexBotDownloadUrl()

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
    const useRazorpay =
      paymentMethod === "card" && getPaymentApiUrl() && getRazorpayKeyId()
    if (useRazorpay) {
      const pendingOrder = await addOrder({
        ...orderPayload,
        status: "pending",
      })
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        setError("Failed to load Razorpay checkout script.")
        setProcessing(false)
        return
      }

      const orderResult = await createRazorpayOrder({
        orderId: pendingOrder.id,
        amountPaise: Math.round(totalPrice() * 100),
        currency: "INR",
        userEmail: user.email,
        userId: user.id,
        productNames: items.map((i) => i.product.name),
      })
      if ("error" in orderResult) {
        setError(orderResult.error)
        setProcessing(false)
        return
      }

      const keyId = getRazorpayKeyId()
      if (!keyId) {
        setError("Razorpay key is not configured.")
        setProcessing(false)
        return
      }

      const RazorpayConstructor = (window as Window & { Razorpay?: new (options: unknown) => { open: () => void } }).Razorpay
      if (!RazorpayConstructor) {
        setError("Razorpay checkout is unavailable.")
        setProcessing(false)
        return
      }

      const razorpay = new RazorpayConstructor({
        key: keyId,
        amount: orderResult.amount,
        currency: orderResult.currency,
        name: "AlphaForge",
        description: "Bot purchase",
        order_id: orderResult.razorpayOrderId,
        prefill: {
          name: user.name,
          email: user.email,
        },
        notes: {
          appOrderId: pendingOrder.id,
        },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          const verifyResult = await verifyRazorpayPayment({
            orderId: pendingOrder.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
          if ("error" in verifyResult || !verifyResult.success) {
            setError(
              "error" in verifyResult
                ? verifyResult.error
                : verifyResult.message || "Payment verification failed."
            )
            setProcessing(false)
            return
          }
          clearCart()
          setProcessing(false)
          setDone(true)
          navigate(`/account/orders?paid=${pendingOrder.id}`)
        },
        modal: {
          ondismiss: () => {
            setProcessing(false)
          },
        },
        theme: { color: "#f97316" },
      } as unknown as Record<string, unknown>)

      razorpay.open()
      return
    }
    await new Promise((r) => setTimeout(r, 800))
    await addOrder({
      ...orderPayload,
      status: "paid",
    })
    clearCart()
    setProcessing(false)
    setDone(true)
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
                  Payment confirmed
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-zinc-100">Order placed successfully</h2>
                <p className="mt-2 text-zinc-300">
                  Thank you for your purchase. Your license and app download are now ready.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-400">
              <p>
                Next step: download the app and open <span className="text-zinc-200">My Orders</span> anytime to copy your license key.
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

  const paymentOptions: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { value: "card", label: "Razorpay (Card/UPI/Netbanking)", icon: <CreditCard className="h-4 w-4" /> },
    { value: "paypal", label: "PayPal", icon: <Wallet className="h-4 w-4" /> },
    { value: "cod", label: "Cash on delivery", icon: <Banknote className="h-4 w-4" /> },
  ]

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

            <div>
              <Label>Payment method</Label>
              <div className="mt-2 space-y-2">
                {paymentOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                      paymentMethod === opt.value
                        ? "border-orange-500 bg-orange-500/10 text-zinc-100"
                        : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "card" && (
              <p className="text-sm text-zinc-500">
                Secure checkout opens Razorpay popup for Card / UPI / Netbanking.
              </p>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <div>
            <div className="rounded-xl border border-zinc-800 bg-card p-6 sticky top-24">
              <h3 className="font-display text-lg font-semibold text-zinc-100">Order summary</h3>
              <p className="text-zinc-500 mt-1">{items.length} item(s)</p>
              <p className="mt-4 text-2xl font-bold text-zinc-100">{formatPrice(totalPrice())}</p>
              <Button
                type="submit"
                className="mt-6 w-full bg-orange-500 text-white hover:bg-orange-600"
                size="lg"
                disabled={processing}
              >
                {processing ? "Processing…" : `Pay ${formatPrice(totalPrice())}`}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
