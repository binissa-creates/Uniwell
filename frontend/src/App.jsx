import { Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { getHomeForRole } from './lib/portalAccess'
import ProtectedRoute from './components/ProtectedRoute'
import { Sparkles } from 'lucide-react'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AcceptInvite from './pages/AcceptInvite'
import Dashboard from './pages/Dashboard'
import MoodTracker from './pages/MoodTracker'
import Journal from './pages/Journal'
import PeerInsights from './pages/PeerInsights'
import StudentProfile from './pages/StudentProfile'
import AdminDashboard from './pages/AdminDashboard'
import StudentWellnessOverview from './pages/StudentWellnessOverview'
import AdminModeration from './pages/AdminModeration'
import AdminComingSoon from './pages/AdminComingSoon'
import ManageStaff from './pages/ManageStaff'
import FloatingSupportButton from './components/FloatingSupportButton'
import LoadingScreen from './components/LoadingScreen'
import { Stethoscope, Settings, HelpCircle } from 'lucide-react'

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
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EEDDCB] text-[#705800]">
            <Sparkles size={28} />
          </div>
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

function GuestRoute({ children }) {
  const { session, profile, loading } = useAuth()
  // Always wait for auth (and profile fetch) to complete before deciding.
  // Without this guard the login page renders before the session is known,
  // causing a redirect loop where the user is never sent to the dashboard.
  if (loading) return <LoadingScreen />
  if (session && profile?.status === 'invited') {
    return <Navigate to="/accept-invite" replace />
  }
  if (session && profile?.status === 'active') {
    return <Navigate to={getHomeForRole(profile.role)} replace />
  }
  // If session exists but profile is still null (e.g. new account without a
  // profile row), fall through to children so the user isn't stuck.
  return children
}

function StaffHub() {
  const { profile } = useAuth()
  if (profile?.role === 'admin') return <AdminDashboard />

  return (
    <AdminComingSoon
      eyebrow="Guidance Staff Hub"
      title="Guidance"
      accent="Hub"
      icon={Stethoscope}
      blurb="Your staff account is active. Guidance tools will appear here as they become available."
      bullets={[
        'Student access is controlled by database policies.',
        'Private journal entries are not available to staff.',
      ]}
    />
  )
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
          <Route path="/login-staff" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />

          {/* Student */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
          <Route path="/mood" element={<ProtectedRoute allowedRoles={['student']}><MoodTracker /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute allowedRoles={['student']}><Journal /></ProtectedRoute>} />
          <Route path="/peer-insights" element={<ProtectedRoute allowedRoles={['student']}><PeerInsights /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>} />

          {/* Staff */}
          <Route path="/staff" element={<ProtectedRoute allowedRoles={['counselor', 'admin']}><StaffHub /></ProtectedRoute>} />
          <Route path="/staff/manage" element={
            <ProtectedRoute allowedRoles={['admin']}><ManageStaff /></ProtectedRoute>
          } />
          <Route path="/staff/*" element={
            <ProtectedRoute allowedRoles={['counselor', 'admin']}>
              <Navigate to="/staff" replace />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><StudentWellnessOverview /></ProtectedRoute>} />
          <Route path="/admin/alerts" element={<ProtectedRoute allowedRoles={['admin']}><StudentWellnessOverview /></ProtectedRoute>} />
          <Route path="/admin/moderation" element={<ProtectedRoute allowedRoles={['admin']}><AdminModeration /></ProtectedRoute>} />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['admin']}>
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
            <ProtectedRoute allowedRoles={['admin']}>
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
