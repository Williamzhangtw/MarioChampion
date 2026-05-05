/**
 * renderer.js  –  All canvas drawing logic.
 * Pure functions; nothing stored here modifies game state.
 */

// ─── Background ───────────────────────────────────────────────────────────────

function drawBackground(ctx, levelData, cameraX) {
  ctx.fillStyle = levelData.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Parallax clouds
  const cloudPositions = [
    { x: 80,  y: 40, w: 120 },
    { x: 280, y: 60, w: 90  },
    { x: 500, y: 30, w: 140 },
    { x: 680, y: 55, w: 100 },
  ];
  cloudPositions.forEach(c => {
    const cx = ((c.x - cameraX * 0.3) % (CANVAS_WIDTH + 200) + CANVAS_WIDTH + 200) % (CANVAS_WIDTH + 200) - 100;
    drawCloud(ctx, cx, c.y, c.w);
  });

  // Hills (parallax 0.5)
  const hills = [
    { x: 60,  h: 80, w: 160 },
    { x: 320, h: 60, w: 120 },
    { x: 560, h: 90, w: 180 },
  ];
  hills.forEach(h => {
    const hx = ((h.x - cameraX * 0.5) % (CANVAS_WIDTH + 300) + CANVAS_WIDTH + 300) % (CANVAS_WIDTH + 300) - 100;
    drawHill(ctx, hx, CANVAS_HEIGHT, h.w, h.h);
  });
}

function drawCloud(ctx, x, y, w) {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const h = w * 0.35;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.3, y + h * 0.6, w * 0.3, h * 0.45, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.55, y + h * 0.4, w * 0.35, h * 0.55, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.78, y + h * 0.6, w * 0.25, h * 0.42, 0, 0, Math.PI * 2);
  ctx.rect(x + w * 0.05, y + h * 0.6, w * 0.9, h * 0.4);
  ctx.fill();
}

function drawHill(ctx, x, baseY, w, h) {
  ctx.fillStyle = 'rgba(70,150,60,0.5)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, baseY, w / 2, h, 0, Math.PI, 0);
  ctx.fill();
}

// ─── Tile Map ─────────────────────────────────────────────────────────────────

function drawTileMap(ctx, tileMap, cameraX) {
  const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE));
  const endCol   = Math.min(tileMap.width - 1, startCol + Math.ceil(CANVAS_WIDTH / TILE_SIZE) + 1);

  for (let row = 0; row < tileMap.height; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const tile = tileMap.getTile(col, row);
      if (tile === TILE.EMPTY) continue;
      const sx = col * TILE_SIZE - cameraX;
      const sy = row * TILE_SIZE;
      drawTile(ctx, tile, sx, sy);
    }
  }
}

function drawTile(ctx, tile, x, y) {
  const T = TILE_SIZE;
  switch (tile) {
    case TILE.GROUND:
      ctx.fillStyle = COL.GROUND_BODY;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = COL.GROUND_TOP;
      ctx.fillRect(x, y, T, 8);
      // texture lines
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
      break;

    case TILE.BRICK:
      ctx.fillStyle = COL.BRICK;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = COL.BRICK_MORTAR;
      // mortar lines
      ctx.fillRect(x, y + 10, T, 2);
      ctx.fillRect(x, y + 22, T, 2);
      ctx.fillRect(x + 16, y, 2, 10);
      ctx.fillRect(x + 8,  y + 12, 2, 10);
      ctx.fillRect(x + 20, y + 12, 2, 10);
      ctx.fillRect(x + 16, y + 24, 2, 8);
      break;

    case TILE.QUESTION: {
      ctx.fillStyle = COL.QUESTION;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = '#c87000';
      ctx.fillRect(x, y, T, 3);           // top shadow
      ctx.fillRect(x, y + T - 3, T, 3);  // bottom
      ctx.fillRect(x, y, 3, T);           // left
      ctx.fillRect(x + T - 3, y, 3, T);  // right
      ctx.fillStyle = COL.QUESTION_SYM;
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', x + T / 2, y + T / 2 + 1);
      break;
    }

    case TILE.USED_BLOCK:
      ctx.fillStyle = COL.USED_BLOCK;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x, y, T, 3);
      ctx.fillRect(x, y + T - 3, T, 3);
      ctx.fillRect(x, y, 3, T);
      ctx.fillRect(x + T - 3, y, 3, T);
      break;

    case TILE.PIPE_TOP:
      ctx.fillStyle = COL.PIPE_DARK;
      ctx.fillRect(x - 2, y, T + 4, T);
      ctx.fillStyle = COL.PIPE_LIGHT;
      ctx.fillRect(x,     y + 4, T - 4, T - 8);
      ctx.fillStyle = COL.PIPE_DARK;
      ctx.fillRect(x - 2, y + 2, T + 4, 6); // cap top border
      break;

    case TILE.PIPE_BODY:
      ctx.fillStyle = COL.PIPE_DARK;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = COL.PIPE_LIGHT;
      ctx.fillRect(x + 4, y, T - 10, T);
      break;

    case TILE.HARD_BLOCK:
      ctx.fillStyle = '#808080';
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = '#606060';
      ctx.fillRect(x, y, T, 3);
      ctx.fillRect(x, y + T - 3, T, 3);
      ctx.fillRect(x, y, 3, T);
      ctx.fillRect(x + T - 3, y, 3, T);
      ctx.fillStyle = '#a0a0a0';
      ctx.fillRect(x + 3, y + 3, T - 6, T - 6);
      break;
  }
}

