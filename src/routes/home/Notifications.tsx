// ──────────────────────────────────────────────
// S-07 — Notifications
// Friend requests, game invites, system alerts
// ──────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Social Accent ──────────────────────────

const SOCIAL = '#3eb8cf';

// ─── Types ──────────────────────────────────

type NotifType = 'friend_request' | 'game_invite' | 'system' | 'result';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  actionId?: string;
}

// ─── Mock Data ──────────────────────────────

const INITIAL_NOTIFS: Notification[] = [
  { id: 'n1', type: 'game_invite', title: 'CIPHER_X challenged you', body: 'Vault Breaker · Operative', time: '2m ago', read: false, actionId: 'u2' },
  { id: 'n2', type: 'friend_request', title: 'NOVA_PRIME wants to connect', body: 'Platinum · 6,100 XP', time: '15m ago', read: false, actionId: 'u3' },
  { id: 'n3', type: 'result', title: 'Match Complete', body: 'You defeated SHADOW_9 in Prime Grid (+25 Elo)', time: '1h ago', read: true },
  { id: 'n4', type: 'system', title: 'Season 3 Begins', body: 'New rewards and ranked ladder reset.', time: '3h ago', read: true },
  { id: 'n5', type: 'friend_request', title: 'VECTOR_7 wants to connect', body: 'Legend · 12,000 XP', time: '5h ago', read: true, actionId: 'u6' },
  { id: 'n6', type: 'game_invite', title: 'ZERO_1 invited you', body: 'Canvas Fracture · Trainee', time: '1d ago', read: true, actionId: 'u8' },
];

const TYPE_CONFIG: Record<NotifType, { icon: string; accent: string }> = {
  friend_request: { icon: '⟁', accent: SOCIAL },
  game_invite:    { icon: '◈', accent: 'var(--electric-lime)' },
  system:         { icon: '⧖', accent: 'var(--laser-orange)' },
  result:         { icon: '⚡', accent: 'var(--neon-magenta)' },
};

// ─── Tabs ───────────────────────────────────

type Tab = 'all' | 'friend_request' | 'game_invite';
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'friend_request', label: 'Requests' },
  { key: 'game_invite', label: 'Invites' },
];

// ─── Component ──────────────────────────────

export default function Notifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS);
  const [tab, setTab] = useState<Tab>('all');

  const filtered = tab === 'all' ? notifs : notifs.filter((n) => n.type === tab);
  const unreadCount = notifs.filter((n) => !n.read).length;

  const markRead = useCallback((id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleAction = useCallback(
    (notif: Notification) => {
      markRead(notif.id);
      if (notif.type === 'friend_request' && notif.actionId) {
        navigate(`/social/player/${notif.actionId}`);
      } else if (notif.type === 'game_invite' && notif.actionId) {
        navigate(`/social/challenge/${notif.actionId}`);
      }
    },
    [markRead, navigate],
  );

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
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-[0.5rem] uppercase tracking-[0.3em]" style={{ color: SOCIAL }}>
                {unreadCount} unread
              </p>
            )}
          </div>

          {unreadCount > 0 && (
            <motion.button
              onClick={markAllRead}
              className="text-[0.5rem] uppercase tracking-[0.2em] px-3 py-1.5 cursor-pointer"
              style={{
                color: SOCIAL,
                border: `1px solid ${SOCIAL}30`,
                background: `${SOCIAL}08`,
              }}
              whileHover={{ background: `${SOCIAL}15` }}
              whileTap={{ scale: 0.96 }}
            >
              Mark all read
            </motion.button>
          )}
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="flex gap-2 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {TABS.map((t) => (
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

        {/* List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2"
          >
            {filtered.length > 0 ? (
              filtered.map((notif, i) => {
                const cfg = TYPE_CONFIG[notif.type];
                return (
                  <motion.div
                    key={notif.id}
                    className="relative flex items-start gap-4 px-5 py-4 group"
                    style={{
                      background: '#0c0c14',
                      border: `1px solid ${notif.read ? 'rgba(255,255,255,0.04)' : `${cfg.accent}25`}`,
                      boxShadow: notif.read ? 'none' : `0 0 12px ${cfg.accent}08`,
                    }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    layout
                  >
                    {/* Unread dot */}
                    {!notif.read && (
                      <div
                        className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                        style={{ background: cfg.accent }}
                      />
                    )}

                    {/* Icon */}
                    <div
                      className="w-9 h-9 flex items-center justify-center shrink-0 text-sm"
                      style={{
                        color: cfg.accent,
                        background: `${cfg.accent}08`,
                        border: `1px solid ${cfg.accent}20`,
                      }}
                    >
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-bold mb-0.5"
                        style={{ color: notif.read ? 'rgba(255,255,255,0.5)' : '#fff' }}
                      >
                        {notif.title}
                      </p>
                      <p className="text-[0.55rem] text-white/25 mb-2">{notif.body}</p>

                      {/* Actions row */}
                      <div className="flex items-center gap-3">
                        <span className="text-[0.4rem] text-white/15">{notif.time}</span>

                        {(notif.type === 'friend_request' || notif.type === 'game_invite') && (
                          <motion.button
                            onClick={() => handleAction(notif)}
                            className="text-[0.5rem] font-bold uppercase tracking-[0.15em] px-2.5 py-1 cursor-pointer"
                            style={{
                              color: cfg.accent,
                              border: `1px solid ${cfg.accent}30`,
                              background: `${cfg.accent}08`,
                            }}
                            whileHover={{ background: `${cfg.accent}20` }}
                            whileTap={{ scale: 0.96 }}
                          >
                            {notif.type === 'friend_request' ? 'View' : 'Accept'}
                          </motion.button>
                        )}

                        <motion.button
                          onClick={() => dismiss(notif.id)}
                          className="text-[0.45rem] text-white/15 hover:text-white/40 transition-colors cursor-pointer ml-auto"
                          whileTap={{ scale: 0.9 }}
                        >
                          Dismiss
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="text-3xl text-white/8">⧖</span>
                <p className="text-xs text-white/20">No notifications</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
