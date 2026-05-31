import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, Trash2, Calendar, Smile } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function DemoModal({ isOpen, onClose, onReset }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  if (!isOpen) return null;

  const generateStreak = async (days, statusMsg, successMsg) => {
    if (!user) return;
    setLoading(true);
    setStatus(statusMsg);
    try {
      // 1. Delete existing
      await supabase.from('mood_logs').delete().eq('user_id', user.id);
      await supabase.from('journal_entries').delete().eq('user_id', user.id);

      if (days > 0) {
        // 2. Generate days of consecutive logs
        const moodLogs = [];
        const now = new Date();
        const moods = ['rad', 'good', 'meh', 'good', 'rad', 'good'];
        const notes = [
          'Feeling absolutely amazing!',
          'Had a solid productive day.',
          'Feeling okay, just a normal day.',
          'Great progress on my assignments.',
          'Wonderful weekend relaxation!',
          'A bit tired but mentally strong.'
        ];

        for (let i = 0; i < days; i++) {
          const logDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const index = i % moods.length;
          moodLogs.push({
            user_id: user.id,
            mood_type: moods[index],
            intensity: moods[index] === 'rad' ? 5 : moods[index] === 'good' ? 4 : 3,
            note: notes[index],
            logged_at: logDate.toISOString()
          });
        }

        const { error: insertMoodsError } = await supabase.from('mood_logs').insert(moodLogs);
        if (insertMoodsError) throw insertMoodsError;

        // 3. Insert a journal entry
        const { error: insertJournalsError } = await supabase.from('journal_entries').insert([{
          user_id: user.id,
          content: 'Just updating my wellness journal to track my progress!',
          prompt: 'What did you learn about yourself this week?',
          created_at: now.toISOString()
        }]);
        if (insertJournalsError) throw insertJournalsError;
      }

      setStatus(successMsg);
      setTimeout(() => {
        onReset();
        onClose();
        setStatus('');
      }, 1000);
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedling = () => generateStreak(3, 'Planting seedling...', 'Success! 3-day streak (Seedling).');
  const handleBudding = () => generateStreak(10, 'Growing bud...', 'Success! 10-day streak (Budding).');
  const handleBlooming = () => generateStreak(20, 'Opening bloom...', 'Success! 20-day streak (Blooming).');
  const handleLegendary = () => generateStreak(36, 'Summoning legendary...', 'Success! 36-day streak (Legendary).');

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#3a2b25]/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#FDF9F2] rounded-[2.5rem] w-full max-w-md shadow-lift animate-scaleIn relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#F6C945]" />

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F6C945]/20 flex items-center justify-center text-[#6B5A10]">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="font-jakarta font-black text-[#3a2b25] text-xl uppercase tracking-tight">Demo Sandbox</h2>
              <p className="text-[10px] font-bold text-[#AA8E7E] uppercase tracking-widest mt-0.5">Control Account State</p>
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
        <div className="px-8 pb-8 pt-4 space-y-6 overflow-y-auto custom-scrollbar">
          <p className="text-xs text-[#3a2b25]/60 leading-relaxed">
            Quickly toggle the database status for this account to preview the 4 distinct growth stages of the <strong>Sunflower Streak Animation</strong>.
          </p>

          {status && (
            <div className={`p-4 rounded-2xl text-xs font-bold text-center border ${
              status.startsWith('Error') 
                ? 'bg-red-50 text-red-600 border-red-100' 
                : status.startsWith('Success')
                ? 'bg-green-50 text-green-600 border-green-100'
                : 'bg-yellow-50 text-yellow-600 border-yellow-100 animate-pulse'
            }`}>
              {status}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* Stage 1: Seedling */}
            <button
              onClick={handleSeedling}
              disabled={loading}
              className="flex items-center gap-4 p-5 rounded-3xl bg-white border border-[#AA8E7E]/10 hover:border-[#F6C945] hover:shadow-suncast transition-all text-left group active:scale-[0.98] transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#A8C5A0]/20 flex items-center justify-center text-[#2D5A29] group-hover:scale-110 transition-all">
                <Smile size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-jakarta font-black text-[#3a2b25] text-sm uppercase tracking-wider">Seedling (0-4 Days)</h4>
                <p className="text-[11px] text-[#AA8E7E] font-medium mt-0.5">3 Days. Small green sprout with tiny leaves.</p>
              </div>
            </button>

            {/* Stage 2: Budding */}
            <button
              onClick={handleBudding}
              disabled={loading}
              className="flex items-center gap-4 p-5 rounded-3xl bg-white border border-[#AA8E7E]/10 hover:border-[#F6C945] hover:shadow-suncast transition-all text-left group active:scale-[0.98] transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#A8C5A0]/40 flex items-center justify-center text-[#2D5A29] group-hover:scale-110 transition-all">
                <RefreshCw size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-jakarta font-black text-[#3a2b25] text-sm uppercase tracking-wider">Budding (5-14 Days)</h4>
                <p className="text-[11px] text-[#AA8E7E] font-medium mt-0.5">10 Days. Taller stem with a closed green bud.</p>
              </div>
            </button>

            {/* Stage 3: Blooming */}
            <button
              onClick={handleBlooming}
              disabled={loading}
              className="flex items-center gap-4 p-5 rounded-3xl bg-white border border-[#AA8E7E]/10 hover:border-[#F6C945] hover:shadow-suncast transition-all text-left group active:scale-[0.98] transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F6C945]/30 flex items-center justify-center text-[#6B5A10] group-hover:scale-110 transition-all">
                <Calendar size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-jakarta font-black text-[#3a2b25] text-sm uppercase tracking-wider">Blooming (15-29 Days)</h4>
                <p className="text-[11px] text-[#AA8E7E] font-medium mt-0.5">20 Days. Flower opens with simpler petals.</p>
              </div>
            </button>

            {/* Stage 4: Legendary */}
            <button
              onClick={handleLegendary}
              disabled={loading}
              className="flex items-center gap-4 p-5 rounded-3xl bg-white border border-[#AA8E7E]/10 hover:border-[#F6C945] hover:shadow-suncast transition-all text-left group active:scale-[0.98] transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F6C945]/50 flex items-center justify-center text-[#6B5A10] group-hover:scale-110 transition-all">
                <Sparkles size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-jakarta font-black text-[#3a2b25] text-sm uppercase tracking-wider">Legendary (30+ Days)</h4>
                <p className="text-[11px] text-[#AA8E7E] font-medium mt-0.5">36 Days. Full, intricate glowing sunflower.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-white border-t border-[#FDF9F2] text-center">
          <p className="text-[9px] font-black text-[#AA8E7E] uppercase tracking-[0.2em]">UniWell Developer Workspace</p>
        </div>
      </div>
    </div>
  );
}
