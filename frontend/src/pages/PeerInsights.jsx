import { useState, useEffect, useCallback, useMemo } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getPersonalizedRecommendations } from '../lib/recommendationEngine'
import { 
  Search, Heart, Loader2, CheckCircle2, PlusCircle, X, Sparkles, 
  Bookmark, Library, BookOpen, Tag, Calendar, Target, Award, 
  ArrowRight, Compass, Zap, Filter, SlidersHorizontal, ChevronRight
} from 'lucide-react'

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

function CategoryBadge({ category, size = 'sm' }) {
  const s = CAT_STYLE[category] || CAT_STYLE['Other']
  const sizeClasses = size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5'
  return (
    <span 
      className={`${sizeClasses} font-bold rounded-full inline-flex items-center tracking-tight shadow-sm`} 
      style={{ background: s.bg, color: s.text }}
    >
      {category}
    </span>
  )
}

// ── Tabs ─────────────────────────────────────────────────────
const TABS = [
  { key: 'recommendations', icon: Sparkles, label: 'For You' },
  { key: 'community', icon: BookOpen, label: 'Community' },
  { key: 'favorites', icon: Bookmark, label: 'Favorites' },
  { key: 'mine', icon: Library, label: 'My Strategies' },
]

export default function PeerInsights() {
  const { user } = useAuth()
  const [tab, setTab] = useState('recommendations')
  const [selectedCard, setSelectedCard] = useState(null)

  // Recommendations
  const [recData, setRecData] = useState(null)
  const [recLoading, setRecLoading] = useState(false)
  const [recCategory, setRecCategory] = useState('All')
  const [recSearch, setRecSearch] = useState('')

  // Community
  const [strategies, setStrategies] = useState([])
  const [commLoading, setCommLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [voting, setVoting] = useState(null)

  // Favorites
  const [favIds, setFavIds] = useState(new Set())
  const [favStrategies, setFavStrategies] = useState([])
  const [favLoading, setFavLoading] = useState(false)
  const [favSearch, setFavSearch] = useState('')
  const [bookmarking, setBookmarking] = useState(null)

  // My strategies
  const [mine, setMine] = useState([])
  const [mineLoading, setMineLoading] = useState(false)

  // Submit modal
  const [showSubmit, setShowSubmit] = useState(false)
  const [submitForm, setSubmitForm] = useState({ category: '', customCategory: '', title: '', description: '', trigger_tags: [], customTrigger: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitDone, setSubmitDone] = useState(false)
  const [showOtherTriggerInput, setShowOtherTriggerInput] = useState(false)

  // ── Fetch personalized recommendations ────────────────────
  const fetchRecommendations = useCallback(async () => {
    if (!user?.id) return
    setRecLoading(true)
    try {
      const data = await getPersonalizedRecommendations(user.id)
      setRecData(data)
    } catch (err) {
      console.error('[recommendations fetch error]', err)
    } finally {
      setRecLoading(false)
    }
  }, [user?.id])

  // ── Fetch community ────────────────────────────────────────
  const fetchStrategies = useCallback(async () => {
    setCommLoading(true)
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

      // Smart Matching: Get user's latest triggers
      const { data: latestMood } = await supabase
        .from('mood_logs')
        .select('id, mood_triggers(trigger_category)')
        .eq('user_id', user?.id)
        .order('logged_at', { ascending: false })
        .limit(1)
        .single()
      
      const userTriggers = (latestMood?.mood_triggers || []).map(t => t.trigger_category)

      let finalData = (stratRes.data || []).map(s => ({ ...s, i_voted: votedIds.has(s.id) ? 1 : 0 }))
      
      // Sort: Match user triggers first
      if (userTriggers.length > 0) {
        finalData.sort((a, b) => {
          const aMatch = (a.trigger_tags || []).some(t => userTriggers.includes(t))
          const bMatch = (b.trigger_tags || []).some(t => userTriggers.includes(t))
          if (aMatch && !bMatch) return -1
          if (!aMatch && bMatch) return 1
          return 0
        })
      }

      setStrategies(finalData)
    } catch (err) {
      console.error('[coping fetch]', err)
    } finally {
      setCommLoading(false)
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
    if (tab === 'recommendations') fetchRecommendations()
    if (tab === 'favorites') fetchFavorites()
    if (tab === 'mine') fetchMine()
  }, [tab, fetchRecommendations, fetchFavorites, fetchMine])

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
    fetchRecommendations()
  }, [fetchRecommendations])

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

      setRecData(prev => {
        if (!prev) return prev
        const updateList = (list) => (list || []).map(s => s.id === id ? {
          ...s,
          helpful_count: voted ? s.helpful_count + 1 : Math.max(0, s.helpful_count - 1),
          i_voted: voted ? 1 : 0
        } : s)

        return {
          ...prev,
          topRecommendation: prev.topRecommendation?.id === id ? {
            ...prev.topRecommendation,
            helpful_count: voted ? prev.topRecommendation.helpful_count + 1 : Math.max(0, prev.topRecommendation.helpful_count - 1),
            i_voted: voted ? 1 : 0
          } : prev.topRecommendation,
          recommendations: updateList(prev.recommendations)
        }
      })
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
        setFavStrategies(prev => prev.filter(s => s.id !== strategyId))
      } else {
        await supabase.from('strategy_favorites').insert({ user_id: user.id, strategy_id: strategyId })
        setFavIds(prev => new Set([...prev, strategyId]))
        const fullStrategy = strategies.find(s => s.id === strategyId) || recData?.recommendations?.find(s => s.id === strategyId)
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
  const toggleTag = t => {
    if (t === 'Other') {
      setShowOtherTriggerInput(!showOtherTriggerInput)
      return
    }
    setSubmitForm(f => ({
      ...f,
      trigger_tags: f.trigger_tags.includes(t) ? f.trigger_tags.filter(x => x !== t) : [...f.trigger_tags, t],
    }))
  }

  const addCustomTrigger = () => {
    const t = submitForm.customTrigger.trim()
    if (!t) return
    if (!submitForm.trigger_tags.includes(t)) {
      setSubmitForm(f => ({
        ...f,
        trigger_tags: [...f.trigger_tags, t],
        customTrigger: ''
      }))
    }
    setShowOtherTriggerInput(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.id) {
      alert('Please log in to share a strategy.')
      return
    }

    setSubmitting(true)
    try {
      const isCustomCategory = submitForm.category === 'Other' && submitForm.customCategory
      const finalCategory = isCustomCategory ? 'Other' : (submitForm.category || 'Other')
      const finalDescription = isCustomCategory 
        ? `[Category: ${submitForm.customCategory}] ${submitForm.description}`
        : submitForm.description

      const { error } = await supabase.from('coping_strategies').insert({
        submitter_id: user.id,
        category: finalCategory,
        title: submitForm.title,
        description: finalDescription,
        trigger_tags: Array.isArray(submitForm.trigger_tags) ? submitForm.trigger_tags : [],
        status: 'pending'
      })

      if (error) throw error
      
      setSubmitDone(true)
      setSubmitForm({ category: '', customCategory: '', title: '', description: '', trigger_tags: [], customTrigger: '' })
      setShowOtherTriggerInput(false)
      setTimeout(() => { setSubmitDone(false); setShowSubmit(false) }, 2200)
    } catch (err) {
      console.error('[submit]', err)
      alert(`Submission failed: ${err.message || 'Please check all fields and try again.'}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Filtered recommendations list
  const filteredRecs = useMemo(() => {
    return (recData?.recommendations || []).filter(s => {
      if (recCategory !== 'All' && s.category !== recCategory) return false
      if (recSearch) {
        const q = recSearch.toLowerCase()
        return s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
      }
      return true
    })
  }, [recData?.recommendations, recCategory, recSearch])

  // Filtered favorites
  const filteredFavs = useMemo(() => {
    return favStrategies.filter(s => {
      if (!favSearch) return true
      const q = favSearch.toLowerCase()
      return s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
    })
  }, [favStrategies, favSearch])

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 page-enter">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#755b00] bg-[#f6c945]/20 px-2.5 py-0.5 rounded-full">
                Community Hub
              </span>
            </div>
            <h1 className="font-jakarta text-2xl sm:text-3xl font-extrabold text-warm tracking-tight">
              Peer Insights & Coping
            </h1>
            <p className="text-warm/60 text-xs sm:text-sm mt-0.5 max-w-lg">
              Explore student-tested coping strategies and intelligent recommendations tailored to your recent check-ins.
            </p>
          </div>
          <button 
            onClick={() => setShowSubmit(true)}
            className="flex items-center justify-center gap-2 gradient-cta text-on-primary font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-suncast hover:shadow-glow hover:opacity-95 active:scale-[0.98] transition-all duration-200 flex-shrink-0 self-start sm:self-center"
          >
            <PlusCircle size={15} /> Share a Strategy
          </button>
        </div>

        {/* ── Segmented Navigation Tabs ── */}
        <div className="p-1 bg-[#f0e7df]/60 rounded-2xl sm:rounded-full border border-warm/5 flex items-center gap-1 mb-6 overflow-x-auto custom-scrollbar shadow-inner max-w-full">
          {TABS.map(({ key, icon: Icon, label }) => {
            const isActive = tab === key
            return (
              <button 
                key={key} 
                onClick={() => setTab(key)}
                className={`flex-1 min-w-[110px] sm:min-w-0 flex items-center justify-center gap-2 px-4 py-2 rounded-xl sm:rounded-full text-xs font-bold transition-all duration-200 ${
                  isActive 
                    ? 'gradient-cta text-[#3E3006] shadow-sm' 
                    : 'text-warm/60 hover:text-warm hover:bg-white/50'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#3E3006]' : 'text-warm/50'} />
                <span>{label}</span>
                {key === 'favorites' && favStrategies.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isActive ? 'bg-[#3E3006]/15 text-[#3E3006]' : 'bg-warm/10 text-warm/70'}`}>
                    {favStrategies.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── FOR YOU (RECOMMENDATIONS) TAB ── */}
        {tab === 'recommendations' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Unified Compact Context & Hero Spotlight */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Left Column: Context Card */}
              <div className="lg:col-span-4 bg-gradient-to-br from-[#FFFDF8] to-[#FFF8EA] rounded-2xl p-4 sm:p-5 border border-[#F6C945]/30 shadow-suncast flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F6C945]/15 rounded-full blur-2xl pointer-events-none" />
                
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#856804] mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#F6C945]" />
                    <span>Personalized Coping Engine</span>
                  </div>
                  
                  <h2 className="text-base font-extrabold font-jakarta text-[#4A3228] mb-1.5 leading-snug">
                    Tailored To Your Journey
                  </h2>
                  
                  <p className="text-xs text-[#5D4037]/75 leading-relaxed mb-3">
                    {recData?.context?.summary || "Curated based on your recent check-ins, journal reflections, and stress themes."}
                  </p>
                </div>

                {/* Active Context Indicators */}
                <div className="pt-3 border-t border-[#F6C945]/20 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-warm/45 uppercase tracking-wider w-full mb-0.5">
                    Active Context Focus
                  </span>
                  {recData?.context?.primaryMood && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F6C945]/25 text-[#735905] text-[11px] font-extrabold shadow-sm capitalize flex items-center gap-1">
                      Mood: {recData.context.primaryMood.replace('_', ' ')}
                    </span>
                  )}
                  {recData?.context?.topTriggers?.map(t => (
                    <span key={t} className="px-2.5 py-0.5 rounded-full bg-[#b0cfad]/30 text-[#2e4d2a] text-[11px] font-bold shadow-sm">
                      #{t}
                    </span>
                  ))}
                  {(!recData?.context?.topTriggers?.length && !recData?.context?.primaryMood) && (
                    <span className="text-[11px] text-warm/40 italic">General wellness suggestions</span>
                  )}
                </div>
              </div>

              {/* Right Column: Top Match Spotlight */}
              {recData?.topRecommendation ? (
                <div 
                  className="lg:col-span-8 bg-white rounded-2xl p-4 sm:p-5 shadow-suncast border border-[#F6C945]/40 relative overflow-hidden cursor-pointer group hover:shadow-lift transition-all duration-200 flex flex-col justify-between"
                  onClick={() => setSelectedCard({
                    ...recData.topRecommendation,
                    _isFav: favIds.has(recData.topRecommendation.id)
                  })}
                >
                  <div>
                    {/* Header line */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F6C945] text-[#3E3006] shadow-sm">
                          <Zap className="w-3 h-3" />
                          #1 Top Match
                        </span>
                        <CategoryBadge category={recData.topRecommendation.category} size="xs" />
                      </div>

                      <span className="text-[11px] font-black text-[#856804] px-2.5 py-0.5 rounded-full bg-[#F6C945]/20 border border-[#F6C945]/30">
                        {recData.topRecommendation.matchScore}% Match
                      </span>
                    </div>

                    <h3 className="font-jakarta font-extrabold text-base sm:text-lg text-warm mb-1.5 group-hover:text-[#755b00] transition-colors leading-snug">
                      {recData.topRecommendation.title}
                    </h3>
                    
                    <p className="text-xs sm:text-sm text-warm/75 leading-relaxed mb-3 line-clamp-2 font-medium">
                      {recData.topRecommendation.description}
                    </p>

                    {/* Match Reasons */}
                    {recData.topRecommendation.matchReasons?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {recData.topRecommendation.matchReasons.slice(0, 2).map((reason, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#FDF9F2] text-[#5D4037] text-[11px] font-semibold border border-[#AA8E7E]/15">
                            <CheckCircle2 className="w-3 h-3 text-green-700 flex-shrink-0" />
                            <span className="truncate max-w-[280px]">{reason}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Spotlight Footer */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-warm/10 mt-2">
                    <span className="text-xs font-bold text-[#6B5A10] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Read full strategy <ArrowRight size={13} />
                    </span>

                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleBookmark(recData.topRecommendation.id)}
                        disabled={bookmarking === recData.topRecommendation.id}
                        title={favIds.has(recData.topRecommendation.id) ? 'Remove bookmark' : 'Bookmark'}
                        className={`p-2 rounded-full transition ${
                          favIds.has(recData.topRecommendation.id)
                            ? 'text-[#755b00] bg-[#f6c945]/20'
                            : 'text-warm/40 hover:text-[#755b00] hover:bg-[#f6c945]/10'
                        }`}
                      >
                        <Bookmark size={14} fill={favIds.has(recData.topRecommendation.id) ? 'currentColor' : 'none'} />
                      </button>

                      <button
                        onClick={() => handleVote(recData.topRecommendation.id)}
                        disabled={voting === recData.topRecommendation.id}
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full transition ${
                          recData.topRecommendation.i_voted ? 'bg-red-100 text-red-500 shadow-sm' : 'text-warm/40 hover:bg-red-50 hover:text-red-400'
                        }`}
                      >
                        <Heart size={12} fill={recData.topRecommendation.i_voted ? 'currentColor' : 'none'} />
                        <span>{recData.topRecommendation.helpful_count}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="lg:col-span-8 bg-white rounded-2xl p-5 shadow-suncast border border-warm/10 flex items-center justify-center text-center">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-warm">Exploring new recommendations</p>
                    <p className="text-xs text-warm/50">Log your mood or journal reflections to generate your #1 match!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-suncast border border-warm/10 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm/40 pointer-events-none" />
                  <input
                    type="search"
                    value={recSearch}
                    onChange={e => setRecSearch(e.target.value)}
                    placeholder="Search recommended strategies…"
                    className="w-full bg-[#fbf7f4] rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-warm placeholder-warm/35 outline-none border border-warm/10 focus:border-[#F6C945] focus:bg-white transition-all"
                  />
                </div>
                
                <div className="text-[11px] font-bold text-warm/45 flex items-center justify-between sm:justify-end gap-2 px-1">
                  <span>Showing {filteredRecs.length} {filteredRecs.length === 1 ? 'strategy' : 'strategies'}</span>
                  {recCategory !== 'All' && (
                    <button onClick={() => setRecCategory('All')} className="text-[#856804] hover:underline">
                      Reset filter
                    </button>
                  )}
                </div>
              </div>

              {/* Category Carousel Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar flex-nowrap sm:flex-wrap items-center">
                {CATEGORIES.map(c => {
                  const isActive = recCategory === c
                  return (
                    <button
                      key={c}
                      onClick={() => setRecCategory(c)}
                      className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-bold transition-all ${
                        isActive
                          ? 'gradient-cta text-[#3E3006] shadow-sm'
                          : 'bg-[#fbf7f4] text-warm/60 hover:text-warm hover:bg-[#f3ece6]'
                      }`}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Recommended Strategies Grid */}
            {recLoading ? (
              <LoadingState />
            ) : filteredRecs.length === 0 ? (
              <EmptyState emoji="💡" title="No matching strategies" sub="Try adjusting your search or category filter to see more." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecs.map((s, i) => (
                  <StrategyCard
                    key={s.id}
                    s={s}
                    i={i}
                    isFav={favIds.has(s.id)}
                    onVote={handleVote}
                    onBookmark={handleBookmark}
                    voting={voting}
                    bookmarking={bookmarking}
                    onOpen={setSelectedCard}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COMMUNITY TAB ── */}
        {tab === 'community' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Filter & Search Bar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-suncast border border-warm/10 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm/40 pointer-events-none" />
                  <input 
                    type="search" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search all community strategies…"
                    className="w-full bg-[#fbf7f4] rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-warm placeholder-warm/35 outline-none border border-warm/10 focus:border-[#F6C945] focus:bg-white transition-all"
                  />
                </div>
                
                <div className="text-[11px] font-bold text-warm/45 flex items-center justify-between sm:justify-end gap-2 px-1">
                  <span>Showing {strategies.length} {strategies.length === 1 ? 'strategy' : 'strategies'}</span>
                  {category !== 'All' && (
                    <button onClick={() => setCategory('All')} className="text-[#856804] hover:underline">
                      Reset filter
                    </button>
                  )}
                </div>
              </div>

              {/* Category Carousel Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar flex-nowrap sm:flex-wrap items-center">
                {CATEGORIES.map(c => {
                  const isActive = category === c
                  return (
                    <button 
                      key={c} 
                      onClick={() => setCategory(c)}
                      className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-bold transition-all ${
                        isActive 
                          ? 'gradient-cta text-[#3E3006] shadow-sm' 
                          : 'bg-[#fbf7f4] text-warm/60 hover:text-warm hover:bg-[#f3ece6]'
                      }`}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>

            {commLoading ? (
              <LoadingState />
            ) : strategies.length === 0 ? (
              <EmptyState emoji="💡" title="No strategies found" sub="Try a different filter or be the first to share one!" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {strategies.map((s, i) => (
                  <StrategyCard 
                    key={s.id} 
                    s={s} 
                    i={i}
                    isFav={favIds.has(s.id)}
                    onVote={handleVote}
                    onBookmark={handleBookmark}
                    voting={voting}
                    bookmarking={bookmarking}
                    onOpen={setSelectedCard}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FAVORITES TAB ── */}
        {tab === 'favorites' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-suncast border border-warm/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f6c945]/20 flex items-center justify-center text-[#755b00]">
                  <Bookmark size={16} />
                </div>
                <div>
                  <h2 className="font-jakarta font-bold text-warm text-sm sm:text-base">Saved Favorites</h2>
                  <p className="text-[11px] text-warm/50">Your quick-access collection of helpful coping strategies</p>
                </div>
              </div>

              {favStrategies.length > 0 && (
                <div className="relative min-w-[200px] sm:w-64">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm/40 pointer-events-none" />
                  <input
                    type="search"
                    value={favSearch}
                    onChange={e => setFavSearch(e.target.value)}
                    placeholder="Search saved..."
                    className="w-full bg-[#fbf7f4] rounded-xl pl-8 pr-3 py-1.5 text-xs text-warm placeholder-warm/35 outline-none border border-warm/10 focus:border-[#F6C945] transition-all"
                  />
                </div>
              )}
            </div>

            {favLoading ? (
              <LoadingState />
            ) : filteredFavs.length === 0 ? (
              <EmptyState 
                emoji="🔖" 
                title={favSearch ? "No matching favorites" : "No favorites yet"}
                sub={favSearch ? "Try searching for a different term." : "Tap the bookmark icon on any strategy card to save it here for fast retrieval."} 
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFavs.map((s, i) => (
                  <StrategyCard 
                    key={s.id} 
                    s={s} 
                    i={i}
                    isFav={true}
                    onVote={() => { }}
                    onBookmark={handleBookmark}
                    voting={null}
                    bookmarking={bookmarking}
                    hideLike
                    onOpen={setSelectedCard}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY STRATEGIES TAB ── */}
        {tab === 'mine' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-suncast border border-warm/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f6c945]/20 flex items-center justify-center text-[#755b00]">
                  <Library size={16} />
                </div>
                <div>
                  <h2 className="font-jakarta font-bold text-warm text-sm sm:text-base">My Submitted Strategies</h2>
                  <p className="text-[11px] text-warm/50">Track the approval status and peer helpfulness of your contributions</p>
                </div>
              </div>

              <button 
                onClick={() => setShowSubmit(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#755b00] bg-[#f6c945]/20 hover:bg-[#f6c945]/30 px-3.5 py-1.5 rounded-full transition-all"
              >
                <PlusCircle size={13} /> Add New
              </button>
            </div>

            {mineLoading ? (
              <LoadingState />
            ) : mine.length === 0 ? (
              <EmptyState 
                emoji="📚" 
                title="No submissions yet"
                sub="Share your favorite coping tips to support fellow students and build your library." 
              />
            ) : (
              <div className="space-y-2.5">
                {mine.map(s => {
                  const ss = STATUS_STYLE[s.status] || STATUS_STYLE.pending
                  const cat = CAT_STYLE[s.category] || CAT_STYLE['Other']
                  const createdDate = s.created_at ? new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null
                  
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => setSelectedCard({ ...s, _isFav: favIds.has(s.id), _hideLike: s.status !== 'approved' })}
                      className="bg-white rounded-2xl p-4 shadow-suncast border border-warm/10 flex items-start justify-between gap-3 hover:shadow-lift hover:border-[#F6C945]/30 transition-all cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <CategoryBadge category={s.category} size="xs" />
                          <span 
                            className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider" 
                            style={{ background: ss.bg, color: ss.text }}
                          >
                            {ss.label}
                          </span>
                          {createdDate && (
                            <span className="text-[10px] text-warm/40 font-medium ml-auto sm:ml-0">
                              {createdDate}
                            </span>
                          )}
                        </div>
                        <h3 className="font-jakarta font-bold text-warm text-sm sm:text-base leading-snug group-hover:text-[#755b00] transition-colors mb-1">
                          {s.title}
                        </h3>
                        <p className="text-xs text-warm/65 leading-relaxed line-clamp-2 mb-2 font-medium">
                          {s.description}
                        </p>
                        {(() => {
                          const tags = Array.isArray(s.trigger_tags) ? s.trigger_tags : []
                          return tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {tags.map(t => (
                                <span 
                                  key={t} 
                                  className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                                  style={{ background: 'var(--color-secondary-container)', color: 'var(--color-secondary)' }}
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          ) : null
                        })()}
                      </div>
                      
                      <div className="flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-xl bg-[#fbf7f4] min-w-[48px] self-center">
                        <Heart size={14} className="text-red-400" fill="currentColor" />
                        <span className="text-xs font-bold text-warm/70 mt-0.5">{s.helpful_count ?? 0}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Submit Modal ── */}
      {showSubmit && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(93,64,55,0.45)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowSubmit(false) }}
        >
          <div className="bg-white rounded-3xl p-5 sm:p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lift animate-scaleIn relative">
            <div className="absolute top-0 inset-x-0 h-1.5 rounded-t-3xl gradient-cta" />
            
            <div className="flex items-center justify-between mb-5 mt-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F6C945]/20 flex items-center justify-center text-[#755b00]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h2 className="font-jakarta font-bold text-lg text-warm">Share a Coping Strategy</h2>
                  <p className="text-[11px] text-warm/50">Your tip will help fellow students manage stress</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSubmit(false)} 
                className="text-warm/40 hover:text-warm transition-colors rounded-xl p-1.5 hover:bg-surface-container"
              >
                <X size={18} />
              </button>
            </div>

            {submitDone ? (
              <div className="flex flex-col items-center py-8 gap-3 text-center">
                <span className="text-4xl animate-breathe inline-block">🌻</span>
                <p className="font-jakarta font-bold text-warm text-lg">Submitted for Review!</p>
                <p className="text-xs text-warm/60 max-w-xs leading-relaxed">
                  Thank you! Your strategy will be visible to the community once reviewed by our moderator.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-warm/55 uppercase tracking-wider">Category</label>
                    <select 
                      required 
                      value={submitForm.category}
                      onChange={e => setSubmitForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2 text-xs sm:text-sm text-warm outline-none bg-[#fbf7f4] border border-warm/10 focus:border-[#F6C945]"
                    >
                      <option value="">Select Category…</option>
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {submitForm.category === 'Other' && (
                      <input 
                        required
                        value={submitForm.customCategory}
                        onChange={e => setSubmitForm(f => ({ ...f, customCategory: e.target.value }))}
                        placeholder="Specify custom category..."
                        className="w-full rounded-xl px-3 py-1.5 text-xs text-warm outline-none bg-[#FCF8F4] border border-[#F6C945]/40 mt-1"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-warm/55 uppercase tracking-wider">Title</label>
                    <input 
                      required 
                      value={submitForm.title}
                      onChange={e => setSubmitForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. 4-7-8 Box Breathing"
                      className="w-full rounded-xl px-3 py-2 text-xs sm:text-sm text-warm placeholder-warm/30 outline-none bg-[#fbf7f4] border border-warm/10 focus:border-[#F6C945]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-warm/55 uppercase tracking-wider">Description & Instructions</label>
                  <textarea 
                    required 
                    rows={3} 
                    value={submitForm.description}
                    onChange={e => setSubmitForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Explain what steps to take and how this technique relieves stress..."
                    className="w-full rounded-xl px-3 py-2 text-xs sm:text-sm text-warm placeholder-warm/30 outline-none resize-none bg-[#fbf7f4] border border-warm/10 focus:border-[#F6C945] leading-relaxed"
                  />
                </div>

                <div>
                  <p className="text-[11px] font-bold text-warm/55 uppercase tracking-wider mb-2">Helpful for (triggers)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TRIGGERS.map(t => {
                      const selected = submitForm.trigger_tags.includes(t) || (t === 'Other' && showOtherTriggerInput)
                      return (
                        <button 
                          key={t} 
                          type="button" 
                          onClick={() => toggleTag(t)}
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                            selected ? 'chip-active' : 'chip-inactive'
                          }`}
                        >
                          {t}
                        </button>
                      )
                    })}
                    {submitForm.trigger_tags.filter(t => !TRIGGERS.includes(t)).map(t => (
                      <button 
                        key={t} 
                        type="button" 
                        onClick={() => toggleTag(t)}
                        className="text-xs px-2.5 py-1 rounded-full font-semibold chip-active"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  
                  {showOtherTriggerInput && (
                    <div className="mt-2.5 flex gap-2 animate-fadeIn">
                      <input 
                        autoFocus
                        value={submitForm.customTrigger}
                        onChange={e => setSubmitForm(f => ({ ...f, customTrigger: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTrigger())}
                        placeholder="Type custom trigger tag..."
                        className="flex-1 rounded-xl px-3 py-1.5 text-xs text-warm outline-none bg-[#FCF8F4] border border-[#F6C945]/40"
                      />
                      <button 
                        type="button"
                        onClick={addCustomTrigger}
                        className="px-3.5 py-1.5 bg-[#F6C945] text-[#3E3006] text-xs font-bold rounded-xl hover:opacity-90 shadow-sm"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full gradient-cta text-on-primary font-bold rounded-full py-2.5 sm:py-3 flex items-center justify-center gap-2 shadow-suncast hover:shadow-glow hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40 text-xs sm:text-sm mt-3"
                >
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  {submitting ? 'Submitting…' : 'Submit Strategy for Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Strategy Detail Modal ── */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(93,64,55,0.45)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedCard(null) }}
        >
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-lift animate-scaleIn relative overflow-hidden flex flex-col max-h-[85vh]">
            <div className="absolute top-0 inset-x-0 h-1.5 rounded-t-3xl gradient-cta" />

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-7 pt-6 pb-3">
              <div className="flex items-center gap-2.5">
                <CategoryBadge category={selectedCard.category} />
                {selectedCard.matchScore && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#F6C945]/20 text-[#6B5A10] border border-[#F6C945]/30">
                    <Sparkles size={11} />
                    {selectedCard.matchScore}% Match
                  </span>
                )}
              </div>
              <button 
                onClick={() => setSelectedCard(null)}
                className="w-8 h-8 rounded-xl bg-[#fbf7f4] flex items-center justify-center text-warm/40 hover:text-warm transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="overflow-y-auto px-5 sm:px-7 pb-6 flex-1 space-y-4">
              <h2 className="font-jakarta font-extrabold text-warm text-lg sm:text-xl leading-snug">
                {selectedCard.title}
              </h2>

              {/* Match reasons */}
              {Array.isArray(selectedCard.matchReasons) && selectedCard.matchReasons.length > 0 && (
                <div className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#F6C945]/30 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#856804] flex items-center gap-1">
                    <Target size={12} /> Why this matches your context
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {selectedCard.matchReasons.map((r, ri) => (
                      <span key={ri} className="text-xs font-semibold text-[#5D4037] bg-white px-2.5 py-0.5 rounded-lg border border-[#AA8E7E]/15 flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-green-700" />
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="bg-[#fbf7f4] rounded-2xl p-4 border border-warm/5">
                <p className="text-xs sm:text-sm text-warm/80 leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedCard.description}
                </p>
              </div>

              {/* Trigger tags */}
              {Array.isArray(selectedCard.trigger_tags) && selectedCard.trigger_tags.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-warm/40 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Tag size={11} /> Recommended For Triggers
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCard.trigger_tags.map(t => (
                      <span 
                        key={t} 
                        className="text-[11px] font-bold rounded-full px-2.5 py-0.5"
                        style={{ background: 'var(--color-secondary-container)', color: 'var(--color-secondary)' }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="px-5 sm:px-7 py-3.5 border-t border-warm/10 flex items-center justify-between bg-surface-low/30">
              <span className="text-[11px] text-warm/40 font-medium">Shared anonymously</span>
              
              <div className="flex items-center gap-2">
                {/* Bookmark */}
                <button
                  onClick={() => {
                    handleBookmark(selectedCard.id)
                    setSelectedCard(s => ({ ...s, _isFav: !s._isFav }))
                  }}
                  disabled={bookmarking === selectedCard.id}
                  title={selectedCard._isFav ? 'Remove bookmark' : 'Bookmark'}
                  className={`p-2 rounded-full transition-all ${
                    selectedCard._isFav ? 'text-[#755b00] bg-[#f6c945]/20' : 'text-warm/40 hover:text-[#755b00] hover:bg-[#f6c945]/10'
                  }`}
                >
                  {bookmarking === selectedCard.id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Bookmark size={15} fill={selectedCard._isFav ? 'currentColor' : 'none'} />
                  )}
                </button>

                {/* Like */}
                {!selectedCard._hideLike && (
                  <button
                    onClick={() => {
                      handleVote(selectedCard.id)
                      setSelectedCard(prev => {
                        const voting = !prev.i_voted;
                        return { 
                          ...prev, 
                          i_voted: voting ? 1 : 0, 
                          helpful_count: voting ? prev.helpful_count + 1 : Math.max(0, prev.helpful_count - 1) 
                        }
                      })
                    }}
                    disabled={voting === selectedCard.id}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all ${
                      selectedCard.i_voted ? 'bg-red-100 text-red-500 shadow-sm' : 'text-warm/40 hover:bg-red-50 hover:text-red-400'
                    }`}
                  >
                    {voting === selectedCard.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Heart size={13} fill={selectedCard.i_voted ? 'currentColor' : 'none'} />
                    )}
                    <span>{selectedCard.helpful_count}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Compact & Structured Strategy Card ───────────────────────
function StrategyCard({ s, i, isFav, onVote, onBookmark, voting, bookmarking, hideLike, onOpen }) {
  return (
    <div
      className="h-full flex flex-col justify-between bg-white rounded-2xl p-4 shadow-suncast border border-[#AA8E7E]/10 hover:shadow-lift hover:border-[#F6C945]/40 transition-all duration-200 cursor-pointer group"
      onClick={() => onOpen({ ...s, _isFav: isFav, _hideLike: hideLike })}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          <CategoryBadge category={s.category} size="xs" />
          {s.matchScore && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#F6C945]/20 text-[#6B5A10] border border-[#F6C945]/30">
              <Sparkles size={10} />
              {s.matchScore}% Match
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-jakarta font-bold text-warm text-sm sm:text-base leading-snug group-hover:text-[#755b00] transition-colors line-clamp-1 mb-1">
          {s.title}
        </h3>

        {/* Clamped Description */}
        <p className="text-xs text-warm/70 leading-relaxed line-clamp-2 font-medium mb-2.5">
          {s.description}
        </p>

        {/* Reasons or Trigger Tags Preview */}
        {Array.isArray(s.matchReasons) && s.matchReasons.length > 0 ? (
          <div className="flex flex-wrap gap-1 mb-1">
            {s.matchReasons.slice(0, 1).map((r, ri) => (
              <span key={ri} className="text-[10px] font-semibold text-[#5D4037]/80 bg-[#FDF9F2] px-2 py-0.5 rounded-md border border-[#AA8E7E]/10 flex items-center gap-1">
                <CheckCircle2 size={10} className="text-green-700" />
                <span className="truncate max-w-[200px]">{r}</span>
              </span>
            ))}
          </div>
        ) : (
          (() => {
            const tags = Array.isArray(s.trigger_tags) ? s.trigger_tags : []
            return tags.length > 0 ? (
              <div className="flex flex-wrap gap-1 mb-1">
                {tags.slice(0, 2).map(t => (
                  <span 
                    key={t} 
                    className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                    style={{ background: 'var(--color-secondary-container)', color: 'var(--color-secondary)' }}
                  >
                    #{t}
                  </span>
                ))}
                {tags.length > 2 && (
                  <span className="text-[10px] text-warm/40 font-semibold px-1 py-0.5">
                    +{tags.length - 2}
                  </span>
                )}
              </div>
            ) : null
          })()
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-3 pt-2.5 border-t border-warm/10 flex items-center justify-between">
        <span className="text-[11px] font-bold text-warm/45 group-hover:text-[#755b00] group-hover:translate-x-0.5 transition-all flex items-center gap-1">
          Read details <ChevronRight size={12} className="opacity-60 group-hover:opacity-100" />
        </span>
        
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {/* Bookmark */}
          <button 
            onClick={() => onBookmark(s.id)} 
            disabled={bookmarking === s.id}
            title={isFav ? 'Remove from favorites' : 'Save to favorites'}
            className={`p-1.5 rounded-full transition-all ${
              isFav ? 'text-[#755b00] bg-[#f6c945]/20' : 'text-warm/35 hover:text-[#755b00] hover:bg-[#f6c945]/10'
            }`}
          >
            {bookmarking === s.id
              ? <Loader2 size={13} className="animate-spin" />
              : <Bookmark size={13} fill={isFav ? 'currentColor' : 'none'} />}
          </button>

          {/* Like */}
          {!hideLike && (
            <button 
              onClick={() => onVote(s.id)} 
              disabled={voting === s.id}
              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
                s.i_voted ? 'bg-red-100 text-red-500 shadow-sm' : 'text-warm/40 hover:bg-red-50 hover:text-red-400'
              }`}
            >
              {voting === s.id ? <Loader2 size={11} className="animate-spin" /> : <Heart size={11} fill={s.i_voted ? 'currentColor' : 'none'} />}
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
    <div className="text-center py-12 px-4 bg-white/60 rounded-2xl border border-warm/10 shadow-suncast">
      <p className="text-4xl mb-2">{emoji}</p>
      <p className="font-jakarta font-bold text-warm text-base mb-0.5">{title}</p>
      <p className="text-xs text-warm/50 max-w-sm mx-auto">{sub}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      <Loader2 size={26} className="animate-spin text-[#755b00]" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-warm/40">Loading insights…</p>
    </div>
  )
}
