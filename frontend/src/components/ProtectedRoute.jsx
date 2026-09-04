/**
 * ProtectedRoute.jsx — redirect to /login if not authenticated.
 *
 * WHAT: A wrapper component used in App.jsx around routes that require login.
 * WHY:  Without this, anyone could navigate to /customer or /worker directly.
 * HOW:  Reads `user` from AuthContext.
 *       - While the initial /me check is still running: show nothing (avoids
 *         a flash of the login page for already-logged-in users).
 *       - If no user: redirect to /login, remembering where they were going
 *         so we can send them back after a successful login.
 *       - If logged in: render the child page normally.
 *
 * Usage in App.jsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/customer" element={<CustomerDashboard />} />
 *   </Route>
 *
 * Role-restricted usage (e.g. admin only):
 *   <Route element={<ProtectedRoute requiredRole="admin" />}>
 *     <Route path="/admin" element={<AdminDashboard />} />
 *   </Route>
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_DASHBOARDS = {
  customer: '/customer',
  worker: '/worker',
  cooperative_admin: '/cooperative',
  admin: '/admin',
}

export default function ProtectedRoute({ requiredRole }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Still verifying session with server and no cached user found — show branded loading
  if (loading && !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 bg-surface">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
        </div>
        <p className="mt-4 text-xs font-bold tracking-wider uppercase text-on-surface-variant font-mono">
          Verifying Federation Credentials...
        </p>
      </div>
    )
  }

  // Not logged in → go to /login, remember where we were trying to navigate
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but wrong role → safely send to their own role-specific dashboard
  if (requiredRole && user.role !== requiredRole) {
    const target = ROLE_DASHBOARDS[user.role] || '/'
    return <Navigate to={target} replace />
  }

  // Authenticated & authorized — render the requested protected route
  return <Outlet />
}
