// ──────────────────────────────────────────────
// NINE — Auth Form Component (Client-Side SPA)
// ──────────────────────────────────────────────

import { useCallback, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import clsx from 'clsx';

// ─── Types ──────────────────────────────────

interface AuthErrors {
  username?: string;
  email?: string;
  password?: string;
  form?: string;
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

// ─── Input ──────────────────────────────────

interface AuthInputProps {
  name: string;
  type: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
}

function AuthInput({
  name,
  type,
  label,
  placeholder,
  value,
  onChange,
  error,
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
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

export function AuthForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<AuthErrors | null>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const hasFormError = !!errors?.form;
  const isSignup = mode === 'signup';

  const toggleMode = useCallback(() => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setErrors(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setErrors(null);
      setIsSubmitting(true);

      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intent: mode,
            email,
            password,
            ...(isSignup ? { username } : {}),
          }),
        });

        const data = await res.json();

        if (!res.ok || data.errors) {
          setErrors(data.errors ?? { form: 'Something went wrong.' });
          setIsSubmitting(false);
          return;
        }

        // Success — redirect to lobby
        navigate('/');
      } catch {
        setErrors({ form: 'Network error. Please try again.' });
        setIsSubmitting(false);
      }
    },
    [mode, email, password, username, isSignup, navigate],
  );

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-[#0a0a0f]">
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
              NINE
            </motion.h1>
            <p className="text-[0.55rem] uppercase tracking-[0.3em] text-white/25">
              {isSignup ? 'Create your identity' : 'Access the network'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username — only on signup */}
            <AnimatePresence initial={false}>
              {isSignup && (
                <motion.div
                  key="username-field"
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <AuthInput
                    name="username"
                    type="text"
                    label="Username"
                    placeholder="agent_codename"
                    value={username}
                    onChange={setUsername}
                    error={errors?.username}
                    autoComplete="username"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AuthInput
              name="email"
              type="email"
              label="Email"
              placeholder="operative@nine.io"
              value={email}
              onChange={setEmail}
              error={errors?.email}
              autoComplete="email"
            />

            <AuthInput
              name="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              error={errors?.password}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />

            {/* Form-level error */}
            <AnimatePresence>
              {errors?.form && (
                <motion.div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.06]"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <span className="text-red-400 text-[0.65rem] font-medium">
                    {errors.form}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className={clsx(
                'w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-[0.2em]',
                'outline-none transition-opacity duration-150',
                isSubmitting && 'opacity-50 cursor-wait',
              )}
              style={{ background: '#4a90e2', color: '#0a0a0f' }}
              whileHover={!isSubmitting ? { scale: 1.02, opacity: 0.9 } : undefined}
              whileTap={!isSubmitting ? { scale: 0.98 } : undefined}
            >
              {isSubmitting
                ? 'Processing…'
                : isSignup
                  ? 'Create Account'
                  : 'Log In'}
            </motion.button>
          </form>

          {/* Toggle */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-[0.65rem] text-white/25 hover:text-white/60 transition-colors duration-200"
            >
              {isSignup
                ? 'Already have an account? Log in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
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
