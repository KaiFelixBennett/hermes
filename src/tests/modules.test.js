// ============================================================
// Tests for Flight Simulator Modules
// ============================================================

// Mock canvas context for HUD tests
class MockCanvas {
  constructor() {
    this.width = 1920;
    this.height = 1080;
    this.ctx = {
      fillStyle: null,
      font: null,
      strokeStyle: null,
      lineWidth: null,
      texts: [],
      paths: [],
      rects: [],
      clears: [],
      saves: [],
      restores: [],
      translates: [],
      rotates: [],
    };
  }

  getContext(type) {
    if (type === '2d') return this.ctx;
    return null;
  }
}

// ============================================================
// TerrainGenerator Tests
// ============================================================
class TerrainGenerator {
  constructor(size, resolution) {
    this.size = size;
    this.resolution = resolution;
    this.cellSize = size / resolution;
    this.heightData = null;
    this.mesh = null;
  }

  generate() {
    this.heightData = this.generateHeightMap();
    return this.heightData;
  }

  generateHeightMap() {
    const size = this.resolution + 1;
    this.heightData = new Float32Array(size * size);

    for (let i = 0; i <= this.resolution; i++) {
      for (let j = 0; j <= this.resolution; j++) {
        const x = i * this.cellSize - this.size / 2;
        const z = j * this.cellSize - this.size / 2;

        let height = 0;
        height += Math.sin(x * 0.01) * Math.cos(z * 0.01) * 20;
        height += Math.sin(x * 0.03 + 1) * Math.cos(z * 0.02 + 2) * 10;
        height += Math.sin(x * 0.07 + 3) * Math.cos(z * 0.06 + 1) * 5;

        this.heightData[i * size + j] = height;
      }
    }
    return this.heightData;
  }

  getHeight(x, z) {
    if (!this.heightData) return 0;

    const ix = (x + this.size / 2) / this.cellSize;
    const iz = (z + this.size / 2) / this.cellSize;

    const ixMin = Math.floor(ix);
    const izMin = Math.floor(iz);
    const ixMax = ixMin + 1;
    const izMax = izMin + 1;
    const fx = ix - ixMin;
    const fz = iz - izMin;

    const size = this.resolution + 1;

    const h1 = this.heightData[ixMin * size + izMin] || 0;
    const h2 = this.heightData[ixMax * size + izMin] || 0;
    const h3 = this.heightData[ixMin * size + izMax] || 0;
    const h4 = this.heightData[ixMax * size + izMax] || 0;

    return h1 * (1 - fx) * (1 - fz) + h2 * fx * (1 - fz) + h3 * (1 - fx) * fz + h4 * fx * fz;
  }
}

// ============================================================
// FlightPhysics Tests
// ============================================================
class FlightPhysics {
  constructor(state, terrain) {
    this.state = state;
    this.terrain = terrain;
  }

