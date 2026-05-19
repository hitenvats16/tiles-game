// Game tuning constants. Edit here, not in business logic.
export const GAME = {
  COOLDOWN_SEC: 5,
  LEADERBOARD_INTERVAL_MS: 5000,
  CLOCK_TICK_INTERVAL_MS: 1000,
  GRID_MIN: 10,
  GRID_MAX: 100,
  PLAYERS_MIN: 2,
  PLAYERS_MAX: 10,
  DURATION_MIN_SEC: 30,
  DURATION_MAX_SEC: 60 * 10,
  NAME_MAX_LEN: 60,
};

// Color palette used to assign a stable color per user (hashed from email).
export const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7',
  '#ec4899', '#f43f5e', '#10b981', '#0ea5e9', '#8b5cf6',
];
