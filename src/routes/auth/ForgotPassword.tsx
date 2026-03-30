// ──────────────────────────────────────────────
// S-04 — Forgot Password
// ──────────────────────────────────────────────

import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="flex items-center justify-center min-h-screen px-6">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-black uppercase tracking-[0.15em] text-white mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Reset Access
          </h1>
          <p className="text-[0.55rem] uppercase tracking-[0.3em] text-white/25">
            We'll send a recovery link
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.form
              key="form"
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div>
                <label className="block text-[0.5rem] uppercase tracking-[0.25em] text-white/30 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  className="w-full px-4 py-3 text-sm text-white bg-transparent outline-none"
                  style={{
                    border: `2px solid ${errors.email ? '#ff6b6b' : 'rgba(255,255,255,0.1)'}`,
                    fontFamily: 'var(--font-display)',
                  }}
                  placeholder="agent@nine.io"
                  {...register('email', {
                    required: 'Email is required.',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email.' },
                  })}
                />
                {errors.email && (
                  <p className="text-[0.55rem] text-[#ff6b6b] mt-1">{errors.email.message}</p>
                )}
              </div>

              {serverError && (
                <motion.div
                  className="px-4 py-2.5 text-[0.6rem] text-[#ff6b6b]"
                  style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.15)' }}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {serverError}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 text-sm font-bold uppercase tracking-[0.15em] cursor-pointer disabled:opacity-40"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: 'var(--laser-orange)',
                  color: '#0a0a0f',
                  boxShadow: '4px 4px 0px #fff',
                }}
                whileHover={{ boxShadow: '6px 6px 0px #fff', y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                {submitting ? 'Sending…' : 'Send Reset Link'}
              </motion.button>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              className="flex flex-col items-center gap-4 text-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <motion.span
                className="text-4xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                ✓
              </motion.span>
              <p className="text-sm text-white/60">
                Recovery link sent. Check your inbox.
              </p>
              <div className="w-12 h-px bg-white/10 my-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back to login */}
        <div className="flex items-center justify-center mt-6">
          <Link
            to="/login"
            className="text-[0.55rem] uppercase tracking-[0.2em] text-white/25 hover:text-white/50 transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
