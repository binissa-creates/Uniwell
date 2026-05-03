import React, { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { CheckCircle, XCircle, Loader2, Inbox, ShieldCheck, Clock, X, Tag } from 'lucide-react'

const CAT_STYLE = {
  'Relaxation': { bg: 'var(--color-tertiary-container)', text: '#2d4550' },
  'Time Management': { bg: 'var(--color-primary-container)', text: 'var(--color-on-primary-container)' },
  'Social Support': { bg: 'var(--color-secondary-container)', text: '#2d5a29' },
  'Physical Activity': { bg: '#ffdbd0', text: '#7a2d1a' },
  'Creative Expression': { bg: '#e8dcf0', text: '#4a3060' },
  'Mindfulness': { bg: 'var(--color-tertiary-container)', text: 'var(--color-tertiary)' },
  'Other': { bg: 'var(--color-surface-container)', text: 'rgba(93,64,55,0.55)' },
}

const YEAR_LABELS = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' }

export default function AdminModeration() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(null)
  const [apiError, setApiError] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedYearLevel, setSelectedYearLevel] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)

  const handleFilter = (course, yearLevel = null) => {
    setSelectedCourse(course)
    setSelectedYearLevel(yearLevel)
  }

  // Derive grouped data for the sidebar
  const groupedData = React.useMemo(() => {
    const groups = {}
      ; (pending || []).forEach(entry => {
        const c = entry.course || 'Unknown'
        const y = entry.year_level || 0
        if (!groups[c]) groups[c] = { total: 0, years: {} }
        if (!groups[c].years[y]) groups[c].years[y] = 0
        groups[c].total += 1
        groups[c].years[y] += 1
      })
    return groups
  }, [pending])

  // Get filtered pending lists
  const filteredPending = React.useMemo(() => {
    let result = pending || []
    if (selectedCourse) {
      result = result.filter(s => (s.course || 'Unknown') === selectedCourse)
      if (selectedYearLevel !== null) {
        result = result.filter(s => s.year_level === selectedYearLevel)
      }
    }
    return result
  }, [pending, selectedCourse, selectedYearLevel])

  const fetchPending = useCallback(async () => {
    setLoading(true)
    setApiError(false)
    try {
      const { data, error } = await supabase
        .from('coping_strategies')
        .select('id, category, title, description, trigger_tags, created_at, submitter:profiles!submitter_id(name, course, year_level)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      if (error) throw error
      // Flatten nested submitter so existing UI (expects s.course / s.year_level) still works.
      setPending(
        (data || []).map((s) => ({
          ...s,
          course: s.submitter?.course,
          year_level: s.submitter?.year_level,
          submitter_name: s.submitter?.name,
        }))
      )
    } catch (err) {
      console.error('[AdminModeration] fetch error:', err)
      setApiError(true)
      setPending([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPending() }, [fetchPending])

  const handleAction = async (id, status) => {
    setActing({ id, status })
    try {
      const { error } = await supabase
        .from('coping_strategies')
        .update({ status })
        .eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('[AdminModeration] action error:', err)
    }
    setPending((prev) => prev.filter((s) => s.id !== id))
    setActing(null)
    // If card is open in modal, close it too
    if (selectedCard?.id === id) setSelectedCard(null)
  }


  return (
    <div className="min-h-screen bg-[#FDF9F2] relative overflow-x-hidden">
      {/* Dynamic Backgrounds */}
      <div className="fixed top-0 right-0 w-[50rem] h-[50rem] rounded-full bg-[#F6C945]/5 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10 page-enter">

        {/* ── Page Header ── */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4 animate-fadeIn">
            <div className="h-px w-8 bg-[#6B5A10]/30"></div>
            <p className="text-[#6B5A10] text-[10px] font-black uppercase tracking-[0.4em]">Review Sanctuary</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="animate-fadeIn">
              <h1 className="font-jakarta text-5xl font-extrabold text-[#3a2b25] mb-4">
                Content <span className="font-playfair italic text-[#6B5A10] font-bold">Moderation</span>
              </h1>
              <p className="text-[#3a2b25]/50 text-base md:text-lg max-w-lg leading-relaxed font-medium">
                Review and approve student-submitted coping strategies. Your discernment maintains the quality of our community wisdom.
              </p>
            </div>

            {!loading && (pending || []).length > 0 && (
              <div className="bg-white/60 backdrop-blur-md rounded-[2rem] px-8 py-5 border border-white shadow-lift flex items-center gap-4 animate-slideInRight">
                <div className="w-10 h-10 rounded-2xl bg-[#F6C945]/10 flex items-center justify-center text-[#6B5A10]">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-widest">Awaiting Pulse</p>
                  <p className="text-sm font-black text-[#3a2b25]">{pending.length} Strategies</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── API Error Banner ── */}
        {apiError && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-3xl px-8 py-5 flex items-center gap-4 animate-fadeIn">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={18} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Backend Offline — Demo Mode</p>
              <p className="text-[11px] text-amber-700 font-medium">Cannot reach the API server. Showing sample data. Make sure the backend is running on port 5000.</p>
            </div>
            <button onClick={fetchPending} className="px-5 py-2.5 rounded-xl bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-widest hover:bg-amber-300 transition-all flex-shrink-0">
              Retry
            </button>
          </div>
        )}

        {/* ── QUEUE CONTENT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* ── SIDEBAR FILTERING ── */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="sticky top-28 bg-[#FDF9F2]/80 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/50 shadow-sm animate-fadeIn">
              <h2 className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-widest mb-6 px-2 flex items-center gap-2">
                <Inbox size={14} />
                Filter Queue
              </h2>

              <div className="space-y-2">
                <button
                  onClick={() => handleFilter(null)}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl text-xs font-bold transition-all flex justify-between items-center ${!selectedCourse ? 'bg-white shadow-lift border border-[#AA8E7E]/10 text-[#3a2b25]' : 'text-[#AA8E7E] hover:bg-white/50'}`}
                >
                  <span>All Submissions</span>
                  {!loading && <span className="bg-[#EEDDCB] text-[#5D4037] px-2 py-0.5 rounded-full text-[10px] font-black">{(pending || []).length}</span>}
                </button>

                {!loading && Object.entries(groupedData).map(([course, data]) => {
                  const isCourseSelected = selectedCourse === course
                  return (
                    <div key={course} className={`rounded-2xl transition-all overflow-hidden ${isCourseSelected ? 'bg-white shadow-lift border border-[#AA8E7E]/10' : 'hover:bg-white/40'}`}>
                      <button
                        onClick={() => handleFilter(isCourseSelected ? null : course)}
                        className={`w-full text-left px-5 py-3.5 text-xs font-bold flex justify-between items-center transition-colors ${isCourseSelected ? 'text-[#3E3006]' : 'text-[#AA8E7E] hover:text-[#3a2b25]'}`}
                      >
                        <span className="truncate pr-2">{course}</span>
                        <span className={`${isCourseSelected ? 'bg-[#F6C945]/20 text-[#6B5A10]' : 'bg-[#EEDDCB] text-[#5D4037]'} px-2 py-0.5 rounded-full text-[10px] font-black`}>{data.total}</span>
                      </button>

                      <div className={`transition-all duration-300 ease-in-out ${isCourseSelected ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-4 pb-4 pt-1 space-y-1">
                          {Object.entries(data.years).map(([year, count]) => {
                            const yData = parseInt(year)
                            const isYearSelected = selectedYearLevel === yData
                            return (
                              <button
                                key={year}
                                onClick={(e) => { e.stopPropagation(); handleFilter(course, isYearSelected ? null : yData) }}
                                className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-bold flex justify-between items-center transition-all ${isYearSelected ? 'bg-[#F6C945] text-[#3E3006] shadow-sm' : 'text-[#AA8E7E] hover:bg-[#FDF9F2] hover:text-[#3a2b25]'}`}
                              >
                                <span className="uppercase tracking-wide">{YEAR_LABELS[yData] || 'Unknown Year'}</span>
                                <span className={`${isYearSelected ? 'text-[#3E3006]/70' : ''}`}>{count}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </aside>

          {/* ── QUEUE LISTING ── */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-[#F6C945]/10 flex items-center justify-center text-[#6B5A10] animate-pulse">
                  <Loader2 size={32} className="animate-spin" />
                </div>
                <p className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-[0.3em]">Synchronizing Review Queue</p>
              </div>
            ) : !(filteredPending && filteredPending.length > 0) ? (
              <div className="bg-white rounded-[2.5rem] p-24 shadow-lift border border-white flex flex-col items-center text-center animate-scaleIn">
                <div className="w-24 h-24 rounded-full bg-[#EAF2E6] flex items-center justify-center text-5xl mb-8 shadow-inner animate-breathe">✨</div>
                <h3 className="font-jakarta font-black text-[#3a2b25] text-2xl mb-4">Queue is Pristine</h3>
                <p className="text-[#3a2b25]/50 text-sm max-w-sm leading-relaxed font-medium">
                  {pending && pending.length > 0 ? "No pending contributions match this filter." : "All student contributions have been reviewed. Rest and recharge."}
                </p>
                {(selectedCourse || selectedYearLevel !== null) && (
                  <button onClick={() => handleFilter(null)} className="mt-8 text-[11px] font-black text-[#6B5A10] uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              /* ── 3-column masonry grid matching Peer Insights layout ── */
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
                {(filteredPending || []).map((s, idx) => {
                  const tags = Array.isArray(s?.trigger_tags) ? s.trigger_tags : []
                  const catStyle = CAT_STYLE[s.category] || CAT_STYLE['Other']
                  return (
                    <div
                      key={s.id}
                      className="break-inside-avoid bg-white rounded-3xl p-5 shadow-suncast border border-white hover:shadow-lift transition-all relative overflow-hidden flex flex-col gap-3 animate-fadeSlideUp cursor-pointer"
                      style={{ animationDelay: `${idx * 80}ms` }}
                      onClick={() => setSelectedCard(s)}
                    >
                      {/* Category badge */}
                      <span
                        className="self-start text-xs font-bold px-3 py-1 rounded-full"
                        style={{ background: catStyle.bg, color: catStyle.text }}
                      >
                        {s.category}
                      </span>

                      {/* Title */}
                      <h3 className="font-jakarta font-bold text-[#3a2b25] text-base leading-snug">
                        {s.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-[#3a2b25]/65 leading-relaxed italic line-clamp-3">
                        "{s.description}"
                      </p>

                      {/* Metadata row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] font-black text-[#AA8E7E] uppercase tracking-widest pt-3 border-t border-[#FDF9F2]">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {s?.created_at && !isNaN(new Date(s.created_at))
                            ? new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Unknown Date'}
                        </span>
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={10} />
                          {s?.course || 'Unknown'} · {YEAR_LABELS[s?.year_level] || 'Unknown Year'}
                        </span>
                      </div>

                      {/* Trigger tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map(t => (
                            <span
                              key={t}
                              className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                              style={{ background: 'rgba(246,201,69,0.08)', color: '#6B5A10', border: '1px solid rgba(246,201,69,0.15)' }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons — stop propagation so clicking them doesn't open modal */}
                      <div className="mt-auto pt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleAction(s.id, 'approved')}
                          disabled={acting?.id === s.id}
                          className="flex-1 py-2.5 rounded-2xl bg-[#EAF2E6] text-[#2D5A29] text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-[#c3e0cc] transition-all active:scale-95"
                        >
                          {acting?.id === s.id && acting.status === 'approved'
                            ? <Loader2 size={11} className="animate-spin" />
                            : <CheckCircle size={12} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(s.id, 'rejected')}
                          disabled={acting?.id === s.id}
                          className="flex-1 py-2.5 rounded-2xl bg-white text-[#ba1a1a] text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 border border-[#ba1a1a]/10 hover:bg-[#ffdad6] transition-all active:scale-95"
                        >
                          {acting?.id === s.id && acting.status === 'rejected'
                            ? <Loader2 size={11} className="animate-spin" />
                            : <XCircle size={12} />}
                          Dismiss
                        </button>
                      </div>

                      {/* Subtle glow orb */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#F6C945]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Strategy Detail Modal ── */}
      {selectedCard && (() => {
        const s = selectedCard
        const tags = Array.isArray(s.trigger_tags) ? s.trigger_tags : []
        const catStyle = CAT_STYLE[s.category] || CAT_STYLE['Other']
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'radial-gradient(circle at center, rgba(246, 201, 69, 0.15), rgba(58, 43, 37, 0.6))', backdropFilter: 'blur(6px)' }}
            onClick={e => { if (e.target === e.currentTarget) setSelectedCard(null) }}
          >
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-lift animate-scaleIn relative overflow-hidden flex flex-col max-h-[90vh]">
              {/* Top accent bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 rounded-t-3xl"
                style={{ background: 'linear-gradient(90deg, #e8a800, #f6c945)' }} />

              {/* Header */}
              <div className="flex items-start justify-between gap-4 p-7 pb-4 mt-1">
                <span className="self-start text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: catStyle.bg, color: catStyle.text }}>
                  {s.category}
                </span>
                <button onClick={() => setSelectedCard(null)}
                  className="text-[#AA8E7E]/50 hover:text-[#3a2b25] transition-colors rounded-xl p-1 hover:bg-[#FDF9F2] flex-shrink-0">
                  <X size={20} />
                </button>
              </div>

              {/* Body — scrollable */}
              <div className="overflow-y-auto px-7 pb-5 flex-1">
                <h2 className="font-jakarta font-extrabold text-[#3a2b25] text-xl leading-snug mb-3">
                  {s.title}
                </h2>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] font-black text-[#AA8E7E] uppercase tracking-widest mb-4">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {s?.created_at && !isNaN(new Date(s.created_at))
                      ? new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Unknown Date'}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={10} />
                    {s?.course || 'Unknown'} · {YEAR_LABELS[s?.year_level] || 'Unknown Year'}
                  </span>
                </div>

                <p className="text-sm text-[#3a2b25]/70 leading-relaxed whitespace-pre-wrap italic">
                  "{s.description}"
                </p>

                {tags.length > 0 && (
                  <div className="mt-5">
                    <p className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Tag size={10} /> Trigger Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(t => (
                        <span key={t} className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background: 'rgba(246,201,69,0.10)', color: '#6B5A10', border: '1px solid rgba(246,201,69,0.2)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer — Approve / Dismiss */}
              <div className="px-7 py-5 border-t flex gap-3"
                style={{ borderColor: 'rgba(209,197,174,0.2)' }}>
                <button
                  onClick={() => handleAction(s.id, 'approved')}
                  disabled={acting?.id === s.id}
                  className="flex-1 py-3 rounded-2xl bg-[#EAF2E6] text-[#2D5A29] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#c3e0cc] transition-all active:scale-95"
                >
                  {acting?.id === s.id && acting.status === 'approved'
                    ? <Loader2 size={14} className="animate-spin" />
                    : <CheckCircle size={14} />}
                  Approve
                </button>
                <button
                  onClick={() => handleAction(s.id, 'rejected')}
                  disabled={acting?.id === s.id}
                  className="flex-1 py-3 rounded-2xl bg-white text-[#ba1a1a] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-[#ba1a1a]/10 hover:bg-[#ffdad6] transition-all active:scale-95"
                >
                  {acting?.id === s.id && acting.status === 'rejected'
                    ? <Loader2 size={14} className="animate-spin" />
                    : <XCircle size={14} />}
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
