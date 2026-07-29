import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import faviconImage from '../../favicon.png'
import './AppStyles.css'
import { readStoredUser } from './utils/storage'
import HomePage from './pages/home/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import CompleteProfilePage from './pages/auth/CompleteProfilePage'
import AccountProfilePage from './pages/user/AccountProfilePage'
import DashboardUserPageV2 from './pages/user/DashboardUserPageV2'
import UserTryoutPage from './pages/user/UserTryoutPage'
import UserMaterialsPage from './pages/user/UserMaterialsPage'
import AdminDashboardPage from './pages/admin/dashboard/AdminDashboardPage'
import AdminUserManagementPage from './pages/admin/users/AdminUserManagementPage'
import AdminPackageManagementPage from './pages/admin/packages/AdminPackageManagementPage'
import AdminMaterialManagementPage from './pages/admin/materials/AdminMaterialManagementPage'
import AdminQuestionManagementPage from './pages/admin/questions/AdminQuestionManagementPage'
import AdminTransactionManagementPage from './pages/admin/transactions/AdminTransactionManagementPage'
import AdminSettingsParameterPage from './pages/admin/settings/parameters/AdminSettingsParameterPage'
import AdminSettingsFaqPage from './pages/admin/settings/faqs/AdminSettingsFaqPage'
import AdminSettingsTestimoniPage from './pages/admin/settings/testimonials/AdminSettingsTestimoniPage'

function RequireRole({ role, children }) {
  const location = useLocation()
  const user = location.state?.user ?? readStoredUser()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  const isAdmin = Number(user?.is_admin ?? 0) === 1

  if (role === 'admin' && !isAdmin) {
    return <Navigate to="/dashboard-user" replace />
  }

  if (role === 'user' && isAdmin) {
    return <Navigate to="/dashboard-admin" replace />
  }

  return children
}

function App() {
  useEffect(() => {
    document.title = 'Nice On'

    const faviconLink = document.querySelector('link[rel="icon"]') || document.createElement('link')

    faviconLink.setAttribute('rel', 'icon')
    faviconLink.setAttribute('type', 'image/png')
    faviconLink.setAttribute('href', faviconImage)

    if (!faviconLink.parentNode) {
      document.head.appendChild(faviconLink)
    }
  }, [])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={<LoginPage />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />
      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />
      <Route
        path="/register"
        element={<RegisterPage />}
      />
      <Route
        path="/complete-profile"
        element={<CompleteProfilePage />}
      />
      <Route
        path="/account-profile"
        element={<AccountProfilePage />}
      />
      <Route
        path="/dashboard-user"
        element={<RequireRole role="user"><DashboardUserPageV2 /></RequireRole>}
      />
      <Route
        path="/dashboard-user/tryout"
        element={<RequireRole role="user"><UserTryoutPage /></RequireRole>}
      />
      <Route
        path="/dashboard-user/materials"
        element={<RequireRole role="user"><UserMaterialsPage /></RequireRole>}
      />
      <Route
        path="/dashboard-admin"
        element={<RequireRole role="admin"><AdminDashboardPage /></RequireRole>}
      />
      <Route
        path="/dashboard-admin/users"
        element={<RequireRole role="admin"><AdminUserManagementPage /></RequireRole>}
      />
      <Route
        path="/dashboard-admin/packages"
        element={<RequireRole role="admin"><AdminPackageManagementPage /></RequireRole>}
      />
      <Route
        path="/dashboard-admin/materials"
        element={<RequireRole role="admin"><AdminMaterialManagementPage /></RequireRole>}
      />
      <Route
        path="/dashboard-admin/questions"
        element={<RequireRole role="admin"><AdminQuestionManagementPage /></RequireRole>}
      />
      <Route
        path="/dashboard-admin/transactions"
        element={<RequireRole role="admin"><AdminTransactionManagementPage /></RequireRole>}
      />
      <Route
        path="/dashboard-admin/settings"
        element={<Navigate to="/dashboard-admin/settings/parameters" replace />}
      />
      <Route
        path="/dashboard-admin/settings/parameters"
        element={<RequireRole role="admin"><AdminSettingsParameterPage /></RequireRole>}
      />
      <Route
        path="/dashboard-admin/settings/faqs"
        element={<RequireRole role="admin"><AdminSettingsFaqPage /></RequireRole>}
      />
      <Route
        path="/dashboard-admin/settings/testimonials"
        element={<RequireRole role="admin"><AdminSettingsTestimoniPage /></RequireRole>}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
