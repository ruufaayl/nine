// ──────────────────────────────────────────────
// NINE — WebSocket Server Entry Point
// ──────────────────────────────────────────────

import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { registerSocketEvents, shutdownPollers } from './socketEvents';
import { shutdownMatchmaker } from './matchmaker';

// ─── Configuration ──────────────────────────

const PORT = Number(process.env.WS_PORT) || 3001;

const ALLOWED_ORIGINS = [
  'http://localhost:5173',     // Vite dev
  'http://localhost:3000',     // RR7 dev
  process.env.FRONTEND_URL,   // Production
].filter(Boolean) as string[];

// ─── Express + HTTP ─────────────────────────

const app = express();

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

const httpServer = createServer(app);

// ─── Socket.IO ──────────────────────────────

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 10_000,
  pingTimeout: 5_000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 30_000,
    skipMiddlewares: true,
  },
});

// Wire all socket events
registerSocketEvents(io);

// ─── Start Server ───────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[nine-ws] WebSocket server running on :${PORT}`);
  console.log(`[nine-ws] CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

// ─── Graceful Shutdown ──────────────────────

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[nine-ws] ${signal} received — shutting down…`);

  shutdownPollers();
  await shutdownMatchmaker();

  io.close(() => {
    httpServer.close(() => {
      console.log('[nine-ws] Server closed.');
      process.exit(0);
    });
  });

  // Force exit after 5s if graceful fails
  setTimeout(() => {
    console.error('[nine-ws] Forced exit after timeout.');
    process.exit(1);
  }, 5_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
