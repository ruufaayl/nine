// ──────────────────────────────────────────────
// S-28 — Settings
// Theme, sound, haptics, input style toggles
// ──────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useRequireAuth } from '../../lib/useRequireAuth';

// ─── Profile Accent ──────────────────────────

const PURPLE = '#a855f7';

// ─── Settings State ──────────────────────────

interface SettingsState {
  theme: 'dark' | 'light' | 'oled';
  sound: boolean;
  music: boolean;
  haptics: boolean;
  inputStyle: 'tap' | 'swipe' | 'drag';
  notifications: boolean;
  reducedMotion: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'dark',
  sound: true,
  music: true,
  haptics: true,
  inputStyle: 'tap',
  notifications: true,
  reducedMotion: false,
};

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem('nine_settings');
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// ─── Toggle Component ────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-10 h-5 shrink-0 cursor-pointer"
      style={{
        background: on ? `${PURPLE}30` : 'rgba(255,255,255,0.06)',
        border: `1px solid ${on ? PURPLE : 'rgba(255,255,255,0.1)'}`,
        transition: 'all 0.2s',
      }}
    >
      <motion.div
        className="absolute top-0.5 w-4 h-4"
        style={{ background: on ? PURPLE : 'rgba(255,255,255,0.2)' }}
        animate={{ left: on ? '1.25rem' : '0.125rem' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// ─── Component ───────────────────────────────

export default function Settings() {
  useRequireAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsState>(loadSettings);

  const update = useCallback((patch: Partial<SettingsState>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem('nine_settings', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <div className="relative min-h-screen text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #12091f 0%, #0a0a0f 50%, #060609 100%)',
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
            style={{ fontFamily: 'var(--font-display)', color: PURPLE }}
          >
            Settings
          </h1>
          <p className="text-[0.5rem] uppercase tracking-[0.3em] text-white/20">
            System Configuration
          </p>
        </motion.div>

        {/* ── Theme ── */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2
            className="text-[0.55rem] font-bold uppercase tracking-[0.25em] mb-3"
            style={{ fontFamily: 'var(--font-display)', color: `${PURPLE}99` }}
          >
            Theme
          </h2>
          <div className="flex gap-2">
            {(['dark', 'light', 'oled'] as const).map((t) => {
              const active = settings.theme === t;
              return (
                <motion.button
                  key={t}
                  onClick={() => update({ theme: t })}
                  className="flex-1 py-3 text-[0.55rem] font-bold uppercase tracking-[0.15em] cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-display)',
                    background: active ? PURPLE : '#0c0c14',
                    color: active ? '#0a0a0f' : 'rgba(255,255,255,0.3)',
                    border: `2px solid ${active ? PURPLE : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: active ? '3px 3px 0px #fff' : 'none',
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {t}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Input Style ── */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2
            className="text-[0.55rem] font-bold uppercase tracking-[0.25em] mb-3"
            style={{ fontFamily: 'var(--font-display)', color: `${PURPLE}99` }}
          >
            Input Style
          </h2>
          <div className="flex gap-2">
            {(['tap', 'swipe', 'drag'] as const).map((s) => {
              const active = settings.inputStyle === s;
              return (
                <motion.button
                  key={s}
                  onClick={() => update({ inputStyle: s })}
                  className="flex-1 py-3 text-[0.55rem] font-bold uppercase tracking-[0.15em] cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-display)',
                    background: active ? '#0c0c14' : 'transparent',
                    color: active ? PURPLE : 'rgba(255,255,255,0.25)',
                    border: `2px solid ${active ? PURPLE : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: active ? `3px 3px 0px ${PURPLE}` : 'none',
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {s}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Toggles ── */}
        <motion.div
          className="flex flex-col gap-1 mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2
            className="text-[0.55rem] font-bold uppercase tracking-[0.25em] mb-3"
            style={{ fontFamily: 'var(--font-display)', color: `${PURPLE}99` }}
          >
            Audio & Feedback
          </h2>

          {[
            { key: 'sound' as const, label: 'Sound Effects' },
            { key: 'music' as const, label: 'Background Music' },
            { key: 'haptics' as const, label: 'Haptic Feedback' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between px-5 py-4"
              style={{
                background: '#0c0c14',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span className="text-xs text-white/50">{item.label}</span>
              <Toggle
                on={settings[item.key]}
                onToggle={() => update({ [item.key]: !settings[item.key] })}
              />
            </div>
          ))}
        </motion.div>

        {/* ── System ── */}
        <motion.div
          className="flex flex-col gap-1 mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2
            className="text-[0.55rem] font-bold uppercase tracking-[0.25em] mb-3"
            style={{ fontFamily: 'var(--font-display)', color: `${PURPLE}99` }}
          >
            System
          </h2>

          {[
            { key: 'notifications' as const, label: 'Push Notifications' },
            { key: 'reducedMotion' as const, label: 'Reduced Motion' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between px-5 py-4"
              style={{
                background: '#0c0c14',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span className="text-xs text-white/50">{item.label}</span>
              <Toggle
                on={settings[item.key]}
                onToggle={() => update({ [item.key]: !settings[item.key] })}
              />
            </div>
          ))}
        </motion.div>

        {/* ── Danger Zone ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2
            className="text-[0.55rem] font-bold uppercase tracking-[0.25em] mb-3"
            style={{ fontFamily: 'var(--font-display)', color: '#ff6b6b99' }}
          >
            Danger Zone
          </h2>
          <div className="flex flex-col gap-2">
            <motion.button
              className="w-full py-3 text-[0.6rem] font-bold uppercase tracking-[0.15em] cursor-pointer"
              style={{
                fontFamily: 'var(--font-display)',
                color: '#ff6b6b',
                border: '2px solid rgba(255,107,107,0.15)',
                boxShadow: '3px 3px 0px rgba(255,107,107,0.06)',
              }}
              whileHover={{ borderColor: 'rgba(255,107,107,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                localStorage.removeItem('nine_settings');
                setSettings(DEFAULT_SETTINGS);
              }}
            >
              Reset All Settings
            </motion.button>
            <motion.button
              className="w-full py-3 text-[0.6rem] font-bold uppercase tracking-[0.15em] cursor-pointer"
              style={{
                fontFamily: 'var(--font-display)',
                color: '#ff6b6b',
                border: '2px solid rgba(255,107,107,0.15)',
                boxShadow: '3px 3px 0px rgba(255,107,107,0.06)',
              }}
              whileHover={{ borderColor: 'rgba(255,107,107,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                localStorage.clear();
                navigate('/splash', { replace: true });
              }}
            >
              Delete Account & Data
            </motion.button>
          </div>
        </motion.div>

        {/* Version */}
        <p className="text-[0.4rem] text-white/10 text-center mt-8">
          NINE Protocol v0.9.0 · Build 2026.03.28
        </p>
      </div>
    </div>
  );
}
