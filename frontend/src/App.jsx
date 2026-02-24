import { Routes, Route } from 'react-router'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import AdminLayout from './components/layout/AdminLayout'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/RegisterPage'
import CouponCheckPage from './pages/CouponCheckPage'
import RulesPage from './pages/RulesPage'
import PrivacyPage from './pages/PrivacyPage'
import LegalNoticePage from './pages/LegalNoticePage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'
import NotFoundPage from './pages/NotFoundPage'

function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
      <Route path="/participar" element={<PublicLayout><RegisterPage /></PublicLayout>} />
      <Route path="/mis-cupones" element={<PublicLayout><CouponCheckPage /></PublicLayout>} />
      <Route path="/bases-y-condiciones" element={<PublicLayout><RulesPage /></PublicLayout>} />
      <Route path="/privacidad" element={<PublicLayout><PrivacyPage /></PublicLayout>} />
      <Route path="/aviso-legal" element={<PublicLayout><LegalNoticePage /></PublicLayout>} />

      {/* Admin login */}
      <Route path="/admin/login" element={<LoginPage />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="registros" element={<ClientsPage />} />
        <Route path="registros/:id" element={<ClientDetailPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
    </Routes>
  )
}
