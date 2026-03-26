import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import './index.css';
import RootLayout from './routes/root';
import Home from './routes/home';
import PlayRoute from './routes/play';
import AuthRoute from './routes/auth';
import LeaderboardRoute from './routes/leaderboard';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="play/:modeId" element={<PlayRoute />} />
          <Route path="auth" element={<AuthRoute />} />
          <Route path="leaderboard" element={<LeaderboardRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
