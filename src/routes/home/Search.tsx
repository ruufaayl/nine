// ──────────────────────────────────────────────
// S-08 — Search (find players by username)
// ──────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Social Accent ──────────────────────────

const SOCIAL = '#3eb8cf';

// ─── Mock Players ───────────────────────────

const MOCK_PLAYERS = [
  { id: 'u1', username: 'SPECTRAL_07', rank: 'Operative', xp: 3200, online: true },
  { id: 'u2', username: 'CIPHER_X', rank: 'Diamond', xp: 8400, online: true },
  { id: 'u3', username: 'NOVA_PRIME', rank: 'Platinum', xp: 6100, online: false },
  { id: 'u4', username: 'SHADOW_9', rank: 'Gold', xp: 4500, online: true },
  { id: 'u5', username: 'AXIOM_4', rank: 'Silver', xp: 2100, online: false },
  { id: 'u6', username: 'VECTOR_7', rank: 'Legend', xp: 12000, online: true },
  { id: 'u7', username: 'GHOST_12', rank: 'Bronze', xp: 800, online: false },
  { id: 'u8', username: 'ZERO_1', rank: 'Operative', xp: 3800, online: true },
] as const;

// ─── Component ──────────────────────────────

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim().length > 0
    ? MOCK_PLAYERS.filter((p) =>
        p.username.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  const handleSelect = useCallback(
    (playerId: string) => {
      navigate(`/social/player/${playerId}`);
    },
    [navigate],
  );

  return (
    <div className="relative min-h-screen text-white">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #091a1f 0%, #0a0a0f 50%, #060609 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="text-2xl font-black uppercase tracking-[0.15em] mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Search
          </h1>
          <p className="text-[0.5rem] uppercase tracking-[0.3em] text-white/20">
            Find operatives by callsign
          </p>
        </motion.div>

        {/* Search input */}
        <motion.div
          className="relative mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3.5"
            style={{
              background: '#0c0c14',
              border: `2px solid ${focused ? SOCIAL : 'rgba(255,255,255,0.1)'}`,
              boxShadow: focused ? `0 0 20px ${SOCIAL}15` : 'none',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ color: focused ? SOCIAL : 'rgba(255,255,255,0.2)' }}>⌕</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search by callsign…"
              className="flex-1 bg-transparent text-sm text-white outline-none uppercase tracking-wider placeholder:text-white/15 placeholder:normal-case"
              style={{ fontFamily: 'var(--font-display)' }}
              autoFocus
            />
            {query && (
              <motion.button
                className="text-white/20 hover:text-white/50 transition-colors text-xs cursor-pointer"
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.85 }}
              >
                ✕
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {query.trim().length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {results.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[0.45rem] uppercase tracking-[0.3em] text-white/15 mb-1">
                    {results.length} operative{results.length !== 1 ? 's' : ''} found
                  </p>
                  {results.map((player, i) => (
                    <motion.button
                      key={player.id}
                      onClick={() => handleSelect(player.id)}
                      className="flex items-center gap-4 w-full px-5 py-4 text-left cursor-pointer group"
                      style={{
                        background: '#0c0c14',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{
                        borderColor: `${SOCIAL}40`,
                        boxShadow: `4px 4px 0px ${SOCIAL}`,
                        x: -2,
                        y: -2,
                      }}
                    >
                      {/* Online indicator */}
                      <div className="relative">
                        <div
                          className="w-10 h-10 flex items-center justify-center text-lg"
                          style={{
                            border: `2px solid ${player.online ? SOCIAL : 'rgba(255,255,255,0.1)'}`,
                          }}
                        >
                          ◈
                        </div>
                        {player.online && (
                          <div
                            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                            style={{ background: '#22c55e', border: '2px solid #0c0c14' }}
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="text-sm font-bold uppercase tracking-[0.08em] truncate"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {player.username}
                          </span>
                          {player.online && (
                            <span className="text-[0.4rem] uppercase tracking-widest text-green-400/60">
                              Online
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="text-[0.45rem] uppercase tracking-wider"
                            style={{ color: SOCIAL }}
                          >
                            {player.rank}
                          </span>
                          <span className="text-[0.45rem] text-white/20 tabular-nums">
                            {player.xp.toLocaleString()} XP
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <span className="text-white/10 group-hover:text-white/40 transition-colors">→</span>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <span className="text-3xl text-white/10">⌕</span>
                  <p className="text-xs text-white/25">No operatives matching "{query}"</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="flex flex-col items-center gap-3 py-16 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="text-4xl text-white/5">⌕</span>
              <p className="text-[0.55rem] uppercase tracking-[0.2em] text-white/15">
                Type a callsign to search
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
