import { lazy } from 'react'
import { Route, Routes } from 'react-router'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import HomePage from '@/pages/HomePage'

// Every page but the home page is loaded when it is first opened, so the first visit downloads less.
const AccountPage = lazy(() => import('@/pages/AccountPage'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'))
const AdminRestaurantsPage = lazy(() => import('@/pages/admin/AdminRestaurantsPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const CreditsPage = lazy(() => import('@/pages/CreditsPage'))
const DriverAvailablePage = lazy(() => import('@/pages/driver/DriverAvailablePage'))
const DriverMyPage = lazy(() => import('@/pages/driver/DriverMyPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const OrderDetailsPage = lazy(() => import('@/pages/OrderDetailsPage'))
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const OwnerMenuPage = lazy(() => import('@/pages/owner/OwnerMenuPage'))
const OwnerOrdersPage = lazy(() => import('@/pages/owner/OwnerOrdersPage'))
const OwnerSettingsPage = lazy(() => import('@/pages/owner/OwnerSettingsPage'))
const loadRestaurantPage = () => import('@/pages/RestaurantPage')
const RestaurantPage = lazy(loadRestaurantPage)

// Most visitors open a restaurant next, so that page is fetched in the background once the browser is idle.
;(window.requestIdleCallback || setTimeout)(loadRestaurantPage)

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
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="credits" element={<CreditsPage />} />

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

        {/* Delivery driver */}
        <Route path="driver" element={<ProtectedRoute role="DRIVER" />}>
          <Route index element={<DriverAvailablePage />} />
          <Route path="mine" element={<DriverMyPage />} />
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
