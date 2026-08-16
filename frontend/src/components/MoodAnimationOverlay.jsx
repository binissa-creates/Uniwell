import React, { useEffect, useState } from 'react';
import { Heart, Sun, Sparkles, X } from 'lucide-react';

const PETAL_COUNT = 15;
const SPARKLE_COUNT = 20;

export default function MoodAnimationOverlay({ type, isVisible, onClose }) {
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

  if (type === 'positive') {
    return (
      <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
        {/* Background Dim */}
        <div className="absolute inset-0 bg-[#3a2b25]/25 backdrop-blur-sm animate-fadeIn" />

        {/* Particle effects */}
        {[...Array(PETAL_COUNT)].map((_, i) => (
          <div
            key={`petal-${i}`}
            className="absolute animate-petal opacity-0"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          >
            <div 
              className="w-4 h-6 bg-[#F6C945] rounded-full opacity-60 rotate-45" 
              style={{ borderRadius: '50% 0 50% 50%' }}
            />
          </div>
        ))}

        {[...Array(SPARKLE_COUNT)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute animate-sparkle opacity-0"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            <Sparkles size={12 + Math.random() * 12} className="text-[#F6C945]/40" />
          </div>
        ))}

        {/* Central Message */}
        <div className="absolute inset-0 flex items-center justify-center animate-scaleIn">
          <div className="relative bg-white/80 backdrop-blur-md px-8 py-4 rounded-[2rem] shadow-glow border border-[#F6C945]/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F6C945] flex items-center justify-center text-white animate-breathe">
              <Sun size={24} fill="currentColor" />
            </div>
            <div>
              <p className="font-jakarta font-black text-[#3a2b25] text-lg leading-tight uppercase tracking-tight">Your radiance is blooming!</p>
              <p className="text-[10px] font-bold text-[#AA8E7E] uppercase tracking-widest mt-0.5">Keep shining bright</p>
            </div>
            <button
              onClick={() => {
                setActive(false);
                onClose?.();
              }}
              className="pointer-events-auto absolute top-4 right-4 text-[#3a2b25]/40 hover:text-[#3a2b25] transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'negative') {
    return (
      <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden flex items-center justify-center">
        {/* Soft background dim */}
        <div className="absolute inset-0 bg-[#3a2b25]/30 backdrop-blur-md animate-fadeIn" />
        
        {/* Floating Hearts */}
        {[...Array(10)].map((_, i) => (
          <div
            key={`heart-${i}`}
            className="absolute animate-heart-float opacity-0"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 60}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            <Heart size={20} className="text-[#BA1A1A]/20" fill="currentColor" />
          </div>
        ))}

        {/* Comfort Card */}
        <div className="relative animate-scaleIn max-w-sm mx-auto px-6">
          <div className="relative bg-white rounded-[2.5rem] p-8 shadow-lift border border-[#BA1A1A]/5 text-center">
            <div className="w-16 h-16 rounded-[2rem] bg-[#FFF0F0] flex items-center justify-center text-[#BA1A1A] mx-auto mb-6 animate-breathe">
              <Heart size={32} fill="currentColor" />
            </div>
            <h3 className="font-jakarta font-extrabold text-[#3a2b25] text-xl mb-3">Sending a warm hug...</h3>
            <p className="text-sm text-[#3a2b25]/60 leading-relaxed italic">
              "Even the brightest sunflowers need rain to grow. Take your time, roots grow in the dark."
            </p>
            <button
              onClick={() => {
                setActive(false);
                onClose?.();
              }}
              className="pointer-events-auto absolute top-4 right-4 text-[#3a2b25]/40 hover:text-[#3a2b25] transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
