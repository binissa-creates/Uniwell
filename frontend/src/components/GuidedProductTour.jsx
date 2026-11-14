import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const STUDENT_STEPS = [
  {
    path: '/dashboard',
    target: 'dashboard-streak',
    title: 'Your bloom and check-in streak',
    body: 'This sunflower tracks your care streak and check-in milestones. A day counts when you log a mood.',
  },
  {
    path: '/dashboard',
    target: 'dashboard-log-mood',
    title: 'Start a daily check-in',
    body: 'Use “Water Your Sunflower” to open Mood Tracker. If you have already checked in today, choose Next to see the tracker.',
    advanceOnTargetClick: true,
  },
  {
    path: '/mood',
    target: 'mood-picker',
    title: 'Choose how you feel',
    body: 'Select the mood that best describes this moment. There is no right or wrong answer.',
  },
  {
    path: '/mood',
    target: 'mood-intensity',
    title: 'Set the mood level',
    body: 'Use the scale to show how strongly you feel this mood.',
  },
  {
    path: '/mood',
    target: 'mood-triggers',
    title: 'Add helpful context',
    body: 'Choose any contributing factors. You can also add a brief private note in the field below.',
  },
  {
    path: '/mood',
    target: 'mood-save',
    title: 'Save your check-in',
    body: 'When you are ready, choose a mood and select “Save this Entry.” The tour will not submit anything for you.',
  },
  {
    path: '/mood',
    target: 'mood-history',
    title: 'Look back at your check-ins',
    body: 'Your recent mood entries appear here, so you can reflect on patterns over time.',
  },
  {
    path: '/journal',
    target: 'journal-compose',
    title: 'Open your Journal',
    body: 'Start a reflection here. On a phone, tap “Write New Entry” to open the journal editor.',
    advanceOnTargetClick: true,
  },
  {
    path: '/journal',
    target: 'journal-prompt',
    title: 'Choose a reflection prompt',
    body: 'Prompts can help you get started. Open the prompt library to see the available questions.',
    advanceOnTargetClick: true,
  },
  {
    path: '/journal',
    target: 'journal-prompt-option',
    title: 'Pick a prompt to try',
    body: 'Choose any prompt; it will be added to your editor. You can also write without a prompt.',
    advanceOnTargetClick: true,
  },
  {
    path: '/journal',
    target: 'journal-entry',
    title: 'Write at your own pace',
    body: 'Add only what you want to record. Your journal is private unless you choose to share an entry with guidance.',
  },
  {
    path: '/journal',
    target: 'journal-save',
    title: 'Save a reflection',
    body: 'Select “Save Reflection” when you are ready. The tour will not create or save a sample entry.',
  },
  {
    path: '/journal',
    target: 'journal-timeline',
    title: 'Revisit past reflections',
    body: 'Your saved entries are collected in the Reflection Timeline for you to open and review.',
  },
  {
    path: '/peer-insights',
    target: 'peer-for-you',
    title: 'Explore recommendations',
    body: 'For You brings together coping ideas that may fit your recent check-ins and reflections.',
  },
  {
    path: '/peer-insights',
    target: 'peer-community-tab',
    title: 'Browse the community',
    body: 'Tap Community to explore strategies shared by students. The highlighted tab is interactive.',
    advanceOnTargetClick: true,
  },
  {
    path: '/peer-insights',
    target: 'peer-community',
    title: 'Find ideas that fit',
    body: 'Browse, search, or filter community strategies. You can save a favorite or mark a strategy helpful.',
  },
  {
    path: '/peer-insights',
    target: 'peer-share',
    title: 'Share a strategy',
    body: 'Have a helpful coping idea? Open the sharing form to contribute it to the community.',
    advanceOnTargetClick: true,
  },
  {
    path: '/peer-insights',
    target: 'peer-strategy-category',
    title: 'Describe your strategy',
    body: 'Choose a category, give your tip a clear title, and explain the steps. Trigger tags are optional.',
  },
  {
    path: '/peer-insights',
    target: 'peer-strategy-submit',
    title: 'Submit it for review',
    body: 'Shared strategies are reviewed before appearing in the community. Do not submit a test entry during the tour.',
  },
  {
    path: '/peer-insights',
    target: 'peer-strategy-close',
    title: 'Close the sharing form',
    body: 'Close the form without submitting, then open My Strategies to learn where your real submissions appear.',
    advanceOnTargetClick: true,
  },
  {
    path: '/peer-insights',
    target: 'peer-mine-tab',
    title: 'Open My Strategies',
    body: 'Tap this tab to check the review status of strategies you have shared.',
    advanceOnTargetClick: true,
  },
  {
    path: '/peer-insights',
    target: 'peer-my-strategies',
    title: 'Track your contributions',
    body: 'Your submissions and their review status are listed here. You can return to this tour from Profile anytime.',
  },
]

