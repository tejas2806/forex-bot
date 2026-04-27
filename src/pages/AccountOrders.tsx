import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Copy, Key, Download, ChevronRight } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { useOrdersStore } from "@/stores/orders-store"
import { useLicensesStore } from "@/stores/licenses-store"
import { formatPrice } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OrderDetailDialog } from "@/components/order/OrderDetailDialog"
import type { License } from "@/types"

function LicenseRow({ license, onCopy }: { license: License; onCopy: (key: string) => void }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    onCopy(license.licenseKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <Key className="h-4 w-4 text-zinc-500" />
        <span className="font-mono text-zinc-300">{license.licenseKey}</span>
        <span className="text-zinc-500">· {license.productName}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={copy} className="h-8">
          {copied ? "Copied" : <Copy className="h-4 w-4" />}
        </Button>
        {license.downloadUrl && (
          <Button asChild variant="outline" size="sm" className="h-8">
            <a href={license.downloadUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-1" /> Download
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}

export function AccountOrders() {
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const loadOrdersForUser = useOrdersStore((s) => s.loadOrdersForUser)
  const orders = useOrdersStore((s) => s.orders)
  const ordersLoaded = useOrdersStore((s) => s.ordersLoaded)
  const loadLicensesForUser = useLicensesStore((s) => s.loadLicensesForUser)
  const getLicensesByOrderId = useLicensesStore((s) => s.getLicensesByOrderId)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // Fetch orders from new schema path: admins/{adminId}/users/{userEmail}/orders
  useEffect(() => {
    if (!user?.email) return
    loadOrdersForUser(undefined, user.email)
    loadLicensesForUser(user.id)
  }, [user?.id, user?.email, loadOrdersForUser, loadLicensesForUser])

  // After Stripe redirect with ?paid=, refresh
  useEffect(() => {
    if (searchParams.get("paid") && user?.email) {
      loadOrdersForUser(undefined, user.email)
      loadLicensesForUser(user.id)
    }
  }, [searchParams.get("paid"), user, loadOrdersForUser, loadLicensesForUser])

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
              const orderLicenses = getLicensesByOrderId(order.id)
              const orderItemCount = order.items.reduce((s, i) => s + i.quantity, 0)
              const dateStr = new Date(order.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "numeric",
                year: "numeric",
              })
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
                  <CardContent className="space-y-3 pt-0">
                    <p className="text-sm text-zinc-500">
                      {dateStr} · {orderItemCount} item(s)
                    </p>
                    <p className="font-semibold text-zinc-100">{formatPrice(order.total)}</p>
                    <p className="text-xs text-zinc-500">Click to view full details</p>
                    {order.status === "paid" && orderLicenses.length > 0 && (
                      <div className="mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                          License keys (for bot activation)
                        </p>
                        <div className="space-y-2">
                          {orderLicenses.map((lic) => (
                            <LicenseRow key={lic.id} license={lic} onCopy={handleCopy} />
                          ))}
                        </div>
                      </div>
                    )}
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
