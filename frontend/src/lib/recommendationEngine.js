import { supabase } from './supabase'

// Category affinities mapped to emotional mood states
const MOOD_CATEGORY_AFFINITIES = {
  burned_out: ['Relaxation', 'Time Management', 'Mindfulness'],
  tired: ['Relaxation', 'Mindfulness'],
  awful: ['Relaxation', 'Mindfulness', 'Social Support'],
  bad: ['Relaxation', 'Mindfulness', 'Physical Activity'],
  nervous: ['Mindfulness', 'Relaxation', 'Physical Activity'],
  frustrated: ['Physical Activity', 'Creative Expression', 'Mindfulness'],
  angry: ['Physical Activity', 'Creative Expression'],
  lonely: ['Social Support', 'Creative Expression'],
  confused: ['Mindfulness', 'Time Management'],
  meh: ['Physical Activity', 'Creative Expression', 'Time Management'],
  rad: ['Creative Expression', 'Personal Growth', 'Social Support'],
  good: ['Personal Growth', 'Creative Expression', 'Mindfulness'],
  excited: ['Creative Expression', 'Social Support', 'Personal Growth'],
  hopeful: ['Personal Growth', 'Mindfulness'],
  grateful: ['Mindfulness', 'Social Support'],
  calm: ['Mindfulness', 'Relaxation'],
  content: ['Mindfulness', 'Personal Growth'],
  proud: ['Personal Growth', 'Creative Expression']
}

// Common emotional & student thematic keywords to extract from journal entries
const THEME_KEYWORDS = [
  'exam', 'exams', 'study', 'studying', 'grade', 'grades', 'class', 'classes', 'homework', 'assignment', 'deadline', 'professor', 'school', 'academics',
  'sleep', 'tired', 'exhausted', 'rest', 'insomnia', 'burnout', 'burned out', 'overwhelmed', 'stress', 'stressed', 'anxiety', 'anxious', 'panic',
  'friend', 'friends', 'roommate', 'family', 'parent', 'parents', 'relationship', 'lonely', 'alone', 'isolate', 'isolated', 'talk',
  'money', 'tuition', 'finance', 'budget', 'work', 'job',
  'breathe', 'breath', 'walk', 'exercise', 'gym', 'art', 'draw', 'music', 'write', 'gratitude', 'peace', 'calm', 'focus'
]

/**
 * Extracts relevant keywords present in text.
 */
function extractKeywords(text = '') {
  if (!text) return []
  const lower = text.toLowerCase()
  return THEME_KEYWORDS.filter(kw => lower.includes(kw))
}

/**
 * Computes personalized coping strategy recommendations for a user.
 */
