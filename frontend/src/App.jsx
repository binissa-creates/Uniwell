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
import AdminDashboard   from './pages/AdminDashboard'
import AdminStudents    from './pages/AdminStudents'
import AdminMoodReports from './pages/AdminMoodReports'
import AdminAlerts      from './pages/AdminAlerts'
import AdminModeration  from './pages/AdminModeration'
import AdminComingSoon  from './pages/AdminComingSoon'
import { Stethoscope, Settings, HelpCircle } from 'lucide-react'

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
          <Route path="/admin"              element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/analytics"    element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/students"     element={<ProtectedRoute adminOnly><AdminStudents /></ProtectedRoute>} />
          <Route path="/admin/mood-reports" element={<ProtectedRoute adminOnly><AdminMoodReports /></ProtectedRoute>} />
          <Route path="/admin/alerts"       element={<ProtectedRoute adminOnly><AdminAlerts /></ProtectedRoute>} />
          <Route path="/admin/moderation"   element={<ProtectedRoute adminOnly><AdminModeration /></ProtectedRoute>} />
          <Route path="/admin/interventions" element={
            <ProtectedRoute adminOnly>
              <AdminComingSoon
                eyebrow="Admin Hub · Case Management"
                title="Guidance"
                accent="Interventions"
                icon={Stethoscope}
                blurb="Track follow-ups, counseling sessions, and support actions you've taken for individual students — end-to-end."
                bullets={[
                  'Log outreach attempts per student (email, phone, in-person) with timestamps and notes.',
                  'Track status (pending → contacted → in session → resolved) so nothing falls through the cracks.',
                  'Link each intervention to the mood log or alert that triggered it for accountability.',
                  'Share redacted summaries with the wellness team without exposing private journal content.',
                ]}
              />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute adminOnly>
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
            <ProtectedRoute adminOnly>
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
  )
}
