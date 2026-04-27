import { useOrdersStore } from "@/stores/orders-store"
import { formatPrice } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Order } from "@/types"

export function AdminOrders() {
  const orders = useOrdersStore((s) => s.orders)
  const updateOrderStatus = useOrdersStore((s) => s.updateOrderStatus)

  const statusOptions: Order["status"][] = ["pending", "paid", "shipped", "delivered", "cancelled"]

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-zinc-100 mb-8">Orders</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-zinc-500">
            No orders yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Order #{order.id.slice(-8).toUpperCase()}
                </CardTitle>
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
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-500">
                  {new Date(order.createdAt).toLocaleString()} · User: {order.userId}
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  {order.items.length} item(s) · Payment: {order.paymentMethod}
                </p>
                <p className="font-semibold text-zinc-100 mt-2">{formatPrice(order.total)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
