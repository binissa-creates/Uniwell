import React, { useState } from 'react';
import { Info, X, Sun, Trophy, ShieldCheck } from 'lucide-react';

/**
 * Minimal "Sunflower" Streak Companion
 * Clean, compact, uncluttered
 */
export default function SunflowerProgress({ streak = 0, totalDays = 0, bestStreak = 0 }) {
  const [showGuideModal, setShowGuideModal] = useState(false);

  const displayTotal = totalDays > 0 ? totalDays : streak;
  const displayBest = bestStreak > 0 ? bestStreak : streak;

  const displayMax = streak > 100 ? 365 : streak > 30 ? 100 : 30;
  const pct = Math.min(streak / displayMax, 1);
  const radius = 44;
  const circum = 2 * Math.PI * radius;
  const offset = circum * (1 - pct);

  const isSeedling = streak < 5;
  const isBudding = streak >= 5 && streak < 15;
  const isBlooming = streak >= 15 && streak < 30;
  const isLegendary = streak >= 30;

  const stageLabel = isSeedling ? 'Seedling' : isBudding ? 'Budding' : isBlooming ? 'Blooming' : streak >= 100 ? 'Royal' : 'Legendary'

  return (
    <div className="flex items-center gap-4">
      <style>{`
        @keyframes sfloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes ringRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ringHighlight {
          0% { stroke-dashoffset: ${circum}; }
          100% { stroke-dashoffset: -${circum}; }
        }
        @keyframes sunPulse {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50% { opacity: 0.22; transform: scale(1.08); }
        }
      `}</style>

      {/* Sunflower + Ring */}
      <div className="relative flex-shrink-0 w-[88px] h-[88px] flex items-center justify-center">
        {/* Soft glow */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #f6c945 0%, transparent 70%)',
            animation: 'sunPulse 3s ease-in-out infinite',
            filter: 'blur(10px)',
          }}
        />

        {/* Progress ring */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90" style={{ animation: 'ringRotate 25s linear infinite' }}>
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#fde8e0" strokeWidth="5" />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#f6c945"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circum}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease', filter: 'drop-shadow(0 0 5px rgba(246,201,69,0.5))' }}
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${circum / 10} ${circum}`}
            style={{ opacity: 0.5, animation: 'ringHighlight 2.5s linear infinite' }}
          />
        </svg>

        {/* The Plant */}
        <div className="relative z-10" style={{ animation: 'sfloat 4s ease-in-out infinite' }}>
          <div style={{ animation: 'sway 4s ease-in-out infinite', transformOrigin: 'bottom center' }}>

            {/* Seedling */}
            {isSeedling && (
              <svg width="48" height="48" viewBox="0 0 100 100" className="overflow-visible">
                <path d="M50 70 Q50 88 46 105" stroke="#b0cfad" strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M48 84 Q57 73 52 67 Q44 74 48 84" fill="#8cb888" />
                <path d="M50 80 Q41 72 44 67 Q52 73 50 80" fill="#a0c29d" />
              </svg>
            )}

            {/* Budding */}
            {isBudding && (
              <svg width="48" height="48" viewBox="0 0 100 100" className="overflow-visible">
                <path d="M50 62 Q50 86 46 105" stroke="#b0cfad" strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M47 84 Q63 74 57 63 Q44 74 47 84" fill="#8cb888" />
                <path d="M49 73 Q34 67 40 58 Q51 66 49 73" fill="#a0c29d" />
                <circle cx="50" cy="62" r="8" fill="#8cb888" />
                <path d="M44 59 Q50 51 56 59 Z" fill="#ffedba" />
              </svg>
            )}

            {/* Blooming */}
            {isBlooming && (
              <svg width="48" height="48" viewBox="0 0 100 100" className="overflow-visible">
                <path d="M50 54 Q50 86 46 105" stroke="#b0cfad" strokeWidth="4" fill="none" strokeLinecap="round" />
                <path d="M48 88 Q65 78 58 65 Q44 76 48 88" fill="#b0cfad" transform="rotate(-15 48 88)" />
                <path d="M49 73 Q34 67 40 58 Q51 66 49 73" fill="#8cb888" />
                <g style={{ transformOrigin: 'center', animation: 'sunPulse 3s ease-in-out infinite' }}>
                  {[...Array(8)].map((_, i) => (
                    <path key={i} d="M50 50 Q60 20 50 10 Q40 20 50 50" fill="#ffedba" stroke="#f6c945" strokeWidth="0.8" transform={`rotate(${i * 45} 50 50) scale(0.82)`} />
                  ))}
                </g>
                <circle cx="50" cy="51" r="12" fill="rgba(0,0,0,0.12)" />
                <circle cx="50" cy="50" r="12" fill="#4a352a" />
              </svg>
            )}

            {/* Legendary */}
            {isLegendary && (
              <svg width="48" height="48" viewBox="0 0 100 100" className="overflow-visible">
                <path d="M50 54 Q50 86 46 105" stroke="#b0cfad" strokeWidth="4" fill="none" strokeLinecap="round" />
                <path d="M48 88 Q65 78 58 65 Q44 76 48 88" fill="#b0cfad" transform="rotate(-15 48 88)" />
                <path d="M49 73 Q34 67 40 58 Q51 66 49 73" fill="#8cb888" />
                <g style={{ transformOrigin: 'center', animation: 'sunPulse 3s ease-in-out infinite' }}>
                  {[...Array(10)].map((_, i) => (
                    <path key={`b${i}`} d="M50 50 Q65 12 50 3 Q35 12 50 50" fill="#f6c945" opacity="0.65" transform={`rotate(${i * 36 + 18} 50 50) scale(0.96)`} />
                  ))}
                  {[...Array(10)].map((_, i) => (
                    <path key={`f${i}`} d="M50 50 Q65 12 50 3 Q35 12 50 50" fill="#f6c945" stroke="#e8a800" strokeWidth="1.2" transform={`rotate(${i * 36} 50 50)`} />
                  ))}
                </g>
                <circle cx="50" cy="51" r="15" fill="rgba(0,0,0,0.13)" />
                <circle cx="50" cy="50" r="15" fill="#3a2b25" />
              </svg>
            )}

          </div>
        </div>
      </div>

      {/* Text Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-warm/50">{stageLabel}</span>
        </div>

        <h4 className="font-jakarta font-extrabold text-warm text-xl leading-tight">
          {streak} Day Streak
        </h4>

        <p className="text-[11px] text-warm/50 mb-2.5">
          {streak >= 30 ? '"You nurtured something beautiful."' : 'A flower that grows with you.'}
        </p>

        {/* Single compact badge row */}
        <div className="flex items-center flex-wrap gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F6C945]/20 text-[#755b00] text-[10px] font-extrabold border border-[#F6C945]/30">
            🔥 {streak}d active
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#ccebc7]/60 text-[#254722] text-[10px] font-extrabold border border-[#b0cfad]/40">
            🌱 {displayTotal}d total
          </span>
          {displayBest > streak && displayBest > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#EEDDCB] text-[#5D4037] text-[10px] font-extrabold">
              <Trophy className="w-2.5 h-2.5 text-[#9E7D0A]" /> {displayBest}d best
            </span>
          )}
        </div>

        {/* Info link */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowGuideModal(true); }}
          className="mt-2 inline-flex items-center gap-1 text-[10px] text-warm/40 hover:text-[#755b00] transition-colors font-bold uppercase tracking-wider"
        >
          <Info className="w-3 h-3" /> How your streak works
        </button>
      </div>

      {/* Guide Modal */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3a2b25]/60 backdrop-blur-md"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="bg-[#FFFDF9] rounded-3xl w-full max-w-md shadow-2xl animate-scaleIn relative overflow-hidden flex flex-col max-h-[80vh] border border-warm/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-warm/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F6C945]/20 flex items-center justify-center text-[#9E7D0A]">
                  <Sun className="w-4 h-4" />
                </div>
                <h3 className="font-jakarta font-bold text-warm text-base">Sunflower Streak Guide</h3>
              </div>
              <button onClick={() => setShowGuideModal(false)} className="w-7 h-7 rounded-full bg-warm/10 flex items-center justify-center text-warm/50 hover:text-warm transition">
                <X size={14} />
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-white border border-[#F6C945]/30 space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-black text-[#856804] uppercase">🔥 Active Streak</div>
                  <p className="text-[11px] text-warm/70 leading-relaxed">Consecutive daily check-ins with a 24h grace window.</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#b0cfad]/40 space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-black text-[#2e4d2a] uppercase">🌱 Total Bloomed</div>
                  <p className="text-[11px] text-warm/70 leading-relaxed">Lifetime days logged. <strong>Never resets.</strong></p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#EAF2E6] border border-[#b0cfad]/40 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-black text-[#2e4d2a] uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-700" /> 24-Hour Grace Shield
                </div>
                <p className="text-[11px] text-warm/80 leading-relaxed">Miss a day? Your streak survives an extra 24 hours.</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-warm/40">Growth Stages</p>
                {[
                  { emoji: '🌱', label: 'Seedling', range: 'Days 1–4' },
                  { emoji: '🌿', label: 'Budding', range: 'Days 5–14' },
                  { emoji: '🌻', label: 'Full Bloom', range: 'Days 15–29' },
                  { emoji: '✨', label: 'Radiant Sun', range: 'Days 30–99' },
                  { emoji: '👑', label: 'Royal Bloom', range: 'Days 100+' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-warm/10">
                    <span className="text-lg">{s.emoji}</span>
                    <div>
                      <div className="text-xs font-bold text-warm">{s.label}</div>
                      <div className="text-[10px] text-warm/50">{s.range}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 bg-[#FDF9F2] border-t border-warm/10 text-right">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#3a2b25] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5D4037] transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
