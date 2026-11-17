import { Route, Routes } from 'react-router'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AccountPage from '@/pages/AccountPage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage'
import AdminRestaurantsPage from '@/pages/admin/AdminRestaurantsPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import CartPage from '@/pages/CartPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import HomePage from '@/pages/HomePage'
import NotFoundPage from '@/pages/NotFoundPage'
import OrderDetailsPage from '@/pages/OrderDetailsPage'
import OrdersPage from '@/pages/OrdersPage'
import OwnerMenuPage from '@/pages/owner/OwnerMenuPage'
import OwnerOrdersPage from '@/pages/owner/OwnerOrdersPage'
import OwnerSettingsPage from '@/pages/owner/OwnerSettingsPage'
import RestaurantPage from '@/pages/RestaurantPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route index element={<HomePage />} />
        <Route path="restaurants/:id" element={<RestaurantPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="account" element={<AccountPage />} />

        {/* Customer */}
        <Route element={<ProtectedRoute role="CUSTOMER" />}>
          <Route path="orders" element={<OrdersPage />} />
        </Route>
        {/* Customer or restaurant owner (the API checks who can see the order) */}
        <Route element={<ProtectedRoute />}>
          <Route path="orders/:id" element={<OrderDetailsPage />} />
        </Route>

        {/* Restaurant owner */}
        <Route path="dashboard" element={<ProtectedRoute role="RESTAURANT_OWNER" />}>
          <Route index element={<OwnerOrdersPage />} />
          <Route path="menu" element={<OwnerMenuPage />} />
          <Route path="settings" element={<OwnerSettingsPage />} />
        </Route>

        {/* Admin */}
        <Route path="admin" element={<ProtectedRoute role="ADMIN" />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="restaurants" element={<AdminRestaurantsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