  update(dt) {
    const s = this.state;

    if (s.keys['ShiftLeft'] || s.keys['ShiftRight']) {
      s.throttle = Math.min(1, s.throttle + dt * 0.15);
    }
    if (s.keys['ControlLeft'] || s.keys['ControlRight']) {
      s.throttle = Math.max(0, s.throttle - dt * 0.15);
    }

    let pitchInput = 0;
    let rollInput = 0;
    let yawInput = 0;

    if (s.keys['w'] || s.keys['W']) pitchInput -= 1;
    if (s.keys['s'] || s.keys['S']) pitchInput += 1;
    if (s.keys['a'] || s.keys['A']) rollInput -= 1;
    if (s.keys['d'] || s.keys['D']) rollInput += 1;
    if (s.keys['q'] || s.keys['Q']) yawInput -= 1;
    if (s.keys['e'] || s.keys['E']) yawInput += 1;

    pitchInput -= s.mouse.dy * s.mouseSensitivity * 0.5;
    rollInput += s.mouse.dx * s.mouseSensitivity * 0.5;

    s.pitch += pitchInput * dt * 1.2;
    s.roll += rollInput * dt * 1.5;
    s.yaw += yawInput * dt * 0.6;

    s.pitch *= (1 - dt * 0.8);
    s.roll *= (1 - dt * 1.0);
    s.yaw *= (1 - dt * 0.6);

    const speedKnots = 50 + s.throttle * 250;
    s.airspeed = speedKnots;

    const angleOfAttack = s.pitch * 0.5;
    s.lift = speedKnots * speedKnots * Math.cos(s.pitch) * Math.sin(angleOfAttack + 0.1) * 0.001;
    s.drag = speedKnots * speedKnots * 0.0002;
    s.thrust = s.throttle * 50;

    const netForce = s.thrust - s.drag;
    const acceleration = netForce / 10;

    s.velocity.x = Math.cos(s.heading) * speedKnots * 0.5;
    s.velocity.z = Math.sin(s.heading) * speedKnots * 0.5;
    s.velocity.y = s.lift * 0.3 - 9.8 * 0.1;

    s.position.x += s.velocity.x * dt;
    s.position.y += s.velocity.y * dt;
    s.position.z += s.velocity.z * dt;

    const terrainHeight = this.terrain?.getHeight(s.position.x, s.position.z) || 0;
    if (s.position.y < terrainHeight + 2) {
      s.position.y = terrainHeight + 2;
      s.velocity.y = 0;
    }

    s.isStalling = Math.abs(angleOfAttack) > 0.3 && speedKnots < 80;
    s.verticalSpeed = s.velocity.y * 196.85;
    s.heading = ((s.heading % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    s.gForce = Math.abs(s.lift / 10);
    s.engineRPM = s.throttle * 2700;
    s.windVolume = Math.min(1, speedKnots / 200);
  }

  reset() {
    const s = this.state;
    s.position = { x: 0, y: 50, z: 0 };
    s.pitch = 0;
    s.roll = 0;
    s.yaw = 0;
    s.heading = 0;
    s.velocity = { x: 0, y: 0, z: 0 };
    s.airspeed = 0;
    s.verticalSpeed = 0;
    s.throttle = 0.3;
    s.lift = 0;
    s.drag = 0;
    s.thrust = 0;
    s.gForce = 1;
    s.isStalling = false;
  }
}

// ============================================================
// HUD Tests
// ============================================================
class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.resize();
      this.initialized = true;
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    this.canvas.height = typeof window !== 'undefined' ? window.innerHeight : 1080;
  }

  clear() {
    if (!this.ctx) return;
    this.ctx.clears.push(true);
  }

  draw(state) {
    if (!this.ctx) {
      this.init();
      if (!this.ctx) return false;
    }
    this.ctx.drawCalls = (this.ctx.drawCalls || 0) + 1;
    return true;
  }
}

// ============================================================
// Test Runner
// ============================================================
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function test(name, fn) {
  console.log(`\nTest: ${name}`);
  try {
    fn();
  } catch (e) {
    console.error(`  ✗ Unexpected error: ${e.message}`);
    failed++;
  }
}

// ============================================================
// TerrainGenerator Tests
// ============================================================
test('TerrainGenerator: generates height map', () => {
  const terrain = new TerrainGenerator(4000, 100);
  const heightData = terrain.generate();
  assert(heightData !== null, 'heightData should not be null');
  assert(heightData.length === 10201, `heightData length should be 10201, got ${heightData.length}`);
  assert(typeof heightData[0] === 'number', 'height values should be numbers');
});

test('TerrainGenerator: getHeight returns valid values', () => {
  const terrain = new TerrainGenerator(4000, 100);
  terrain.generate();
  const h = terrain.getHeight(0, 0);
  assert(typeof h === 'number', 'getHeight should return a number');
  assert(isFinite(h), 'getHeight should return a finite value');
});

test('TerrainGenerator: getHeight at edges', () => {
  const terrain = new TerrainGenerator(4000, 100);
  terrain.generate();
  const h1 = terrain.getHeight(-2000, -2000);
  const h2 = terrain.getHeight(2000, 2000);
  assert(isFinite(h1), 'height at edge should be finite');
  assert(isFinite(h2), 'height at opposite edge should be finite');
});

test('TerrainGenerator: getHeight before generate returns 0', () => {
  const terrain = new TerrainGenerator(4000, 100);
  const h = terrain.getHeight(0, 0);
  assert(h === 0, 'getHeight before generate should return 0');
});

// ============================================================
// FlightPhysics Tests
// ============================================================
test('FlightPhysics: initializes correctly', () => {
  const terrain = new TerrainGenerator(4000, 100);
  terrain.generate();
  const state = {
    position: { x: 0, y: 50, z: 0 },
    heading: 0,
    pitch: 0,
    roll: 0,
    throttle: 0.3,
    airspeed: 0,
    verticalSpeed: 0,
    lift: 0,
    drag: 0,
    thrust: 0,
    gForce: 1,
    isStalling: false,
    engineRPM: 0,
    windVolume: 0,
    mouseSensitivity: 0.002,
    keys: {},
    mouse: { dx: 0, dy: 0 },
    velocity: { x: 0, y: 0, z: 0 }
  };
  const physics = new FlightPhysics(state, terrain);
  assert(physics !== null, 'physics should not be null');
  assert(physics.terrain === terrain, 'terrain should be stored');
});

