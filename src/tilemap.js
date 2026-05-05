/**
 * TileMap – wraps a 2-D array and provides helper methods.
 */
class TileMap {
  /**
   * @param {number[][]} grid     - 2D array [row][col] of TILE constants
   * @param {number}     width    - number of columns
   * @param {number}     height   - number of rows
   */
  constructor(grid, width, height) {
    // Deep-copy so we can mutate freely
    this.data   = grid.map(row => [...row]);
    this.width  = width;
    this.height = height;
    this._spawnListeners = []; // called when a block is hit from below
  }

  getTile(col, row) {
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
      return TILE.GROUND; // treat out-of-bounds as solid
    }
    return this.data[row][col] ?? TILE.EMPTY;
  }

  setTile(col, row, tile) {
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) return;
    this.data[row][col] = tile;
  }

  /** Register a listener for block-hit events (col, row). */
  onBlockHit(fn) {
    this._spawnListeners.push(fn);
  }

  /** Called by physics when Mario hits a block from below. */
  triggerBlockHit(col, row, tile, mario) {
    if (tile === TILE.QUESTION) {
      this.setTile(col, row, TILE.USED_BLOCK);
      this._spawnListeners.forEach(fn => fn(col, row, 'coin'));
    } else if (tile === TILE.BRICK && mario && mario.size !== 'small') {
      this.setTile(col, row, TILE.EMPTY);
      this._spawnListeners.forEach(fn => fn(col, row, 'break'));
    }
  }

  /** Pixel X of the right edge of the map. */
  get pixelWidth() { return this.width * TILE_SIZE; }

  /** Pixel Y of the bottom edge of the map. */
  get pixelHeight() { return this.height * TILE_SIZE; }
}

// ─── Level map builder helpers ────────────────────────────────────────────────

/** Create a blank grid of given size filled with EMPTY tiles. */
function blankGrid(cols, rows) {
  return Array.from({ length: rows }, () => Array(cols).fill(TILE.EMPTY));
}

/** Fill a horizontal span with a tile. */
function hLine(grid, row, colStart, colEnd, tile) {
  for (let c = colStart; c <= colEnd; c++) grid[row][c] = tile;
}

/** Fill a vertical span with a tile. */
function vLine(grid, col, rowStart, rowEnd, tile) {
  for (let r = rowStart; r <= rowEnd; r++) grid[r][col] = tile;
}

/** Place a pipe (2 wide) at the given top-left tile. height includes top cap. */
function pipe(grid, col, topRow, pipeHeight) {
  // Cap row
  grid[topRow][col]     = TILE.PIPE_TOP;
  grid[topRow][col + 1] = TILE.PIPE_TOP;
  // Body rows
  for (let r = topRow + 1; r < topRow + pipeHeight; r++) {
    grid[r][col]     = TILE.PIPE_BODY;
    grid[r][col + 1] = TILE.PIPE_BODY;
  }
}
