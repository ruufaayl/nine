// ──────────────────────────────────────────────
// NINE — Root Layout (wraps all routes)
// ──────────────────────────────────────────────

import { Outlet, useOutletContext } from 'react-router';
import { useEffect, useState } from 'react';
import { Header, type HeaderUser } from '../components/Layout/Header';

// ─── Types ──────────────────────────────────

export interface RootContext {
  user: HeaderUser | null;
}

// ─── Hook for child routes ──────────────────

export function useUser(): HeaderUser | null {
  const ctx = useOutletContext<RootContext>();
  return ctx?.user ?? null;
}

// ─── Component ──────────────────────────────

export default function RootLayout() {
  const [user, setUser] = useState<HeaderUser | null>(null);

  // Try to fetch the current session on mount
  useEffect(() => {
    fetch('/api/me')
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // Not logged in — that's fine
      });
  }, []);

  return (
    <>
      <Header user={user} />
      {/* Push content below the fixed header */}
      <div className="pt-12">
        <Outlet context={{ user } satisfies RootContext} />
      </div>
    </>
  );
}
