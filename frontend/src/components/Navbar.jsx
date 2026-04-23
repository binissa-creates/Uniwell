import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, SmilePlus, BookOpen, Users, LogOut,
  ShieldCheck, ClipboardList, ChevronDown,
} from 'lucide-react'

const studentLinks = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/mood',          icon: SmilePlus,       label: 'Mood Tracker' },
  { to: '/journal',       icon: BookOpen,        label: 'Journal'      },
  { to: '/peer-insights', icon: Users,           label: 'Peer Insights'},
]

const adminLinks = [
  { to: '/admin',            icon: ShieldCheck,   label: 'Analytics'  },
  { to: '/admin/moderation', icon: ClipboardList, label: 'Moderation' },
]

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth()
  const location  = useLocation()
  const navigate  = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const links     = isAdmin ? adminLinks : studentLinks
  const firstName = user?.name?.split(' ')[0] || ''

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
            {links.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to
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
          </div>

          {/* Profile & Logout */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-[#AA8E7E]/10">
                <div className="hidden sm:flex flex-col items-end leading-none">
                  <p className="text-[11px] font-black font-jakarta text-[#3a2b25] uppercase tracking-wide">{firstName}</p>
                  <p className="text-[9px] text-[#AA8E7E] font-bold mt-0.5 tracking-widest uppercase">{user?.role}</p>
                </div>
                <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-suncast border-2 border-white transform transition-transform hover:scale-105 active:scale-95 cursor-pointer">
                  <div className="w-full h-full gradient-cta flex items-center justify-center">
                    <span className="text-sm font-black text-[#3E3006]">
                      {firstName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-2xl bg-white border border-[#AA8E7E]/10 flex items-center justify-center text-[#AA8E7E] hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Nav Bar (Bottom Floating) */}
        <div className="md:hidden fixed bottom-6 inset-x-6 z-50">
          <div className="glass shadow-lift border border-white/50 rounded-[2.5rem] p-2 flex items-center justify-between">
            {links.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to
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
          </div>
        </div>
      </nav>
    </>
  )
}
