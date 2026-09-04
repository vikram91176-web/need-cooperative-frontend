import { Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import About from './pages/About'
import AdminDashboard from './pages/AdminDashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import WorkerDashboard from './pages/WorkerDashboard'
import CooperativeDashboard from './pages/CooperativeDashboard'
import CooperativesPage from './pages/CooperativesPage'
import SupportPage from './pages/SupportPage'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Register from './pages/Register'
import ServicesPage from './pages/ServicesPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route index element={<LandingPage />} />
        <Route path="/services"     element={<ServicesPage />} />
        <Route path="/cooperatives" element={<CooperativesPage />} />
        <Route path="/about"        element={<About />} />
        <Route path="/help"         element={<SupportPage />} />
        <Route path="/support"      element={<SupportPage />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/register"     element={<Register />} />

        {/* Protected: Customer */}
        <Route element={<ProtectedRoute requiredRole="customer" />}>
          <Route path="/customer" element={<CustomerDashboard />} />
        </Route>

        {/* Protected: Worker */}
        <Route element={<ProtectedRoute requiredRole="worker" />}>
          <Route path="/worker" element={<WorkerDashboard />} />
        </Route>

        {/* Protected: Cooperative Admin */}
        <Route element={<ProtectedRoute requiredRole="cooperative_admin" />}>
          <Route path="/cooperative" element={<CooperativeDashboard />} />
        </Route>

        {/* Protected: Admin */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
