import { useState } from 'react'
import { Search, Users, GraduationCap, ChevronDown, X } from 'lucide-react'
import { ACADEMIC_DEPARTMENTS, departmentForProgram } from '../lib/academicPrograms'

const WARM_DARK = '#3a2b25'
const WARM_TAN = '#AA8E7E'

export default function StudentListTable({ groups, courses, search, setSearch, departmentFilter, setDepartmentFilter, courseFilter, setCourseFilter, yearFilter, setYearFilter, onSelect }) {
  const selectedDepartment = ACADEMIC_DEPARTMENTS.find(d => d.name === departmentFilter)
  const departmentCourses = selectedDepartment
    ? selectedDepartment.programs.length > 0
      ? selectedDepartment.programs.filter(p => courses.includes(p))
      : courses.filter(c => c === selectedDepartment.name)
    : courses

  const hasFilters = Boolean(search || departmentFilter || courseFilter || yearFilter)
  const showTable = hasFilters

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-xl bg-warm/5 flex items-center justify-center text-warm/40">
          <Users size={18} />
        </div>
        <h2 className="font-jakarta font-black text-2xl" style={{ color: WARM_DARK }}>Program Overview</h2>
      </div>

      {/* Filters */}
      <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-5 sm:p-6 border border-white shadow-sm mb-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(220px,1.1fr)_minmax(220px,1.1fr)] gap-5 items-end">
        <div className="relative w-full">
          <label className="text-[9px] font-bold text-[#B09C8E] uppercase tracking-widest mb-2 block">Search</label>
          <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-warm/40" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by program name..."
            className="w-full bg-[#FCF8F4] rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#F8D272] border border-transparent focus:border-[#F8D272] transition-all"
          />
        </div>

        <FilterSelect label="Academic Department" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
          <option value="">All departments</option>
          {ACADEMIC_DEPARTMENTS.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
        </FilterSelect>

        <FilterSelect label="Academic Program" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
          <option value="">All programs</option>
          {departmentCourses.map(c => <option key={c} value={c}>{c}</option>)}
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

      {/* Empty State (no filters applied yet) */}
      {!showTable ? (
        <div className="bg-white rounded-[3rem] p-20 text-center border border-white">
          <div className="text-5xl mb-5 opacity-30">🔍</div>
          <h3 className="font-black text-xl mb-2" style={{ color: WARM_DARK }}>Search for a Student Group</h3>
          <p className="text-sm text-warm/50 max-w-sm mx-auto">
            Use the filters above to search by department, program, or year level. Results will appear here.
          </p>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-20 text-center border border-white">
          <div className="text-5xl mb-5 opacity-20">🔍</div>
          <h3 className="font-black text-xl mb-2">No programs found</h3>
          <p className="text-sm text-warm/60">Try adjusting your filters to see campus-wide data.</p>
        </div>
      ) : (
        /* Results Table */
        <div className="bg-white rounded-[2.5rem] border border-white shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_100px] gap-0 px-6 py-3.5 border-b border-warm/8 bg-[#FCF8F4]">
            {['Program', 'Department', 'Year', 'Students', 'Top Moods', 'Low Moods'].map(h => (
              <div key={h} className="text-[9px] font-black uppercase tracking-widest" style={{ color: WARM_TAN }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-warm/5">
            {groups.map((g, idx) => {
              const topEmotion = g.topEmotion
              const dept = departmentForProgram(g.course)?.name || 'Other'
              const alertBadge = g.lowMoodEntriesCount > 0
                ? { color: '#EF7B6C', bg: '#FEE9E7', label: `${g.lowMoodEntriesCount} low ${g.lowMoodEntriesCount === 1 ? 'mood' : 'moods'}` }
                : { color: '#81B29A', bg: '#EAF5EE', label: 'All Good' }

              return (
                <div
                  key={g.id}
                  onClick={() => onSelect(g)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(g) } }}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_100px] gap-0 px-6 py-4 items-center hover:bg-[#FDF9F2] cursor-pointer transition-colors group animate-fadeIn"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* Program */}
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#FDF9F2] flex items-center justify-center flex-shrink-0">
                        <GraduationCap size={13} className="text-warm/40" />
                      </div>
                      <p className="font-bold text-sm text-warm leading-tight line-clamp-2">{g.course}</p>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="text-xs text-warm/50 font-medium line-clamp-2 pr-2">{dept}</div>

                  {/* Year */}
                  <div className="text-sm font-bold" style={{ color: WARM_DARK }}>
                    {g.year ? `Year ${g.year}` : 'All'}
                  </div>

                  {/* Students */}
                  <div>
                    <span className="text-base font-black" style={{ color: WARM_DARK }}>{g.totalStudents}</span>
                    <span className="text-[10px] text-warm/40 ml-1">students</span>
                  </div>

                  {/* Top Emotions */}
                  <div className="flex flex-wrap gap-1">
                    {topEmotion
                      ? topEmotion.map((em, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF9F2] text-warm/70 border border-warm/10">
                            {em.emoji} {em.label} <span className="text-warm/40">×{em.count}</span>
                          </span>
                        ))
                      : <span className="text-[10px] text-warm/30 italic">No data yet</span>
                    }
                  </div>

                  {/* Action + alert */}
                  <div className="flex flex-col items-end gap-1">
                    {alertBadge && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: alertBadge.bg, color: alertBadge.color }}>
                        {alertBadge.label}
                      </span>
                    )}
                    <span className="text-[9px] font-black uppercase tracking-widest text-warm/30 group-hover:text-warm/60 transition-colors">
                      View →
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
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
