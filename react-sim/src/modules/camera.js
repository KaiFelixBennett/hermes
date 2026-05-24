// ============================================================
// Camera Manager Module
// ============================================================

export class CameraManager {
  constructor(camera, state) {
    this.camera = camera;
    this.state = state;
    this.smoothing = 0.08;
  }

  update(dt) {
    const s = this.state;
    const pos = this.camera.position;

    // Camera mode transition
    if (s.cameraTransition > 0) {
      s.cameraTransition = Math.min(1, s.cameraTransition + dt * 2);
      if (s.cameraTransition >= 1) {
        s.cameraMode = s.cameraTargetMode;
        s.cameraTransition = 0;
      }
    }

    switch (s.cameraMode) {
      case 1: // Cockpit view
        this.updateCockpit(dt);
        break;
      case 2: // Chase view
        this.updateChase(dt);
        break;
      case 3: // Cinematic view
        this.updateCinematic(dt);
        break;
    }
  }

  updateCockpit(dt) {
    const s = this.state;
    const airplanePos = s.airplane.position;

    // Cockpit position (inside cockpit)
    const cockpitOffset = new THREE.Vector3(6, 0.8, 0);
    const targetPos = airplanePos.clone().add(cockpitOffset.applyQuaternion(s.quaternion));

    // Smooth transition
    this.camera.position.lerp(targetPos, this.smoothing + dt * 3);

    // Look direction
    const lookOffset = new THREE.Vector3(10, 0.5, 0);
    const targetLook = airplanePos.clone().add(
      lookOffset.applyQuaternion(s.quaternion)
    );
    this.camera.lookAt(targetLook);
  }

  updateChase(dt) {
    const s = this.state;
    const airplanePos = s.airplane.position;

    // Chase offset in airplane space
    const chaseOffset = s.chaseOffset.clone().applyQuaternion(s.quaternion);
    const targetPos = airplanePos.clone().sub(chaseOffset);

    // Smooth transition
    this.camera.position.lerp(targetPos, this.smoothing + dt * 2);

    // Look at airplane
    const targetLook = airplanePos.clone().add(
      new THREE.Vector3(5, 1, 0).applyQuaternion(s.quaternion)
    );
    this.camera.lookAt(targetLook);
  }

  updateCinematic(dt) {
    const s = this.state;
    const airplanePos = s.airplane.position;

    s.cinematicAngle += dt * 0.15;

    const radius = s.cinematicRadius;
    const height = 30 + Math.sin(s.cinematicAngle * 0.7) * 15;

    const targetPos = new THREE.Vector3(
      airplanePos.x + Math.cos(s.cinematicAngle) * radius,
      airplanePos.y + height,
      airplanePos.z + Math.sin(s.cinematicAngle) * radius
    );

    // Smooth transition
    this.camera.position.lerp(targetPos, this.smoothing + dt * 1.5);

    // Look at airplane
    this.camera.lookAt(airplanePos);
  }

  switchTo(mode) {
    this.state.cameraTargetMode = mode;
    this.state.cameraTransition = 0;
  }
}