import { Bell, AlertTriangle, Moon, CloudRain, ChevronRight } from 'lucide-react'

const WARM_DARK = '#3a2b25'
const WARM_BODY = '#5D4037'
const WARM_TAN = '#AA8E7E'
const CORAL = '#EF7B6C'
const GOLD = '#E6B86A'
const LAVENDER = '#9C8EC1'
const SAGE = '#81B29A'

export default function WellnessAlertsPanel({ alerts = [], onSelect }) {
  const critical = alerts.filter(a => a.severity === 'critical')
  const warning = alerts.filter(a => a.severity === 'warning')

  return (
    <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-lift border border-white h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#EF7B6C]/10 flex items-center justify-center text-[#EF7B6C]">
            <Bell size={18} />
          </div>
          <h3 className="font-jakarta font-black text-[#3a2b25] text-sm uppercase tracking-widest">Wellness Alerts</h3>
        </div>
        <div className="px-3 py-1 rounded-full bg-[#FDF9F2] text-[10px] font-black text-[#AA8E7E] uppercase tracking-widest border border-[#AA8E7E]/10">
          Live Pulse
        </div>
      </div>

      <div className="space-y-4 flex-1">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
            <CloudRain size={48} strokeWidth={1.5} />
            <p className="text-[10px] font-black uppercase tracking-widest mt-4">No active alerts</p>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <button
              key={i}
              onClick={() => onSelect?.(alert.group)}
              className="w-full group text-left p-4 rounded-2xl bg-[#FDF9F2]/60 hover:bg-white border border-transparent hover:border-[#AA8E7E]/10 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${alert.severity === 'critical' ? 'bg-[#EF7B6C] text-white' : 'bg-[#E6B86A] text-white'}`}>
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-[#3a2b25] uppercase tracking-wide leading-none mb-1">
                    {alert.group}
                  </p>
                  <p className="text-[9px] font-bold text-[#AA8E7E] uppercase tracking-widest">
                    {alert.message}
                  </p>
                </div>
              </div>
              <ChevronRight size={14} className="text-[#AA8E7E]/30 group-hover:text-[#3a2b25] transition-colors" />
            </button>
          ))
        )}
      </div>
      
      {alerts.length > 0 && (
        <p className="text-[9px] font-black text-[#AA8E7E]/40 uppercase tracking-[0.2em] text-center mt-6">
          Showing {alerts.length} priority groups
        </p>
      )}
    </div>
  )
}

function AlertItem({ label, count, color, bg }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl transition-all" style={{ background: bg }}>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{label}</span>
      </div>
      <span className="text-xs font-black" style={{ color: WARM_DARK }}>{count} student{count !== 1 ? 's' : ''}</span>
    </div>
  )
}