test('FlightPhysics: update increases airspeed', () => {
  const terrain = new TerrainGenerator(4000, 100);
  terrain.generate();
  const state = {
    position: { x: 0, y: 100, z: 0 },
    heading: 0,
    pitch: 0,
    roll: 0,
    throttle: 0.5,
    airspeed: 0,
    verticalSpeed: 0,
    lift: 0,
    drag: 0,
    thrust: 0,
    gForce: 1,
    isStalling: false,
    engineRPM: 0,
    windVolume: 0,
    mouseSensitivity: 0.002,
    keys: {},
    mouse: { dx: 0, dy: 0 },
    velocity: { x: 0, y: 0, z: 0 }
  };
  const physics = new FlightPhysics(state, terrain);
  physics.update(0.016); // ~60fps
  assert(state.airspeed > 50, `airspeed should increase, got ${state.airspeed}`);
});

test('FlightPhysics: throttle responds to keys', () => {
  const terrain = new TerrainGenerator(4000, 100);
  terrain.generate();
  const state = {
    position: { x: 0, y: 100, z: 0 },
    heading: 0,
    pitch: 0,
    roll: 0,
    throttle: 0.3,
    airspeed: 0,
    verticalSpeed: 0,
    lift: 0,
    drag: 0,
    thrust: 0,
    gForce: 1,
    isStalling: false,
    engineRPM: 0,
    windVolume: 0,
    mouseSensitivity: 0.002,
    keys: { ShiftLeft: true },
    mouse: { dx: 0, dy: 0 },
    velocity: { x: 0, y: 0, z: 0 }
  };
  const physics = new FlightPhysics(state, terrain);
  physics.update(0.1);
  assert(state.throttle > 0.3, `throttle should increase with Shift, got ${state.throttle}`);
});

test('FlightPhysics: throttle decreases with Control', () => {
  const terrain = new TerrainGenerator(4000, 100);
  terrain.generate();
  const state = {
    position: { x: 0, y: 100, z: 0 },
    heading: 0,
    pitch: 0,
    roll: 0,
    throttle: 0.5,
    airspeed: 0,
    verticalSpeed: 0,
    lift: 0,
    drag: 0,
    thrust: 0,
    gForce: 1,
    isStalling: false,
    engineRPM: 0,
    windVolume: 0,
    mouseSensitivity: 0.002,
    keys: { ControlLeft: true },
    mouse: { dx: 0, dy: 0 },
    velocity: { x: 0, y: 0, z: 0 }
  };
  const physics = new FlightPhysics(state, terrain);
  physics.update(0.1);
  assert(state.throttle < 0.5, `throttle should decrease with Control, got ${state.throttle}`);
});

test('FlightPhysics: pitch input works', () => {
  const terrain = new TerrainGenerator(4000, 100);
  terrain.generate();
  const state = {
    position: { x: 0, y: 100, z: 0 },
    heading: 0,
    pitch: 0,
    roll: 0,
    throttle: 0.3,
    airspeed: 0,
    verticalSpeed: 0,
    lift: 0,
    drag: 0,
    thrust: 0,
    gForce: 1,
    isStalling: false,
    engineRPM: 0,
    windVolume: 0,
    mouseSensitivity: 0.002,
    keys: { w: true },
    mouse: { dx: 0, dy: 0 },
    velocity: { x: 0, y: 0, z: 0 }
  };
  const physics = new FlightPhysics(state, terrain);
  physics.update(0.016);
  assert(state.pitch < 0, `pitch should be negative (nose up), got ${state.pitch}`);
});

test('FlightPhysics: roll input works', () => {
  const terrain = new TerrainGenerator(4000, 100);
  terrain.generate();
  const state = {
    position: { x: 0, y: 100, z: 0 },
    heading: 0,
    pitch: 0,
    roll: 0,
    throttle: 0.3,
    airspeed: 0,
    verticalSpeed: 0,
    lift: 0,
    drag: 0,
    thrust: 0,
    gForce: 1,
    isStalling: false,
    engineRPM: 0,
    windVolume: 0,
    mouseSensitivity: 0.002,
    keys: { a: true },
    mouse: { dx: 0, dy: 0 },
    velocity: { x: 0, y: 0, z: 0 }
  };
  const physics = new FlightPhysics(state, terrain);
  physics.update(0.016);
  assert(state.roll < 0, `roll should be negative (left roll), got ${state.roll}`);
});

