// ──────────────────────────────────────────────
// S-27 — Stats & History
// Full match history with filters — real data
// Clean data-readout styling (Manrope)
// ──────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';

// ─── Profile Accent ──────────────────────────

const PURPLE = '#a855f7';
const LIME = '#aaff00';
const RED = '#ff6b6b';
const CYAN = '#00ffff';

// ─── Types ───────────────────────────────────

interface MatchRecord {
  id: string;
  modeId: string;
  difficulty: string;
  result: 'win' | 'loss' | 'draw' | null;
  score: number;
  xpEarned: number;
  timeTakenMs: number | null;
  opponent: string;
  startedAt: string;
  endedAt: string | null;
}

interface Stats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalXp: number;
  winRate: number;
}

// ─── Mode display names ──────────────────────

const MODE_NAMES: Record<string, string> = {
  'prime-grid': 'Prime Grid',
  'vault-breaker': 'Vault Breaker',
  'interrogation': 'Interrogation',
  'canvas-fracture': 'Canvas Fracture',
  'glyph-grid': 'Glyph Grid',
  'sequence-recall': 'Sequence Recall',
  'pattern-lock': 'Pattern Lock',
  'cipher-wheel': 'Cipher Wheel',
};

// ─── Component ───────────────────────────────

export default function StatsHistory() {
  const navigate = useNavigate();
  const [modeFilter, setModeFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'loss' | 'draw'>('all');
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch match history
  useEffect(() => {
    fetch('/api/profile/stats', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.matches ?? []);
        setStats(data.stats ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Unique modes for filter dropdown
  const modes = useMemo(() => {
    return [...new Set(matches.map((m) => m.modeId))].sort();
  }, [matches]);

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (modeFilter !== 'all' && m.modeId !== modeFilter) return false;
      if (resultFilter !== 'all' && m.result !== resultFilter) return false;
      return true;
    });
  }, [matches, modeFilter, resultFilter]);

  // Compute filtered aggregate stats
  const filteredStats = useMemo(() => {
    const total = filtered.length;
    const wins = filtered.filter((m) => m.result === 'win').length;
    const losses = filtered.filter((m) => m.result === 'loss').length;
    const draws = filtered.filter((m) => m.result === 'draw').length;
    const avgScore = total > 0 ? Math.round(filtered.reduce((s, m) => s + m.score, 0) / total) : 0;
    const bestScore = total > 0 ? Math.max(...filtered.map((m) => m.score)) : 0;
    return {
      total, wins, losses, draws, avgScore, bestScore,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    };
  }, [filtered]);

  const resultColor = (r: string | null) => (r === 'win' ? LIME : r === 'loss' ? RED : CYAN);
  const resultChar = (r: string | null) => (r === 'win' ? 'W' : r === 'loss' ? 'L' : 'D');

  const formatTime = (ms: number | null) => {
    if (!ms) return '--';
    const sec = Math.floor(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toISOString().slice(0, 10);
  };

  return (
    <div className="relative min-h-screen text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'var(--bg-primary)',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <motion.button
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors mb-6 cursor-pointer"
          onClick={() => navigate('/me')}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.96 }}
        >
          ← Profile
        </motion.button>

        {/* Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="text-2xl font-black uppercase tracking-[0.15em] mb-1"
            style={{ fontFamily: 'var(--font-primary)', color: PURPLE }}
          >
            Stats & History
          </h1>
          <p className="text-[0.5rem] uppercase tracking-[0.3em] text-white/20">
            {stats?.gamesPlayed ?? 0} matches on record
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center">
            <span className="text-[0.5rem] uppercase tracking-widest text-white/20">Loading…</span>
          </div>
        )}

        {!loading && (
          <>
            {/* Aggregate Stats */}
            <motion.div
              className="mb-6 px-5 py-4"
              style={{
                background: 'var(--bg-surface)',
                border: `2px solid ${PURPLE}`,
                boxShadow: 'var(--shadow-md)',
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {[
                  { label: 'Played', value: filteredStats.total, color: 'rgba(255,255,255,0.5)' },
                  { label: 'Wins', value: filteredStats.wins, color: LIME },
                  { label: 'Losses', value: filteredStats.losses, color: RED },
                  { label: 'Win %', value: `${filteredStats.winRate}%`, color: PURPLE },
                  { label: 'Avg Score', value: filteredStats.avgScore.toLocaleString(), color: CYAN },
                  { label: 'Best', value: filteredStats.bestScore.toLocaleString(), color: '#c9a84c' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <span
                      className="text-base font-black tabular-nums block"
                      style={{ fontFamily: 'var(--font-primary)', color: s.color }}
                    >
                      {s.value}
                    </span>
                    <span className="text-[0.4rem] uppercase tracking-[0.2em] text-white/20">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div
              className="flex flex-wrap gap-2 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="text-[0.5rem] font-bold uppercase tracking-[0.1em] px-3 py-1.5 cursor-pointer appearance-none"
                style={{
                  fontFamily: 'var(--font-primary)',
                  background: 'var(--bg-surface)',
                  color: modeFilter === 'all' ? 'rgba(255,255,255,0.3)' : PURPLE,
                  border: `1px solid ${modeFilter === 'all' ? 'rgba(255,255,255,0.08)' : PURPLE}`,
                  outline: 'none',
                }}
              >
                <option value="all">All Modes</option>
                {modes.map((m) => (
                  <option key={m} value={m}>{MODE_NAMES[m] ?? m}</option>
                ))}
              </select>

              {(['all', 'win', 'loss', 'draw'] as const).map((r) => {
                const active = resultFilter === r;
                const labels: Record<string, string> = { all: 'All', win: 'Wins', loss: 'Losses', draw: 'Draws' };
                return (
                  <button
                    key={r}
                    onClick={() => setResultFilter(r)}
                    className="text-[0.5rem] font-bold uppercase tracking-[0.1em] px-3 py-1.5 cursor-pointer"
                    style={{
                      fontFamily: 'var(--font-primary)',
                      background: active ? (r === 'all' ? PURPLE : resultColor(r)) : 'transparent',
                      color: active ? 'var(--bg-primary)' : 'rgba(255,255,255,0.25)',
                      border: `1px solid ${active ? (r === 'all' ? PURPLE : resultColor(r)) : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    {labels[r]}
                  </button>
                );
              })}
            </motion.div>

            {/* Table Header */}
            <div
              className="grid items-center gap-2 px-4 py-2 text-[0.4rem] uppercase tracking-[0.2em] text-white/15"
              style={{
                fontFamily: 'var(--font-primary)',
                gridTemplateColumns: '2rem 1fr 5rem 3.5rem 3rem 4rem',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span>R</span>
              <span>Mode</span>
              <span>Opponent</span>
              <span className="text-right">Score</span>
              <span className="text-right">Time</span>
              <span className="text-right">Date</span>
            </div>

            {/* Match Rows */}
            <div className="flex flex-col">
              {filtered.length === 0 && (
                <div className="py-12 text-center text-[0.5rem] text-white/15 uppercase tracking-widest">
                  {matches.length === 0 ? 'No matches played yet' : 'No matches found'}
                </div>
              )}
              {filtered.map((match, i) => (
                <motion.button
                  key={match.id}
                  onClick={() => navigate(`/play/review/${match.id}`)}
                  className="grid items-center gap-2 px-4 py-3 text-left cursor-pointer w-full"
                  style={{
                    fontFamily: 'var(--font-primary)',
                    gridTemplateColumns: '2rem 1fr 5rem 3.5rem 3rem 4rem',
                    background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                  }}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.02 }}
                  whileHover={{ background: 'rgba(168,85,247,0.04)' }}
                >
                  <span
                    className="text-[0.6rem] font-bold"
                    style={{ color: resultColor(match.result) }}
                  >
                    {resultChar(match.result)}
                  </span>
                  <span className="text-[0.5rem] text-white/40 truncate">
                    {MODE_NAMES[match.modeId] ?? match.modeId}
                  </span>
                  <span className="text-[0.5rem] text-white/25 truncate">
                    {match.opponent}
                  </span>
                  <span
                    className="text-[0.5rem] font-bold tabular-nums text-right"
                    style={{ color: resultColor(match.result) }}
                  >
                    {match.score.toLocaleString()}
                  </span>
                  <span className="text-[0.45rem] tabular-nums text-right text-white/20">
                    {formatTime(match.timeTakenMs)}
                  </span>
                  <span className="text-[0.4rem] tabular-nums text-right text-white/12">
                    {formatDate(match.startedAt)}
                  </span>
                </motion.button>
              ))}
            </div>

            <div className="mt-4 text-center">
              <p
                className="text-[0.4rem] uppercase tracking-[0.2em] text-white/10"
                style={{ fontFamily: 'var(--font-primary)' }}
              >
                showing {filtered.length} of {matches.length} records
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
