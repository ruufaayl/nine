// ──────────────────────────────────────────────
// NINE — Auth Guard Hook
// Redirects to /login if the user is not authenticated
// ──────────────────────────────────────────────

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useUser } from '../layouts/AppLayout';

/**
 * Call this at the top of any component that requires authentication.
 * Returns the user (nullable during redirect).
 */
export function useRequireAuth() {
  const user = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Give the loader a moment to resolve — if user is still null
    // after mount, redirect. We use a microtask to avoid flicker.
    if (user === null) {
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  return user;
}
