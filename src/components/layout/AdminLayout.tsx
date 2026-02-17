import { Outlet, Link, Navigate } from "react-router-dom"
import { LayoutDashboard, Package, ShoppingBag, Users, ArrowLeft } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/users", label: "Users", icon: Users },
]

export function AdminLayout() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === "admin"

  if (!user) return <Navigate to="/login?redirect=/admin" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-void">
      <aside className="fixed left-0 top-0 z-30 h-full w-56 border-r border-zinc-800 bg-ink">
        <div className="p-4">
          <Link to="/" className="font-display text-lg font-bold text-zinc-100">
            AlphaForge Admin
          </Link>
        </div>
        <nav className="space-y-1 px-2">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to site
            </Link>
          </Button>
        </div>
      </aside>
      <main className="pl-56 p-8">
        <Outlet />
      </main>
    </div>
  )
}
