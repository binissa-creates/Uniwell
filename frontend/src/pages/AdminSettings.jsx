import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Mail, Settings, SlidersHorizontal, Users } from 'lucide-react'
import Navbar from '../components/Navbar'
import AppearanceSettings from '../components/AppearanceSettings'

const plannedSettings = [
  { icon: SlidersHorizontal, text: 'Configure alert thresholds and quiet periods.' },
  { icon: BarChart3, text: 'Choose which programs and year levels appear in analytics.' },
  { icon: Mail, text: 'Manage email templates for staff and student outreach.' },
]

export default function AdminSettings() {
  return (
    <div className="admin-page relative min-h-screen overflow-x-hidden bg-surface">
      <div className="pointer-events-none fixed right-0 top-0 h-[34rem] w-[34rem] rounded-full bg-[#F6C945]/5 blur-[100px]" />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Admin Hub · Preferences
          </p>
          <h1 className="font-jakarta text-3xl font-extrabold text-warm sm:text-5xl">
            Admin <span className="font-playfair italic text-primary">Settings</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-warm/75 sm:text-base">
            Set your appearance preference and review upcoming administration options.
          </p>
        </header>

        <div className="space-y-6">
          <AppearanceSettings />

          <section className="rounded-2xl border border-outline-variant bg-surface-lowest p-5 shadow-suncast sm:rounded-3xl sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-container/25 text-primary">
                <Settings size={18} />
              </div>
              <div>
                <h2 className="font-jakarta font-bold text-warm">More admin controls</h2>
                <p className="text-xs text-warm/65">These options are planned and are not configurable yet.</p>
              </div>
            </div>

            <ul className="space-y-3">
              {plannedSettings.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 rounded-2xl border border-outline-variant bg-surface px-4 py-4">
                  <Icon size={17} className="mt-0.5 shrink-0 text-primary" />
                  <span className="text-sm font-medium leading-relaxed text-warm/85">{text}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/staff/manage"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-container px-4 py-3 text-sm font-bold text-[#3E3006] transition hover:shadow-glow"
            >
              <Users size={16} />
              Manage staff accounts
              <ArrowRight size={15} />
            </Link>
          </section>
        </div>
      </main>
    </div>
  )
}
