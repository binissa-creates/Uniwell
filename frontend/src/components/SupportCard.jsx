import React from 'react';
import { Heart, ShieldAlert, Phone, Clock, Users, ArrowRight } from 'lucide-react';

export default function SupportCard({ onOpenModal }) {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-suncast border border-white relative overflow-hidden group hover:shadow-lift transition-all duration-500">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#F6C945]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-[#F6C945]/10 transition-colors"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-[#F6C945]/10 flex items-center justify-center text-[#6B5A10] shadow-inner">
            <Heart size={20} fill="currentColor" />
          </div>
          <h2 className="font-jakarta font-black text-[#3a2b25] text-lg uppercase tracking-tight">Campus Support</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Support Resources */}
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-xl bg-[#FDF9F2] flex items-center justify-center text-[#6B5A10] flex-shrink-0">
                <Users size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#3a2b25] uppercase tracking-wide mb-1">Counseling Center</h4>
                <p className="text-[11px] text-[#3a2b25]/60 leading-relaxed">Free, confidential 1-on-1 sessions</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock size={10} className="text-[#AA8E7E]" />
                  <span className="text-[9px] font-bold text-[#AA8E7E] uppercase tracking-widest">Mon–Fri 9AM–5PM</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-xl bg-[#FDF9F2] flex items-center justify-center text-[#6B5A10] flex-shrink-0">
                <Users size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#3a2b25] uppercase tracking-wide mb-1">Peer Groups</h4>
                <p className="text-[11px] text-[#3a2b25]/60 leading-relaxed">Safe, moderated student sharing</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock size={10} className="text-[#AA8E7E]" />
                  <span className="text-[9px] font-bold text-[#AA8E7E] uppercase tracking-widest">Weekly Session</span>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Box */}
          <div className="bg-[#FDF9F2] rounded-3xl p-6 border border-[#F6C945]/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-red-500">
                <ShieldAlert size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Emergency</span>
              </div>
              <p className="text-xl font-jakarta font-extrabold text-[#3a2b25] leading-tight mb-1">Call or Text 988</p>
              <p className="text-[10px] text-[#AA8E7E] font-medium leading-relaxed">Available 24/7, confidential and free</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-[#AA8E7E]/10 flex items-center justify-between">
              <span className="text-[9px] font-black text-[#3a2b25] uppercase tracking-widest">Campus Security</span>
              <Phone size={12} className="text-[#6B5A10]" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={onOpenModal}
          className="w-full mt-8 py-4 bg-white border border-[#F6C945]/30 rounded-2xl flex items-center justify-center gap-2 group/btn hover:bg-[#F6C945] hover:text-white transition-all duration-300"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover/btn:translate-x-1 transition-transform">Access Resources</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
