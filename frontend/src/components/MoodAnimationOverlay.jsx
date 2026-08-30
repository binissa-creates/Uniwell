import React, { useEffect, useState } from 'react';
import { Heart, Sun, Sparkles, X, CloudRain, Leaf, Wind } from 'lucide-react';

const PETAL_COUNT = 24;
const RAIN_COUNT = 20;
const LEAF_COUNT = 14;
const SPARKLE_COUNT = 18;

// Golden Sunflower Petals
const PETALS = Array.from({ length: PETAL_COUNT }, (_, index) => ({
  left: 2 + ((index * 21) % 96),
  delay: (index % 8) * 0.35,
  duration: 4.2 + (index % 4) * 0.7,
  scale: 0.8 + (index % 3) * 0.35,
  rotation: (index * 37) % 360,
  opacity: 0.85 + (index % 3) * 0.05,
}));

// Gentle Glowing Rain Streaks
const RAIN_DROPS = Array.from({ length: RAIN_COUNT }, (_, index) => ({
  left: 5 + ((index * 27) % 90),
  delay: (index % 6) * 0.25,
  duration: 1.6 + (index % 4) * 0.3,
  height: 24 + (index % 3) * 16,
  opacity: 0.6 + (index % 3) * 0.15,
}));

// Floating Breeze Leaves
const LEAVES = Array.from({ length: LEAF_COUNT }, (_, index) => ({
  left: 5 + ((index * 31) % 88),
  delay: (index % 5) * 0.45,
  duration: 5.0 + (index % 3) * 0.8,
  scale: 0.75 + (index % 3) * 0.3,
  rotation: (index * 53) % 360,
}));

// Shimmer Sparkles
const SPARKLES = Array.from({ length: SPARKLE_COUNT }, (_, index) => ({
  left: 8 + ((index * 37) % 84),
  top: 10 + ((index * 23) % 80),
  delay: (index % 5) * 0.3,
  size: 14 + (index % 3) * 6,
}));

