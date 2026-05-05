/**
 * InputHandler – wraps the Web Gamepad API and keyboard.
 * All game code reads through this single interface so that gamepad and
 * keyboard are interchangeable.
 */
class InputHandler {
  constructor() {
    this.gamepadIndex = null;
    this._buttons = {};       // current frame
    this._prevButtons = {};   // previous frame
    this._buttonValues = {};  // analog 0-1 values
    this._axes = [0, 0, 0, 0];

    // Keyboard raw state
    this._keys = {};
    this._prevKeys = {};

    // Performance stats
    this.totalPresses = 0;
    this.pressStartTime = Date.now();

    this._setupEvents();
  }

  _setupEvents() {
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
      this._updateStatusUI(`✅ ${e.gamepad.id.slice(0, 40)}`);
      document.getElementById('gamepad-status').classList.add('connected');
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
        this._updateStatusUI('❌ No controller – use keyboard (↑↓←→ / Z / X)');
        document.getElementById('gamepad-status').classList.remove('connected');
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!this._keys[e.code]) this.totalPresses++;
      this._keys[e.code] = true;
      e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
      this._keys[e.code] = false;
    });
  }

  _updateStatusUI(text) {
    const el = document.getElementById('gamepad-status');
    if (el) el.textContent = text;
  }

  /** Must be called every frame before reading input. */
  update() {
    this._prevButtons = { ...this._buttons };
    this._prevKeys = { ...this._keys };
    this._buttons = {};
    this._buttonValues = {};

    if (this.gamepadIndex !== null) {
      const gp = (navigator.getGamepads || navigator.webkitGetGamepads
        ? navigator.getGamepads()
        : [])[this.gamepadIndex];

      if (gp) {
        gp.buttons.forEach((btn, i) => {
          const val = typeof btn === 'object' ? btn.value : btn;
          const pressed = typeof btn === 'object' ? btn.pressed : btn > 0.5;
          this._buttons[i] = pressed || val > 0.5;
          this._buttonValues[i] = val;
          if (pressed && !this._prevButtons[i]) this.totalPresses++;
        });
        this._axes = Array.from(gp.axes);
      }
    }
  }

  // ─── Derived queries ────────────────────────────────────────────────────

  /** Is button currently held? */
  isDown(btn) {
    return !!(this._buttons[btn] || this._keyForBtn(btn, this._keys));
  }

  /** Was button just pressed this frame? */
  isPressed(btn) {
    const gpNow = !!this._buttons[btn];
    const gpPrev = !!this._prevButtons[btn];
    const kbNow = !!this._keyForBtn(btn, this._keys);
    const kbPrev = !!this._keyForBtn(btn, this._prevKeys);
    return (gpNow && !gpPrev) || (kbNow && !kbPrev);
  }

  _keyForBtn(btn, keyState) {
    switch (btn) {
      case GP_BTN.DPAD_LEFT:  return keyState['ArrowLeft']  || keyState['KeyA'];
      case GP_BTN.DPAD_RIGHT: return keyState['ArrowRight'] || keyState['KeyD'];
      case GP_BTN.DPAD_UP:    return keyState['ArrowUp']    || keyState['KeyW'];
      case GP_BTN.DPAD_DOWN:  return keyState['ArrowDown']  || keyState['KeyS'];
      case GP_BTN.A:          return keyState['KeyZ']        || keyState['Space'];
      case GP_BTN.B:          return keyState['KeyX']        || keyState['ShiftLeft'];
      case GP_BTN.RB:         return keyState['ShiftRight'];
      case GP_BTN.START:      return keyState['Enter']       || keyState['Escape'];
      default: return false;
    }
  }

  /** Horizontal movement [-1 … 1] (analog or digital). */
  getMoveX() {
    const dpad = (this.isDown(GP_BTN.DPAD_RIGHT) ? 1 : 0) -
                 (this.isDown(GP_BTN.DPAD_LEFT)  ? 1 : 0);
    if (dpad !== 0) return dpad;
    const ax = this._axes[0] || 0;
    return Math.abs(ax) > DEADZONE ? ax : 0;
  }

  /** True when run button is held. */
  isRunning() {
    return this.isDown(GP_BTN.B) || this.isDown(GP_BTN.RB) || this.isDown(GP_BTN.RT);
  }

  /** True on the frame the jump button was first pressed. */
  jumpPressed() {
    return this.isPressed(GP_BTN.A) || this.isPressed(GP_BTN.DPAD_UP);
  }

  /** True while jump button is held (for variable-height jump). */
  jumpHeld() {
    return this.isDown(GP_BTN.A);
  }

  /** True on the frame Start/Escape was pressed. */
  pausePressed() {
    return this.isPressed(GP_BTN.START);
  }

  /** True on the frame any button was pressed (used for menu). */
  anyPressed() {
    for (const k in this._buttons) {
      if (this._buttons[k] && !this._prevButtons[k]) return true;
    }
    for (const k in this._keys) {
      if (this._keys[k] && !this._prevKeys[k]) return true;
    }
    return false;
  }

  /** Raw gamepad object or null. */
  getRawGamepad() {
    if (this.gamepadIndex === null) return null;
    return (navigator.getGamepads())[this.gamepadIndex] || null;
  }

  /** Trigger value for L2 [0-1]. */
  getLTValue() {
    return this._buttonValues[GP_BTN.LT] || 0;
  }

  /** Trigger value for R2 [0-1]. */
  getRTValue() {
    return this._buttonValues[GP_BTN.RT] || 0;
  }

  /** Presses per second since construction. */
  getPressesPerSecond() {
    const elapsed = (Date.now() - this.pressStartTime) / 1000;
    return elapsed > 0 ? (this.totalPresses / elapsed).toFixed(1) : 0;
  }
}
