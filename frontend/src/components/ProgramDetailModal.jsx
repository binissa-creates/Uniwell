import { useState } from 'react'
import { X, Users, AlertTriangle, Moon, CloudRain, BellRing, ChevronDown, ChevronLeft, BookOpen, Heart } from 'lucide-react'

const WARM_DARK = '#3a2b25'
const WARM_TAN = '#AA8E7E'
const CORAL = '#EF7B6C'
const GOLD = '#E6B86A'
const LAVENDER = '#9C8EC1'
const SAGE = '#81B29A'

export default function ProgramDetailModal({ group, onClose, moodMeta = {} }) {
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [activeTab, setActiveTab] = useState('moods') // 'moods' | 'journals'

  if (!group) return null

  const handleStudentClose = () => setSelectedStudent(null)
  const handleStudentSelect = (student) => {
    setSelectedStudent(student)
    setActiveTab('moods')
  }

  // Emotion tally sorted by count (top 6 for display)
  const sortedEmotions = Object.entries(group.emotionTally || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, count]) => ({
      key,
      count,
      emoji: moodMeta[key]?.emoji || '😶',
      label: moodMeta[key]?.label || key,
    }))

  const totalEmotionEntries = sortedEmotions.reduce((s, e) => s + e.count, 0)

  // Categorize low/difficult mood entries directly from real logs
  const awfulAndBadCount = (group.emotionTally?.awful || 0) + (group.emotionTally?.bad || 0)
  const stressCount = (group.emotionTally?.burned_out || 0) + (group.emotionTally?.frustrated || 0) + (group.emotionTally?.nervous || 0)
  const distressCount = (group.emotionTally?.lonely || 0) + (group.emotionTally?.angry || 0) + (group.emotionTally?.confused || 0)
  const lowMoodCount = awfulAndBadCount + stressCount + distressCount

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#3a2b25]/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#FDF9F2] rounded-[3rem] w-full max-w-2xl shadow-lift animate-scaleIn relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-2 bg-gold" />

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
              <Users size={22} />
            </div>
            <div>
              <h2 className="font-jakarta font-black text-xl" style={{ color: WARM_DARK }}>{group.course}</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-warm/40 mt-0.5">
                {group.year ? `Year ${group.year}` : 'All Year Levels'} · Mood Chronicle Summary
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-warm/20 hover:text-warm/60 transition-colors shadow-sm">
            <X size={22} />
          </button>
        </div>

        <div className="px-8 pb-8 overflow-y-auto custom-scrollbar flex-1">

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard label="Total Students" value={group.totalStudents} sub="Enrolled" />
            <StatCard label="Mood Entries" value={totalEmotionEntries} sub="Total logged" />
            <StatCard label="Low Mood Logs" value={lowMoodCount} sub="Awful / bad / stressed" highlight={lowMoodCount > 0} />
          </div>

          {/* Emotion Tally */}
          <div className="mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: WARM_TAN }}>
              <Heart size={12} className="text-coral" />
              Reported Mood Entries ({totalEmotionEntries} total)
            </h3>
            {sortedEmotions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sortedEmotions.map(em => {
                  return (
                    <div key={em.key} className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-warm/10 shadow-sm">
                      <span className="text-xl">{em.emoji}</span>
                      <div>
                        <div className="text-xs font-bold" style={{ color: WARM_DARK }}>{em.label}</div>
                        <div className="text-[10px] font-semibold text-warm/50">{em.count} {em.count === 1 ? 'entry' : 'entries'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm italic text-warm/30">No mood entries logged in the last 90 days.</p>
            )}
          </div>

          {/* Low Mood Breakdown */}
          <div className="mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: WARM_TAN }}>
              <AlertTriangle size={12} className="text-coral" />
              Low Mood & At-Risk Entries
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <RiskItem
                icon={AlertTriangle}
                color={CORAL}
                label="Rough & Awful"
                count={awfulAndBadCount}
                description="Awful 😢 & Bad 😔 entries"
              />
              <RiskItem
                icon={CloudRain}
                color={GOLD}
                label="Stress & Burnt Out"
                count={stressCount}
                description="Burnt out 🥱, Frustrated 😤, Nervous 😰"
              />
              <RiskItem
                icon={Moon}
                color={LAVENDER}
                label="Distress & Lonely"
                count={distressCount}
                description="Lonely 🥺, Angry 😠, Confused 😕"
              />
            </div>
          </div>

          {/* Student List */}
          <div className="bg-white rounded-[2rem] border border-warm/5">
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: WARM_TAN }}>
                All Students ({group.students?.length || 0})
              </h3>
              <span className="text-[9px] text-warm/40">Click a student to view mood history</span>
            </div>

            {(!group.students || group.students.length === 0) ? (
              <p className="px-6 py-8 text-sm italic text-warm/30">No students in this group.</p>
            ) : (
              <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-warm/5">
                {group.students.map((s, i) => {
                  const studentLowCount = s.moodEntries?.filter(m =>
                    ['awful', 'bad', 'angry', 'burned_out', 'lonely', 'frustrated', 'nervous', 'confused'].includes(m.mood_type)
                  ).length || 0

                  const hasCritical = s.moodEntries?.some(m => ['awful', 'bad'].includes(m.mood_type))
                  const topEm = Object.entries(s.emotionTally || {}).sort((a, b) => b[1] - a[1])[0]

                  return (
                    <div
                      key={i}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleStudentSelect(s)}
                      onKeyDown={e => { if (e.key === 'Enter') handleStudentSelect(s) }}
                      className="flex items-center justify-between px-6 py-3.5 hover:bg-[#FDF9F2] cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#FDF9F2] flex items-center justify-center text-lg">
                          {topEm ? (moodMeta[topEm[0]]?.emoji || '😶') : '—'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: WARM_DARK }}>{s.name}</span>
                            <span className="text-[10px] text-warm/40 font-medium">({s.id})</span>
                            {studentLowCount > 0 && (
                              <span
                                className="text-[9px] font-black px-2 py-0.5 rounded-full"
                                style={{
                                  background: hasCritical ? '#FEE9E7' : '#FDF3E3',
                                  color: hasCritical ? CORAL : GOLD
                                }}
                              >
                                {studentLowCount} low {studentLowCount === 1 ? 'mood' : 'moods'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-warm/40">
                            {s.logCount} {s.logCount === 1 ? 'entry' : 'entries'} ·{' '}
                            {s.lastLogged ? new Date(s.lastLogged).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No entries'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-warm/25 group-hover:text-warm/60 transition-colors">View →</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-8 py-5 bg-white border-t border-warm/5 flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: WARM_TAN }}>Action</p>
            <p className="text-xs font-bold text-warm/60">Notify guidance staff for this group</p>
          </div>
          <button className="flex items-center gap-3 px-7 py-3.5 bg-gold rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-glow hover:scale-105 transition-transform active:scale-95">
            <BellRing size={15} />
            Dispatch Support
          </button>
        </div>
      </div>

      {/* Student Detail Sub-Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={handleStudentClose}
          moodMeta={moodMeta}
        />
      )}
    </div>
  )
}

function StudentDetailModal({ student, activeTab, setActiveTab, onClose, moodMeta }) {
  const moodEntries = student.moodEntries || []
  const sharedJournals = student.sharedJournals || []

  return (
    <div
      className="absolute inset-0 z-[110] flex items-center justify-center bg-[#3a2b25]/50 backdrop-blur-sm animate-fadeIn rounded-[3rem]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-scaleIn overflow-hidden flex flex-col max-h-[75vh] mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Sub-modal header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-warm/10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[#FDF9F2] flex items-center justify-center text-warm/50 hover:text-warm transition-colors">
              <ChevronLeft size={16} />
            </button>
            <div>
              <h4 className="font-jakarta font-black text-base" style={{ color: WARM_DARK }}>{student.name}</h4>
              <p className="text-[10px] text-warm/40 font-medium">{student.id} · {student.course} · Year {student.year}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[#FDF9F2] flex items-center justify-center text-warm/30 hover:text-warm transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-warm/10 px-6">
          <TabBtn active={activeTab === 'moods'} onClick={() => setActiveTab('moods')} icon={Heart} label="Mood Entries" count={moodEntries.length} />
          <TabBtn active={activeTab === 'journals'} onClick={() => setActiveTab('journals')} icon={BookOpen} label="Shared Journal" count={sharedJournals.length} />
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'moods' ? (
            <div className="p-4 space-y-2">
              {moodEntries.length === 0 ? (
                <EmptyTabState icon="😶" title="No mood entries" sub="This student hasn't logged any moods in the last 90 days." />
              ) : (
                moodEntries.map((entry, i) => {
                  const meta = moodMeta[entry.mood_type] || { emoji: '😶', label: entry.mood_type }
                  const dt = new Date(entry.logged_at)
                  const dateStr = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                  const timeStr = dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-[#FDF9F2] border border-warm/5">
                      <span className="text-xl flex-shrink-0 mt-0.5">{meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-bold capitalize" style={{ color: WARM_DARK }}>{meta.label}</span>
                          <span className="text-[9px] text-warm/40 font-medium whitespace-nowrap">{dateStr} · {timeStr}</span>
                        </div>
                        {entry.note && (
                          <p className="text-xs text-warm/70 leading-relaxed italic">"{entry.note}"</p>
                        )}
                        {entry.triggers?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {entry.triggers.map((t, ti) => (
                              <span key={ti} className="text-[9px] px-2 py-0.5 rounded-full bg-warm/8 text-warm/50 font-semibold">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {sharedJournals.length === 0 ? (
                <EmptyTabState icon="📖" title="No shared journal entries" sub="This student hasn't shared any journal entries with guidance yet." />
              ) : (
                sharedJournals.map((j, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-[#FDF9F2] border border-warm/5">
                    {j.prompt && <p className="text-[10px] font-bold text-[#755b00] mb-1 uppercase tracking-wider">{j.prompt}</p>}
                    <p className="text-xs text-warm/80 leading-relaxed">{j.content}</p>
                    <p className="text-[9px] text-warm/35 mt-2 font-medium">
                      {new Date(j.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-1 py-3 mr-5 text-[11px] font-black uppercase tracking-wider border-b-2 transition-colors ${
        active ? 'border-gold text-warm' : 'border-transparent text-warm/40 hover:text-warm/70'
      }`}
    >
      <Icon size={12} />
      {label}
      {count > 0 && (
        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${active ? 'bg-gold/20 text-[#755b00]' : 'bg-warm/10 text-warm/40'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

function EmptyTabState({ icon, title, sub }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-4xl mb-3 opacity-30">{icon}</div>
      <h4 className="font-bold text-sm text-warm mb-1">{title}</h4>
      <p className="text-xs text-warm/40 max-w-xs mx-auto">{sub}</p>
    </div>
  )
}

function StatCard({ label, value, highlight }) {
  return (
    <div className="bg-white p-4 rounded-[1.5rem] border border-warm/5 shadow-sm text-center">
      <p className="text-[8px] font-black uppercase tracking-widest mb-1 text-warm/40">{label}</p>
      <p className="text-2xl font-black" style={{ color: highlight ? CORAL : WARM_DARK }}>{value}</p>
    </div>
  )
}

function RiskItem({ icon: Icon, color, label, count, description }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border" style={{ borderColor: `${color}18`, background: `${color}06` }}>
      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
        <Icon size={13} />
      </div>
      <div className="flex-1">
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{label}</p>
        <p className="text-sm font-black mb-1" style={{ color: WARM_DARK }}>{count} students</p>
        {description && <p className="text-[8px] text-warm/50 leading-snug">{description}</p>}
      </div>
    </div>
  )
}