const COUNSELOR_STEPS = [
  {
    path: '/admin',
    target: 'staff-overview',
    title: 'Your Staff Hub',
    body: 'Start here for campus wellness summaries and a view of student check-ins.',
  },
  {
    path: '/admin/students',
    target: 'staff-student-monitor',
    title: 'Review student wellness',
    body: 'Use Monitor to review check-ins and record follow-up actions with care.',
  },
  {
    path: '/admin/moderation',
    target: 'staff-moderation',
    title: 'Review shared strategies',
    body: 'Moderation lets you review student-submitted coping strategies before they appear in Peer Insights.',
  },
  {
    path: '/admin/settings',
    target: 'staff-guide-setting',
    title: 'Return to this guide anytime',
    body: 'Open the user guide again from Settings whenever you need a refresher.',
  },
]

function findVisibleTarget(name) {
  const targets = Array.from(document.querySelectorAll(`[data-tour="${name}"]`))
  return targets.find(element => {
    const rect = element.getBoundingClientRect()
    const style = window.getComputedStyle(element)
    return rect.width > 0
      && rect.height > 0
      && style.display !== 'none'
      && style.visibility !== 'hidden'
  }) || null
}

export default function GuidedProductTour() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const tooltipRef = useRef(null)
  const [target, setTarget] = useState(null)
  const [targetRect, setTargetRect] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState(null)
  const [targetMissing, setTargetMissing] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const steps = user?.role === 'student' ? STUDENT_STEPS : COUNSELOR_STEPS
  const stepIndex = location.state?.guidedTourStep
  const active = ['student', 'counselor'].includes(user?.role)
    && Number.isInteger(stepIndex)
    && stepIndex >= 0
    && stepIndex < steps.length
  const step = active ? steps[stepIndex] : null
  const homePath = user?.role === 'student' ? '/dashboard' : '/admin'

  const goToStep = useCallback((index) => {
    if (index >= steps.length) {
      navigate(homePath, { replace: true, state: null })
      return
    }
    if (index < 0) return
    navigate(steps[index].path, {
      replace: true,
      state: { guidedTourStep: index },
    })
  }, [homePath, navigate, steps])

  const exitTour = useCallback(() => {
    navigate(homePath, { replace: true, state: null })
  }, [homePath, navigate])

  useEffect(() => {
    if (!step) {
      setTarget(null)
      setTargetRect(null)
      setTargetMissing(false)
      return undefined
    }

    if (location.pathname !== step.path) {
      navigate(step.path, {
        replace: true,
        state: { guidedTourStep: stepIndex },
      })
      return undefined
    }

    let cancelled = false
    let attempts = 0
    let timer

    const locateTarget = () => {
      if (cancelled) return
      const element = findVisibleTarget(step.target)
      if (element) {
        setTarget(element)
        setTargetMissing(false)
        element.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
        return
      }

      attempts += 1
      if (attempts < 30) {
        timer = window.setTimeout(locateTarget, 100)
      } else {
        setTarget(null)
        setTargetRect(null)
        setTargetMissing(true)
      }
    }

    setTarget(null)
    setTargetRect(null)
    setTargetMissing(false)
    timer = window.setTimeout(locateTarget, 50)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [location.pathname, navigate, retryCount, step, stepIndex])

  useEffect(() => {
    if (!target) return undefined

    const measure = () => {
      const rect = target.getBoundingClientRect()
      const next = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }
      setTargetRect(previous => (
        previous
        && previous.top === next.top
        && previous.left === next.left
        && previous.width === next.width
        && previous.height === next.height
          ? previous
          : next
      ))
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(target)

    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      observer?.disconnect()
    }
  }, [target])

  useEffect(() => {
    if (
      !step
      || !target
      || !step.advanceOnTargetClick
      || !['A', 'BUTTON'].includes(target.tagName)
    ) return undefined

    const handleTargetClick = () => {
      window.setTimeout(() => goToStep(stepIndex + 1), 0)
    }
    target.addEventListener('click', handleTargetClick)
    return () => target.removeEventListener('click', handleTargetClick)
  }, [goToStep, step, stepIndex, target])

  useEffect(() => {
    if (!active) return undefined
    const handleKeyDown = event => {
      if (event.key === 'Escape') exitTour()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active, exitTour])

  useEffect(() => {
    if (!targetRect || !tooltipRef.current) {
      setTooltipPosition(null)
      return
    }

    const width = Math.min(380, window.innerWidth - 32)
    const height = tooltipRef.current.getBoundingClientRect().height || 260
    const belowSpace = window.innerHeight - targetRect.top - targetRect.height
    const top = belowSpace >= height + 24
      ? targetRect.top + targetRect.height + 16
      : Math.max(12, targetRect.top - height - 16)
    const left = Math.max(
      16,
      Math.min(
        window.innerWidth - width - 16,
        targetRect.left + targetRect.width / 2 - width / 2,
      ),
    )
    setTooltipPosition({ top, left, width })
  }, [targetRect, stepIndex, targetMissing])

  if (!active || !step || typeof document === 'undefined') return null

  const targetIsInteractive = target
    && ['A', 'BUTTON'].includes(target.tagName)
    && step.advanceOnTargetClick

  return createPortal(
    <>
      {targetRect && !targetMissing && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[130] rounded-2xl border-2 border-primary-container"
          style={{
            top: targetRect.top - 5,
            left: targetRect.left - 5,
            width: targetRect.width + 10,
            height: targetRect.height + 10,
            boxShadow: '0 0 0 100vmax rgba(42, 31, 27, 0.68)',
          }}
        />
      )}

      <section
        ref={tooltipRef}
        aria-labelledby="guided-tour-title"
        aria-modal="false"
        className="fixed z-[140] w-[calc(100vw-2rem)] max-w-[23.75rem] rounded-3xl border border-outline-variant bg-surface-lowest/95 p-5 shadow-lift backdrop-blur-xl sm:p-6"
        role="dialog"
        style={tooltipPosition
          ? { top: tooltipPosition.top, left: tooltipPosition.left, width: tooltipPosition.width, maxHeight: 'min(70vh, 32rem)', overflowY: 'auto' }
          : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxHeight: 'min(70vh, 32rem)', overflowY: 'auto' }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
            {user?.role === 'student' ? 'Student tour' : 'Counselor tour'} · {stepIndex + 1} of {steps.length}
          </p>
          <button
            type="button"
            onClick={exitTour}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-low text-warm/60 transition hover:text-warm"
            aria-label="Exit guide"
          >
            <X size={17} />
          </button>
        </div>

        {targetMissing ? (
          <>
            <h2 id="guided-tour-title" className="font-jakarta text-lg font-extrabold text-warm">
              This part of the guide is unavailable
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-warm/70">
              The screen did not show the control this step needs. You can retry this step or exit the tour.
            </p>
            <button
              type="button"
              onClick={() => setRetryCount(count => count + 1)}
              className="mt-5 min-h-11 w-full rounded-full bg-primary-container px-5 text-sm font-bold text-[#3E3006]"
            >
              Retry this step
            </button>
          </>
        ) : (
          <>
            <h2 id="guided-tour-title" className="font-jakarta text-xl font-extrabold text-warm sm:text-2xl">
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-warm/70">
              {step.body}
            </p>
            {step.advanceOnTargetClick && (
              <p className="mt-3 rounded-xl bg-primary-container/20 px-3 py-2 text-xs font-semibold text-warm/75">
                Tap the highlighted control to continue.
              </p>
            )}
            <div className="mt-5 flex items-center justify-between gap-3">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => goToStep(stepIndex - 1)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-warm/65 transition hover:bg-surface-low"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              ) : (
                <span />
              )}
              {targetIsInteractive ? (
                <span className="text-xs font-semibold text-warm/50">Use the highlighted control</span>
              ) : (
                <button
                  type="button"
                  onClick={() => goToStep(stepIndex + 1)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-container px-5 text-sm font-bold text-[#3E3006] transition hover:shadow-glow"
                >
                  {stepIndex === steps.length - 1 ? 'Finish tour' : 'Next'}
                  {stepIndex === steps.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
                </button>
              )}
            </div>
          </>
        )}

        {!targetMissing && (
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-low" aria-hidden="true">
            <div
              className="h-full rounded-full bg-primary-container transition-all"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        )}
      </section>
    </>,
    document.body,
  )
}
