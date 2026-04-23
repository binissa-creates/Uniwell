import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { Search, Heart, Loader2, CheckCircle2, PlusCircle, X, Sparkles } from 'lucide-react'

const CATEGORIES = ['All', 'Relaxation', 'Time Management', 'Social Support', 'Physical Activity', 'Creative Expression', 'Mindfulness', 'Other']
const TRIGGERS   = ['Academics', 'Social', 'Family', 'Health', 'Finance', 'Relationships', 'Personal Growth', 'Other']

// Map categories to Stitch tonal tokens
const CAT_STYLE = {
  'Relaxation':         { bg: 'var(--color-tertiary-container)', text: '#2d4550' },
  'Time Management':    { bg: 'var(--color-primary-container)',  text: 'var(--color-on-primary-container)' },
  'Social Support':     { bg: 'var(--color-secondary-container)',text: '#2d5a29' },
  'Physical Activity':  { bg: '#ffdbd0', text: '#7a2d1a' },
  'Creative Expression':{ bg: '#e8dcf0', text: '#4a3060' },
  'Mindfulness':        { bg: 'var(--color-tertiary-container)', text: 'var(--color-tertiary)' },
  'Other':              { bg: 'var(--color-surface-container)',  text: 'rgba(93,64,55,0.6)' },
}

function CategoryBadge({ category }) {
  const style = CAT_STYLE[category] || CAT_STYLE['Other']
  return (
    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: style.bg, color: style.text }}>
      {category}
    </span>
  )
}

