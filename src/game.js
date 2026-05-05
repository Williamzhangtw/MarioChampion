/**
 * game.js  –  Main Game class; owns the game loop, state machine, and
 * wires all modules together.
 */

class Game {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.input   = new InputHandler();

    // Game state
    this.state       = STATE.MENU;
    this.levelIndex  = 0;
    this.totalLevels = LEVEL_BUILDERS.length; // defined in levels.js

    // Runtime level data (populated by _loadLevel)
    this.levelData  = null;
    this.tileMap    = null;
    this.mario      = null;
    this.entities   = [];
    this.bursts     = [];      // CoinBurst visual popups
    this.cameraX    = 0;
    this.timer      = 300;    // countdown in seconds
    this.timerFrac  = 0;      // sub-frame accumulator
    this.tick       = 0;      // raw frame counter
    this.bannerTimer = 0;     // level-name banner display

    // Performance metrics
    this.metrics = {
      deaths: 0,
      falls: 0,
      stompCount: 0,
      coinsGot: 0,
      levelStartTime: 0,
      levelTimes: [],
    };

    this._raf = null;
    this._lastTime = 0;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  start() {
    this._raf = requestAnimationFrame(this._loop.bind(this));
  }

  _loop(timestamp) {
    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.05); // cap at 50 ms
    this._lastTime = timestamp;
    this.tick++;

    this.input.update();
    this._update(dt);
    this._render();

    this._updateControllerUI();

