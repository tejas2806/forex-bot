import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ChevronRight, Download } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { useOrdersStore } from "@/stores/orders-store"
import { formatPrice } from "@/lib/utils"
import { getForexBotDownloadUrl } from "@/lib/downloads"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OrderDetailDialog } from "@/components/order/OrderDetailDialog"

export function AccountOrders() {
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const loadOrdersForUser = useOrdersStore((s) => s.loadOrdersForUser)
  const orders = useOrdersStore((s) => s.orders)
  const ordersLoaded = useOrdersStore((s) => s.ordersLoaded)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const justPaidOrderId = searchParams.get("paid")
  const forexBotExeUrl = getForexBotDownloadUrl()

  // Fetch orders from new schema path: admins/{adminId}/users/{userEmail}/orders
  useEffect(() => {
    if (!user?.email) return
    loadOrdersForUser(undefined, user.email)
  }, [user?.email, loadOrdersForUser])

  // After Stripe redirect with ?paid=, refresh
  useEffect(() => {
    if (searchParams.get("paid") && user?.email) {
      loadOrdersForUser(undefined, user.email)
    }
  }, [searchParams.get("paid"), user, loadOrdersForUser])

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopyMessage("License key copied. Use it in your Python/GUI bot to activate.")
    setTimeout(() => setCopyMessage(null), 3000)
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-zinc-500">Please log in to view your orders.</p>
        <Button asChild className="mt-4">
          <Link to="/login?redirect=/account/orders">Log in</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-zinc-100 mb-2">My orders</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Paid orders include license keys for your bot executables (Python + GUI). Copy the key to activate in-app.
      </p>
      {justPaidOrderId && (
        <Card className="mb-6 border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-sm text-emerald-200">
              Payment received for order <span className="font-semibold">#{justPaidOrderId.slice(-8).toUpperCase()}</span>. Download your bot app below.
            </p>
            <Button asChild variant="outline" className="border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/15">
              <a href={forexBotExeUrl} download className="inline-flex items-center justify-center gap-2">
                <Download className="h-4 w-4 shrink-0" />
                Download ForexBotsApp.exe
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
      {copyMessage && (
        <p className="mb-4 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm px-3 py-2">
          {copyMessage}
        </p>
      )}

      {!ordersLoaded ? (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="py-12 text-center text-zinc-500">
            Loading your orders…
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="py-12 text-center text-zinc-500">
            You haven&apos;t placed any orders yet.
            <Button asChild className="mt-4 ml-2">
              <Link to="/shop">Browse products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-6">
            {orders.map((order) => {
              const orderItemCount = order.items.length
              const orderQuantity = order.items.reduce((s, i) => s + i.quantity, 0)
              return (
                <Card
                  key={order.id}
                  className="border-zinc-800 bg-zinc-900/50 rounded-lg overflow-hidden cursor-pointer transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                    <CardTitle className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                      Order #{order.id.slice(-8).toUpperCase()}
                      <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
                    </CardTitle>
                    <Badge
                      variant={
                        order.status === "delivered"
                          ? "success"
                          : order.status === "paid"
                            ? "default"
                            : order.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                      }
                      className="shrink-0"
                    >
                      {order.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-500">Buyer name</p>
                          <p className="text-sm text-zinc-100">{order.userName || user.name}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-500">Buyer email</p>
                          <p className="text-sm text-zinc-100">{order.userEmail || user.email}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-500">Purchased products</p>
                          <ul className="mt-1 space-y-1">
                            {order.items.map((item) => (
                              <li key={item.product.id} className="text-sm text-zinc-300">
                                {item.product.name} x{item.quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-500">Payment mode</p>
                          <p className="text-sm capitalize text-zinc-100">{order.paymentMethod}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-500">Payment value</p>
                          <p className="text-sm font-semibold text-zinc-100">{formatPrice(order.total)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-500">Date & time</p>
                          <p className="text-sm text-zinc-100">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-500">Meta</p>
                          <p className="text-xs text-zinc-500">
                            {orderItemCount} item type(s) · {orderQuantity} total qty
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-zinc-500">Click to view full details</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <OrderDetailDialog
            orderId={selectedOrderId}
            userEmail={user?.email ?? null}
            open={!!selectedOrderId}
            onOpenChange={(open) => !open && setSelectedOrderId(null)}
            onCopyLicense={handleCopy}
          />
        </>
      )}
    </div>
  )
}
