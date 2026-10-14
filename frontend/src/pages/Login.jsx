import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getHomeForRole } from '../lib/portalAccess'
import LoadingIndicator from '../components/LoadingIndicator'
import { Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight, GraduationCap } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    let signedIn = false
    try {
      console.log('[Login] Attempting sign-in for:', form.email)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (signInError) {
        console.error('[Login] signInWithPassword error:', signInError)
        throw signInError
      }
      console.log('[Login] Auth succeeded, user ID:', data.user?.id)
      signedIn = true

      // Use get_my_role RPC (SECURITY DEFINER — bypasses RLS) as primary method.
      // Fall back to direct table query if the RPC is unavailable.
      let role = null
      let status = null

      const { data: rpcRole, error: rpcError } = await supabase.rpc('get_my_role')
      console.log('[Login] get_my_role result:', { rpcRole, rpcError })

      if (!rpcError && rpcRole) {
        role = rpcRole
        // get_my_role only returns role; fetch status separately (own-row is always readable)
        const { data: statusRow } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', data.user.id)
          .maybeSingle()
        status = statusRow?.status ?? 'active'
        console.log('[Login] Resolved via RPC — role:', role, 'status:', status)
      } else {
        // RPC unavailable — fall back to direct table query
        console.warn('[Login] get_my_role unavailable, falling back to table query:', rpcError)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, status')
          .eq('id', data.user.id)
          .maybeSingle()
        console.log('[Login] Profile fetch result:', { profile, profileError })

        if (profileError) {
          console.error('[Login] Profile fetch error:', profileError?.message, profileError?.code)
          await signOut()
          setError(`Sign-in is temporarily unavailable (${profileError?.code ?? 'DB_ERROR'}). Please contact your administrator.`)
          return
        }
        if (!profile) {
          console.warn('[Login] No profile row found for user:', data.user.id)
          await signOut()
          setError('Your account profile was not found. Please contact your administrator.')
          return
        }
        role = profile.role
        status = profile.status
        console.log('[Login] Resolved via table — role:', role, 'status:', status)
      }

      if (status === 'disabled') {
        await signOut()
        setError('This account is inactive. Please contact the guidance office.')
        return
      }

      if (status === 'invited') {
        navigate('/accept-invite')
        return
      }

      if (status !== 'active' || !['student', 'counselor', 'admin'].includes(role)) {
        console.warn('[Login] Invalid status/role:', { role, status })
        await signOut()
        setError('Invalid email or password.')
        return
      }

      // Fire-and-forget audit log — a failed RPC should never block a successful login.
      if (role === 'counselor' || role === 'admin') {
        supabase.rpc('log_staff_sign_in').then(({ error: auditError }) => {
          if (auditError) console.warn('[Login] Staff sign-in audit failed (non-blocking):', auditError)
        })
      }

      const destination = getHomeForRole(role)
      console.log('[Login] Navigating to:', destination)
      navigate(destination)
    } catch (err) {
      console.error('[Login] Sign-in failed:', err)
      if (signedIn) await signOut()
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-[#FDF9F2] flex flex-col md:flex-row relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/2 left-[45%] -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full bg-[#EAF2E6] mix-blend-multiply opacity-60 z-0"></div>

      {/* ── LEFT SIDE (Branding) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] px-12 xl:px-16 py-8 z-10 relative h-full">
        <div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full w-max shadow-sm shadow-warm/5">
            <div className="w-6 h-6 rounded-full bg-[#EEDDCB] flex items-center justify-center">
              <span className="text-[10px]">🌻</span>
            </div>
            <span className="font-jakarta font-bold text-[#3a2b25] text-sm">UniWell</span>
          </div>

          <div className="mt-10 lg:mt-12 mb-3 flex items-center gap-3">
            <div className="h-px w-10 bg-[#3a2b25]/20"></div>
            <p className="text-[#6B5A10] text-[10px] uppercase font-bold tracking-[0.2em]">Campus Digital Well-Being</p>
          </div>

          <h1 className="font-jakarta text-5xl xl:text-[4.2rem] leading-[1.05] font-extrabold text-[#3a2b25] mb-6">
            Welcome<br />Back To<br />
            <span className="font-playfair italic text-[#6B5A10] font-bold">Wellness.</span>
          </h1>
        </div>

        <div className="relative w-full max-w-[380px] min-h-[160px] flex-1 max-h-[260px] rounded-[2.5rem] overflow-hidden shadow-xl mb-6 flex-shrink-0">
          <img src="/sunflower.png" alt="Sunflower" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#4f360c]/80 via-[#4f360c]/20 to-transparent flex items-end p-6">
            <p className="text-white font-playfair italic text-lg shadow-sm">"Every day is a chance to grow a little more."</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 flex gap-3 flex-1 shadow-sm border border-white/50">
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#EEDDCB] flex items-center justify-center text-[#705800]">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="font-jakarta font-bold text-[#3a2b25] text-xs">Confidential<br />Space</p>
              <p className="text-[#3a2b25]/60 text-[10px] mt-1 leading-relaxed pr-2">Private support for all students.</p>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 flex gap-3 flex-1 shadow-sm border border-white/50">
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#EAF2E6] flex items-center justify-center text-[#2D5A29]">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="font-jakarta font-bold text-[#3a2b25] text-xs">Radiant<br />Tools</p>
              <p className="text-[#3a2b25]/60 text-[10px] mt-1 leading-relaxed pr-2">Modern resources for growth.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDE (Form) ── */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col items-center py-8 px-6 lg:px-12 z-10">
        <div className="w-full max-w-[460px] flex flex-col items-center my-auto">

          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="w-10 h-10 rounded-full bg-[#EEDDCB] flex items-center justify-center text-xl">🌻</div>
            <span className="font-jakarta font-bold text-[#3a2b25] text-xl tracking-tight">UniWell</span>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-[3rem] w-full p-10 sm:p-12 shadow-lift border border-white/50 relative">
            <h2 className="font-jakarta text-4xl font-extrabold text-center text-[#3a2b25] mb-2">Welcome Back</h2>
            <p className="text-center text-[#3a2b25]/50 text-sm mb-10">Sign in to your wellness sanctuary.</p>

            {error && (
                <div role="alert" aria-live="polite" className="bg-red-50 text-red-600 text-xs rounded-2xl px-5 py-4 mb-8 text-center border border-red-100 animate-scaleIn font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-[10px] font-bold text-[#B09C8E] uppercase tracking-[0.2em] ml-1">Email</label>
                <input id="login-email" type="email" name="email" autoComplete="username" value={form.email} onChange={handleChange} required placeholder="you@university.edu"
                  className="w-full bg-[#FCF8F4] text-[#3a2b25] text-sm px-6 py-4 rounded-2xl outline-none placeholder-[#B09C8E]/40 focus:ring-2 focus:ring-[#F8D272] border border-transparent focus:border-[#F8D272] transition-all" />
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-[10px] font-bold text-[#B09C8E] uppercase tracking-[0.2em] ml-1">Password</label>
                <div className="relative">
                  <input id="login-password" type={showPw ? 'text' : 'password'} name="password" autoComplete="current-password" value={form.password} onChange={handleChange} required placeholder="••••••••"
                    className="w-full bg-[#FCF8F4] text-[#3a2b25] text-sm pl-6 pr-14 py-4 rounded-2xl outline-none placeholder-[#B09C8E]/40 focus:ring-2 focus:ring-[#F8D272] border border-transparent focus:border-[#F8D272] transition-all" />
                  <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#B09C8E] hover:text-[#3a2b25] transition-colors p-1">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Link to="/forgot-password" className="text-xs font-bold text-[#B09C8E] hover:text-[#3a2b25] transition-colors">Forgot Password?</Link>
              </div>

              <button type="submit" disabled={loading}
                aria-busy={loading}
                className="w-full gradient-cta text-[#3E3006] hover:shadow-glow shadow-sm font-extrabold rounded-2xl py-4 flex items-center justify-center gap-3 transition-all active:scale-[0.98] mt-4 transform disabled:cursor-not-allowed disabled:opacity-70">
                {loading && <LoadingIndicator size={16} label="Signing in" />}
                {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} />
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-[#AA8E7E]/10 text-center">
              <p className="text-[11px] font-bold text-[#3a2b25]/40 mb-5 tracking-wide">NEW TO UNIWELL?</p>
              <Link to="/register" className="group w-full flex items-center justify-center gap-3 rounded-2xl py-4 border border-[#AA8E7E]/20 text-xs font-bold text-[#3a2b25] hover:bg-[#FCF8F3] transition-all hover:border-[#F8D272]">
                <GraduationCap size={18} className="text-[#6B5A10]" /> Create Student Account
              </Link>
              <p className="mt-5 text-xs text-[#3a2b25]/45">Guidance staff? Use the invitation link sent to your email.</p>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-[9px] font-extrabold text-[#AA8E7E]/60 tracking-[0.25em] justify-center text-center w-full uppercase">
            <span className="hover:text-[#6B5A10] cursor-pointer transition-colors">Emergency</span>
            <span className="hover:text-[#6B5A10] cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-[#6B5A10] cursor-pointer transition-colors">Disclaimer</span>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-[#AA8E7E]/40">
            <div className="h-px bg-[#AA8E7E]/10 flex-1 max-w-[60px]"></div>
            <span className="text-[10px] font-bold tracking-widest uppercase">© 2024 UniWell Campus</span>
            <div className="h-px bg-[#AA8E7E]/10 flex-1 max-w-[60px]"></div>
          </div>

        </div>
      </div>
    </div>
  )
}
