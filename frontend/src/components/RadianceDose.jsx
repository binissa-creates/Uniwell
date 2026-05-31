import React, { useState } from 'react';
import { Sparkles, Repeat, BookOpen } from 'lucide-react';

const BIBLE_VERSES = [
  { text: "I can do all things through Christ who strengthens me.", source: "Philippians 4:13" },
  { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", source: "Jeremiah 29:11" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", source: "Joshua 1:9" },
  { text: "Trust in the Lord with all your heart and lean not on your own understanding.", source: "Proverbs 3:5" },
  { text: "Let all that you do be done in love.", source: "1 Corinthians 16:14" },
  { text: "The joy of the Lord is your strength.", source: "Nehemiah 8:10" },
  { text: "Commit to the Lord whatever you do, and He will establish your plans.", source: "Proverbs 16:3" },
  { text: "With God all things are possible.", source: "Matthew 19:26" },
  { text: "Do not grow weary in doing good.", source: "Galatians 6:9" },
  { text: "Your word is a lamp to my feet and a light to my path.", source: "Psalm 119:105" },
  { text: "Cast all your anxiety on Him because He cares for you.", source: "1 Peter 5:7" },
  { text: "Seek first His kingdom and His righteousness.", source: "Matthew 6:33" },
  { text: "Love your neighbor as yourself.", source: "Mark 12:31" },
  { text: "Blessed are the peacemakers.", source: "Matthew 5:9" },
  { text: "Faith can move mountains.", source: "Matthew 17:20" },
  { text: "The Lord is my shepherd; I shall not want.", source: "Psalm 23:1" },
  { text: "Be kind and compassionate to one another.", source: "Ephesians 4:32" },
  { text: "Whatever you do, work at it with all your heart.", source: "Colossians 3:23" },
  { text: "Perfect love drives out fear.", source: "1 John 4:18" },
  { text: "Those who hope in the Lord will renew their strength.", source: "Isaiah 40:31" }
];

const MOTIVATIONAL_QUOTES = [
  { text: "Success is the sum of small efforts repeated day in and day out.", source: "Robert Collier" },
  { text: "Dream big. Start small. Act now.", source: "Motivation" },
  { text: "Discipline is choosing between what you want now and what you want most.", source: "Motivation" },
  { text: "Your future is created by what you do today, not tomorrow.", source: "Motivation" },
  { text: "Progress, not perfection.", source: "Motivation" },
  { text: "Small steps every day lead to big results.", source: "Motivation" },
  { text: "The expert in anything was once a beginner.", source: "Motivation" },
  { text: "Difficult roads often lead to beautiful destinations.", source: "Motivation" },
  { text: "Stay patient and trust your journey.", source: "Motivation" },
  { text: "You are capable of more than you think.", source: "Motivation" },
  { text: "Consistency beats motivation.", source: "Motivation" },
  { text: "Learn today, lead tomorrow.", source: "Motivation" },
  { text: "Every accomplishment starts with the decision to try.", source: "Motivation" },
  { text: "Focus on your goal, not the obstacles.", source: "Motivation" },
  { text: "Don’t stop until you’re proud.", source: "Motivation" },
  { text: "Great things never come from comfort zones.", source: "Motivation" },
  { text: "Your only limit is the one you refuse to overcome.", source: "Motivation" },
  { text: "Success begins with self-belief.", source: "Motivation" },
  { text: "Mistakes are proof that you are trying.", source: "Motivation" },
  { text: "Be stronger than your excuses.", source: "Motivation" }
];

const BONUS_LINES = [
  "Keep shining.", "One day at a time.", "Grace over pressure.", "Choose growth.", 
  "Stay humble. Work hard.", "You’ve got this.", "Faith fuels focus.", 
  "Rise with purpose.", "Study with intention.", "Radiate positivity."
];

