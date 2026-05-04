import { X, Users, TrendingUp, AlertTriangle, Moon, CloudRain, BellRing } from 'lucide-react'

const WARM_DARK = '#3a2b25'
const WARM_BODY = '#5D4037'
const WARM_TAN = '#AA8E7E'
const CORAL = '#EF7B6C'
const GOLD = '#E6B86A'
const LAVENDER = '#9C8EC1'

export default function ProgramDetailModal({ group, onClose }) {
  if (!group) return null

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
              <p className="text-[10px] font-bold uppercase tracking-widest text-warm/40 mt-1">Year {group.year} · Wellness Summary</p>
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

          {/* Alert Breakdown */}
          <div className="mb-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: WARM_TAN }}>
              <AlertTriangle size={12} className="text-coral" />
              Risk Distribution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <RiskItem icon={AlertTriangle} color={CORAL} label="Critical" count={group.alerts.streak} />
              <RiskItem icon={CloudRain} color={GOLD} label="Low Trend" count={group.alerts.lowAvg} />
              <RiskItem icon={Moon} color={LAVENDER} label="Silent" count={group.alerts.silent} />
            </div>
          </div>

          {/* Flagged Student List (Anonymized by ID) */}
          <div className="bg-white rounded-[2rem] p-8 border border-warm/5">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-6" style={{ color: WARM_TAN }}>
              Students Requiring Support (By ID)
            </h3>
            
            {group.alertStudents.length === 0 ? (
              <p className="text-sm font-medium italic text-warm/30">No students currently flagged in this group.</p>
            ) : (
              <div className="space-y-3">
                {group.alertStudents.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-warm/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black" style={{ color: WARM_DARK }}>{s.id}</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase" 
                        style={{ 
                            background: s.kind === 'Critical Streak' ? `${CORAL}15` : s.kind === 'Low Trend' ? `${GOLD}15` : `${LAVENDER}15`,
                            color: s.kind === 'Critical Streak' ? CORAL : s.kind === 'Low Trend' ? GOLD : LAVENDER
                        }}>
                        {s.kind}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-warm/30">Avg Score</p>
                        <p className="text-xs font-black" style={{ color: WARM_DARK }}>{s.score}</p>
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

function RiskItem({ icon: Icon, color, label, count }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ borderColor: `${color}15`, background: `${color}05` }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, color }}>
        <Icon size={14} />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{label}</p>
        <p className="text-sm font-black" style={{ color: WARM_DARK }}>{count} students</p>
      </div>
    </div>
  )
}
