import { Router } from 'express';
import { RoomStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { requireUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createRoomSchema,
  getRoomSchema,
  joinRoomSchema,
  startRoomSchema,
  getRoomStateSchema,
} from '../schemas/rooms.js';
import { setRoomMeta, getGridSnapshot, getScores, loadRoomMeta } from '../game/engine.js';
import { onRoomStarted } from '../websocket/lifecycle.js';
import { broadcastRoomChange } from '../websocket/lobby.js';
import {
  toRoomList,
  toRoomCard,
  toRoomDetail,
  toRoomState,
} from '../transformers/index.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../constants/errors.js';

export const roomsRouter = Router();

const ownerSelect = { id: true, username: true, avatarUrl: true, color: true };
const memberInclude = {
  members: { include: { user: { select: ownerSelect } } },
};

roomsRouter.get('/', requireUser, async (_req, res, next) => {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        status: { in: [RoomStatus.WAITING, RoomStatus.ACTIVE] },
        isPublic: true,
        members: { some: {} },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        owner: { select: ownerSelect },
        _count: { select: { members: true } },
      },
    });
    res.json({ rooms: toRoomList(rooms) });
  } catch (e) {
    next(e);
  }
});

roomsRouter.post('/', requireUser, validate(createRoomSchema), async (req, res, next) => {
  try {
    const data = req.body;
    const room = await prisma.room.create({
      data: {
        ...data,
        ownerId: req.user.id,
        members: { create: { userId: req.user.id } },
      },
      include: {
        owner: { select: ownerSelect },
        _count: { select: { members: true } },
      },
    });
    res.status(201).json({ room: toRoomCard(room) });
    broadcastRoomChange(room.id).catch(() => {});
  } catch (e) {
    next(e);
  }
});

roomsRouter.get('/:id', requireUser, validate(getRoomSchema), async (req, res, next) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: ownerSelect },
        ...memberInclude,
        _count: { select: { members: true } },
      },
    });
    if (!room) {
      return res.status(404).json({
        code: ERROR_CODES.ROOM_NOT_FOUND,
        error: ERROR_MESSAGES[ERROR_CODES.ROOM_NOT_FOUND],
      });
    }
    res.json({ room: toRoomDetail(room) });
  } catch (e) {
    next(e);
  }
});

roomsRouter.post('/:id/join', requireUser, validate(joinRoomSchema), async (req, res, next) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { members: true } } },
    });
    if (!room) {
      return res.status(404).json({
        code: ERROR_CODES.ROOM_NOT_FOUND,
        error: ERROR_MESSAGES[ERROR_CODES.ROOM_NOT_FOUND],
      });
    }
    if (room.status === RoomStatus.ENDED) {
      return res.status(400).json({ code: ERROR_CODES.ENDED, error: ERROR_MESSAGES[ERROR_CODES.ENDED] });
    }

    const existing = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId: req.user.id } },
    });
    if (!existing) {
      if (room._count.members >= room.maxPlayers) {
        return res.status(400).json({
          code: ERROR_CODES.ROOM_FULL,
          error: ERROR_MESSAGES[ERROR_CODES.ROOM_FULL],
        });
      }
      await prisma.roomMember.create({
        data: { roomId: room.id, userId: req.user.id },
      });
      broadcastRoomChange(room.id).catch(() => {});
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

roomsRouter.post('/:id/start', requireUser, validate(startRoomSchema), async (req, res, next) => {
  try {
    const existing = await prisma.room.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({
        code: ERROR_CODES.ROOM_NOT_FOUND,
        error: ERROR_MESSAGES[ERROR_CODES.ROOM_NOT_FOUND],
      });
    }
    if (existing.ownerId !== req.user.id) {
      return res.status(403).json({
        code: ERROR_CODES.NOT_OWNER,
        error: ERROR_MESSAGES[ERROR_CODES.NOT_OWNER],
      });
    }

    const includeArgs = {
      owner: { select: ownerSelect },
      ...memberInclude,
      _count: { select: { members: true } },
    };

    if (existing.status === RoomStatus.ACTIVE) {
      const room = await prisma.room.findUnique({
        where: { id: existing.id },
        include: includeArgs,
      });
      return res.json({ room: toRoomDetail(room) });
    }

    const startedAt = new Date();
    const endsAt = startedAt.getTime() + existing.durationSec * 1000;
    const updated = await prisma.room.update({
      where: { id: existing.id },
      data: { status: RoomStatus.ACTIVE, startedAt },
      include: includeArgs,
    });
    await setRoomMeta(existing.id, {
      gridSize: existing.gridSize,
      status: RoomStatus.ACTIVE,
      endsAt,
      durationSec: existing.durationSec,
      maxPlayers: existing.maxPlayers,
    });
    await onRoomStarted(existing.id);
    broadcastRoomChange(existing.id).catch(() => {});
    res.json({ room: toRoomDetail(updated) });
  } catch (e) {
    next(e);
  }
});

roomsRouter.get('/:id/state', requireUser, validate(getRoomStateSchema), async (req, res, next) => {
  try {
    const [meta, grid, scores, room] = await Promise.all([
      loadRoomMeta(req.params.id),
      getGridSnapshot(req.params.id),
      getScores(req.params.id),
      prisma.room.findUnique({
        where: { id: req.params.id },
        include: {
          owner: { select: ownerSelect },
          ...memberInclude,
          _count: { select: { members: true } },
        },
      }),
    ]);
    res.json(toRoomState({ meta, grid, scores, room }));
  } catch (e) {
    next(e);
  }
});
