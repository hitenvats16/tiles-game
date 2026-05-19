import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';

import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { roomsRouter } from './routes/rooms.js';
import { usersRouter } from './routes/users.js';
import { registerSocket } from './websocket/index.js';
import { errorHandler } from './middleware/error.js';

const app = express();

app.use(cors({ origin: config.server.clientOrigin, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/users', usersRouter);

app.use(errorHandler);

const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: config.server.clientOrigin, credentials: true },
});

registerSocket(io);

server.listen(config.server.port, () => {
  console.log(`Backend listening on http://localhost:${config.server.port}`);
});