export default function PeerInsights() {
  const [strategies, setStrategies] = useState([])
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('All')
  const [voting, setVoting]         = useState(null)
  const [showSubmit, setShowSubmit] = useState(false)
  const [submitForm, setSubmitForm] = useState({ category: '', title: '', description: '', trigger_tags: [] })
  const [submitting, setSubmitting] = useState(false)
  const [submitDone, setSubmitDone] = useState(false)

  const fetchStrategies = useCallback(async () => {
    try {
      let q = supabase
        .from('coping_strategies')
        .select('id, category, title, description, trigger_tags, helpful_count, created_at')
        .eq('status', 'approved')
        .order('helpful_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50)
      if (category !== 'All') q = q.eq('category', category)
      if (search) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`)

      const [stratRes, voteRes] = await Promise.all([
        q,
        supabase.from('helpful_votes').select('strategy_id'),
      ])
      if (stratRes.error) throw stratRes.error
      if (voteRes.error) throw voteRes.error

      const votedIds = new Set((voteRes.data || []).map((v) => v.strategy_id))
      setStrategies(
        (stratRes.data || []).map((s) => ({ ...s, i_voted: votedIds.has(s.id) ? 1 : 0 }))
      )
    } catch (err) {
      console.error('[coping fetch]', err)
    }
  }, [search, category])

  useEffect(() => {
    const t = setTimeout(fetchStrategies, 300)
    return () => clearTimeout(t)
  }, [fetchStrategies])

  const handleVote = async (id) => {
    setVoting(id)
    try {
      const { data: voted, error } = await supabase.rpc('toggle_helpful_vote', {
        p_strategy_id: id,
      })
      if (error) throw error
      setStrategies((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                helpful_count: voted ? s.helpful_count + 1 : Math.max(0, s.helpful_count - 1),
                i_voted: voted ? 1 : 0,
              }
            : s
        )
      )
    } catch (err) {
      console.error('[coping vote]', err)
    } finally {
      setVoting(null)
    }
  }

  const toggleTag = (t) =>
    setSubmitForm(f => ({
      ...f,
      trigger_tags: f.trigger_tags.includes(t) ? f.trigger_tags.filter(x => x !== t) : [...f.trigger_tags, t],
    }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) throw new Error('Not authenticated')
      const { error } = await supabase.from('coping_strategies').insert({
        submitter_id: auth.user.id,
        category: submitForm.category,
        title: submitForm.title,
        description: submitForm.description,
        trigger_tags: Array.isArray(submitForm.trigger_tags) ? submitForm.trigger_tags : [],
      })
      if (error) throw error
      setSubmitDone(true)
      setSubmitForm({ category: '', title: '', description: '', trigger_tags: [] })
      setTimeout(() => { setSubmitDone(false); setShowSubmit(false) }, 2500)
    } catch (err) {
      console.error('[coping submit]', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 pt-28 pb-24 page-enter">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 mb-10 flex-wrap">
          <div>
            <p className="text-warm/45 text-xs font-semibold uppercase tracking-widest mb-3">Community</p>
            <h1 className="font-jakarta text-5xl font-extrabold text-warm editorial-accent mb-4">
              Peer Insights
            </h1>
            <p className="text-warm/50 text-sm leading-relaxed max-w-md">
              Anonymized coping strategies from students just like you. 💡
            </p>
          </div>
          <button
            onClick={() => setShowSubmit(true)}
            className="flex items-center gap-2 gradient-cta text-on-primary font-semibold text-sm
                       px-6 py-3 rounded-full shadow-suncast hover:shadow-glow hover:opacity-95
                       active:scale-[0.98] transition-all duration-200 flex-shrink-0 self-start mt-8"
          >
            <PlusCircle size={16} /> Share a strategy
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="flex gap-3 mb-8 flex-wrap items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-warm/30 pointer-events-none" />
            <input
              type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search strategies…"
              className="w-full bg-white rounded-2xl pl-10 pr-4 py-3 text-sm text-warm
                         placeholder-warm/30 outline-none shadow-suncast
                         focus:shadow-glow transition-all duration-200"
            />
          </div>
          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`flex-shrink-0 text-xs px-4 py-2 rounded-full font-semibold transition-all duration-200
                  ${category === c
                    ? 'bg-primary-container text-on-primary-container shadow-suncast'
                    : 'bg-white text-warm/50 shadow-suncast hover:text-warm hover:shadow-glow'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── Cards grid ── */}
        {strategies.length === 0 ? (
          <div className="text-center py-20 text-warm/35">
            <p className="text-5xl mb-3">💡</p>
            <p className="font-jakarta font-semibold text-warm text-lg mb-1">No strategies found</p>
            <p className="text-sm">Try a different filter or be the first to share!</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 gap-5 space-y-5">
            {strategies.map((s, i) => (
              <div key={s.id}
                className={`break-inside-avoid bg-white rounded-3xl p-5 shadow-suncast
                             flex flex-col gap-3 relative overflow-hidden card-hover
                             ${i % 3 === 2 ? 'petal-accent' : ''}`}>

                {/* Category badge */}
                <CategoryBadge category={s.category} />

                {/* Title */}
                <h3 className="font-jakarta font-bold text-warm text-base leading-snug">{s.title}</h3>

                {/* Description */}
                <p className="text-sm text-warm/65 leading-relaxed line-clamp-4">{s.description}</p>

                {/* Trigger tags */}
                {(() => {
                  const tags = Array.isArray(s.trigger_tags) ? s.trigger_tags : []
                  return tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(t => (
                        <span key={t} className="text-[10px] font-semibold rounded-full px-2.5 py-1"
                          style={{ background: 'var(--color-secondary-container)', color: 'var(--color-secondary)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null
                })()}

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between pt-3"
                  style={{ borderTop: '1px solid rgba(209,197,174,0.15)' }}>
                  <span className="text-[10px] text-warm/30 font-medium">Shared anonymously</span>
                  <button
                    onClick={() => handleVote(s.id)}
                    disabled={voting === s.id}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200
                      ${s.i_voted
                        ? 'bg-red-100 text-red-500 shadow-suncast'
                        : 'text-warm/40 hover:bg-red-50 hover:text-red-400'}`}
                  >
                    {voting === s.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Heart size={12} fill={s.i_voted ? 'currentColor' : 'none'} />
                    }
                    <span>{s.helpful_count}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Submit modal — "Breathe" Overlay ── */}
      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(193,208,219,0.55)', backdropFilter: 'blur(20px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowSubmit(false) }}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-lift animate-scaleIn relative overflow-hidden">

            {/* Top accent */}
            <div className="absolute top-0 inset-x-0 h-1.5 rounded-t-3xl"
              style={{ background: 'linear-gradient(90deg, #e8a800, #f6c945)' }} />

            <div className="flex items-center justify-between mb-6 mt-1">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                <h2 className="font-jakarta font-bold text-xl text-warm">Share a Coping Strategy</h2>
              </div>
              <button onClick={() => setShowSubmit(false)}
                className="text-warm/30 hover:text-warm transition-colors rounded-xl p-1 hover:bg-surface-container">
                <X size={20} />
              </button>
            </div>

            {submitDone ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <span className="text-5xl animate-breathe inline-block">🌻</span>
                <p className="font-jakarta font-bold text-warm text-xl">Submitted for review!</p>
                <p className="text-sm text-warm/45 text-center">
                  A moderator will review your strategy before it goes live.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-warm/45 uppercase tracking-widest mb-2 block">Category</label>
                    <select required value={submitForm.category}
                      onChange={e => setSubmitForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full rounded-2xl px-4 py-3 text-sm text-warm outline-none
                                 transition-all duration-200 appearance-none"
                      style={{ background: 'var(--color-surface-container-highest, #ffdbd0)' }}
                      onFocus={e => e.target.style.background = 'var(--color-primary-fixed, #ffdf90)'}
                      onBlur={e  => e.target.style.background = 'var(--color-surface-container-highest, #ffdbd0)'}>
                      <option value="">Select…</option>
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-warm/45 uppercase tracking-widest mb-2 block">Title</label>
                    <input required value={submitForm.title}
                      onChange={e => setSubmitForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. 4-7-8 Breathing"
                      className="w-full rounded-2xl px-4 py-3 text-sm text-warm placeholder-warm/30 outline-none transition-all duration-200"
                      style={{ background: 'var(--color-surface-container-highest, #ffdbd0)' }}
                      onFocus={e => e.target.style.background = 'var(--color-primary-fixed, #ffdf90)'}
                      onBlur={e  => e.target.style.background = 'var(--color-surface-container-highest, #ffdbd0)'} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-warm/45 uppercase tracking-widest mb-2 block">Description</label>
                  <textarea required rows={4} value={submitForm.description}
                    onChange={e => setSubmitForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Explain how this strategy helps and how to do it…"
                    className="w-full rounded-2xl px-4 py-3 text-sm text-warm placeholder-warm/30
                               outline-none resize-none transition-all duration-200 leading-relaxed"
                    style={{ background: 'var(--color-surface-container-highest, #ffdbd0)' }}
                    onFocus={e => e.target.style.background = 'var(--color-primary-fixed, #ffdf90)'}
                    onBlur={e  => e.target.style.background = 'var(--color-surface-container-highest, #ffdbd0)'} />
                </div>

                <div>
                  <p className="text-xs font-bold text-warm/45 uppercase tracking-widest mb-2.5">Helpful for (triggers)</p>
                  <div className="flex flex-wrap gap-2">
                    {TRIGGERS.map(t => (
                      <button key={t} type="button" onClick={() => toggleTag(t)}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all duration-150
                          ${submitForm.trigger_tags.includes(t) ? 'chip-active' : 'chip-inactive'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full gradient-cta text-on-primary font-semibold rounded-full py-3.5
                             flex items-center justify-center gap-2 shadow-suncast
                             hover:shadow-glow hover:opacity-95 active:scale-[0.98]
                             transition-all duration-200 disabled:opacity-40 text-sm mt-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? 'Submitting…' : 'Submit for review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