const RadianceDose = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Day of year calculation for daily reset
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const todayVerse = BIBLE_VERSES[dayOfYear % BIBLE_VERSES.length];
  const todayQuote = MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
  const bonusLine = BONUS_LINES[dayOfYear % BONUS_LINES.length];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="relative w-full min-w-[320px] sm:min-w-[360px] h-[280px] perspective-1000 group cursor-pointer animate-fadeIn" onClick={handleFlip}>
      <style>{`
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-style: preserve-3d;
        }
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 1.5rem;
          padding: 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }
        .flip-card-front {
          background-color: #fdf6e3;
          border: 1px solid rgba(176,135,10,0.15);
        }
        .flip-card-back {
          background-color: #f0f4f8;
          border: 1px solid rgba(100,116,139,0.15);
          transform: rotateY(180deg);
        }
        .cardboard-texture {
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: 1.5rem;
        }
      `}</style>

      <div className="flip-card-inner" style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        
        {/* FRONT: Motivational Quote */}
        <div className="flip-card-front">
          <div className="cardboard-texture" />
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[radial-gradient(circle_at_top_right,rgba(246,201,69,0.15),transparent_70%)] pointer-events-none rounded-tr-[1.5rem]" />
          
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-[#b0870a]">
              <Sparkles size={16} strokeWidth={2.5} />
              <span className="font-jakarta text-xs font-black tracking-[0.2em] uppercase">Daily Motivation</span>
            </div>
            <div className="text-[#b0870a]/50 group-hover:text-[#b0870a] transition-colors flex items-center gap-1">
              <span className="font-jakarta text-[9px] font-bold uppercase tracking-widest">Flip</span>
              <Repeat size={14} />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-4 z-10">
            <p className="font-playfair text-xl font-bold italic text-[#3a2b25] leading-snug">
              "{todayQuote.text}"
            </p>
            <p className="font-jakarta text-[11px] font-bold text-[#b0870a]/80 uppercase tracking-widest mt-4">
              — {todayQuote.source}
            </p>
          </div>

          <div className="z-10 mt-auto pt-4 border-t border-[#b0870a]/10 flex justify-between items-center">
            <span className="px-3 py-1 bg-[#F6C945]/20 text-[#6B5A10] rounded-full text-[10px] font-bold font-jakarta uppercase tracking-wider">
              {bonusLine}
            </span>
            <span className="font-jakarta text-[10px] font-black text-[#b0870a]/60 tracking-[0.15em] uppercase">
              Side A
            </span>
          </div>
        </div>

        {/* BACK: Bible Verse */}
        <div className="flip-card-back">
          <div className="cardboard-texture" />
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[radial-gradient(circle_at_top_right,rgba(168,197,160,0.2),transparent_70%)] pointer-events-none rounded-tr-[1.5rem]" />
          
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-[#4b6b49]">
              <BookOpen size={16} strokeWidth={2.5} />
              <span className="font-jakarta text-xs font-black tracking-[0.2em] uppercase">Bible Verse</span>
            </div>
            <div className="text-[#4b6b49]/50 group-hover:text-[#4b6b49] transition-colors flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A8C5A0]/20 border border-transparent group-hover:border-[#A8C5A0]/40">
              <span className="font-jakarta text-[9px] font-black uppercase tracking-[0.2em]">Flip</span>
              <div className="relative">
                <Repeat size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                <div className="absolute inset-0 bg-white/40 blur-sm animate-shimmer pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-4 z-10">
            <p className="font-playfair text-xl font-bold italic text-[#2c3b2b] leading-snug">
              "{todayVerse.text}"
            </p>
            <p className="font-jakarta text-[11px] font-bold text-[#6a8767] uppercase tracking-widest mt-4">
              — {todayVerse.source}
            </p>
          </div>

          <div className="z-10 mt-auto pt-4 border-t border-[#4b6b49]/10 flex justify-between items-center">
            <span className="px-3 py-1 bg-[#b0cfad]/30 text-[#4b6b49] rounded-full text-[10px] font-bold font-jakarta uppercase tracking-wider">
              {bonusLine}
            </span>
            <span className="font-jakarta text-[10px] font-black text-[#4b6b49]/50 tracking-[0.15em] uppercase">
              Side B
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RadianceDose;
