// ──────────────────────────────────────────────
// NINE — Auth Screen (Login / Signup / Reset / Guest)
// ──────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { Form, useActionData, useNavigation } from 'react-router';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import clsx from 'clsx';

// ─── Types ──────────────────────────────────

type AuthView = 'login' | 'signup' | 'reset' | 'guest';

interface ActionData {
  errors?: {
    username?: string;
    email?: string;
    password?: string;
    form?: string;
  };
  success?: string;
}

// ─── Animation Variants ─────────────────────

const shakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -8, 8, -5, 5, 0],
    transition: { duration: 0.2, ease: 'easeInOut' as const },
  },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    marginBottom: 16,
    transition: { duration: 0.25, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.2, ease: 'easeIn' as const },
  },
};

const viewTransition: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: 'easeIn' as const } },
};

// ─── View Metadata ──────────────────────────

const VIEW_META: Record<AuthView, { title: string; subtitle: string }> = {
  login:  { title: 'NINE', subtitle: 'Access the network' },
  signup: { title: 'NINE', subtitle: 'Create your identity' },
  reset:  { title: 'NINE', subtitle: 'Recover your access' },
  guest:  { title: 'NINE', subtitle: 'Instant access · no strings' },
};

// ─── Input Component ────────────────────────

interface AuthInputProps {
  name: string;
  type: string;
  label: string;
  placeholder: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
}

function AuthInput({
  name,
  type,
  label,
  placeholder,
  error,
  required,
  autoComplete,
}: AuthInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-[0.6rem] uppercase tracking-[0.2em] font-semibold text-white/30"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={clsx(
          'w-full px-4 py-3 rounded-lg text-sm font-medium',
          'bg-transparent outline-none',
          'text-white/90 placeholder:text-white/15',
          'transition-colors duration-200',
          'border-b-2 border-t-0 border-l-0 border-r-0',
          error
            ? 'border-red-500/60 focus:border-red-400'
            : 'border-white/[0.08] focus:border-[#4a90e2]',
        )}
      />
      {error && (
        <motion.span
          className="text-[0.6rem] text-red-400/80 tracking-wide"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.span>
      )}
    </div>
  );
}

// ─── Component ──────────────────────────────

