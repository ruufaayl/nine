// ──────────────────────────────────────────────
// S-18 — Private Room (create + share code)
// ──────────────────────────────────────────────

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { GAME_MODES, CATEGORY_ACCENTS } from '../../lib/gameModesData';

// ─── Social Accent ──────────────────────────

const SOCIAL = '#3eb8cf';

// ─── Component ──────────────────────────────

export default function PrivateRoom() {
  const navigate = useNavigate();

  const [selectedMode, setSelectedMode] = useState('prime-grid');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mode = useMemo(
    () => GAME_MODES.find((m) => m.id === selectedMode),
    [selectedMode],
  );
  const accent = mode ? CATEGORY_ACCENTS[mode.category] : SOCIAL;

  const generateCode = useCallback(() => {
    // 6-char alphanumeric room code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setRoomCode(code);
    setCopied(false);
  }, []);

  const copyCode = useCallback(async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }, [roomCode]);

  const enterLobby = useCallback(() => {
    if (!roomCode) return;
    navigate(`/play/lobby/${roomCode}?mode=${selectedMode}`);
  }, [navigate, roomCode, selectedMode]);

  return (
    <div className="relative min-h-screen text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #091a1f 0%, #0a0a0f 50%, #060609 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <motion.button
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors mb-6 cursor-pointer"
          onClick={() => navigate('/play')}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.96 }}
        >
          ← Play Hub
        </motion.button>

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
            Private Room
          </h1>
          <p className="text-[0.5rem] uppercase tracking-[0.3em] text-white/20">
            Create a room and share the code
          </p>
        </motion.div>

        {/* Mode Picker */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2
            className="text-[0.55rem] font-bold uppercase tracking-[0.25em] mb-3"
            style={{ fontFamily: 'var(--font-display)', color: `${SOCIAL}99` }}
          >
            Game Mode
          </h2>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}
          >
            {GAME_MODES.map((m) => {
              const active = selectedMode === m.id;
              const mAccent = CATEGORY_ACCENTS[m.category];
              return (
                <motion.button
                  key={m.id}
                  onClick={() => { setSelectedMode(m.id); setRoomCode(null); }}
                  className="px-3 py-2.5 text-left cursor-pointer"
                  style={{
                    background: '#0c0c14',
                    border: `2px solid ${active ? mAccent : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: active ? `3px 3px 0px ${mAccent}` : 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span
                    className="text-[0.5rem] font-bold uppercase tracking-[0.1em]"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: active ? mAccent : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {m.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Create / Code Display */}
        <AnimatePresence mode="wait">
          {!roomCode ? (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                onClick={generateCode}
                className="w-full py-4 text-sm font-bold uppercase tracking-[0.15em] cursor-pointer"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: accent,
                  color: '#0a0a0f',
                  boxShadow: '4px 4px 0px #fff',
                }}
                whileHover={{ boxShadow: '6px 6px 0px #fff', y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Create Room
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="code"
              className="flex flex-col items-center gap-5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Room Code Display */}
              <div
                className="w-full px-6 py-5 text-center"
                style={{
                  background: '#0c0c14',
                  border: `2px solid ${accent}`,
                  boxShadow: `6px 6px 0px ${accent}`,
                }}
              >
                <p className="text-[0.45rem] uppercase tracking-[0.3em] text-white/20 mb-2">
                  Room Code
                </p>
                <motion.p
                  className="text-4xl font-black tracking-[0.4em]"
                  style={{ fontFamily: 'var(--font-display)', color: accent }}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  {roomCode}
                </motion.p>
                <p className="text-[0.45rem] text-white/15 mt-2">
                  {mode?.name} · Share this code with your opponent
                </p>
              </div>

              {/* Copy button */}
              <motion.button
                onClick={copyCode}
                className="w-full py-3 text-[0.6rem] font-bold uppercase tracking-[0.15em] cursor-pointer"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: copied ? '#0a0a0f' : accent,
                  background: copied ? accent : 'transparent',
                  border: `2px solid ${accent}`,
                  boxShadow: copied ? `3px 3px 0px #fff` : `3px 3px 0px ${accent}40`,
                  transition: 'all 0.2s',
                }}
                whileTap={{ scale: 0.97 }}
              >
                {copied ? '✓ Copied!' : 'Copy Code'}
              </motion.button>

              {/* Enter Lobby */}
              <motion.button
                onClick={enterLobby}
                className="w-full py-4 text-sm font-bold uppercase tracking-[0.15em] cursor-pointer"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: accent,
                  color: '#0a0a0f',
                  boxShadow: '4px 4px 0px #fff',
                }}
                whileHover={{ boxShadow: '6px 6px 0px #fff', y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Enter Lobby
              </motion.button>

              {/* Regenerate */}
              <button
                onClick={generateCode}
                className="text-[0.5rem] uppercase tracking-[0.2em] text-white/20 hover:text-white/40 transition-colors cursor-pointer"
              >
                Generate New Code
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
