import React, { useState, useMemo, useEffect } from 'react';
import { Info, X, Sun, Droplets, Flame, Sparkles, Heart, Leaf, BookOpen, Check } from 'lucide-react';

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
    badge: '✨ Thriving Radiance',
    subtitle: 'Glowing with warmth and steady daily care. 🌻✨',
    face: 'joyful',
    badgeBg: '#FEF9E7',
    badgeText: '#755B00',
    badgeBorder: '#F6C945',
    glowColor: 'rgba(246, 201, 69, 0.40)',
    cardBg: 'linear-gradient(180deg, #FFFDF2 0%, #FFF8E4 50%, #FDF1CE 100%)',
    aura: '#F6C945',
  },
  blooming: {
    title: 'Blooming',
    badge: '🌱 Blooming',
    subtitle: 'Full of vitality — your mindful care keeps it strong.',
    face: 'happy',
    badgeBg: '#EAF5EE',
    badgeText: '#2D6B47',
    badgeBorder: '#81B29A',
    glowColor: 'rgba(129, 178, 154, 0.30)',
    cardBg: 'linear-gradient(180deg, #F8FDF9 0%, #ECF8F0 50%, #DCF2E4 100%)',
    aura: '#81B29A',
  },
  glowing: {
    title: 'Glowing',
    badge: '☀️ Glowing',
    subtitle: 'Gently glowing with your recent care today.',
    face: 'glowing',
    badgeBg: '#FFF8E7',
    badgeText: '#856404',
    badgeBorder: '#F6C945',
    glowColor: 'rgba(246, 201, 69, 0.25)',
    cardBg: 'linear-gradient(180deg, #FFFDF5 0%, #FFF5DF 50%, #FCEBCA 100%)',
    aura: '#E9C46A',
  },
  needs_care: {
    title: 'Needs a Little Care',
    badge: '💧 Needs a Little Care',
    subtitle: 'Your bloom could use a little care today. 🌻',
    face: 'tender',
    badgeBg: '#FFF9EE',
    badgeText: '#755B00',
    badgeBorder: '#E9C46A',
    glowColor: 'rgba(233, 196, 106, 0.20)',
    cardBg: 'linear-gradient(180deg, #FFFDF7 0%, #FFF4E2 50%, #FCE8CF 100%)',
    aura: '#E9C46A',
  },
  resting: {
    title: 'Resting',
    badge: '🌿 Resting',
    subtitle: 'Your bloom is still here — give it a moment of care whenever you are ready. 💛',
    face: 'resting',
    badgeBg: '#F5F5F0',
    badgeText: '#5D4037',
    badgeBorder: '#D1C5AE',
    glowColor: 'rgba(176, 207, 173, 0.25)',
    cardBg: 'linear-gradient(180deg, #FBF9F5 0%, #F5EFE6 50%, #EFE7DA 100%)',
    aura: '#B0CFAD',
  },
};

