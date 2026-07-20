import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import faviconImage from '../../favicon.png'
import './AppStyles.css'
import HomePage from './pages/home/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
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
        element={<DashboardUserPageV2 />}
      />
      <Route
        path="/dashboard-user/tryout"
        element={<UserTryoutPage />}
      />
      <Route
        path="/dashboard-user/materials"
        element={<UserMaterialsPage />}
      />
      <Route
        path="/dashboard-admin"
        element={<AdminDashboardPage />}
      />
      <Route
        path="/dashboard-admin/users"
        element={<AdminUserManagementPage />}
      />
      <Route
        path="/dashboard-admin/packages"
        element={<AdminPackageManagementPage />}
      />
      <Route
        path="/dashboard-admin/materials"
        element={<AdminMaterialManagementPage />}
      />
      <Route
        path="/dashboard-admin/questions"
        element={<AdminQuestionManagementPage />}
      />
      <Route
        path="/dashboard-admin/transactions"
        element={<AdminTransactionManagementPage />}
      />
      <Route
        path="/dashboard-admin/settings"
        element={<Navigate to="/dashboard-admin/settings/parameters" replace />}
      />
      <Route
        path="/dashboard-admin/settings/parameters"
        element={<AdminSettingsParameterPage />}
      />
      <Route
        path="/dashboard-admin/settings/faqs"
        element={<AdminSettingsFaqPage />}
      />
      <Route
        path="/dashboard-admin/settings/testimonials"
        element={<AdminSettingsTestimoniPage />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
