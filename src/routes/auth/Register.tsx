// ──────────────────────────────────────────────
// S-03 — Register (Premium)
// Social providers + email form + TOS agreement.
// ──────────────────────────────────────────────

import { useState, forwardRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { AuthShell } from '../../components/Auth/AuthShell';
import { GoogleIcon, FacebookIcon, CheckIcon, EyeIcon, EyeOffIcon } from '../../components/Auth/BrandIcons';

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
  const [tosAccepted, setTosAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    if (!tosAccepted) return;
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
      navigate('/', { replace: true });
    } catch {
      setServerError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell showBack backTo="/login" showFooter>
      <div className="flex flex-col items-center px-7 py-6">
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
            Create account
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            Join the arena
          </p>
        </motion.div>

        {/* Social buttons */}
        <motion.div
          className="w-full max-w-sm flex flex-col gap-3 mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <motion.button
            className="flex items-center justify-center gap-3 w-full py-3.5 cursor-pointer"
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
            <span>Sign up with Google</span>
          </motion.button>

          <motion.button
            className="flex items-center justify-center gap-3 w-full py-3.5 cursor-pointer"
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
            <span>Sign up with Facebook</span>
          </motion.button>
        </motion.div>

        {/* Divider */}
        <div className="w-full max-w-sm flex items-center gap-4 mb-6">
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          <span
            className="text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
            style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            or
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
        </div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-sm flex flex-col gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <FormField
            label="Username"
            type="text"
            placeholder="Choose a username"
            autoComplete="username"
            error={errors.username?.message}
            {...register('username', {
              required: 'Username is required.',
              minLength: { value: 3, message: 'Min 3 characters.' },
              maxLength: { value: 20, message: 'Max 20 characters.' },
              pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Letters, numbers, underscores only.' },
            })}
          />

          <FormField
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required.',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email.' },
            })}
          />

          <div>
            <label
              className="block text-[0.65rem] font-semibold uppercase tracking-[0.15em] mb-2"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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
                  minLength: { value: 6, message: 'Min 6 characters.' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none' }}
                tabIndex={-1}
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

          <FormField
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password.',
              validate: (v) => v === password || 'Passwords do not match.',
            })}
          />

          {/* TOS checkbox */}
          <div className="flex items-start gap-3 mt-1">
            <button
              type="button"
              onClick={() => setTosAccepted((v) => !v)}
              className="shrink-0 w-5 h-5 flex items-center justify-center cursor-pointer mt-0.5"
              style={{
                borderRadius: '5px',
                border: `1.5px solid ${tosAccepted ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                background: tosAccepted ? 'var(--accent-primary)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
              aria-label="Accept terms"
            >
              {tosAccepted && <CheckIcon size={12} className="text-white" />}
            </button>
            <p
              className="text-[0.7rem] leading-relaxed"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
            >
              I agree to the{' '}
              <Link to="/terms" className="underline" style={{ color: 'var(--text-secondary)' }}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="underline" style={{ color: 'var(--text-secondary)' }}>
                Privacy Policy
              </Link>
            </p>
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
            disabled={submitting || !tosAccepted}
            className="w-full py-3.5 text-sm font-bold cursor-pointer disabled:opacity-40"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              letterSpacing: '-0.01em',
            }}
            whileHover={tosAccepted ? { y: -1, opacity: 0.92 } : {}}
            whileTap={tosAccepted ? { scale: 0.98 } : {}}
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </motion.button>
        </motion.form>

        {/* Login link */}
        <div className="mt-6 flex items-center gap-2">
          <span className="text-[0.75rem]" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
            Already have an account?
          </span>
          <Link
            to="/login"
            className="text-[0.75rem] font-bold transition-colors"
            style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-body)' }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

// ─── Reusable Form Field ───────────────────

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, ...props }, ref) => (
    <div>
      <label
        className="block text-[0.65rem] font-semibold uppercase tracking-[0.15em] mb-2"
        style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </label>
      <input
        ref={ref}
        className="w-full px-4 py-3 text-sm outline-none"
        style={{
          background: 'var(--bg-card)',
          border: `1.5px solid ${error ? 'var(--accent-error)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-body)',
          color: 'var(--text-primary)',
        }}
        {...props}
      />
      {error && (
        <p className="text-[0.65rem] mt-1.5" style={{ color: 'var(--accent-error)' }}>
          {error}
        </p>
      )}
    </div>
  ),
);
FormField.displayName = 'FormField';
