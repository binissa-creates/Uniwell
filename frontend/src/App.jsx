import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import Login       from './pages/Login'
import LoginStaff  from './pages/LoginStaff'
import Register    from './pages/Register'
import Dashboard   from './pages/Dashboard'
import MoodTracker from './pages/MoodTracker'
import Journal     from './pages/Journal'
import PeerInsights from './pages/PeerInsights'
import AdminDashboard  from './pages/AdminDashboard'
import AdminModeration from './pages/AdminModeration'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center text-warm/60">
      Loading…
    </div>
  )
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { session, profile, loading, isAdmin } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  if (loading || !profile) return <LoadingScreen />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function GuestRoute({ children }) {
  const { session, profile, loading, isAdmin } = useAuth()
  if (session && loading) return <LoadingScreen />
  if (session && profile)
    return <Navigate to={isAdmin ? '/admin/analytics' : '/dashboard'} replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login"       element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/login-staff"  element={<GuestRoute><LoginStaff /></GuestRoute>} />
          <Route path="/register"     element={<GuestRoute><Register /></GuestRoute>} />

          {/* Student */}
          <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/mood"         element={<ProtectedRoute><MoodTracker /></ProtectedRoute>} />
          <Route path="/journal"      element={<ProtectedRoute><Journal /></ProtectedRoute>} />
          <Route path="/peer-insights" element={<ProtectedRoute><PeerInsights /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin"            element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/analytics"  element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/moderation" element={<ProtectedRoute adminOnly><AdminModeration /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
