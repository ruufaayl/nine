// ──────────────────────────────────────────────
// S-02 — Login (Premium)
// Social providers + email/password + guest.
// Matches PlayHub visual language.
// ──────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthShell } from '../../components/Auth/AuthShell';
import { GoogleIcon, FacebookIcon, MailIcon, EyeIcon, EyeOffIcon } from '../../components/Auth/BrandIcons';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ intent: 'login', ...data }),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.errors?.form ?? json.error ?? 'Login failed.');
        return;
      }
      localStorage.setItem('nine_session', 'active');
      navigate('/', { replace: true });
    } catch {
      setServerError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = async () => {
    setServerError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ intent: 'guest' }),
      });
      if (!res.ok) {
        setServerError('Failed to create guest session.');
        return;
      }
      localStorage.setItem('nine_session', 'active');
      navigate('/', { replace: true });
    } catch {
      setServerError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell showFooter>
      <div className="flex flex-col items-center justify-center min-h-full px-7 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1
            className="text-3xl font-black tracking-[-0.03em] mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            Welcome back
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            Sign in to continue playing
          </p>
        </motion.div>

        {/* Social buttons */}
        <motion.div
          className="w-full max-w-sm flex flex-col gap-3 mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {/* Google */}
          <motion.a
            href="/api/auth/google"
            className="relative flex items-center justify-center gap-3 w-full py-3.5 cursor-pointer no-underline"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
            }}
            whileHover={{ y: -1, borderColor: 'var(--border-strong)' }}
            whileTap={{ scale: 0.98 }}
          >
            <GoogleIcon size={18} />
            <span>Continue with Google</span>
          </motion.a>

          {/* Facebook */}
          <motion.a
            href="/api/auth/facebook"
            className="relative flex items-center justify-center gap-3 w-full py-3.5 cursor-pointer no-underline"
            style={{
              background: '#1877F2',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: '#ffffff',
            }}
            whileHover={{ y: -1, opacity: 0.92 }}
            whileTap={{ scale: 0.98 }}
          >
            <FacebookIcon size={18} />
            <span>Continue with Facebook</span>
          </motion.a>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="w-full max-w-sm flex items-center gap-4 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          <span
            className="text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
            style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            or
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
        </motion.div>

        {/* Email toggle / form */}
        <AnimatePresence mode="wait">
          {!showEmail ? (
            <motion.div
              key="email-toggle"
              className="w-full max-w-sm flex flex-col gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <motion.button
                onClick={() => setShowEmail(true)}
                className="flex items-center justify-center gap-3 w-full py-3.5 cursor-pointer"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
                whileHover={{ y: -1, borderColor: 'var(--border-default)' }}
                whileTap={{ scale: 0.98 }}
              >
                <MailIcon size={18} />
                <span>Sign in with Email</span>
              </motion.button>

              {/* Guest */}
              <motion.button
                onClick={handleGuest}
                disabled={submitting}
                className="w-full py-3 text-[0.75rem] font-semibold cursor-pointer disabled:opacity-40"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-body)',
                }}
                whileTap={{ scale: 0.97 }}
              >
                Continue as Guest
              </motion.button>
            </motion.div>
          ) : (
            <motion.form
              key="email-form"
              onSubmit={handleSubmit(onSubmit)}
              className="w-full max-w-sm flex flex-col gap-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {/* Email */}
              <div>
                <label
                  className="block text-[0.65rem] font-semibold uppercase tracking-[0.15em] mb-2"
                  style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  className="w-full px-4 py-3 text-sm outline-none"
                  style={{
                    background: 'var(--bg-card)',
                    border: `1.5px solid ${errors.email ? 'var(--accent-error)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'Email is required.',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email.' },
                  })}
                />
                {errors.email && (
                  <p className="text-[0.65rem] mt-1.5" style={{ color: 'var(--accent-error)' }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
                    style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[0.65rem] font-semibold transition-colors"
                    style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-body)' }}
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-11 text-sm outline-none"
                    style={{
                      background: 'var(--bg-card)',
                      border: `1.5px solid ${errors.password ? 'var(--accent-error)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-body)',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="Min 6 characters"
                    {...register('password', {
                      required: 'Password is required.',
                      minLength: { value: 6, message: 'Minimum 6 characters.' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none' }}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[0.65rem] mt-1.5" style={{ color: 'var(--accent-error)' }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Server error */}
              {serverError && (
                <motion.div
                  className="px-4 py-2.5 text-[0.7rem]"
                  style={{
                    color: 'var(--accent-error)',
                    background: 'rgba(255,59,48,0.06)',
                    border: '1px solid rgba(255,59,48,0.15)',
                    borderRadius: 'var(--radius-xs)',
                    fontFamily: 'var(--font-body)',
                  }}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {serverError}
                </motion.div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 text-sm font-bold cursor-pointer disabled:opacity-40"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  letterSpacing: '-0.01em',
                }}
                whileHover={{ y: -1, opacity: 0.92 }}
                whileTap={{ scale: 0.98 }}
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </motion.button>

              {/* Back to providers */}
              <button
                type="button"
                onClick={() => setShowEmail(false)}
                className="text-[0.7rem] font-semibold cursor-pointer"
                style={{
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-body)',
                  background: 'none',
                  border: 'none',
                }}
              >
                ← All sign in options
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Register link */}
        <motion.div
          className="mt-8 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-[0.75rem]" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
            New to NINE?
          </span>
          <Link
            to="/register"
            className="text-[0.75rem] font-bold transition-colors"
            style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-body)' }}
          >
            Create account
          </Link>
        </motion.div>
      </div>
    </AuthShell>
  );
}
