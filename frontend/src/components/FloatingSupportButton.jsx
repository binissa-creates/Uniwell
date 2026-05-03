import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import SupportModal from './SupportModal';

export default function FloatingSupportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[90] w-14 h-14 rounded-full bg-[#F6C945] text-[#3E3006] shadow-glow flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group"
        title="Campus Support"
      >
        <div className="absolute inset-0 rounded-full bg-[#F6C945] animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <Heart size={24} fill="currentColor" className="relative z-10" />
      </button>

      <SupportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
