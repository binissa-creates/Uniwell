import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Get the current domain for the reset URL
      const redirectUrl = `${window.location.origin}/reset-password`
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (resetError) throw resetError

      setSubmitted(true)
    } catch (err) {
      setError(err?.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-[#FDF9F2] flex flex-col md:flex-row relative overflow-hidden">
      {/* Background blob */}
      <div className="absolute top-1/2 left-[45%] -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full bg-[#EAF2E6] mix-blend-multiply opacity-60 z-0"></div>

      {/* LEFT SIDE (Branding) */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] px-12 xl:px-16 py-8 z-10 relative h-full">
        <div>
          <Link to="/login" className="flex items-center gap-2 bg-white px-4 py-2 rounded-full w-max shadow-sm shadow-warm/5 hover:shadow-md transition-shadow">
            <ArrowLeft size={16} className="text-[#3a2b25]" />
            <span className="font-jakarta font-bold text-[#3a2b25] text-sm">Back</span>
          </Link>

          <div className="mt-10 lg:mt-12 mb-3 flex items-center gap-3">
            <div className="h-px w-10 bg-[#3a2b25]/20"></div>
            <p className="text-[#6B5A10] text-[10px] uppercase font-bold tracking-[0.2em]">Campus Digital Well-Being</p>
          </div>

          <h1 className="font-jakarta text-5xl xl:text-[4.2rem] leading-[1.05] font-extrabold text-[#3a2b25] mb-6">
            Recover Your<br />
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
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#EEDDCB] flex items-center justify-center text-[#705800] text-lg">🔐</div>
            <div>
              <p className="font-jakarta font-bold text-[#3a2b25] text-xs">Secure<br />Reset</p>
              <p className="text-[#3a2b25]/60 text-[10px] mt-1 leading-relaxed pr-2">Your password is safe with us.</p>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 flex gap-3 flex-1 shadow-sm border border-white/50">
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#EAF2E6] flex items-center justify-center text-[#2D5A29] text-lg">✉️</div>
            <div>
              <p className="font-jakarta font-bold text-[#3a2b25] text-xs">Email<br />Verification</p>
              <p className="text-[#3a2b25]/60 text-[10px] mt-1 leading-relaxed pr-2">Quick and easy recovery.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (Form) */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col items-center py-8 px-6 lg:px-12 z-10">
        <div className="w-full max-w-[460px] flex flex-col items-center my-auto">

          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-6 justify-center">
            <button onClick={() => navigate('/login')} className="flex items-center gap-1 text-[#3a2b25] hover:text-[#6B5A10] transition-colors">
              <ArrowLeft size={18} />
              <span className="text-xs font-bold">Back</span>
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-[3rem] w-full p-10 sm:p-12 shadow-lift border border-white/50 relative">
            {!submitted ? (
              <>
                <h2 className="font-jakarta text-3xl font-extrabold text-center text-[#3a2b25] mb-2">Forgot Password?</h2>
                <p className="text-center text-[#3a2b25]/50 text-sm mb-8">Enter your email and we'll send you a link to reset your password.</p>

                {error && (
                  <div className="bg-red-50 text-red-600 text-xs rounded-2xl px-5 py-4 mb-8 text-center border border-red-100 animate-scaleIn font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#B09C8E] uppercase tracking-[0.2em] ml-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@university.edu"
                      className="w-full bg-[#FCF8F4] text-[#3a2b25] text-sm px-6 py-4 rounded-2xl outline-none placeholder-[#B09C8E]/40 focus:ring-2 focus:ring-[#F8D272] border border-transparent focus:border-[#F8D272] transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full gradient-cta text-[#3E3006] hover:shadow-glow shadow-sm font-extrabold rounded-2xl py-4 flex items-center justify-center gap-3 transition-all active:scale-[0.98] mt-6 disabled:opacity-50 disabled:cursor-not-allowed transform"
                  >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-[#AA8E7E]/10 text-center">
                  <p className="text-xs text-[#3a2b25]/60">Remember your password?</p>
                  <Link to="/login" className="text-xs font-bold text-[#6B5A10] hover:text-[#F8D272] transition-colors mt-2 inline-block">
                    Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#EAF2E6] flex items-center justify-center">
                    <CheckCircle size={32} className="text-[#2D5A29]" />
                  </div>
                </div>
                <h2 className="font-jakarta text-2xl font-extrabold text-[#3a2b25] mb-3">Check Your Email</h2>
                <p className="text-[#3a2b25]/60 text-sm mb-2">We've sent a password reset link to:</p>
                <p className="font-bold text-[#3a2b25] mb-6">{email}</p>
                <p className="text-[#3a2b25]/50 text-xs mb-8 leading-relaxed">
                  Click the link in your email to create a new password. If you don't see it, check your spam folder.
                </p>
                <Link
                  to="/login"
                  className="w-full bg-[#F8D272] text-[#3E3006] hover:shadow-glow shadow-sm font-extrabold rounded-2xl py-4 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                >
                  Back to Login
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
