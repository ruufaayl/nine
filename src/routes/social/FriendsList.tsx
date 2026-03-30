// ──────────────────────────────────────────────
// S-19 — Friends List (Social Hub)
// Fetches real friends from /api/friends
// ──────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useRequireAuth } from '../../lib/useRequireAuth';

// ─── Social Accent ──────────────────────────

const SOCIAL = '#3eb8cf';

// ─── Types ──────────────────────────────────

type FriendStatus = 'online' | 'in_game' | 'offline';

interface Friend {
  id: string;
  username: string;
  rank: string;
  xp: number;
  status: FriendStatus;
  currentGame?: string;
}

interface PendingRequest {
  id: string;
  username: string;
  rank: string;
  xp: number;
  direction: 'incoming' | 'outgoing';
}

const STATUS_CONFIG: Record<FriendStatus, { label: string; color: string }> = {
  online:  { label: 'Online', color: '#22c55e' },
  in_game: { label: 'In Game', color: SOCIAL },
  offline: { label: 'Offline', color: 'rgba(255,255,255,0.15)' },
};

type Tab = 'friends' | 'pending';

// ─── Component ──────────────────────────────

export default function FriendsList() {
  useRequireAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(() => {
    fetch('/api/friends', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setFriends(data.friends ?? []);
        setPending(data.pending ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  const handleAction = useCallback(async (intent: string, targetId: string) => {
    await fetch('/api/friends', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent, targetId }),
    });
    fetchFriends();
  }, [fetchFriends]);

  // Sort: in_game first, then online, then offline
  const sorted = [...friends].sort((a, b) => {
    const order: Record<FriendStatus, number> = { in_game: 0, online: 1, offline: 2 };
    return order[a.status] - order[b.status];
  });

  const onlineCount = friends.filter((f) => f.status !== 'offline').length;

  return (
    <div className="relative min-h-screen text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #091a1f 0%, #0a0a0f 50%, #060609 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1
              className="text-2xl font-black uppercase tracking-[0.15em] mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Social Hub
            </h1>
            <p className="text-[0.5rem] uppercase tracking-[0.3em]" style={{ color: `${SOCIAL}88` }}>
              {loading ? '…' : `${onlineCount} operative${onlineCount !== 1 ? 's' : ''} online`}
            </p>
          </div>

          <motion.button
            onClick={() => navigate('/search')}
            className="text-[0.55rem] font-bold uppercase tracking-[0.15em] px-4 py-2 cursor-pointer"
            style={{
              color: SOCIAL,
              border: `2px solid ${SOCIAL}`,
              boxShadow: `3px 3px 0px ${SOCIAL}`,
              fontFamily: 'var(--font-display)',
            }}
            whileHover={{ boxShadow: `5px 5px 0px ${SOCIAL}`, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Find Players
          </motion.button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="flex gap-2 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {([
            { key: 'friends' as Tab, label: `Friends (${friends.length})` },
            { key: 'pending' as Tab, label: `Pending (${pending.length})` },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="text-[0.55rem] font-bold uppercase tracking-[0.15em] px-4 py-2 cursor-pointer transition-all duration-150"
              style={{
                fontFamily: 'var(--font-display)',
                background: tab === t.key ? SOCIAL : 'transparent',
                color: tab === t.key ? '#0a0a0f' : 'rgba(255,255,255,0.3)',
                border: `1px solid ${tab === t.key ? SOCIAL : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center">
            <span className="text-[0.5rem] uppercase tracking-widest text-white/20">Loading…</span>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <AnimatePresence mode="wait">
            {tab === 'friends' ? (
              <motion.div
                key="friends"
                className="flex flex-col gap-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {sorted.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-[0.5rem] text-white/15 uppercase tracking-widest mb-4">
                      No friends yet
                    </p>
                    <motion.button
                      onClick={() => navigate('/search')}
                      className="text-[0.55rem] font-bold uppercase tracking-[0.15em] px-5 py-2 cursor-pointer"
                      style={{
                        color: SOCIAL,
                        border: `2px solid ${SOCIAL}`,
                        boxShadow: `3px 3px 0px ${SOCIAL}`,
                        fontFamily: 'var(--font-display)',
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Find Players
                    </motion.button>
                  </div>
                )}
                {sorted.map((friend, i) => {
                  const cfg = STATUS_CONFIG[friend.status];
                  return (
                    <motion.div
                      key={friend.id}
                      className="flex items-center gap-4 px-5 py-4 group"
                      style={{
                        background: '#0c0c14',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="relative">
                        <div
                          className="w-10 h-10 flex items-center justify-center text-lg"
                          style={{
                            border: `2px solid ${friend.status !== 'offline' ? SOCIAL : 'rgba(255,255,255,0.08)'}`,
                            color: friend.status !== 'offline' ? SOCIAL : 'rgba(255,255,255,0.2)',
                          }}
                        >
                          ◈
                        </div>
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                          style={{ background: cfg.color, border: '2px solid #0c0c14' }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => navigate(`/social/player/${friend.id}`)}
                          className="text-sm font-bold uppercase tracking-[0.08em] truncate block cursor-pointer hover:text-white transition-colors"
                          style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.7)' }}
                        >
                          {friend.username}
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-[0.45rem] uppercase tracking-wider" style={{ color: cfg.color }}>
                            {cfg.label}
                          </span>
                          {friend.currentGame && (
                            <>
                              <span className="text-[0.35rem] text-white/10">·</span>
                              <span className="text-[0.45rem] text-white/20">{friend.currentGame}</span>
                            </>
                          )}
                          <span className="text-[0.35rem] text-white/10">·</span>
                          <span className="text-[0.45rem] text-white/15">{friend.rank}</span>
                        </div>
                      </div>

                      {friend.status !== 'offline' && (
                        <motion.button
                          onClick={() => navigate(`/social/challenge/${friend.id}`)}
                          className="text-[0.5rem] font-bold uppercase tracking-[0.15em] px-3 py-1.5 cursor-pointer shrink-0"
                          style={{
                            fontFamily: 'var(--font-display)',
                            color: SOCIAL,
                            border: `1px solid ${SOCIAL}40`,
                            background: `${SOCIAL}08`,
                          }}
                          whileHover={{ background: `${SOCIAL}20`, boxShadow: `3px 3px 0px ${SOCIAL}` }}
                          whileTap={{ scale: 0.96 }}
                        >
                          Challenge
                        </motion.button>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="pending"
                className="flex flex-col gap-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {pending.length === 0 && (
                  <div className="py-12 text-center text-[0.5rem] text-white/15 uppercase tracking-widest">
                    No pending requests
                  </div>
                )}
                {pending.map((req, i) => (
                  <motion.div
                    key={req.id}
                    className="flex items-center gap-4 px-5 py-4"
                    style={{
                      background: '#0c0c14',
                      border: `1px solid ${req.direction === 'incoming' ? `${SOCIAL}20` : 'rgba(255,255,255,0.04)'}`,
                    }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div
                      className="w-10 h-10 flex items-center justify-center text-lg"
                      style={{ border: '2px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)' }}
                    >
                      ◈
                    </div>

                    <div className="flex-1 min-w-0">
                      <span
                        className="text-sm font-bold uppercase tracking-[0.08em] block"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {req.username}
                      </span>
                      <span className="text-[0.45rem] text-white/20">
                        {req.rank} · {req.xp.toLocaleString()} XP
                      </span>
                    </div>

                    <span
                      className="text-[0.4rem] uppercase tracking-widest shrink-0"
                      style={{ color: req.direction === 'incoming' ? SOCIAL : 'rgba(255,255,255,0.2)' }}
                    >
                      {req.direction === 'incoming' ? 'Incoming' : 'Sent'}
                    </span>

                    {req.direction === 'incoming' && (
                      <div className="flex gap-2 shrink-0">
                        <motion.button
                          className="text-[0.5rem] font-bold uppercase px-2.5 py-1 cursor-pointer"
                          style={{ background: SOCIAL, color: '#0a0a0f' }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleAction('accept', req.id)}
                        >
                          Accept
                        </motion.button>
                        <motion.button
                          className="text-[0.5rem] font-bold uppercase px-2.5 py-1 text-white/30 cursor-pointer"
                          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleAction('deny', req.id)}
                        >
                          Deny
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
