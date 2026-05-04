import { Search, Users, GraduationCap, TrendingUp, CalendarDays } from 'lucide-react'

const WARM_DARK = '#3a2b25'
const WARM_BODY = '#5D4037'
const WARM_OLIVE = '#6B5A10'
const WARM_TAN = '#AA8E7E'
const WARM_GOLD = '#F6C945'

export default function StudentListTable({ groups, courses, search, setSearch, courseFilter, setCourseFilter, yearFilter, setYearFilter, onSelect }) {
  const hasFilters = Boolean(search || courseFilter || yearFilter)

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-warm/5 flex items-center justify-center text-warm/40">
            <Users size={18} />
          </div>
          <h2 className="font-jakarta font-black text-2xl" style={{ color: WARM_DARK }}>Program Overview</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-4 border border-white shadow-sm mb-10 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-warm/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by program name..."
            className="w-full bg-white rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:ring-2 focus:ring-gold border border-warm/10 transition-all shadow-sm"
          />
        </div>

        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="bg-white rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-gold border border-warm/10 font-bold transition-all w-full md:w-64 shadow-sm"
        >
          <option value="">All Programs</option>
          {courses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="flex items-center bg-white rounded-2xl p-1.5 border border-warm/10 shadow-sm">
          <FilterButton active={yearFilter === null} onClick={() => setYearFilter(null)} label="All" />
          {[1, 2, 3, 4].map(y => (
            <FilterButton key={y} active={yearFilter === y} onClick={() => setYearFilter(y)} label={`Y${y}`} />
          ))}
        </div>

        {hasFilters && (
          <button onClick={() => { setSearch(''); setCourseFilter(''); setYearFilter(null); }} 
            className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-warm/40 hover:text-coral transition-colors">
            Clear
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-24 text-center border border-white">
          <div className="text-5xl mb-6 opacity-20">🔍</div>
          <h3 className="font-black text-xl mb-2">No programs found</h3>
          <p className="text-sm text-warm/60">Try adjusting your filters to see campus-wide data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups.map((g, idx) => (
            <div 
              key={g.id} 
              onClick={() => onSelect(g)}
              className="bg-white rounded-[2.5rem] p-8 shadow-lift border border-white animate-fadeIn cursor-pointer hover:-translate-y-1 transition-all" 
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#FDF9F2] flex items-center justify-center text-warm/40">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base" style={{ color: WARM_DARK }}>{g.course}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-warm/40">Year {g.year}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Stat icon={Users} label="Students" value={g.totalStudents} color={WARM_OLIVE} />
                <Stat icon={TrendingUp} label="Avg Mood" value={g.avgMood} color={WARM_GOLD} />
                <Stat icon={CalendarDays} label="Active" value={`${Math.round((g.activeCount / g.totalStudents) * 100)}%`} color="#81B29A" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterButton({ active, onClick, label }) {
  return (
    <button onClick={onClick} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-gold text-white shadow-sm' : 'text-warm/40 hover:bg-warm/5'}`}>
      {label}
    </button>
  )
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="text-center p-4 rounded-[2rem]" style={{ background: `${color}08` }}>
      <p className="text-[8px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: WARM_TAN }}>{label}</p>
      <p className="text-xl font-black mb-1" style={{ color: WARM_DARK }}>{value}</p>
      <div className="flex justify-center mt-2">
        <Icon size={12} style={{ color }} />
      </div>
    </div>
  )
}
