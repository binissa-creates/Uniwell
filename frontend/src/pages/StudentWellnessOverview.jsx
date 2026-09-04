import { useState, useEffect, useCallback, useMemo } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { Loader2, ShieldAlert } from 'lucide-react'
import StudentListTable from '../components/StudentListTable'
import ProgramDetailModal from '../components/ProgramDetailModal'
import { normalizeCourse } from '../lib/data'
import { ACADEMIC_PROGRAMS, academicDepartmentSortIndex, academicProgramSortIndex, departmentForProgram } from '../lib/academicPrograms'

const WARM_DARK = '#3a2b25'
const WARM_OLIVE = '#6B5A10'

const REPORTING_DAYS = 90

const MOOD_SCORE = {
  rad: 5, good: 4, meh: 3, bad: 2, awful: 1,
  excited: 5, hopeful: 4, grateful: 5, calm: 4, content: 4, proud: 5,
  nervous: 2, frustrated: 2, lonely: 2, angry: 1, burned_out: 1, confused: 2,
}

const MOOD_META = {
  rad:        { emoji: '🤩', label: 'Radiant' },
  good:       { emoji: '😊', label: 'Good' },
  meh:        { emoji: '😐', label: 'Meh' },
  bad:        { emoji: '😔', label: 'Bad' },
  awful:      { emoji: '😢', label: 'Awful' },
  excited:    { emoji: '😆', label: 'Excited' },
  hopeful:    { emoji: '🌟', label: 'Hopeful' },
  grateful:   { emoji: '🙏', label: 'Grateful' },
  calm:       { emoji: '😌', label: 'Calm' },
  content:    { emoji: '🥰', label: 'Content' },
  nervous:    { emoji: '😰', label: 'Nervous' },
  frustrated: { emoji: '😤', label: 'Frustrated' },
  lonely:     { emoji: '🥺', label: 'Lonely' },
  angry:      { emoji: '😠', label: 'Angry' },
  burned_out: { emoji: '🥱', label: 'Burnt' },
  confused:   { emoji: '😕', label: 'Confused' },
  proud:      { emoji: '💪', label: 'Proud' },
}

