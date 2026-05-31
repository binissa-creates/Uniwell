import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(true)
  const [checkingToken, setCheckingToken] = useState(true)

  // Check if user has a valid recovery session from email link
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          setTokenValid(false)
        } else {
          // Check if this is a recovery session
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          if (userError || !user) {
            setTokenValid(false)
          }
        }
      } catch (err) {
        console.error('Error checking session:', err)
        setTokenValid(false)
      } finally {
        setCheckingToken(false)
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) throw updateError

      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err?.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingToken) {
    return (
      <div className="h-screen bg-[#FDF9F2] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[#F8D272] mx-auto mb-4" />
          <p className="text-[#3a2b25] font-jakarta">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="h-screen bg-[#FDF9F2] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-[460px] bg-white rounded-[3rem] p-10 sm:p-12 shadow-lift border border-white/50 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle size={32} className="text-red-600" />
            </div>
          </div>
          <h2 className="font-jakarta text-2xl font-extrabold text-[#3a2b25] mb-3">Reset Link Expired</h2>
          <p className="text-[#3a2b25]/60 text-sm mb-8">
            The password reset link has expired. This can happen if the link is older than 24 hours or has already been used.
          </p>
          <Link
            to="/forgot-password"
            className="w-full bg-[#F8D272] text-[#3E3006] hover:shadow-glow shadow-sm font-extrabold rounded-2xl py-4 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            Request New Reset Link
          </Link>
          <Link
            to="/login"
            className="mt-4 inline-block text-xs font-bold text-[#6B5A10] hover:text-[#F8D272] transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#FDF9F2] flex flex-col md:flex-row relative overflow-hidden">
      {/* Background blob */}
      <div className="absolute top-1/2 left-[45%] -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full bg-[#EAF2E6] mix-blend-multiply opacity-60 z-0"></div>

      {/* LEFT SIDE (Branding) */}
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
            Create Your<br />
            <span className="font-playfair italic text-[#6B5A10] font-bold">New Password.</span>
          </h1>
        </div>

        <div className="flex gap-4">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 flex gap-3 flex-1 shadow-sm border border-white/50">
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#EEDDCB] flex items-center justify-center text-[#705800] text-lg">🔒</div>
            <div>
              <p className="font-jakarta font-bold text-[#3a2b25] text-xs">Strong<br />Protection</p>
              <p className="text-[#3a2b25]/60 text-[10px] mt-1 leading-relaxed pr-2">Keep your account safe.</p>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 flex gap-3 flex-1 shadow-sm border border-white/50">
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#EAF2E6] flex items-center justify-center text-[#2D5A29] text-lg">✨</div>
            <div>
              <p className="font-jakarta font-bold text-[#3a2b25] text-xs">Fresh<br />Start</p>
              <p className="text-[#3a2b25]/60 text-[10px] mt-1 leading-relaxed pr-2">Begin anew with wellness.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (Form) */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col items-center py-8 px-6 lg:px-12 z-10">
        <div className="w-full max-w-[460px] flex flex-col items-center my-auto">

          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-6 justify-center">
            <div className="w-10 h-10 rounded-full bg-[#EEDDCB] flex items-center justify-center text-xl">🌻</div>
            <span className="font-jakarta font-bold text-[#3a2b25] text-xl tracking-tight">UniWell</span>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-[3rem] w-full p-10 sm:p-12 shadow-lift border border-white/50 relative">
            {!success ? (
              <>
                <h2 className="font-jakarta text-3xl font-extrabold text-center text-[#3a2b25] mb-2">Create New Password</h2>
                <p className="text-center text-[#3a2b25]/50 text-sm mb-8">Enter a strong password to protect your wellness journey.</p>

                {error && (
                  <div className="bg-red-50 text-red-600 text-xs rounded-2xl px-5 py-4 mb-8 text-center border border-red-100 animate-scaleIn font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#B09C8E] uppercase tracking-[0.2em] ml-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full bg-[#FCF8F4] text-[#3a2b25] text-sm pl-6 pr-14 py-4 rounded-2xl outline-none placeholder-[#B09C8E]/40 focus:ring-2 focus:ring-[#F8D272] border border-transparent focus:border-[#F8D272] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-[#B09C8E] hover:text-[#3a2b25] transition-colors p-1"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-[9px] text-[#3a2b25]/50 ml-1">At least 8 characters</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#B09C8E] uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full bg-[#FCF8F4] text-[#3a2b25] text-sm pl-6 pr-14 py-4 rounded-2xl outline-none placeholder-[#B09C8E]/40 focus:ring-2 focus:ring-[#F8D272] border border-transparent focus:border-[#F8D272] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-[#B09C8E] hover:text-[#3a2b25] transition-colors p-1"
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !password || !confirmPassword}
                    className="w-full gradient-cta text-[#3E3006] hover:shadow-glow shadow-sm font-extrabold rounded-2xl py-4 flex items-center justify-center gap-3 transition-all active:scale-[0.98] mt-6 disabled:opacity-50 disabled:cursor-not-allowed transform"
                  >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#EAF2E6] flex items-center justify-center">
                    <CheckCircle size={32} className="text-[#2D5A29]" />
                  </div>
                </div>
                <h2 className="font-jakarta text-2xl font-extrabold text-[#3a2b25] mb-3">Password Updated!</h2>
                <p className="text-[#3a2b25]/60 text-sm mb-8">
                  Your password has been successfully reset. Redirecting to login...
                </p>
                <Link
                  to="/login"
                  className="w-full bg-[#F8D272] text-[#3E3006] hover:shadow-glow shadow-sm font-extrabold rounded-2xl py-4 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                >
                  Go to Login
                </Link>
              </div>
            )}
          </div>

          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-[9px] font-extrabold text-[#AA8E7E]/60 tracking-[0.25em] justify-center text-center w-full uppercase">
            <span className="hover:text-[#6B5A10] cursor-pointer transition-colors">Emergency</span>
            <span className="hover:text-[#6B5A10] cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-[#6B5A10] cursor-pointer transition-colors">Disclaimer</span>
          </div>
        </div>
      </div>
    </div>
  )
}
