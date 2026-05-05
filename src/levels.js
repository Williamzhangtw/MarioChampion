/**
 * levels.js  –  5 levels, each designed to test a different gamepad capability.
 *
 *  Level 1 – "Button Awakening"   : D-pad / left-stick + A-button (jump)
 *  Level 2 – "Rapid Rhythm"       : Rapid button presses, jump timing
 *  Level 3 – "Analog Artist"      : Precision analog-stick control
 *  Level 4 – "Trigger Master"     : Sustained run button / analog triggers
 *  Level 5 – "Champion's Trial"   : Everything combined + boss Goomba
 *
 *  Each level returns:
 *    { tileMap, entities, mario, background, name, testFocus, tip }
 */

// ─── Shared helper: clamp a value ────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── Level factory helpers ────────────────────────────────────────────────────

/**
 * Build the ground rows: solid ground for the bottom 2 rows, and the row
 * above that is the "floor" at tileRow=rows-2 (index rows-3 for entities).
 */
function addGround(grid, cols, rows, gapCols = []) {
  const gapSet = new Set(gapCols);
  for (let c = 0; c < cols; c++) {
    if (!gapSet.has(c)) {
      grid[rows - 1][c] = TILE.GROUND;
      grid[rows - 2][c] = TILE.GROUND;
    }
  }
}

/** Mario pixel-y for standing on top of ground at row r. */
function floorY(r) { return r * TILE_SIZE - 30; }

