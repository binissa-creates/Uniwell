import React from 'react';
import { PhoneCall, ShieldAlert, Phone, Clock, Building2, ArrowRight } from 'lucide-react';

export default function SupportCard({ onOpenModal }) {
  return (
    <div className="bg-white rounded-[2.5rem] p-5 sm:p-8 shadow-suncast border border-white relative overflow-hidden group hover:shadow-lift transition-all duration-500">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#F6C945]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-[#F6C945]/10 transition-colors"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-10 h-10 rounded-2xl bg-[#F6C945]/15 flex items-center justify-center text-[#755b00] shadow-inner">
            <PhoneCall size={20} />
          </div>
          <h2 className="font-jakarta font-black text-[#3a2b25] text-lg uppercase tracking-tight">Campus Support</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Support Resources */}
          <div className="space-y-5 sm:space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-xl bg-[#FDF9F2] flex items-center justify-center text-[#6B5A10] flex-shrink-0">
                <Building2 size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#3a2b25] uppercase tracking-wide mb-1">Guidance Center (GTSC)</h4>
                <p className="text-[11px] text-[#3a2b25]/60 leading-relaxed">3rd Floor, Oscar Jereza Sr. Bldg.</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock size={10} className="text-[#AA8E7E]" />
                  <span className="text-[9px] font-bold text-[#AA8E7E] uppercase tracking-widest">Mon–Fri 8AM–5PM</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-xl bg-[#FDF9F2] flex items-center justify-center text-[#6B5A10] flex-shrink-0">
                <Phone size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#3a2b25] uppercase tracking-wide mb-1">Telephone & Email</h4>
                <p className="text-[11px] text-[#3a2b25]/60 leading-relaxed">(032) 265 8773 Loc. 130, 132</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-[#755b00]">gtsc@uspf.edu.ph</span>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Box */}
          <div className="bg-[#FDF9F2] rounded-3xl p-5 sm:p-6 border border-[#F6C945]/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-red-500">
                <ShieldAlert size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">24/7 Helplines</span>
              </div>
              <p className="text-lg font-jakarta font-extrabold text-[#3a2b25] leading-tight mb-1">Tawag Paglaum & NCMH</p>
              <p className="text-[10px] text-[#AA8E7E] font-medium leading-relaxed">Cebu & national crisis teleconsultation</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-[#AA8E7E]/10 flex items-center justify-between">
              <span className="text-[9px] font-black text-[#3a2b25] uppercase tracking-widest">Tap to view hotlines</span>
              <PhoneCall size={12} className="text-[#6B5A10]" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={onOpenModal}
          className="w-full mt-6 sm:mt-8 py-4 bg-white border border-[#F6C945]/30 rounded-2xl flex items-center justify-center gap-2 group/btn hover:bg-[#F6C945] hover:text-[#3a2b25] transition-all duration-300"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover/btn:translate-x-1 transition-transform">Access Campus Helplines</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
