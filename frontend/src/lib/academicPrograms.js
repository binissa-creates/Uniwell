export const ACADEMIC_DEPARTMENTS = [
  {
    name: 'College of Criminal Justice Education',
    programs: [],
  },
  {
    name: 'College of Computer Studies',
    programs: [
      'Bachelor of Science in Information Technology',
      'BS in Computer Science',
    ],
  },
  {
    name: 'College of Engineering and Architecture',
    programs: [
      'BS in Architecture',
      'BS in Civil Engineering',
      'BS in Geodetic Engineering',
      'BS in Mechanical Engineering',
      'BS in Electrical Engineering',
    ],
  },
  {
    name: 'College of Health Sciences',
    programs: [
      'BS Nursing',
      'BS in Pharmacy',
    ],
  },
  {
    name: 'College of Social Work',
    programs: [],
  },
  {
    name: 'College of Teacher Education, Arts and Sciences',
    programs: [
      'Teacher Education',
      'Bachelor of Arts in Music',
      'Bachelor of Arts in Political Science',
      'Bachelor of Science in Psychology',
    ],
  },
  {
    name: 'College of Business and Accountancy',
    programs: [
      'BS Business Administration',
      'BS Tourism Management',
      'BS Hospitality Management',
      'BS in Accountancy',
      'BS in Management Accounting',
      'BS in Entrepreneurship',
    ],
  },
]

export const ACADEMIC_PROGRAMS = ACADEMIC_DEPARTMENTS.flatMap((department) =>
  department.programs.length > 0 ? department.programs : [department.name]
)

export const LEGACY_PROGRAM_ALIASES = {
  IT: 'Bachelor of Science in Information Technology',
  'Computer Science': 'BS in Computer Science',
  'AB Music': 'Bachelor of Arts in Music',
  'Political Science': 'Bachelor of Arts in Political Science',
  Tourism: 'BS Tourism Management',
  Psychology: 'Bachelor of Science in Psychology',
  Nursing: 'BS Nursing',
  Education: 'Teacher Education',
  'Business Administration': 'BS Business Administration',
  Architecture: 'BS in Architecture',
}

export function departmentForProgram(program) {
  return ACADEMIC_DEPARTMENTS.find((department) =>
    department.programs.includes(program) ||
    (department.programs.length === 0 && department.name === program)
  )
}

export function academicProgramSortIndex(program) {
  const index = ACADEMIC_PROGRAMS.indexOf(program)
  return index === -1 ? ACADEMIC_PROGRAMS.length : index
}

export function academicDepartmentSortIndex(program) {
  const department = departmentForProgram(program)
  const index = department ? ACADEMIC_DEPARTMENTS.indexOf(department) : ACADEMIC_DEPARTMENTS.length
  return index
}