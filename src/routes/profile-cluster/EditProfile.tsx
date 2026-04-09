// ──────────────────────────────────────────────
// S-26 — Edit Profile
// Change avatar & username
// ──────────────────────────────────────────────

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useRequireAuth } from '../../lib/useRequireAuth';

// ─── Profile Accent ──────────────────────────

const PURPLE = '#a855f7';

// ─── Avatar Options ──────────────────────────

const AVATARS = [
  { id: 'phantom', glyph: '◈', label: 'Phantom' },
  { id: 'spectre', glyph: '⟁', label: 'Spectre' },
  { id: 'cipher', glyph: '⧖', label: 'Cipher' },
  { id: 'nexus', glyph: '⬡', label: 'Nexus' },
  { id: 'vector', glyph: '◇', label: 'Vector' },
  { id: 'nova', glyph: '✦', label: 'Nova' },
] as const;

// ─── Component ───────────────────────────────

export default function EditProfile() {
  useRequireAuth();
  const navigate = useNavigate();

  const profile = useMemo(() => {
    try {
      const raw = localStorage.getItem('nine_profile');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const [username, setUsername] = useState(profile?.username ?? '');
  const [avatar, setAvatar] = useState(profile?.avatar ?? 'phantom');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = useCallback(() => {
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setError('Callsign must be at least 3 characters');
      return;
    }
    if (trimmed.length > 16) {
      setError('Callsign must be 16 characters or fewer');
      return;
    }
    if (!/^[A-Za-z0-9_]+$/.test(trimmed)) {
      setError('Only letters, numbers, and underscores allowed');
      return;
    }

    setError('');
    const updated = { ...profile, username: trimmed.toUpperCase(), avatar };
    localStorage.setItem('nine_profile', JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => navigate('/me'), 800);
  }, [username, avatar, profile, navigate]);

  const selectedGlyph = AVATARS.find((a) => a.id === avatar)?.glyph ?? '◈';

  return (
    <div className="relative min-h-screen text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'var(--bg-primary)',
        }}
      />

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 sm:px-6 py-8">
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
          className="text-center mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="text-2xl font-black uppercase tracking-[0.15em] mb-1"
            style={{ fontFamily: 'var(--font-primary)', color: PURPLE }}
          >
            Edit Profile
          </h1>
          <p className="text-[0.5rem] uppercase tracking-[0.3em] text-white/20">
            Customize your identity
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!saved ? (
            <motion.div
              key="form"
              className="flex flex-col gap-6"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Current Preview */}
              <motion.div
                className="flex flex-col items-center gap-3 py-6"
                style={{
                  background: 'var(--bg-surface)',
                  border: `2px solid ${PURPLE}`,
                  boxShadow: 'var(--shadow-lg)',
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div
                  className="w-16 h-16 flex items-center justify-center"
                  style={{ border: `2px solid ${PURPLE}` }}
                  key={avatar}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <span className="text-2xl" style={{ color: PURPLE }}>{selectedGlyph}</span>
                </motion.div>
                <span
                  className="text-sm font-black uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-primary)' }}
                >
                  {username.toUpperCase() || 'OPERATIVE'}
                </span>
              </motion.div>

              {/* Username */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <label
                  className="text-[0.55rem] font-bold uppercase tracking-[0.25em] mb-2 block"
                  style={{ fontFamily: 'var(--font-primary)', color: `${PURPLE}99` }}
                >
                  Callsign
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  maxLength={16}
                  className="w-full px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] bg-transparent outline-none"
                  style={{
                    fontFamily: 'var(--font-primary)',
                    color: 'rgba(255,255,255,0.7)',
                    border: `2px solid ${error ? '#ff6b6b' : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: error ? 'var(--shadow-sm)' : 'var(--shadow-sm)',
                  }}
                  placeholder="ENTER CALLSIGN"
                />
                {error && (
                  <motion.p
                    className="text-[0.5rem] mt-1.5"
                    style={{ color: '#ff6b6b' }}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.p>
                )}
                <p className="text-[0.4rem] text-white/15 mt-1 text-right">
                  {username.length}/16
                </p>
              </motion.div>

              {/* Avatar Grid */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label
                  className="text-[0.55rem] font-bold uppercase tracking-[0.25em] mb-3 block"
                  style={{ fontFamily: 'var(--font-primary)', color: `${PURPLE}99` }}
                >
                  Avatar
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {AVATARS.map((a) => {
                    const active = avatar === a.id;
                    return (
                      <motion.button
                        key={a.id}
                        onClick={() => setAvatar(a.id)}
                        className="flex flex-col items-center gap-2 py-4 cursor-pointer"
                        style={{
                          background: 'var(--bg-surface)',
                          border: `2px solid ${active ? PURPLE : 'rgba(255,255,255,0.06)'}`,
                          boxShadow: active ? 'var(--shadow-md)' : 'none',
                          transition: 'border-color 0.15s, box-shadow 0.15s',
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span
                          className="text-xl"
                          style={{ color: active ? PURPLE : 'rgba(255,255,255,0.25)' }}
                        >
                          {a.glyph}
                        </span>
                        <span
                          className="text-[0.45rem] font-bold uppercase tracking-[0.1em]"
                          style={{
                            fontFamily: 'var(--font-primary)',
                            color: active ? PURPLE : 'rgba(255,255,255,0.2)',
                          }}
                        >
                          {a.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Save */}
              <motion.button
                onClick={handleSave}
                className="w-full py-4 text-sm font-bold uppercase tracking-[0.15em] cursor-pointer"
                style={{
                  fontFamily: 'var(--font-primary)',
                  background: PURPLE,
                  color: 'var(--bg-primary)',
                  boxShadow: 'var(--shadow-md)',
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ boxShadow: 'var(--shadow-lg)', y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Save Changes
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="saved"
              className="flex flex-col items-center gap-4 py-16 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <motion.span
                className="text-4xl"
                style={{ color: PURPLE }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.4 }}
              >
                ✓
              </motion.span>
              <h2
                className="text-xl font-black uppercase tracking-[0.15em]"
                style={{ fontFamily: 'var(--font-primary)', color: PURPLE }}
              >
                Profile Updated
              </h2>
              <p className="text-xs text-white/30">Redirecting…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
