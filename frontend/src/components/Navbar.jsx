import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, SmilePlus, BookOpen, Users, LogOut,
  ShieldCheck, ClipboardList, GraduationCap, ChevronDown,
  FileBarChart2, Stethoscope, Bell, Settings, HelpCircle,
  MoreHorizontal, UserCircle,
} from 'lucide-react'

const studentLinks = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/mood',          icon: SmilePlus,       label: 'Mood Tracker' },
  { to: '/journal',       icon: BookOpen,        label: 'Journal'      },
  { to: '/peer-insights', icon: Users,           label: 'Peer Insights'},
]

// Primary admin tabs — always visible in the top strip.
const adminPrimary = [
  { to: '/admin',            icon: ShieldCheck,    label: 'Analytics'  },
  { to: '/admin/students',   icon: GraduationCap,  label: 'Students'   },
  { to: '/admin/moderation', icon: ClipboardList,  label: 'Moderation' },
]

// Overflow menu — everything the old sidebar exposed.
const adminSecondary = [
  { to: '/admin/alerts',        icon: Bell,          label: 'Alerts', highlight: true },
  { divider: true },
  { to: '/admin/settings',      icon: Settings,      label: 'Settings'       },
  { to: '/admin/help',          icon: HelpCircle,    label: 'Help'           },
]

function isActivePath(to, pathname) {
  return pathname === to || (to === '/admin' && pathname === '/admin/analytics')
}

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const desktopMoreRef = useRef(null)
  const mobileMoreRef = useRef(null)

  const primaryLinks = isAdmin ? adminPrimary : studentLinks
  const firstName = user?.name?.split(' ')[0] || ''

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
      const inMobile  = mobileMoreRef.current?.contains(t)
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

  const handleLogout = async () => { await signOut(); navigate('/login') }

  return (
    <>
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 px-6 ${scrolled ? 'pt-4' : 'pt-6'}`}>
        <div className={`max-w-6xl mx-auto h-16 flex items-center justify-between gap-4 px-6 rounded-3xl transition-all duration-500 ${scrolled ? 'glass shadow-lift border border-white/50 py-2' : 'bg-transparent py-4 border border-transparent'}`}>

          {/* Logo */}
          <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2.5 group flex-shrink-0">
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
                  <p className="text-[11px] font-black font-jakarta text-[#3a2b25] uppercase tracking-wide">{firstName}</p>
                  <p className="text-[9px] text-[#AA8E7E] font-bold mt-0.5 tracking-widest uppercase">{user?.role}</p>
                </div>
                {/* Avatar — links to profile for students */}
                {!isAdmin ? (
                  <Link to="/profile"
                    className="w-10 h-10 rounded-2xl overflow-hidden shadow-suncast border-2 border-white transform transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                    title="My Profile">
                    <div className="w-full h-full gradient-cta flex items-center justify-center">
                      <span className="text-sm font-black text-[#3E3006]">
                        {firstName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-suncast border-2 border-white">
                    <div className="w-full h-full gradient-cta flex items-center justify-center">
                      <span className="text-sm font-black text-[#3E3006]">
                        {firstName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-2xl bg-white border border-[#AA8E7E]/10 flex items-center justify-center text-[#AA8E7E] hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
              title="Sign Out">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Nav Bar (Bottom Floating) — primary tabs only */}
        <div className="md:hidden fixed bottom-6 inset-x-6 z-50" ref={mobileMoreRef}>
          <div className="glass shadow-lift border border-white/50 rounded-[2.5rem] p-2 flex items-center justify-between">
            {primaryLinks.map(({ to, icon: Icon, label }) => {
              const active = isActivePath(to, location.pathname)
              return (
                <Link key={to} to={to} className={`
                  flex-1 flex flex-col items-center py-3 gap-1 rounded-[2rem] transition-all duration-300
                  ${active ? 'bg-[#F8D272] text-[#4F3F08] shadow-sm' : 'text-[#AA8E7E] hover:bg-white/40'}
                `}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
                </Link>
              )
            })}
            {isAdmin && (
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={`flex-1 flex flex-col items-center py-3 gap-1 rounded-[2rem] transition-all duration-300 relative ${
                  overflowActive || moreOpen
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
      </nav>
    </>
  )
}