// ─── Mario ────────────────────────────────────────────────────────────────────

function drawMario(ctx, mario, cameraX) {
  if (mario.dying) {
    _drawMarioBody(ctx, mario, cameraX, false);
    return;
  }
  // Blink during invincibility
  if (mario.invincible && Math.floor(mario.invincibleTimer / 4) % 2 === 0) return;

  const starGlow = mario.starPower && Math.floor(Date.now() / 100) % 2 === 0;
  if (starGlow) {
    ctx.save();
    ctx.shadowColor = '#f8c800';
    ctx.shadowBlur  = 16;
  }

  _drawMarioBody(ctx, mario, cameraX, true);

  if (starGlow) ctx.restore();
}

function _drawMarioBody(ctx, mario, cameraX, withDetail) {
  const sx = Math.floor(mario.x - cameraX);
  const sy = Math.floor(mario.y);
  const big = mario.size !== 'small';

  ctx.save();
  if (mario.facing === -1) {
    ctx.translate(sx + mario.width, sy);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(sx, sy);
  }

  if (big) {
    _drawBigMario(ctx, mario, withDetail);
  } else {
    _drawSmallMario(ctx, mario, withDetail);
  }

  ctx.restore();
}

function _drawSmallMario(ctx, mario, detail) {
  // Hat
  ctx.fillStyle = COL.MARIO_HAT;
  ctx.fillRect(4,  0, 20, 5);
  ctx.fillRect(1,  5, 24, 5);
  // Face
  ctx.fillStyle = COL.MARIO_SKIN;
  ctx.fillRect(4, 10, 20, 8);
  if (detail) {
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(7,  12, 3, 3);
    ctx.fillRect(18, 12, 3, 3);
    // Mustache
    ctx.fillStyle = '#5a2800';
    ctx.fillRect(6, 17, 14, 2);
    ctx.fillRect(5, 15, 4, 2);
    ctx.fillRect(17, 15, 4, 2);
  }
  // Overalls
  ctx.fillStyle = COL.MARIO_OVERALL;
  ctx.fillRect(2, 18, 22, 9);
  if (detail) {
    // Buttons
    ctx.fillStyle = '#f8c800';
    ctx.fillRect(7, 19, 3, 3);
    ctx.fillRect(16, 19, 3, 3);
  }
  // Shoes
  ctx.fillStyle = COL.MARIO_SHOE;
  ctx.fillRect(0,  27, 10, 3);
  ctx.fillRect(16, 27, 11, 3);
}

