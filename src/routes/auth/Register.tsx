// ──────────────────────────────────────────────
// S-03 — Register
// ──────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';

interface RegisterForm {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setServerError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          intent: 'signup',
          email: data.email,
          username: data.username,
          password: data.password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.errors?.form ?? json.error ?? 'Registration failed.');
        return;
      }

      localStorage.setItem('nine_session', 'active');
      navigate('/onboarding', { replace: true });
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
            New Operative
          </h1>
          <p className="text-[0.55rem] uppercase tracking-[0.3em] text-white/25">
            Create your sector identity
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <AuthField
            label="Email"
            type="email"
            placeholder="agent@nine.io"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required.',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email.' },
            })}
          />

          <AuthField
            label="Username"
            type="text"
            placeholder="AGENT_ZERO"
            autoComplete="username"
            error={errors.username?.message}
            {...register('username', {
              required: 'Username is required.',
              minLength: { value: 3, message: 'Min 3 characters.' },
              maxLength: { value: 20, message: 'Max 20 characters.' },
              pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Letters, numbers, underscores only.' },
            })}
          />

          <AuthField
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required.',
              minLength: { value: 6, message: 'Min 6 characters.' },
            })}
          />

          <AuthField
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Confirm your password.',
              validate: (v) => v === password || 'Passwords do not match.',
            })}
          />

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
              background: 'var(--cyber-cyan)',
              color: '#0a0a0f',
              boxShadow: '4px 4px 0px #fff',
            }}
            whileHover={{ boxShadow: '6px 6px 0px #fff', y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {submitting ? 'Creating…' : 'Register'}
          </motion.button>
        </form>

        {/* Links */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="text-[0.55rem] text-white/15">Already registered?</span>
          <Link
            to="/login"
            className="text-[0.55rem] uppercase tracking-[0.2em] hover:text-white/70 transition-colors"
            style={{ color: 'var(--neon-magenta)' }}
          >
            Log In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Reusable Auth Field ─────────────────────

import { forwardRef } from 'react';

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, error, ...props }, ref) => (
    <div>
      <label className="block text-[0.5rem] uppercase tracking-[0.25em] text-white/30 mb-1.5">
        {label}
      </label>
      <input
        ref={ref}
        className="w-full px-4 py-3 text-sm text-white bg-transparent outline-none"
        style={{
          border: `2px solid ${error ? '#ff6b6b' : 'rgba(255,255,255,0.1)'}`,
          fontFamily: 'var(--font-display)',
        }}
        {...props}
      />
      {error && <p className="text-[0.55rem] text-[#ff6b6b] mt-1">{error}</p>}
    </div>
  ),
);
AuthField.displayName = 'AuthField';
