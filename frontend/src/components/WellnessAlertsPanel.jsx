import { Bell, AlertTriangle, Moon, CloudRain, ChevronRight } from 'lucide-react'

const WARM_DARK = '#3a2b25'
const WARM_BODY = '#5D4037'
const WARM_TAN = '#AA8E7E'
const CORAL = '#EF7B6C'
const GOLD = '#E6B86A'
const LAVENDER = '#9C8EC1'

export default function WellnessAlertsPanel({ groups }) {
  if (!groups || groups.length === 0) return (
    <div className="bg-white/40 rounded-[2.5rem] p-12 border border-white text-center">
      <div className="text-4xl mb-4">🌻</div>
      <h3 className="font-black text-lg" style={{ color: WARM_DARK }}>Campus wellness is stable</h3>
      <p className="text-xs font-medium text-warm/60">No high-risk clusters detected across programs.</p>
    </div>
  )

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-xl bg-coral/10 flex items-center justify-center text-coral">
          <Bell size={18} />
        </div>
        <h2 className="font-jakarta font-black text-2xl" style={{ color: WARM_DARK }}>High Priority Clusters</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((g, idx) => {
          const initials = g.course.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
          
          return (
            <div key={g.id} 
              className="bg-white rounded-[2.5rem] p-8 shadow-lift border border-white hover:-translate-y-1 transition-all group"
              style={{ animationDelay: `${idx * 50}ms` }}>
              
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[1.25rem] bg-gold flex items-center justify-center font-black text-lg text-white shadow-inner">
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-black text-lg leading-tight" style={{ color: WARM_DARK }}>{g.course}</h3>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-warm/40 mt-1">Year {g.year} · {g.totalStudents} Students</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {g.alerts.streak > 0 && (
                  <AlertChip icon={AlertTriangle} color={CORAL} label="Critical Streak" count={g.alerts.streak} />
                )}
                {g.alerts.lowAvg > 0 && (
                  <AlertChip icon={CloudRain} color={GOLD} label="Low Trend" count={g.alerts.lowAvg} />
                )}
                {g.alerts.silent > 0 && (
                  <AlertChip icon={Moon} color={LAVENDER} label="Silent" count={g.alerts.silent} />
                )}
              </div>

              <button 
                onClick={() => onSelect(g)}
                className="w-full py-4 bg-[#FDF9F2] rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-gold/10" 
                style={{ color: WARM_BODY }}
              >
                View Program Details <ChevronRight size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AlertChip({ icon: Icon, color, label, count }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-2xl border" style={{ borderColor: `${color}20`, background: `${color}05` }}>
      <div className="flex items-center gap-3">
        <Icon size={14} style={{ color }} />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{label}</span>
      </div>
      <span className="text-xs font-black" style={{ color: WARM_DARK }}>{count} student{count !== 1 ? 's' : ''}</span>
    </div>
  )
}
