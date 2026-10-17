import { useState, useEffect } from 'react'
import { X, ChevronLeft, Heart, BookOpen, GraduationCap, AlertTriangle } from 'lucide-react'

const WARM_DARK = '#3a2b25'
const WARM_TAN = '#AA8E7E'
const CORAL = '#EF7B6C'
const GOLD = '#E6B86A'

export default function StudentDetailModal({
  student,
  activeTab = 'moods',
  setActiveTab,
  onClose,
  onViewProgram,
  moodMeta = {},
}) {
  const [internalTab, setInternalTab] = useState(activeTab)
  const currentTab = setActiveTab ? activeTab : internalTab
  const handleTabChange = setActiveTab || setInternalTab

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!student) return null

  const moodEntries = student.moodEntries || []
  const sharedJournals = student.sharedJournals || []
  const displayName = student.fullName || student.name || 'Student'

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#3a2b25]/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Student wellness record for ${displayName}`}
    >
      <div
        className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-scaleIn overflow-hidden flex flex-col max-h-[85vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#F8D272] via-[#F6C945] to-[#81B29A]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-warm/10 bg-[#FCF8F4]/50">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white border border-warm/10 flex items-center justify-center text-warm/60 hover:text-warm transition-colors flex-shrink-0 shadow-sm"
              title="Close modal"
              aria-label="Close"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-jakarta font-black text-lg text-[#3a2b25] truncate">
                  {displayName}
                </h3>
                {student.id && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-warm/8 text-[#6B5A10] font-bold">
                    {student.id}
                  </span>
                )}
              </div>
              <p className="text-xs text-warm/60 truncate mt-0.5">
                {student.course} · Year {student.year}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {onViewProgram && (
              <button
                onClick={onViewProgram}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-warm/10 text-[10px] font-black uppercase tracking-wider text-warm/70 hover:text-warm transition-colors shadow-sm"
                title="View full program overview"
              >
                <GraduationCap size={13} className="text-warm/40" />
                Program
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white border border-warm/10 flex items-center justify-center text-warm/40 hover:text-warm transition-colors shadow-sm"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick summary strip */}
        <div className="grid grid-cols-3 gap-2 px-6 sm:px-8 py-3 bg-[#FCF8F4] border-b border-warm/8 text-center text-xs">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-warm/50 block">Total Logs</span>
            <span className="font-black text-[#3a2b25] text-sm">{moodEntries.length}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-warm/50 block">Low Moods</span>
            <span className={`font-black text-sm ${student.lowMoodCount > 0 ? 'text-[#EF7B6C]' : 'text-[#81B29A]'}`}>
              {student.lowMoodCount || 0}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-warm/50 block">Shared Journals</span>
            <span className="font-black text-[#3a2b25] text-sm">{sharedJournals.length}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-warm/10 px-6 sm:px-8 bg-white">
          <TabBtn
            active={currentTab === 'moods'}
            onClick={() => handleTabChange('moods')}
            icon={Heart}
            label="Mood History"
            count={moodEntries.length}
          />
          <TabBtn
            active={currentTab === 'journals'}
            onClick={() => handleTabChange('journals')}
            icon={BookOpen}
            label="Shared Journals"
            count={sharedJournals.length}
          />
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto flex-1 custom-scrollbar p-6 sm:p-8">
          {currentTab === 'moods' ? (
            <div className="space-y-3">
              {moodEntries.length === 0 ? (
                <EmptyTabState
                  icon="😶"
                  title="No mood logs found"
                  sub="This student hasn't recorded any mood entries within the last 90 days."
                />
              ) : (
                moodEntries.map((entry, i) => {
                  const meta = moodMeta[entry.mood_type] || { emoji: '😶', label: entry.mood_type }
                  const dt = new Date(entry.logged_at)
                  const dateStr = dt.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                  const timeStr = dt.toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                  const isLow = ['awful', 'bad', 'angry', 'burned_out', 'lonely', 'frustrated', 'nervous', 'confused'].includes(
                    entry.mood_type
                  )

                  return (
                    <div
                      key={entry.id || i}
                      className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FCF8F4] border border-warm/5 hover:border-warm/15 transition-colors"
                    >
                      <span className="text-2xl flex-shrink-0 mt-0.5 select-none">{meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold capitalize text-[#3a2b25]">
                              {meta.label}
                            </span>
                            {isLow && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#FEE9E7] text-[#A3302A]">
                                Low mood
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-warm/50 font-medium whitespace-nowrap">
                            {dateStr} · {timeStr}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-xs text-warm/80 leading-relaxed italic bg-white/70 p-2.5 rounded-xl border border-warm/5 mt-1.5">
                            "{entry.note}"
                          </p>
                        )}
                        {entry.triggers?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.triggers.map((t, ti) => (
                              <span
                                key={ti}
                                className="text-[9px] px-2 py-0.5 rounded-full bg-warm/8 text-[#6B5A10] font-semibold"
                              >
                                {t}
                              </span>
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
            <div className="space-y-3">
              {sharedJournals.length === 0 ? (
                <EmptyTabState
                  icon="📖"
                  title="No shared journal entries"
                  sub="This student hasn't shared any journal entries with guidance yet."
                />
              ) : (
                sharedJournals.map((j, i) => (
                  <div key={j.id || i} className="p-4 rounded-2xl bg-[#FCF8F4] border border-warm/5 space-y-2">
                    {j.prompt && (
                      <p className="text-[10px] font-bold text-[#755b00] uppercase tracking-wider">
                        {j.prompt}
                      </p>
                    )}
                    <p className="text-xs text-warm/85 leading-relaxed whitespace-pre-wrap">{j.content}</p>
                    <p className="text-[10px] text-warm/40 font-medium pt-1">
                      {new Date(j.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
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
      className={`flex items-center gap-2 px-1 py-3 mr-6 text-xs font-black uppercase tracking-wider border-b-2 transition-colors ${
        active ? 'border-[#F6C945] text-[#3a2b25]' : 'border-transparent text-warm/40 hover:text-warm/70'
      }`}
    >
      <Icon size={14} className={active ? 'text-[#6B5A10]' : 'text-warm/40'} />
      {label}
      {count > 0 && (
        <span
          className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
            active ? 'bg-[#F6C945]/20 text-[#755b00]' : 'bg-warm/10 text-warm/50'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function EmptyTabState({ icon, title, sub }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-4xl mb-3 opacity-30 select-none">{icon}</div>
      <h4 className="font-bold text-sm text-[#3a2b25] mb-1">{title}</h4>
      <p className="text-xs text-warm/50 max-w-xs mx-auto leading-relaxed">{sub}</p>
    </div>
  )
}
