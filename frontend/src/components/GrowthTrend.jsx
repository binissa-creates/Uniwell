import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, TrendingUp as TrendIconPrimary } from 'lucide-react';

const MOOD_VALUES = {
  rad: 5, excited: 5, proud: 5,
  good: 4, hopeful: 4, grateful: 4, calm: 4,
  meh: 3, content: 3, confused: 3,
  bad: 2, nervous: 2, frustrated: 2, lonely: 2,
  awful: 1, angry: 1, burned_out: 1
};

const MOOD_COLORS = {
  rad: '#F6C945', excited: '#F6C945', proud: '#F6C945',
  good: '#A8C5A0', hopeful: '#A8C5A0', grateful: '#A8C5A0', calm: '#A8C5A0',
  meh: '#E9A066', content: '#E9A066', confused: '#E9A066',
  bad: '#D18D8D', nervous: '#D18D8D', frustrated: '#D18D8D', lonely: '#D18D8D',
  awful: '#8D8D8D', angry: '#8D8D8D', burned_out: '#8D8D8D'
};

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const GrowthTrend = ({ logs = [] }) => {
  const { moodPoints, trend, insight, loggedCount } = useMemo(() => {
    // 1. Prepare 7-day mood strip (Monday to Sunday)
    const weekData = [];
    const now = new Date();
    const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
    
    // Calculate the start of the week (Monday)
    const monday = new Date(now);
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + i);
      const dateStr = targetDate.toISOString().split('T')[0];
      
      const dayLogs = logs.filter(l => new Date(l.logged_at).toISOString().split('T')[0] === dateStr);
      // If multiple logs, take the latest one for that day
      const latestLog = dayLogs.length > 0 ? dayLogs[0] : null;
      
      weekData.push({
        label: DAYS_SHORT[targetDate.getDay()],
        log: latestLog
      });
    }

    // 2. Calculate Trend (Compare this week vs last week)
    const intensities = logs.map(l => MOOD_VALUES[l.mood_type] || 3);
    const recentAvg = intensities.slice(0, 5).reduce((a, b) => a + b, 0) / (intensities.slice(0, 5).length || 1);
    const prevAvg = intensities.slice(5, 10).reduce((a, b) => a + b, 0) / (intensities.slice(5, 10).length || 1);

    let trendLabel = "Steady";
    let TrendIcon = Minus;
    let trendColor = "#AA8E7E";
    let trendBg = "#F5F5F5";

    if (recentAvg > prevAvg + 0.2) {
      trendLabel = "Improving";
      TrendIcon = TrendingUp;
      trendColor = "#6A9966";
      trendBg = "#EAF2E6";
    } else if (recentAvg < prevAvg - 0.2) {
      trendLabel = "Declining";
      TrendIcon = TrendingDown;
      trendColor = "#BA1A1A";
      trendBg = "#FFF0F0";
    }

    // 3. Logged Count
    const count = weekData.filter(d => d.log !== null).length;

    // 4. Insight
    let insightStr = "Every log is a step toward understanding.";
    if (count >= 5) insightStr = "Consistency is your greatest strength.";
    if (recentAvg >= 4.2) insightStr = "You're blooming beautifully this week.";
    if (recentAvg <= 2.5) insightStr = "Rough patch—but roots grow in the dark.";
    if (count < 3) insightStr = "Your garden missed you. Try logging tomorrow.";
    
    // Specific insight for dips
    const dipDay = weekData.find(d => d.log && MOOD_VALUES[d.log.mood_type] <= 2);
    if (dipDay && recentAvg > 3.5) insightStr = `Dip on ${dipDay.label} — you recovered well.`;

    return {
      moodPoints: weekData,
      trend: { label: trendLabel, Icon: TrendIcon, color: trendColor, bg: trendBg },
      insight: insightStr,
      loggedCount: count
    };
  }, [logs]);

  const styles = {
    card: {
      backgroundColor: '#fff1ed',
      borderRadius: '2.5rem',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      minWidth: '320px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titleBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    title: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '0.75rem',
      fontWeight: 800,
      letterSpacing: '0.15em',
      color: '#b0870a',
      textTransform: 'uppercase',
    },
    badge: {
      backgroundColor: trend.bg,
      padding: '0.4rem 0.8rem',
      borderRadius: '9999px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
    },
    badgeText: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '0.7rem',
      fontWeight: 800,
      color: trend.color,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    barContainer: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: '0.75rem',
      height: '80px',
      padding: '0 0.5rem',
    },
    barWrapper: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
    },
    bar: (log) => {
      const moodKey = log?.mood_type || 'meh';
      const val = MOOD_VALUES[moodKey] || 3;
      return {
        width: '100%',
        borderRadius: '1rem 1rem 0.25rem 0.25rem',
        backgroundColor: log ? (MOOD_COLORS[moodKey] || '#A8C5A0') : '#f3f3f3',
        height: log ? `${(val / 5) * 100}%` : '15%',
        transition: 'height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      };
    },
    dayLabel: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '0.65rem',
      fontWeight: 700,
      color: '#AA8E7E',
    },
    divider: {
      height: '1px',
      backgroundColor: 'rgba(176,135,10,0.1)',
      width: '100%',
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '1.5rem',
    },
    statsLabel: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '0.65rem',
      fontWeight: 800,
      color: '#AA8E7E',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: '0.25rem',
    },
    statsValue: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '1.25rem',
      fontWeight: 800,
      color: '#3a2b25',
    },
    insight: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '0.85rem',
      fontWeight: 600,
      fontStyle: 'italic',
      color: '#5D4037',
      lineHeight: 1.4,
      maxWidth: '180px',
      textAlign: 'right',
    }
  };

  return (
    <div style={styles.card} className="animate-fadeIn">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleBox}>
          <TrendIconPrimary size={16} className="text-[#b0870a]" />
          <span style={styles.title}>Growth Trend</span>
        </div>
        <div style={styles.badge}>
          <trend.Icon size={12} color={trend.color} strokeWidth={3} />
          <span style={styles.badgeText}>{trend.label}</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div style={styles.barContainer}>
        {moodPoints.map((day, i) => (
          <div key={i} style={styles.barWrapper}>
            <div style={styles.bar(day.log)} />
            <span style={styles.dayLabel}>{day.label}</span>
          </div>
        ))}
      </div>

      <div style={styles.divider} />

      {/* Footer */}
      <div style={styles.footer}>
        <div>
          <p style={styles.statsLabel}>This Week</p>
          <p style={styles.statsValue}>
            {loggedCount} <span style={{ fontSize: '0.85rem', color: '#AA8E7E' }}>/ 7 logged</span>
          </p>
        </div>
        <p style={styles.insight}>
          "{insight}"
        </p>
      </div>
    </div>
  );
};

export default GrowthTrend;
