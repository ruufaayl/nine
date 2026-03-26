// ──────────────────────────────────────────────
// NINE — Root Layout (wraps all routes)
// ──────────────────────────────────────────────

import {
  Outlet,
  useLoaderData,
  useOutletContext,
  type LoaderFunctionArgs,
} from 'react-router';
import { Header, type HeaderUser } from '../components/Layout/Header';

// ─── Types ──────────────────────────────────

export interface RootContext {
  user: HeaderUser | null;
}

interface RootLoaderData {
  user: HeaderUser | null;
}

// ─── Loader (runs before render — no "loading" flash) ──

export const loader = async (_args: LoaderFunctionArgs): Promise<Response> => {
  try {
    const res = await fetch('/api/me', { credentials: 'include' });

    if (!res.ok) {
      return Response.json({ user: null } satisfies RootLoaderData);
    }

    const data = await res.json();
    return Response.json({ user: data?.user ?? null } satisfies RootLoaderData);
  } catch {
    // Network error — treat as unauthenticated
    return Response.json({ user: null } satisfies RootLoaderData);
  }
};

// ─── Hook for child routes ──────────────────

export function useUser(): HeaderUser | null {
  const ctx = useOutletContext<RootContext>();
  return ctx?.user ?? null;
}

// ─── Component ──────────────────────────────

export default function RootLayout() {
  const { user } = useLoaderData<RootLoaderData>();

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
