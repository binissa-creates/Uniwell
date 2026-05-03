import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Search, Heart, Loader2, CheckCircle2, PlusCircle, X, Sparkles, Bookmark, Library, BookOpen } from 'lucide-react'

const CATEGORIES = ['All', 'Relaxation', 'Time Management', 'Social Support', 'Physical Activity', 'Creative Expression', 'Mindfulness', 'Other']
const TRIGGERS = ['Academics', 'Social', 'Family', 'Health', 'Finance', 'Relationships', 'Personal Growth', 'Other']

const CAT_STYLE = {
  'Relaxation': { bg: '#c1d0db', text: '#2d4550' },
  'Time Management': { bg: '#f6c945', text: '#6d5400' },
  'Social Support': { bg: '#ccebc7', text: '#2d5a29' },
  'Physical Activity': { bg: '#ffdbd0', text: '#7a2d1a' },
  'Creative Expression': { bg: '#e8dcf0', text: '#4a3060' },
  'Mindfulness': { bg: '#c1d0db', text: '#526069' },
  'Other': { bg: '#ffe9e3', text: '#9e7060' },
}

const STATUS_STYLE = {
  approved: { bg: '#ccebc7', text: '#2d5a29', label: 'Approved' },
  pending: { bg: '#fff3cd', text: '#856404', label: 'Pending review' },
  rejected: { bg: '#ffdad6', text: '#93000a', label: 'Rejected' },
}

function CategoryBadge({ category }) {
  const s = CAT_STYLE[category] || CAT_STYLE['Other']
  return <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: s.bg, color: s.text }}>{category}</span>
}

// ── Tabs ─────────────────────────────────────────────────────
const TABS = [
  { key: 'community', icon: BookOpen, label: 'Community' },
  { key: 'favorites', icon: Bookmark, label: 'Favorites' },
  { key: 'mine', icon: Library, label: 'My Strategies' },
]

