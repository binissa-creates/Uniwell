import { useState } from 'react'
import { X, Users, TrendingUp, AlertTriangle, Moon, CloudRain, BellRing, ChevronDown } from 'lucide-react'

const WARM_DARK = '#3a2b25'
const WARM_BODY = '#5D4037'
const WARM_TAN = '#AA8E7E'
const CORAL = '#EF7B6C'
const GOLD = '#E6B86A'
const LAVENDER = '#9C8EC1'

export default function ProgramDetailModal({ group, onClose }) {
  if (!group) return null

  const [showMoodExplanation, setShowMoodExplanation] = useState(false)
  const activePercent = Math.round((group.activeCount / group.totalStudents) * 100)

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

        <div className="flex items-center justify-between px-10 pt-10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
              <Users size={24} />
            </div>
            <div>
              <h2 className="font-jakarta font-black text-2xl" style={{ color: WARM_DARK }}>{group.course}</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-warm/40 mt-1">{group.year ? `Year ${group.year}` : 'All year levels'} · Wellness Summary</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-warm/20 hover:text-warm/60 transition-colors shadow-sm"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-10 pb-10 overflow-y-auto custom-scrollbar">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Students" value={group.totalStudents} sub="Population" />
            <StatCard label="Avg Mood" value={group.avgMood} sub="Emotional Avg" />
            <StatCard label="Activity" value={`${activePercent}%`} sub="Last 7 Days" />
          </div>

          {/* Average Mood Score Explanation - Collapsible */}
          <div className="mb-8">
            <button
              onClick={() => setShowMoodExplanation(!showMoodExplanation)}
              className="w-full flex items-center justify-between p-5 rounded-2xl border border-gold/20 transition-all hover:bg-gold/5"
              style={{ background: showMoodExplanation ? 'rgba(246,201,69,0.08)' : '#FDF9F2' }}
            >
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: WARM_TAN }}>
                ℹ️ Average Mood Score Calculation
              </span>
              <ChevronDown 
                size={16} 
                style={{ 
                  color: WARM_TAN,
                  transform: showMoodExplanation ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }} 
              />
            </button>
            
            {showMoodExplanation && (
              <div className="mt-3 p-5 rounded-2xl bg-gold/5 border border-gold/15 animate-fadeIn">
                <p className="text-xs font-medium leading-relaxed text-warm/70 mb-4">
                  The average mood score is calculated from all mood entries submitted by students in this cohort. 
                  It ranges from <span className="font-bold text-coral">1.0 (Critical)</span> to <span className="font-bold text-gold">5.0 (Excellent)</span>.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(79,39,35,0.05)' }}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#81B29A' }} />
                    <span className="text-[9px] font-medium text-warm/70"><span className="font-bold">≥4.0</span> Good emotional health</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(230,184,106,0.1)' }}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: GOLD }} />
                    <span className="text-[9px] font-medium text-warm/70"><span className="font-bold">2.5-3.9</span> Moderate concern</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(239,123,108,0.1)' }}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CORAL }} />
                    <span className="text-[9px] font-medium text-warm/70"><span className="font-bold">&lt;2.5</span> Critical intervention needed</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Alert Breakdown */}
          <div className="mb-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: WARM_TAN }}>
              <AlertTriangle size={12} className="text-coral" />
              Risk Distribution & Explanations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <RiskItem icon={AlertTriangle} color={CORAL} label="Critical Streak" count={group.alerts.streak} description="3+ consecutive low mood entries (score ≤2)" />
              <RiskItem icon={CloudRain} color={GOLD} label="Low Trend" count={group.alerts.lowAvg} description="Consistent average score below 2.5 over recent entries" />
              <RiskItem icon={Moon} color={LAVENDER} label="Silent" count={group.alerts.silent} description="No mood entries in the last 7 days" />
            </div>
          </div>

          {/* Flagged Student List (Name + ID) */}
          <div className="bg-white rounded-[2rem] p-8 border border-warm/5">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-6" style={{ color: WARM_TAN }}>
              Students Requiring Support
            </h3>
            
            {group.alertStudents.length === 0 ? (
              <p className="text-sm font-medium italic text-warm/30">No students currently flagged in this group.</p>
            ) : (
              <div className="space-y-4">
                {group.alertStudents.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-4 px-4 rounded-2xl transition-all" 
                    style={{ background: s.kind === 'Critical Streak' ? `${CORAL}05` : s.kind === 'Low Trend' ? `${GOLD}05` : `${LAVENDER}05` }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-black" style={{ color: WARM_DARK }}>
                          {s.name} <span className="font-bold text-warm/50">({s.id})</span>
                        </span>
                        <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase" 
                          style={{ 
                              background: s.kind === 'Critical Streak' ? `${CORAL}15` : s.kind === 'Low Trend' ? `${GOLD}15` : `${LAVENDER}15`,
                              color: s.kind === 'Critical Streak' ? CORAL : s.kind === 'Low Trend' ? GOLD : LAVENDER
                          }}>
                          {s.kind}
                        </span>
                      </div>
                      {/* Explanation tooltip */}
                      <p className="text-[9px] text-warm/60 leading-snug">
                        {s.kind === 'Critical Streak' && `3+ consecutive mood entries with low scores (≤2). Average: ${s.score}`}
                        {s.kind === 'Low Trend' && `Consistent low mood pattern. Average score: ${s.score} (scale: 1-5)`}
                        {s.kind === 'Silent' && `No mood entries recorded in the last 7 days. Last score: ${s.score}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-warm/30">Avg Score</p>
                        <p className="text-sm font-black" style={{ color: WARM_DARK }}>{s.score}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-10 py-8 bg-white border-t border-warm/5 flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: WARM_TAN }}>Action Plan</p>
            <p className="text-xs font-bold text-warm/60">Notify guidance staff for this group</p>
          </div>
          <button className="flex items-center gap-3 px-8 py-4 bg-gold rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-glow hover:scale-105 transition-transform active:scale-95">
            <BellRing size={16} />
            Dispatch Support
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-warm/5 shadow-sm">
      <p className="text-[8px] font-black uppercase tracking-widest mb-1 text-warm/40">{label}</p>
      <p className="text-2xl font-black" style={{ color: WARM_DARK }}>{value}</p>
      <p className="text-[8px] font-bold text-warm/30 mt-1">{sub}</p>
    </div>
  )
}

function RiskItem({ icon: Icon, color, label, count, description }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl border" style={{ borderColor: `${color}15`, background: `${color}05` }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
        <Icon size={14} />
      </div>
      <div className="flex-1">
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{label}</p>
        <p className="text-sm font-black mb-1.5" style={{ color: WARM_DARK }}>{count} students</p>
        {description && (
          <p className="text-[8px] text-warm/60 leading-snug">{description}</p>
        )}
      </div>
    </div>
  )
}
