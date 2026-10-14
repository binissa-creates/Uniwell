import React, { useState, useMemo, useEffect } from 'react';
import { Info, X, Sun, Flame, Sparkles } from 'lucide-react';

/**
 * UniWell Gamified Sunflower Sanctuary
 * 
 * CORE METAPHOR:
 * "Your bloom is already here. Take care of it."
 * 
 * - The sunflower is ALWAYS already fully bloomed, healthy, and representing existing well-being.
 * - Actions care for the bloom:
 *     💧 Mood Check-in  = Watering
 *     🌿 Journaling     = Nourishing
 *     ☀️ Resources      = Sunlight
 * - Streak = Consistent Care (gentle habit, not competitive score).
 * - No final level or completion state — ongoing wellness care.
 */

const MOOD_VALUES = {
  rad: 5, glowing: 5, excited: 5, proud: 5, grateful: 5, motivated: 5,
  good: 4, hopeful: 4, calm: 4, relieved: 4, content: 4,
  meh: 3, neutral: 3, confused: 3,
  bad: 2, nervous: 2, frustrated: 2, lonely: 2, overwhelmed: 2, disappointed: 2, dissapointed: 2, embarrassed: 2,
  awful: 1, angry: 1, burned_out: 1,
};

function computeBloomState(streak, moodHistory = [], loggedToday = false) {
  const recent = moodHistory.slice(0, 7);
  const avgMood = recent.length > 0
    ? recent.reduce((sum, m) => sum + (MOOD_VALUES[m.mood_type] || 3), 0) / recent.length
    : 3;

  if (streak >= 7 && loggedToday) return 'thriving';
  if (streak >= 3 && loggedToday) return 'blooming';
  if (loggedToday) return 'glowing';
  if (streak > 0 && !loggedToday) return 'needs_care';
  return 'resting';
}

const BLOOM_STATES = {
  thriving: {
    title: 'Thriving Radiance',
    badge: 'Thriving Radiance',
    subtitle: 'Glowing with warmth and steady daily care.',
    face: 'joyful',
    badgeBg: '#FEF9E7',
    badgeText: '#755B00',
    badgeBorder: '#F6C945',
    glowColor: 'rgba(255, 190, 35, 0.62)',
    animation: 'thrivingBloom 3s ease-in-out infinite',
    auraAnimation: 'radiantAura 2.6s ease-in-out infinite',
    petalAnimation: 'petalBreathe 3.2s ease-in-out infinite',
    flowerFilter: 'saturate(1.4) brightness(1.12)',
  },
  blooming: {
    title: 'Blooming',
    badge: 'Blooming',
    subtitle: 'Full of vitality — your mindful care keeps it strong.',
    face: 'happy',
    badgeBg: '#EAF5EE',
    badgeText: '#2D6B47',
    badgeBorder: '#81B29A',
    glowColor: 'rgba(246, 201, 69, 0.5)',
    animation: 'bloomingSway 3.5s ease-in-out infinite',
    auraAnimation: 'radiantAura 3.2s ease-in-out infinite',
    petalAnimation: 'petalBreathe 4s ease-in-out infinite',
    flowerFilter: 'saturate(1.3) brightness(1.08)',
  },
  glowing: {
    title: 'Glowing',
    badge: 'Glowing',
    subtitle: 'Gently glowing with your recent care today.',
    face: 'glowing',
    badgeBg: '#FFF8E7',
    badgeText: '#856404',
    badgeBorder: '#F6C945',
    glowColor: 'rgba(255, 198, 58, 0.52)',
    animation: 'glowingLift 3s ease-in-out infinite',
    auraAnimation: 'radiantAura 3s ease-in-out infinite',
    petalAnimation: 'petalBreathe 4.5s ease-in-out infinite',
    flowerFilter: 'saturate(1.28) brightness(1.08)',
  },
  needs_care: {
    title: 'Needs a Little Care',
    badge: 'Needs a Little Care',
    subtitle: 'Your bloom could use a little care today.',
    face: 'tender',
    badgeBg: '#FFF9EE',
    badgeText: '#755B00',
    badgeBorder: '#E9C46A',
    glowColor: 'rgba(233, 196, 106, 0.18)',
    animation: 'gentleCareTilt 4.8s ease-in-out infinite',
    auraAnimation: 'tenderAura 4.8s ease-in-out infinite',
    petalAnimation: 'petalBreathe 7s ease-in-out infinite',
    flowerFilter: 'saturate(0.82) brightness(0.98)',
  },
  resting: {
    title: 'Resting',
    badge: 'Resting',
    subtitle: 'Your bloom is still here — give it a moment of care whenever you are ready.',
    face: 'resting',
    badgeBg: '#F5F5F0',
    badgeText: '#5D4037',
    badgeBorder: '#D1C5AE',
    glowColor: 'rgba(176, 207, 173, 0.25)',
    animation: 'restingSway 7s ease-in-out infinite',
    auraAnimation: 'restingAura 6s ease-in-out infinite',
    petalAnimation: 'petalBreathe 8s ease-in-out infinite',
    flowerFilter: 'saturate(0.72) brightness(0.94)',
  },
};

