/**
 * CameraController Module
 * Manages chase camera behavior that smoothly follows the aircraft.
 * Separates camera concerns from the main application logic.
 */

import * as THREE from 'three';

export class CameraController {
  /**
   * @param {THREE.Camera} camera - The camera to control
   * @param {HTMLCanvasElement} canvas - Canvas for pointer lock
   */
  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
    this.position = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this.lookAheadDist = 15;
    this.camDist = 25;
    this.camHeight = 10;
    this.smoothing = 0.3;
    this.initialized = false;
  }

  /**
   * Update camera position to follow aircraft - camera always behind aircraft
   * @param {THREE.Vector3} aircraftPos - Aircraft world position
   * @param {THREE.Euler} aircraftRotation - Aircraft rotation (pitch, yaw, roll)
   */
  update(aircraftPos, aircraftRotation) {
    // Initialize position on first frame
    if (!this.initialized) {
      this.position.copy(aircraftPos).add(new THREE.Vector3(0, this.camHeight, this.camDist));
      this.target.copy(aircraftPos);
      this.initialized = true;
    }
    
    // Calculate camera position behind aircraft based on yaw
    const yaw = aircraftRotation.y;
    
    // Camera position behind and above aircraft
    const backX = -Math.sin(yaw) * this.camDist;
    const backZ = -Math.cos(yaw) * this.camDist;
    
    const targetCamX = aircraftPos.x + backX;
    const targetCamZ = aircraftPos.z + backZ;
    const targetCamY = aircraftPos.y + this.camHeight;

    const targetCamPos = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);

    // Smoothly interpolate camera position
    this.position.lerp(targetCamPos, this.smoothing);
    this.camera.position.copy(this.position);

    // Look at the aircraft itself (slightly above center)
    this.target.set(aircraftPos.x, aircraftPos.y + 1, aircraftPos.z);
    this.camera.lookAt(this.target);
  }

  /**
   * Initialize pointer lock for mouse control
   */
  initPointerLock() {
    this.canvas.addEventListener('mousedown', () => {
      this.canvas.requestPointerLock();
    });
  }

  /**
   * Get mouse delta from pointer lock
   * @returns {{dx: number, dy: number}} Mouse movement deltas
   */
  getMouseDelta() {
    if (document.pointerLockElement !== this.canvas) {
      return { dx: 0, dy: 0 };
    }
    return { dx: 0, dy: 0 }; // Reset after each call - caller should capture before
  }

  /**
   * Set mouse sensitivity
   * @param {number} sensitivity - Mouse sensitivity multiplier
   */
  setSensitivity(sensitivity) {
    this.sensitivity = sensitivity;
  }
}