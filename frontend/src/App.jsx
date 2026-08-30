import { Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { getHomeForRole, isPortalValidationActive, roleCanAccess } from './lib/portalAccess'

// Pages
import Login from './pages/Login'
import LoginStaff from './pages/LoginStaff'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import MoodTracker from './pages/MoodTracker'
import Journal from './pages/Journal'
import PeerInsights from './pages/PeerInsights'
import StudentProfile from './pages/StudentProfile'
import AdminDashboard from './pages/AdminDashboard'
import StudentWellnessOverview from './pages/StudentWellnessOverview'
import AdminModeration from './pages/AdminModeration'
import AdminComingSoon from './pages/AdminComingSoon'
import FloatingSupportButton from './components/FloatingSupportButton'
import { Stethoscope, Settings, HelpCircle } from 'lucide-react'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center text-warm/60">
      Loading…
    </div>
  )
}

class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('[AppErrorBoundary]', error)
  }

  handleReset = () => {
    window.location.assign('/login')
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="min-h-screen bg-[#FDF9F2] flex items-center justify-center px-6 py-12">
        <section className="w-full max-w-md rounded-[2.5rem] bg-white p-8 sm:p-10 text-center shadow-lift">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EEDDCB] text-3xl">🌻</div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#6B5A10]">UniWell</p>
          <h1 className="font-jakarta text-2xl font-extrabold text-[#3a2b25]">Something needs a reset</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#3a2b25]/60">
            This page could not finish loading. Return to sign in and try again.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-8 w-full rounded-2xl bg-[#F6C945] px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-[#3E3006] transition hover:shadow-glow"
          >
            Return to sign in
          </button>
        </section>
      </main>
    )
  }
}

function ProtectedRoute({ children, allowedRole }) {
  const { session, profile, loading } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  if (loading) return <LoadingScreen />
  if (!profile) {
    console.error('Profile not found for session:', session.user.id)
    return <Navigate to="/login" replace />
  }
  if (!roleCanAccess(allowedRole, profile.role)) {
    return <Navigate to={getHomeForRole(profile.role)} replace />
  }
  return children
}

function GuestRoute({ children }) {
  const location = useLocation()
  const { session, profile, loading, portalValidation } = useAuth()

  if (isPortalValidationActive(location.pathname, portalValidation)) {
    return children
  }

  if (session && loading) return <LoadingScreen />
  if (session && profile) {
    const home = getHomeForRole(profile.role)
    if (home !== '/login') return <Navigate to={home} replace />
  }
  return children
}

function StudentSupportWrapper() {
  const { profile } = useAuth()
  if (profile?.role === 'student') return <FloatingSupportButton />
  return null
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <StudentSupportWrapper />
          <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/login-staff" element={<GuestRoute><LoginStaff /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />

          {/* Student */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRole="student"><Dashboard /></ProtectedRoute>} />
          <Route path="/mood" element={<ProtectedRoute allowedRole="student"><MoodTracker /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute allowedRole="student"><Journal /></ProtectedRoute>} />
          <Route path="/peer-insights" element={<ProtectedRoute allowedRole="student"><PeerInsights /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRole="student"><StudentProfile /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute allowedRole="admin"><StudentWellnessOverview /></ProtectedRoute>} />
          <Route path="/admin/alerts" element={<ProtectedRoute allowedRole="admin"><StudentWellnessOverview /></ProtectedRoute>} />
          <Route path="/admin/moderation" element={<ProtectedRoute allowedRole="admin"><AdminModeration /></ProtectedRoute>} />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRole="admin">
              <AdminComingSoon
                eyebrow="Admin Hub · Preferences"
                title="Admin"
                accent="Settings"
                icon={Settings}
                blurb="Tune how UniWell surfaces data for your campus — alert thresholds, visibility, and team access."
                bullets={[
                  'Adjust the thresholds that produce alerts (silence period, critical streak length, low-average cutoff).',
                  'Manage admin accounts and invite new guidance staff.',
                  'Toggle which students appear in analytics by program or year level.',
                  'Configure email templates used for outreach.',
                ]}
              />
            </ProtectedRoute>
          } />
          <Route path="/admin/help" element={
            <ProtectedRoute allowedRole="admin">
              <AdminComingSoon
                eyebrow="Admin Hub · Resources"
                title="Help &"
                accent="Resources"
                icon={HelpCircle}
                blurb="Documentation, best practices, and quick references for running a campus wellness program."
                bullets={[
                  'How to interpret mood scores and trigger patterns responsibly.',
                  'Outreach scripts that balance care with student autonomy.',
                  'Privacy boundaries: what admins can and cannot see (journal entries are never accessible).',
                  'Crisis escalation flow and external referral contacts.',
                ]}
              />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppErrorBoundary>
  )
}
