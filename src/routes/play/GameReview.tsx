// ──────────────────────────────────────────────
// S-16 — Game Review
// Move timeline, mistake heatmap, opponent comparison
// ──────────────────────────────────────────────

import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';

// ─── Accents ─────────────────────────────────

const LIME = '#aaff00';
const CYAN = '#00ffff';
const RED = '#ff6b6b';

// ─── Mock Review Data ────────────────────────

interface Move {
  turn: number;
  action: string;
  time: string;
  correct: boolean;
  points: number;
}

interface ReviewData {
  mode: string;
  date: string;
  result: 'WIN' | 'LOSS';
  totalTime: string;
  player: { name: string; score: number; accuracy: number; avgTime: string };
  opponent: { name: string; score: number; accuracy: number; avgTime: string };
  moves: Move[];
  heatmap: number[][]; // 6×6 grid, 0=empty, 1=correct, 2=mistake
}

const MOCK_REVIEW: ReviewData = {
  mode: 'Prime Grid',
  date: '2026-03-28',
  result: 'WIN',
  totalTime: '4:12',
  player: { name: 'PHANTOM_X', score: 1520, accuracy: 82, avgTime: '0:18' },
  opponent: { name: 'SHADOW_9', score: 1340, accuracy: 74, avgTime: '0:22' },
  moves: [
    { turn: 1, action: 'Selected 7 (prime)', time: '0:08', correct: true, points: 120 },
    { turn: 2, action: 'Selected 13 (prime)', time: '0:14', correct: true, points: 140 },
    { turn: 3, action: 'Selected 15 (composite)', time: '0:22', correct: false, points: -50 },
    { turn: 4, action: 'Selected 23 (prime)', time: '0:31', correct: true, points: 160 },
    { turn: 5, action: 'Selected 29 (prime)', time: '0:40', correct: true, points: 150 },
    { turn: 6, action: 'Selected 9 (composite)', time: '0:52', correct: false, points: -50 },
    { turn: 7, action: 'Selected 37 (prime)', time: '1:01', correct: true, points: 180 },
    { turn: 8, action: 'Selected 41 (prime)', time: '1:12', correct: true, points: 170 },
    { turn: 9, action: 'Selected 43 (prime)', time: '1:24', correct: true, points: 160 },
    { turn: 10, action: 'Selected 47 (prime)', time: '1:38', correct: true, points: 190 },
    { turn: 11, action: 'Selected 51 (composite)', time: '1:50', correct: false, points: -50 },
    { turn: 12, action: 'Selected 53 (prime)', time: '2:04', correct: true, points: 200 },
  ],
  heatmap: [
    [1, 0, 2, 1, 0, 1],
    [0, 1, 0, 0, 1, 0],
    [1, 0, 1, 2, 0, 1],
    [0, 1, 0, 1, 0, 0],
    [2, 0, 1, 0, 1, 1],
    [1, 0, 0, 1, 0, 1],
  ],
};

// ─── Component ───────────────────────────────

