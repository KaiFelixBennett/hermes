// ============================================================
// Flight Physics Module
// ============================================================

export class FlightPhysics {
  constructor(state) {
    this.state = state;
  }

  update(dt) {
    const s = this.state;

    // Throttle control
    if (s.keys['ShiftLeft'] || s.keys['ShiftRight']) {
      s.throttle = Math.min(1, s.throttle + dt * 0.15);
    }
    if (s.keys['ControlLeft'] || s.keys['ControlRight']) {
      s.throttle = Math.max(0, s.throttle - dt * 0.15);
    }

    // Control inputs
    let pitchInput = 0;
    let rollInput = 0;
    let yawInput = 0;

    if (s.keys['w'] || s.keys['W']) pitchInput -= 1;
    if (s.keys['s'] || s.keys['S']) pitchInput += 1;
    if (s.keys['a'] || s.keys['A']) rollInput -= 1;
    if (s.keys['d'] || s.keys['D']) rollInput += 1;
    if (s.keys['q'] || s.keys['Q']) yawInput -= 1;
    if (s.keys['e'] || s.keys['E']) yawInput += 1;

    // Mouse input
    pitchInput -= s.mouse.dy * s.mouseSensitivity * 0.5;
    rollInput += s.mouse.dx * s.mouseSensitivity * 0.5;

    // Apply control inputs
    s.pitch += pitchInput * dt * 1.2;
    s.roll += rollInput * dt * 1.5;
    s.yaw += yawInput * dt * 0.6;

    // Damping
    s.pitch *= (1 - dt * 0.8);
    s.roll *= (1 - dt * 1.0);
    s.yaw *= (1 - dt * 0.6);

    // Calculate flight parameters
    const speedKnots = 50 + s.throttle * 250;
    s.airspeed = speedKnots;

    // Lift calculation
    const angleOfAttack = s.pitch * 0.5;
    s.lift = speedKnots * speedKnots * Math.cos(s.pitch) * Math.sin(angleOfAttack + 0.1) * 0.001;

    // Drag calculation
    s.drag = speedKnots * speedKnots * 0.0002;

    // Thrust calculation
    s.thrust = s.throttle * 50;

    // Net acceleration
    const netForce = s.thrust - s.drag;
    const acceleration = netForce / 10;

    // Update velocity
    s.velocity.x = Math.cos(s.heading) * speedKnots * 0.5;
    s.velocity.z = Math.sin(s.heading) * speedKnots * 0.5;
    s.velocity.y = s.lift * 0.3 - 9.8 * 0.1;

    // Update position
    s.position.x += s.velocity.x * dt;
    s.position.y += s.velocity.y * dt;
    s.position.z += s.velocity.z * dt;

    // Ground collision
    const terrainHeight = getTerrainHeight(s.position.x, s.position.z);
    if (s.position.y < terrainHeight + 2) {
      s.position.y = terrainHeight + 2;
      s.velocity.y = 0;
    }

    // Stall detection
    s.isStalling = Math.abs(angleOfAttack) > 0.3 && speedKnots < 80;

    // Update flight parameters
    s.verticalSpeed = s.velocity.y * 196.85; // m/s to fpm
    s.heading = ((s.heading % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    s.gForce = Math.abs(s.lift / 10);

    // Update rotation
    s.rotation.set(s.pitch, s.heading, s.roll, 'YXZ');
    s.quaternion.setFromEuler(s.rotation);

    // Update engine RPM
    s.engineRPM = s.throttle * 2700;

    // Update wind volume
    s.windVolume = Math.min(1, speedKnots / 200);

    // Update time of day
    s.timeOfDay = (s.timeOfDay + s.daySpeed) % 1;

    // Camera cinematic angle
    s.cinematicAngle += dt * 0.3;
  }

  reset() {
    const s = this.state;
    s.position.set(0, 50, 0);
    s.rotation.set(0, 0, 0);
    s.quaternion.set(0, 0, 0, 1);
    s.velocity.set(0, 0, 0);
    s.airspeed = 0;
    s.verticalSpeed = 0;
    s.heading = 0;
    s.pitch = 0;
    s.roll = 0;
    s.yaw = 0;
    s.throttle = 0.3;
    s.lift = 0;
    s.drag = 0;
    s.thrust = 0;
    s.gForce = 1;
    s.isStalling = false;
  }
}

// Export terrain height function (will be set by terrain module)
function getTerrainHeight(x, z) {
  return 0; // Default fallback
}