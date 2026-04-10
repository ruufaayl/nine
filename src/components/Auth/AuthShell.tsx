// ──────────────────────────────────────────────
// NINE — Auth Shell (Universal header + footer)
// Premium wrapper for all auth/welcome/legal screens.
// Matches Play Hub visual language.
// ──────────────────────────────────────────────

import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { ArrowLeftIcon } from './BrandIcons';

interface AuthShellProps {
  children: ReactNode;
  /** Show back-arrow button in header (left) */
  showBack?: boolean;
  /** Where the back button navigates (default: -1 in history) */
  backTo?: string;
  /** Show the legal footer (default: true) */
  showFooter?: boolean;
  /** Suppress scroll inside shell content (default: false) */
  noScroll?: boolean;
}

export function AuthShell({
  children,
  showBack = false,
  backTo,
  showFooter = true,
  noScroll = false,
}: AuthShellProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  return (
    <div
      className="relative flex flex-col h-full w-full"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* ── Header ─────────────────────────────── */}
      <motion.header
        className="relative flex items-center justify-between px-6 h-14 shrink-0"
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Left: back button OR spacer */}
        <div className="w-9 h-9 flex items-center">
          {showBack && (
            <motion.button
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center cursor-pointer outline-none"
              style={{
                borderRadius: '999px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
              whileHover={{ scale: 1.08, borderColor: 'var(--border-default)' }}
              whileTap={{ scale: 0.92 }}
              aria-label="Go back"
            >
              <ArrowLeftIcon size={16} />
            </motion.button>
          )}
        </div>

        {/* Center: NINE wordmark */}
        <Link
          to="/"
          className="outline-none select-none"
          aria-label="NINE home"
        >
          <span
            className="text-lg font-black tracking-[-0.04em]"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            NINE
          </span>
        </Link>

        {/* Right: symmetric spacer */}
        <div className="w-9 h-9" />
      </motion.header>

      {/* ── Content ────────────────────────────── */}
      <main
        className={`flex-1 ${noScroll ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {children}
      </main>

      {/* ── Footer ─────────────────────────────── */}
      {showFooter && (
        <motion.footer
          className="shrink-0 px-6 py-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/terms"
                className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] transition-colors"
                style={{
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] transition-colors"
                style={{
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Privacy
              </Link>
              <Link
                to="/support"
                className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] transition-colors"
                style={{
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Support
              </Link>
            </div>
            <span
              className="text-[0.55rem] font-bold uppercase tracking-[0.18em] tabular-nums"
              style={{
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-numeric)',
              }}
            >
              v1.0
            </span>
          </div>
        </motion.footer>
      )}
    </div>
  );
}
