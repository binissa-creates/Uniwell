import { useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  User, Mail, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle,
  Loader2, BookOpen, GraduationCap, Hash,
} from 'lucide-react'

export default function StudentProfile() {
  const { user, profile } = useAuth()

  // ── Email tab ──────────────────────────────────────────────
  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState(null)   // { ok, text }
  const [emailBusy, setEmailBusy] = useState(false)

  // ── Password tab ───────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)
  const [pwBusy, setPwBusy] = useState(false)

  const [tab, setTab] = useState('email') // 'email' | 'password'

  // ── Handlers ───────────────────────────────────────────────
  const handleEmailUpdate = async (e) => {
    e.preventDefault()
    if (!newEmail.trim()) return
    setEmailBusy(true)
    setEmailMsg(null)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setEmailBusy(false)
    if (error) {
      setEmailMsg({ ok: false, text: error.message })
    } else {
      setEmailMsg({ ok: true, text: 'Check your new inbox — a confirmation link was sent.' })
      setNewEmail('')
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setPwMsg(null)
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: 'New passwords do not match.' })
      return
    }
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: 'Password must be at least 8 characters.' })
      return
    }
    setPwBusy(true)
    // Re-authenticate first
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user?.email,
      password: currentPw,
    })
    if (signInErr) {
      setPwBusy(false)
      setPwMsg({ ok: false, text: 'Current password is incorrect.' })
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwBusy(false)
    if (error) {
      setPwMsg({ ok: false, text: error.message })
    } else {
      setPwMsg({ ok: true, text: 'Password updated successfully!' })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    }
  }

  const firstName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'You'
  const initials = profile?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-28 pb-24 page-enter">

        {/* ── Header ── */}
        <div className="mb-10">
          <p className="text-warm/45 text-xs font-semibold uppercase tracking-widest mb-3">
            Account
          </p>
          <h1 className="font-jakarta text-5xl font-extrabold text-warm editorial-accent mb-4">
            My Profile
          </h1>
          <p className="text-warm/50 text-sm leading-relaxed">
            Manage your account credentials below. Your name and course info are set by your institution.
          </p>
        </div>

        {/* ── Identity card ── */}
        <div className="bg-white rounded-3xl p-6 shadow-suncast mb-8 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl gradient-cta flex items-center justify-center text-2xl font-black text-[#3E3006] flex-shrink-0 shadow-glow">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-jakarta font-bold text-xl text-warm truncate">
              {profile?.name || 'Student'}
            </h2>
            <p className="text-warm/50 text-sm mt-0.5 truncate">{user?.email}</p>
          </div>
          <div className="hidden sm:flex flex-col gap-1.5 items-end">
            {profile?.student_id && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-warm/40">
                <Hash size={11} /> {profile.student_id}
              </div>
            )}
            {profile?.course && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-warm/40">
                <BookOpen size={11} /> {profile.course}
              </div>
            )}
            {profile?.year_level && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-warm/40">
                <GraduationCap size={11} /> Year {profile.year_level}
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'email', icon: Mail, label: 'Change Email' },
            { key: 'password', icon: Lock, label: 'Change Password' },
          ].map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200
                ${tab === key
                  ? 'gradient-cta text-[#3E3006] shadow-glow'
                  : 'bg-white text-warm/50 shadow-suncast hover:text-warm hover:shadow-glow'}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* ── Email panel ── */}
        {tab === 'email' && (
          <div className="bg-white rounded-3xl p-8 shadow-suncast animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#f6c945]/15 flex items-center justify-center">
                <Mail size={18} className="text-[#755b00]" />
              </div>
              <div>
                <h3 className="font-jakarta font-bold text-warm">Change Email Address</h3>
                <p className="text-xs text-warm/45">Current: {user?.email}</p>
              </div>
            </div>

            <form onSubmit={handleEmailUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-warm/45 uppercase tracking-widest mb-2 block">
                  New Email Address
                </label>
                <input
                  type="email" required value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="your-new@email.com"
                  className="w-full rounded-2xl px-4 py-3 text-sm text-warm placeholder-warm/30 outline-none transition-all duration-200"
                  style={{ background: 'var(--color-surface-container-highest)' }}
                  onFocus={e => e.target.style.background = 'var(--color-primary-fixed)'}
                  onBlur={e => e.target.style.background = 'var(--color-surface-container-highest)'}
                />
              </div>

              {emailMsg && (
                <Feedback ok={emailMsg.ok} text={emailMsg.text} />
              )}

              <button type="submit" disabled={emailBusy}
                className="w-full gradient-cta text-[#3E3006] font-semibold rounded-full py-3.5 flex items-center justify-center gap-2 shadow-suncast hover:shadow-glow active:scale-[0.98] transition-all duration-200 disabled:opacity-50 text-sm">
                {emailBusy ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {emailBusy ? 'Sending…' : 'Send Confirmation Email'}
              </button>
            </form>
          </div>
        )}

        {/* ── Password panel ── */}
        {tab === 'password' && (
          <div className="bg-white rounded-3xl p-8 shadow-suncast animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#f6c945]/15 flex items-center justify-center">
                <Lock size={18} className="text-[#755b00]" />
              </div>
              <div>
                <h3 className="font-jakarta font-bold text-warm">Change Password</h3>
                <p className="text-xs text-warm/45">Must be at least 8 characters</p>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <PasswordField
                label="Current Password" value={currentPw} show={showCurrent}
                onChange={e => setCurrentPw(e.target.value)}
                onToggle={() => setShowCurrent(v => !v)}
              />
              <PasswordField
                label="New Password" value={newPw} show={showNew}
                onChange={e => setNewPw(e.target.value)}
                onToggle={() => setShowNew(v => !v)}
              />
              <PasswordField
                label="Confirm New Password" value={confirmPw} show={showConfirm}
                onChange={e => setConfirmPw(e.target.value)}
                onToggle={() => setShowConfirm(v => !v)}
              />

              {/* Strength bar */}
              {newPw.length > 0 && <StrengthBar password={newPw} />}

              {pwMsg && <Feedback ok={pwMsg.ok} text={pwMsg.text} />}

              <button type="submit" disabled={pwBusy}
                className="w-full gradient-cta text-[#3E3006] font-semibold rounded-full py-3.5 flex items-center justify-center gap-2 shadow-suncast hover:shadow-glow active:scale-[0.98] transition-all duration-200 disabled:opacity-50 text-sm">
                {pwBusy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                {pwBusy ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────
function PasswordField({ label, value, show, onChange, onToggle }) {
  return (
    <div>
      <label className="text-xs font-bold text-warm/45 uppercase tracking-widest mb-2 block">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'} required value={value} onChange={onChange}
          placeholder="••••••••"
          className="w-full rounded-2xl px-4 pr-12 py-3 text-sm text-warm placeholder-warm/30 outline-none transition-all duration-200"
          style={{ background: 'var(--color-surface-container-highest)' }}
          onFocus={e => e.target.style.background = 'var(--color-primary-fixed)'}
          onBlur={e => e.target.style.background = 'var(--color-surface-container-highest)'}
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-warm/35 hover:text-warm transition-colors p-1">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

function StrengthBar({ password }) {
  const score = (() => {
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  const colors = ['#ef4444', '#f59e0b', '#84cc16', '#22c55e']
  return (
    <div>
      <div className="flex gap-1.5 mb-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colors[score - 1] : '#ffe9e3' }} />
        ))}
      </div>
      <p className="text-[10px] font-bold" style={{ color: colors[score - 1] || '#AA8E7E' }}>
        {score > 0 ? labels[score - 1] : 'Enter a password'}
      </p>
    </div>
  )
}

function Feedback({ ok, text }) {
  const Icon = ok ? CheckCircle2 : AlertTriangle
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
      <Icon size={15} className="flex-shrink-0" />
      {text}
    </div>
  )
}