function _drawBigMario(ctx, mario, detail) {
  // Hat
  ctx.fillStyle = COL.MARIO_HAT;
  ctx.fillRect(4,  0, 20, 7);
  ctx.fillRect(1,  7, 24, 6);
  // Face
  ctx.fillStyle = COL.MARIO_SKIN;
  ctx.fillRect(3, 13, 22, 12);
  if (detail) {
    ctx.fillStyle = '#000';
    ctx.fillRect(7,  16, 4, 4);
    ctx.fillRect(18, 16, 4, 4);
    ctx.fillStyle = '#5a2800';
    ctx.fillRect(6, 23, 16, 3);
    ctx.fillRect(5, 20, 4, 3);
    ctx.fillRect(19, 20, 4, 3);
  }
  // Torso / overalls
  ctx.fillStyle = COL.MARIO_OVERALL;
  ctx.fillRect(1, 25, 24, 18);
  if (detail) {
    ctx.fillStyle = '#f8c800';
    ctx.fillRect(7, 27, 4, 4);
    ctx.fillRect(16, 27, 4, 4);
  }
  // Legs
  ctx.fillStyle = COL.MARIO_HAT;
  ctx.fillRect(2, 43, 9,  12);
  ctx.fillRect(15, 43, 9, 12);
  // Shoes
  ctx.fillStyle = COL.MARIO_SHOE;
  ctx.fillRect(0,  52, 12, 6);
  ctx.fillRect(14, 52, 12, 6);
}

// ─── Goomba ───────────────────────────────────────────────────────────────────

