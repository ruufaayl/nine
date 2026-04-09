import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { ThemeProvider } from './hooks/useTheme';
import './index.css';

// ── Layouts ──
import AppLayout, { loader as appLoader } from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';

// ── Auth Cluster (S-01 → S-05) ──
import Splash from './routes/auth/Splash';
import Login from './routes/auth/Login';
import Register from './routes/auth/Register';
import ForgotPassword from './routes/auth/ForgotPassword';
import Onboarding from './routes/auth/Onboarding';

// ── Home Cluster (S-06 → S-08) ──
import Dashboard from './routes/home/Dashboard';
import Notifications from './routes/home/Notifications';
import Search from './routes/home/Search';

// ── Play Cluster (S-09 → S-18) ──
import PlayHub from './routes/play/PlayHub';
import ModeDetail from './routes/play/ModeDetail';
import Matchmaking from './routes/play/Matchmaking';
import RoomLobby from './routes/play/RoomLobby';
import ActiveGame from './routes/play/ActiveGame';
import GameResult from './routes/play/GameResult';
import GameReview from './routes/play/GameReview';
import DailyChallenge from './routes/play/DailyChallenge';
import PrivateRoom from './routes/play/PrivateRoom';

// ── Social Cluster (S-19 → S-21) ──
import FriendsList from './routes/social/FriendsList';
import PlayerProfile from './routes/social/PlayerProfile';
import ChallengeScreen from './routes/social/ChallengeScreen';

// ── Rankings Cluster (S-22 → S-24) ──
import LeaderboardHub from './routes/rankings/LeaderboardHub';
import SeasonRankings from './routes/rankings/SeasonRankings';
import ModeLeaderboard from './routes/rankings/ModeLeaderboard';

// ── Profile Cluster (S-25 → S-28) ──
import MyProfile from './routes/profile-cluster/MyProfile';
import EditProfile from './routes/profile-cluster/EditProfile';
import StatsHistory from './routes/profile-cluster/StatsHistory';
import Settings from './routes/profile-cluster/Settings';


// ──────────────────────────────────────────────
// Data Router — 28-screen architecture
// ──────────────────────────────────────────────

const router = createBrowserRouter([
  // ━━ Auth Cluster (no main nav) ━━━━━━━━━━━━
  {
    element: <AuthLayout />,
    children: [
      { path: '/splash',          element: <Splash /> },
      { path: '/login',           element: <Login /> },
      { path: '/register',        element: <Register /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/onboarding',      element: <Onboarding /> },
      // Legacy combined auth route (preserves existing action)
      {
        path: '/auth',
        lazy: async () => {
          const mod = await import('./routes/auth');
          return { Component: mod.default, action: mod.action, ErrorBoundary: mod.ErrorBoundary };
        },
      },
    ],
  },

  // ━━ App Shell (persistent nav) ━━━━━━━━━━━━
  {
    element: <AppLayout />,
    loader: appLoader,
    children: [
      // ── Home ──
      { index: true,                element: <Dashboard /> },
      { path: '/notifications',     element: <Notifications /> },
      { path: '/search',            element: <Search /> },

      // ── Play ──
      { path: '/play',              element: <PlayHub /> },
      { path: '/play/mode/:modeId', element: <ModeDetail /> },
      { path: '/play/matchmaking',  element: <Matchmaking /> },
      { path: '/play/lobby/:roomId', element: <RoomLobby /> },
      { path: '/play/game/:gameId', element: <ActiveGame /> },
      { path: '/play/result/:gameId', element: <GameResult /> },
      { path: '/play/review/:gameId', element: <GameReview /> },
      { path: '/play/daily',        element: <DailyChallenge /> },
      { path: '/play/room/:roomCode', element: <PrivateRoom /> },

      // ── Social ──
      { path: '/social',            element: <FriendsList /> },
      { path: '/social/player/:playerId', element: <PlayerProfile /> },
      { path: '/social/challenge/:playerId', element: <ChallengeScreen /> },

      // ── Rankings ──
      { path: '/rankings',          element: <LeaderboardHub /> },
      { path: '/rankings/season',   element: <SeasonRankings /> },
      { path: '/rankings/mode/:modeId', element: <ModeLeaderboard /> },

      // ── Profile ──
      { path: '/me',                element: <MyProfile /> },
      { path: '/me/edit',           element: <EditProfile /> },
      { path: '/me/stats',          element: <StatsHistory /> },
      { path: '/me/settings',       element: <Settings /> },

      // ── API Resource Routes (server-side, no UI) ──
      {
        path: '/api/score',
        lazy: async () => {
          const mod = await import('./routes/api.score');
          return { action: mod.action };
        },
      },
      {
        path: '/api/auth',
        lazy: async () => {
          const mod = await import('./routes/api.auth');
          return { action: mod.action };
        },
      },
      {
        path: '/api/me',
        lazy: async () => {
          const mod = await import('./routes/api.me');
          return { loader: mod.loader };
        },
      },
      {
        path: '/api/leaderboard',
        lazy: async () => {
          const mod = await import('./routes/api.leaderboard');
          return { loader: mod.loader };
        },
      },
      {
        path: '/api/economy/balance',
        lazy: async () => {
          const mod = await import('./routes/api.economy.balance');
          return { loader: mod.loader };
        },
      },
    ],
  },
]);

// ──────────────────────────────────────────────
// Mount
// ──────────────────────────────────────────────

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);