export default function StudentWellnessOverview() {
  const [profiles, setProfiles] = useState([])
  const [logs, setLogs] = useState([])
  const [sharedJournalsByUser, setSharedJournalsByUser] = useState({})
  const [loading, setLoading] = useState(true)

  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [yearFilter, setYearFilter] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const since = new Date(Date.now() - REPORTING_DAYS * 86400000).toISOString()
      const [p, m, j] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, student_id, course, year_level, created_at')
          .eq('role', 'student'),
        supabase
          .from('mood_logs')
          .select('id, user_id, mood_type, intensity, note, logged_at, mood_triggers(trigger_category)')
          .gte('logged_at', since)
          .order('logged_at', { ascending: false }),
        supabase
          .from('journal_entries')
          .select('user_id, id, content, prompt, created_at')
          .eq('shared_with_guidance', true)
          .order('created_at', { ascending: false }),
      ])

      if (p.error) throw p.error
      if (m.error) throw m.error
      // j.error is soft — journals may not exist yet
      const sharedJournals = j.error ? [] : (j.data || [])

      setProfiles(p.data || [])
      setLogs((m.data || []).map(row => ({
        ...row,
        triggers: (row.mood_triggers || []).map(t => t.trigger_category)
      })))
      // Store shared journals keyed by user_id for easy lookup
      const journalByUser = {}
      sharedJournals.forEach(entry => {
        if (!journalByUser[entry.user_id]) journalByUser[entry.user_id] = []
        journalByUser[entry.user_id].push(entry)
      })
      setSharedJournalsByUser(journalByUser)
    } catch (err) {
      console.error('[wellness monitor]', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { window.scrollTo(0, 0) }, [])

  // Build per-user stats including full emotion tallies
  const userStats = useMemo(() => {
    const map = {}
    for (const l of logs) {
      if (!map[l.user_id]) {
        map[l.user_id] = { count: 0, totalScore: 0, last: null, recent: [], emotionTally: {}, moodEntries: [] }
      }
      const u = map[l.user_id]
      u.count++
      u.totalScore += MOOD_SCORE[l.mood_type] || 3
      u.recent.push(l)
      u.moodEntries.push(l)
      u.emotionTally[l.mood_type] = (u.emotionTally[l.mood_type] || 0) + 1
      if (!u.last || new Date(l.logged_at) > new Date(u.last)) {
        u.last = l.logged_at
      }
    }
    return map
  }, [logs])

  // Compute group-level emotion tallies
  const groupStats = useMemo(() => {
    const groups = {}

    const createBucket = (id, course, year = null) => ({
      id, course, year,
      totalStudents: 0,
      activeCount: 0,
      totalMoodEntries: 0,
      lowMoodEntriesCount: 0,
      criticalCount: 0,
      emotionTally: {},
      students: [], // full student records with mood entries
    })

    const LOW_KEYS = ['awful', 'bad', 'angry', 'burned_out', 'lonely', 'frustrated', 'nervous', 'confused']
    const CRITICAL_KEYS = ['awful', 'bad']

    for (const p of profiles) {
      const c = normalizeCourse(p.course || 'General')
      const y = p.year_level || 1
      const key = c

      if (!groups[key]) {
        groups[key] = createBucket(key, c)
        groups[key].yearStats = {}
      }

      const g = groups[key]
      if (!g.yearStats[y]) g.yearStats[y] = createBucket(`${key}|${y}`, c, y)
      const buckets = [g, g.yearStats[y]]

      buckets.forEach(b => b.totalStudents++)

      const stats = userStats[p.id]
      const nameParts = (p.name || '').split(' ')
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : p.name || 'Unknown'

      const studentLowMoodEntries = (stats?.moodEntries || []).filter(l => LOW_KEYS.includes(l.mood_type))
      const studentCriticalEntries = (stats?.moodEntries || []).filter(l => CRITICAL_KEYS.includes(l.mood_type))

      const studentRecord = {
        id: p.student_id,
        name: lastName,
        fullName: p.name || 'Unknown',
        course: c,
        year: y,
        moodEntries: stats?.moodEntries || [],
        emotionTally: stats?.emotionTally || {},
        lastLogged: stats?.last || null,
        logCount: stats?.count || 0,
        lowMoodCount: studentLowMoodEntries.length,
        criticalCount: studentCriticalEntries.length,
        sharedJournals: sharedJournalsByUser[p.id] || [],
      }

      buckets.forEach(b => {
        b.students.push(studentRecord)
        b.totalMoodEntries += studentRecord.logCount
        b.lowMoodEntriesCount += studentLowMoodEntries.length
        b.criticalCount += studentCriticalEntries.length
      })

      if (stats) {
        const weekAgo = Date.now() - 7 * 86400000
        buckets.forEach(b => {
          if (stats.last && new Date(stats.last).getTime() > weekAgo) b.activeCount++
          // Merge emotion tallies
          for (const [emotion, cnt] of Object.entries(stats.emotionTally)) {
            b.emotionTally[emotion] = (b.emotionTally[emotion] || 0) + cnt
          }
        })
      }
    }

    // Derive topEmotion (top 3 emotions) for each bucket
    const finishBucket = bucket => {
      const tallySorted = Object.entries(bucket.emotionTally)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key, count]) => ({
          key,
          count,
          emoji: MOOD_META[key]?.emoji || '😶',
          label: MOOD_META[key]?.label || key,
        }))
      return {
        ...bucket,
        topEmotion: tallySorted.length > 0 ? tallySorted : null,
        totalAlerts: bucket.lowMoodEntriesCount,
      }
    }

    return Object.values(groups).map(g => ({
      ...finishBucket(g),
      yearStats: Object.fromEntries(Object.entries(g.yearStats).map(([year, bucket]) => [year, finishBucket(bucket)])),
    })).sort((a, b) =>
      academicDepartmentSortIndex(a.course) - academicDepartmentSortIndex(b.course) ||
      academicProgramSortIndex(a.course) - academicProgramSortIndex(b.course) ||
      a.year - b.year
    )
  }, [profiles, userStats])

  const courses = useMemo(() => {
    const existing = new Set(profiles.map(p => normalizeCourse(p.course)).filter(Boolean))
    return ACADEMIC_PROGRAMS.filter(p => existing.has(p))
      .concat(Array.from(existing).filter(p => !ACADEMIC_PROGRAMS.includes(p)).sort())
  }, [profiles])

  const filteredGroups = useMemo(() => {
    return groupStats.filter(g => {
      if (departmentFilter && departmentForProgram(g.course)?.name !== departmentFilter) return false
      if (courseFilter && g.course !== courseFilter) return false
      if (search && !g.course.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }).map(g => yearFilter ? g.yearStats[yearFilter] : g)
      .filter(Boolean)
  }, [groupStats, search, departmentFilter, courseFilter, yearFilter])

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDF9F2] flex items-center justify-center p-6">
        <div className="bg-white rounded-[2rem] p-10 shadow-lift text-center max-w-md">
          <ShieldAlert className="mx-auto mb-4 text-coral" size={48} />
          <h2 className="text-xl font-black mb-2">Something went wrong</h2>
          <p className="text-sm text-warm/60 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-gold rounded-xl font-black text-xs uppercase tracking-widest">Reload Page</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF9F2] relative overflow-x-hidden">
      <div className="fixed top-0 right-0 w-[50rem] h-[50rem] rounded-full bg-[#EF7B6C]/5 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-warm/20" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: WARM_OLIVE }}>
              Admin Hub · Campus Health
            </p>
          </div>
          <h1 className="font-jakarta text-5xl font-extrabold mb-4" style={{ color: WARM_DARK }}>
            Wellness <span className="font-playfair italic font-bold" style={{ color: WARM_OLIVE }}>Monitor</span>
          </h1>
          <p className="text-lg max-w-2xl leading-relaxed font-medium text-warm/60">
            Search by department, program, or year level to view student wellness data. Select a program to view individual student emotion entries.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin mb-4 text-gold" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-warm/40">Aggregating Campus Data</p>
          </div>
        ) : (
          <div className="mt-8">
            <StudentListTable
              groups={filteredGroups}
              courses={courses}
              search={search}
              setSearch={setSearch}
              departmentFilter={departmentFilter}
              setDepartmentFilter={v => { setDepartmentFilter(v); setCourseFilter('') }}
              courseFilter={courseFilter}
              setCourseFilter={setCourseFilter}
              yearFilter={yearFilter}
              setYearFilter={setYearFilter}
              onSelect={setSelectedGroup}
            />
          </div>
        )}
      </main>

      <ProgramDetailModal
        group={selectedGroup}
        onClose={() => setSelectedGroup(null)}
        moodMeta={MOOD_META}
      />
    </div>
  )
}
