// ──────────────────────────────────────────────
// S-23 — Season Rankings (tier breakdown)
// ──────────────────────────────────────────────

import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';

const RANK_GOLD = '#c9a84c';

interface Tier {
  name: string;
  color: string;
  range: string;
  players: number;
  topPlayer: string;
}

const TIERS: Tier[] = [
  { name: 'Legend', color: '#f472b6', range: '10,000+ XP', players: 3, topPlayer: 'VECTOR_7' },
  { name: 'Diamond', color: '#22d3ee', range: '7,500 – 9,999', players: 8, topPlayer: 'CIPHER_X' },
  { name: 'Platinum', color: '#a5b4fc', range: '5,000 – 7,499', players: 15, topPlayer: 'NOVA_PRIME' },
  { name: 'Gold', color: '#fbbf24', range: '3,500 – 4,999', players: 32, topPlayer: 'SHADOW_9' },
  { name: 'Silver', color: '#c0c0c0', range: '2,000 – 3,499', players: 58, topPlayer: 'AXIOM_4' },
  { name: 'Bronze', color: '#cd7f32', range: '500 – 1,999', players: 124, topPlayer: 'GHOST_12' },
  { name: 'Recruit', color: '#6b7280', range: '0 – 499', players: 247, topPlayer: '—' },
];

const TOTAL = TIERS.reduce((s, t) => s + t.players, 0);
const SEASON_END = 'Apr 15, 2026';

export default function SeasonRankings() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a160a 0%, #0a0a0f 50%, #060609 100%)' }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <motion.button
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors mb-6 cursor-pointer"
          onClick={() => navigate('/rankings')}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.96 }}
        >
          ← Leaderboard
        </motion.button>

        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="text-2xl font-black uppercase tracking-[0.15em] mb-1"
            style={{ fontFamily: 'var(--font-display)', color: RANK_GOLD }}
          >
            Season 3
          </h1>
          <p className="text-[0.5rem] uppercase tracking-[0.3em] text-white/20">
            {TOTAL} operatives · Ends {SEASON_END}
          </p>
        </motion.div>

        {/* Tier cards */}
        <div className="flex flex-col gap-3">
          {TIERS.map((tier, i) => {
            const pct = Math.round((tier.players / TOTAL) * 100);
            return (
              <motion.div
                key={tier.name}
                className="relative overflow-hidden px-5 py-4"
                style={{
                  background: '#0c0c14',
                  border: `2px solid ${tier.color}`,
                  boxShadow: `4px 4px 0px ${tier.color}`,
                }}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                {/* Fill bar */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(to right, ${tier.color}08, transparent)`,
                    width: `${pct}%`,
                  }}
                />

                <div className="relative flex items-center gap-4">
                  {/* Tier badge */}
                  <div
                    className="w-10 h-10 flex items-center justify-center shrink-0 text-lg font-black"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: tier.color,
                      border: `2px solid ${tier.color}40`,
                    }}
                  >
                    {tier.name[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-sm font-bold uppercase tracking-[0.1em] block"
                      style={{ fontFamily: 'var(--font-display)', color: tier.color }}
                    >
                      {tier.name}
                    </span>
                    <span className="text-[0.45rem] text-white/20">{tier.range}</span>
                  </div>

                  {/* Stats */}
                  <div className="text-right shrink-0">
                    <span
                      className="text-sm font-black tabular-nums block"
                      style={{ fontFamily: 'var(--font-display)', color: tier.color }}
                    >
                      {tier.players}
                    </span>
                    <span className="text-[0.4rem] text-white/15">players ({pct}%)</span>
                  </div>

                  {/* Top player */}
                  <span className="text-[0.45rem] text-white/20 w-20 text-right shrink-0 truncate hidden sm:block">
                    #{1} {tier.topPlayer}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
