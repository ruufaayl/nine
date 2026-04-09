// ──────────────────────────────────────────────
// S-02 — Login
// ──────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            Access Terminal
          </h1>
          <p className="text-[0.55rem] uppercase tracking-[0.3em] text-white/25">
            Enter your credentials
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Email */}
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
                fontFamily: 'var(--font-primary)',
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

          {/* Password */}
          <div>
            <label className="block text-[0.5rem] uppercase tracking-[0.25em] text-white/30 mb-1.5">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full px-4 py-3 text-sm text-white bg-transparent outline-none"
              style={{
                border: `2px solid ${errors.password ? '#ff6b6b' : 'rgba(255,255,255,0.1)'}`,
                fontFamily: 'var(--font-primary)',
              }}
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required.',
                minLength: { value: 6, message: 'Minimum 6 characters.' },
              })}
            />
            {errors.password && (
              <p className="text-[0.55rem] text-[#ff6b6b] mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Server error */}
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

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 text-sm font-bold uppercase tracking-[0.15em] cursor-pointer disabled:opacity-40"
            style={{
              fontFamily: 'var(--font-primary)',
              background: 'var(--accent-primary)',
              color: 'var(--bg-primary)',
              boxShadow: 'var(--shadow-md)',
            }}
            whileHover={{ boxShadow: 'var(--shadow-lg)', y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {submitting ? 'Authenticating…' : 'Log In'}
          </motion.button>
        </form>

        {/* Links */}
        <div className="flex flex-col items-center gap-3 mt-6">
          <Link
            to="/forgot-password"
            className="text-[0.55rem] uppercase tracking-[0.2em] text-white/20 hover:text-white/50 transition-colors"
          >
            Forgot Password?
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[0.55rem] text-white/15">New operative?</span>
            <Link
              to="/register"
              className="text-[0.55rem] uppercase tracking-[0.2em] text-white/40 hover:text-white/70 transition-colors"
              style={{ color: 'var(--accent-secondary)' }}
            >
              Register
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