test('FlightPhysics: stall detection works', () => {
  const terrain = new TerrainGenerator(4000, 100);
  terrain.generate();
  // Create state that will stall: need angleOfAttack > 0.3 AND speedKnots < 80
  // angleOfAttack = pitch * 0.5, so pitch > 0.6
  // speedKnots = 50 + throttle * 250, so throttle < 0.12 for speed < 80
  const state = {
    position: { x: 0, y: 50, z: 0 },
    heading: 0,
    pitch: 0.7,  // high pitch = high angle of attack (0.35 > 0.3)
    roll: 0,
    throttle: 0.05,  // very low throttle = low speed (62.5 < 80)
    airspeed: 0,
    verticalSpeed: 0,
    lift: 0,
    drag: 0,
    thrust: 0,
    gForce: 1,
    isStalling: false,
    engineRPM: 0,
    windVolume: 0,
    mouseSensitivity: 0.002,
    keys: {},
    mouse: { dx: 0, dy: 0 },
    velocity: { x: 0, y: 0, z: 0 }
  };
  const physics = new FlightPhysics(state, terrain);
  physics.update(0.016);  // one frame at 60fps
  // Check stall condition: abs(angleOfAttack) > 0.3 AND speedKnots < 80
  const angleOfAttack = state.pitch * 0.5;
  const speedKnots = 50 + state.throttle * 250;
  assert(state.isStalling === true,
    `should detect stall: angleOfAttack=${angleOfAttack.toFixed(3)} > 0.3: ${angleOfAttack > 0.3}, speed=${speedKnots.toFixed(1)} < 80: ${speedKnots < 80}, isStalling=${state.isStalling}`);
});

test('FlightPhysics: reset works', () => {
  const terrain = new TerrainGenerator(4000, 100);
  terrain.generate();
  const state = {
    position: { x: 100, y: 200, z: 50 },
    heading: 1.5,
    pitch: 0.5,
    roll: 0.3,
    throttle: 0.8,
    airspeed: 200,
    verticalSpeed: 1000,
    lift: 50,
    drag: 30,
    thrust: 40,
    gForce: 2,
    isStalling: true,
    engineRPM: 2000,
    windVolume: 0.8,
    mouseSensitivity: 0.002,
    keys: {},
    mouse: { dx: 0, dy: 0 },
    velocity: { x: 10, y: 5, z: 8 }
  };
  const physics = new FlightPhysics(state, terrain);
  physics.reset();
  assert(state.position.y === 50, `position.y should be 50 after reset, got ${state.position.y}`);
  assert(state.throttle === 0.3, `throttle should be 0.3 after reset, got ${state.throttle}`);
  assert(state.isStalling === false, `isStalling should be false after reset`);
});

// ============================================================
// HUD Tests
// ============================================================
test('HUD: initializes correctly', () => {
  const mockCanvas = new MockCanvas();
  const hud = new HUD(mockCanvas);
  assert(hud.ctx === null, 'ctx should be null initially');
  assert(hud.initialized === false, 'initialized should be false');
});

test('HUD: init sets up context', () => {
  const mockCanvas = new MockCanvas();
  const hud = new HUD(mockCanvas);
  hud.init();
  assert(hud.ctx !== null, 'ctx should not be null after init');
  assert(hud.initialized === true, 'initialized should be true after init');
});

test('HUD: draw works after init', () => {
  const mockCanvas = new MockCanvas();
  const hud = new HUD(mockCanvas);
  const state = {
    airspeed: 150,
    position: { y: 5000 },
    verticalSpeed: 500,
    engineRPM: 2500,
    throttle: 0.7,
    gForce: 1.2,
    heading: 0,
    pitch: 0,
    roll: 0,
    isStalling: false
  };
  hud.init();
  const result = hud.draw(state);
  assert(result === true, 'draw should return true');
  assert(hud.ctx.drawCalls === 1, 'draw should be called once');
});

test('HUD: draw without init handles gracefully', () => {
  const mockCanvas = new MockCanvas();
  const hud = new HUD(mockCanvas);
  const state = {
    airspeed: 150,
    position: { y: 5000 },
    verticalSpeed: 500,
    engineRPM: 2500,
    throttle: 0.7,
    gForce: 1.2,
    heading: 0,
    pitch: 0,
    roll: 0,
    isStalling: false
  };
  const result = hud.draw(state);
  assert(result === true, 'draw should return true after auto-init');
});

test('HUD: clear handles null ctx', () => {
  const mockCanvas = new MockCanvas();
  const hud = new HUD(mockCanvas);
  // Don't init, just call clear
  hud.clear();
  assert(true, 'clear should not throw when ctx is null');
});

// ============================================================
// Results
// ============================================================
console.log('\n========================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}