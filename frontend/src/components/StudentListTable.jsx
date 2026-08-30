import { useState } from 'react'
import { Search, Users, GraduationCap, TrendingUp, CalendarDays, X, ChevronDown } from 'lucide-react'
import { ACADEMIC_DEPARTMENTS, departmentForProgram } from '../lib/academicPrograms'

const WARM_DARK = '#3a2b25'
const WARM_BODY = '#5D4037'
const WARM_OLIVE = '#6B5A10'
const WARM_TAN = '#AA8E7E'
const WARM_GOLD = '#F6C945'

export default function StudentListTable({ groups, courses, search, setSearch, departmentFilter, setDepartmentFilter, courseFilter, setCourseFilter, yearFilter, setYearFilter, onSelect }) {
  const [selectedProgram, setSelectedProgram] = useState(null)
  const selectedDepartment = ACADEMIC_DEPARTMENTS.find(department => department.name === departmentFilter)
  const departmentCourses = selectedDepartment
    ? selectedDepartment.programs.length > 0
      ? selectedDepartment.programs.filter(program => courses.includes(program))
      : courses.filter(course => course === selectedDepartment.name)
    : courses
  const hasFilters = Boolean(search || departmentFilter || courseFilter || yearFilter)

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
      <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-5 sm:p-6 border border-white shadow-sm mb-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(220px,1.1fr)_minmax(220px,1.1fr)] gap-5 items-end">
        <div className="relative w-full">
          <label className="text-[9px] font-bold text-[#B09C8E] uppercase tracking-widest mb-2 block">Search</label>
          <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-warm/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by program name..."
            className="w-full bg-[#FCF8F4] rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#F8D272] border border-transparent focus:border-[#F8D272] transition-all"
          />
        </div>

        <FilterSelect label="Academic Department" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
          <option value="">All departments</option>
          {ACADEMIC_DEPARTMENTS.map(department => (
            <option key={department.name} value={department.name}>{department.name}</option>
          ))}
        </FilterSelect>

        <FilterSelect label="Academic Program" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
          <option value="">All programs</option>
          {departmentCourses.map(course => <option key={course} value={course}>{course}</option>)}
        </FilterSelect>

        <div className="lg:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-[9px] font-bold text-[#B09C8E] uppercase tracking-widest">Year level</label>
          <div className="flex items-center bg-[#FCF8F4] rounded-2xl p-1.5 border border-transparent flex-1">
            <FilterButton active={yearFilter === null} onClick={() => setYearFilter(null)} label="All" />
            {[1, 2, 3, 4].map(y => (
              <FilterButton key={y} active={yearFilter === y} onClick={() => setYearFilter(y)} label={`Y${y}`} />
            ))}
          </div>
        </div>

        {hasFilters && (
          <button onClick={() => { setSearch(''); setDepartmentFilter(''); setCourseFilter(''); setYearFilter(null); }} 
            className="justify-self-start lg:justify-self-end px-2 py-3 text-[10px] font-black uppercase tracking-widest text-warm/40 hover:text-coral transition-colors">
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
              onClick={() => g.yearStats ? setSelectedProgram(g) : onSelect(g)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  g.yearStats ? setSelectedProgram(g) : onSelect(g)
                }
              }}
              className="group bg-white rounded-[2rem] p-7 shadow-lift border border-white animate-fadeIn cursor-pointer hover:-translate-y-1 hover:shadow-glow transition-all min-h-[300px] flex flex-col" 
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex items-start gap-4 min-h-[92px] mb-7">
                <div className="w-12 h-12 rounded-2xl bg-[#FDF9F2] flex items-center justify-center text-warm/40">
                  <GraduationCap size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-warm/40 mb-1 leading-[1.35] line-clamp-2">{departmentForProgram(g.course)?.name || 'Other Department'}</p>
                  <h3 className="font-black text-base leading-snug line-clamp-2" style={{ color: WARM_DARK }}>{g.course}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-warm/40">{g.year ? `Year ${g.year}` : 'All year levels'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-auto">
                <Stat icon={Users} label="Students" value={g.totalStudents} color={WARM_OLIVE} />
                <Stat icon={TrendingUp} label="Avg Mood" value={g.avgMood} color={WARM_GOLD} />
                <Stat icon={CalendarDays} label="Active" value={`${Math.round((g.activeCount / g.totalStudents) * 100)}%`} color="#81B29A" />
              </div>

              <p className="text-[9px] font-black uppercase tracking-widest text-warm/30 group-hover:text-warm/60 text-right mt-5 transition-colors">
                View details
              </p>

            </div>
          ))}
        </div>
      )}

      {selectedProgram && (
        <ProgramYearModal
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
          onSelect={(yearStats) => {
            setSelectedProgram(null)
            onSelect(yearStats)
          }}
        />
      )}
    </div>
  )
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div className="w-full">
      <label className="text-[9px] font-bold text-[#B09C8E] uppercase tracking-widest mb-2 block">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="w-full appearance-none bg-[#FCF8F4] text-[#3a2b25] text-sm px-4 py-3.5 pr-10 rounded-2xl outline-none focus:ring-2 focus:ring-[#F8D272] border border-transparent focus:border-[#F8D272] transition-all cursor-pointer"
        >
          {children}
        </select>
        <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#B09C8E]" />
      </div>
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
    <div className="text-center p-3.5 rounded-2xl min-w-0" style={{ background: `${color}08` }}>
      <p className="text-[8px] font-black uppercase tracking-[0.15em] mb-2 truncate" style={{ color: WARM_TAN }}>{label}</p>
      <p className="text-xl font-black mb-1" style={{ color: WARM_DARK }}>{value}</p>
      <div className="flex justify-center mt-2">
        <Icon size={12} style={{ color }} />
      </div>
    </div>
  )
}

