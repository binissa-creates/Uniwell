import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, SmilePlus, BookOpen, Users, LogOut,
  ShieldCheck, ClipboardList, GraduationCap, ChevronDown,
  FileBarChart2, Stethoscope, Bell, Settings, HelpCircle,
  MoreHorizontal, UserCircle, Heart, X,
} from 'lucide-react'

const studentLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/mood', icon: SmilePlus, label: 'Mood Tracker' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/peer-insights', icon: Users, label: 'Peer Insights' },
]

// Primary admin tabs — always visible in the top strip.
const adminPrimary = [
  { to: '/admin', icon: ShieldCheck, label: 'Analytics' },
  { to: '/admin/students', icon: GraduationCap, label: 'Monitor' },
  { to: '/admin/moderation', icon: ClipboardList, label: 'Moderation' },
]

// Overflow menu — everything the old sidebar exposed.
const adminSecondary = [
  { to: '/staff/manage', icon: Users, label: 'Manage Staff' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
  { to: '/admin/help', icon: HelpCircle, label: 'Help' },
]

const counselorPrimary = [
  { to: '/staff', icon: Stethoscope, label: 'Staff Hub' },
]

function isActivePath(to, pathname) {
  return pathname === to || (to === '/admin' && pathname === '/admin/analytics')
}

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth()
  const isStudent = user?.role === 'student'
  const isStaff = user?.role === 'counselor' || isAdmin
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [logoutPending, setLogoutPending] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const desktopMoreRef = useRef(null)
  const mobileMoreRef = useRef(null)

  const primaryLinks = isAdmin ? adminPrimary : isStaff ? counselorPrimary : studentLinks
  const displayName = (isAdmin || user?.role === 'admin')
    ? 'Guidance'
    : (user?.name && !user.name.includes('@')
        ? user.name.split(' ')[0]
        : (isStaff ? 'Staff' : 'Student'))
  const avatarLetter = (displayName || 'U').charAt(0).toUpperCase()

  const overflowActive = isAdmin && adminSecondary.some(
    (i) => !i.divider && isActivePath(i.to, location.pathname)
  )

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!moreOpen) return
    const onDown = (e) => {
      const t = e.target
      const inDesktop = desktopMoreRef.current?.contains(t)
      const inMobile = mobileMoreRef.current?.contains(t)
      if (!inDesktop && !inMobile) setMoreOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setMoreOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [moreOpen])

  // Close overflow menu on navigation.
  useEffect(() => { setMoreOpen(false) }, [location.pathname])

  useEffect(() => {
    if (!logoutConfirmOpen) return
    const onKeyDown = event => {
      if (event.key === 'Escape' && !logoutPending) setLogoutConfirmOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [logoutConfirmOpen, logoutPending])

  const handleLogout = () => {
    setLogoutError('')
    setLogoutConfirmOpen(true)
  }

  const confirmLogout = async () => {
    setLogoutPending(true)
    setLogoutError('')
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('[Navbar] Sign out failed:', error)
      setLogoutError('We could not sign you out. Please try again.')
      setLogoutPending(false)
    }
  }

  return (
    <>
      {/* Mobile Top Header: Full width frosted bar so content cleanly scrolls underneath */}
      <header className="md:hidden fixed top-0 inset-x-0 h-16 bg-[#FDF9F2]/95 backdrop-blur-md border-b border-[#AA8E7E]/15 z-40 px-4 flex items-center justify-between shadow-xs">
        <Link to={isStaff ? '/staff' : '/dashboard'} className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center border border-[#AA8E7E]/10 group-hover:rotate-12 transition-transform">
            <span className="text-lg">🌻</span>
          </div>
          <span className="font-jakarta font-black text-lg tracking-tight text-[#3a2b25]">UniWell</span>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <>
              {isStudent ? (
                <Link
                  to="/profile"
                  className="w-9 h-9 rounded-full overflow-hidden shadow-sm border border-white transform active:scale-95 cursor-pointer"
                  title="My Profile"
                >
                  <div className="w-full h-full gradient-cta flex items-center justify-center">
                    <span className="text-xs font-black text-[#3E3006]">
                      {avatarLetter}
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="w-9 h-9 rounded-full overflow-hidden shadow-sm border border-white">
                  <div className="w-full h-full gradient-cta flex items-center justify-center">
                    <span className="text-xs font-black text-[#3E3006]">
                      {avatarLetter}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="w-9 h-9 rounded-full bg-white border border-[#AA8E7E]/10 flex items-center justify-center text-[#AA8E7E] hover:text-red-500 hover:bg-red-50 transition-all shadow-xs"
            title="Sign Out"
            aria-label="Sign out"
            aria-haspopup="dialog"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Desktop Floating Pill Navbar */}
      <nav className={`hidden md:block fixed top-0 inset-x-0 z-50 transition-all duration-500 px-6 ${scrolled ? 'pt-4' : 'pt-6'}`}>
        <div className={`max-w-6xl mx-auto h-16 flex items-center justify-between gap-4 px-6 rounded-3xl transition-all duration-500 ${scrolled ? 'glass shadow-lift border border-white/50 py-2' : 'bg-transparent py-4 border border-transparent'}`}>

          {/* Logo */}
          <Link to={isStaff ? '/staff' : '/dashboard'} className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-suncast flex items-center justify-center group-hover:rotate-12 transition-transform duration-500 border border-[#AA8E7E]/5">
              <span className="text-xl group-hover:scale-110 transition-transform">🌻</span>
            </div>
            <span className="hidden sm:block font-jakarta font-black text-xl tracking-tight text-[#3a2b25]">UniWell</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1.5 flex-1 justify-center bg-[#FDF9F2]/40 backdrop-blur-sm rounded-2xl p-1 border border-white/20">
            {primaryLinks.map(({ to, icon: Icon, label }) => {
              const active = isActivePath(to, location.pathname)
              return (
                <Link key={to} to={to} className={`
                  relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider
                  transition-all duration-300 group
                  ${active
                    ? 'bg-white text-[#3a2b25] shadow-sm border border-[#AA8E7E]/10'
                    : 'text-[#AA8E7E] hover:text-[#3a2b25] hover:bg-white/50'
                  }
                `}>
                  <Icon size={14} strokeWidth={active ? 3 : 2} className={active ? 'text-[#F6C945]' : 'group-hover:scale-110 transition-transform'} />
                  <span>{label}</span>
                </Link>
              )
            })}

            {/* Admin-only "More" dropdown */}
            {isAdmin && (
              <div className="relative" ref={desktopMoreRef}>
                <button
                  onClick={() => setMoreOpen((v) => !v)}
                  className={`
                    relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider
                    transition-all duration-300
                    ${moreOpen || overflowActive
                      ? 'bg-white text-[#3a2b25] shadow-sm border border-[#AA8E7E]/10'
                      : 'text-[#AA8E7E] hover:text-[#3a2b25] hover:bg-white/50'
                    }
                  `}
                  aria-haspopup="menu" aria-expanded={moreOpen}>
                  <MoreHorizontal size={14} strokeWidth={moreOpen || overflowActive ? 3 : 2}
                    className={(moreOpen || overflowActive) ? 'text-[#F6C945]' : ''} />
                  <span>More</span>
                  <ChevronDown size={12}
                    className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </button>

                {moreOpen && (
                  <div
                    role="menu"
                    className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-lift border border-white/70 overflow-hidden animate-scaleIn origin-top-right"
                    style={{ boxShadow: '0 20px 40px -12px rgba(58,43,37,0.18)' }}>
                    <div className="py-2">
                      {adminSecondary.map((item, i) => {
                        if (item.divider) {
                          return <div key={`div-${i}`} className="my-1.5 mx-3 border-t border-[#F3EEE4]" />
                        }
                        const Icon = item.icon
                        const active = isActivePath(item.to, location.pathname)
                        return (
                          <Link
                            key={item.to} to={item.to} role="menuitem"
                            className="flex items-center gap-3 px-4 py-2.5 mx-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
                            style={{
                              color: active ? '#3a2b25' : '#AA8E7E',
                              background: active ? '#FDF9F2' : 'transparent',
                            }}
                            onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#FDF9F2' }}
                            onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                            <Icon size={14}
                              className={active ? 'text-[#F6C945]' : ''}
                              strokeWidth={active ? 3 : 2} />
                            <span className="flex-1">{item.label}</span>
                            {item.highlight && (
                              <span className="w-2 h-2 rounded-full animate-pulse"
                                style={{ background: '#EF7B6C' }} />
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile & Logout */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-[#AA8E7E]/10">
                <div className="hidden sm:flex flex-col items-end leading-none">
                  <p className="text-[11px] font-black font-jakarta text-[#3a2b25] uppercase tracking-wide">{displayName}</p>
                  <p className="text-[9px] text-[#AA8E7E] font-bold mt-0.5 tracking-widest uppercase">{user?.role || (isAdmin ? 'admin' : '')}</p>
                </div>
                {/* Avatar — links to profile for students */}
                {isStudent ? (
                  <Link to="/profile"
                    className="w-10 h-10 rounded-full overflow-hidden shadow-suncast border-2 border-white transform transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                    title="My Profile">
                    <div className="w-full h-full gradient-cta flex items-center justify-center">
                      <span className="text-sm font-black text-[#3E3006]">
                        {avatarLetter}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="w-10 h-10 rounded-full overflow-hidden shadow-suncast border-2 border-white">
                    <div className="w-full h-full gradient-cta flex items-center justify-center">
                      <span className="text-sm font-black text-[#3E3006]">
                        {avatarLetter}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-white border border-[#AA8E7E]/10 flex items-center justify-center text-[#AA8E7E] hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
              title="Sign Out"
              aria-label="Sign out"
              aria-haspopup="dialog">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Nav Bar (Bottom Floating) — primary tabs only */}
      <div className="md:hidden fixed bottom-5 inset-x-3 sm:inset-x-6 z-50" ref={mobileMoreRef}>
        <div className="bg-[#FFFDF9]/95 backdrop-blur-2xl shadow-[0_12px_36px_rgba(58,43,37,0.16)] border border-white/80 rounded-[2rem] p-1.5 flex items-center justify-between">
          {primaryLinks.map(({ to, icon: Icon, label }) => {
            const active = isActivePath(to, location.pathname)
            return (
              <Link key={to} to={to} className={`
                flex-1 flex flex-col items-center py-2.5 gap-1 rounded-2xl transition-all duration-300
                ${active ? 'bg-[#F8D272] text-[#4F3F08] shadow-sm' : 'text-[#AA8E7E] hover:bg-white/40'}
              `}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[8px] font-black uppercase tracking-widest text-center px-1">{label}</span>
              </Link>
            )
          })}
          {isAdmin && (
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex-1 flex flex-col items-center py-3 gap-1 rounded-[2rem] transition-all duration-300 relative ${overflowActive || moreOpen
                  ? 'bg-[#F8D272] text-[#4F3F08] shadow-sm'
                  : 'text-[#AA8E7E] hover:bg-white/40'
                }`}>
              <MoreHorizontal size={20} />
              <span className="text-[9px] font-black uppercase tracking-widest">More</span>
            </button>
          )}
        </div>

        {/* Mobile overflow sheet */}
        {isAdmin && moreOpen && (
          <div className="absolute bottom-24 inset-x-0 bg-white rounded-[2rem] shadow-lift border border-white/70 p-2 animate-fadeIn">
            {adminSecondary.map((item, i) => {
              if (item.divider) {
                return <div key={`mdiv-${i}`} className="my-1 mx-3 border-t border-[#F3EEE4]" />
              }
              const Icon = item.icon
              const active = isActivePath(item.to, location.pathname)
              return (
                <Link key={item.to} to={item.to}
                  className="flex items-center gap-3 px-4 py-3 mx-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  style={{
                    color: active ? '#3a2b25' : '#AA8E7E',
                    background: active ? '#FDF9F2' : 'transparent',
                  }}>
                  <Icon size={16} className={active ? 'text-[#F6C945]' : ''} />
                  <span className="flex-1">{item.label}</span>
                  {item.highlight && (
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#EF7B6C' }} />
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#3a2b25]/60 p-4 backdrop-blur-md animate-fadeIn"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !logoutPending) setLogoutConfirmOpen(false)
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            aria-describedby="logout-confirm-description"
            className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/70 bg-[#FDF9F2] p-6 shadow-lift animate-scaleIn sm:p-7"
            onMouseDown={event => event.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-[#F6C945]" />
            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(false)}
              disabled={logoutPending}
              aria-label="Cancel sign out"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#3a2b25]/50 shadow-sm transition-colors hover:text-[#3a2b25] disabled:opacity-50"
            >
              <X size={18} />
            </button>

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C945]/20 text-[#6B5A10]">
              <LogOut size={22} />
            </div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#AA8E7E]">
              UniWell
            </p>
            <h2 id="logout-confirm-title" className="font-jakarta text-xl font-black text-[#3a2b25]">
              Are you sure you want to log out?
            </h2>
            <p id="logout-confirm-description" className="mt-2 text-sm leading-relaxed text-[#3a2b25]/65">
              You can sign back in whenever you’re ready.
            </p>

            {logoutError && (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {logoutError}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                disabled={logoutPending}
                className="rounded-xl border border-[#AA8E7E]/20 bg-white px-4 py-2.5 text-xs font-bold text-[#5D4037] transition-colors hover:bg-[#FDF9F2] disabled:opacity-50"
              >
                Stay logged in
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                disabled={logoutPending}
                className="rounded-xl bg-[#F6C945] px-4 py-2.5 text-xs font-black text-[#3E3006] shadow-sm transition-all hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
              >
                {logoutPending ? 'Logging out…' : 'Yes, log out'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
