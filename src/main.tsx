import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router';
import './index.css';

// ── Route imports ──
import RootLayout from './routes/root';
import Home from './routes/home';
import PlayRoute from './routes/play';
import AuthRoute, { action as authAction, ErrorBoundary as AuthErrorBoundary } from './routes/auth';
import ProfileRoute, {
  loader as profileLoader,
  action as profileAction,
  ErrorBoundary as ProfileErrorBoundary,
} from './routes/profile';
import LeaderboardRoute from './routes/leaderboard';

// ── Data Router (supports loaders + actions) ──

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'play/:modeId', element: <PlayRoute /> },
      {
        path: 'auth',
        element: <AuthRoute />,
        action: authAction,
        errorElement: <AuthErrorBoundary />,
      },
      {
        path: 'profile',
        element: <ProfileRoute />,
        loader: profileLoader,
        action: profileAction,
        errorElement: <ProfileErrorBoundary />,
      },
      { path: 'leaderboard', element: <LeaderboardRoute /> },
    ],
  },
]);

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
