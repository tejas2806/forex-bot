import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { CreditCard, Wallet, Banknote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCartStore } from "@/stores/cart-store"
import { useAuthStore } from "@/stores/auth-store"
import { useOrdersStore } from "@/stores/orders-store"
import { formatPrice } from "@/lib/utils"
import { createStripeCheckoutSession, getPaymentApiUrl } from "@/lib/payment"
import type { PaymentMethod } from "@/types"

export function Checkout() {
  const { items, totalPrice, clearCart } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const addOrder = useOrdersStore((s) => s.addOrder)
  const navigate = useNavigate()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  const [address, setAddress] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)

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
    const useStripe = paymentMethod === "card" && getPaymentApiUrl()
    if (useStripe) {
      const pendingOrder = await addOrder({
        ...orderPayload,
        status: "pending",
      })
      const result = await createStripeCheckoutSession({
        orderId: pendingOrder.id,
        amountCents: Math.round(totalPrice() * 100),
        currency: "usd",
        userEmail: user.email,
        userId: user.id,
        productNames: items.map((i) => i.product.name),
        successUrl: `${window.location.origin}/account/orders?paid=${pendingOrder.id}`,
        cancelUrl: `${window.location.origin}/checkout`,
      })
      if (result?.url) {
        window.location.href = result.url
        return
      }
      if (result?.error) {
        setProcessing(false)
        return
      }
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
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-2xl font-semibold text-zinc-100">Order placed!</h2>
        <p className="text-zinc-500 mt-2">Thank you for your purchase.</p>
        <Button asChild className="mt-6">
          <Link to="/account/orders">View orders</Link>
        </Button>
      </div>
    )
  }

  const paymentOptions: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { value: "card", label: "Credit / Debit card", icon: <CreditCard className="h-4 w-4" /> },
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
              <div>
                <Label>Card number</Label>
                <Input
                  className="mt-2"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <div className="rounded-xl border border-zinc-800 bg-card p-6 sticky top-24">
              <h3 className="font-display text-lg font-semibold text-zinc-100">Order summary</h3>
              <p className="text-zinc-500 mt-1">{items.length} item(s)</p>
              <p className="mt-4 text-2xl font-bold text-zinc-100">{formatPrice(totalPrice())}</p>
              <Button type="submit" className="w-full mt-6" size="lg" disabled={processing}>
                {processing ? "Processing…" : `Pay ${formatPrice(totalPrice())}`}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