export async function getPersonalizedRecommendations(userId) {
  if (!userId) return null

  try {
    const msIn14Days = 14 * 24 * 60 * 60 * 1000
    const since14Days = new Date(Date.now() - msIn14Days).toISOString()

    // 1. Fetch user's recent mood logs, triggers, and journal entries in parallel
    const [moodsRes, journalsRes, strategiesRes, votesRes, favsRes] = await Promise.all([
      supabase
        .from('mood_logs')
        .select('id, mood_type, intensity, note, logged_at, mood_triggers(trigger_category)')
        .eq('user_id', userId)
        .gte('logged_at', since14Days)
        .order('logged_at', { ascending: false }),
      supabase
        .from('journal_entries')
        .select('id, content, prompt, created_at')
        .eq('user_id', userId)
        .gte('created_at', since14Days)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('coping_strategies')
        .select('id, category, title, description, trigger_tags, helpful_count, created_at')
        .eq('status', 'approved')
        .order('helpful_count', { ascending: false }),
      supabase
        .from('helpful_votes')
        .select('strategy_id')
        .eq('user_id', userId),
      supabase
        .from('strategy_favorites')
        .select('strategy_id')
        .eq('user_id', userId)
    ])

    const recentMoods = moodsRes.data || []
    const recentJournals = journalsRes.data || []
    const allStrategies = strategiesRes.data || []
    const votedIds = new Set((votesRes.data || []).map(v => v.strategy_id))
    const favIds = new Set((favsRes.data || []).map(f => f.strategy_id))

    // 2. Synthesize User Context Profile
    // Extract triggers with count
    const triggerCounts = {}
    recentMoods.forEach(m => {
      (m.mood_triggers || []).forEach(t => {
        const cat = t.trigger_category
        if (cat) triggerCounts[cat] = (triggerCounts[cat] || 0) + 1
      })
    })

    const topUserTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])

    // Dominant recent mood
    const moodCounts = {}
    recentMoods.forEach(m => {
      if (m.mood_type) moodCounts[m.mood_type] = (moodCounts[m.mood_type] || 0) + 1
    })

    const topMoods = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])

    const primaryMood = topMoods[0] || (recentMoods[0]?.mood_type || 'meh')

    // Extract journal keywords
    const journalTextAggregate = recentJournals
      .map(j => `${j.prompt || ''} ${j.content || ''}`)
      .join(' ')
    const userJournalKeywords = Array.from(new Set(extractKeywords(journalTextAggregate)))

    const hasUserData = recentMoods.length > 0 || recentJournals.length > 0

    // Preferred categories based on mood
    const preferredCategories = MOOD_CATEGORY_AFFINITIES[primaryMood] || ['Mindfulness', 'Relaxation']

    // 3. Score every strategy
    const scoredStrategies = allStrategies.map(strategy => {
      let score = 50 // baseline score
      const matchReasons = []

      const stratTriggers = Array.isArray(strategy.trigger_tags) ? strategy.trigger_tags : []
      const stratText = `${strategy.title} ${strategy.description}`.toLowerCase()

      // A. Trigger Matching (up to 30 pts)
      const matchedTriggers = stratTriggers.filter(t => topUserTriggers.includes(t))
      if (matchedTriggers.length > 0) {
        const triggerPoints = Math.min(30, matchedTriggers.length * 15)
        score += triggerPoints
        matchReasons.push(`Matches trigger #${matchedTriggers[0]}`)
      }

      // B. Mood Category Affinity (up to 25 pts)
      if (preferredCategories.includes(strategy.category)) {
        score += 25
        const moodName = primaryMood.replace('_', ' ')
        matchReasons.push(`Supports your recent ${moodName} state`)
      }

      // C. Journal Keyword Overlap (up to 20 pts)
      const matchedKeywords = userJournalKeywords.filter(kw => stratText.includes(kw))
      if (matchedKeywords.length > 0) {
        const kwPoints = Math.min(20, matchedKeywords.length * 10)
        score += kwPoints
        matchReasons.push(`Relates to '${matchedKeywords[0]}' in journal`)
      }

      // D. Community Helpfulness Boost (up to 10 pts)
      const helpfulBoost = Math.min(10, Math.floor((strategy.helpful_count || 0) / 2))
      score += helpfulBoost

      // Normalize score between 60% and 98%
      const matchScore = Math.min(99, Math.max(65, Math.round(score)))

      // Fallback reason if none triggered
      if (matchReasons.length === 0) {
        matchReasons.push(`Top-rated in ${strategy.category}`)
      }

      return {
        ...strategy,
        matchScore,
        matchReasons: matchReasons.slice(0, 3),
        i_voted: votedIds.has(strategy.id) ? 1 : 0,
        is_fav: favIds.has(strategy.id)
      }
    })

    // Sort descending by match score, then helpful count
    scoredStrategies.sort((a, b) => b.matchScore - a.matchScore || b.helpful_count - a.helpful_count)

    const topRecommendation = scoredStrategies[0] || null
    const otherRecommendations = scoredStrategies.slice(1)

    // Build friendly context string
    let contextSummary = 'Personalized for your overall wellness and community wisdom'
    if (topUserTriggers.length > 0 && primaryMood) {
      contextSummary = `Tuned for your recent #${topUserTriggers[0]} check-ins & ${primaryMood.replace('_', ' ')} state`
    } else if (topUserTriggers.length > 0) {
      contextSummary = `Tuned for your recent #${topUserTriggers.slice(0, 2).join(' and #')} check-ins`
    } else if (primaryMood) {
      contextSummary = `Tuned for your recent ${primaryMood.replace('_', ' ')} feelings`
    }

    return {
      hasUserData,
      context: {
        primaryMood,
        topTriggers: topUserTriggers.slice(0, 3),
        journalKeywords: userJournalKeywords.slice(0, 4),
        summary: contextSummary
      },
      topRecommendation,
      recommendations: scoredStrategies,
      totalCount: scoredStrategies.length
    }
  } catch (err) {
    console.error('[getPersonalizedRecommendations error]', err)
    return null
  }
}
