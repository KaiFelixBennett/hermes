/**
 * Aircraft Module
 * Creates a detailed Cessna-172-style single-engine aircraft model.
 */

import * as THREE from 'three';

/**
 * Materials cache for reuse
 */
const materialsCache = {};

function getMaterials() {
  if (materialsCache.body) return materialsCache;

  materialsCache.body = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5, roughness: 0.3, metalness: 0.3
  });
  materialsCache.stripes = new THREE.MeshStandardMaterial({
    color: 0x2196F3, roughness: 0.3, metalness: 0.3
  });
  materialsCache.dark = new THREE.MeshStandardMaterial({
    color: 0x333333, roughness: 0.4, metalness: 0.5
  });
  materialsCache.glass = new THREE.MeshStandardMaterial({
    color: 0x88ccff, roughness: 0.1, metalness: 0.2,
    transparent: true, opacity: 0.5
  });
  materialsCache.red = new THREE.MeshStandardMaterial({
    color: 0xcc3333, roughness: 0.3, metalness: 0.4
  });
  materialsCache.prop = new THREE.MeshStandardMaterial({
    color: 0x4a3222, roughness: 0.6
  });
  materialsCache.strut = new THREE.MeshStandardMaterial({
    color: 0x666666, metalness: 0.8
  });
  materialsCache.lightRed = new THREE.MeshStandardMaterial({
    color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5
  });
  materialsCache.lightGreen = new THREE.MeshStandardMaterial({
    color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.5
  });
  materialsCache.lightWhite = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8
  });
  materialsCache.lightYellow = new THREE.MeshStandardMaterial({
    color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.5
  });

  return materialsCache;
}

/**
 * Creates a detailed Cessna-172-style aircraft model
 * @returns {THREE.Group} The aircraft group with named parts
 */
