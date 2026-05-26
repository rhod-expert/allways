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
import GanadoresPage from './pages/GanadoresPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'
import ParticipantesPage from './pages/ParticipantesPage'
import ParticipanteDetailPage from './pages/ParticipanteDetailPage'
import SorteosPage from './pages/SorteosPage'
import SorteoDetallePage from './pages/SorteoDetallePage'
import WhatsAppPage from './pages/WhatsAppPage'
import ClienteLoginPage from './pages/cliente/LoginPage'
import RecuperarPage from './pages/cliente/RecuperarPage'
import SetupPasswordPage from './pages/cliente/SetupPasswordPage'
import ResetPasswordPage from './pages/cliente/ResetPasswordPage'
import ClienteDashboardPage from './pages/cliente/DashboardPage'
import MisRegistrosPage from './pages/cliente/MisRegistrosPage'
import ClientLayout, { ClientProtectedRoute } from './components/layout/ClientLayout'
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
      <Route path="/ganadores/:mes" element={<PublicLayout><GanadoresPage /></PublicLayout>} />

      {/* Admin login */}
      <Route path="/admin/login" element={<LoginPage />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clientes" element={<ParticipantesPage />} />
        <Route path="clientes/:id" element={<ParticipanteDetailPage />} />
        <Route path="registros" element={<ClientsPage />} />
        <Route path="registros/:id" element={<ClientDetailPage />} />
        <Route path="sorteos" element={<SorteosPage />} />
        <Route path="sorteos/:mes" element={<SorteoDetallePage />} />
        <Route path="whatsapp" element={<WhatsAppPage />} />
      </Route>

      {/* Cliente Area - public auth flows */}
      <Route path="/cliente/login" element={<ClienteLoginPage />} />
      <Route path="/cliente/recuperar" element={<RecuperarPage />} />
      <Route path="/cliente/setup-password" element={<SetupPasswordPage />} />
      <Route path="/cliente/reset-password" element={<ResetPasswordPage />} />

      {/* Cliente Area - protected */}
      <Route
        path="/cliente"
        element={
          <ClientProtectedRoute>
            <ClientLayout />
          </ClientProtectedRoute>
        }
      >
        <Route index element={<ClienteDashboardPage />} />
        <Route path="dashboard" element={<ClienteDashboardPage />} />
        <Route path="registros" element={<MisRegistrosPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
    </Routes>
  )
}
