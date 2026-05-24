// ============================================================
// HUD Manager Module
// ============================================================

export class HUDManager {
  constructor() {
    this.elements = {};
  }

  init() {
    this.elements = {
      speedBar: document.getElementById('speed-bar'),
      speedValue: document.getElementById('speed-value'),
      altBar: document.getElementById('alt-bar'),
      altValue: document.getElementById('alt-value'),
      headingValue: document.getElementById('heading-value'),
      throttleBar: document.getElementById('throttle-bar'),
      throttleValue: document.getElementById('throttle-value'),
      vsfBar: document.getElementById('vsf-bar'),
      vsfValue: document.getElementById('vsf-value'),
      gearStatus: document.getElementById('gear-status'),
      trimDisplay: document.getElementById('trim-display'),
      altitudeWarning: document.getElementById('altitude-warning'),
      keyHints: document.getElementById('key-hints'),
      horizonCanvas: document.getElementById('horizon-canvas'),
      minimapCanvas: document.getElementById('minimap-canvas'),
    };

    // Init horizon canvas
    if (this.elements.horizonCanvas) {
      this.elements.horizonCanvas.width = 200;
      this.elements.horizonCanvas.height = 200;
    }

    // Init minimap canvas
    if (this.elements.minimapCanvas) {
      this.elements.minimapCanvas.width = 150;
      this.elements.minimapCanvas.height = 150;
    }

    // Show key hints briefly
    if (this.elements.keyHints) {
      this.elements.keyHints.style.opacity = '0.7';
      setTimeout(() => { if (this.elements.keyHints) this.elements.keyHints.style.opacity = '0.3'; }, 5000);
    }
  }

  update(state) {
    const e = this.elements;
    if (!e.speedBar) return;

    // Speed
    const speedPercent = (state.airspeed / 300) * 100;
    e.speedBar.style.height = `${speedPercent}%`;
    if (e.speedValue) e.speedValue.textContent = Math.round(state.airspeed);

    // Altitude
    const altPercent = Math.min(100, (state.position.y / 1000) * 100);
    e.altBar.style.height = `${altPercent}%`;
    if (e.altValue) e.altValue.textContent = Math.round(state.position.y * 3.281);

    // Heading
    if (e.headingValue) {
      const deg = Math.round(((state.heading * 180 / Math.PI) % 360 + 360) % 360);
      e.headingValue.textContent = String(deg).padStart(3, '0');
    }

    // Throttle
    if (e.throttleBar) e.throttleBar.style.width = `${state.throttle * 100}%`;
    if (e.throttleValue) e.throttleValue.textContent = Math.round(state.throttle * 100);

    // V/S
    const vsfPercent = Math.min(100, Math.abs(state.verticalSpeed) / 500 * 100);
    const vsfDir = state.verticalSpeed >= 0 ? 'up' : 'down';
    if (e.vsfBar) {
      e.vsfBar.style.height = `${vsfPercent}%`;
      e.vsfBar.style.top = vsfDir === 'down' ? '50%' : `${50 - vsfPercent * 5}%`;
      e.vsfBar.style.left = vsfDir === 'down' ? '50%' : '50%';
      e.vsfBar.style.right = vsfDir === 'down' ? '50%' : 'auto';
    }
    if (e.vsfValue) e.vsfValue.textContent = Math.round(state.verticalSpeed);

    // Gear status
    if (e.gearStatus) {
      e.gearStatus.textContent = state.position.y > 10 ? 'GEAR UP' : 'GEAR DOWN';
      e.gearStatus.style.color = state.position.y > 10 ? '#34d399' : '#fbbf24';
    }

    // Trim
    if (e.trimDisplay) e.trimDisplay.textContent = `TRIM: ${state.pitch.toFixed(1)}`;

    // Altitude warning
    if (e.altitudeWarning) {
      e.altitudeWarning.style.display = state.position.y < 30 ? 'block' : 'none';
    }

    // Artificial horizon
    this.drawHorizon(state);

    // Minimap
    this.drawMinimap(state);
  }

  drawHorizon(state) {
    const canvas = this.elements.horizonCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-state.roll);

    // Sky
    ctx.fillStyle = '#1a3a5c';
    ctx.fillRect(-cx, -cy, w, h / 2 + state.pitch * 20);

    // Ground
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(-cx, -cy + state.pitch * 20, w, h / 2);

    // Horizon line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-cx, state.pitch * 20);
    ctx.lineTo(cx, state.pitch * 20);
    ctx.stroke();

    // Pitch lines
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    for (let p = -30; p <= 30; p += 10) {
      if (p === 0) continue;
      const y = state.pitch * 20 - p * 20;
      const len = p % 20 === 0 ? 30 : 15;
      ctx.beginPath();
      ctx.moveTo(-len, y);
      ctx.lineTo(len, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawMinimap(state) {
    const canvas = this.elements.minimapCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(20, 30, 50, 0.8)';
    ctx.fillRect(0, 0, w, h);

    const scale = 0.02;
    const cx = w / 2, cy = h / 2;
    const px = state.position.x;
    const pz = state.position.z;

    // Runway
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 560 * scale);
    ctx.lineTo(cx, cy - 560 * scale);
    ctx.stroke();

    // Airplane
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-state.heading);
    ctx.fillStyle = '#4a9eff';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(-3, 3);
    ctx.lineTo(3, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Border
    ctx.strokeStyle = 'rgba(74, 158, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);
  }

  setPauseVisible(visible) {
    const menu = document.getElementById('pause-menu');
    if (menu) menu.style.display = visible ? 'flex' : 'none';
  }

  setSettingsVisible(visible) {
    const panel = document.getElementById('settings-panel');
    if (panel) panel.style.display = visible ? 'block' : 'none';
  }

  showIntro(show) {
    const intro = document.getElementById('intro-screen');
    if (intro) intro.style.display = show ? 'flex' : 'none';
  }

  showLoading(show) {
    const loading = document.getElementById('loading-screen');
    if (loading) loading.style.display = show ? 'flex' : 'none';
  }

  showHUD(show) {
    const hud = document.getElementById('hud');
    if (hud) {
      hud.style.display = show ? 'flex' : 'none';
      if (show) hud.classList.add('visible');
    }
  }
}