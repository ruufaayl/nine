// ──────────────────────────────────────────────
// NINE — Auth Route (data router action)
// ──────────────────────────────────────────────

import { redirect, type ActionFunctionArgs } from 'react-router';
import { AuthForm } from '../components/Auth/AuthForm';

// ─── Action ─────────────────────────────────
// Fired by <Form method="post" action="/auth">

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  const email = (formData.get('email') as string) ?? '';
  const password = (formData.get('password') as string) ?? '';
  const username = (formData.get('username') as string) ?? '';

  // ── Validation ──
  const errors: Record<string, string> = {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'A valid email is required.';
  }
  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (intent === 'signup') {
    if (!username || username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    }
    if (username.trim().length > 32) {
      errors.username = 'Username must be 32 characters or fewer.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // ── Call backend API ──
  // The server-side API routes (api.auth.ts) handle DB ops + cookies.
  // When the backend is live, this fetch goes to your server.
  // In dev without a backend, we'll get a network error which we handle gracefully.
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent,
        email: email.trim().toLowerCase(),
        password,
        ...(intent === 'signup' ? { username: username.trim() } : {}),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      if (data?.errors) {
        return { errors: data.errors };
      }
      return { errors: { form: 'Authentication failed. Try again.' } };
    }

    // Success — the server set the session cookie.
    // Redirect to lobby.
    return redirect('/');
  } catch {
    return {
      errors: { form: 'Cannot reach the server. Please try again later.' },
    };
  }
}

// ─── Component ──────────────────────────────

export default function AuthRoute() {
  return <AuthForm />;
}