export function createAircraft() {
  const group = new THREE.Group();
  const m = getMaterials();

  // ===== FUSELAGE (Main Body) =====
  // Create a more realistic fuselage shape using LatheGeometry
  const fuselageProfile = [];
  fuselageProfile.push(new THREE.Vector2(0, 0));
  fuselageProfile.push(new THREE.Vector2(0.6, 1));
  fuselageProfile.push(new THREE.Vector2(0.9, 2));
  fuselageProfile.push(new THREE.Vector2(1.0, 3));
  fuselageProfile.push(new THREE.Vector2(1.0, 5));
  fuselageProfile.push(new THREE.Vector2(0.95, 6));
  fuselageProfile.push(new THREE.Vector2(0.8, 7));
  fuselageProfile.push(new THREE.Vector2(0.6, 8));
  fuselageProfile.push(new THREE.Vector2(0.3, 9));
  fuselageProfile.push(new THREE.Vector2(0, 10));

  const fuselageGeo = new THREE.LatheGeometry(fuselageProfile, 12);
  fuselageGeo.rotateZ(Math.PI / 2);
  const fuselage = new THREE.Mesh(fuselageGeo, m.body);
  group.add(fuselage);

  // Nose cone
  const noseGeo = new THREE.SphereGeometry(0.9, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  noseGeo.rotateX(Math.PI / 2);
  noseGeo.translate(0, 0, 10);
  const nose = new THREE.Mesh(noseGeo, m.body);
  group.add(nose);

  // Nose tip (radome)
  const tipGeo = new THREE.SphereGeometry(0.35, 8, 8);
  const tip = new THREE.Mesh(tipGeo, m.dark);
  tip.position.z = 11;
  group.add(tip);

  // ===== COCKPIT =====
  // Canopy - half sphere on top
  const canopyGeo = new THREE.SphereGeometry(0.9, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  canopyGeo.scale(1, 0.5, 1.8);
  const canopy = new THREE.Mesh(canopyGeo, m.glass);
  canopy.position.set(0, 0.9, 3);
  group.add(canopy);

  // Canopy frame
  const frameGeo = new THREE.TorusGeometry(0.85, 0.03, 6, 12, Math.PI);
  const frame = new THREE.Mesh(frameGeo, m.dark);
  frame.position.set(0, 0.9, 3);
  frame.rotation.y = Math.PI / 2;
  group.add(frame);

  // ===== WINGS (High-wing configuration like Cessna) =====
  const wingGeo = new THREE.BoxGeometry(15, 0.3, 2.2);
  const wings = new THREE.Mesh(wingGeo, m.body);
  wings.position.set(0, 0.8, 1);
  group.add(wings);

  // Wing leading edge stripe
  const stripeGeo = new THREE.BoxGeometry(15, 0.31, 0.15);
  const stripe = new THREE.Mesh(stripeGeo, m.stripes);
  stripe.position.set(0, 0.8, 2.05);
  group.add(stripe);

  // Wing tip nav lights
  const navLightGeo = new THREE.SphereGeometry(0.12, 6, 6);
  const leftLight = new THREE.Mesh(navLightGeo, m.lightRed);
  leftLight.position.set(-7.5, 0.8, 1);
  group.add(leftLight);
  const rightLight = new THREE.Mesh(navLightGeo, m.lightGreen);
  rightLight.position.set(7.5, 0.8, 1);
  group.add(rightLight);

  // Wing tip fairings
  const fairingGeo = new THREE.SphereGeometry(0.15, 6, 6);
  const leftFairing = new THREE.Mesh(fairingGeo, m.body);
  leftFairing.position.set(-7.5, 0.8, 2.1);
  group.add(leftFairing);
  const rightFairing = new THREE.Mesh(fairingGeo, m.body);
  rightFairing.position.set(7.5, 0.8, 2.1);
  group.add(rightFairing);

  // ===== HORIZONTAL STABILIZER (Tail wing) =====
  const tailWingGeo = new THREE.BoxGeometry(5.5, 0.2, 1.8);
  const tailWing = new THREE.Mesh(tailWingGeo, m.body);
  tailWing.position.set(0, 0.5, -6);
  group.add(tailWing);

  // Tail leading edge stripe
  const tailStripeGeo = new THREE.BoxGeometry(5.5, 0.21, 0.12);
  const tailStripe = new THREE.Mesh(tailStripeGeo, m.stripes);
  tailStripe.position.set(0, 0.5, -5.1);
  group.add(tailStripe);

  // Elevator
  const elevatorGeo = new THREE.BoxGeometry(5, 0.12, 1.5);
  const elevator = new THREE.Mesh(elevatorGeo, m.body);
  elevator.position.set(0, 0.5, -6.8);
  group.add(elevator);

  // ===== VERTICAL STABILIZER (Tail fin) =====
  const tailFinProfile = [];
  tailFinProfile.push(new THREE.Vector2(0, 0));
  tailFinProfile.push(new THREE.Vector2(0.5, 0.5));
  tailFinProfile.push(new THREE.Vector2(0.8, 1.5));
  tailFinProfile.push(new THREE.Vector2(0.6, 2.5));
  tailFinProfile.push(new THREE.Vector2(0.2, 3));
  tailFinProfile.push(new THREE.Vector2(0, 3));

  const tailFinGeo = new THREE.ExtrudeGeometry(
    new THREE.Shape(tailFinProfile.map(p => new THREE.Vector2(p.x, p.y))),
    { depth: 0.2, bevelEnabled: false }
  );
  const tailFin = new THREE.Mesh(tailFinGeo, m.body);
  tailFin.position.set(0, 0.5, -6);
  tailFin.rotation.y = Math.PI / 2;
  group.add(tailFin);

  // Vertical fin leading edge stripe
  const vFinStripeGeo = new THREE.BoxGeometry(0.15, 3, 0.25);
  const vFinStripe = new THREE.Mesh(vFinStripeGeo, m.stripes);
  vFinStripe.position.set(0, 2, -6);
  group.add(vFinStripe);

  // Rudder
  const rudderGeo = new THREE.BoxGeometry(0.12, 2.5, 1.5);
  const rudder = new THREE.Mesh(rudderGeo, m.body);
  rudder.position.set(0, 1.8, -7.2);
  group.add(rudder);

  // ===== PROPELLER =====
  // Create a propeller group that rotates
  const propellerGroup = new THREE.Group();
  propellerGroup.name = 'propeller';
  propellerGroup.position.z = 10.5;

  // Propeller blades
  const propBladeGeo = new THREE.BoxGeometry(0.3, 3.8, 0.1);
  const propeller1 = new THREE.Mesh(propBladeGeo, m.prop);
  propellerGroup.add(propeller1);

  const propeller2 = new THREE.Mesh(propBladeGeo, m.prop);
  propeller2.rotation.z = Math.PI / 2;
  propellerGroup.add(propeller2);

  // Propeller hub
  const hubGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.5, 10);
  hubGeo.rotateZ(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, m.dark);
  propellerGroup.add(hub);

  group.add(propellerGroup);

  // Spinner (nose cone) - separate from propeller
  const spinnerGeo = new THREE.SphereGeometry(0.4, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  spinnerGeo.rotateX(Math.PI / 2);
  spinnerGeo.translate(0, 0, 10.2);
  const spinner = new THREE.Mesh(spinnerGeo, m.dark);
  group.add(spinner);

  // ===== LANDING GEAR =====
  // Main gear struts
  const strutGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 6);
  
  [-1.2, 1.2].forEach(x => {
    const strut = new THREE.Mesh(strutGeo, m.strut);
    strut.position.set(x, -1.8, 2);
    group.add(strut);

    // Wire braces
    const braceGeo = new THREE.CylinderGeometry(0.02, 0.02, 2, 4);
    const brace = new THREE.Mesh(braceGeo, m.strut);
    brace.position.set(x * 0.8, -1.5, 3);
    brace.rotation.z = x > 0 ? 0.3 : -0.3;
    group.add(brace);

    // Wheel
    const wheelGeo = new THREE.TorusGeometry(0.35, 0.15, 6, 10);
    const wheel = new THREE.Mesh(wheelGeo, m.dark);
    wheel.position.set(x, -3.2, 2);
    wheel.rotation.y = Math.PI / 2;
    group.add(wheel);

    // Wheel pant (fairing)
    const pantGeo = new THREE.SphereGeometry(0.35, 8, 6);
    pantGeo.scale(0.8, 1.2, 1);
    const pant = new THREE.Mesh(pantGeo, m.body);
    pant.position.set(x, -3.2, 2);
    group.add(pant);
  });

  // Tail wheel
  const tailWheelGeo = new THREE.TorusGeometry(0.15, 0.06, 4, 6);
  const tailWheel = new THREE.Mesh(tailWheelGeo, m.dark);
  tailWheel.position.set(0, -2.8, -6.5);
  tailWheel.rotation.y = Math.PI / 2;
  group.add(tailWheel);

  // Tail strut
  const tailStrutGeo = new THREE.CylinderGeometry(0.04, 0.04, 2, 4);
  const tailStrut = new THREE.Mesh(tailStrutGeo, m.strut);
  tailStrut.position.set(0, -1.8, -6);
  tailStrut.rotation.x = 0.5;
  group.add(tailStrut);

  // ===== EXHAUST TUBES =====
  const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.1, 2.5, 6);
  exhaustGeo.rotateZ(Math.PI / 2);
  [-0.35, 0.35].forEach(x => {
    const exhaust = new THREE.Mesh(exhaustGeo, m.dark);
    exhaust.position.set(x, -0.6, -1.5);
    group.add(exhaust);
  });

  // ===== ANTENNA =====
  const antennaGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 4);
  const antenna = new THREE.Mesh(antennaGeo, m.strut);
  antenna.position.set(0, 1.7, -2);
  antenna.rotation.z = 0.15;
  group.add(antenna);

  // ===== NAVIGATION LIGHTS =====
  // Beacon (rotating red light on top)
  const beaconGeo = new THREE.SphereGeometry(0.1, 6, 6);
  const beacon = new THREE.Mesh(beaconGeo, m.lightRed);
  beacon.position.set(0, 1.5, -1);
  group.add(beacon);

  // Strobe lights (wing tips)
  const strobeGeo = new THREE.SphereGeometry(0.08, 6, 6);
  const leftStrobe = new THREE.Mesh(strobeGeo, m.lightWhite);
  leftStrobe.position.set(-7.5, 0.8, 0.5);
  group.add(leftStrobe);
  const rightStrobe = new THREE.Mesh(strobeGeo, m.lightWhite);
  rightStrobe.position.set(7.5, 0.8, 0.5);
  group.add(rightStrobe);

  // Landing light (nose)
  const landingLightGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.3, 8);
  landingLightGeo.rotateZ(Math.PI / 2);
  const landingLight = new THREE.Mesh(landingLightGeo, m.lightYellow);
  landingLight.position.set(0, 0.3, 10.5);
  group.add(landingLight);

  return group;
}