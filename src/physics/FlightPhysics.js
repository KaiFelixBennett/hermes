/**
 * FlightPhysics Module
 * Handles realistic flight dynamics based on Cessna-172-like physics.
 * Robust implementation with NaN protection.
 */

import * as THREE from 'three';

// Helper to protect against NaN
function safe(v, fallback = 0) {
  return isNaN(v) || isFinite(v) === false ? fallback : v;
}

function safeVector3(vec, fallback = new THREE.Vector3(0, 0, 0)) {
  if (!vec || isNaN(vec.x) || isNaN(vec.y) || isNaN(vec.z)) {
    return fallback.clone();
  }
  return vec;
}

export class FlightPhysics {
  // Aircraft constants (Cessna-172 inspired)
  static MASS = 1000; // kg
  static WING_AREA = 16.2; // m^2
  static MAX_THRUST = 5000; // N - more thrust for better takeoff
  static CL_ALPHA = 4.5; // Lift curve slope per radian
  static CD_0 = 0.03; // Zero-lift drag coefficient
  static OE = 8; // Aspect ratio
  static G = 9.81; // Gravity

  /**
   * @param {FlightState} state - The mutable state object
   * @param {TerrainGenerator} terrain - Terrain generator
   */
  constructor(state, terrain) {
    this.state = state;
    this.terrain = terrain;
    this._rollRate = 0;
    this._pitchRate = 0;
    this._yawRate = 0;

    // Ensure state is valid
    this._ensureValidState();
  }

  _ensureValidState() {
    const s = this.state;
    if (!s.position || isNaN(s.position.x)) {
      s.position = new THREE.Vector3(0, 55, 0);
    }
    if (!s.velocity || isNaN(s.velocity.x)) {
      s.velocity = new THREE.Vector3(0, 2, -80);
    }
    if (isNaN(s.throttle)) s.throttle = 0.7;
    if (isNaN(s.pitch)) s.pitch = 0.08;
    if (isNaN(s.heading)) s.heading = 0;
    if (isNaN(s.roll)) s.roll = 0;
    if (isNaN(s.airspeed)) s.airspeed = 80 * 1.94384;
    if (isNaN(s.mass) || !s.mass) s.mass = 1000;
  }

