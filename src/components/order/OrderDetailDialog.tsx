import { useEffect, useState } from "react"
import { Copy, Key, Download, Package, CreditCard, MapPin, Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DEFAULT_ADMIN_EMAIL,
  getOrderForUser,
  getLicensesForOrderForUser,
} from "@/lib/firestore"
import { formatPrice } from "@/lib/utils"
import type { Order, License } from "@/types"

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
        <Key className="h-4 w-4 text-zinc-500 shrink-0" />
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

interface OrderDetailDialogProps {
  orderId: string | null
  /** When provided, fetches from new schema path (no collection group). Required for reliable load. */
  userEmail: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCopyLicense?: (key: string) => void
}

export function OrderDetailDialog({
  orderId,
  userEmail,
  open,
  onOpenChange,
  onCopyLicense,
}: OrderDetailDialogProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !orderId) {
      setOrder(null)
      setLicenses([])
      setError(null)
      return
    }
    if (!userEmail?.trim()) {
      setError("Cannot load order: user email missing.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const email = userEmail.trim()
    Promise.all([
      getOrderForUser(DEFAULT_ADMIN_EMAIL, email, orderId),
      getLicensesForOrderForUser(DEFAULT_ADMIN_EMAIL, email, orderId),
    ])
      .then(([orderData, licensesData]) => {
        setOrder(orderData ?? null)
        setLicenses(licensesData ?? [])
        if (!orderData) setError("Order not found.")
      })
      .catch(() => setError("Failed to load order details."))
      .finally(() => setLoading(false))
  }, [open, orderId, userEmail])

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    onCopyLicense?.(key)
  }

  const dateStr = order
    ? new Date(order.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-left text-zinc-100">
            {orderId ? `Order #${orderId.slice(-8).toUpperCase()}` : "Order details"}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="py-8 text-center text-zinc-500 text-sm">Loading order details…</div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading && order && (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-zinc-400">
                <Calendar className="h-4 w-4" />
                {dateStr}
              </span>
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
              >
                {order.status}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-zinc-400">
              <CreditCard className="h-4 w-4 shrink-0" />
              <span>Payment: {order.paymentMethod}</span>
            </div>

            {order.shippingAddress && (
              <div className="flex gap-2 text-zinc-400">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{order.shippingAddress}</span>
              </div>
            )}

            <div>
              <p className="flex items-center gap-2 font-medium text-zinc-300 mb-2">
                <Package className="h-4 w-4" />
                Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
              </p>
              <ul className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between gap-2 text-zinc-300">
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="shrink-0">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="flex justify-between text-base font-semibold text-zinc-100 pt-2 border-t border-zinc-800">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </p>

            {order.status === "paid" && licenses.length > 0 && (
              <div>
                <p className="flex items-center gap-2 font-medium text-zinc-300 mb-2">
                  <Key className="h-4 w-4" />
                  License keys
                </p>
                <div className="space-y-2">
                  {licenses.map((lic) => (
                    <LicenseRow key={lic.id} license={lic} onCopy={handleCopy} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
