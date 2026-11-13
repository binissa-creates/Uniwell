import React from 'react';
import { X, Phone, PhoneCall, MapPin, Mail, ExternalLink, ShieldAlert, Clock, Building2 } from 'lucide-react';

function FacebookIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function SupportModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#3a2b25]/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Campus Support and Emergency Helplines"
    >
      <div 
        className="bg-[#FDF9F2] rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-scaleIn relative overflow-hidden flex flex-col max-h-[92vh] border border-warm/15"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#F8D272] via-[#F6C945] to-[#81B29A]" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 pt-6 sm:pt-7 pb-3 sm:pb-4 border-b border-warm/10 bg-white/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F6C945]/20 flex items-center justify-center text-[#755b00] shadow-sm">
              <PhoneCall size={20} />
            </div>
            <div>
              <h2 className="font-jakarta font-black text-[#3a2b25] text-lg sm:text-xl uppercase tracking-tight">
                Campus Support
              </h2>
              <p className="text-[10px] font-bold text-[#AA8E7E] uppercase tracking-widest mt-0.5">
                Guidance & Crisis Helplines
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border border-warm/10 flex items-center justify-center text-[#3a2b25]/50 hover:text-[#3a2b25] transition-colors shadow-sm"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 sm:px-8 py-5 sm:py-6 overflow-y-auto custom-scrollbar space-y-5">
          
          {/* ── Spotlight Card: USPF Guidance & Testing Services Center ── */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-[#F6C945]/40 shadow-suncast relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-[#F6C945]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="flex items-start justify-between gap-3 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FDF9F2] border border-warm/15 flex items-center justify-center text-[#6B5A10] flex-shrink-0">
                  <Building2 size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#755b00] bg-[#F6C945]/20 px-2.5 py-0.5 rounded-full">
                      USPF Campus Guidance
                    </span>
                    <span className="text-[10px] font-bold text-warm/40">Free & Confidential</span>
                  </div>
                  <h3 className="font-jakarta font-black text-[#3a2b25] text-base sm:text-lg mt-0.5 leading-snug">
                    Guidance and Testing Services Center (GTSC)
                  </h3>
                </div>
              </div>
            </div>

            {/* Location & Direct Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 pb-3.5 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#FCF8F4] border border-warm/8">
                <MapPin size={16} className="text-[#6B5A10] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#AA8E7E]">Office Location</p>
                  <p className="font-bold text-[#3a2b25] leading-snug mt-0.5">3rd Floor, Oscar Jereza Sr. Bldg.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#FCF8F4] border border-warm/8">
                <Phone size={16} className="text-[#6B5A10] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#AA8E7E]">Telephone / Trunkline</p>
                  <a
                    href="tel:0322658773"
                    className="font-bold text-[#3a2b25] hover:text-[#6B5A10] hover:underline block leading-snug mt-0.5"
                    title="Click to call USPF GTSC"
                  >
                    (032) 265 8773 <span className="font-semibold text-warm/70">(GTSC) Loc. 130, Loc. 132</span>
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#FCF8F4] border border-warm/8">
                <Mail size={16} className="text-[#6B5A10] mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#AA8E7E]">Official Email</p>
                  <a
                    href="mailto:gtsc@uspf.edu.ph"
                    className="font-bold text-[#3a2b25] hover:text-[#6B5A10] hover:underline truncate block leading-snug mt-0.5"
                    title="Send email to GTSC"
                  >
                    gtsc@uspf.edu.ph
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#FCF8F4] border border-warm/8">
                <Clock size={16} className="text-[#6B5A10] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#AA8E7E]">Office Hours</p>
                  <p className="font-bold text-[#3a2b25] leading-snug mt-0.5">Monday – Friday · 8:00 AM – 5:00 PM</p>
                </div>
              </div>
            </div>

            {/* Clickable Facebook Page Banner */}
            <a
              href="https://www.facebook.com/GTSCUSPF"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center justify-between p-3.5 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2]/15 border border-[#1877F2]/25 text-[#1877F2] transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#1877F2] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <FacebookIcon className="w-4 h-4 fill-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1877F2] truncate">
                    Guidance and Testing Services Center - USPF
                  </p>
                  <p className="text-[10px] font-medium text-[#1877F2]/75">
                    facebook.com/GTSCUSPF · Tap to visit official page
                  </p>
                </div>
              </div>
              <ExternalLink size={15} className="group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2" />
            </a>
          </div>

          {/* ── Emergency & Crisis Helplines Section ── */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-warm/15 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert size={18} />
              <h4 className="font-jakarta font-black text-xs sm:text-sm uppercase tracking-wider text-[#3a2b25]">
                24/7 Crisis & Teleconsultation Hotlines
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Vicente Sotto Memorial Medical Center */}
              <div className="p-3.5 rounded-2xl bg-[#FCF8F4] border border-warm/10 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#AA8E7E]">Teleconsultation</p>
                  <p className="font-bold text-[#3a2b25] mt-0.5 leading-snug">
                    Vicente Sotto Memorial Medical Center (VSMMC)
                  </p>
                  <p className="text-[10px] text-warm/60 font-medium">Department of Behavioral Sciences</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-warm/10 flex flex-wrap gap-2">
                  <a href="tel:09292873688" className="font-bold text-[#755b00] hover:underline">
                    0929 287 3688
                  </a>
                  <span className="text-warm/30">|</span>
                  <a href="tel:0322534423" className="font-bold text-[#755b00] hover:underline">
                    (032) 253 4423
                  </a>
                </div>
              </div>

              {/* Tawag Paglaum - Centro Bisaya */}
              <div className="p-3.5 rounded-2xl bg-[#FCF8F4] border border-warm/10 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#AA8E7E]">Cebu / Visayas Crisis Line</p>
                  <p className="font-bold text-[#3a2b25] mt-0.5 leading-snug">
                    Tawag Paglaum – Centro Bisaya
                  </p>
                  <p className="text-[10px] text-warm/60 font-medium">Emotional support & crisis intervention</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-warm/10 flex flex-wrap gap-2">
                  <a href="tel:09399365433" className="font-bold text-[#755b00] hover:underline">
                    0939 936 5433
                  </a>
                  <span className="text-warm/30">|</span>
                  <a href="tel:09266264236" className="font-bold text-[#755b00] hover:underline">
                    0926 626 4236
                  </a>
                </div>
              </div>

              {/* Hopeline Philippines */}
              <div className="p-3.5 rounded-2xl bg-[#FCF8F4] border border-warm/10 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#AA8E7E]">National Suicide Prevention</p>
                  <p className="font-bold text-[#3a2b25] mt-0.5 leading-snug">Hopeline Philippines</p>
                  <p className="text-[10px] text-warm/60 font-medium">24/7 free & confidential support</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-warm/10 flex flex-col gap-0.5">
                  <div className="flex flex-wrap gap-2">
                    <a href="tel:0288044673" className="font-bold text-[#755b00] hover:underline">
                      (02) 8-804-4673
                    </a>
                    <span className="text-warm/30">·</span>
                    <a href="tel:09188734673" className="font-bold text-[#755b00] hover:underline">
                      0918 873 4673 (Smart)
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <a href="tel:09175584673" className="font-bold text-[#755b00] hover:underline">
                      0917 558 4673 (Globe)
                    </a>
                    <span className="text-warm/30">·</span>
                    <span className="font-semibold text-warm/60">2919 (Toll-Free Globe/TM)</span>
                  </div>
                </div>
              </div>

              {/* National Center for Mental Health Crisis Hotline */}
              <div className="p-3.5 rounded-2xl bg-[#FCF8F4] border border-warm/10 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#AA8E7E]">NCMH Crisis Hotline</p>
                  <p className="font-bold text-[#3a2b25] mt-0.5 leading-snug">
                    National Center for Mental Health
                  </p>
                  <p className="text-[10px] text-warm/60 font-medium">Department of Health 24/7 hotline</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-warm/10 flex flex-col gap-0.5">
                  <a href="tel:09086392672" className="font-bold text-[#755b00] hover:underline">
                    0908-639-2672 <span className="font-normal text-warm/60">(Smart/Sun/TNT)</span>
                  </a>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <a href="tel:09663514518" className="font-bold text-[#755b00] hover:underline">
                      0966-351-4518
                    </a>
                    <span className="text-warm/30">/</span>
                    <a href="tel:09178998727" className="font-bold text-[#755b00] hover:underline">
                      0917-899-8727 (Globe/TM)
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-warm/10 text-center">
          <p className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-[0.2em]">
            You don't have to carry it alone.
          </p>
        </div>
      </div>
    </div>
  );
}
