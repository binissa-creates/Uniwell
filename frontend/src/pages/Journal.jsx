import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { journalPromptForToday } from '../lib/data'
import { Loader2, Trash2, CheckCircle2, PenLine, BookOpen, Sparkles, Clock } from 'lucide-react'

const ENTRY_THEMES = [
  { bg: '#ffffff', accent: 'var(--color-primary-container)' },
  { bg: '#ffffff', accent: 'var(--color-secondary-container)' },
  { bg: '#ffffff', accent: 'var(--color-tertiary-container)' },
]

export default function Journal() {
  const [entries, setEntries]   = useState([])
  const [prompt, setPrompt]     = useState('')
  const [content, setContent]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]     = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [charCount, setCharCount] = useState(0)

  const loadData = useCallback(async () => {
    setPrompt(journalPromptForToday())
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, content, prompt, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      setEntries(data || [])
    } catch (err) {
      console.error('[journal load]', err)
      setEntries([])
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleContentChange = (e) => {
    setContent(e.target.value)
    setCharCount(e.target.value.length)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) throw new Error('Not authenticated')
      const { error } = await supabase.from('journal_entries').insert({
        user_id: auth.user.id,
        content: content.trim(),
        prompt: prompt || null,
      })
      if (error) throw error
      setContent('')
      setCharCount(0)
      setSuccess(true)
      loadData()
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      console.error('[journal submit]', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      const { error } = await supabase.from('journal_entries').delete().eq('id', id)
      if (error) throw error
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      console.error('[journal delete]', err)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF9F2] relative overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-[40rem] h-[40rem] rounded-full bg-[#A8C5A0]/5 blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24 relative z-10 page-enter">

        {/* ── Page Header ── */}
        <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#6B5A10]/30"></div>
              <p className="text-[#6B5A10] text-[10px] font-black uppercase tracking-[0.4em]">Personal Archive</p>
            </div>
            <h1 className="font-jakarta text-5xl md:text-6xl font-extrabold text-[#3a2b25] mb-4">
              Journal <span className="font-playfair italic text-[#6B5A10] font-bold">Sanctuary</span>
            </h1>
            <p className="text-[#3a2b25]/50 text-base md:text-lg max-w-lg leading-relaxed font-medium">
              Transform your thoughts into growth. This is a private, encrypted space for your inner dialogue.
            </p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-6 border border-white shadow-lift max-w-xs animate-slideInRight">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-[#6B5A10]" />
              <span className="text-[10px] font-black text-[#6B5A10] uppercase tracking-widest">Growth Prompt</span>
            </div>
            <p className="text-[13px] font-bold text-[#3a2b25] leading-relaxed italic">
              "{prompt}"
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* ── COMPOSE PANEL ── */}
          <div className="lg:col-span-5 hidden lg:block sticky top-32">
            <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-1 shadow-lift border border-white overflow-hidden">
              <div className="p-8 lg:p-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F6C945]/10 flex items-center justify-center text-[#6B5A10] shadow-inner">
                    <PenLine size={24} />
                  </div>
                  <div>
                    <h2 className="font-jakarta font-black text-[#3a2b25] text-lg uppercase tracking-tight">New Entry</h2>
                    <p className="text-[10px] font-bold text-[#AA8E7E] uppercase tracking-widest">{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</p>
                  </div>
                </div>

                <div className="relative group">
                  <textarea 
                    value={content} 
                    onChange={handleContentChange}
                    placeholder="Begin your reflection..."
                    className="w-full rounded-[2rem] bg-[#FDF9F2] p-8 text-base text-[#3a2b25] placeholder-[#AA8E7E]/40 outline-none focus:ring-2 focus:ring-[#6B5A10]/10 border border-transparent transition-all resize-none leading-[1.8] font-medium"
                    style={{ minHeight: '380px' }}
                  />
                  <div className="absolute bottom-6 right-8 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#AA8E7E] uppercase tracking-widest">{charCount} characters</span>
                  </div>
                </div>

                {success && (
                  <div className="bg-[#EAF2E6] text-[#2D5A29] rounded-2xl p-4 text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 animate-scaleIn">
                    <CheckCircle2 size={16} /> Seed of Reflection Sown
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={!content.trim() || loading}
                  className="w-full gradient-cta text-[#3E3006] font-black uppercase tracking-[0.2em] rounded-2xl py-5 flex items-center justify-center gap-3 shadow-lift hover:shadow-glow transition-all active:scale-[0.98] disabled:opacity-30 text-xs"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Securing...' : 'Commit to Garden'}
                </button>
              </div>
            </form>
          </div>

          {/* ── MOBILE COMPOSE TRIGGER ── */}
          <button className="lg:hidden w-full bg-[#3a2b25] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lift">
            <PenLine size={16} /> Write New Entry
          </button>

          {/* ── TIMELINE ── */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <BookOpen size={18} className="text-[#6B5A10]" />
                <h3 className="font-jakarta font-black text-[#3a2b25] text-sm uppercase tracking-widest">Timeline</h3>
              </div>
              <span className="px-4 py-1.5 rounded-full bg-white border border-[#AA8E7E]/10 text-[9px] font-black text-[#AA8E7E] uppercase tracking-widest shadow-sm">
                {entries.length} Reflections logged
              </span>
            </div>

            {entries.length === 0 ? (
               <div className="bg-white rounded-[2.5rem] p-20 shadow-suncast border border-white flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-[#FDF9F2] flex items-center justify-center text-5xl mb-8 shadow-inner animate-breathe">📖</div>
                <h3 className="font-jakarta font-black text-[#3a2b25] text-xl mb-4">Your Garden is Empty</h3>
                <p className="text-[#3a2b25]/50 text-sm max-w-xs leading-relaxed font-medium">Every journey begins with a single reflection. Start your first entry today.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {entries.map((e, i) => (
                  <div key={e.id} className="group bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-suncast border border-white hover:shadow-lift transition-all relative overflow-hidden animate-fadeSlideUp" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3 text-[#AA8E7E]">
                        <Clock size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {new Date(e.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDelete(e.id)}
                        disabled={deleting === e.id}
                        className="opacity-0 group-hover:opacity-100 p-2.5 rounded-xl bg-[#FDF9F2] text-[#6B5A10] hover:bg-[#ba1a1a] hover:text-white transition-all transform hover:scale-110 active:scale-90"
                      >
                        {deleting === e.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>

                    {e.prompt && (
                      <div className="mb-6 px-5 py-3 rounded-2xl bg-[#FDF9F2] border border-[#F6C945]/10 inline-block">
                        <p className="text-[11px] font-bold text-[#6B5A10] leading-relaxed italic">"{e.prompt}"</p>
                      </div>
                    )}

                    <p className="text-base text-[#3a2b25]/80 leading-[1.8] font-medium whitespace-pre-wrap">
                      {e.content}
                    </p>
                    
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#F6C945]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-all group-hover:opacity-40"></div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