export default function GameReview() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const review = MOCK_REVIEW;

  const mistakeCount = useMemo(
    () => review.moves.filter((m) => !m.correct).length,
    [review.moves],
  );

  const resultColor = review.result === 'WIN' ? LIME : RED;

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
          onClick={() => navigate(`/play/result/${gameId ?? 'demo'}`)}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.96 }}
        >
          ← Result
        </motion.button>

        {/* Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="text-2xl font-black uppercase tracking-[0.15em] mb-1"
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            Game Review
          </h1>
          <p className="text-[0.5rem] uppercase tracking-[0.25em] text-white/20">
            {review.mode} · {review.date} · <span style={{ color: resultColor }}>{review.result}</span>
          </p>
        </motion.div>

        {/* Opponent Comparison */}
        <motion.div
          className="mb-6"
          style={{
            background: 'var(--bg-surface)',
            border: `2px solid ${resultColor}`,
            boxShadow: 'var(--shadow-md)',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="px-5 py-3 border-b border-white/[0.04]">
            <span
              className="text-[0.5rem] font-bold uppercase tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-primary)', color: `${CYAN}99` }}
            >
              Head to Head
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 px-5 py-4">
            {/* Player */}
            <div className="text-center">
              <span
                className="text-xs font-bold uppercase tracking-[0.08em] block mb-2"
                style={{ fontFamily: 'var(--font-primary)', color: LIME }}
              >
                {review.player.name}
              </span>
              <span
                className="text-lg font-black tabular-nums block"
                style={{ fontFamily: 'var(--font-primary)', color: LIME }}
              >
                {review.player.score.toLocaleString()}
              </span>
              <span className="text-[0.4rem] text-white/20">Score</span>
            </div>

            {/* VS divider */}
            <div className="flex flex-col items-center justify-center gap-2">
              <span
                className="text-[0.55rem] font-bold uppercase"
                style={{ fontFamily: 'var(--font-primary)', color: 'rgba(255,255,255,0.15)' }}
              >
                VS
              </span>
              <div className="w-px h-8 bg-white/5" />
            </div>

            {/* Opponent */}
            <div className="text-center">
              <span
                className="text-xs font-bold uppercase tracking-[0.08em] block mb-2"
                style={{ fontFamily: 'var(--font-primary)', color: RED }}
              >
                {review.opponent.name}
              </span>
              <span
                className="text-lg font-black tabular-nums block"
                style={{ fontFamily: 'var(--font-primary)', color: RED }}
              >
                {review.opponent.score.toLocaleString()}
              </span>
              <span className="text-[0.4rem] text-white/20">Score</span>
            </div>
          </div>

          {/* Stat bars */}
          <div className="px-5 pb-4 flex flex-col gap-3">
            {[
              { label: 'Accuracy', p: review.player.accuracy, o: review.opponent.accuracy, suffix: '%' },
              { label: 'Avg Move', p: review.player.avgTime, o: review.opponent.avgTime, suffix: '' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-between text-[0.4rem] uppercase tracking-[0.2em] text-white/20 mb-1">
                  <span style={{ color: LIME }}>{typeof stat.p === 'number' ? `${stat.p}${stat.suffix}` : stat.p}</span>
                  <span>{stat.label}</span>
                  <span style={{ color: RED }}>{typeof stat.o === 'number' ? `${stat.o}${stat.suffix}` : stat.o}</span>
                </div>
                <div className="flex h-1.5 gap-0.5">
                  <motion.div
                    className="h-full"
                    style={{ background: LIME }}
                    initial={{ flex: 0 }}
                    animate={{ flex: typeof stat.p === 'number' ? stat.p : 50 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                  />
                  <motion.div
                    className="h-full"
                    style={{ background: RED }}
                    initial={{ flex: 0 }}
                    animate={{ flex: typeof stat.o === 'number' ? stat.o : 50 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mistake Heatmap */}
        <motion.div
          className="mb-6"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
            <span
              className="text-[0.5rem] font-bold uppercase tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-primary)', color: `${CYAN}99` }}
            >
              Grid Heatmap
            </span>
            <div className="flex gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2" style={{ background: LIME }} />
                <span className="text-[0.35rem] text-white/20">Correct</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2" style={{ background: RED }} />
                <span className="text-[0.35rem] text-white/20">Mistake</span>
              </div>
            </div>
          </div>
          <div className="p-5 flex justify-center">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(6, 2rem)' }}>
              {review.heatmap.flat().map((cell, i) => (
                <motion.div
                  key={i}
                  className="w-8 h-8 flex items-center justify-center text-[0.45rem] font-bold"
                  style={{
                    background:
                      cell === 1
                        ? `${LIME}15`
                        : cell === 2
                          ? `${RED}15`
                          : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${
                      cell === 1 ? `${LIME}30` : cell === 2 ? `${RED}30` : 'rgba(255,255,255,0.04)'
                    }`,
                    color:
                      cell === 1 ? LIME : cell === 2 ? RED : 'rgba(255,255,255,0.08)',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.015 }}
                >
                  {cell === 1 ? '✓' : cell === 2 ? '✗' : '·'}
                </motion.div>
              ))}
            </div>
          </div>
          <div className="px-5 pb-3 text-center">
            <span className="text-[0.4rem] text-white/15">
              {mistakeCount} mistakes · {review.moves.length - mistakeCount} correct ·{' '}
              {review.player.accuracy}% accuracy
            </span>
          </div>
        </motion.div>

        {/* Move Timeline */}
        <motion.div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="px-5 py-3 border-b border-white/[0.04]">
            <span
              className="text-[0.5rem] font-bold uppercase tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-primary)', color: `${CYAN}99` }}
            >
              Move Timeline
            </span>
          </div>

          <div className="px-5 py-3">
            {review.moves.map((move, i) => (
              <motion.div
                key={move.turn}
                className="flex items-center gap-3 py-2.5 border-b border-white/[0.03] last:border-0"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.03 }}
              >
                {/* Turn number */}
                <span
                  className="w-6 text-[0.5rem] font-bold tabular-nums shrink-0"
                  style={{ fontFamily: 'var(--font-primary)', color: 'rgba(255,255,255,0.15)' }}
                >
                  {String(move.turn).padStart(2, '0')}
                </span>

                {/* Status indicator */}
                <div
                  className="w-2 h-2 shrink-0"
                  style={{
                    background: move.correct ? LIME : RED,
                    boxShadow: `0 0 6px ${move.correct ? LIME : RED}40`,
                  }}
                />

                {/* Action */}
                <span className="text-[0.55rem] text-white/40 flex-1 truncate">
                  {move.action}
                </span>

                {/* Time */}
                <span className="text-[0.45rem] tabular-nums text-white/15 shrink-0">
                  {move.time}
                </span>

                {/* Points */}
                <span
                  className="text-[0.5rem] font-bold tabular-nums w-10 text-right shrink-0"
                  style={{
                    fontFamily: 'var(--font-primary)',
                    color: move.points > 0 ? LIME : RED,
                  }}
                >
                  {move.points > 0 ? '+' : ''}{move.points}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
