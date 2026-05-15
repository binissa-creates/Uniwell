import React from 'react';
import { Sparkles } from 'lucide-react';

const QUOTES = [
  // Self-Care (10)
  { text: "Rest is not earned, it is a requirement of the soul.", tag: "Self-Care" },
  { text: "Boundaries are the highest form of self-respect.", tag: "Self-Care" },
  { text: "Be gentle with yourself; you are doing the best you can.", tag: "Self-Care" },
  { text: "You cannot pour from an empty cup. Fill yourself first.", tag: "Self-Care" },
  { text: "Self-care is giving the world the best of you, instead of what’s left of you.", tag: "Self-Care" },
  { text: "Your worth is not measured by your productivity.", tag: "Self-Care" },
  { text: "Softness is not weakness; it is the strength to remain open.", tag: "Self-Care" },
  { text: "It’s okay to take a break. The world will wait for you.", tag: "Self-Care" },
  { text: "Listen to your body when it whispers, so you don’t have to hear it scream.", tag: "Self-Care" },
  { text: "Protect your peace like it’s the most valuable thing you own.", tag: "Self-Care" },
  // Motivation (9)
  { text: "Resilience is the ability to bloom even after the harshest winter.", tag: "Motivation" },
  { text: "Progress is rarely a straight line; every curve is part of the journey.", tag: "Motivation" },
  { text: "Survival is a victory in itself. Honor your strength.", tag: "Motivation" },
  { text: "Your potential is a seed waiting for the right moment to rise.", tag: "Motivation" },
  { text: "The hardest step is the one you take when you’re most tired.", tag: "Motivation" },
  { text: "Keep going. You haven’t even seen the best version of yourself yet.", tag: "Motivation" },
  { text: "Small wins are still wins. Celebrate every inch of ground gained.", tag: "Motivation" },
  { text: "You are the architect of your own light. Keep building.", tag: "Motivation" },
  { text: "The sun always returns, even after the longest night.", tag: "Motivation" },
  // Mindfulness (5)
  { text: "Breath is the bridge between the world and your soul.", tag: "Mindfulness" },
  { text: "Presence is the greatest gift you can give to yourself.", tag: "Mindfulness" },
  { text: "In stillness, you find the answers that noise tries to hide.", tag: "Mindfulness" },
  { text: "Letting go is the final act of healing. Release it to the wind.", tag: "Mindfulness" },
  { text: "Be here now. The past is a memory, the future is a dream.", tag: "Mindfulness" },
  // Growth (8)
  { text: "Healing is not a destination, but a continuous unfolding.", tag: "Growth" },
  { text: "Becoming is better than being perfect.", tag: "Growth" },
  { text: "Roots must grow deep before the flower can reach the sky.", tag: "Growth" },
  { text: "Change is the only constant in a garden that is alive.", tag: "Growth" },
  { text: "Every petal you shed makes room for a new bloom.", tag: "Growth" },
  { text: "You are blooming in ways you cannot see yet.", tag: "Growth" },
  { text: "The soil of struggle often produces the most beautiful flowers.", tag: "Growth" },
  { text: "Grow at your own pace; even the slowest bloom is a miracle.", tag: "Growth" }
];

const RadianceDose = () => {
  // Day of year calculation
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const todayQuote = QUOTES[dayOfYear % QUOTES.length];

  const styles = {
    card: {
      backgroundColor: '#fff1ed',
      borderRadius: '1.5rem',
      padding: '1.5rem 2rem',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      transition: 'all 0.3s ease',
    },
    shimmer: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: '150px',
      height: '150px',
      background: 'radial-gradient(circle at top right, rgba(246,201,69,0.18), transparent 70%)',
      pointerEvents: 'none',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    label: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '0.75rem',
      fontWeight: 800,
      letterSpacing: '0.2em',
      color: '#b0870a',
      textTransform: 'uppercase',
    },
    quote: {
      fontFamily: "'Playfair Display', serif",
      fontSize: '1.5rem',
      fontWeight: 700,
      fontStyle: 'italic',
      color: '#3b2a1a',
      lineHeight: 1.4,
      margin: 0,
    },
    divider: {
      height: '1px',
      backgroundColor: 'rgba(176,135,10,0.15)',
      width: '100%',
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tag: {
      backgroundColor: '#b0cfad',
      color: '#6a9966',
      padding: '0.4rem 1rem',
      borderRadius: '9999px',
      fontSize: '0.7rem',
      fontWeight: 800,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    dailyBloom: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '0.65rem',
      fontWeight: 700,
      color: '#c4a26a',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
    }
  };

  return (
    <div style={styles.card} className="radiance-dose-card animate-fadeIn">
      <div style={styles.shimmer} />
      
      <div style={styles.header}>
        <Sparkles size={18} color="#b0870a" strokeWidth={2.5} />
        <span style={styles.label}>Radiance Dose</span>
      </div>

      <p style={styles.quote}>
        "{todayQuote.text}"
      </p>

      <div style={styles.divider} />

      <div style={styles.footer}>
        <div style={styles.tag}>{todayQuote.tag}</div>
        <span style={styles.dailyBloom}>Daily Bloom</span>
      </div>
    </div>
  );
};

export default RadianceDose;
