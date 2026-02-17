import { Link } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { useOrdersStore } from "@/stores/orders-store"
import { formatPrice } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function AccountOrders() {
  const user = useAuthStore((s) => s.user)
  const getOrdersByUser = useOrdersStore((s) => s.getOrdersByUser)
  const orders = user ? getOrdersByUser(user.id) : []

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
      <h1 className="font-display text-3xl font-bold text-zinc-100 mb-8">My orders</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-zinc-500">
            You haven&apos;t placed any orders yet.
            <Button asChild className="mt-4 ml-2">
              <Link to="/shop">Browse products</Link>
            </Button>
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
                <Badge
                  variant={
                    order.status === "delivered"
                      ? "success"
                      : order.status === "cancelled"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {order.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-500">
                  {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item(s)
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
