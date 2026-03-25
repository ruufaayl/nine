// ──────────────────────────────────────────────
// NINE — Auth Route (Login / Sign Up)
// ──────────────────────────────────────────────

import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { AuthForm } from '../components/Auth/AuthForm';
import {
  createUser,
  createSession,
  verifyLogin,
  getUserFromRequest,
  serializeSessionCookie,
  validateLogin,
  validateSignup,
  type AuthErrors,
} from '../lib/auth.server';

// ─── Loader ─────────────────────────────────
// Redirect to lobby if already logged in.

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromRequest(request);
  if (user) throw redirect('/');
  return null;
}

// ─── Action ─────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  const email = (formData.get('email') as string) ?? '';
  const password = (formData.get('password') as string) ?? '';

  // ── LOGIN ──────────────────────────────────
  if (intent === 'login') {
    const validationErrors = validateLogin(email, password);
    if (validationErrors) {
      return Response.json({ errors: validationErrors }, { status: 400 });
    }

    const user = await verifyLogin(email, password);
    if (!user) {
      return Response.json(
        { errors: { form: 'Invalid credentials. Check your email and password.' } satisfies AuthErrors },
        { status: 400 },
      );
    }

    const sessionId = await createSession(user.id);

    return redirect('/', {
      headers: {
        'Set-Cookie': serializeSessionCookie(sessionId),
      },
    });
  }

  // ── SIGNUP ─────────────────────────────────
  if (intent === 'signup') {
    const username = (formData.get('username') as string) ?? '';

    const validationErrors = validateSignup(username, email, password);
    if (validationErrors) {
      return Response.json({ errors: validationErrors }, { status: 400 });
    }

    // Attempt to create the user — handle unique constraint violations
    try {
      const user = await createUser(username, email, password);
      const sessionId = await createSession(user.id);

      return redirect('/', {
        headers: {
          'Set-Cookie': serializeSessionCookie(sessionId),
        },
      });
    } catch (error: unknown) {
      // PostgreSQL unique_violation = code 23505
      const pgError = error as { code?: string; constraint_name?: string; detail?: string };

      if (pgError.code === '23505') {
        const detail = pgError.detail?.toLowerCase() ?? '';

        if (detail.includes('email')) {
          return Response.json(
            { errors: { email: 'An account with this email already exists.' } satisfies AuthErrors },
            { status: 400 },
          );
        }

        if (detail.includes('username')) {
          return Response.json(
            { errors: { username: 'This username is already taken.' } satisfies AuthErrors },
            { status: 400 },
          );
        }

        return Response.json(
          { errors: { form: 'Account already exists.' } satisfies AuthErrors },
          { status: 400 },
        );
      }

      // Rethrow unexpected errors
      throw error;
    }
  }

  return Response.json(
    { errors: { form: 'Invalid request.' } satisfies AuthErrors },
    { status: 400 },
  );
}

// ─── Component ──────────────────────────────

export default function AuthRoute() {
  return <AuthForm />;
}