const CARE_MILESTONES = [
  { target: 3, label: 'Little Acts of Care', desc: 'Starting a gentle daily rhythm' },
  { target: 7, label: 'Growing Consistently', desc: 'A full week of intentional self-care' },
  { target: 14, label: 'Steady Care', desc: 'Cultivating enduring resilience' },
  { target: 30, label: 'Deeply Nourished', desc: 'A month of honoring your well-being' },
  { target: 60, label: 'Dedicated Care', desc: 'A lasting sanctuary of self-compassion' },
];

function getNextMilestone(streak) {
  for (const m of CARE_MILESTONES) {
    if (streak < m.target) {
      return {
        ...m,
        daysLeft: m.target - streak,
        progress: Math.min(100, Math.round((streak / m.target) * 100)),
      };
    }
  }
  return {
    target: 100,
    label: 'Dedicated Care Champion',
    desc: 'Remarkable consistency in nurturing your bloom 👑',
    daysLeft: 0,
    progress: 100,
  };
}

export default function SunflowerProgress({
  streak = 0,
  totalDays = 0,
  moodHistory = [],
  loggedToday = false,
  careCounts = { moods: 0, journals: 0, resources: 0 },
  activeCareType = null, // 'water' | 'nourish' | 'sunlight'
  centerHero = true,
  flowerOnly = false,
}) {
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isCaring, setIsCaring] = useState(false);
  const [careMessage, setCareMessage] = useState(null);
  const [gentleParticles, setGentleParticles] = useState([]);

  const bloomStateKey = useMemo(
    () => computeBloomState(streak, moodHistory, loggedToday),
    [streak, moodHistory, loggedToday]
  );
  const stateCfg = BLOOM_STATES[bloomStateKey] || BLOOM_STATES.glowing;
  const nextMilestone = useMemo(() => getNextMilestone(streak), [streak]);

  // Handle external or internal care action animations
  const triggerCare = (type = 'water', customMsg = null) => {
    setIsCaring(true);

    let msg = 'Your sunflower feels cared for. 🌻';
    if (type === 'nourish') msg = 'A moment of reflection can be nourishing. 🌿';
    if (type === 'sunlight') msg = 'Another little act of care. ☀️';
    if (customMsg) msg = customMsg;

    setCareMessage(msg);

    // Spawn gentle low-opacity particles
    const newItems = Array.from({ length: 3 }).map((_, i) => ({
      id: Date.now() + i,
      type,
      x: 35 + i * 15,
      y: 30 + (i % 2) * 15,
    }));
    setGentleParticles(newItems);

    setTimeout(() => {
      setIsCaring(false);
      setGentleParticles([]);
    }, 2800);

    setTimeout(() => {
      setCareMessage(null);
    }, 3800);
  };

  useEffect(() => {
    if (activeCareType) {
      triggerCare(activeCareType);
    }
  }, [activeCareType]);

  useEffect(() => {
    if (!showGuideModal) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowGuideModal(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showGuideModal]);

  const size = centerHero ? (flowerOnly ? 224 : 196) : 90;

  return (
    <div className={`relative w-full select-none ${flowerOnly ? 'overflow-visible' : 'overflow-hidden rounded-[1.8rem]'}`}>
      <style>{`
        @keyframes thrivingBloom {
          0%, 100% { transform: rotate(-2.5deg) translateY(0) scale(1); }
          30% { transform: rotate(1.5deg) translateY(-9px) scale(1.075); }
          65% { transform: rotate(2.5deg) translateY(-4px) scale(1.04); }
        }
        @keyframes bloomingSway {
          0%, 100% { transform: rotate(-2.8deg) translateY(0) scale(1); }
          50% { transform: rotate(2.8deg) translateY(-5px) scale(1.055); }
        }
        @keyframes glowingLift {
          0%, 100% { transform: translateY(2px) scale(1); }
          50% { transform: translateY(-9px) scale(1.065); }
        }
        @keyframes gentleCareTilt {
          0%, 100% { transform: rotate(-1.8deg) translateY(0); }
          50% { transform: rotate(1.2deg) translateY(-2px); }
        }
        @keyframes restingSway {
          0%, 100% { transform: rotate(-0.8deg) translateY(1px); }
          50% { transform: rotate(0.8deg) translateY(-1px); }
        }
        @keyframes radiantAura {
          0%, 100% { opacity: 0.62; transform: scale(0.86); }
          50% { opacity: 1; transform: scale(1.18); }
        }
        @keyframes radiantHalo {
          0%, 100% { opacity: 0.72; }
          50% { opacity: 1; }
        }
        @keyframes gardenAura {
          0%, 100% { opacity: 0.3; transform: scale(0.92); }
          50% { opacity: 0.7; transform: scale(1.08); }
        }
        @keyframes tenderAura {
          0%, 100% { opacity: 0.22; transform: scale(0.94); }
          50% { opacity: 0.52; transform: scale(1.05); }
        }
        @keyframes restingAura {
          0%, 100% { opacity: 0.2; transform: scale(0.96); }
          50% { opacity: 0.4; transform: scale(1.03); }
        }
        @keyframes petalBreathe {
          0%, 100% { transform: scale(0.985); }
          50% { transform: scale(1.055); }
        }
        @keyframes sparkleDrift {
          0%, 100% { opacity: 0.15; transform: translateY(4px) scale(0.7) rotate(0deg); }
          50% { opacity: 1; transform: translateY(-7px) scale(1.15) rotate(35deg); }
        }
        @keyframes softEyeBlink {
          0%, 92%, 98%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.12); }
        }
        @keyframes waterDropFloat {
          0% { opacity: 0; transform: translateY(-20px) scale(0.7); }
          30% { opacity: 0.85; }
          100% { opacity: 0; transform: translateY(35px) scale(1); }
        }
        @keyframes careDance {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-5deg) translateY(-7px) scale(1.06); }
          55% { transform: rotate(4deg) translateY(-3px) scale(1.035); }
          80% { transform: rotate(-2deg) translateY(-5px) scale(1.05); }
        }
        @keyframes sunWarmthRise {
          0% { opacity: 0; transform: translateY(10px) scale(0.6); }
          50% { opacity: 0.7; }
          100% { opacity: 0; transform: translateY(-25px) scale(1.1); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* ── Soft Botanical Card Environment ── */}
      <div
      className={`sunflower-environment absolute inset-0 pointer-events-none ${flowerOnly ? '' : 'rounded-[1.8rem]'}`}
      style={{ background: flowerOnly ? 'transparent' : undefined }}
      >
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none ${
            flowerOnly ? 'h-[25rem] w-[25rem]' : 'h-72 w-72 blur-[52px]'
          }`}
          style={{
            background: flowerOnly
              ? 'radial-gradient(ellipse, rgba(255, 190, 35, 0.48) 0%, rgba(255, 201, 67, 0.28) 30%, rgba(255, 218, 120, 0.12) 52%, transparent 72%)'
              : stateCfg.glowColor,
            animation: flowerOnly ? 'radiantHalo 2.6s ease-in-out infinite' : undefined,
          }}
        />
        {!flowerOnly && <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#81B29A]/10 blur-3xl" />}
      </div>

      {/* ── CARD CONTENT HIERARCHY ── */}
      <div className={`relative z-10 flex flex-col items-center ${flowerOnly ? 'p-1' : 'p-4 sm:p-5'}`}>

        {/* ── Top Header: Bloom Status Pill & Guide Trigger ── */}
        {!flowerOnly && <div className="w-full flex items-center justify-between gap-2 mb-1">
          <div
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border shadow-sm backdrop-blur-md transition-colors"
            style={{
              background: stateCfg.badgeBg,
              color: stateCfg.badgeText,
              borderColor: `${stateCfg.badgeBorder}60`,
            }}
          >
            <span>{stateCfg.badge}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-white/80 hover:bg-white text-[#5D4037]/70 hover:text-[#5D4037] border border-[#5D4037]/15 transition font-semibold shadow-sm"
            aria-label="About your sunflower companion"
          >
            <Info className="w-3.5 h-3.5 text-[#F6C945]" />
            <span className="hidden sm:inline">About Care</span>
          </button>
        </div>}

        {/* ── INTERACTIVE FULLY-BLOOMED SUNFLOWER ── */}
        <div className="flex flex-col items-center justify-center">
          <div
            className="relative flex items-center justify-center cursor-pointer select-none group my-0.5"
            style={{ width: size + 56, height: size + 56 }}
            onClick={flowerOnly ? undefined : () => triggerCare('water', 'Your presence is a gentle gift to yourself. 🌻')}
            title={flowerOnly ? undefined : 'Click to give your sunflower a gentle moment of care 🌻'}
            role={flowerOnly ? undefined : 'button'}
            tabIndex={flowerOnly ? undefined : 0}
            aria-label={flowerOnly ? undefined : 'Interactive Sunflower Companion. Click to nurture.'}
            onKeyDown={(e) => {
              if (flowerOnly) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerCare('water', 'Your presence is a gentle gift to yourself. 🌻');
              }
            }}
          >
            {/* Ambient Breathing Solar Aura */}
            <div
              className="sunflower-aura absolute inset-0 rounded-full pointer-events-none transition-all duration-1000"
              style={{
                background: `radial-gradient(circle, ${stateCfg.glowColor} 0%, rgba(246,201,69,0.18) 42%, transparent 74%)`,
                animation: stateCfg.auraAnimation,
              }}
            />

            {['glowing', 'blooming', 'thriving'].includes(bloomStateKey) && (
              <>
                {[
                  { top: '12%', left: '22%', delay: '0s', size: 14 },
                  { top: '22%', right: '14%', delay: '0.8s', size: 11 },
                  { bottom: '28%', left: '13%', delay: '1.4s', size: 12 },
                  { bottom: '22%', right: '15%', delay: '0.4s', size: 15 },
                ].map((sparkle, index) => (
                  <Sparkles
                    key={`bloom-sparkle-${index}`}
                    aria-hidden="true"
                    className="absolute text-[#E9A900] drop-shadow-sm pointer-events-none"
                    size={sparkle.size}
                    style={{
                      top: sparkle.top,
                      right: sparkle.right,
                      bottom: sparkle.bottom,
                      left: sparkle.left,
                      animation: `sparkleDrift ${2.2 + index * 0.25}s ease-in-out ${sparkle.delay} infinite`,
                    }}
                  />
                ))}
              </>
            )}

            {/* Gentle Care Particles (Water droplets / Sun warmth) */}
            {gentleParticles.map((p) => (
              <div
                key={p.id}
                className="absolute pointer-events-none z-30"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  animation: p.type === 'water' ? 'waterDropFloat 1.8s ease-in forwards' : 'sunWarmthRise 2s ease-out forwards',
                }}
              >
                {p.type === 'water' ? (
                  <div className="w-2.5 h-3.5 rounded-full bg-[#64B5F6]/80 shadow-sm border border-white/60" />
                ) : (
                  <Sparkles size={16} className="text-[#F6C945] opacity-75" />
                )}
              </div>
            ))}

            {/* Calming Care Feedback Bubble */}
            {careMessage && (
              <div className="absolute -top-7 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-lg border border-[#F6C945]/40 text-xs font-bold text-[#5D4037] z-40 animate-scaleIn flex items-center gap-1.5 whitespace-nowrap">
                <span>{careMessage}</span>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-b border-r border-[#F6C945]/40" />
              </div>
            )}

          {/* ── Always Fully-Bloomed 3D Sunflower Graphic ── */}
          <div
            className="relative z-10 transition-transform duration-500 group-hover:scale-105"
            style={{
              animation: isCaring ? 'careDance 1.8s ease-in-out' : stateCfg.animation,
              transformOrigin: '50% 85%',
            }}
          >
            <svg
              viewBox="0 0 200 200"
              width={size + 20}
              height={size + 20}
              className="overflow-visible"
              style={{ filter: `${stateCfg.flowerFilter} var(--color-sunflower-flower-shadow)` }}
            >
              <defs>
                {/* 3D Front Petals Gradient */}
                <linearGradient id="carePetalFront" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFE372" />
                  <stop offset="65%" stopColor="#F6C945" />
                  <stop offset="100%" stopColor="#E5A500" />
                </linearGradient>

                {/* 3D Back Petals Gradient */}
                <linearGradient id="carePetalBack" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#EBAF00" />
                  <stop offset="60%" stopColor="#D48800" />
                  <stop offset="100%" stopColor="#B26B00" />
                </linearGradient>

                {/* 3D Center Disc Radial Gradient */}
                <radialGradient id="careCenterDisc" cx="42%" cy="40%" r="58%">
                  <stop offset="0%" stopColor="#543A2A" />
                  <stop offset="65%" stopColor="#382419" />
                  <stop offset="100%" stopColor="#22140D" />
                </radialGradient>

                {/* Stem & Leaf Gradients */}
                <linearGradient id="careStemGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4D8A3F" />
                  <stop offset="50%" stopColor="#6DAF5A" />
                  <stop offset="100%" stopColor="#3E7232" />
                </linearGradient>

                <linearGradient id="careLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8AC678" />
                  <stop offset="100%" stopColor="#417D33" />
                </linearGradient>

                {/* Soft Shadows */}
                <filter id="carePetalShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#2A1605" floodOpacity="0.20" />
                </filter>
                <filter id="careDiscShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.28" />
                </filter>
              </defs>

              {/* ── Stem and Leaves (Base) ── */}
              <g style={{ transformOrigin: '100px 190px' }}>
                <path
                  d="M100 120 Q101 155 99 190"
                  stroke="url(#careStemGrad)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Left Leaf */}
                <path
                  d="M96 155 C70 150 50 135 42 145 C48 162 76 172 96 163 Z"
                  fill="url(#careLeafGrad)"
                  stroke="#3E7232"
                  strokeWidth="0.8"
                  filter="url(#carePetalShadow)"
                />
                <path d="M96 158 Q68 152 46 146" stroke="#A7DFA0" strokeWidth="1" fill="none" opacity="0.6" />

                {/* Right Leaf */}
                <path
                  d="M102 145 C128 138 150 122 158 132 C152 150 124 162 102 153 Z"
                  fill="url(#careLeafGrad)"
                  stroke="#3E7232"
                  strokeWidth="0.8"
                  filter="url(#carePetalShadow)"
                />
                <path d="M102 148 Q130 140 154 133" stroke="#A7DFA0" strokeWidth="1" fill="none" opacity="0.6" />
              </g>

              {/* ── Back Layer of Fully-Bloomed Petals (14 Petals) ── */}
              <g filter="url(#carePetalShadow)" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: stateCfg.petalAnimation }}>
                {Array.from({ length: 14 }).map((_, i) => {
                  const angle = (i * 360) / 14 + 12.8;
                  return (
                    <path
                      key={`back-${i}`}
                      d="M100 95 C90 60 88 32 100 18 C112 32 110 60 100 95 Z"
                      fill="url(#carePetalBack)"
                      stroke="#B26B00"
                      strokeWidth="0.7"
                      transform={`rotate(${angle} 100 95)`}
                      opacity="0.95"
                    />
                  );
                })}
              </g>

              {/* ── Front Layer of Fully-Bloomed Golden Petals (14 Petals) ── */}
              <g filter="url(#carePetalShadow)" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: stateCfg.petalAnimation }}>
                {Array.from({ length: 14 }).map((_, i) => {
                  const angle = (i * 360) / 14;
                  return (
                    <g key={`front-${i}`} transform={`rotate(${angle} 100 95)`}>
                      <path
                        d="M100 95 C88 62 86 36 100 22 C114 36 112 62 100 95 Z"
                        fill="url(#carePetalFront)"
                        stroke="#D48800"
                        strokeWidth="0.7"
                      />
                      {/* Petal Center Crease */}
                      <path
                        d="M100 32 L100 80"
                        stroke="#FFFFFF"
                        strokeWidth="0.9"
                        strokeLinecap="round"
                        opacity="0.3"
                      />
                    </g>
                  );
                })}
              </g>

              {/* ── 3D Center Seed Disc ── */}
              <g filter="url(#careDiscShadow)">
                <circle cx="100" cy="95" r="41" fill="#1C0E07" opacity="0.35" />
                <circle cx="100" cy="95" r="39" fill="url(#careCenterDisc)" stroke="#6F4D35" strokeWidth="2" />

                {/* Subtle Fibonacci Seed Texture */}
                <g opacity="0.35">
                  {[
                    [-22, -10], [-10, -22], [10, -22], [22, -10],
                    [-25, 6], [-12, 22], [12, 22], [25, 6],
                    [-14, -6], [0, -16], [14, -6],
                    [-8, 12], [8, 12], [0, 0],
                  ].map(([dx, dy], idx) => (
                    <circle
                      key={idx}
                      cx={100 + dx}
                      cy={95 + dy}
                      r={idx % 2 === 0 ? '1.8' : '1.2'}
                      fill="#F6C945"
                    />
                  ))}
                </g>

                {/* ── Expressive, Gentle Animated Face ── */}
                <g style={{ transformOrigin: '100px 95px' }}>
                  {/* Soft Rosy Cheeks */}
                  <ellipse
                    cx="80"
                    cy="104"
                    rx="6"
                    ry="3.5"
                    fill="#FF7865"
                    opacity={stateCfg.face === 'resting' ? '0.28' : '0.6'}
                  />
                  <ellipse
                    cx="120"
                    cy="104"
                    rx="6"
                    ry="3.5"
                    fill="#FF7865"
                    opacity={stateCfg.face === 'resting' ? '0.28' : '0.6'}
                  />

                  {/* Facial Expressions based on wellness state */}
                  {stateCfg.face === 'joyful' && (
                    <g style={{ animation: 'softEyeBlink 4s infinite', transformOrigin: '100px 93px' }}>
                      <circle cx="85" cy="91" r="5.2" fill="#FFFFFF" />
                      <circle cx="85" cy="91" r="4" fill="#22140D" />
                      <circle cx="83.5" cy="89.5" r="1.6" fill="#FFFFFF" />
                      <circle cx="86.5" cy="92.5" r="0.7" fill="#FFFFFF" />

                      <circle cx="115" cy="91" r="5.2" fill="#FFFFFF" />
                      <circle cx="115" cy="91" r="4" fill="#22140D" />
                      <circle cx="113.5" cy="89.5" r="1.6" fill="#FFFFFF" />
                      <circle cx="116.5" cy="92.5" r="0.7" fill="#FFFFFF" />
                      <path d="M92 102 Q100 112 108 102" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" fill="#FF6B6B" />
                    </g>
                  )}

                  {(stateCfg.face === 'happy' || stateCfg.face === 'glowing') && (
                    <g style={{ animation: 'softEyeBlink 5s infinite', transformOrigin: '100px 93px' }}>
                      <path d="M80 92 Q85 85 90 92" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                      <path d="M110 92 Q115 85 120 92" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                      <path d="M93 102 Q100 109 107 102" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                    </g>
                  )}

                  {stateCfg.face === 'tender' && (
                    <g style={{ transformOrigin: '100px 93px' }}>
                      <circle cx="85" cy="92" r="3.8" fill="#F1D7BE" />
                      <circle cx="115" cy="92" r="3.8" fill="#F1D7BE" />
                      <path d="M94 104 Q100 108 106 104" stroke="#F1D7BE" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </g>
                  )}

                  {stateCfg.face === 'resting' && (
                    <g style={{ transformOrigin: '100px 93px', animation: 'softEyeBlink 7s infinite' }}>
                      <ellipse cx="85" cy="92" rx="5.5" ry="6.5" fill="#FFF8E9" />
                      <ellipse cx="115" cy="92" rx="5.5" ry="6.5" fill="#FFF8E9" />
                      <circle cx="85" cy="95" r="3.2" fill="#382419" />
                      <circle cx="115" cy="95" r="3.2" fill="#382419" />
                      <circle cx="84" cy="94" r="1.1" fill="#FFFFFF" />
                      <circle cx="114" cy="94" r="1.1" fill="#FFFFFF" />
                      <path d="M94 106 Q100 102 106 106" stroke="#F1D7BE" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                      <path d="M76 99 C73 103 74 106 77 106 C80 106 80 103 76 99Z" fill="#9ED8E8" opacity="0.85" />
                    </g>
                  )}
                </g>
              </g>
            </svg>
          </div>
          </div>

        </div>

      </div>

      {/* ── ABOUT SUNFLOWER CARE MODAL (Compassionate Philosophy) ── */}
      {!flowerOnly && showGuideModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#3A2B25]/60 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowGuideModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-modal-title"
        >
          <div
            className="bg-[#FFFDF9] rounded-3xl w-full max-w-lg shadow-2xl animate-scaleIn relative overflow-hidden flex flex-col max-h-[85vh] border border-[#5D4037]/15"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-[#5D4037]/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F6C945]/20 flex items-center justify-center text-[#755B00]">
                  <Sun className="w-4 h-4" />
                </div>
                <h3 id="guide-modal-title" className="font-jakarta font-bold text-[#3A2B25] text-base">
                  Your Bloom & Care Journey
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-7 h-7 rounded-full bg-[#5D4037]/10 flex items-center justify-center text-[#5D4037]/60 hover:text-[#5D4037] transition"
                aria-label="Close modal"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto space-y-4 custom-scrollbar">
              <section className="rounded-2xl bg-gradient-to-br from-[#FFF8E7] via-[#FFFCF6] to-[#EDF6EF] border border-[#E9C46A]/45 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-white/90 border border-[#F6C945]/30 flex items-center justify-center text-[#755B00] shadow-sm">
                      <Flame size={19} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#755B00]/70">Current care streak</p>
                      <p className="font-jakarta text-lg font-extrabold text-[#3A2B25] leading-tight">
                        {streak} day{streak === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold border"
                    style={{
                      background: stateCfg.badgeBg,
                      color: stateCfg.badgeText,
                      borderColor: `${stateCfg.badgeBorder}80`,
                    }}
                  >
                    {stateCfg.badge}
                  </span>
                </div>
                <p className="text-[11px] text-[#5D4037]/70 mt-2">{stateCfg.subtitle}</p>

                <div className="mt-3 pt-3 border-t border-[#5D4037]/10">
                  <div className="flex items-center justify-between gap-2 text-[11px] mb-1.5">
                    <span className="flex items-center gap-1 font-semibold text-[#5D4037]/75">
                      <Sparkles size={12} className="text-[#D99A00]" />
                      Next: <strong className="text-[#3A2B25]">{nextMilestone.label}</strong>
                    </span>
                    <span className="text-[#5D4037]/65 text-right">
                      {nextMilestone.daysLeft > 0
                        ? `${nextMilestone.daysLeft} day${nextMilestone.daysLeft === 1 ? '' : 's'} to go`
                        : 'Milestone reached!'}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full bg-white/90 overflow-hidden"
                    role="progressbar"
                    aria-label="Progress to next care milestone"
                    aria-valuenow={nextMilestone.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(8, nextMilestone.progress)}%`,
                        background: 'linear-gradient(90deg, #F6C945 0%, #81B29A 100%)',
                      }}
                    />
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-[#5D4037]/60">Your care journey</h4>
                  <span className="text-[10px] text-[#5D4037]/55">{totalDays} total days nurtured</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: '💧', value: careCounts.moods || totalDays, label: 'Check-ins' },
                    { icon: '🌿', value: careCounts.journals || 0, label: 'Reflections' },
                    { icon: '☀️', value: careCounts.resources || 0, label: 'Resources' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-white border border-[#5D4037]/10 p-2.5 text-center shadow-sm">
                      <span className="text-base" aria-hidden="true">{item.icon}</span>
                      <p className="text-xs font-black text-[#3A2B25]">{item.value}</p>
                      <p className="text-[9px] font-bold uppercase tracking-wide text-[#5D4037]/55">{item.label}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="p-3.5 rounded-2xl bg-[#FFF9EE] border border-[#F6C945]/40 text-xs text-[#5D4037]/85 leading-relaxed font-medium">
                <p className="font-bold text-[#755B00] mb-1">"Your bloom is already here. Take care of it."</p>
                Your sunflower is a living symbol of your well-being. It is already fully bloomed because your inherent worth is always present. Your daily actions are how you care for and nurture it.
              </div>

              {/* Acts of Care */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#5D4037]/60">
                  Daily Acts of Care
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-[#5D4037]/10">
                    <span className="text-base">💧</span>
                    <div>
                      <span className="font-bold text-[#3A2B25]">Mood Logging = Watering</span>
                      <p className="text-[11px] text-[#5D4037]/60">Checking in with your feelings quenches your emotional garden.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-[#5D4037]/10">
                    <span className="text-base">🌿</span>
                    <div>
                      <span className="font-bold text-[#3A2B25]">Journaling = Nourishing</span>
                      <p className="text-[11px] text-[#5D4037]/60">Writing reflections feeds your mind with self-discovery.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-[#5D4037]/10">
                    <span className="text-base">☀️</span>
                    <div>
                      <span className="font-bold text-[#3A2B25]">Wellness Resources = Sunlight</span>
                      <p className="text-[11px] text-[#5D4037]/60">Exploring coping strategies and wisdom brings warmth and light.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gentle Milestones */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#5D4037]/60">
                  Gentle Care Milestones
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {CARE_MILESTONES.map((m) => (
                    <div key={m.target} className="p-2.5 rounded-xl bg-white border border-[#5D4037]/10">
                      <div className="font-bold text-[#755B00]">{m.target} Days</div>
                      <div className="text-[11px] font-semibold text-[#3A2B25]">{m.label}</div>
                      <div className="text-[10px] text-[#5D4037]/50 mt-0.5">{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#EAF5EE] border border-[#81B29A]/40 text-[11px] text-[#2D6B47] leading-relaxed">
                <strong>💛 Compassionate Reminder:</strong> Missing a day is not a failure. Your sunflower never wilts away or dies. Welcome back anytime!
              </div>
            </div>

            <div className="px-6 py-3.5 bg-[#FDF9F2] border-t border-[#5D4037]/10 text-right">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 rounded-xl bg-[#3A2B25] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5D4037] transition shadow-sm"
              >
                Continue Caring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
