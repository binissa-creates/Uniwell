import React from 'react';

/**
 * Premium "Sparkling Sunflower" Streak Companion
 * A custom illustrated, fully animated component that grows with the student's consistency.
 */
export default function SunflowerProgress({ streak = 0 }) {
  // Determine display milestones
  const displayMax = streak > 100 ? 365 : streak > 30 ? 100 : 30;
  const pct = Math.min(streak / displayMax, 1);
  const radius = 42;
  const circum = 2 * Math.PI * radius;
  const offset = circum * (1 - pct);

  // Milestone logic
  const isLegendary = streak >= 30;
  const isRadiant = streak >= 60;
  const isRoyal = streak >= 100;

  // Aura Intensity
  const auraScale = isRoyal ? 1.5 : isRadiant ? 1.2 : isLegendary ? 1.0 : 0.8;
  const auraOpacity = Math.min(0.15 + (streak / 100) * 0.5, 0.7);

  return (
    <div className="flex flex-col items-center gap-6 group perspective-1000">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes pulseAura {
          0%, 100% { opacity: ${auraOpacity}; transform: scale(${auraScale}); }
          50% { opacity: ${auraOpacity + 0.2}; transform: scale(${auraScale + 0.1}); }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(55px) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: rotate(360deg) translateX(55px) rotate(-360deg); opacity: 0; }
        }
        @keyframes driftUp {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          20% { opacity: 0.8; scale: 1.2; }
          100% { transform: translateY(-60px) scale(0.5); opacity: 0; }
        }
        @keyframes ringRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes highlight {
          0% { stroke-dashoffset: ${circum}; }
          100% { stroke-dashoffset: -${circum}; }
        }
        @keyframes crownHover {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(3deg); }
        }
        .sunflower-glow {
          filter: blur(35px);
          background: radial-gradient(circle, #f6c945 0%, rgba(246,201,69,0) 70%);
        }
        .sparkle {
          position: absolute;
          width: 5px;
          height: 5px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 10px #f6c945;
          pointer-events: none;
        }
      `}</style>

      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Layered Aura System */}
        <div 
          className="absolute inset-0 rounded-full sunflower-glow transition-all duration-1000"
          style={{ 
            animation: 'pulseAura 3s ease-in-out infinite',
            backgroundColor: isRadiant ? '#f6c945' : '#fde8e0'
          }}
        />
        
        {/* Progress Ring with "Liquid Sunlight" effect */}
        <div className="absolute inset-0 z-20">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" style={{ animation: 'ringRotate 20s linear infinite' }}>
            {/* Background Track */}
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#fde8e0" strokeWidth="3" />
            
            {/* Liquid Progress */}
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke="#f6c945"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circum}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-in-out"
              style={{ filter: 'drop-shadow(0 0 8px rgba(246,201,69,0.5))' }}
            />

            {/* Glossy Traveling Highlight */}
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${circum / 8} ${circum}`}
              style={{ 
                opacity: 0.6,
                animation: 'highlight 2.5s linear infinite'
              }}
            />
          </svg>
        </div>

        {/* The Illustrated Sunflower */}
        <div className="relative z-30 flex flex-col items-center" style={{ animation: 'float 4s ease-in-out infinite' }}>
          
          {/* Royal Crown (100+ Days) */}
          {isRoyal && (
            <div className="absolute -top-12 scale-100" style={{ animation: 'crownHover 2.5s ease-in-out infinite' }}>
              <svg width="48" height="36" viewBox="0 0 40 30" fill="none">
                <path d="M5 25L2 10L12 18L20 2L28 18L38 10L35 25H5Z" fill="#D4AF37" stroke="#B8860B" strokeWidth="2" />
                <circle cx="20" cy="2" r="2" fill="#F6C945" />
              </svg>
            </div>
          )}

          <div style={{ animation: 'sway 4s ease-in-out infinite', transformOrigin: 'bottom center' }}>
            {/* Sunflower Graphic */}
            <svg width="88" height="88" viewBox="0 0 100 100" className="overflow-visible">
              {/* Stem */}
              <path d="M50 55 Q50 85 45 105" stroke="#b0cfad" strokeWidth="4" fill="none" strokeLinecap="round" />
              
              {/* Aesthetic Leaf */}
              <path 
                d="M48 90 Q65 80 58 68 Q45 78 48 90" 
                fill="#b0cfad" 
                opacity="0.9" 
                transform="rotate(-15 48 90)"
              />

              {/* Petals (Back Layer for volume) */}
              <g style={{ animation: 'breathe 3s ease-in-out infinite', transformOrigin: 'center' }}>
                {[...Array(12)].map((_, i) => (
                  <path
                    key={`back-${i}`}
                    d="M50 50 Q65 15 50 5 Q35 15 50 50"
                    fill={isLegendary ? "#f6c945" : "#ffedba"}
                    opacity="0.7"
                    transform={`rotate(${i * 30 + 15} 50 50) scale(0.95)`}
                  />
                ))}
                
                {/* Petals (Front Layer) */}
                {[...Array(12)].map((_, i) => (
                  <path
                    key={`front-${i}`}
                    d="M50 50 Q65 15 50 5 Q35 15 50 50"
                    fill={isLegendary ? "#f6c945" : "#ffedba"}
                    stroke={isLegendary ? "#e8a800" : "#f6c945"}
                    strokeWidth={isLegendary ? "1.2" : "0.6"}
                    transform={`rotate(${i * 30} 50 50)`}
                    className="transition-all duration-1000"
                  />
                ))}
              </g>

              {/* Center Shadow for depth */}
              <circle cx="50" cy="51" r="18" fill="rgba(0,0,0,0.15)" />

              {/* Aesthetic Textured Center */}
              <circle 
                cx="50" cy="50" r="18" 
                fill="#3a2b25" 
                className="transition-all duration-500"
                style={{ 
                  filter: isLegendary ? 'drop-shadow(0 0 10px rgba(246,201,69,0.5))' : 'none' 
                }}
              />
              
              {/* Seed texture details */}
              {[...Array(20)].map((_, i) => {
                const angle = i * 137.5 * (Math.PI / 180);
                const r = 3 + Math.sqrt(i) * 2.8;
                return (
                  <circle 
                    key={i} 
                    cx={50 + r * Math.cos(angle)} 
                    cy={50 + r * Math.sin(angle)} 
                    r="1.4" 
                    fill={i % 3 === 0 ? "#f6c945" : "#5D4037"} 
                    opacity={i % 3 === 0 ? "0.4" : "0.7"} 
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Orbiting Sparkles */}
        {isLegendary && [...Array(isRadiant ? 10 : 6)].map((_, i) => (
          <div 
            key={i}
            className="sparkle"
            style={{ 
              animation: `orbit ${1.5 + i * 0.4}s linear infinite`,
              animationDelay: `-${i * 0.5}s`,
              scale: 0.6 + Math.random() * 0.6
            }}
          />
        ))}

        {/* Rising Golden Dust */}
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="sparkle"
            style={{ 
              left: `${25 + Math.random() * 50}%`,
              bottom: '15%',
              animation: `driftUp ${1.5 + Math.random() * 1.5}s ease-out infinite`,
              animationDelay: `${i * 0.4}s`,
              backgroundColor: '#f6c945'
            }}
          />
        ))}
      </div>

      {/* Narrative Status */}
      <div className="text-center">
        {isLegendary && (
          <p className="font-playfair italic text-base text-[#6B5A10] mb-1 animate-fadeIn">
            {isRoyal ? 'Royal Bloom' : isRadiant ? 'Radiant Sun' : 'Legendary Bloom'}
          </p>
        )}
        <h4 className="font-jakarta font-black text-[#3a2b25] text-2xl tracking-tight leading-tight">
          {streak} Day Streak
        </h4>
        <p className="font-jakarta text-[13px] font-medium text-[#AA8E7E] mt-1.5 italic leading-relaxed">
          {streak >= 30 ? '"You nurtured something beautiful."' : 'A flower that grows with you.'}
        </p>
      </div>
    </div>
  );
}