function ProgramYearModal({ program, onClose, onSelect }) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[#3a2b25]/45 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#FDF9F2] rounded-[2.5rem] w-full max-w-xl p-7 sm:p-9 shadow-lift animate-scaleIn"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-5 mb-8">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-warm/40 mb-2">
              {departmentForProgram(program.course)?.name || 'Other Department'}
            </p>
            <h2 className="font-jakarta font-black text-2xl" style={{ color: WARM_DARK }}>{program.course}</h2>
            <p className="text-sm font-medium text-warm/50 mt-2">Select a year level to view wellness details.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close year selection"
            className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-warm/30 hover:text-warm/70 transition-colors shadow-sm flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(year => (
            <YearCard
              key={year}
              year={year}
              stats={program.yearStats[year]}
              onSelect={() => onSelect(program.yearStats[year])}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function YearCard({ year, stats, onSelect }) {
  const totalStudents = stats?.totalStudents || 0
  const activePercent = totalStudents ? Math.round((stats.activeCount / totalStudents) * 100) : 0
  const alertCount = stats?.totalAlerts || 0

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      disabled={!stats}
      className={`text-left rounded-2xl p-5 min-h-[126px] transition-all border border-transparent ${stats ? 'bg-white hover:bg-[#F8F0E4] hover:border-[#F6C945]/30 cursor-pointer shadow-sm' : 'bg-[#FDF9F2]/60 cursor-default'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: WARM_DARK }}>Year {year}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-warm/40">{stats ? 'View details' : 'No students'}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <YearMetric label="Students" value={totalStudents} color={WARM_OLIVE} />
        <YearMetric label="Avg mood" value={stats?.avgMood || '—'} color={WARM_GOLD} />
        <YearMetric label="Active" value={`${activePercent}%`} color="#81B29A" />
        <YearMetric label="Alerts" value={alertCount} color="#EF7B6C" />
      </div>
    </button>
  )
}

function YearMetric({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="text-[8px] font-bold uppercase tracking-wider text-warm/40 truncate">{label}</span>
      <span className="text-xs font-black ml-auto" style={{ color: WARM_DARK }}>{value}</span>
    </div>
  )
}
