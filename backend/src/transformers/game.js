import { toRoomMeta, toRoomDetail } from './room.js';

// Server-authoritative clock payload (also sent via socket).
export function toClockPayload(meta) {
  if (!meta) return null;
  const serverNow = Date.now();
  const endsAt = Number(meta.endsAt) || 0;
  const remainingMs = endsAt ? Math.max(0, endsAt - serverNow) : 0;
  return {
    serverNow,
    endsAt,
    remainingMs,
    status: meta.status,
  };
}

// Grid is a hash "x:y" -> userId; coerce to plain object of strings.
export function toGridSnapshot(grid) {
  if (!grid) return {};
  const out = {};
  for (const [k, v] of Object.entries(grid)) out[k] = String(v);
  return out;
}

// Scores: hash userId -> count; coerce values to numbers.
export function toScoresSnapshot(scores) {
  if (!scores) return {};
  const out = {};
  for (const [k, v] of Object.entries(scores)) out[k] = Number(v) || 0;
  return out;
}

// Full state response (used by REST GET /rooms/:id/state and socket snapshots).
export function toRoomState({ meta, grid, scores, room }) {
  return {
    meta: toRoomMeta(meta),
    clock: toClockPayload(meta),
    grid: toGridSnapshot(grid),
    scores: toScoresSnapshot(scores),
    room: toRoomDetail(room),
  };
}