export default function PeerInsights() {
  const { user } = useAuth()
  const [tab, setTab] = useState('community')

  // Community
  const [strategies, setStrategies] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [voting, setVoting] = useState(null)

  // Favorites
  const [favIds, setFavIds] = useState(new Set())
  const [favStrategies, setFavStrategies] = useState([])
  const [favLoading, setFavLoading] = useState(false)
  const [bookmarking, setBookmarking] = useState(null)

  // My strategies
  const [mine, setMine] = useState([])
  const [mineLoading, setMineLoading] = useState(false)

  // Submit modal
  const [showSubmit, setShowSubmit] = useState(false)
  const [submitForm, setSubmitForm] = useState({ category: '', title: '', description: '', trigger_tags: [] })
  const [submitting, setSubmitting] = useState(false)
  const [submitDone, setSubmitDone] = useState(false)

  // ── Fetch community ────────────────────────────────────────
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

      const [stratRes, voteRes, bookRes] = await Promise.all([
        q,
        supabase.from('helpful_votes').select('strategy_id'),
        supabase.from('strategy_favorites').select('strategy_id').eq('user_id', user?.id),
      ])
      if (stratRes.error) throw stratRes.error

      const votedIds = new Set((voteRes.data || []).map(v => v.strategy_id))
      const savedIds = new Set((bookRes.data || []).map(b => b.strategy_id))
      setFavIds(savedIds)
      setStrategies(
        (stratRes.data || []).map(s => ({ ...s, i_voted: votedIds.has(s.id) ? 1 : 0 }))
      )
    } catch (err) {
      console.error('[coping fetch]', err)
    }
  }, [search, category, user?.id])

  useEffect(() => {
    const t = setTimeout(fetchStrategies, 300)
    return () => clearTimeout(t)
  }, [fetchStrategies])

  // ── Fetch favorites ────────────────────────────────────────
  const fetchFavorites = useCallback(async () => {
    if (!user?.id) return
    setFavLoading(true)
    try {
      const { data, error } = await supabase
        .from('strategy_favorites')
        .select('strategy_id, coping_strategies(id, category, title, description, trigger_tags, helpful_count)')
        .eq('user_id', user.id)
      if (error) throw error
      setFavStrategies((data || []).map(r => r.coping_strategies).filter(Boolean))
    } catch (err) {
      console.error('[fav fetch]', err)
    } finally {
      setFavLoading(false)
    }
  }, [user?.id])

  // ── Fetch mine ─────────────────────────────────────────────
  const fetchMine = useCallback(async () => {
    if (!user?.id) return
    setMineLoading(true)
    try {
      const { data, error } = await supabase
        .from('coping_strategies')
        .select('id, category, title, description, trigger_tags, helpful_count, status, created_at')
        .eq('submitter_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setMine(data || [])
    } catch (err) {
      console.error('[mine fetch]', err)
    } finally {
      setMineLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (tab === 'favorites') fetchFavorites()
    if (tab === 'mine') fetchMine()
  }, [tab, fetchFavorites, fetchMine])

  // ── Vote ───────────────────────────────────────────────────
  const handleVote = async (id) => {
    setVoting(id)
    try {
      const { data: voted, error } = await supabase.rpc('toggle_helpful_vote', { p_strategy_id: id })
      if (error) throw error
      setStrategies(prev => prev.map(s =>
        s.id === id
          ? { ...s, helpful_count: voted ? s.helpful_count + 1 : Math.max(0, s.helpful_count - 1), i_voted: voted ? 1 : 0 }
          : s
      ))
    } catch (err) {
      console.error('[vote]', err)
    } finally {
      setVoting(null)
    }
  }

  // ── Bookmark toggle ────────────────────────────────────────
  const handleBookmark = async (strategyId) => {
    if (!user?.id) return
    setBookmarking(strategyId)
    const already = favIds.has(strategyId)
    try {
      if (already) {
        await supabase.from('strategy_favorites').delete()
          .eq('user_id', user.id).eq('strategy_id', strategyId)
        setFavIds(prev => { const n = new Set(prev); n.delete(strategyId); return n })
        // Remove from favStrategies immediately
        setFavStrategies(prev => prev.filter(s => s.id !== strategyId))
      } else {
        await supabase.from('strategy_favorites').insert({ user_id: user.id, strategy_id: strategyId })
        setFavIds(prev => new Set([...prev, strategyId]))
        // Add to favStrategies immediately — find full object from community list
        const fullStrategy = strategies.find(s => s.id === strategyId)
        if (fullStrategy) {
          setFavStrategies(prev => {
            const alreadyIn = prev.some(s => s.id === strategyId)
            return alreadyIn ? prev : [fullStrategy, ...prev]
          })
        }
      }
    } catch (err) {
      console.error('[bookmark]', err)

    } finally {
      setBookmarking(null)
    }
  }

  // ── Submit ─────────────────────────────────────────────────
  const toggleTag = t => setSubmitForm(f => ({
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
      console.error('[submit]', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 pt-28 pb-24 page-enter">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="text-warm/45 text-xs font-semibold uppercase tracking-widest mb-3">Community</p>
            <h1 className="font-jakarta text-5xl font-extrabold text-warm editorial-accent mb-4">Peer Insights</h1>
            <p className="text-warm/50 text-sm leading-relaxed max-w-md">Anonymized coping strategies from students just like you. 💡</p>
          </div>
          <button onClick={() => setShowSubmit(true)}
            className="flex items-center gap-2 gradient-cta text-on-primary font-semibold text-sm px-6 py-3 rounded-full shadow-suncast hover:shadow-glow hover:opacity-95 active:scale-[0.98] transition-all duration-200 flex-shrink-0 self-start mt-8">
            <PlusCircle size={16} /> Share a strategy
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {TABS.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200
                ${tab === key ? 'gradient-cta text-[#3E3006] shadow-glow' : 'bg-white text-warm/50 shadow-suncast hover:text-warm hover:shadow-glow'}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* ── COMMUNITY TAB ── */}
        {tab === 'community' && (
          <>
            <div className="flex gap-3 mb-8 flex-wrap items-center">
              <div className="relative flex-1 min-w-52">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-warm/30 pointer-events-none" />
                <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search strategies…"
                  className="w-full bg-white rounded-2xl pl-10 pr-4 py-3 text-sm text-warm placeholder-warm/30 outline-none shadow-suncast focus:shadow-glow transition-all duration-200" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`flex-shrink-0 text-xs px-4 py-2 rounded-full font-semibold transition-all duration-200
                      ${category === c ? 'bg-primary-container text-on-primary-container shadow-suncast' : 'bg-white text-warm/50 shadow-suncast hover:text-warm hover:shadow-glow'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {strategies.length === 0 ? (
              <EmptyState emoji="💡" title="No strategies found" sub="Try a different filter or be the first to share!" />
            ) : (
              <div className="columns-1 sm:columns-2 md:columns-3 gap-5 space-y-5">
                {strategies.map((s, i) => (
                  <StrategyCard key={s.id} s={s} i={i}
                    isFav={favIds.has(s.id)}
                    onVote={handleVote}
                    onBookmark={handleBookmark}
                    voting={voting}
                    bookmarking={bookmarking}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── FAVORITES TAB ── */}
        {tab === 'favorites' && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#f6c945]/15 flex items-center justify-center">
                <Bookmark size={18} className="text-[#755b00]" />
              </div>
              <div>
                <h2 className="font-jakarta font-bold text-warm">Saved Favorites</h2>
                <p className="text-xs text-warm/45">Strategies you bookmarked for quick access</p>
              </div>
            </div>

            {favLoading ? (
              <LoadingState />
            ) : favStrategies.length === 0 ? (
              <EmptyState emoji="🔖" title="No favorites yet"
                sub="Tap the bookmark icon on any strategy to save it here." />
            ) : (
              <div className="columns-1 sm:columns-2 md:columns-3 gap-5 space-y-5">
                {favStrategies.map((s, i) => (
                  <StrategyCard key={s.id} s={s} i={i}
                    isFav={true}
                    onVote={() => { }}
                    onBookmark={handleBookmark}
                    voting={null}
                    bookmarking={bookmarking}
                    hideLike
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── MY STRATEGIES TAB ── */}
        {tab === 'mine' && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#f6c945]/15 flex items-center justify-center">
                <Library size={18} className="text-[#755b00]" />
              </div>
              <div>
                <h2 className="font-jakarta font-bold text-warm">My Strategy Library</h2>
                <p className="text-xs text-warm/45">All coping strategies you've submitted</p>
              </div>
            </div>

            {mineLoading ? (
              <LoadingState />
            ) : mine.length === 0 ? (
              <EmptyState emoji="📚" title="No strategies yet"
                sub="Share your first coping strategy to build your personal library." />
            ) : (
              <div className="space-y-3">
                {mine.map(s => {
                  const ss = STATUS_STYLE[s.status] || STATUS_STYLE.pending
                  const cat = CAT_STYLE[s.category] || CAT_STYLE['Other']
                  return (
                    <div key={s.id} className="bg-white rounded-3xl p-5 shadow-suncast flex items-start gap-4 card-hover">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: cat.bg, color: cat.text }}>{s.category}</span>
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide" style={{ background: ss.bg, color: ss.text }}>{ss.label}</span>
                        </div>
                        <h3 className="font-jakarta font-bold text-warm text-base leading-snug mb-1">{s.title}</h3>
                        <p className="text-sm text-warm/60 leading-relaxed line-clamp-2">{s.description}</p>
                        {(() => {
                          const tags = Array.isArray(s.trigger_tags) ? s.trigger_tags : []
                          return tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {tags.map(t => (
                                <span key={t} className="text-[10px] font-semibold rounded-full px-2.5 py-1"
                                  style={{ background: 'var(--color-secondary-container)', color: 'var(--color-secondary)' }}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          ) : null
                        })()}
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        <Heart size={14} className="text-red-400" fill="currentColor" />
                        <span className="text-xs font-bold text-warm/50">{s.helpful_count ?? 0}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Submit modal */}
      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(193,208,219,0.55)', backdropFilter: 'blur(20px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowSubmit(false) }}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-lift animate-scaleIn relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 rounded-t-3xl"
              style={{ background: 'linear-gradient(90deg, #e8a800, #f6c945)' }} />
            <div className="flex items-center justify-between mb-6 mt-1">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                <h2 className="font-jakarta font-bold text-xl text-warm">Share a Coping Strategy</h2>
              </div>
              <button onClick={() => setShowSubmit(false)} className="text-warm/30 hover:text-warm transition-colors rounded-xl p-1 hover:bg-surface-container">
                <X size={20} />
              </button>
            </div>

            {submitDone ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <span className="text-5xl animate-breathe inline-block">🌻</span>
                <p className="font-jakarta font-bold text-warm text-xl">Submitted for review!</p>
                <p className="text-sm text-warm/45 text-center">A moderator will review your strategy before it goes live.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-warm/45 uppercase tracking-widest mb-2 block">Category</label>
                    <select required value={submitForm.category}
                      onChange={e => setSubmitForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full rounded-2xl px-4 py-3 text-sm text-warm outline-none transition-all duration-200 appearance-none"
                      style={{ background: 'var(--color-surface-container-highest)' }}>
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
                      style={{ background: 'var(--color-surface-container-highest)' }} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-warm/45 uppercase tracking-widest mb-2 block">Description</label>
                  <textarea required rows={4} value={submitForm.description}
                    onChange={e => setSubmitForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Explain how this strategy helps and how to do it…"
                    className="w-full rounded-2xl px-4 py-3 text-sm text-warm placeholder-warm/30 outline-none resize-none transition-all duration-200 leading-relaxed"
                    style={{ background: 'var(--color-surface-container-highest)' }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-warm/45 uppercase tracking-widest mb-2.5">Helpful for (triggers)</p>
                  <div className="flex flex-wrap gap-2">
                    {TRIGGERS.map(t => (
                      <button key={t} type="button" onClick={() => toggleTag(t)}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all duration-150 ${submitForm.trigger_tags.includes(t) ? 'chip-active' : 'chip-inactive'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full gradient-cta text-on-primary font-semibold rounded-full py-3.5 flex items-center justify-center gap-2 shadow-suncast hover:shadow-glow hover:opacity-95 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 text-sm mt-2">
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

// ── Shared card component ──────────────────────────────────────
function StrategyCard({ s, i, isFav, onVote, onBookmark, voting, bookmarking, hideLike }) {
  return (
    <div className={`break-inside-avoid bg-white rounded-3xl p-5 shadow-suncast flex flex-col gap-3 relative overflow-hidden card-hover ${i % 3 === 2 ? 'petal-accent' : ''}`}>
      <CategoryBadge category={s.category} />
      <h3 className="font-jakarta font-bold text-warm text-base leading-snug">{s.title}</h3>
      <p className="text-sm text-warm/65 leading-relaxed line-clamp-4">{s.description}</p>
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
      <div className="mt-auto flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid rgba(209,197,174,0.15)' }}>
        <span className="text-[10px] text-warm/30 font-medium">Shared anonymously</span>
        <div className="flex items-center gap-2">
          {/* Bookmark */}
          <button onClick={() => onBookmark(s.id)} disabled={bookmarking === s.id}
            title={isFav ? 'Remove from favorites' : 'Save to favorites'}
            className={`p-1.5 rounded-full transition-all duration-200 ${isFav ? 'text-[#755b00] bg-[#f6c945]/20' : 'text-warm/30 hover:text-[#755b00] hover:bg-[#f6c945]/10'}`}>
            {bookmarking === s.id
              ? <Loader2 size={13} className="animate-spin" />
              : <Bookmark size={13} fill={isFav ? 'currentColor' : 'none'} />}
          </button>
          {/* Like */}
          {!hideLike && (
            <button onClick={() => onVote(s.id)} disabled={voting === s.id}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200
                ${s.i_voted ? 'bg-red-100 text-red-500 shadow-suncast' : 'text-warm/40 hover:bg-red-50 hover:text-red-400'}`}>
              {voting === s.id ? <Loader2 size={12} className="animate-spin" /> : <Heart size={12} fill={s.i_voted ? 'currentColor' : 'none'} />}
              <span>{s.helpful_count}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ emoji, title, sub }) {
  return (
    <div className="text-center py-20 text-warm/35">
      <p className="text-5xl mb-3">{emoji}</p>
      <p className="font-jakarta font-semibold text-warm text-lg mb-1">{title}</p>
      <p className="text-sm">{sub}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 size={32} className="animate-spin text-[#755b00]" />
      <p className="text-xs font-bold uppercase tracking-widest text-warm/40">Loading…</p>
    </div>
  )
}