export function AuthScreen() {
  const [view, setView] = useState<AuthView>('login');
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const errors = actionData?.errors;
  const successMsg = actionData?.success;
  const hasFormError = !!errors?.form;

  const switchView = useCallback((v: AuthView) => setView(v), []);

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-[var(--bg-primary)]">
      {/* Background grid */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="auth-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>

      {/* Auth Card */}
      <motion.div
        className="relative z-10 w-full max-w-sm"
        variants={shakeVariants}
        animate={hasFormError ? 'shake' : 'idle'}
      >
        <motion.div
          className={clsx(
            'flex flex-col gap-6',
            'rounded-2xl p-8',
            'border border-white/[0.08]',
            'bg-white/[0.03] backdrop-blur-xl',
          )}
          layout
          transition={{ layout: { type: 'spring', stiffness: 350, damping: 30 } }}
        >
          {/* Header */}
          <div className="flex flex-col items-center gap-3 select-none">
            <motion.h1
              className="text-4xl font-black tracking-tighter text-white"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            >
              {VIEW_META[view].title}
            </motion.h1>
            <motion.p
              className="text-[0.55rem] uppercase tracking-[0.3em] text-white/25"
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {VIEW_META[view].subtitle}
            </motion.p>
          </div>

          {/* ─── View Content ─── */}
          <AnimatePresence mode="wait">
            {/* ── LOGIN ── */}
            {view === 'login' && (
              <motion.div key="login" variants={viewTransition} initial="hidden" animate="visible" exit="exit">
                <Form method="post" action="/auth" className="flex flex-col gap-4">
                  <input type="hidden" name="intent" value="login" />

                  <AuthInput
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="operative@nine.io"
                    error={errors?.email}
                    required
                    autoComplete="email"
                  />

                  <AuthInput
                    name="password"
                    type="password"
                    label="Password"
                    placeholder="••••••••"
                    error={errors?.password}
                    required
                    autoComplete="current-password"
                  />

                  <FormError message={errors?.form} />

                  <SubmitButton isSubmitting={isSubmitting} label="Log In" />
                </Form>

                <div className="flex flex-col items-center gap-2 mt-4">
                  <NavLink onClick={() => switchView('signup')} label="Don't have an account? Sign up" />
                  <NavLink onClick={() => switchView('reset')} label="Forgot password?" />
                </div>
              </motion.div>
            )}

            {/* ── SIGNUP ── */}
            {view === 'signup' && (
              <motion.div key="signup" variants={viewTransition} initial="hidden" animate="visible" exit="exit">
                <Form method="post" action="/auth" className="flex flex-col gap-4">
                  <input type="hidden" name="intent" value="signup" />

                  <AuthInput
                    name="username"
                    type="text"
                    label="Username"
                    placeholder="agent_codename"
                    error={errors?.username}
                    required
                    autoComplete="username"
                  />

                  <AuthInput
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="operative@nine.io"
                    error={errors?.email}
                    required
                    autoComplete="email"
                  />

                  <AuthInput
                    name="password"
                    type="password"
                    label="Password"
                    placeholder="••••••••"
                    error={errors?.password}
                    required
                    autoComplete="new-password"
                  />

                  <FormError message={errors?.form} />

                  <SubmitButton isSubmitting={isSubmitting} label="Create Account" />
                </Form>

                <div className="flex flex-col items-center gap-2 mt-4">
                  <NavLink onClick={() => switchView('login')} label="Already have an account? Log in" />
                </div>
              </motion.div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {view === 'reset' && (
              <motion.div key="reset" variants={viewTransition} initial="hidden" animate="visible" exit="exit">
                {successMsg ? (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <motion.span
                      className="text-3xl opacity-50"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      ✓
                    </motion.span>
                    <p className="text-sm text-white/60 text-center leading-relaxed">
                      {successMsg}
                    </p>
                  </div>
                ) : (
                  <Form method="post" action="/auth" className="flex flex-col gap-4">
                    <input type="hidden" name="intent" value="reset_password" />

                    <p className="text-[0.7rem] text-white/30 leading-relaxed text-center">
                      Enter your email and we'll send a recovery link.
                    </p>

                    <AuthInput
                      name="email"
                      type="email"
                      label="Email"
                      placeholder="operative@nine.io"
                      error={errors?.email}
                      required
                      autoComplete="email"
                    />

                    <FormError message={errors?.form} />

                    <SubmitButton isSubmitting={isSubmitting} label="Send Reset Link" />
                  </Form>
                )}

                <div className="flex flex-col items-center gap-2 mt-4">
                  <NavLink onClick={() => switchView('login')} label="← Back to login" />
                </div>
              </motion.div>
            )}

            {/* ── GUEST ── */}
            {view === 'guest' && (
              <motion.div key="guest" variants={viewTransition} initial="hidden" animate="visible" exit="exit">
                <div className="flex flex-col items-center gap-5 py-2">
                  <motion.span
                    className="text-4xl opacity-30"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  >
                    ⟐
                  </motion.span>

                  <p className="text-[0.7rem] text-white/30 leading-relaxed text-center max-w-[18rem]">
                    Jump straight in with a temporary identity. Your scores will be tracked, but
                    logging out will erase all data permanently.
                  </p>

                  <Form method="post" action="/auth" className="w-full">
                    <input type="hidden" name="intent" value="guest" />

                    <FormError message={errors?.form} />

                    <SubmitButton isSubmitting={isSubmitting} label="Play as Guest" accent />
                  </Form>
                </div>

                <div className="flex flex-col items-center gap-2 mt-4">
                  <NavLink onClick={() => switchView('login')} label="← I have an account" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Guest divider (shown on login/signup) ── */}
          {(view === 'login' || view === 'signup') && (
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/15">or</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </motion.div>
          )}

          {(view === 'login' || view === 'signup') && (
            <motion.button
              type="button"
              onClick={() => switchView('guest')}
              className={clsx(
                'w-full py-3 rounded-xl text-[0.7rem] font-bold uppercase tracking-[0.15em]',
                'border border-white/[0.08] bg-white/[0.02]',
                'text-white/40 hover:text-white/70',
                'transition-colors duration-150 outline-none',
              )}
              whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.98 }}
            >
              ⟐ &nbsp;Play as Guest
            </motion.button>
          )}
        </motion.div>

        {/* Bottom accent glow */}
        <div
          className="absolute -bottom-px left-8 right-8 h-px opacity-30"
          style={{ background: '#4a90e2' }}
        />
      </motion.div>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────

function SubmitButton({
  isSubmitting,
  label,
  accent = false,
}: {
  isSubmitting: boolean;
  label: string;
  accent?: boolean;
}) {
  return (
    <motion.button
      id="auth-submit"
      type="submit"
      disabled={isSubmitting}
      className={clsx(
        'w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-[0.2em]',
        'outline-none transition-opacity duration-150',
        isSubmitting && 'opacity-50 cursor-wait',
      )}
      style={{
        background: accent ? 'rgba(74,144,226,0.15)' : '#4a90e2',
        color: accent ? '#4a90e2' : 'var(--bg-primary)',
        border: accent ? '1px solid rgba(74,144,226,0.3)' : 'none',
      }}
      whileHover={!isSubmitting ? { scale: 1.02, opacity: 0.9 } : undefined}
      whileTap={!isSubmitting ? { scale: 0.98 } : undefined}
    >
      {isSubmitting ? 'Processing…' : label}
    </motion.button>
  );
}

function FormError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.06]"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
        >
          <span className="text-red-400 text-[0.65rem] font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[0.65rem] text-white/25 hover:text-white/60 transition-colors duration-200"
    >
      {label}
    </button>
  );
}