    this._raf = requestAnimationFrame(this._loop.bind(this));
  }

  // ─── State machine update ────────────────────────────────────────────────────

  _update(dt) {
    switch (this.state) {
      case STATE.MENU:
        if (this.input.anyPressed()) this._startGame();
        break;

      case STATE.PLAYING:
        this._updatePlaying(dt);
        break;

      case STATE.PAUSED:
        if (this.input.pausePressed()) this.state = STATE.PLAYING;
        break;

      case STATE.LEVEL_COMPLETE:
        if (this.input.anyPressed()) {
          if (this.levelIndex < this.totalLevels - 1) {
            this.levelIndex++;
            this._loadLevel(this.levelIndex);
            this.state = STATE.PLAYING;
          } else {
            this.state = STATE.VICTORY;
          }
        }
        break;

      case STATE.GAME_OVER:
        if (this.input.anyPressed()) {
          this.levelIndex = 0;
          this._startGame();
        }
        break;

      case STATE.VICTORY:
        if (this.input.anyPressed()) {
          this.levelIndex = 0;
          this._startGame();
        }
        break;
    }
  }

  _startGame() {
    this._loadLevel(this.levelIndex);
    this.state = STATE.PLAYING;
  }

  // ─── Level loading ───────────────────────────────────────────────────────────

  _loadLevel(index) {
    const data      = buildLevel(index);
    this.levelData  = data;
    this.tileMap    = data.tileMap;
    this.mario      = data.mario;
    this.entities   = data.entities;
    this.bursts     = [];
    this.cameraX    = 0;
    this.timer      = 300;
    this.timerFrac  = 0;
    this.bannerTimer = 0;

    // Preserve mario lives & score across levels
    if (this._savedMarioStats) {
      this.mario.lives = this._savedMarioStats.lives;
      this.mario.score = this._savedMarioStats.score;
      this.mario.coins = this._savedMarioStats.coins;
    }
    this._savedMarioStats = null;

    // Register block-hit callback
    this.tileMap.onBlockHit((col, row, type) => {
      if (type === 'coin') {
        const burst = new CoinBurst(col * TILE_SIZE, (row - 1) * TILE_SIZE);
        this.bursts.push(burst);
        this.mario.addCoin();
      }
    });

    this.metrics.levelStartTime = Date.now();
  }

  // ─── Playing update ──────────────────────────────────────────────────────────

  _updatePlaying(dt) {
    const mario = this.mario;

    // Pause toggle
    if (this.input.pausePressed()) {
      this.state = STATE.PAUSED;
      return;
    }

    // ── Countdown timer ────────────────────────────────────────────────────
    this.bannerTimer++;
    this.timerFrac += dt;
    if (this.timerFrac >= 1) {
      this.timerFrac -= 1;
      this.timer = Math.max(0, this.timer - 1);
    }
    if (this.timer <= 0 && !mario.dying) {
      mario.hit(); // force die
      mario.dying = true;
      mario.vy    = -14;
    }

    // ── Mario update ───────────────────────────────────────────────────────
    if (!mario.dying) {
      mario.update(this.input);
    } else {
      mario.vy += GRAVITY;
      mario.y  += mario.vy;
    }

    // ── Tile collision (only when not in death animation) ──────────────────
    if (!mario.dying) {
      resolveTileCollision(mario, this.tileMap, (col, row, tile) => {
        this.tileMap.triggerBlockHit(col, row, tile, mario);
      });

      // Keep Mario within horizontal map bounds
      mario.x = Math.max(0, Math.min(mario.x, this.tileMap.pixelWidth - mario.width));
    }

    // ── Entities update ────────────────────────────────────────────────────
    this._updateEntities();

    // ── Bursts update ──────────────────────────────────────────────────────
    this.bursts.forEach(b => b.update());
    this.bursts = this.bursts.filter(b => b.alive);

    // ── Camera ────────────────────────────────────────────────────────────
    const targetCam = mario.x - CANVAS_WIDTH / 3;
    const maxCam    = this.tileMap.pixelWidth - CANVAS_WIDTH;
    this.cameraX    = Math.max(0, Math.min(targetCam, maxCam));

    // ── Death / respawn ───────────────────────────────────────────────────
    if (mario.dying && mario.y > CANVAS_HEIGHT + 64) {
      mario.lives--;
      this.metrics.deaths++;
      if (mario.lives <= 0) {
        this.state = STATE.GAME_OVER;
      } else {
        // Respawn
        const respawn = this.levelData.mario;
        mario.x     = respawn.x;
        mario.y     = respawn.y;
        mario.vx    = 0;
        mario.vy    = 0;
        mario.dying = false;
        mario.dead  = false;
        mario.invincible      = true;
        mario.invincibleTimer = 120;
      }
    }

    // ── Fall out of world ─────────────────────────────────────────────────
    if (!mario.dying && mario.y > this.tileMap.pixelHeight + 32) {
      mario.hit();
      mario.dying = true;
      mario.vy    = -14;
      this.metrics.falls++;
    }
  }

  _updateEntities() {
    const mario = this.mario;

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];

      switch (e.type) {
        // ── Moving platform ──────────────────────────────────────────────
        case ENTITY.MOVING_PLATFORM:
          e.update();
          if (!mario.dying) resolveMovingPlatform(mario, e);
          break;

        // ── Goomba ───────────────────────────────────────────────────────
        case ENTITY.GOOMBA: {
          e.update();
          if (!e.stomped) {
            const prevVx = e.vx;
            resolveTileCollision(e, this.tileMap, null);
            // Reverse direction when blocked by a tile wall (vx zeroed by physics)
            if (prevVx !== 0 && e.vx === 0) e.vx = -prevVx;
            // Clamp to map and reverse at edges
            if (e.x < 0) { e.x = 0; e.vx = Math.abs(e.vx) || 0.9; }
            if (e.x + e.width > this.tileMap.pixelWidth) {
              e.x = this.tileMap.pixelWidth - e.width;
              e.vx = -(Math.abs(e.vx) || 0.9);
            }
          }
          if (!e.alive) { this.entities.splice(i, 1); break; }

          // Mario vs Goomba collision
          if (!mario.dying && !mario.invincible && overlaps(mario.hitbox, e.hitbox)) {
            if (!mario.starPower) {
              // Stomp from above?
              const mBottom = mario.y + mario.height;
              const eTop    = e.y;
              if (mario.vy > 0 && mBottom < eTop + 14) {
                e.stomp();
                mario.stomp();
                mario.score += mario.stompCombo >= 2 ? 400 : 100;
                this.metrics.stompCount++;
                const burst = new CoinBurst(e.x + 8, e.y - 16);
                burst.alive = true;
                this.bursts.push(burst);
              } else {
                mario.hit();
              }
            } else {
              // Star power – defeat instantly
              e.stomp();
              mario.score += 200;
            }
          }
          break;
        }

        // ── Coin ─────────────────────────────────────────────────────────
        case ENTITY.COIN:
          e.update();
          if (!e.collected && !mario.dying && overlaps(mario.hitbox, e.hitbox)) {
            e.collected = true;
            mario.addCoin();
            this.metrics.coinsGot++;
            const burst = new CoinBurst(e.x, e.y - 10);
            this.bursts.push(burst);
          }
          if (e.collected) this.entities.splice(i, 1);
          break;

        // ── Mushroom ─────────────────────────────────────────────────────
        case ENTITY.MUSHROOM: {
          e.update();
          const prevVxM = e.vx;
          resolveTileCollision(e, this.tileMap, null);
          if ((prevVxM !== 0 && e.vx === 0) || e.x <= 0 || e.x + e.width >= this.tileMap.pixelWidth) {
            e.vx = -(prevVxM || 1.2);
          }
          if (e.x < 0) e.x = 0;
          if (e.x + e.width > this.tileMap.pixelWidth) e.x = this.tileMap.pixelWidth - e.width;
          if (!e.collected && !mario.dying && overlaps(mario.hitbox, e.hitbox)) {
            e.collected = true;
            mario.grow();
            mario.score += 1000;
          }
          if (e.collected || e.y > this.tileMap.pixelHeight + 64) this.entities.splice(i, 1);
          break;
        }

        // ── Star ─────────────────────────────────────────────────────────
        case ENTITY.STAR: {
          e.update();
          const prevVxS = e.vx;
          resolveTileCollision(e, this.tileMap, null);
          if (e.onGround && Math.abs(e.vy) < 1) e.groundBounce();
          if ((prevVxS !== 0 && e.vx === 0) || e.x <= 0 || e.x + e.width >= this.tileMap.pixelWidth) {
            e.vx = -(prevVxS || 1.5);
          }
          if (e.x < 0) e.x = 0;
          if (e.x + e.width > this.tileMap.pixelWidth) e.x = this.tileMap.pixelWidth - e.width;
          if (!e.collected && !mario.dying && overlaps(mario.hitbox, e.hitbox)) {
            e.collected = true;
            mario.applyStar();
            mario.score += 1000;
          }
          if (e.collected || e.y > this.tileMap.pixelHeight + 64) this.entities.splice(i, 1);
          break;
        }

        // ── Flag / goal ───────────────────────────────────────────────────
        case ENTITY.FLAG:
          if (!mario.dying && overlaps(mario.hitbox, e.hitbox)) {
            if (!e.reached) {
              e.reached = true;
              mario.score += Math.ceil(this.timer) * 50;
              this._savedMarioStats = {
                lives: mario.lives,
                score: mario.score,
                coins: mario.coins,
              };
              const elapsed = (Date.now() - this.metrics.levelStartTime) / 1000;
              this.metrics.levelTimes.push(elapsed.toFixed(1));
              this.state = STATE.LEVEL_COMPLETE;
            }
          }
          break;
      }
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  _render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    if (this.state === STATE.MENU || !this.levelData) {
      ctx.fillStyle = COL.SKY;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawOverlay(ctx, STATE.MENU, 0, this.totalLevels, 0);
      return;
    }

    // Background
    drawBackground(ctx, this.levelData, this.cameraX);

    // Tiles
    drawTileMap(ctx, this.tileMap, this.cameraX);

    // Moving platforms
    this.entities.filter(e => e.type === ENTITY.MOVING_PLATFORM)
      .forEach(e => drawMovingPlatform(ctx, e, this.cameraX));

    // Coins, mushrooms, stars
    this.entities.forEach(e => {
      switch (e.type) {
        case ENTITY.COIN:     drawCoin(ctx, e, this.cameraX);     break;
        case ENTITY.MUSHROOM: drawMushroom(ctx, e, this.cameraX); break;
        case ENTITY.STAR:     drawStar(ctx, e, this.cameraX);     break;
        case ENTITY.FLAG:     drawFlag(ctx, e, this.cameraX, this.tick); break;
      }
    });

    // Goombas
    this.entities.filter(e => e.type === ENTITY.GOOMBA && e.alive)
      .forEach(e => drawGoomba(ctx, e, this.cameraX));

    // Mario
    drawMario(ctx, this.mario, this.cameraX);

    // Coin burst popups
    this.bursts.forEach(b => drawCoinBurst(ctx, b, this.cameraX));

    // HUD
    drawHUD(ctx, this.mario, this.timer, this.levelData.name);

    // Level banner (first few seconds)
    drawLevelBanner(ctx, this.levelData, this.bannerTimer);

    // Overlay for non-playing states
    if (this.state !== STATE.PLAYING) {
      drawOverlay(ctx, this.state, this.levelIndex, this.totalLevels, this.mario ? this.mario.score : 0);
    }
  }

  // ─── Controller UI panel ─────────────────────────────────────────────────────

  _updateControllerUI() {
    const gp = this.input.getRawGamepad();

    // Buttons panel
    const btnPanel = document.getElementById('btn-panel');
    if (btnPanel) {
      const labels = ['A','B','X','Y','LB','RB','LT','RT','Sel','Sta','L3','R3','↑','↓','←','→'];
      let html = '';
      for (let i = 0; i < 16; i++) {
        const pressed = gp && gp.buttons[i] ?
          (typeof gp.buttons[i] === 'object' ? gp.buttons[i].pressed : gp.buttons[i]) : false;
        const val = gp && gp.buttons[i] ?
          (typeof gp.buttons[i] === 'object' ? gp.buttons[i].value.toFixed(2) : (gp.buttons[i] ? '1.00' : '0.00')) : '—';
        html += `<div class="btn-chip ${pressed ? 'active' : ''}">
          <span class="btn-label">${labels[i]}</span>
          <span class="btn-val">${val}</span>
        </div>`;
      }
      btnPanel.innerHTML = html;
    }

    // Sticks panel
    const stickPanel = document.getElementById('stick-panel');
    if (stickPanel) {
      const axes = gp ? Array.from(gp.axes).slice(0, 4) : [0, 0, 0, 0];
      stickPanel.innerHTML = `
        <div class="stick-group">
          <div class="stick-title">Left Stick</div>
          ${_stickSVG(axes[0] || 0, axes[1] || 0)}
          <div class="stick-vals">X:${(axes[0]||0).toFixed(2)} Y:${(axes[1]||0).toFixed(2)}</div>
        </div>
        <div class="stick-group">
          <div class="stick-title">Right Stick</div>
          ${_stickSVG(axes[2] || 0, axes[3] || 0)}
          <div class="stick-vals">X:${(axes[2]||0).toFixed(2)} Y:${(axes[3]||0).toFixed(2)}</div>
        </div>
        <div class="trigger-group">
          <div class="stick-title">Triggers</div>
          <div class="trigger-bar"><span>LT</span><div class="trigger-fill" style="width:${Math.round(this.input.getLTValue()*100)}%"></div><span>${this.input.getLTValue().toFixed(2)}</span></div>
          <div class="trigger-bar"><span>RT</span><div class="trigger-fill" style="width:${Math.round(this.input.getRTValue()*100)}%"></div><span>${this.input.getRTValue().toFixed(2)}</span></div>
          <div class="stick-title" style="margin-top:8px">Stats</div>
          <div class="stat-row">Presses/s: ${this.input.getPressesPerSecond()}</div>
          ${this.mario ? `<div class="stat-row">Score: ${this.mario.score}</div>` : ''}
          ${this.metrics.deaths > 0 ? `<div class="stat-row">Deaths: ${this.metrics.deaths}</div>` : ''}
        </div>
      `;
    }
  }
}

function _stickSVG(x, y) {
  const cx = 36, cy = 36, r = 28;
  const dotX = cx + x * r;
  const dotY = cy + y * r;
  return `<svg width="72" height="72" class="stick-svg">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#333" stroke="#555" stroke-width="1"/>
    <line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}" stroke="#444" stroke-width="1"/>
    <line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="#444" stroke-width="1"/>
    <circle cx="${dotX.toFixed(1)}" cy="${dotY.toFixed(1)}" r="8" fill="#f8c800"/>
    <circle cx="${dotX.toFixed(1)}" cy="${dotY.toFixed(1)}" r="4" fill="#fff"/>
  </svg>`;
}
