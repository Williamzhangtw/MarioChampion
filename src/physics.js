/**
 * Physics helpers – AABB tile collision resolution and entity overlap test.
 * Entities must expose: x, y, width, height, vx, vy, onGround.
 */

function isSolidTile(tile) {
  return tile === TILE.GROUND      ||
         tile === TILE.BRICK       ||
         tile === TILE.QUESTION    ||
         tile === TILE.USED_BLOCK  ||
         tile === TILE.PIPE_TOP    ||
         tile === TILE.PIPE_BODY   ||
         tile === TILE.HARD_BLOCK;
}

/**
 * Resolve entity vs tile-map collisions in place.
 * Separates horizontal and vertical passes to avoid corner artifacts.
 *
 * @param {Object} entity   - any object with x,y,vx,vy,width,height
 * @param {TileMap} tileMap
 * @param {Function} onBlockHit - called(col,row,tile) when Mario hits block from below
 */
function resolveTileCollision(entity, tileMap, onBlockHit) {
  // ─── Horizontal pass ─────────────────────────────────────────────────────
  entity.x += entity.vx;
  _resolveAxis(entity, tileMap, 'x', onBlockHit);

  // ─── Vertical pass ───────────────────────────────────────────────────────
  entity.onGround = false;
  entity.y += entity.vy;
  _resolveAxis(entity, tileMap, 'y', onBlockHit);
}

function _resolveAxis(entity, tileMap, axis, onBlockHit) {
  const left   = Math.floor(entity.x / TILE_SIZE);
  const right  = Math.floor((entity.x + entity.width - 1) / TILE_SIZE);
  const top    = Math.floor(entity.y / TILE_SIZE);
  const bottom = Math.floor((entity.y + entity.height - 1) / TILE_SIZE);

  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      const tile = tileMap.getTile(col, row);
      if (!isSolidTile(tile)) continue;

      const tileX = col * TILE_SIZE;
      const tileY = row * TILE_SIZE;

      // Overlap on each axis
      const ox = Math.min(entity.x + entity.width,  tileX + TILE_SIZE) - Math.max(entity.x, tileX);
      const oy = Math.min(entity.y + entity.height, tileY + TILE_SIZE) - Math.max(entity.y, tileY);

      if (ox <= 0 || oy <= 0) continue;

      if (axis === 'x') {
        if (entity.x + entity.width / 2 < tileX + TILE_SIZE / 2) {
          entity.x = tileX - entity.width; // push left
        } else {
          entity.x = tileX + TILE_SIZE;    // push right
        }
        entity.vx = 0;
      } else {
        if (entity.y + entity.height / 2 < tileY + TILE_SIZE / 2) {
          // Coming from above → landing on top
          entity.y = tileY - entity.height;
          entity.vy = 0;
          entity.onGround = true;
        } else {
          // Coming from below → hitting ceiling
          entity.y = tileY + TILE_SIZE;
          if (entity.vy < 0) {
            entity.vy = 1; // small downward push to avoid sticking
            if (onBlockHit) onBlockHit(col, row, tile, entity);
          }
        }
      }
    }
  }
}

/**
 * Resolve entity standing on a moving platform (treated as solid ground).
 * @param {Object} entity
 * @param {MovingPlatform} platform
 * @returns {boolean} true if entity is now resting on the platform
 */
function resolveMovingPlatform(entity, platform) {
  const prevBottom = entity.y + entity.height - entity.vy; // last frame bottom
  const currBottom = entity.y + entity.height;

  const pLeft  = platform.x;
  const pRight = platform.x + platform.width;
  const pTop   = platform.y;

  const eLeft  = entity.x;
  const eRight = entity.x + entity.width;

  if (
    entity.vy >= 0 &&
    currBottom >= pTop &&
    prevBottom <= pTop + 4 &&
    eRight > pLeft + 4 &&
    eLeft  < pRight - 4
  ) {
    entity.y = pTop - entity.height;
    entity.vy = 0;
    entity.onGround = true;
    // Carry entity horizontally with platform
    entity.x += platform.dx;
    return true;
  }
  return false;
}

/** Simple AABB overlap test. Returns true if a and b overlap. */
function overlaps(a, b) {
  return a.x < b.x + b.width  &&
         a.x + a.width  > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}
