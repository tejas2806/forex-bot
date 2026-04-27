import { Link, useNavigate } from "react-router-dom"
import { ShoppingCart, LogOut, LayoutDashboard, Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCartStore } from "@/stores/cart-store"
import { useAuthStore } from "@/stores/auth-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Header() {
  const totalItems = useCartStore((s) => s.totalItems())
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) navigate(`/shop?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-void/95 backdrop-blur supports-[backdrop-filter]:bg-void/80">
      <div className="container mx-auto flex h-16 items-center gap-6 px-4">
        <Link to="/" className="font-display text-xl font-bold text-zinc-100">
          AlphaForge
        </Link>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="md:hidden">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>Navigate products and account pages.</SheetDescription>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-2">
              <Button variant="ghost" className="justify-start" asChild>
                <Link to="/shop">Products</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link to="/shop?featured=1">Featured</Link>
              </Button>
              {user && (
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/account/orders">Orders</Link>
                </Button>
              )}
              {user?.role === "admin" && (
                <Button variant="ghost" className="justify-start text-orange-400 hover:text-orange-300" asChild>
                  <Link to="/admin">Admin</Link>
                </Button>
              )}
            </nav>
            <form onSubmit={handleSearch} className="mt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  type="search"
                  placeholder="Search bots & products..."
                  className="pl-9 bg-zinc-900/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </form>
          </SheetContent>
        </Sheet>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/shop"
            className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Products
          </Link>
          <Link
            to="/shop?featured=1"
            className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Featured
          </Link>
          {user && (
            <Link
              to="/account/orders"
              className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Orders
            </Link>
          )}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors"
            >
              Admin
            </Link>
          )}
        </nav>

        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              type="search"
              placeholder="Search bots & products..."
              className="pl-9 bg-zinc-900/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-zinc-700 text-zinc-300 text-sm">
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account/orders">Orders</Link>
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout()
                    navigate("/")
                  }}
                  className="text-red-400 focus:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
