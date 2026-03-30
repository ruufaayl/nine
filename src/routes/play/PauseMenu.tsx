// ──────────────────────────────────────────────
// S-14 — Pause Menu
// NOTE: This is now integrated as an overlay
// component inside ActiveGame.tsx (S-13).
// This file is kept as a redirect fallback.
// ──────────────────────────────────────────────

import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function PauseMenu() {
  const navigate = useNavigate();

  // If someone navigates here directly, redirect to Play Hub
  useEffect(() => {
    navigate('/play', { replace: true });
  }, [navigate]);

  return null;
}
