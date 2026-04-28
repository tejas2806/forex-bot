import { useEffect, useState } from "react"
import { useOrdersStore } from "@/stores/orders-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  DEFAULT_ADMIN_EMAIL,
  getLicensesByOrder,
  getLicensesForOrderForUser,
} from "@/lib/firestore"
import type { License, Order } from "@/types"

export function AdminOrders() {
  const orders = useOrdersStore((s) => s.orders)
  const updateOrderStatus = useOrdersStore((s) => s.updateOrderStatus)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [licenses, setLicenses] = useState<License[]>([])
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("all")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "amount_desc" | "amount_asc">("latest")

  const statusOptions: Order["status"][] = ["pending", "paid", "cancelled"]
  const totalQty = selectedOrder?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  const formatUsdt = (value: number) => `${value.toFixed(2)} USDT`
  const prettyPaymentMethod = (value: string) =>
    value === "usdt_qr" ? "USDT (QR)" : value.replace(/_/g, " ")
  const filterTabs: Array<"all" | Order["status"]> = ["all", ...statusOptions]

  const openDetails = (order: Order) => {
    setSelectedOrder(order)
    setDetailOpen(true)
  }

  const filteredAndSortedOrders = orders
    .filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false
      if (!search.trim()) return true
      const query = search.trim().toLowerCase()
      const productNames = order.items.map((i) => i.product.name.toLowerCase()).join(" ")
      return (
        order.id.toLowerCase().includes(query) ||
        (order.userName ?? "").toLowerCase().includes(query) ||
        (order.userEmail ?? "").toLowerCase().includes(query) ||
        productNames.includes(query)
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "amount_desc":
          return b.total - a.total
        case "amount_asc":
          return a.total - b.total
        case "latest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  useEffect(() => {
    if (!detailOpen || !selectedOrder) {
      setLicenses([])
      return
    }

    const userEmail = selectedOrder.userEmail?.trim()
    const loadLicenses = userEmail
      ? getLicensesForOrderForUser(DEFAULT_ADMIN_EMAIL, userEmail, selectedOrder.id)
      : getLicensesByOrder(DEFAULT_ADMIN_EMAIL, selectedOrder.id)

    loadLicenses
      .then((data) => setLicenses(data))
      .catch(() => setLicenses([]))
  }, [detailOpen, selectedOrder])

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-zinc-100 mb-8">Orders</h1>

      <Card className="mb-5 border-zinc-800 bg-zinc-900/50">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {filterTabs.map((tab) => (
              <Button
                key={tab}
                type="button"
                size="sm"
                variant={statusFilter === tab ? "default" : "outline"}
                className={statusFilter === tab ? "bg-orange-500 text-white hover:bg-orange-600" : ""}
                onClick={() => setStatusFilter(tab)}
              >
                {tab === "all" ? "All" : tab[0].toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, buyer, email, product..."
            />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort orders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="amount_desc">Highest amount</SelectItem>
                <SelectItem value="amount_asc">Lowest amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredAndSortedOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-zinc-500">
            {orders.length === 0 ? "No orders yet." : "No orders match your filters."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedOrders.map((order) => (
            <Card
              key={order.id}
              className="cursor-pointer transition-colors hover:border-zinc-600"
              onClick={() => openDetails(order)}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Order #{order.id.slice(-8).toUpperCase()}
                </CardTitle>
                <div onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={order.status}
                    onValueChange={(value) =>
                      void updateOrderStatus(order.id, value as Order["status"])
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Buyer name</p>
                      <p className="text-sm text-zinc-100">
                        {order.userName || order.userEmail || order.userId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Buyer email</p>
                      <p className="text-sm text-zinc-100">{order.userEmail || "N/A"}</p>
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
                      <p className="text-sm text-zinc-100">{prettyPaymentMethod(order.paymentMethod)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Payment value</p>
                      <p className="text-sm font-semibold text-zinc-100">{formatUsdt(order.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Date & time</p>
                      <p className="text-sm text-zinc-100">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle>
              {selectedOrder
                ? `Order #${selectedOrder.id.slice(-8).toUpperCase()} details`
                : "Order details"}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-zinc-400">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
                <Badge
                  variant={
                    selectedOrder.status === "delivered"
                      ? "success"
                      : selectedOrder.status === "paid"
                        ? "default"
                        : selectedOrder.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                  }
                >
                  {selectedOrder.status}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Buyer name</p>
                  <p className="text-zinc-100">
                    {selectedOrder.userName || selectedOrder.userEmail || selectedOrder.userId}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Buyer email</p>
                  <p className="text-zinc-100">{selectedOrder.userEmail || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Payment mode</p>
                  <p className="text-zinc-100">{prettyPaymentMethod(selectedOrder.paymentMethod)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Payment value</p>
                  <p className="font-semibold text-zinc-100">{formatUsdt(selectedOrder.total)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Purchased products</p>
                <ul className="mt-2 space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                  {selectedOrder.items.map((item, index) => (
                    <li key={`${item.product.id}-${index}`} className="flex items-center justify-between gap-2">
                      <span className="text-zinc-200">
                              {item.product.name} x{item.quantity}
                              {item.planLabel ? ` · ${item.planLabel}` : ""}
                      </span>
                      <span className="text-zinc-400">
                              {formatUsdt((item.unitPrice ?? item.product.price) * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Meta details</p>
                <div className="mt-2 grid gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-zinc-300 md:grid-cols-2">
                  <p>Order ID: {selectedOrder.id}</p>
                  <p>User ID: {selectedOrder.userId}</p>
                  <p>Total items: {selectedOrder.items.length}</p>
                  <p>Total quantity: {totalQty}</p>
                  <p>Status: {selectedOrder.status}</p>
                  <p>Date-Time: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  <p className="md:col-span-2">
                    Shipping address: {selectedOrder.shippingAddress || "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">License keys</p>
                {licenses.length === 0 ? (
                  <p className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-zinc-400">
                    No license keys generated for this order yet.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                    {licenses.map((license) => (
                      <li
                        key={license.id}
                        className="font-mono text-xs text-zinc-200 break-all"
                      >
                        {license.licenseKey}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
