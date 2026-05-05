/** ──────────────────────────────────────────────────────────────────────────
 *  entities.js  –  Mario, Goomba, Coin, MovingPlatform, Mushroom, Star, Flag
 * ──────────────────────────────────────────────────────────────────────────── */

// ─── Mario ───────────────────────────────────────────────────────────────────
class Mario {
  constructor(x, y) {
    this.type     = ENTITY.MARIO;
    this.x        = x;
    this.y        = y;
    this.vx       = 0;
    this.vy       = 0;
    this.width    = 26;
    this.height   = 30;
    this.facing   = 1;      // 1 = right, -1 = left
    this.onGround = false;

    // State
    this.size     = 'small';  // 'small' | 'big' | 'fire'
    this.dead     = false;
    this.dying    = false;    // death animation in progress
    this.invincible      = false;
    this.invincibleTimer = 0;
    this.starPower       = false;
    this.starTimer       = 0;

    // Jump bookkeeping
    this._jumpHoldFrames = 0;

    // Animation
    this.animFrame = 0;
    this.animTimer = 0;

    // Scoring
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.stompCombo = 0;   // consecutive stomps in one jump
  }

  get hitbox() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }

  update(input) {
    // ── Death animation ──────────────────────────────────────────────────────
    if (this.dying) {
      this.vy += GRAVITY;
      this.y  += this.vy;
      return;
    }

    // ── Star power countdown ─────────────────────────────────────────────────
    if (this.starPower) {
      this.starTimer--;
      if (this.starTimer <= 0) this.starPower = false;
    }

    // ── Invincibility frames ─────────────────────────────────────────────────
    if (this.invincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) this.invincible = false;
    }

    // ── Horizontal movement ──────────────────────────────────────────────────
    const moveX  = input.getMoveX();
    const run    = input.isRunning();
    const maxSpd = run ? MARIO_RUN_SPEED : MARIO_WALK_SPEED;

    if (Math.abs(moveX) > 0.05) {
      this.facing = moveX > 0 ? 1 : -1;
      const accel = run ? 0.55 : 0.38;
      this.vx += moveX * accel;
      // Clamp to max speed
      this.vx = Math.sign(this.vx) * Math.min(Math.abs(this.vx), maxSpd);
    } else {
      // Friction
      this.vx *= this.onGround ? FRICTION_GROUND : FRICTION_AIR;
      if (Math.abs(this.vx) < 0.08) this.vx = 0;
    }

    // ── Jump ─────────────────────────────────────────────────────────────────
    if (input.jumpPressed() && this.onGround) {
      const boost = run ? RUN_JUMP_BOOST : 0;
      this.vy = MARIO_JUMP_FORCE + boost;
      this.onGround = false;
      this._jumpHoldFrames = 0;
    }

    // Variable jump height – hold button to rise higher
    if (input.jumpHeld() && this.vy < 0) {
      this._jumpHoldFrames++;
      if (this._jumpHoldFrames < 14) {
        this.vy -= 0.28;
      }
    } else if (!input.jumpHeld()) {
      this._jumpHoldFrames = 14; // cut jump short
    }

    // ── Gravity ──────────────────────────────────────────────────────────────
    this.vy = Math.min(this.vy + GRAVITY, MAX_FALL_SPEED);

    // ── Animation ────────────────────────────────────────────────────────────
    this._updateAnim(run);

    // Reset combo if landing
    if (this.onGround) this.stompCombo = 0;
  }

  _updateAnim(run) {
    const speed = Math.abs(this.vx);
    if (speed > 0.1 && this.onGround) {
      const period = Math.max(2, Math.round(8 - speed));
      this.animTimer++;
      if (this.animTimer >= period) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 3;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  /** Called when stomping an enemy – short bounce. */
  stomp() {
    this.vy = -9;
    this.stompCombo++;
    this.score += 100 * Math.pow(2, Math.min(this.stompCombo - 1, 4));
  }

  /** Called when hit by an enemy. */
  hit() {
    if (this.starPower || this.invincible) return;
    if (this.size === 'big' || this.size === 'fire') {
      this.size = 'small';
      this.height = 30;
      this.invincible = true;
      this.invincibleTimer = 120;
    } else {
      this.dying = true;
      this.vy    = -14;
      this.vx    =  0;
    }
  }

  /** Grow Mario (mushroom pickup). */
  grow() {
    if (this.size === 'small') {
      this.size   = 'big';
      this.height = 58;
      this.y     -= 28; // keep feet at same position
    }
  }

  /** Apply star power. */
  applyStar() {
    this.starPower = true;
    this.starTimer = 600; // 10 s @ 60 fps
  }

  addCoin() {
    this.coins++;
    this.score += 200;
    if (this.coins >= 100) {
      this.coins -= 100;
      this.lives++;
    }
  }
}

// ─── Goomba ───────────────────────────────────────────────────────────────────
class Goomba {
  constructor(x, y) {
    this.type     = ENTITY.GOOMBA;
    this.x        = x;
    this.y        = y;
    this.width    = 28;
    this.height   = 28;
    this.vx       = -0.9;
    this.vy       = 0;
    this.onGround = false;
    this.alive    = true;
    this.stomped  = false;
    this.stompTimer = 0;
    this.animFrame  = 0;
    this.animTimer  = 0;
  }

  get hitbox() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }

  update() {
    if (this.stomped) {
      this.stompTimer++;
      if (this.stompTimer > 30) this.alive = false;
      return;
    }
    this.vy = Math.min(this.vy + GRAVITY, MAX_FALL_SPEED);
    this.animTimer++;
    if (this.animTimer >= 20) { this.animTimer = 0; this.animFrame ^= 1; }
  }

  stomp() {
    this.stomped = true;
    this.vx = 0;
    this.vy = 0;
    this.height = 14;
    this.y += 14;
  }

  /** Reverse direction when hitting a wall. */
  bounce() { this.vx *= -1; }
}