// ──────────────────────────────────────────────────────────────────────────────
// LEVEL 1  –  "Button Awakening"
// Teaches: move left/right (D-pad or stick), jump (A), stomp goombas.
// ──────────────────────────────────────────────────────────────────────────────
function buildLevel1() {
  const COLS = 88, ROWS = 14;
  const grid = blankGrid(COLS, ROWS);

  // Ground (gaps at cols 18-20 and 35-37)
  addGround(grid, COLS, ROWS, [18, 19, 20, 35, 36, 37]);

  // Floating platforms
  hLine(grid, 9, 6, 9, TILE.GROUND);
  hLine(grid, 8, 13, 16, TILE.GROUND);
  hLine(grid, 9, 22, 25, TILE.GROUND);
  hLine(grid, 9, 30, 33, TILE.GROUND);
  hLine(grid, 8, 40, 43, TILE.GROUND);
  hLine(grid, 9, 50, 55, TILE.GROUND);
  hLine(grid, 8, 60, 64, TILE.GROUND);
  hLine(grid, 9, 70, 75, TILE.GROUND);

  // Question blocks row
  hLine(grid, 7, 8, 8, TILE.QUESTION);    // single ?
  hLine(grid, 7, 15, 17, TILE.QUESTION);  // triple ?
  hLine(grid, 6, 24, 24, TILE.QUESTION);
  hLine(grid, 7, 42, 44, TILE.QUESTION);
  hLine(grid, 6, 62, 62, TILE.QUESTION);

  // Bricks
  hLine(grid, 7, 10, 12, TILE.BRICK);
  hLine(grid, 7, 51, 54, TILE.BRICK);

  // Pipes (2-wide, 2-tall)
  pipe(grid, 27, ROWS - 4, 2);
  pipe(grid, 46, ROWS - 4, 2);
  pipe(grid, 65, ROWS - 5, 3);
  pipe(grid, 80, ROWS - 4, 2);

  const entities = [
    new Goomba(10 * TILE_SIZE, floorY(ROWS - 2)),
    new Goomba(15 * TILE_SIZE, floorY(ROWS - 2)),
    new Goomba(23 * TILE_SIZE, floorY(ROWS - 2)),
    new Goomba(38 * TILE_SIZE, floorY(ROWS - 2)),
    new Goomba(48 * TILE_SIZE, floorY(ROWS - 2)),
    new Goomba(55 * TILE_SIZE, floorY(ROWS - 2)),
    new Goomba(68 * TILE_SIZE, floorY(ROWS - 2)),
    new Goomba(77 * TILE_SIZE, floorY(ROWS - 2)),
    new Coin(9  * TILE_SIZE + 6, 5 * TILE_SIZE),
    new Coin(14 * TILE_SIZE + 6, 6 * TILE_SIZE),
    new Coin(25 * TILE_SIZE + 6, 5 * TILE_SIZE),
    new Coin(43 * TILE_SIZE + 6, 5 * TILE_SIZE),
    new FlagGoal(84 * TILE_SIZE, (ROWS - 8) * TILE_SIZE),
  ];

  const mario = new Mario(2 * TILE_SIZE, floorY(ROWS - 2));
  const tileMap = new TileMap(grid, COLS, ROWS);

  return {
    tileMap, entities, mario,
    background: COL.SKY,
    name: 'Level 1 – Button Awakening',
    testFocus: 'D-pad / Left Stick  +  A Button (Jump)',
    tip: 'Move and jump! Stomp goombas by landing on them.',
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// LEVEL 2  –  "Rapid Rhythm"
// Teaches: button timing, rapid A-presses for consecutive short jumps.
// Stepping-stone platforms force the player to jump quickly and precisely.
// ──────────────────────────────────────────────────────────────────────────────
function buildLevel2() {
  const COLS = 80, ROWS = 14;
  const grid = blankGrid(COLS, ROWS);

  // No continuous ground – only stepping stones!
  // Starting ledge
  hLine(grid, ROWS - 2, 0, 5, TILE.GROUND);
  hLine(grid, ROWS - 1, 0, 5, TILE.GROUND);

  // Stepping stones: each is 2 tiles wide with 3-tile gaps
  const stoneRow = ROWS - 5;
  const stoneRow2 = ROWS - 3;
  const starts = [8, 13, 18, 23, 28, 33, 38, 43, 48, 53, 58, 63, 68];
  starts.forEach((s, i) => {
    const r = i % 2 === 0 ? stoneRow2 : stoneRow;
    hLine(grid, r, s, s + 1, TILE.GROUND);
  });

  // Final safe platform + flag
  hLine(grid, ROWS - 2, 72, 79, TILE.GROUND);
  hLine(grid, ROWS - 1, 72, 79, TILE.GROUND);

  // Question blocks above stepping stones
  [10, 20, 30, 40, 50, 60, 70].forEach(c => {
    if (c < COLS) grid[stoneRow - 2][c] = TILE.QUESTION;
  });

  // Bricks to break between stones
  [15, 25, 35, 45, 55].forEach(c => {
    if (c < COLS) grid[stoneRow - 3][c] = TILE.BRICK;
  });

  const entities = [
    new Goomba(10 * TILE_SIZE, (stoneRow2 - 1) * TILE_SIZE - 28),
    new Goomba(25 * TILE_SIZE, (stoneRow - 1)  * TILE_SIZE - 28),
    new Goomba(40 * TILE_SIZE, (stoneRow2 - 1) * TILE_SIZE - 28),
    new Goomba(55 * TILE_SIZE, (stoneRow - 1)  * TILE_SIZE - 28),
    new Goomba(70 * TILE_SIZE, (stoneRow2 - 1) * TILE_SIZE - 28),
    new Coin(9  * TILE_SIZE, (stoneRow2 - 2) * TILE_SIZE),
    new Coin(18 * TILE_SIZE, (stoneRow  - 2) * TILE_SIZE),
    new Coin(33 * TILE_SIZE, (stoneRow2 - 2) * TILE_SIZE),
    new Coin(48 * TILE_SIZE, (stoneRow  - 2) * TILE_SIZE),
    new Coin(63 * TILE_SIZE, (stoneRow2 - 2) * TILE_SIZE),
    new FlagGoal(77 * TILE_SIZE, (ROWS - 8) * TILE_SIZE),
  ];

  const mario = new Mario(1 * TILE_SIZE, floorY(ROWS - 2));
  const tileMap = new TileMap(grid, COLS, ROWS);

  return {
    tileMap, entities, mario,
    background: '#3494e6',
    name: 'Level 2 – Rapid Rhythm',
    testFocus: 'A Button Timing – rapid successive jumps',
    tip: 'Each platform is tiny! Press A precisely to hop from stone to stone.',
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// LEVEL 3  –  "Analog Artist"
// Tests analog-stick precision: very narrow platforms (1 tile wide),
// moving platforms, and tight corridors requiring fine directional control.
// ──────────────────────────────────────────────────────────────────────────────
function buildLevel3() {
  const COLS = 72, ROWS = 14;
  const grid = blankGrid(COLS, ROWS);

  // Start platform
  hLine(grid, ROWS - 2, 0, 4, TILE.GROUND);
  hLine(grid, ROWS - 1, 0, 4, TILE.GROUND);

  // Ultra-narrow single-tile platforms at staggered heights
  const platforms = [
    [7,  ROWS - 4], [10, ROWS - 6], [13, ROWS - 5],
    [16, ROWS - 7], [20, ROWS - 5], [23, ROWS - 6],
    [26, ROWS - 4], [30, ROWS - 6], [33, ROWS - 7],
    [36, ROWS - 5], [39, ROWS - 6], [43, ROWS - 4],
    [47, ROWS - 6], [51, ROWS - 5], [55, ROWS - 7],
    [59, ROWS - 5], [63, ROWS - 6],
  ];
  platforms.forEach(([c, r]) => {
    grid[r][c] = TILE.GROUND;          // 1-tile-wide platform
    grid[r + 1] && (grid[r + 1][c] = TILE.GROUND);  // two-tall so it looks solid
  });

  // Tight corridor walls (test precision navigation)
  for (let r = 8; r <= ROWS - 3; r++) {
    grid[r][44] = TILE.HARD_BLOCK;
    grid[r][45] = TILE.HARD_BLOCK;
  }

  // End platform
  hLine(grid, ROWS - 2, 66, COLS - 1, TILE.GROUND);
  hLine(grid, ROWS - 1, 66, COLS - 1, TILE.GROUND);

  // Question blocks encourage exploration
  [8, 17, 28, 40, 52, 62].forEach(c => {
    if (c < COLS) grid[4][c] = TILE.QUESTION;
  });

  // Moving platforms (defined as entities)
  const movPlatforms = [
    new MovingPlatform(9  * TILE_SIZE, (ROWS - 5) * TILE_SIZE, true,  false, 48, 0.8),
    new MovingPlatform(31 * TILE_SIZE, (ROWS - 8) * TILE_SIZE, false, true,  48, 0.6),
    new MovingPlatform(50 * TILE_SIZE, (ROWS - 5) * TILE_SIZE, true,  false, 64, 1.0),
  ];

  const entities = [
    ...movPlatforms,
    new Coin(7  * TILE_SIZE + 6, (ROWS - 6) * TILE_SIZE),
    new Coin(16 * TILE_SIZE + 6, (ROWS - 9) * TILE_SIZE),
    new Coin(30 * TILE_SIZE + 6, (ROWS - 9) * TILE_SIZE),
    new Coin(47 * TILE_SIZE + 6, (ROWS - 8) * TILE_SIZE),
    new Coin(63 * TILE_SIZE + 6, (ROWS - 8) * TILE_SIZE),
    new Goomba(26 * TILE_SIZE, (ROWS - 5) * TILE_SIZE - 28),
    new Goomba(55 * TILE_SIZE, (ROWS - 7) * TILE_SIZE - 28),
    new FlagGoal(69 * TILE_SIZE, (ROWS - 8) * TILE_SIZE),
  ];

  const mario = new Mario(1 * TILE_SIZE, floorY(ROWS - 2));
  const tileMap = new TileMap(grid, COLS, ROWS);

  return {
    tileMap, entities, mario,
    background: '#2d2d6b',
    name: 'Level 3 – Analog Artist',
    testFocus: 'Analog stick precision on 1-tile platforms + moving platforms',
    tip: 'Tilt the stick gently! Land precisely on single-tile ledges.',
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// LEVEL 4  –  "Trigger Master"
// Tests: sustained run-button / analog trigger hold.
// Features long corridors that need full-speed running to clear wide gaps,
// and enemies that can only be outrun (not stomped easily).
// ──────────────────────────────────────────────────────────────────────────────
function buildLevel4() {
  const COLS = 100, ROWS = 14;
  const grid = blankGrid(COLS, ROWS);

  // Ground with wide run-gaps (require full running speed)
  const gaps = new Set([
    22, 23, 24, 25, 26,        // gap 1 – need run-jump
    48, 49, 50, 51, 52, 53,    // gap 2 – wide
    72, 73, 74, 75, 76, 77,    // gap 3 – very wide
  ]);
  addGround(grid, COLS, ROWS, [...gaps]);

  // High platforms only reachable when running fast
  hLine(grid, 6, 30, 35, TILE.GROUND);
  hLine(grid, 6, 55, 60, TILE.GROUND);
  hLine(grid, 5, 80, 86, TILE.GROUND);

  // Brick bonus tunnels (low-ceiling, encourage crouching / speed)
  hLine(grid, 9, 10, 20, TILE.BRICK);  // low ceiling
  hLine(grid, 9, 35, 46, TILE.BRICK);

  // Question blocks atop high platforms
  hLine(grid, 4, 31, 34, TILE.QUESTION);
  hLine(grid, 4, 56, 59, TILE.QUESTION);
  hLine(grid, 3, 81, 85, TILE.QUESTION);

  // Pipes as obstacles
  pipe(grid, 8,  ROWS - 4, 2);
  pipe(grid, 40, ROWS - 4, 2);
  pipe(grid, 63, ROWS - 5, 3);
  pipe(grid, 88, ROWS - 4, 2);

  const entities = [
    // Packs of goombas that must be outrun or carefully stomped
    new Goomba(12 * TILE_SIZE, floorY(ROWS - 2)),
    new Goomba(14 * TILE_SIZE, floorY(ROWS - 2)),
    new Goomba(30 * TILE_SIZE, 5 * TILE_SIZE),
    new Goomba(38 * TILE_SIZE, floorY(ROWS - 2)),
    new Goomba(55 * TILE_SIZE, 5 * TILE_SIZE),
    new Goomba(58 * TILE_SIZE, 5 * TILE_SIZE),
    new Goomba(65 * TILE_SIZE, floorY(ROWS - 2)),
    new Goomba(80 * TILE_SIZE, 4 * TILE_SIZE),
    new Goomba(90 * TILE_SIZE, floorY(ROWS - 2)),
    new Coin(32 * TILE_SIZE, 3 * TILE_SIZE),
    new Coin(56 * TILE_SIZE, 3 * TILE_SIZE),
    new Coin(82 * TILE_SIZE, 2 * TILE_SIZE),
    new Mushroom(59 * TILE_SIZE, 4 * TILE_SIZE),
    new FlagGoal(96 * TILE_SIZE, (ROWS - 8) * TILE_SIZE),
  ];

  const mario = new Mario(2 * TILE_SIZE, floorY(ROWS - 2));
  const tileMap = new TileMap(grid, COLS, ROWS);

  return {
    tileMap, entities, mario,
    background: '#c8a000',
    name: 'Level 4 – Trigger Master',
    testFocus: 'B / RB / RT Run button – hold for wide-gap run-jumps',
    tip: 'Hold the run button to build speed – you need max speed to clear the wide gaps!',
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// LEVEL 5  –  "Champion's Trial"
// Every mechanic combined. Moving platforms, narrow ledges, run-jumps, enemy
// swarms, star power section, and a boss cluster of Goombas at the end.
// ──────────────────────────────────────────────────────────────────────────────
function buildLevel5() {
  const COLS = 110, ROWS = 14;
  const grid = blankGrid(COLS, ROWS);

  // Ground with several gaps
  const gaps = new Set([
    15, 16, 17,
    30, 31, 32, 33,
    50, 51, 52, 53, 54,
    68, 69, 70, 71, 72, 73,
    87, 88, 89, 90,
  ]);
  addGround(grid, COLS, ROWS, [...gaps]);

  // Platforms (mix of heights)
  hLine(grid, 9,  5,  8,  TILE.GROUND);
  hLine(grid, 8,  12, 14, TILE.GROUND);
  hLine(grid, 7,  20, 22, TILE.GROUND);
  hLine(grid, 8,  27, 29, TILE.GROUND);
  hLine(grid, 6,  35, 37, TILE.GROUND);
  hLine(grid, 7,  40, 42, TILE.GROUND);
  hLine(grid, 6,  55, 58, TILE.GROUND);
  hLine(grid, 5,  63, 66, TILE.GROUND);
  hLine(grid, 8,  75, 80, TILE.GROUND);
  hLine(grid, 6,  85, 87, TILE.GROUND);
  hLine(grid, 7,  95, 100, TILE.GROUND);

  // Question and brick mix
  hLine(grid, 6, 6, 7, TILE.QUESTION);
  hLine(grid, 5, 21, 21, TILE.QUESTION);
  hLine(grid, 5, 36, 36, TILE.QUESTION);
  hLine(grid, 4, 56, 57, TILE.QUESTION);
  hLine(grid, 4, 76, 78, TILE.QUESTION);
  hLine(grid, 3, 96, 99, TILE.QUESTION);

  hLine(grid, 6, 13, 13, TILE.BRICK);
  hLine(grid, 5, 28, 28, TILE.BRICK);
  hLine(grid, 6, 41, 42, TILE.BRICK);
  hLine(grid, 5, 64, 65, TILE.BRICK);

  // Pipes
  pipe(grid, 22, ROWS - 4, 2);
  pipe(grid, 44, ROWS - 5, 3);
  pipe(grid, 60, ROWS - 4, 2);
  pipe(grid, 84, ROWS - 5, 3);
  pipe(grid, 102, ROWS - 4, 2);

  // Moving platforms
  const movPlatforms = [
    new MovingPlatform(15 * TILE_SIZE, 9 * TILE_SIZE, true,  false, 48, 0.9),
    new MovingPlatform(50 * TILE_SIZE, 7 * TILE_SIZE, false, true,  40, 0.7),
    new MovingPlatform(68 * TILE_SIZE, 8 * TILE_SIZE, true,  false, 56, 1.1),
    new MovingPlatform(87 * TILE_SIZE, 9 * TILE_SIZE, false, true,  36, 0.8),
  ];

  const entities = [
    ...movPlatforms,
    // Early goombas
    new Goomba(8  * TILE_SIZE, 8 * TILE_SIZE),
    new Goomba(20 * TILE_SIZE, floorY(ROWS - 2)),
    new Goomba(35 * TILE_SIZE, 5 * TILE_SIZE),
    new Goomba(42 * TILE_SIZE, 6 * TILE_SIZE),
    new Goomba(56 * TILE_SIZE, 5 * TILE_SIZE),
    new Goomba(76 * TILE_SIZE, 7 * TILE_SIZE),
    new Goomba(78 * TILE_SIZE, 7 * TILE_SIZE),
    new Goomba(95 * TILE_SIZE, floorY(ROWS - 2)),
    // Boss cluster (5 goombas guarding the flag)
    new Goomba(100 * TILE_SIZE, floorY(ROWS - 2)),
    new Goomba(103 * TILE_SIZE, floorY(ROWS - 2)),
    new Goomba(105 * TILE_SIZE, floorY(ROWS - 2)),
    // Coins & items
    new Coin(6  * TILE_SIZE, 5 * TILE_SIZE),
    new Coin(21 * TILE_SIZE, 4 * TILE_SIZE),
    new Coin(36 * TILE_SIZE, 3 * TILE_SIZE),
    new Coin(56 * TILE_SIZE, 3 * TILE_SIZE),
    new Coin(77 * TILE_SIZE, 3 * TILE_SIZE),
    new StarItem(97 * TILE_SIZE, 2 * TILE_SIZE),  // star before boss!
    new Mushroom(13 * TILE_SIZE, 5 * TILE_SIZE),
    // Flag
    new FlagGoal(107 * TILE_SIZE, (ROWS - 8) * TILE_SIZE),
  ];

  const mario = new Mario(2 * TILE_SIZE, floorY(ROWS - 2));
  const tileMap = new TileMap(grid, COLS, ROWS);

  return {
    tileMap, entities, mario,
    background: '#1a0a2e',
    name: 'Level 5 – Champion\'s Trial',
    testFocus: 'Full controller – every mechanic combined',
    tip: 'This is the ultimate test! Use every skill: run, precise jumps, moving platforms, and stomp that boss cluster!',
  };
}

// ─── Level registry ──────────────────────────────────────────────────────────
const LEVEL_BUILDERS = [
  buildLevel1,
  buildLevel2,
  buildLevel3,
  buildLevel4,
  buildLevel5,
];

function buildLevel(index) {
  const builder = LEVEL_BUILDERS[index];
  if (!builder) throw new Error(`Level ${index + 1} does not exist`);
  return builder();
}
