import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Loader2, ShieldCheck, Sparkles, ArrowRight, UserCircle, GraduationCap } from 'lucide-react'

const COURSES = ['Computer Science', 'Tourism', 'Psychology', 'Nursing', 'Education', 'Business Administration', 'Engineering', 'Architecture', 'Communication', 'Other']
const YEARS = ['1st', '2nd', '3rd', '4th']

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', student_id: '', course: '', year_level: 0, password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.course || !form.year_level || form.year_level < 1) {
      setError('Please select your course and year level.')
      return
    }
    setLoading(true)
    try {
      // Metadata is forwarded to the handle_new_user() trigger which
      // creates the matching public.profiles row.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            student_id: form.student_id,
            course: form.course,
            year_level: Number(form.year_level),
            role: 'student',
          },
        },
      })
      if (signUpError) throw signUpError

      // If email confirmations are enabled, there is no session yet — prompt the user.
      if (!data.session) {
        setError('Check your email to confirm your account, then sign in.')
        return
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-[#FDF9F2] flex flex-col md:flex-row relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/2 left-[45%] -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full bg-[#EAF2E6] mix-blend-multiply opacity-60 z-0"></div>

      {/* ── LEFT SIDE ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] px-12 xl:px-16 py-8 z-10 relative h-full">
        <div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full w-max shadow-sm shadow-warm/5">
            <div className="w-6 h-6 rounded-full bg-[#EEDDCB] flex items-center justify-center">
              <span className="text-[10px]">🌻</span>
            </div>
            <span className="font-jakarta font-bold text-warm text-sm">UniWell</span>
          </div>

          <div className="mt-10 lg:mt-12 mb-3 flex items-center gap-3">
            <div className="h-px w-10 bg-[#3a2b25]/20"></div>
            <p className="text-[#6B5A10] text-[10px] uppercase font-bold tracking-[0.2em]">Campus-Based Digital Well-Being</p>
          </div>

          <h1 className="font-jakarta text-5xl xl:text-[4.2rem] leading-[1.05] font-extrabold text-[#3a2b25] mb-6">
            Your<br />Wellness<br />
            <span className="font-playfair italic text-[#6B5A10] font-bold">Journey Starts.</span>
          </h1>
        </div>

        <div className="relative w-full max-w-[380px] min-h-[160px] flex-1 max-h-[260px] rounded-[2.5rem] overflow-hidden shadow-xl mb-6 flex-shrink-0">
          <img src="/sunflower.png" alt="Sunflower" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#4f360c]/80 via-[#4f360c]/20 to-transparent flex items-end p-6">
            <p className="text-white font-playfair italic text-lg shadow-sm">"Like a sunflower, always turn toward the light."</p>
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

      {/* ── RIGHT SIDE ── */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col items-center py-8 px-6 lg:px-12 z-10">
        <div className="w-full max-w-[460px] flex flex-col items-center my-auto">

          {/* Toggle pill */}
          <div className="bg-[#F8EFE5] rounded-full p-1.5 flex gap-1 mb-10 w-max shadow-sm border border-white">
            <div className="bg-[#F8D272] text-[#4F3F08] px-6 py-2 rounded-full text-xs font-bold shadow-sm">Student Portal</div>
            <div className="px-6 py-2 rounded-full text-[11px] font-bold text-[#AA8E7E] cursor-pointer hover:bg-white/40 border border-transparent hover:border-[#AA8E7E]/10">Staff & Guidance</div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-[2.5rem] w-full p-8 sm:p-10 shadow-[0_20px_50px_-12px_rgba(93,64,55,0.06)] flex flex-col">
            <h2 className="font-jakarta text-3xl font-extrabold text-center text-[#3a2b25] mb-1">Begin Your Path</h2>
            <p className="text-center text-[#3a2b25]/60 text-sm mb-8">Join our community of student well-being.</p>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-6 text-center border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-[#B09C8E] uppercase tracking-widest mb-2 block">Full Name</label>
                  <input name="name" value={form.name} onChange={handleChange} required placeholder="John Doe"
                    className="w-full bg-[#FCF8F4] text-[#3a2b25] text-sm px-4 py-3.5 rounded-2xl outline-none placeholder-[#B09C8E]/40 focus:ring-2 focus:ring-[#F8D272] border border-transparent focus:border-[#F8D272] transition-all" />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-[#B09C8E] uppercase tracking-widest mb-2 block">Student ID</label>
                  <input name="student_id" value={form.student_id} onChange={handleChange} required placeholder="2024-XXXXX"
                    className="w-full bg-[#FCF8F4] text-[#3a2b25] text-sm px-4 py-3.5 rounded-2xl outline-none placeholder-[#B09C8E]/40 focus:ring-2 focus:ring-[#F8D272] border border-transparent focus:border-[#F8D272] transition-all" />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-[#B09C8E] uppercase tracking-widest mb-2 block">Email Address</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@university.edu"
                  className="w-full bg-[#FCF8F4] text-[#3a2b25] text-sm px-4 py-3.5 rounded-2xl outline-none placeholder-[#B09C8E]/40 focus:ring-2 focus:ring-[#F8D272] border border-transparent focus:border-[#F8D272] transition-all" />
              </div>

              <div>
                <label className="text-[9px] font-bold text-[#B09C8E] uppercase tracking-widest mb-2 block">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required placeholder="••••••••"
                    className="w-full bg-[#FCF8F4] text-[#3a2b25] text-sm pl-4 pr-12 py-3.5 rounded-2xl outline-none placeholder-[#B09C8E]/40 focus:ring-2 focus:ring-[#F8D272] border border-transparent focus:border-[#F8D272] transition-all" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B09C8E] hover:text-[#3a2b25]">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-[#B09C8E] uppercase tracking-widest mb-2 block">Program / Course</label>
                <div className="relative">
                  <select name="course" value={form.course} onChange={handleChange} required
                    className="w-full bg-[#FCF8F4] text-[#3a2b25] text-sm px-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#F8D272] border border-transparent focus:border-[#F8D272] appearance-none transition-all cursor-pointer">
                    <option value="">Select your academic program</option>
                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#B09C8E]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-[#B09C8E] uppercase tracking-widest mb-2 block">Year Level</label>
                <div className="flex gap-2">
                  {YEARS.map((y, i) => {
                    const yearNum = i + 1;
                    const isActive = form.year_level === yearNum;
                    return (
                      <button key={y} type="button" onClick={() => setForm({ ...form, year_level: yearNum })}
                        className={`flex-1 py-3 rounded-2xl text-xs font-semibold transition-all border ${isActive ? 'bg-[#F8D272] text-[#4F3F08] border-[#EBC15A]/30 shadow-sm' : 'bg-[#FCF8F4] text-[#3a2b25]/60 hover:bg-[#F3EFE9] border-transparent'}`}>
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full mt-4 bg-[#F8D272] text-[#3E3006] hover:bg-[#EBC15A] shadow-sm font-bold rounded-2xl py-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Creating...' : 'Get Started'} <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#AA8E7E]/15 text-center">
              <p className="text-[11px] font-bold text-[#3a2b25]/60 mb-4">Already part of UniWell?</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/login" className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 border border-[#AA8E7E]/20 text-xs font-bold text-[#3a2b25] hover:bg-[#FCF8F4] transition-colors">
                  <GraduationCap size={15} /> Student Login
                </Link>
                <Link to="/login-staff" className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 border border-[#AA8E7E]/20 text-xs font-bold text-[#3a2b25] hover:bg-[#FCF8F4] transition-colors">
                  <UserCircle size={15} /> Staff Login
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[9px] font-bold text-[#AA8E7E]/70 tracking-[0.2em] justify-center text-center w-full">
            <span className="hover:text-[#6B5A10] cursor-pointer transition-colors">EMERGENCY RESOURCES</span>
            <span className="hover:text-[#6B5A10] cursor-pointer transition-colors">PRIVACY POLICY</span>
            <span className="hover:text-[#6B5A10] cursor-pointer transition-colors">WELLNESS DISCLAIMER</span>
            <div className="w-full flex items-center justify-center gap-4 text-[#AA8E7E]/50">
              <div className="h-px bg-[#AA8E7E]/20 flex-1 max-w-[40px]"></div>
              <span>© 2024 UNIWELL CAMPUS WELLNESS SYSTEM</span>
              <div className="h-px bg-[#AA8E7E]/20 flex-1 max-w-[40px]"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
