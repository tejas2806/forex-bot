import { Link } from "react-router-dom"
import { Package, ShoppingBag, DollarSign } from "lucide-react"
import { useProductsStore } from "@/stores/products-store"
import { useOrdersStore } from "@/stores/orders-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"

export function AdminDashboard() {
  const products = useProductsStore((s) => s.products)
  const orders = useOrdersStore((s) => s.orders)

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((acc, o) => acc + o.total, 0)

  const stats = [
    { label: "Total products", value: products.length, icon: Package, link: "/admin/products" },
    { label: "Orders", value: orders.length, icon: ShoppingBag, link: "/admin/orders" },
    { label: "Revenue", value: formatPrice(totalRevenue), icon: DollarSign },
  ]

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-zinc-100 mb-8">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              {stat.link ? (
                <Link to={stat.link} className="text-2xl font-bold text-zinc-100 hover:text-orange-500">
                  {stat.value}
                </Link>
              ) : (
                <p className="text-2xl font-bold text-zinc-100">{stat.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
