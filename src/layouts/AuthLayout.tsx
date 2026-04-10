// ──────────────────────────────────────────────
// NINE — Auth Layout (mobile shell, no nav bar)
// Wraps all auth/onboarding/legal screens.
// Same mobile-shell constraint as AppLayout.
// ──────────────────────────────────────────────

import { Outlet } from 'react-router';

export default function AuthLayout() {
  return (
    <div className="mobile-shell">
      <Outlet />
    </div>
  );
}
