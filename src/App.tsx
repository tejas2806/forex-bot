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
import { AdminDashboard } from "@/pages/admin/AdminDashboard"
import { AdminProducts } from "@/pages/admin/AdminProducts"
import { AdminOrders } from "@/pages/admin/AdminOrders"
import { AdminUsers } from "@/pages/admin/AdminUsers"

function App() {
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
