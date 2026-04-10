// ──────────────────────────────────────────────
// S-04 — Forgot Password (Premium)
// ──────────────────────────────────────────────

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthShell } from '../../components/Auth/AuthShell';

interface ForgotForm {
  email: string;
}

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>();

  const onSubmit = async (data: ForgotForm) => {
    setServerError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'reset_password', email: data.email }),
      });
      if (!res.ok) {
        const json = await res.json();
        setServerError(json.errors?.form ?? json.error ?? 'Request failed.');
        return;
      }
      setSent(true);
    } catch {
      setServerError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell showBack backTo="/login" showFooter>
      <div className="flex flex-col items-center justify-center min-h-full px-7 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
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
            Reset password
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            {sent ? 'Check your inbox' : "Enter your email and we'll send a reset link"}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.form
              key="form"
              onSubmit={handleSubmit(onSubmit)}
              className="w-full max-w-sm flex flex-col gap-4"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
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
                }}
                whileHover={{ y: -1, opacity: 0.92 }}
                whileTap={{ scale: 0.98 }}
              >
                {submitting ? 'Sending...' : 'Send Reset Link'}
              </motion.button>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              className="w-full max-w-sm flex flex-col items-center gap-5 text-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(52,199,89,0.12)' }}
              >
                <motion.span
                  className="text-2xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  ✓
                </motion.span>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
              >
                If an account exists with that email, you'll receive a password reset link shortly.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthShell>
  );
}
