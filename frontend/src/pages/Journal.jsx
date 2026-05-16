import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import RadianceDose from '../components/RadianceDose'
import { supabase } from '../lib/supabase'
import { journalPromptForToday, JOURNAL_PROMPTS, dailyQuoteForToday } from '../lib/data'
import { Loader2, Trash2, CheckCircle2, PenLine, BookOpen, Sparkles, Clock, Quote, ChevronDown, Type, ArrowRight, Book, X } from 'lucide-react'

const ENTRY_THEMES = [
  { bg: '#ffffff', accent: 'var(--color-primary-container)' },
  { bg: '#ffffff', accent: 'var(--color-secondary-container)' },
  { bg: '#ffffff', accent: 'var(--color-tertiary-container)' },
]

export default function Journal() {
  const [entries, setEntries] = useState([])
  const [prompt, setPrompt] = useState('')
  const [entryMode, setEntryMode] = useState('prompt') // 'prompt' or 'custom'
  const [customTitle, setCustomTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [charCount, setCharCount] = useState(0)
  const [showMobileCompose, setShowMobileCompose] = useState(false)

  const loadData = useCallback(async () => {
    const params = new URLSearchParams(window.location.search)
    const triggerParam = params.get('trigger')
    
    const todayPrompt = journalPromptForToday(triggerParam)
    setPrompt(todayPrompt)
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
    setErrorMsg(null)
    try {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) throw new Error('Not authenticated')
      const finalPrompt = entryMode === 'prompt' ? prompt : customTitle
      const { data: inserted, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: auth.user.id,
          content: content.trim(),
          prompt: finalPrompt || null
        })
        .select('id, content, prompt, created_at')
        .single()
      if (error) throw error

      // Optimistically prepend to the list immediately
      if (inserted) setEntries(prev => [inserted, ...prev])

      setContent('')
      setCustomTitle('')
      setCharCount(0)
      setSuccess(true)
      setShowMobileCompose(false)
      // Background refresh to confirm server state
      loadData()
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      console.error('[journal submit]', err)
      setErrorMsg(err.message || 'Failed to save entry')
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
        <div className="mb-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
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

          <div className="animate-slideInRight max-w-md w-full md:w-auto">
            <RadianceDose />
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT SIDE: COMPOSE ── */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-8">
            
            <div className="hidden lg:block">
              <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-1 shadow-lift border border-white overflow-hidden">
              <div className="p-8 lg:p-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F6C945]/10 flex items-center justify-center text-[#6B5A10] shadow-inner">
                      <PenLine size={24} />
                    </div>
                    <div>
                      <h2 className="font-jakarta font-black text-[#3a2b25] text-lg uppercase tracking-tight">New Entry</h2>
                      <p className="text-[10px] font-bold text-[#AA8E7E] uppercase tracking-widest">{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</p>
                    </div>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="flex bg-[#FDF9F2] p-1.5 rounded-2xl border border-[#AA8E7E]/10">
                  <button
                    type="button"
                    onClick={() => setEntryMode('prompt')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entryMode === 'prompt' ? 'bg-white text-[#6B5A10] shadow-sm' : 'text-[#AA8E7E] hover:text-[#3a2b25]'}`}
                  >
                    <Sparkles size={12} /> Use Prompt
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode('custom')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entryMode === 'custom' ? 'bg-white text-[#6B5A10] shadow-sm' : 'text-[#AA8E7E] hover:text-[#3a2b25]'}`}
                  >
                    <Type size={12} /> Custom Title
                  </button>
                </div>

                {/* Title/Prompt Input */}
                {entryMode === 'prompt' ? (
                  <div className="relative">
                    <select
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full appearance-none rounded-2xl bg-[#FDF9F2] px-6 py-4 text-[13px] font-bold text-[#3a2b25] border border-[#F6C945]/20 focus:ring-2 focus:ring-[#6B5A10]/10 outline-none transition-all cursor-pointer"
                    >
                      {JOURNAL_PROMPTS.map((p, idx) => (
                        <option key={idx} value={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#6B5A10] pointer-events-none" />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Enter your entry title..."
                    className="w-full rounded-2xl bg-[#FDF9F2] px-6 py-4 text-[13px] font-bold text-[#3a2b25] border border-[#F6C945]/20 focus:ring-2 focus:ring-[#6B5A10]/10 outline-none transition-all"
                  />
                )}

                <div className="relative group">
                  <textarea
                    value={content}
                    onChange={handleContentChange}
                    placeholder="Begin your reflection..."
                    className="w-full rounded-[2rem] bg-[#FDF9F2] p-8 text-base text-[#3a2b25] placeholder-[#AA8E7E]/40 outline-none focus:ring-2 focus:ring-[#6B5A10]/10 border border-transparent transition-all resize-none leading-[1.8] font-medium"
                    style={{ minHeight: '300px' }}
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
                {errorMsg && (
                  <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-xs font-bold flex items-center justify-center animate-scaleIn">
                    {errorMsg}
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
        </div>

          {/* ── MOBILE COMPOSE TRIGGER ── */}
          <button 
            onClick={() => setShowMobileCompose(true)}
            className="lg:hidden w-full bg-[#3a2b25] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lift mb-8"
          >
            <PenLine size={16} /> Write New Entry
          </button>

          {/* ── MOBILE COMPOSE MODAL ── */}
          {showMobileCompose && (
            <div className="fixed inset-0 z-[60] bg-[#FDF9F2] overflow-y-auto page-enter lg:hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-[#AA8E7E]/10 bg-white sticky top-0 z-10">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-[#F6C945]/10 flex items-center justify-center text-[#6B5A10]">
                     <PenLine size={20} />
                   </div>
                   <h2 className="font-jakarta font-black text-[#3a2b25] text-lg uppercase tracking-tight">New Entry</h2>
                 </div>
                 <button onClick={() => setShowMobileCompose(false)} className="p-2 bg-[#FDF9F2] rounded-2xl text-[#AA8E7E] hover:text-[#3a2b25] transition-colors">
                   <X size={24} />
                 </button>
              </div>
              <div className="p-6 pb-24 flex-1">
                <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-lift border border-white">
                  {/* Replicating Form logic for mobile */}
                  <div className="space-y-6">
                    {/* Mode Selector */}
                    <div className="flex bg-[#FDF9F2] p-1.5 rounded-2xl border border-[#AA8E7E]/10">
                      <button
                        type="button"
                        onClick={() => setEntryMode('prompt')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entryMode === 'prompt' ? 'bg-white text-[#6B5A10] shadow-sm' : 'text-[#AA8E7E] hover:text-[#3a2b25]'}`}
                      >
                        <Sparkles size={12} /> Use Prompt
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntryMode('custom')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entryMode === 'custom' ? 'bg-white text-[#6B5A10] shadow-sm' : 'text-[#AA8E7E] hover:text-[#3a2b25]'}`}
                      >
                        <Type size={12} /> Custom Title
                      </button>
                    </div>

                    {/* Title/Prompt Input */}
                    {entryMode === 'prompt' ? (
                      <div className="relative">
                        <select
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="w-full appearance-none rounded-2xl bg-[#FDF9F2] px-6 py-4 text-[13px] font-bold text-[#3a2b25] border border-[#F6C945]/20 focus:ring-2 focus:ring-[#6B5A10]/10 outline-none transition-all cursor-pointer"
                        >
                          {JOURNAL_PROMPTS.map((p, idx) => (
                            <option key={idx} value={p}>{p}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#6B5A10] pointer-events-none" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Enter your entry title..."
                        className="w-full rounded-2xl bg-[#FDF9F2] px-6 py-4 text-[13px] font-bold text-[#3a2b25] border border-[#F6C945]/20 focus:ring-2 focus:ring-[#6B5A10]/10 outline-none transition-all"
                      />
                    )}

                    <div className="relative group">
                      <textarea
                        value={content}
                        onChange={handleContentChange}
                        placeholder="Begin your reflection..."
                        className="w-full rounded-[2rem] bg-[#FDF9F2] p-6 text-base text-[#3a2b25] placeholder-[#AA8E7E]/40 outline-none focus:ring-2 focus:ring-[#6B5A10]/10 border border-transparent transition-all resize-none leading-[1.6] font-medium"
                        style={{ minHeight: '250px' }}
                      />
                      <div className="absolute bottom-6 right-6 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#AA8E7E] uppercase tracking-widest">{charCount} characters</span>
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-xs font-bold flex items-center justify-center animate-scaleIn">
                        {errorMsg}
                      </div>
                    )}

                    <button
                      onClick={handleSubmit}
                      disabled={!content.trim() || loading}
                      className="w-full gradient-cta text-[#3E3006] font-black uppercase tracking-[0.2em] rounded-2xl py-5 flex items-center justify-center gap-3 shadow-lift hover:shadow-glow transition-all active:scale-[0.98] disabled:opacity-30 text-xs"
                    >
                      {loading && <Loader2 size={16} className="animate-spin" />}
                      {loading ? 'Securing...' : 'Commit to Garden'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TIMELINE ── */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Book size={18} className="text-[#6B5A10]" />
                <h3 className="font-jakarta font-black text-[#3a2b25] text-sm uppercase tracking-widest">Timeline</h3>
              </div>
              <div className="bg-[#F6C945]/10 px-4 py-1.5 rounded-full border border-[#F6C945]/20">
                <p className="text-[9px] font-black text-[#6B5A10] uppercase tracking-widest">
                  {entries.length} Reflections logged
                </p>
              </div>
            </div>

            {entries.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-20 shadow-suncast border border-white flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-[#FDF9F2] flex items-center justify-center text-5xl mb-8 shadow-inner animate-breathe">📖</div>
                <h3 className="font-jakarta font-black text-[#3a2b25] text-xl mb-4">Your Garden is Empty</h3>
                <p className="text-[#3a2b25]/50 text-sm max-w-xs leading-relaxed font-medium">Every journey begins with a single reflection. Start your first entry today.</p>
              </div>
            ) : (
            <div className="space-y-4 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
              {entries.map((e, i) => (
                <div 
                  key={e.id} 
                  onClick={() => setSelectedEntry(e)}
                  className="group bg-white rounded-[2rem] p-6 shadow-lift border border-transparent hover:border-[#F6C945]/20 transition-all cursor-pointer relative overflow-hidden flex flex-col animate-fadeSlideUp" 
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-[#AA8E7E]">
                      <Clock size={12} className="text-[#F6C945]" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <button
                      onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }}
                      disabled={deleting === e.id}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-red-50 text-red-400 hover:bg-[#ba1a1a] hover:text-white transition-all transform hover:scale-105"
                    >
                      {deleting === e.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>

                  <h4 className="font-jakarta font-extrabold text-[#3a2b25] text-sm leading-snug mb-2 line-clamp-1">
                    {e.prompt ? e.prompt : 'Personal Reflection'}
                  </h4>

                  <p className="text-xs text-[#3a2b25]/60 leading-relaxed line-clamp-2">
                    {e.content}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#FDF9F2] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] font-black text-[#6B5A10]/40 uppercase tracking-widest">Read Full Reflection</span>
                    <ArrowRight size={12} className="text-[#6B5A10]/20 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

        </div>
      </main>

      {/* ── Entry Detail Modal ── */}
      {selectedEntry && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3a2b25]/60 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedEntry(null)}
        >
          <div 
            className="bg-[#FDF9F2] rounded-[3rem] w-full max-w-2xl shadow-lift animate-scaleIn relative overflow-hidden flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F6C945]/20 flex items-center justify-center text-[#6B5A10]">
                  <BookOpen size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#6B5A10] uppercase tracking-[0.3em]">Journal Archive</p>
                  <p className="text-xs text-[#3a2b25]/40 font-bold uppercase tracking-widest mt-0.5">
                    {new Date(selectedEntry.created_at).toLocaleString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEntry(null)}
                className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#3a2b25]/30 hover:text-[#3a2b25] transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="px-10 pb-10 pt-4 overflow-y-auto custom-scrollbar flex-1">
              {selectedEntry.prompt && (
                <div className="mb-8 px-6 py-4 rounded-3xl bg-white border border-[#F6C945]/20 inline-block shadow-sm">
                  <p className="font-playfair text-lg md:text-xl font-bold text-[#6B5A10] italic leading-snug">
                    "{selectedEntry.prompt}"
                  </p>
                </div>
              )}

              <div className="space-y-6">
                <p className="text-lg md:text-xl text-[#3a2b25] leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedEntry.content}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-10 py-6 bg-white border-t border-[#FDF9F2] flex items-center justify-between">
              <span className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-widest">End of Reflection</span>
              <button
                onClick={() => { handleDelete(selectedEntry.id); setSelectedEntry(null); }}
                className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors"
              >
                <Trash2 size={14} /> Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