function drawGoomba(ctx, g, cameraX) {
  const sx = Math.floor(g.x - cameraX);
  const sy = Math.floor(g.y);

  if (g.stomped) {
    // Flat squished version
    ctx.fillStyle = COL.GOOMBA_BODY;
    ctx.beginPath();
    ctx.ellipse(sx + 14, sy + 10, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COL.GOOMBA_FEET;
    ctx.fillRect(sx + 2,  sy + 10, 8, 4);
    ctx.fillRect(sx + 18, sy + 10, 8, 4);
    return;
  }

  // Body
  ctx.fillStyle = COL.GOOMBA_BODY;
  ctx.beginPath();
  ctx.ellipse(sx + 14, sy + 14, 14, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Feet (animated)
  ctx.fillStyle = COL.GOOMBA_FEET;
  const footOffset = g.animFrame === 0 ? 0 : 3;
  ctx.fillRect(sx + 2,  sy + 20 + footOffset, 8, 8);
  ctx.fillRect(sx + 18, sy + 20 - footOffset, 8, 8);

  // Eyes
  ctx.fillStyle = COL.GOOMBA_EYES;
  ctx.beginPath();
  ctx.ellipse(sx + 9,  sy + 11, 4, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(sx + 19, sy + 11, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupils (angry slant)
  ctx.fillStyle = COL.GOOMBA_PUPILS;
  ctx.beginPath();
  ctx.ellipse(sx + 10, sy + 12, 2, 3, -0.3, 0, Math.PI * 2);
  ctx.ellipse(sx + 18, sy + 12, 2, 3,  0.3, 0, Math.PI * 2);
  ctx.fill();

  // Uni-brow
  ctx.strokeStyle = '#000';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(sx + 6,  sy + 7);
  ctx.lineTo(sx + 12, sy + 9);
  ctx.moveTo(sx + 22, sy + 7);
  ctx.lineTo(sx + 16, sy + 9);
  ctx.stroke();
}

// ─── Coin ─────────────────────────────────────────────────────────────────────

const COIN_SQUISH = [1, 0.85, 0.5, 0.85]; // x-scale per frame

function drawCoin(ctx, coin, cameraX) {
  if (coin.collected) return;
  const sx = Math.floor(coin.x - cameraX);
  const sy = Math.floor(coin.y);
  const scaleX = COIN_SQUISH[coin.animFrame];

  ctx.save();
  ctx.translate(sx + 10, sy + 10);
  ctx.scale(scaleX, 1);

  ctx.fillStyle = COL.COIN;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COL.COIN_SHINE;
  ctx.beginPath();
  ctx.arc(-3, -3, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Mushroom ─────────────────────────────────────────────────────────────────

function drawMushroom(ctx, m, cameraX) {
  if (m.collected) return;
  const sx = Math.floor(m.x - cameraX);
  const sy = Math.floor(m.y);

  // Cap
  ctx.fillStyle = COL.MUSHROOM_CAP;
  ctx.beginPath();
  ctx.ellipse(sx + 14, sy + 12, 14, 12, 0, Math.PI, 0);
  ctx.fill();

  // Spots
  ctx.fillStyle = COL.MUSHROOM_SPOT;
  ctx.beginPath();
  ctx.arc(sx + 9,  sy + 9,  4, 0, Math.PI * 2);
  ctx.arc(sx + 19, sy + 9,  4, 0, Math.PI * 2);
  ctx.arc(sx + 14, sy + 5,  3, 0, Math.PI * 2);
  ctx.fill();

  // Stem
  ctx.fillStyle = COL.MUSHROOM_BODY;
  ctx.fillRect(sx + 6, sy + 12, 16, 14);
  ctx.fillStyle = '#d09040';
  ctx.fillRect(sx + 6, sy + 12, 6, 14); // shadow side
}

// ─── Star ─────────────────────────────────────────────────────────────────────

function drawStar(ctx, star, cameraX) {
  if (star.collected) return;
  const sx = Math.floor(star.x - cameraX);
  const sy = Math.floor(star.y);
  const angle = (star.animFrame / 8) * Math.PI * 2;

  ctx.save();
  ctx.translate(sx + 13, sy + 13);
  ctx.rotate(angle);
  ctx.fillStyle = COL.STAR_BODY;
  _drawStarShape(ctx, 0, 0, 13, 6, 5);
  ctx.fillStyle = '#fffaaa';
  _drawStarShape(ctx, 0, 0, 7, 3, 5);
  ctx.restore();
}

function _drawStarShape(ctx, cx, cy, outer, inner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / points - Math.PI / 2;
    if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    else         ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
  ctx.fill();
}

// ─── Moving Platform ──────────────────────────────────────────────────────────

function drawMovingPlatform(ctx, plat, cameraX) {
  const sx = Math.floor(plat.x - cameraX);
  const sy = Math.floor(plat.y);

  ctx.fillStyle = COL.PLATFORM_BODY;
  ctx.fillRect(sx, sy + 4, plat.width, plat.height - 4);

  ctx.fillStyle = COL.PLATFORM_TOP;
  ctx.fillRect(sx, sy, plat.width, 6);

  // Decorative notches
  ctx.fillStyle = '#8a6020';
  for (let i = 0; i < plat.width; i += 16) {
    ctx.fillRect(sx + i, sy, 2, 6);
  }
}

// ─── Flag Goal ────────────────────────────────────────────────────────────────

function drawFlag(ctx, flag, cameraX, tick) {
  const sx = Math.floor(flag.x - cameraX);
  const sy = Math.floor(flag.y);

  // Pole
  ctx.fillStyle = COL.FLAG_POLE;
  ctx.fillRect(sx + 6, sy, 4, flag.height);

  // Flag fabric (wave animation)
  const wave = Math.sin(tick * 0.08) * 4;
  ctx.fillStyle = COL.FLAG_FABRIC;
  ctx.beginPath();
  ctx.moveTo(sx + 10, sy + 8);
  ctx.lineTo(sx + 40, sy + 16 + wave);
  ctx.lineTo(sx + 40, sy + 36 + wave);
  ctx.lineTo(sx + 10, sy + 40);
  ctx.fill();

  // Ball at top
  ctx.fillStyle = '#f8c800';
  ctx.beginPath();
  ctx.arc(sx + 8, sy + 6, 6, 0, Math.PI * 2);
  ctx.fill();
}

// ─── Coin Burst popup ────────────────────────────────────────────────────────

function drawCoinBurst(ctx, burst, cameraX) {
  if (!burst.alive) return;
  const alpha = burst.timer / 40;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COL.COIN;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+200', Math.floor(burst.x - cameraX + 10), Math.floor(burst.y));
  ctx.restore();
}

// ─── HUD ─────────────────────────────────────────────────────────────────────

function drawHUD(ctx, mario, timer, levelName) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 40);

  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  ctx.textBaseline = 'middle';

  ctx.textAlign = 'left';
  ctx.fillText(`♥ ${mario.lives}`, 12, 20);

  ctx.textAlign = 'center';
  ctx.fillText(`$ ${mario.score}`, CANVAS_WIDTH / 2 - 80, 20);
  ctx.fillText(`● ${mario.coins}`, CANVAS_WIDTH / 2 + 20, 20);
  ctx.fillText(`⏱ ${Math.ceil(timer)}`, CANVAS_WIDTH / 2 + 120, 20);

  ctx.textAlign = 'right';
  ctx.font = '11px monospace';
  ctx.fillStyle = '#ddd';
  ctx.fillText(levelName, CANVAS_WIDTH - 12, 20);

  ctx.restore();
}

// ─── Overlay Screens ─────────────────────────────────────────────────────────

function drawOverlay(ctx, state, currentLevel, totalLevels, score) {
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  switch (state) {
    case STATE.MENU:
      _overlayText(ctx, '🎮 Mario Champion', CANVAS_HEIGHT / 2 - 80, '42px', '#f8c800');
      _overlayText(ctx, 'Connect your gamepad and press any button', CANVAS_HEIGHT / 2 - 20, '18px', '#fff');
      _overlayText(ctx, 'Keyboard: ← → Arrow keys  |  Z = Jump  |  X = Run', CANVAS_HEIGHT / 2 + 20, '14px', '#bbb');
      _overlayText(ctx, '5 levels – each tests a different controller capability', CANVAS_HEIGHT / 2 + 60, '14px', '#adf');
      _overlayText(ctx, 'Press any key or button to start ▶', CANVAS_HEIGHT / 2 + 110, '16px', '#8f8');
      break;

    case STATE.PAUSED:
      _overlayText(ctx, '⏸ PAUSED', CANVAS_HEIGHT / 2 - 30, '36px', '#f8c800');
      _overlayText(ctx, 'Press Start / Enter to resume', CANVAS_HEIGHT / 2 + 30, '18px', '#fff');
      break;

    case STATE.LEVEL_COMPLETE:
      _overlayText(ctx, '⭐ Level Complete!', CANVAS_HEIGHT / 2 - 40, '36px', '#f8c800');
      _overlayText(ctx, `Score: ${score}`, CANVAS_HEIGHT / 2 + 20, '22px', '#fff');
      if (currentLevel < totalLevels - 1) {
        _overlayText(ctx, 'Press any button for next level ▶', CANVAS_HEIGHT / 2 + 70, '16px', '#8f8');
      } else {
        _overlayText(ctx, 'All levels complete! You are the Champion!', CANVAS_HEIGHT / 2 + 70, '16px', '#8f8');
      }
      break;

    case STATE.GAME_OVER:
      _overlayText(ctx, '💀 GAME OVER', CANVAS_HEIGHT / 2 - 40, '40px', '#f44');
      _overlayText(ctx, `Final score: ${score}`, CANVAS_HEIGHT / 2 + 20, '22px', '#fff');
      _overlayText(ctx, 'Press any button to retry', CANVAS_HEIGHT / 2 + 70, '16px', '#aaa');
      break;

    case STATE.VICTORY:
      _overlayText(ctx, '🏆 CHAMPION!', CANVAS_HEIGHT / 2 - 60, '44px', '#f8c800');
      _overlayText(ctx, 'You mastered all 5 controller challenges!', CANVAS_HEIGHT / 2, '18px', '#fff');
      _overlayText(ctx, `Final score: ${score}`, CANVAS_HEIGHT / 2 + 44, '22px', '#8f8');
      _overlayText(ctx, 'Press any button to play again', CANVAS_HEIGHT / 2 + 90, '15px', '#aaa');
      break;
  }
}

function _overlayText(ctx, text, y, size, color) {
  ctx.font = `${size} "Courier New", monospace`;
  ctx.fillStyle = color;
  ctx.fillText(text, CANVAS_WIDTH / 2, y);
}

// ─── Level info banner ───────────────────────────────────────────────────────

function drawLevelBanner(ctx, levelData, timer) {
  if (timer > 180) return; // only first 3 seconds
  const alpha = Math.min(1, timer / 30) * Math.min(1, (180 - timer) / 30);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(CANVAS_WIDTH / 2 - 280, CANVAS_HEIGHT / 2 - 50, 560, 110);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#f8c800';
  ctx.fillText(levelData.name, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 24);
  ctx.font = '14px monospace';
  ctx.fillStyle = '#adf';
  ctx.fillText(`🎮 Tests: ${levelData.testFocus}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 6);
  ctx.font = '12px monospace';
  ctx.fillStyle = '#ccc';
  ctx.fillText(levelData.tip, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 32);
  ctx.restore();
}
