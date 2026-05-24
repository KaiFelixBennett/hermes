/**
 * HUD Module
 * Renders heads-up display with flight data, attitude indicator, compass, and minimap.
 * Uses 2D Canvas API for crisp, performant rendering.
 */

export class HUD {
  /**
   * @param {HTMLCanvasElement} canvas - The canvas element for HUD rendering
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = null;
    this.initialized = false;
  }

  /**
   * Initialize the HUD context
   */
  init() {
    if (this.initialized) return;
    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.resize();
      this.initialized = true;
      window.addEventListener('resize', () => this.resize());
    }
  }

  /**
   * Resize the canvas to window dimensions
   */
  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Clear the HUD canvas
   */
  clear() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw the complete HUD overlay
   * @param {FlightState} state - Current flight state
   */
  draw(state) {
    if (!this.ctx) {
      this.init();
      if (!this.ctx) return;
    }
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background bars
    this._drawBackgroundBars(ctx, w, h);

    // Left panel - Flight data
    this._drawFlightData(ctx, w, h, state);

    // Right panel - Engine
    this._drawEngineData(ctx, w, h, state);

    // Center - Attitude indicator
    this._drawAttitudeIndicator(ctx, w, h, state);

    // Top - Compass
    this._drawCompass(ctx, w, h, state);

    // Bottom - Minimap
    this._drawMinimap(ctx, w, h, state);

    // Stall warning
    if (state.isStalling) {
      this._drawStallWarning(ctx, w, h, state);
    }

    // Controls help
    this._drawControlsHelp(ctx, w, h);
  }

  /**
   * @private
   * Draw background bars for HUD
   */
  _drawBackgroundBars(ctx, w, h) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, w, 30);
    ctx.fillRect(0, h - 35, w, 35);
  }

  /**
   * @private
   * Draw left panel with airspeed, altitude, vertical speed
   */
  _drawFlightData(ctx, w, h, state) {
    const x = 30;

    ctx.textAlign = 'left';

    // Airspeed
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('AIRSPEED', x, 55);
    ctx.font = 'bold 36px monospace';
    ctx.fillText(`${Math.round(state.airspeed)}`, x, 95);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#88ffaa';
    ctx.fillText('KTS', x + 80, 95);

    // Altitude
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('ALTITUDE', x, 140);
    ctx.font = 'bold 36px monospace';
    ctx.fillText(`${Math.round(state.position.y)}`, x, 180);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#88ffaa';
    ctx.fillText('FT', x + 70, 180);

    // Vertical Speed
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('V/S', x, 220);
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = state.verticalSpeed > 0 ? '#00ff88' : '#ff8800';
    ctx.fillText(`${Math.round(state.verticalSpeed)}`, x, 255);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#88ffaa';
    ctx.fillText('FPM', x + 100, 255);
  }

  /**
   * @private
   * Draw right panel with engine RPM, throttle, G-force
   */
  _drawEngineData(ctx, w, h, state) {
    const x = w - 30;

    ctx.textAlign = 'right';

    // Engine RPM
    ctx.fillStyle = '#00ccff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('ENGINE RPM', x, 55);
    ctx.font = 'bold 36px monospace';
    ctx.fillText(`${Math.round(state.engineRPM)}`, x, 95);

    // Throttle
    ctx.fillStyle = '#00ccff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('THROTTLE', x, 140);
    ctx.font = 'bold 36px monospace';
    ctx.fillText(`${Math.round(state.throttle * 100)}%`, x, 180);

    // Throttle bar
    const barX = x - 150;
    const barY = 190;
    const barW = 130;
    const barH = 12;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    const throttleColor = state.throttle > 0.8 ? '#ff4444' : state.throttle > 0.5 ? '#ffaa00' : '#00ccff';
    ctx.fillStyle = throttleColor;
    ctx.fillRect(barX, barY, barW * state.throttle, barH);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(barX, barY, barW, barH);

    // G-Force
    ctx.textAlign = 'right';
    ctx.fillStyle = '#00ccff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('G-FORCE', x, 240);
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = state.gForce > 3 || state.gForce < 0.3 ? '#ff4444' : '#00ccff';
    ctx.fillText(`${state.gForce.toFixed(1)} G`, x, 275);
  }

  /**
   * @private
   * Draw center attitude indicator (artificial horizon)
   */
  _drawAttitudeIndicator(ctx, w, h, state) {
    const cx = w / 2;
    const cy = h / 2;
    const radius = 90;

    // Background circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.translate(cx, cy);
    ctx.rotate(-state.roll);

    // Horizon offset
    const horizonOffset = cy * Math.sin(state.pitch);
    ctx.translate(0, -horizonOffset);

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, -radius, 0, 0);
    skyGrad.addColorStop(0, '#1a6bcc');
    skyGrad.addColorStop(1, '#4dabf7');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-radius * 2, -radius * 2, radius * 4, radius * 2);

    // Ground gradient
    const groundGrad = ctx.createLinearGradient(0, 0, 0, radius * 2);
    groundGrad.addColorStop(0, '#5a8a3c');
    groundGrad.addColorStop(1, '#3d5c2a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(-radius * 2, 0, radius * 4, radius * 2);

    // Horizon line
    ctx.beginPath();
    ctx.moveTo(-radius * 2, 0);
    ctx.lineTo(radius * 2, 0);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Roll indicator arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Roll marks
    for (let angle = -60; angle <= 60; angle += 10) {
      const rad = angle * Math.PI / 180;
      const inner = angle % 30 === 0 ? radius - 15 : radius - 8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.sin(rad) * inner, cy - Math.cos(rad) * inner);
      ctx.lineTo(cx + Math.sin(rad) * radius, cy - Math.cos(rad) * radius);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = angle % 30 === 0 ? 2 : 1;
      ctx.stroke();
    }

    // Fixed wing reference
    ctx.beginPath();
    ctx.moveTo(cx - 50, cy);
    ctx.lineTo(cx - 15, cy);
    ctx.lineTo(cx - 10, cy + 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 50, cy);
    ctx.lineTo(cx + 15, cy);
    ctx.lineTo(cx + 10, cy + 8);
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffff00';
    ctx.fill();

    // Pitch ladder
    for (let p = -20; p <= 20; p += 10) {
      if (p === 0) continue;
      const y = cy - p * 1.2;
      const w2 = p % 20 === 0 ? 25 : 15;
      ctx.beginPath();
      ctx.moveTo(cx - w2, y);
      ctx.lineTo(cx + w2, y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.abs(p).toString(), cx - w2 - 3, y + 4);
    }
  }

  /**
   * @private
   * Draw compass strip at top of screen
   */
  _drawCompass(ctx, w, h, state) {
    const cx = w / 2;
    const compassY = 50;
    const compassW = 300;
    const compassX = cx - compassW / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(compassX, compassY - 18, compassW, 36);
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.strokeRect(compassX, compassY - 18, compassW, 36);

    ctx.textAlign = 'center';
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#00ff88';
    const headingDeg = ((state.heading * 180 / Math.PI) % 360 + 360) % 360;
    ctx.fillText(`${Math.round(headingDeg)}°`, cx, compassY + 5);

    // Heading bug
    ctx.beginPath();
    ctx.moveTo(cx, compassY - 18);
    ctx.lineTo(cx, compassY - 10);
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * @private
   * Draw minimap in bottom-right corner
   */
  _drawMinimap(ctx, w, h, state) {
    const mmSize = 120;
    const mmX = w - mmSize - 20;
    const mmY = h - mmSize - 50;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(mmX, mmY, mmSize, mmSize);
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.strokeRect(mmX, mmY, mmSize, mmSize);

    // Aircraft on minimap
    const mmCX = mmX + mmSize / 2;
    const mmCY = mmY + mmSize / 2;
    ctx.save();
    ctx.translate(mmCX, mmCY);
    ctx.rotate(-state.heading + Math.PI);
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-5, 5);
    ctx.lineTo(0, 2);
    ctx.lineTo(5, 5);
    ctx.closePath();
    ctx.fillStyle = '#00ff88';
    ctx.fill();
    ctx.restore();
  }

  /**
   * @private
   * Draw blinking stall warning
   */
  _drawStallWarning(ctx, w, h, state) {
    const cx = w / 2;
    const cy = h / 2;
    ctx.fillStyle = `rgba(255, 0, 0, ${0.5 + Math.sin(Date.now() * 0.01) * 0.3})`;
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('\u26A0 STALL \u26A0', cx, cy + 160);
  }

  /**
   * @private
   * Draw controls help text at bottom
   */
  _drawControlsHelp(ctx, w, h) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px monospace';
    ctx.fillText(
      'W/S: Pitch  |  A/D: Roll  |  Q/E: Yaw  |  Shift/Ctrl: Throttle  |  Click: Capture Mouse',
      w / 2,
      h - 12
    );
  }
}