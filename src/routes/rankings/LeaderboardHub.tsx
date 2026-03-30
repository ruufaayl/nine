// ──────────────────────────────────────────────
// S-22 — Leaderboard Hub
// Global / Friends / By Mode toggles
// Fetches real data from /api/leaderboard
// ──────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../layouts/AppLayout';

// ─── Accents ────────────────────────────────

const RANK_GOLD = '#c9a84c';
const PODIUM = ['#c9a84c', '#c0c0c0', '#cd7f32'] as const;

// ─── Types ──────────────────────────────────

interface LeaderEntry {
  id: string;
  username: string;
  rank: string;
  xp: number;
  wins: number;
  gamesPlayed: number;
  isSelf?: boolean;
}

type Tab = 'global' | 'friends' | 'mode';

// ─── Component ──────────────────────────────

export default function LeaderboardHub() {
  const navigate = useNavigate();
  const user = useUser();
  const [tab, setTab] = useState<Tab>('global');
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tab === 'mode') return; // mode tab navigates away

    setLoading(true);
    const params = new URLSearchParams();
    if (tab === 'friends' && user?.id) {
      params.set('tab', 'friends');
      params.set('userId', user.id);
    }

    fetch(`/api/leaderboard?${params.toString()}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        const players: LeaderEntry[] = (data.players ?? []).map(
          (p: { id: string; username: string; rank: string; xp: number; wins: number; gamesPlayed: number }) => ({
            ...p,
            isSelf: p.id === user?.id,
          }),
        );
        setEntries(players);
        setTotalCount(data.totalCount ?? players.length);
      })
      .catch(() => {
        setEntries([]);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [tab, user?.id]);

  return (
    <div className="relative min-h-screen text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #1a160a 0%, #0a0a0f 50%, #060609 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="text-2xl font-black uppercase tracking-[0.15em] mb-1"
            style={{ fontFamily: 'var(--font-display)', color: RANK_GOLD }}
          >
            Leaderboard
          </h1>
          <p className="text-[0.5rem] uppercase tracking-[0.3em] text-white/20">
            {totalCount} operatives ranked
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="flex gap-2 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {([
            { key: 'global' as Tab, label: 'Global' },
            { key: 'friends' as Tab, label: 'Friends' },
            { key: 'mode' as Tab, label: 'By Mode' },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => t.key === 'mode' ? navigate('/rankings/mode/prime-grid') : setTab(t.key)}
              className="text-[0.55rem] font-bold uppercase tracking-[0.15em] px-4 py-2 cursor-pointer transition-all duration-150"
              style={{
                fontFamily: 'var(--font-display)',
                background: tab === t.key && t.key !== 'mode' ? RANK_GOLD : 'transparent',
                color: tab === t.key && t.key !== 'mode' ? '#0a0a0f' : 'rgba(255,255,255,0.3)',
                border: `1px solid ${tab === t.key && t.key !== 'mode' ? RANK_GOLD : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {t.label}
            </button>
          ))}

          <button
            onClick={() => navigate('/rankings/season')}
            className="text-[0.55rem] font-bold uppercase tracking-[0.15em] px-4 py-2 cursor-pointer ml-auto"
            style={{
              fontFamily: 'var(--font-display)',
              color: `${RANK_GOLD}88`,
              border: `1px solid ${RANK_GOLD}30`,
            }}
          >
            Season
          </button>
        </motion.div>

        {/* Table header */}
        <div
          className="grid items-center gap-3 px-5 py-2 mb-1 text-[0.4rem] uppercase tracking-[0.25em] text-white/20"
          style={{ gridTemplateColumns: '2rem 1fr 4rem 4rem' }}
        >
          <span>#</span>
          <span>Operative</span>
          <span className="text-right">XP</span>
          <span className="text-right">Wins</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center">
            <span className="text-[0.5rem] uppercase tracking-widest text-white/20">Loading…</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && entries.length === 0 && (
          <div className="py-12 text-center">
            <span className="text-[0.5rem] uppercase tracking-widest text-white/15">
              {tab === 'friends' ? 'No friends yet — add some!' : 'No players found'}
            </span>
          </div>
        )}

        {/* Entries */}
        {!loading && entries.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              className="flex flex-col gap-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {entries.map((entry, i) => {
                const position = i + 1;
                const isPodium = position <= 3;
                const podiumColor = isPodium ? PODIUM[i] : undefined;

                return (
                  <motion.button
                    key={entry.id}
                    onClick={() => !entry.isSelf && navigate(`/social/player/${entry.id}`)}
                    className="grid items-center gap-3 px-5 py-3 text-left cursor-pointer w-full"
                    style={{
                      gridTemplateColumns: '2rem 1fr 4rem 4rem',
                      background: entry.isSelf ? `${RANK_GOLD}08` : '#0c0c14',
                      border: entry.isSelf
                        ? `2px solid ${RANK_GOLD}`
                        : isPodium
                          ? `1px solid ${podiumColor}30`
                          : '1px solid rgba(255,255,255,0.03)',
                      boxShadow: entry.isSelf ? `4px 4px 0px ${RANK_GOLD}` : 'none',
                    }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={!entry.isSelf ? { borderColor: `${RANK_GOLD}40` } : {}}
                  >
                    <span
                      className="text-sm font-black tabular-nums"
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: podiumColor ?? (entry.isSelf ? RANK_GOLD : 'rgba(255,255,255,0.2)'),
                      }}
                    >
                      {position}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold uppercase tracking-[0.08em] truncate"
                          style={{
                            fontFamily: 'var(--font-display)',
                            color: entry.isSelf ? RANK_GOLD : 'rgba(255,255,255,0.7)',
                          }}
                        >
                          {entry.username}
                        </span>
                        {entry.isSelf && (
                          <span
                            className="text-[0.4rem] uppercase tracking-wider px-1.5 py-0.5"
                            style={{ color: RANK_GOLD, border: `1px solid ${RANK_GOLD}40` }}
                          >
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[0.4rem] text-white/20">{entry.rank}</span>
                    </div>

                    <span
                      className="text-[0.6rem] font-bold tabular-nums text-right"
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: podiumColor ?? (entry.isSelf ? RANK_GOLD : 'rgba(255,255,255,0.4)'),
                      }}
                    >
                      {entry.xp.toLocaleString()}
                    </span>

                    <span className="text-[0.55rem] tabular-nums text-right text-white/25">
                      {entry.wins}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
