import { useState, useEffect, useCallback, useMemo } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { Loader2, Users, ShieldAlert } from 'lucide-react'
import StudentListTable from '../components/StudentListTable'
import ProgramDetailModal from '../components/ProgramDetailModal'

const WARM_DARK = '#3a2b25'
const WARM_OLIVE = '#6B5A10'
const WARM_TAN = '#AA8E7E'

const MOOD_SCORE = { rad: 5, good: 4, meh: 3, bad: 2, awful: 1 }

export default function StudentWellnessOverview() {
  const [profiles, setProfiles] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [yearFilter, setYearFilter] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, m] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, student_id, course, year_level, created_at')
          .eq('role', 'student'),
        supabase
          .from('mood_logs')
          .select('user_id, mood_type, intensity, logged_at')
          .order('logged_at', { ascending: false }),
      ])
      
      if (p.error) throw p.error
      if (m.error) throw m.error

      setProfiles(p.data || [])
      setLogs(m.data || [])
    } catch (err) {
      console.error('[wellness monitor]', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Grouped Data Logic (Anonymized)
  const groupStats = useMemo(() => {
    const groups = {}
    
    // Process logs to get per-user stats
    const userStats = {}
    for (const l of logs) {
      if (!userStats[l.user_id]) {
        userStats[l.user_id] = { count: 0, totalScore: 0, last: null, recent: [] }
      }
      userStats[l.user_id].count++
      userStats[l.user_id].totalScore += MOOD_SCORE[l.mood_type] || 3
      userStats[l.user_id].recent.push(l)
      if (!userStats[l.user_id].last || new Date(l.logged_at) > new Date(userStats[l.user_id].last)) {
        userStats[l.user_id].last = l.logged_at
      }
    }

    // Process profiles into groups
    for (const p of profiles) {
      const c = p.course || 'General'
      const y = p.year_level || 1
      const key = `${c}|${y}`
      
      if (!groups[key]) {
        groups[key] = {
          id: key,
          course: c,
          year: y,
          totalStudents: 0,
          avgMood: 0,
          moodCount: 0,
          activeCount: 0,
          alerts: { silent: 0, streak: 0, lowAvg: 0 },
          alertStudents: [] // Detailed but semi-anonymized (ID only)
        }
      }
      
      const g = groups[key]
      g.totalStudents++
      
      const stats = userStats[p.id]
      if (stats) {
        if (stats.count > 0) {
          g.avgMood += stats.totalScore / stats.count
          g.moodCount++
        }
        
        const weekAgo = Date.now() - 7 * 86400000
        if (stats.last && new Date(stats.last).getTime() > weekAgo) {
          g.activeCount++
        }

        const silent = !stats.last || (Date.now() - new Date(stats.last).getTime()) > 7 * 86400000
        const avg = stats.count >= 3 ? stats.totalScore / stats.count : null
        const streak = stats.recent.slice(0, 3).length === 3 && stats.recent.slice(0, 3).every(l => (MOOD_SCORE[l.mood_type] || 3) <= 2)

        if (streak) {
            g.alerts.streak++
            g.alertStudents.push({ id: p.student_id, kind: 'Critical Streak', score: avg?.toFixed(1) || '—' })
        } else if (avg !== null && avg < 2.5) {
            g.alerts.lowAvg++
            g.alertStudents.push({ id: p.student_id, kind: 'Low Trend', score: avg.toFixed(1) })
        } else if (silent) {
            g.alerts.silent++
            g.alertStudents.push({ id: p.student_id, kind: 'Silent', score: avg?.toFixed(1) || '—' })
        }
      } else {
        g.alerts.silent++
        g.alertStudents.push({ id: p.student_id, kind: 'Silent', score: '—' })
      }
    }

    return Object.values(groups).map(g => ({
      ...g,
      avgMood: g.moodCount > 0 ? (g.avgMood / g.moodCount).toFixed(1) : '—',
      totalAlerts: g.alerts.streak + g.alerts.lowAvg + g.alerts.silent
    })).sort((a, b) => b.totalAlerts - a.totalAlerts)
  }, [profiles, logs])

  const courses = useMemo(() => {
    const set = new Set(profiles.map(p => p.course).filter(Boolean))
    return Array.from(set).sort()
  }, [profiles])

  const filteredGroups = useMemo(() => {
    return groupStats.filter(g => {
      if (courseFilter && g.course !== courseFilter) return false
      if (yearFilter && g.year !== yearFilter) return false
      if (search && !g.course.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [groupStats, search, courseFilter, yearFilter])

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
            A high-level overview of campus emotional health. Monitor trends by program and year level to identify areas needing support.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin mb-4 text-gold" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-warm/40">Aggregating Campus Data</p>
          </div>
        ) : (
          <>
            <div className="mt-8">
              <StudentListTable 
                groups={filteredGroups}
                courses={courses}
                search={search}
                setSearch={setSearch}
                courseFilter={courseFilter}
                setCourseFilter={setCourseFilter}
                yearFilter={yearFilter}
                setYearFilter={setYearFilter}
                onSelect={setSelectedGroup}
              />
            </div>
          </>
        )}
      </main>

      <ProgramDetailModal 
        group={selectedGroup} 
        onClose={() => setSelectedGroup(null)} 
      />
    </div>
  )
}
