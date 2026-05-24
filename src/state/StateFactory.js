/**
 * StateFactory Module
 * Creates and initializes the flight state object with default values.
 * Follows Open/Closed Principle - easy to extend with new state properties.
 */

import * as THREE from 'three';

/**
 * Default flight state values
 */
const DEFAULT_STATE = {
  heading: 0,
  pitch: 0,
  roll: 0,
  yaw: 0,
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
  cinematicAngle: 0,
  daySpeed: 0.001,
  mouseSensitivity: 0.002,
  _throttleRate: 1.0,
  // Physics properties
  mass: 1000,
  dragCoeff: 0.05,
  onGround: false,
  elevatorDeflection: 0,
  aileronDeflection: 0,
  rudderDeflection: 0
};

/**
 * Creates a new flight state object with default values
 * @param {THREE.Vector3} initialPosition - Starting position
 * @returns {FlightState} The initialized state object
 */
export function createInitialState(initialPosition = new THREE.Vector3(0, 50, 0)) {
  const state = { ...DEFAULT_STATE };

  state.position = initialPosition.clone();
  state.rotation = new THREE.Euler(0, 0, 0);
  state.quaternion = new THREE.Quaternion();
  // Give aircraft initial forward velocity so it doesn't just fall
  state.velocity = new THREE.Vector3(0, 5, -75);
  state.keys = {};
  state.mouse = { dx: 0, dy: 0 };

  // Higher starting throttle for immediate lift
  state.throttle = 0.7;

  // Slight nose-up pitch for immediate lift generation
  state.pitch = 0.08;

  // Initialize quaternion from rotation
  state.quaternion.setFromEuler(state.rotation);

  return state;
}
