import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  LifeBuoy,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import SupportModal from '../components/SupportModal'

const resourceSections = [
  {
    id: 'wellness-patterns',
    icon: BarChart3,
    title: 'Read wellness patterns responsibly',
    points: [
      'Mood check-ins are student self-reports, not diagnoses or clinical assessments.',
      'Look at trends over time; a single check-in does not explain the whole story.',
      'Trigger tags describe what a student reported, not proof of cause.',
    ],
  },
  {
    id: 'supportive-outreach',
    icon: MessageCircle,
    title: 'Start a supportive conversation',
    points: [
      'Ask privately, describe concern without labeling, and let the student choose whether to talk.',
      'Offer a listening ear or a connection to campus support; avoid promises you cannot make.',
      'Follow your campus safeguarding and referral procedures.',
    ],
    quote: '“Hi, I wanted to check in and see how you’re doing. Would talking or exploring support options be helpful?”',
  },
  {
    id: 'privacy-boundaries',
    icon: ShieldCheck,
    title: 'Respect privacy boundaries',
    points: [
      'Journal entries are private to students and are not available in staff views.',
      'Use staff wellness information only for your authorized role and share it only through approved channels.',
      'Discuss personal details only with people who need them to provide support.',
    ],
  },
]

const staffLinks = [
  { to: '/admin', label: 'Analytics', icon: Activity },
  { to: '/admin/students', label: 'Student monitor', icon: ClipboardCheck },
  { to: '/admin/moderation', label: 'Strategy moderation', icon: ShieldCheck },
]

function ResourceCard({ id, icon: Icon, title, points, quote }) {
  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-3xl border border-outline-variant bg-surface-lowest p-5 shadow-suncast sm:p-7"
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-container/25 text-primary">
          <Icon size={20} />
        </div>
        <h2 className="pt-1 font-jakarta text-lg font-extrabold text-warm">{title}</h2>
      </div>
      <ul className="space-y-3">
        {points.map(point => (
          <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-warm/75">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      {quote && (
        <blockquote className="mt-5 rounded-2xl border border-primary-container/30 bg-primary-container/10 p-4 text-sm font-semibold leading-relaxed text-warm">
          {quote}
        </blockquote>
      )}
    </section>
  )
}

export default function AdminHelpResources() {
  const [supportOpen, setSupportOpen] = useState(false)

  return (
    <div className="admin-page relative min-h-screen overflow-x-hidden bg-surface">
      <div className="pointer-events-none fixed right-0 top-0 h-[34rem] w-[34rem] rounded-full bg-[#F6C945]/5 blur-[100px]" />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Admin Hub · Staff reference
          </p>
          <h1 className="font-jakarta text-3xl font-extrabold text-warm sm:text-5xl">
            Help &amp; <span className="font-playfair italic text-primary">Resources</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-warm/75 sm:text-base">
            Practical reminders for using wellness information with care and connecting students with support.
          </p>
        </header>

        <nav aria-label="Staff quick links" className="mb-8 grid gap-3 sm:grid-cols-3">
          {staffLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface-lowest px-4 py-3 text-sm font-bold text-warm shadow-sm transition hover:-translate-y-0.5 hover:shadow-suncast"
            >
              <span className="flex items-center gap-3">
                <Icon size={17} className="text-primary" />
                {label}
              </span>
              <ArrowRight size={15} className="text-warm/45" />
            </Link>
          ))}
        </nav>

        <div className="grid gap-4 lg:grid-cols-2">
          {resourceSections.map(section => (
            <ResourceCard key={section.id} {...section} />
          ))}

          <section
            id="urgent-support"
            className="scroll-mt-28 rounded-3xl border border-error/20 bg-surface-lowest p-5 shadow-suncast sm:p-7"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-error-container/50 text-error">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 className="font-jakarta text-lg font-extrabold text-warm">When urgent help is needed</h2>
                <p className="mt-1 text-sm leading-relaxed text-warm/70">
                  UniWell is not an emergency service. Do not wait for an in-app alert if someone may be in immediate danger.
                </p>
              </div>
            </div>
            <ul className="mb-5 space-y-3">
              <li className="flex items-start gap-3 text-sm leading-relaxed text-warm/75">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-error" />
                <span>Follow campus emergency procedures and contact local emergency services for immediate danger.</span>
              </li>
              <li className="flex items-start gap-3 text-sm leading-relaxed text-warm/75">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-error" />
                <span>For support and referral options, use the verified campus and crisis contacts below.</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setSupportOpen(true)}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-container px-5 py-3 text-sm font-bold text-[#3E3006] transition hover:shadow-glow sm:w-auto"
            >
              <PhoneCall size={16} />
              View campus &amp; crisis contacts
            </button>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-warm/55">
              <LifeBuoy size={14} className="mt-0.5 shrink-0" />
              Follow your institution’s approved escalation and referral procedures.
            </p>
          </section>
        </div>
      </main>

      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  )
}
