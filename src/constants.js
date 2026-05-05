// ─── Game Configuration ────────────────────────────────────────────────────
const TILE_SIZE = 32;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 448; // 14 tiles tall

const GRAVITY = 0.45;
const MAX_FALL_SPEED = 12;
const MARIO_WALK_SPEED = 3.2;
const MARIO_RUN_SPEED = 5.8;
const MARIO_JUMP_FORCE = -12.5;
const RUN_JUMP_BOOST = -1.5; // extra upward force when running
const FRICTION_GROUND = 0.78;
const FRICTION_AIR = 0.94;
const DEADZONE = 0.18;

// ─── Tile IDs ───────────────────────────────────────────────────────────────
const TILE = Object.freeze({
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION: 3,
  USED_BLOCK: 4,
  PIPE_TOP: 5,
  PIPE_BODY: 6,
  HARD_BLOCK: 7, // indestructible even for big Mario
});

// ─── Entity Types ───────────────────────────────────────────────────────────
const ENTITY = Object.freeze({
  MARIO: 'mario',
  GOOMBA: 'goomba',
  COIN: 'coin',
  MUSHROOM: 'mushroom',
  STAR: 'star',
  MOVING_PLATFORM: 'moving_platform',
  FLAG: 'flag',
  COIN_BURST: 'coin_burst', // visual-only popup
});

// ─── Game States ────────────────────────────────────────────────────────────
const STATE = Object.freeze({
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LEVEL_COMPLETE: 'level_complete',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
});

// ─── Colour palette ─────────────────────────────────────────────────────────
const COL = Object.freeze({
  SKY: '#5C94FC',
  SKY_DARK: '#1a1a4e',
  GROUND_TOP: '#85c255',
  GROUND_BODY: '#7c5a3a',
  BRICK: '#c84c0c',
  BRICK_MORTAR: '#a83c08',
  QUESTION: '#e8a800',
  QUESTION_SYM: '#ffffff',
  USED_BLOCK: '#706050',
  PIPE_LIGHT: '#52c800',
  PIPE_DARK: '#2e8000',
  COIN: '#f8c800',
  COIN_SHINE: '#ffffff',
  MARIO_HAT: '#cc2200',
  MARIO_SKIN: '#ffa050',
  MARIO_OVERALL: '#0044cc',
  MARIO_SHOE: '#6b3010',
  GOOMBA_BODY: '#a05000',
  GOOMBA_FEET: '#6b3010',
  GOOMBA_EYES: '#ffffff',
  GOOMBA_PUPILS: '#000000',
  PLATFORM_TOP: '#c8a050',
  PLATFORM_BODY: '#a07030',
  FLAG_POLE: '#888888',
  FLAG_FABRIC: '#cc0000',
  MUSHROOM_CAP: '#cc2200',
  MUSHROOM_SPOT: '#ffffff',
  MUSHROOM_BODY: '#ffa050',
  STAR_BODY: '#f8c800',
});

// ─── Standard Gamepad Button Indices ────────────────────────────────────────
const GP_BTN = Object.freeze({
  A: 0,        // Jump
  B: 1,        // Run / Dash
  X: 2,        // Fire (future)
  Y: 3,
  LB: 4,
  RB: 5,       // Run / Dash (alternative)
  LT: 6,       // Analog trigger L
  RT: 7,       // Analog trigger R (Run)
  SELECT: 8,
  START: 9,
  L3: 10,
  R3: 11,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
});
