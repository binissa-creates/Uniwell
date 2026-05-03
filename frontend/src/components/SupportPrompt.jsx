import React from 'react';
import { Heart, X, ArrowRight } from 'lucide-react';

export default function SupportPrompt({ isOpen, onViewSupport, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 left-6 md:left-auto md:w-96 z-[80] animate-slideInUp">
      <div className="bg-[#3a2b25] rounded-[2rem] p-6 shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#F6C945]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#F6C945]/20 flex items-center justify-center text-[#F6C945]">
              <Heart size={20} fill="currentColor" />
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <h3 className="text-white font-jakarta font-bold text-lg leading-snug mb-2">
            Sending some light your way. 🌻
          </h3>
          <p className="text-white/60 text-xs leading-relaxed mb-6">
            It looks like you're having a tough moment. Would you like to see what campus support resources are available?
          </p>

          <div className="flex gap-3">
            <button 
              onClick={onViewSupport}
              className="flex-1 bg-[#F6C945] text-[#3E3006] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
            >
              View Support <ArrowRight size={14} />
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
