import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import SupportModal from './SupportModal';

export default function FloatingSupportButton() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-support-modal', handleOpen);
    return () => window.removeEventListener('open-support-modal', handleOpen);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 md:bottom-8 right-5 md:right-8 z-40 w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#F6C945] text-[#3E3006] shadow-lg hover:shadow-glow flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group border-2 border-white/80"
        title="Campus Support"
        aria-label="Open Campus Support Modal"
      >
        <Heart size={20} className="md:w-6 md:h-6 relative z-10" fill="currentColor" />
      </button>

      <SupportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
