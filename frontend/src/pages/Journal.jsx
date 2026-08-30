import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import RadianceDose from '../components/RadianceDose'
import ReflectionCapsuleModal from '../components/ReflectionCapsuleModal'
import { supabase } from '../lib/supabase'
import { journalPromptForToday, JOURNAL_PROMPTS } from '../lib/data'
import { getReflectionCapsuleData } from '../lib/reflectionCapsule'
import { Loader2, Trash2, CheckCircle2, PenLine, BookOpen, Sparkles, Clock, ChevronDown, Type, ArrowRight, X, Calendar, ChevronRight } from 'lucide-react'

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
  const [isCapsuleOpen, setIsCapsuleOpen] = useState(false)
  const [capsuleData, setCapsuleData] = useState(null)
  const [userId, setUserId] = useState(null)

  const loadData = useCallback(async () => {
    const params = new URLSearchParams(window.location.search)
    const triggerParam = params.get('trigger')
    
    const todayPrompt = journalPromptForToday(triggerParam)
    setPrompt(todayPrompt)
    try {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) {
        setEntries([])
        return
      }
      setUserId(auth.user.id)

      const [{ data, error }, capsuleRes] = await Promise.all([
        supabase
          .from('journal_entries')
          .select('id, content, prompt, created_at')
          .eq('user_id', auth.user.id)
          .order('created_at', { ascending: false }),
        getReflectionCapsuleData(auth.user.id),
      ])
      if (error) throw error
      setEntries(data || [])
      setCapsuleData(capsuleRes)
    } catch (err) {
      console.error('[journal load]', err)
      setEntries([])
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
      loadData()
      setTimeout(() => setSuccess(false), 3500)
    } catch (err) {
      console.error('[journal submit]', err)
      setErrorMsg(err.message || 'Failed to save entry')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm('Delete this journal entry?')) return
    setDeleting(id)
    try {
      const { error } = await supabase.from('journal_entries').delete().eq('id', id)
      if (error) throw error
      setEntries((prev) => prev.filter((entry) => entry.id !== id))
      if (selectedEntry?.id === id) setSelectedEntry(null)
    } catch (err) {
      console.error('[journal delete]', err)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF9F2] relative overflow-x-hidden">
      {/* Soft Glow */}
      <div className="fixed top-0 left-0 w-[30rem] h-[30rem] rounded-full bg-[#A8C5A0]/8 blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 relative z-10 page-enter">

        {/* ── Header Row with Integrated Compact Daily Dose ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center mb-6">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#755b00] bg-[#f6c945]/20 px-2.5 py-0.5 rounded-full">
                Personal Archive
              </span>
            </div>
            <h1 className="font-jakarta text-2xl sm:text-3xl font-extrabold text-[#3a2b25] tracking-tight">
              Journal <span className="font-playfair italic text-[#6B5A10]">Sanctuary</span>
            </h1>
            <p className="text-warm/60 text-xs sm:text-sm mt-0.5 max-w-lg leading-relaxed font-medium">
              Transform your thoughts into clarity and personal growth. A private, safe sanctuary for your inner dialogue.
            </p>
          </div>

          <div className="lg:col-span-5">
            <RadianceDose />
          </div>
        </div>

        {/* ── Main Layout: Compose (5 cols) + Timeline (7 cols) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* ── LEFT SIDE: COMPOSE (DESKTOP) ── */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Desktop Form */}
            <div className="hidden lg:block bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-suncast border border-warm/10">
              <form onSubmit={handleSubmit} className="space-y-3.5">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#F6C945]/20 flex items-center justify-center text-[#755b00]">
                      <PenLine size={16} />
                    </div>
                    <div>
                      <h2 className="font-jakarta font-bold text-warm text-sm leading-tight">New Reflection</h2>
                      <p className="text-[10px] font-bold text-warm/40 uppercase tracking-wider">{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</p>
                    </div>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="flex bg-[#FDF9F2] p-1 rounded-xl border border-warm/10">
                  <button
                    type="button"
                    onClick={() => setEntryMode('prompt')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${entryMode === 'prompt' ? 'bg-white text-[#755b00] shadow-sm' : 'text-warm/50 hover:text-warm'}`}
                  >
                    <Sparkles size={11} /> Use Prompt
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode('custom')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${entryMode === 'custom' ? 'bg-white text-[#755b00] shadow-sm' : 'text-warm/50 hover:text-warm'}`}
                  >
                    <Type size={11} /> Custom Title
                  </button>
                </div>

                {/* Prompt/Title Select */}
                {entryMode === 'prompt' ? (
                  <div className="relative">
                    <select
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full appearance-none rounded-xl bg-[#FDF9F2] pl-3 pr-8 py-2 text-xs font-bold text-warm border border-[#F6C945]/30 focus:border-[#F6C945] outline-none transition-all cursor-pointer truncate"
                    >
                      {JOURNAL_PROMPTS.map((p, idx) => (
                        <option key={idx} value={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm/50 pointer-events-none" />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Enter your reflection title..."
                    className="w-full rounded-xl bg-[#FDF9F2] px-3 py-2 text-xs font-bold text-warm border border-[#F6C945]/30 focus:border-[#F6C945] outline-none transition-all"
                  />
                )}

                {/* Content Textarea */}
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={handleContentChange}
                    placeholder="Begin your reflection..."
                    className="w-full rounded-xl bg-[#FDF9F2] p-3.5 text-xs sm:text-sm text-warm placeholder-warm/30 outline-none focus:ring-1 focus:ring-[#F6C945] border border-warm/10 focus:border-[#F6C945] transition-all resize-none leading-relaxed font-medium min-h-[160px]"
                  />
                  <div className="absolute bottom-2.5 right-3">
                    <span className="text-[10px] font-bold text-warm/40">{charCount} chars</span>
                  </div>
                </div>

                {success && (
                  <div className="bg-[#EAF2E6] text-[#2D5A29] rounded-xl p-2.5 text-xs font-bold flex items-center justify-center gap-2 animate-scaleIn border border-[#A8C5A0]/30">
                    <CheckCircle2 size={14} /> 
                    <span>Your reflection is saved safely.</span>
                  </div>
                )}
                {errorMsg && (
                  <div className="bg-red-50 text-red-600 rounded-xl p-2.5 text-xs font-bold flex items-center justify-center animate-scaleIn">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!content.trim() || loading}
                  className="w-full gradient-cta text-[#3E3006] font-bold uppercase tracking-wider rounded-xl py-2.5 flex items-center justify-center gap-2 shadow-suncast hover:shadow-glow transition-all active:scale-[0.98] disabled:opacity-30 text-xs"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {loading ? 'Securing...' : 'Save Reflection'}
                </button>
              </form>
            </div>

            {/* Reflection Capsule Widget (Desktop only) */}
            <div className="hidden lg:block bg-gradient-to-br from-[#FFFDF8] to-[#FFF8EA] rounded-2xl p-4 shadow-suncast border border-[#F6C945]/30 relative overflow-hidden group">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#F6C945]/15 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#F6C945]/25 flex items-center justify-center text-[#755b00]">
                    <Sparkles size={13} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#856804]">Memory Vault</span>
                    <h3 className="font-jakarta font-bold text-warm text-xs">Reflection Capsule</h3>
                  </div>
                </div>
                {capsuleData?.futureCapsule?.unlockedNotes?.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#b0cfad]/40 text-[#254722] text-[9px] font-black uppercase">
                    New Letter
                  </span>
                )}
              </div>

              <p className="text-[11px] text-warm/70 leading-relaxed mb-3 relative z-10">
                {capsuleData?.flashback?.mood ? (
                  <>
                    <span className="font-bold text-warm">{capsuleData.flashback.dateLabel}:</span> You felt{' '}
                    <span className="font-semibold">{capsuleData.flashback.mood.label}</span>{' '}
                    {capsuleData.flashback.mood.emoji} — open to revisit your growth.
                  </>
                ) : (
                  "Revisit past milestones, track your resilience over time, and seal letters for your future self."
                )}
              </p>

              <button
                type="button"
                onClick={() => setIsCapsuleOpen(true)}
                className="w-full relative z-10 py-2 px-3 rounded-xl bg-white hover:bg-[#F6C945] text-warm hover:text-[#3E3006] text-[11px] font-bold uppercase tracking-wider flex items-center justify-between border border-warm/10 hover:border-[#F6C945] transition-all shadow-sm"
              >
                <span className="flex items-center gap-1.5">
                  <Clock size={12} className="text-[#755b00]" />
                  Open Time Capsule
                </span>
                <ChevronRight size={12} />
              </button>
            </div>

            {/* Mobile Compose Button */}
            <button 
              onClick={() => setShowMobileCompose(true)}
              className="lg:hidden w-full gradient-cta text-[#3E3006] py-3 rounded-2xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-suncast"
            >
              <PenLine size={14} /> Write New Entry
            </button>
          </div>

          {/* ── RIGHT SIDE: TIMELINE (7 cols) ── */}
          <div className="lg:col-span-7">
            
            {/* Single card: header + scrollable list */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-suncast border border-warm/10 overflow-hidden">

              {/* Timeline Header */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-warm/10">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-[#755b00]" />
                  <h2 className="font-jakarta font-bold text-warm text-sm">Reflection Timeline</h2>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#f6c945]/20 text-[#755b00]">
                    {entries.length} Logged
                  </span>
                </div>

                {capsuleData?.futureCapsule?.unlockedNotes?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCapsuleOpen(true)}
                    className="text-[10px] font-bold text-[#2e4d2a] bg-[#b0cfad]/30 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-[#b0cfad]/50 transition-all"
                  >
                    <Sparkles size={10} /> Time Capsule Unlocked
                  </button>
                )}
              </div>

              {/* Scrollable Entries */}
              {entries.length === 0 ? (
                <div className="text-center py-14 px-4">
                  <p className="text-4xl mb-2">📖</p>
                  <p className="font-jakarta font-bold text-warm text-base mb-0.5">Your sanctuary is ready</p>
                  <p className="text-xs text-warm/50 max-w-sm mx-auto">Write your first reflection to cultivate your timeline of growth.</p>
                </div>
              ) : (
                <div className="max-h-[520px] overflow-y-auto custom-scrollbar">
                  <div className="space-y-0 divide-y divide-warm/5">
                    {entries.map(e => {
                      const entryDate = new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      const entryTime = new Date(e.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

                      return (
                        <div
                          key={e.id}
                          onClick={() => setSelectedEntry(e)}
                          className="px-4 sm:px-5 py-4 hover:bg-[#FDF9F2] transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-warm/50 bg-[#FDF9F2] group-hover:bg-white px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors">
                                <Clock size={10} /> {entryDate} · {entryTime}
                              </span>
                            </div>
                            <button
                              onClick={(evt) => handleDelete(e.id, evt)}
                              disabled={deleting === e.id}
                              title="Delete entry"
                              className="p-1 rounded-lg text-warm/30 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                            >
                              {deleting === e.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            </button>
                          </div>

                          {e.prompt && (
                            <p className="text-xs font-bold text-[#755b00] mb-1 group-hover:text-[#6d5400] transition-colors line-clamp-1">
                              {e.prompt}
                            </p>
                          )}

                          <p className="text-xs text-warm/75 leading-relaxed line-clamp-2 font-medium">
                            {e.content}
                          </p>

                          <div className="mt-2 pt-2 border-t border-warm/5 flex items-center justify-between text-[10px] text-warm/40 font-semibold">
                            <span className="group-hover:text-[#755b00] transition-colors flex items-center gap-1">
                              Read full entry <ChevronRight size={11} />
                            </span>
                            <span>{e.content.length} characters</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      </main>

      {/* ── Mobile Compose Modal ── */}
      {showMobileCompose && (
        <div className="fixed inset-0 z-50 bg-[#3a2b25]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-lift p-5 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-warm/10">
              <div className="flex items-center gap-2">
                <PenLine size={16} className="text-[#755b00]" />
                <h2 className="font-jakarta font-bold text-warm text-base">Write Reflection</h2>
              </div>
              <button onClick={() => setShowMobileCompose(false)} className="p-1.5 rounded-xl text-warm/40 hover:text-warm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex bg-[#FDF9F2] p-1 rounded-xl border border-warm/10">
                <button
                  type="button"
                  onClick={() => setEntryMode('prompt')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${entryMode === 'prompt' ? 'bg-white text-[#755b00] shadow-sm' : 'text-warm/50'}`}
                >
                  Prompt
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('custom')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${entryMode === 'custom' ? 'bg-white text-[#755b00] shadow-sm' : 'text-warm/50'}`}
                >
                  Custom
                </button>
              </div>

              {entryMode === 'prompt' ? (
                <select
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full rounded-xl bg-[#FDF9F2] px-3 py-2 text-xs font-bold text-warm border border-warm/10 outline-none"
                >
                  {JOURNAL_PROMPTS.map((p, idx) => (
                    <option key={idx} value={p}>{p}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Reflection title..."
                  className="w-full rounded-xl bg-[#FDF9F2] px-3 py-2 text-xs font-bold text-warm border border-warm/10 outline-none"
                />
              )}

              <textarea
                value={content}
                onChange={handleContentChange}
                rows={6}
                placeholder="Begin your reflection..."
                className="w-full rounded-xl bg-[#FDF9F2] p-3 text-xs text-warm outline-none border border-warm/10 resize-none leading-relaxed"
              />

              <button
                type="submit"
                disabled={!content.trim() || loading}
                className="w-full gradient-cta text-[#3E3006] font-bold uppercase tracking-wider rounded-xl py-2.5 text-xs flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? 'Saving...' : 'Save Reflection'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Entry Detail Modal ── */}
      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3a2b25]/50 backdrop-blur-sm"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-lift animate-scaleIn relative overflow-hidden flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 inset-x-0 h-1.5 gradient-cta" />

            <div className="flex items-center justify-between px-5 sm:px-7 pt-6 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-warm/50 bg-[#FDF9F2] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(selectedEntry.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="w-8 h-8 rounded-xl bg-[#FDF9F2] flex items-center justify-center text-warm/40 hover:text-warm">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 sm:px-7 pb-6 flex-1 space-y-3">
              {selectedEntry.prompt && (
                <h3 className="font-jakarta font-bold text-[#755b00] text-sm sm:text-base leading-snug">
                  {selectedEntry.prompt}
                </h3>
              )}
              <div className="bg-[#FDF9F2] rounded-2xl p-4 border border-warm/5">
                <p className="text-xs sm:text-sm text-warm/85 leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedEntry.content}
                </p>
              </div>
            </div>

            <div className="px-5 sm:px-7 py-3 border-t border-warm/10 flex items-center justify-between bg-surface-low/30">
              <span className="text-[10px] text-warm/40">{selectedEntry.content.length} characters</span>
              <button
                onClick={(e) => handleDelete(selectedEntry.id, e)}
                className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ReflectionCapsuleModal
        isOpen={isCapsuleOpen}
        onClose={() => setIsCapsuleOpen(false)}
        capsuleData={capsuleData}
        userId={userId}
        onRefresh={loadData}
      />
    </div>
  )
}