// Crisp SVG Sunflower Petal Component
function SunflowerPetalSVG({ scale = 1, rotation = 0 }) {
  return (
    <svg
      width={32 * scale}
      height={48 * scale}
      viewBox="0 0 32 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: 'drop-shadow(0 6px 12px rgba(246, 201, 69, 0.45))',
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <defs>
        <linearGradient id={`petalGrad-${rotation}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF176" />
          <stop offset="40%" stopColor="#F6C945" />
          <stop offset="100%" stopColor="#E69500" />
        </linearGradient>
      </defs>
      <path
        d="M16 2C22 12 30 22 28 34C26 42 20 46 16 46C12 46 6 42 4 34C2 22 10 12 16 2Z"
        fill={`url(#petalGrad-${rotation})`}
      />
      {/* Delicate central petal vein */}
      <path
        d="M16 8C16 20 16 34 16 42"
        stroke="#D98200"
        strokeWidth="1.2"
        strokeOpacity="0.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Crisp SVG Falling Leaf Component
function FloatingLeafSVG({ scale = 1, rotation = 0 }) {
  return (
    <svg
      width={28 * scale}
      height={38 * scale}
      viewBox="0 0 28 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: 'drop-shadow(0 4px 8px rgba(112, 168, 105, 0.35))',
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <defs>
        <linearGradient id={`leafGrad-${rotation}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C8E6C9" />
          <stop offset="60%" stopColor="#81C784" />
          <stop offset="100%" stopColor="#43A047" />
        </linearGradient>
      </defs>
      <path
        d="M14 2C24 10 26 24 22 30C18 36 10 36 6 30C2 24 4 10 14 2Z"
        fill={`url(#leafGrad-${rotation})`}
      />
      <path
        d="M14 6C14 16 14 28 14 34"
        stroke="#2E7D32"
        strokeWidth="1"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const MOOD_THEMES = {
  // Radiant Bloom (Positive)
  rad: {
    title: 'Your Radiance is Blooming',
    message: 'Let this golden energy settle in and nourish your garden.',
    style: 'radiant',
    icon: Sun,
    accentColor: '#F6C945',
    pillBg: 'bg-[#F6C945]/20',
    pillText: 'text-[#856804]',
    tag: 'Sunflower Bloom'
  },
  good: {
    title: 'A Beautiful Moment Kept',
    message: 'Good days build our inner warmth. Savor this lightness.',
    style: 'radiant',
    icon: Sun,
    accentColor: '#F6C945',
    pillBg: 'bg-[#F6C945]/20',
    pillText: 'text-[#856804]',
    tag: 'Gentle Warmth'
  },
  excited: {
    title: 'Sparkling Energy',
    message: 'Your passion and enthusiasm light up the path ahead.',
    style: 'radiant',
    icon: Sparkles,
    accentColor: '#F6C945',
    pillBg: 'bg-[#F6C945]/20',
    pillText: 'text-[#856804]',
    tag: 'Vitality'
  },
  proud: {
    title: 'Honoring Your Growth',
    message: 'Look at the steady progress you have nurtured so far.',
    style: 'radiant',
    icon: Sparkles,
    accentColor: '#F6C945',
    pillBg: 'bg-[#F6C945]/20',
    pillText: 'text-[#856804]',
    tag: 'Milestone'
  },

  // Soothing Shelter (Heavy / Vulnerable)
  bad: {
    title: 'Sending a Soft Hug',
    message: 'You do not have to carry everything all at once. Take a gentle breath.',
    style: 'shelter',
    icon: Heart,
    accentColor: '#A8C5A0',
    pillBg: 'bg-[#b0cfad]/30',
    pillText: 'text-[#2e4d2a]',
    tag: 'Gentle Shelter'
  },
  awful: {
    title: 'Holding Space for You',
    message: 'This is just a stormy chapter, not your whole story. Even sunflowers need rain to bloom.',
    style: 'shelter',
    icon: CloudRain,
    accentColor: '#A8C5A0',
    pillBg: 'bg-[#b0cfad]/30',
    pillText: 'text-[#2e4d2a]',
    tag: 'Nurturing Rain'
  },
  burned_out: {
    title: 'Permission to Rest',
    message: 'Rest is not lost time; it is the water that allows you to bloom again.',
    style: 'shelter',
    icon: Leaf,
    accentColor: '#A8C5A0',
    pillBg: 'bg-[#b0cfad]/30',
    pillText: 'text-[#2e4d2a]',
    tag: 'Restorative Quiet'
  },
  lonely: {
    title: 'You Are Not Forgotten',
    message: 'Your presence matters in this sanctuary. Be gentle with your tender heart today.',
    style: 'shelter',
    icon: Heart,
    accentColor: '#A8C5A0',
    pillBg: 'bg-[#b0cfad]/30',
    pillText: 'text-[#2e4d2a]',
    tag: 'Compassion'
  },
  frustrated: {
    title: 'Let the Breath Release It',
    message: 'Your feelings are valid. Release the tension with one long, slow exhale.',
    style: 'shelter',
    icon: Wind,
    accentColor: '#A8C5A0',
    pillBg: 'bg-[#b0cfad]/30',
    pillText: 'text-[#2e4d2a]',
    tag: 'Grounding'
  },
  angry: {
    title: 'Honoring Your Voice',
    message: 'Strong feelings show that you care. Give yourself space before responding.',
    style: 'shelter',
    icon: Wind,
    accentColor: '#A8C5A0',
    pillBg: 'bg-[#b0cfad]/30',
    pillText: 'text-[#2e4d2a]',
    tag: 'Inner Balance'
  },

  // Reflective & Peaceful (Neutral / Calm)
  calm: {
    title: 'Serene Equilibrium',
    message: 'A quiet mind is a profound sanctuary. Breathe in this stillness.',
    style: 'breeze',
    icon: Leaf,
    accentColor: '#A8C5A0',
    pillBg: 'bg-[#b0cfad]/25',
    pillText: 'text-[#2e4d2a]',
    tag: 'Still Waters'
  },
  content: {
    title: 'Grounded Peace',
    message: 'Finding comfort in the present moment is a quiet victory.',
    style: 'breeze',
    icon: Leaf,
    accentColor: '#A8C5A0',
    pillBg: 'bg-[#b0cfad]/25',
    pillText: 'text-[#2e4d2a]',
    tag: 'Contentment'
  },
  grateful: {
    title: 'Gratitude Makes Room for Warmth',
    message: 'Noticing small blessings creates a fertile ground for daily peace.',
    style: 'radiant',
    icon: Sparkles,
    accentColor: '#F6C945',
    pillBg: 'bg-[#F6C945]/20',
    pillText: 'text-[#856804]',
    tag: 'Golden Gratitude'
  },
  hopeful: {
    title: 'Hope Takes Root',
    message: 'Even the smallest light can guide the sunflower toward the dawn.',
    style: 'radiant',
    icon: Sun,
    accentColor: '#F6C945',
    pillBg: 'bg-[#F6C945]/20',
    pillText: 'text-[#856804]',
    tag: 'Morning Sun'
  },
  nervous: {
    title: 'Take This One Step at a Time',
    message: 'Uncertainty is natural. Ground your feet and focus on your next breath.',
    style: 'breeze',
    icon: Wind,
    accentColor: '#A8C5A0',
    pillBg: 'bg-[#b0cfad]/30',
    pillText: 'text-[#2e4d2a]',
    tag: 'Slow Grounding'
  },
  confused: {
    title: 'Clarity Arrives in Stillness',
    message: 'You do not need every answer today. Trust the unfolding journey.',
    style: 'breeze',
    icon: Wind,
    accentColor: '#A8C5A0',
    pillBg: 'bg-[#b0cfad]/25',
    pillText: 'text-[#2e4d2a]',
    tag: 'Gentle Clarity'
  },
  meh: {
    title: 'Every Day Counts',
    message: 'Neutral days give your spirit space to recharge and simply exist.',
    style: 'breeze',
    icon: Leaf,
    accentColor: '#E9A066',
    pillBg: 'bg-warm/15',
    pillText: 'text-[#5D4037]',
    tag: 'Quiet Equilibrium'
  }
};

export default function MoodAnimationOverlay({ type, mood, isVisible, onClose }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setActive(true);
      const timer = setTimeout(() => {
        setActive(false);
        onClose?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!active) return null;

  const currentTheme = MOOD_THEMES[mood] || {
    title: type === 'positive' ? 'Your Radiance is Blooming' : 'Holding Space for You',
    message: type === 'positive' ? 'Every positive check-in waters your garden.' : 'Take a quiet breath. You are safe here.',
    style: type === 'positive' ? 'radiant' : 'shelter',
    icon: type === 'positive' ? Sun : Heart,
    pillBg: 'bg-[#F6C945]/20',
    pillText: 'text-[#856804]',
    tag: 'Sanctuary Pulse'
  };

  const IconComponent = currentTheme.icon;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const handleDismiss = () => {
    setActive(false);
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden cursor-pointer select-none"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mood-animation-title"
    >
      {/* ── Atmospheric Ambient Backdrop Blur ── */}
      <div 
        className="absolute inset-0 bg-[#3a2b25]/45 backdrop-blur-lg animate-fadeIn transition-opacity" 
      />

      {/* ── Soft Ambient Gaussian Glow Rings ── */}
      {currentTheme.style === 'radiant' && (
        <>
          <div className="absolute w-[44rem] h-[44rem] rounded-full bg-[#F6C945]/25 blur-[120px] pointer-events-none animate-breathe" />
          <div className="absolute w-[28rem] h-[28rem] rounded-full bg-[#FFA000]/20 blur-[80px] pointer-events-none" />
        </>
      )}
      {currentTheme.style === 'shelter' && (
        <>
          <div className="absolute w-[44rem] h-[44rem] rounded-full bg-[#b0cfad]/30 blur-[120px] pointer-events-none animate-breathe" />
          <div className="absolute w-[28rem] h-[28rem] rounded-full bg-[#81C784]/20 blur-[80px] pointer-events-none" />
        </>
      )}
      {currentTheme.style === 'breeze' && (
        <>
          <div className="absolute w-[44rem] h-[44rem] rounded-full bg-[#A8C5A0]/25 blur-[120px] pointer-events-none animate-breathe" />
          <div className="absolute w-[28rem] h-[28rem] rounded-full bg-[#F6C945]/15 blur-[80px] pointer-events-none" />
        </>
      )}

      {/* ── High-Visibility Particle & Flow Layers ── */}
      {!prefersReducedMotion && (
        <>
          {/* RADIANT: High-Visibility Sunflower Petal Storm */}
          {currentTheme.style === 'radiant' && PETALS.map((petal, i) => (
            <div
              key={`petal-${i}`}
              className="absolute pointer-events-none animate-petal"
              style={{
                left: `${petal.left}%`,
                animationDelay: `${petal.delay}s`,
                animationDuration: `${petal.duration}s`,
                opacity: petal.opacity,
              }}
            >
              <SunflowerPetalSVG scale={petal.scale} rotation={petal.rotation} />
            </div>
          ))}

          {/* SHELTER: Glowing Rain Streaks & Water Ripples */}
          {currentTheme.style === 'shelter' && (
            <>
              {/* Expanding Concentric Ripple Rings */}
              <div className="absolute bottom-12 w-80 h-80 rounded-full border-2 border-[#b0cfad]/60 animate-ripple pointer-events-none" />
              <div className="absolute bottom-12 w-[28rem] h-[28rem] rounded-full border-2 border-[#b0cfad]/40 animate-ripple pointer-events-none" style={{ animationDelay: '1.4s' }} />

              {/* Rain Streaks */}
              {RAIN_DROPS.map((rain, i) => (
                <div
                  key={`rain-${i}`}
                  className="absolute pointer-events-none animate-rain"
                  style={{
                    left: `${rain.left}%`,
                    animationDelay: `${rain.delay}s`,
                    animationDuration: `${rain.duration}s`,
                    height: `${rain.height}px`,
                    opacity: rain.opacity,
                  }}
                >
                  <div
                    className="w-1 rounded-full"
                    style={{
                      height: `${rain.height}px`,
                      background: 'linear-gradient(180deg, rgba(200, 230, 201, 0.1) 0%, rgba(168, 197, 160, 0.9) 100%)',
                      boxShadow: '0 0 8px rgba(168, 197, 160, 0.8)',
                    }}
                  />
                </div>
              ))}
            </>
          )}

          {/* BREEZE: Flowing Wind Streams & Tumbling Leaves */}
          {currentTheme.style === 'breeze' && (
            <>
              {/* Flowing SVG Wind Breeze Streams */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M-100,200 C300,100 600,350 1200,220 C1500,150 1800,260 2200,180"
                    fill="none"
                    stroke="rgba(246, 201, 69, 0.45)"
                    strokeWidth="2.5"
                    strokeDasharray="40 160"
                    className="animate-wind"
                    style={{ animationDuration: '4.5s' }}
                  />
                  <path
                    d="M-100,450 C200,380 500,560 1100,420 C1400,340 1700,480 2200,400"
                    fill="none"
                    stroke="rgba(176, 207, 173, 0.55)"
                    strokeWidth="2"
                    strokeDasharray="50 180"
                    className="animate-wind"
                    style={{ animationDuration: '5.5s', animationDelay: '1s' }}
                  />
                </svg>
              </div>

              {/* Tumbling Leaves */}
              {LEAVES.map((leaf, i) => (
                <div
                  key={`leaf-${i}`}
                  className="absolute pointer-events-none animate-leaf"
                  style={{
                    left: `${leaf.left}%`,
                    animationDelay: `${leaf.delay}s`,
                    animationDuration: `${leaf.duration}s`,
                  }}
                >
                  <FloatingLeafSVG scale={leaf.scale} rotation={leaf.rotation} />
                </div>
              ))}
            </>
          )}

          {/* Vibrant Sparkles across all styles */}
          {SPARKLES.map((sparkle, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute pointer-events-none animate-sparkle"
              style={{
                left: `${sparkle.left}%`,
                top: `${sparkle.top}%`,
                animationDelay: `${sparkle.delay}s`,
              }}
            >
              <Sparkles size={sparkle.size} className="text-[#F6C945] drop-shadow-md" />
            </div>
          ))}
        </>
      )}

      {/* ── Central Calming Editorial Card ── */}
      <div 
        className="relative z-10 w-full max-w-lg bg-[#FFFDF9]/95 backdrop-blur-2xl rounded-[2.8rem] p-7 sm:p-10 shadow-2xl border border-warm/20 text-center animate-scaleIn overflow-hidden"
        style={{
          boxShadow: '0 30px 70px -15px rgba(58, 43, 37, 0.35)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Mood Tag */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${currentTheme.pillBg} ${currentTheme.pillText} shadow-sm`}>
            <IconComponent className="w-4 h-4" />
            <span>{currentTheme.tag}</span>
          </span>

          <button
            onClick={handleDismiss}
            className="w-10 h-10 rounded-full bg-warm/10 hover:bg-warm/20 flex items-center justify-center text-[#5D4037]/70 hover:text-[#5D4037] transition shadow-sm"
            aria-label="Close message"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ambient Icon Halo */}
        <div className="relative mx-auto mb-6 flex items-center justify-center">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lift animate-breathe ${
            currentTheme.style === 'radiant' ? 'bg-[#F6C945] text-[#3E3006]' :
            currentTheme.style === 'shelter' ? 'bg-[#b0cfad] text-[#1e381b]' :
            'bg-[#E9A066] text-[#3E3006]'
          }`}>
            <IconComponent className="w-10 h-10" />
          </div>
        </div>

        {/* Title & Affirmation */}
        <h2 id="mood-animation-title" className="font-jakarta font-extrabold text-[#3a2b25] text-2xl sm:text-3xl leading-tight mb-3">
          {currentTheme.title}
        </h2>

        <p className="font-playfair text-base sm:text-lg text-[#5D4037]/85 italic leading-relaxed max-w-sm mx-auto mb-8">
          "{currentTheme.message}"
        </p>

        {/* ── Soothing 4.5s Breathing Meter ── */}
        <div className="space-y-2 pt-3 border-t border-earth/10">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-[#5D4037]/60">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F6C945]" />
              Take a gentle breath...
            </span>
            <span>Recorded to Garden</span>
          </div>

          <div className="w-full h-2 bg-warm/15 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#F6C945] via-[#A8C5A0] to-[#F6C945] animate-countdown rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
