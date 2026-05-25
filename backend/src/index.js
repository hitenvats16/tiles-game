import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';

import { config } from './config.js';
import { prisma } from './prisma.js';
import { authRouter } from './routes/auth.js';
import { roomsRouter } from './routes/rooms.js';
import { usersRouter } from './routes/users.js';
import { registerSocket } from './websocket/index.js';
import { errorHandler } from './middleware/error.js';
import { requestLogger } from './middleware/logger.js';

if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.env,
    tracesSampleRate: config.sentry.tracesSampleRate,
  });
}

const app = express();

app.use(cors({ origin: config.server.clientOrigin, credentials: true }));
app.use(express.json());
app.use(requestLogger);

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: 'up' });
  } catch (err) {
    res.status(503).json({ ok: false, database: 'down', error: err.message });
  }
});
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/users', usersRouter);

Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: config.server.clientOrigin, credentials: true },
});

registerSocket(io);

server.listen(config.server.port, () => {
  console.log(`Backend listening on http://localhost:${config.server.port}`);
});