  /**
   * Update flight physics
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    const s = this.state;

    // Clamp dt to prevent instability
    dt = Math.max(0.001, Math.min(dt, 0.05));

    // 1. Update throttle
    this._updateThrottle(s);

    // 2. Get control inputs
    const inputs = this._getControlInputs(s);

    // 3. Update rotation rates from controls
    this._updateRotationRates(s, inputs, dt);

    // 4. Update orientation angles
    this._updateOrientation(s, dt);

    // 5. Calculate forces
    const acceleration = this._calculateAcceleration(s);

    // 6. Integrate velocity (Euler integration - stable)
    const newVx = s.velocity.x + acceleration.x * dt;
    const newVy = s.velocity.y + acceleration.y * dt;
    const newVz = s.velocity.z + acceleration.z * dt;

    // Protect velocity against NaN - assign only if valid
    s.velocity.x = isNaN(newVx) ? 0 : newVx;
    s.velocity.y = isNaN(newVy) ? 2 : newVy;
    s.velocity.z = isNaN(newVz) ? -50 : newVz;

    // 7. Integrate position
    const newPosx = s.position.x + s.velocity.x * dt;
    const newPosy = s.position.y + s.velocity.y * dt;
    const newPosz = s.position.z + s.velocity.z * dt;

    // Protect position against NaN
    s.position.x = isNaN(newPosx) ? 0 : newPosx;
    s.position.y = isNaN(newPosy) ? 55 : newPosy;
    s.position.z = isNaN(newPosz) ? 0 : newPosz;

    // 8. Calculate airspeed
    this._calculateAirspeed(s);

    // 9. Ground collision
    this._checkGroundCollision(s);

    // 10. Update derived params
    this._updateDerivedParams(s);

    // 11. Stall detection
    this._updateStallDetection(s);
  }

  // ----------------------------------------------------------
  // Throttle
  // ----------------------------------------------------------
  _updateThrottle(s) {
    const rate = 0.15;
    if (s.keys['ShiftLeft'] || s.keys['ShiftRight']) {
      s.throttle = Math.min(1, s.throttle + rate * 0.2);
    }
    if (s.keys['ControlLeft'] || s.keys['ControlRight']) {
      s.throttle = Math.max(0, s.throttle - rate * 0.2);
    }
  }

  // ----------------------------------------------------------
  // Control Inputs
  // ----------------------------------------------------------
  _getControlInputs(s) {
    let pitchInput = 0;
    let rollInput = 0;
    let yawInput = 0;

    // Keyboard
    if (s.keys['w'] || s.keys['W']) pitchInput -= 1;
    if (s.keys['s'] || s.keys['S']) pitchInput += 1;
    if (s.keys['a'] || s.keys['A']) rollInput -= 1;
    if (s.keys['d'] || s.keys['D']) rollInput += 1;
    if (s.keys['q'] || s.keys['Q']) yawInput -= 1;
    if (s.keys['e'] || s.keys['E']) yawInput += 1;

    // Mouse (only when pointer is locked)
    if (s.mouse && s.mouse.dy !== undefined) {
      pitchInput -= safe(s.mouse.dy, 0) * safe(s.mouseSensitivity, 0.002);
      rollInput += safe(s.mouse.dx, 0) * safe(s.mouseSensitivity, 0.002);
    }

    // Clamp inputs
    pitchInput = Math.max(-1, Math.min(1, pitchInput));
    rollInput = Math.max(-1, Math.min(1, rollInput));
    yawInput = Math.max(-1, Math.min(1, yawInput));

    return { pitchInput, rollInput, yawInput };
  }

  // ----------------------------------------------------------
  // Rotation Rates
  // ----------------------------------------------------------
  _updateRotationRates(s, inputs, dt) {
    this._rollRate = inputs.rollInput * 1.2;
    this._pitchRate = inputs.pitchInput * 0.8;
    this._yawRate = inputs.yawInput * 0.4 - inputs.rollInput * 0.05;
  }

  // ----------------------------------------------------------
  // Orientation Update
  // ----------------------------------------------------------
  _updateOrientation(s, dt) {
    s.pitch += this._pitchRate * dt;
    s.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, s.pitch));

    s.roll += this._rollRate * dt;
    s.roll *= (1 - 0.5 * dt); // Natural roll damping

    s.heading += this._yawRate * dt;
    s.heading += Math.sin(s.roll) * Math.cos(s.pitch) * 0.3 * dt;

    s.heading = ((s.heading % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  }

  // ----------------------------------------------------------
  // Acceleration Calculation (no mutation of force vectors!)
  // ----------------------------------------------------------
  _calculateAcceleration(s) {
    // Start with gravity
    let ax = 0;
    let ay = -this.G;
    let az = 0;

    // Get current velocity
    const vx = safe(s.velocity.x, 0);
    const vy = safe(s.velocity.y, 0);
    const vz = safe(s.velocity.z, -50);
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

    if (speed < 0.1) {
      return { x: ax, y: ay, z: az };
    }

    // Dynamic pressure
    const q = 0.5 * 1.225 * speed * speed;

    // --- LIFT ---
    const alpha = safe(s.pitch, 0);
    const cl = this.CL_ALPHA * alpha + 0.5;
    const liftMag = q * this.WING_AREA * cl;

    // Lift is roughly "up" in aircraft frame
    ay += (liftMag / this.MASS) * Math.cos(s.pitch) * Math.cos(s.roll);

    // --- DRAG ---
    const cd = this.CD_0 + (cl * cl) / (Math.PI * this.OE * 0.8);
    const dragMag = q * this.WING_AREA * cd;

    // Drag opposes velocity
    const dragFactor = -(dragMag / this.MASS) / speed;
    ax += vx * dragFactor;
    ay += vy * dragFactor;
    az += vz * dragFactor;

    // --- THRUST ---
    const altitudeFactor = Math.max(0.5, 1 - s.position.y / 10000);
    const thrustMag = safe(s.throttle, 0.7) * this.MAX_THRUST * altitudeFactor;

    // Thrust along aircraft nose direction
    ax += Math.sin(s.heading) * Math.cos(s.pitch) * (thrustMag / this.MASS);
    ay += Math.sin(s.pitch) * (thrustMag / this.MASS);
    az += Math.cos(s.heading) * Math.cos(s.pitch) * (thrustMag / this.MASS);

    // Protect against NaN
    ax = safe(ax, 0);
    ay = safe(ay, -this.G);
    az = safe(az, 0);

    return { x: ax, y: ay, z: az };
  }

  // ----------------------------------------------------------
  // Airspeed Calculation
  // ----------------------------------------------------------
  _calculateAirspeed(s) {
    const speed = s.velocity.length();
    s.airspeed = Math.max(0, safe(speed, 50)) * 1.94384;
  }

  // ----------------------------------------------------------
  // Ground Collision
  // ----------------------------------------------------------
  _checkGroundCollision(s) {
    const terrainHeight = this._getTerrainHeight(s.position.x, s.position.z);

    if (s.position.y < terrainHeight + 2) {
      s.position.y = terrainHeight + 2;

      if (s.velocity.y < 0) {
        s.velocity.y = Math.max(0, -s.velocity.y * 0.2);
      }

      if (s.position.y < terrainHeight + 3) {
        s.velocity.x *= 0.98;
        s.velocity.z *= 0.98;
        s.onGround = true;
      }
    } else {
      s.onGround = false;
    }
  }

  _getTerrainHeight(x, z) {
    try {
      if (this.terrain && this.terrain.getHeight) {
        const h = this.terrain.getHeight(x, z);
        return safe(h, 0);
      }
    } catch (e) {
      // Ignore terrain errors
    }
    return 0;
  }

  // ----------------------------------------------------------
  // Derived Parameters
  // ----------------------------------------------------------
  _updateDerivedParams(s) {
    s.verticalSpeed = s.velocity.y * 196.85;
    s.engineRPM = safe(s.throttle, 0.7) * 2700;
    s.windVolume = Math.min(1, safe(s.airspeed, 0) / 200);
    s.gForce = 1;
  }

  // ----------------------------------------------------------
  // Stall Detection
  // ----------------------------------------------------------
  _updateStallDetection(s) {
    const alpha = Math.abs(safe(s.pitch, 0));
    s.isStalling = alpha > 0.3 && safe(s.airspeed, 0) < 50;
  }

  /**
   * Reset flight state to initial conditions
   */
  reset() {
    const s = this.state;
    s.position.set(0, 50, 0);
    s.velocity.set(0, 0, -60);
    s.heading = 0;
    s.pitch = 0;
    s.roll = 0;
    s.throttle = 0.7;
    s.airspeed = 60 * 1.94384;
    s.isStalling = false;
    s.onGround = false;
  }
}