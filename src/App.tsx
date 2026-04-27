import { useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { MainLayout } from "@/components/layout/MainLayout"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { Home } from "@/pages/Home"
import { Shop } from "@/pages/Shop"
import { ProductDetail } from "@/pages/ProductDetail"
import { Cart } from "@/pages/Cart"
import { Checkout } from "@/pages/Checkout"
import { Login } from "@/pages/Login"
import { Register } from "@/pages/Register"
import { AccountOrders } from "@/pages/AccountOrders"
import { Performance } from "@/pages/Performance"
import { AdminDashboard } from "@/pages/admin/AdminDashboard"
import { AdminProducts } from "@/pages/admin/AdminProducts"
import { AdminOrders } from "@/pages/admin/AdminOrders"
import { AdminUsers } from "@/pages/admin/AdminUsers"
import { useAuthStore } from "@/stores/auth-store"
import { useProductsStore } from "@/stores/products-store"
import { useOrdersStore } from "@/stores/orders-store"

function App() {
  const initAuthListener = useAuthStore((s) => s.initAuthListener)
  const authReady = useAuthStore((s) => s.authReady)
  const user = useAuthStore((s) => s.user)
  const loadProducts = useProductsStore((s) => s.loadProducts)
  const loadOrders = useOrdersStore((s) => s.loadOrders)
  useEffect(() => {
    const unsubscribe = initAuthListener()
    return () => unsubscribe()
  }, [initAuthListener])
  // Wait for Firebase Auth so seed (empty DB) runs with a signed-in user; product reads stay public.
  useEffect(() => {
    if (!authReady) return
    void loadProducts()
  }, [authReady, user, loadProducts])
  useEffect(() => {
    if (!authReady || !user) return
    void loadOrders()
  }, [authReady, user, loadOrders])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="account/orders" element={<AccountOrders />} />
          <Route path="performance" element={<Performance />} />
          <Route path="performance/:botId" element={<Performance />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
