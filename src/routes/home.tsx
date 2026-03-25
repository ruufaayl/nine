// ──────────────────────────────────────────────
// NINE — Home / Landing Route
// ──────────────────────────────────────────────

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { THEMES } from '../lib/themes';
import { GameScreen } from '../components/Game/GameScreen';
import type { CharacterTheme, Difficulty } from '../types/game';

// ─── Constants ───────────────────────────────

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'easy', label: 'Easy', desc: '36–40 clues' },
  { value: 'medium', label: 'Medium', desc: '41–48 clues' },
  { value: 'hard', label: 'Hard', desc: '49–53 clues' },
  { value: 'expert', label: 'Expert', desc: '54–58 clues' },
];

// ─── Character Card ───────────────────────────

interface CharacterCardProps {
  theme: CharacterTheme;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function CharacterCard({ theme, isSelected, onSelect }: CharacterCardProps) {
  // Static descriptors per character
  const subtitles: Record<string, string> = {
    architect: 'Blueprint · Precision',
    oracle: 'Obsidian · Foresight',
    analyst: 'Terminal · Logic',
    sculptor: 'Ivory · Intuition',
  };

  return (
    <motion.button
      className={clsx(
        'relative flex flex-col items-start gap-2',
        'rounded-xl p-4 text-left',
        'border transition-colors duration-150',
        'overflow-hidden',
      )}
      style={{
        background: isSelected
          ? theme.colors.background
          : 'rgba(255,255,255,0.03)',
        borderColor: isSelected ? theme.colors.accent : 'rgba(255,255,255,0.08)',
        minWidth: '140px',
      }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(theme.id)}
      aria-pressed={isSelected}
      aria-label={`Select character ${theme.name}`}
    >
      {/* Accent swatch */}
      <div
        className="w-8 h-8 rounded-md shrink-0"
        style={{ background: theme.colors.accent }}
      />

      <div className="flex flex-col gap-0.5">
        <span
          className="text-sm font-bold tracking-wide leading-none"
          style={{
            color: isSelected ? theme.colors.primaryText : 'rgba(255,255,255,0.8)',
          }}
        >
          {theme.name}
        </span>
        <span
          className="text-[0.6rem] uppercase tracking-widest leading-none"
          style={{
            color: isSelected ? theme.colors.accent : 'rgba(255,255,255,0.3)',
          }}
        >
          {subtitles[theme.id] ?? ''}
        </span>
      </div>

      {/* Selected indicator */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute top-2 right-2 w-2 h-2 rounded-full"
            style={{ background: theme.colors.accent }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Difficulty Pill ──────────────────────────

interface DifficultyPillProps {
  item: (typeof DIFFICULTIES)[number];
  isSelected: boolean;
  accentColor: string;
  onSelect: (d: Difficulty) => void;
}

function DifficultyPill({
  item,
  isSelected,
  accentColor,
  onSelect,
}: DifficultyPillProps) {
  return (
    <motion.button
      className={clsx(
        'relative flex flex-col items-center gap-0.5',
        'px-4 py-3 rounded-lg flex-1',
        'border',
      )}
      style={{
        background: isSelected ? accentColor : 'rgba(255,255,255,0.03)',
        borderColor: isSelected ? accentColor : 'rgba(255,255,255,0.08)',
        color: isSelected ? '#000' : 'rgba(255,255,255,0.6)',
      }}
      whileHover={isSelected ? {} : { borderColor: accentColor, color: accentColor }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(item.value)}
      aria-pressed={isSelected}
    >
      <span className="text-sm font-bold tracking-wide">{item.label}</span>
      <span
        className="text-[0.55rem] uppercase tracking-widest"
        style={{ opacity: isSelected ? 0.7 : 0.4 }}
      >
        {item.desc}
      </span>
    </motion.button>
  );
}

// ─── Background Grid Decoration ──────────────

function BackgroundGrid({ accent }: { accent: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="mini-grid"
          width="60"
          height="60"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 60 0 L 0 0 0 60"
            fill="none"
            stroke={accent}
            strokeWidth="0.4"
            opacity="0.08"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mini-grid)" />
    </svg>
  );
}

// ─── Home Route ───────────────────────────────

export default function Home() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    THEMES[0].id,
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [inGame, setInGame] = useState(false);

  const activeTheme =
    THEMES.find((t) => t.id === selectedCharacterId) ?? THEMES[0];

  const themeVars = {
    '--color-background': activeTheme.colors.background,
    '--color-grid-lines': activeTheme.colors.gridLines,
    '--color-primary-text': activeTheme.colors.primaryText,
    '--color-accent': activeTheme.colors.accent,
    '--color-error': activeTheme.colors.error,
  } as React.CSSProperties;

  if (inGame) {
    return (
      <GameScreen
        difficulty={selectedDifficulty}
        characterId={selectedCharacterId}
        onExit={() => setInGame(false)}
      />
    );
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden px-6"
      style={{ background: activeTheme.colors.background, ...themeVars }}
    >
      <BackgroundGrid accent={activeTheme.colors.accent} />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-10 w-full max-w-sm"
        key={selectedCharacterId}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {/* Wordmark */}
        <div className="flex flex-col items-center gap-2 select-none">
          <motion.h1
            className="text-[5.5rem] font-black leading-none tracking-tighter"
            style={{ color: activeTheme.colors.primaryText }}
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            NINE
          </motion.h1>
          <span
            className="text-[0.6rem] uppercase tracking-[0.4em] font-medium"
            style={{ color: activeTheme.colors.accent }}
          >
            Competitive Sudoku
          </span>
        </div>

        {/* ── Character selector ── */}
        <section className="w-full flex flex-col gap-3">
          <span
            className="text-[0.6rem] uppercase tracking-widest font-semibold"
            style={{ color: activeTheme.colors.primaryText, opacity: 0.4 }}
          >
            Character
          </span>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((theme) => (
              <CharacterCard
                key={theme.id}
                theme={theme}
                isSelected={selectedCharacterId === theme.id}
                onSelect={setSelectedCharacterId}
              />
            ))}
          </div>
        </section>

        {/* ── Difficulty selector ── */}
        <section className="w-full flex flex-col gap-3">
          <span
            className="text-[0.6rem] uppercase tracking-widest font-semibold"
            style={{ color: activeTheme.colors.primaryText, opacity: 0.4 }}
          >
            Difficulty
          </span>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <DifficultyPill
                key={d.value}
                item={d}
                isSelected={selectedDifficulty === d.value}
                accentColor={activeTheme.colors.accent}
                onSelect={setSelectedDifficulty}
              />
            ))}
          </div>
        </section>

        {/* ── Play button ── */}
        <motion.button
          className={clsx(
            'w-full py-4 rounded-xl',
            'text-sm font-black uppercase tracking-[0.2em]',
          )}
          style={{
            background: activeTheme.colors.accent,
            color: activeTheme.colors.background,
          }}
          whileHover={{ scale: 1.03, opacity: 0.92 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setInGame(true)}
        >
          Play Classic
        </motion.button>

        {/* Footer */}
        <p
          className="text-[0.55rem] uppercase tracking-widest opacity-20 text-center"
          style={{ color: activeTheme.colors.primaryText }}
        >
          V1 · Classic Mode
        </p>
      </motion.div>
    </div>
  );
}
