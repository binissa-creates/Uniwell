import React from 'react';
import { X, Phone, Heart, Users, ShieldAlert, ExternalLink } from 'lucide-react';

export default function SupportModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#3a2b25]/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#FDF9F2] rounded-[2.5rem] w-full max-w-2xl shadow-lift animate-scaleIn relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#F6C945]" />

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F6C945]/20 flex items-center justify-center text-[#6B5A10]">
              <Heart size={20} fill="currentColor" />
            </div>
            <div>
              <h2 className="font-jakarta font-black text-[#3a2b25] text-xl uppercase tracking-tight">Campus Support</h2>
              <p className="text-[10px] font-bold text-[#AA8E7E] uppercase tracking-widest mt-0.5">We are here for you</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#3a2b25]/30 hover:text-[#3a2b25] transition-colors shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-10 pt-4 overflow-y-auto custom-scrollbar">
          
          {/* Emergency Section */}
          <div className="mb-8 p-6 rounded-3xl bg-white border-2 border-[#F6C945]/30 shadow-suncast">
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="text-red-500" size={24} />
              <h3 className="font-jakarta font-black text-[#3a2b25] text-lg uppercase tracking-tight">Emergency Contacts</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-widest">Crisis Hotline</p>
                <p className="text-xl font-jakarta font-extrabold text-[#3a2b25]">Call or Text 988</p>
                <p className="text-[11px] text-[#AA8E7E] font-medium">Available 24/7, confidential & free</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-widest">Campus Security</p>
                <p className="text-xl font-jakarta font-extrabold text-[#3a2b25]">(555) 012-3456</p>
                <p className="text-[11px] text-[#AA8E7E] font-medium">Immediate on-campus response</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Counseling Center */}
            <div className="p-6 rounded-3xl bg-white border border-[#AA8E7E]/10 hover:border-[#F6C945]/40 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-[#F6C945]/10 flex items-center justify-center text-[#6B5A10] mb-4 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <h4 className="font-jakarta font-bold text-[#3a2b25] mb-2">Counseling Center</h4>
              <p className="text-xs text-[#3a2b25]/60 leading-relaxed mb-4">
                Free, confidential 1-on-1 sessions with professional counselors to help you navigate life's challenges.
              </p>
              <div className="pt-4 border-t border-[#FDF9F2] flex items-center justify-between">
                <span className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-widest">Mon–Fri 9AM–5PM</span>
                <Phone size={14} className="text-[#6B5A10]" />
              </div>
            </div>

            {/* Peer Groups */}
            <div className="p-6 rounded-3xl bg-white border border-[#AA8E7E]/10 hover:border-[#F6C945]/40 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-[#F6C945]/10 flex items-center justify-center text-[#6B5A10] mb-4 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <h4 className="font-jakarta font-bold text-[#3a2b25] mb-2">Peer Groups</h4>
              <p className="text-xs text-[#3a2b25]/60 leading-relaxed mb-4">
                Safe, moderated student sharing circles where you can connect with others who understand.
              </p>
              <div className="pt-4 border-t border-[#FDF9F2] flex items-center justify-between">
                <span className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-widest">Weekly Session</span>
                <ExternalLink size={14} className="text-[#6B5A10]" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-white border-t border-[#FDF9F2] text-center">
          <p className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-[0.2em]">You don't have to carry it alone.</p>
        </div>
      </div>
    </div>
  );
}