const CARE_MILESTONES = [
  { target: 3, label: 'Little Acts of Care', desc: 'Starting a gentle daily rhythm 🌱' },
  { target: 7, label: 'Growing Consistently', desc: 'A full week of intentional self-care 🌻' },
  { target: 14, label: 'Steady Care', desc: 'Cultivating enduring resilience ✨' },
  { target: 30, label: 'Deeply Nourished', desc: 'A month of honoring your well-being 💛' },
  { target: 60, label: 'Dedicated Care', desc: 'A lasting sanctuary of self-compassion ☀️' },
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

  const size = centerHero ? 180 : 90;

  return (
    <div className="relative w-full overflow-hidden select-none">
      <style>{`
        @keyframes gentleSwayOrganic {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1.2deg); }
        }
        @keyframes gentleBreatheScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes softGlowPulse {
          0%, 100% { opacity: 0.35; transform: scale(0.96); }
          50% { opacity: 0.65; transform: scale(1.06); }
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
        @keyframes gentleCareSway {
          0% { transform: rotate(0deg) scale(1); }
          30% { transform: rotate(-2deg) scale(1.04); }
          70% { transform: rotate(2deg) scale(1.03); }
          100% { transform: rotate(0deg) scale(1); }
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

      {/* ── Soft Ambient Card Environment (Solar Pulse Design) ── */}
      <div
        className="absolute inset-0 rounded-[2.4rem] transition-colors duration-1000 pointer-events-none"
        style={{ background: stateCfg.cardBg }}
      >
        {/* Soft Radial Center Sun Halo */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none transition-all duration-1000 blur-[45px]"
          style={{ background: stateCfg.glowColor }}
        />

        {/* Delicate Glasshouse Arch Accent */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 400 480" preserveAspectRatio="none">
          <path
            d="M 40 480 L 40 160 C 40 70, 360 70, 360 160 L 360 480"
            fill="none"
            stroke={stateCfg.aura}
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.5"
          />
        </svg>

        {/* Soft Garden Meadow Hills Base */}
        <div className="absolute bottom-0 inset-x-0 h-28 pointer-events-none overflow-hidden opacity-50">
          <svg viewBox="0 0 500 100" preserveAspectRatio="none" className="w-full h-full">
            <path d="M-10 100 Q 140 45 280 65 T 510 50 L 510 100 Z" fill="#B0CFAD" opacity="0.4" />
            <path d="M-10 100 Q 120 60 260 70 T 510 65 L 510 100 Z" fill="#81B29A" opacity="0.45" />
          </svg>
        </div>
      </div>

      {/* ── CARD CONTENT HIERARCHY ── */}
      <div className="relative z-10 p-5 sm:p-7 flex flex-col items-center">

        {/* ── Top Header: Bloom Status Pill & Guide Trigger ── */}
        <div className="w-full flex items-center justify-between gap-2 mb-3">
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
        </div>

        {/* ── INTERACTIVE FULLY-BLOOMED SUNFLOWER ── */}
        <div
          className="relative flex items-center justify-center cursor-pointer select-none group my-1"
          style={{ width: size + 40, height: size + 40 }}
          onClick={() => triggerCare('water', 'Your presence is a gentle gift to yourself. 🌻')}
          title="Click to give your sunflower a gentle moment of care 🌻"
          role="button"
          tabIndex={0}
          aria-label="Interactive Sunflower Companion. Click to nurture."
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              triggerCare('water', 'Your presence is a gentle gift to yourself. 🌻');
            }
          }}
        >
          {/* Ambient Breathing Solar Aura */}
          <div
            className="absolute inset-2 rounded-full pointer-events-none transition-all duration-1000"
            style={{
              background: `radial-gradient(circle, ${stateCfg.glowColor} 0%, rgba(246,201,69,0.06) 65%, transparent 80%)`,
              animation: 'softGlowPulse 4.5s ease-in-out infinite',
              filter: 'blur(12px)',
            }}
          />

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
              animation: isCaring
                ? 'gentleCareSway 1.8s ease-in-out'
                : 'gentleSwayOrganic 7s ease-in-out infinite',
              transformOrigin: '50% 85%',
            }}
          >
            <svg
              viewBox="0 0 200 200"
              width={size + 20}
              height={size + 20}
              className="overflow-visible filter drop-shadow-md"
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
              <g filter="url(#carePetalShadow)" style={{ transformOrigin: '100px 95px', animation: 'gentleBreatheScale 6s ease-in-out infinite' }}>
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
              <g filter="url(#carePetalShadow)" style={{ transformOrigin: '100px 95px' }}>
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
                  <ellipse cx="80" cy="104" rx="6" ry="3.5" fill="#FF7865" opacity="0.6" />
                  <ellipse cx="120" cy="104" rx="6" ry="3.5" fill="#FF7865" opacity="0.6" />

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
                    <g style={{ transformOrigin: '100px 93px' }}>
                      <path d="M81 93 Q85 96 89 93" stroke="#F1D7BE" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                      <path d="M111 93 Q115 96 119 93" stroke="#F1D7BE" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                      <path d="M95 104 Q100 107 105 104" stroke="#F1D7BE" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    </g>
                  )}
                </g>
              </g>
            </svg>
          </div>
        </div>

        {/* ── Subtitle / Gentle Affirmation ── */}
        <p className="text-xs text-[#5D4037]/75 font-medium text-center max-w-sm mx-auto mb-4 leading-relaxed">
          {stateCfg.subtitle}
        </p>

        {/* ── 3. CURRENT CARE STREAK ── */}
        <div className="w-full max-w-md bg-white/85 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white shadow-sm mb-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F6C945]/20 flex items-center justify-center text-[#755B00]">
                <Flame size={18} />
              </div>
              <div>
                <h3 className="font-jakarta font-extrabold text-sm sm:text-base text-[#3A2B25] leading-tight">
                  {streak} Day Care Streak
                </h3>
                <p className="text-[11px] text-[#5D4037]/65 font-medium">
                  {streak > 0
                    ? `You've cared for your bloom for ${streak} day${streak > 1 ? 's' : ''}.`
                    : 'A new day to gently care for your well-being.'}
                </p>
              </div>
            </div>

            <span className="text-xs font-black text-[#755B00] bg-[#FFF8E7] border border-[#F6C945]/40 px-2.5 py-1 rounded-xl whitespace-nowrap">
              🌻 {streak}d
            </span>
          </div>

          {/* ── 4. NEXT CARE MILESTONE (Replaces competitive Best Record) ── */}
          <div className="mt-3 pt-2.5 border-t border-[#5D4037]/10">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#5D4037]/70 mb-1.5">
              <span className="flex items-center gap-1">
                <Sparkles size={12} className="text-[#F6C945]" />
                Next Milestone: <strong className="text-[#5D4037] font-bold">{nextMilestone.label}</strong>
              </span>
              <span>
                {nextMilestone.daysLeft > 0
                  ? `${nextMilestone.daysLeft} day${nextMilestone.daysLeft > 1 ? 's' : ''} of care to go`
                  : 'Milestone reached! ✨'}
              </span>
            </div>

            {/* Gentle Progress Bar */}
            <div className="h-2 w-full bg-[#5D4037]/10 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(8, nextMilestone.progress)}%`,
                  background: 'linear-gradient(90deg, #F6C945 0%, #81B29A 100%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── 5. YOUR CARE JOURNEY (Compact 3-Pill Section) ── */}
        <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-2xl p-3 border border-white/60 shadow-sm">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#5D4037]/50">
              Your Care Journey
            </span>
            <span className="text-[10px] text-[#5D4037]/60 font-medium">
              {totalDays} total day{totalDays === 1 ? '' : 's'} nurtured
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Mood Check-ins */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/90 border border-[#5D4037]/10 shadow-sm text-center">
              <span className="text-base mb-0.5">💧</span>
              <span className="text-xs font-black text-[#3A2B25]">{careCounts.moods || totalDays}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#5D4037]/60">Check-ins</span>
            </div>

            {/* Journal Reflections */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/90 border border-[#5D4037]/10 shadow-sm text-center">
              <span className="text-base mb-0.5">🌿</span>
              <span className="text-xs font-black text-[#3A2B25]">{careCounts.journals || 0}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#5D4037]/60">Reflections</span>
            </div>

            {/* Wellness Resources */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/90 border border-[#5D4037]/10 shadow-sm text-center">
              <span className="text-base mb-0.5">☀️</span>
              <span className="text-xs font-black text-[#3A2B25]">{careCounts.resources || 0}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#5D4037]/60">Resources</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── ABOUT SUNFLOWER CARE MODAL (Compassionate Philosophy) ── */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3A2B25]/60 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowGuideModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-modal-title"
        >
          <div
            className="bg-[#FFFDF9] rounded-3xl w-full max-w-md shadow-2xl animate-scaleIn relative overflow-hidden flex flex-col max-h-[85vh] border border-[#5D4037]/15"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-[#5D4037]/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F6C945]/20 flex items-center justify-center text-[#755B00]">
                  <Sun className="w-4 h-4" />
                </div>
                <h3 id="guide-modal-title" className="font-jakarta font-bold text-[#3A2B25] text-base">
                  Your Sunflower Companion
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
              <div className="p-3.5 rounded-2xl bg-[#FFF9EE] border border-[#F6C945]/40 text-xs text-[#5D4037]/85 leading-relaxed font-medium">
                <p className="font-bold text-[#755B00] mb-1">🌻 "Your bloom is already here. Take care of it."</p>
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
                Continue Caring 🌻
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