// ─── Coin (world pickup) ───────────────────────────────────────────────────────
class Coin {
  constructor(x, y) {
    this.type      = ENTITY.COIN;
    this.x         = x;
    this.y         = y;
    this.width     = 20;
    this.height    = 20;
    this.collected = false;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  get hitbox() { return { x: this.x + 4, y: this.y, width: 16, height: this.height }; }

  update() {
    this.animTimer++;
    if (this.animTimer >= 10) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 4; }
  }
}

// ─── Mushroom (power-up) ────────────────────────────────────────────────────────
class Mushroom {
  constructor(x, y) {
    this.type      = ENTITY.MUSHROOM;
    this.x         = x;
    this.y         = y;
    this.width     = 28;
    this.height    = 28;
    this.vx        = 1.2;
    this.vy        = 0;
    this.onGround  = false;
    this.collected = false;
  }

  get hitbox() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }

  update() {
    this.vy = Math.min(this.vy + GRAVITY, MAX_FALL_SPEED);
  }

  bounce() { this.vx *= -1; }
}

// ─── Star (power-up) ────────────────────────────────────────────────────────────
class StarItem {
  constructor(x, y) {
    this.type      = ENTITY.STAR;
    this.x         = x;
    this.y         = y;
    this.width     = 26;
    this.height    = 26;
    this.vx        = 1.5;
    this.vy        = -5;
    this.onGround  = false;
    this.collected = false;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  get hitbox() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }

  update() {
    this.vy = Math.min(this.vy + GRAVITY, MAX_FALL_SPEED);
    this.animTimer++;
    if (this.animTimer >= 6) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 8; }
  }

  /** Bounce on ground. */
  groundBounce() { this.vy = -7; }
}

// ─── Moving Platform ────────────────────────────────────────────────────────────
class MovingPlatform {
  constructor(x, y, moveX, moveY, range, speed) {
    this.type   = ENTITY.MOVING_PLATFORM;
    this.startX = x;
    this.startY = y;
    this.x      = x;
    this.y      = y;
    this.width  = 64;
    this.height = 14;
    this.moveX  = moveX;  // boolean: does it move horizontally?
    this.moveY  = moveY;  // boolean: does it move vertically?
    this.range  = range;
    this.speed  = speed || 1.2;
    this._t     = 0;      // oscillation parameter [0, 1]
    this._dir   = 1;
    this.dx     = 0;      // delta this frame (for carrying Mario)
    this.dy     = 0;
  }

  get hitbox() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }

  update() {
    const prevX = this.x;
    const prevY = this.y;

    this._t += this._dir * this.speed / this.range;
    if (this._t >= 1 || this._t <= 0) {
      this._dir *= -1;
      this._t = Math.max(0, Math.min(1, this._t));
    }

    const offset = Math.sin(this._t * Math.PI) * this.range;
    this.x = this.startX + (this.moveX ? offset : 0);
    this.y = this.startY + (this.moveY ? offset : 0);

    this.dx = this.x - prevX;
    this.dy = this.y - prevY;
  }
}

// ─── Goal Flag ────────────────────────────────────────────────────────────────
class FlagGoal {
  constructor(x, y) {
    this.type    = ENTITY.FLAG;
    this.x       = x;
    this.y       = y;
    this.width   = 16;
    this.height  = 192;
    this.reached = false;
  }

  get hitbox() { return { x: this.x - 8, y: this.y, width: 32, height: this.height }; }
}

// ─── Coin Burst (visual popup only) ──────────────────────────────────────────
class CoinBurst {
  constructor(x, y) {
    this.type   = ENTITY.COIN_BURST;
    this.x      = x;
    this.y      = y;
    this.vy     = -6;
    this.timer  = 40;
    this.alive  = true;
  }

  update() {
    this.vy += 0.3;
    this.y  += this.vy;
    this.timer--;
    if (this.timer <= 0) this.alive = false;
  }
}
