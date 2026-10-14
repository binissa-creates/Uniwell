import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import { Sparkles } from 'lucide-react'

/**
 * Honest placeholder for admin sections that don't have a backing data model yet.
 * Keeps the design system consistent so the nav doesn't lead to a 404.
 */
export default function AdminComingSoon({ eyebrow, title, accent, blurb, bullets, icon: Icon }) {
  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  return (
    <div className="admin-page min-h-screen bg-surface relative overflow-x-hidden">
      <div className="fixed top-0 right-0 w-[50rem] h-[50rem] rounded-full bg-[#F6C945]/5 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[40rem] h-[40rem] rounded-full bg-[#81B29A]/5 blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24 relative z-10 page-enter">

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4 animate-fadeIn">
            <div className="h-px w-8 bg-primary/30" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              {eyebrow}
            </p>
          </div>
          <h1 className="font-jakarta text-5xl font-extrabold mb-4 animate-fadeIn text-warm">
            {title}{' '}
            <span className="font-playfair italic font-bold text-primary">
              {accent}
            </span>
          </h1>
          <p className="text-base md:text-lg max-w-xl leading-relaxed font-medium animate-fadeIn text-warm/75">
            {blurb}
          </p>
        </div>

        <div className="bg-surface-lowest rounded-[2.5rem] p-10 md:p-12 shadow-lift border border-outline-variant animate-fadeIn">
          <div className="flex items-start gap-5 mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-primary-container/10 text-primary">
              {Icon ? <Icon size={22} /> : <Sparkles size={22} />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-outline">
                Planned Feature
              </p>
              <h2 className="font-jakarta font-black text-xl leading-tight text-warm">
                This section is on the roadmap.
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl border border-outline-variant bg-surface">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black mt-0.5"
                  style={{ background: '#F6C945', color: '#3E3006' }}>
                  {i + 1}
                </div>
                <p className="text-[13px] font-semibold leading-relaxed flex-1 text-warm/85">
                  {b}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
