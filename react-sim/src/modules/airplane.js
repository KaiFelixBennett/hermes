// ============================================================
// Airplane Module
// ============================================================

export function createAirplane(scene) {
  const airplane = new THREE.Group();

  const fuselageMat = new THREE.MeshStandardMaterial({
    color: 0xe8e8e8, roughness: 0.3, metalness: 0.6
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x2244aa, roughness: 0.3, metalness: 0.5
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x333333, roughness: 0.5, metalness: 0.3
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff, roughness: 0.1, metalness: 0.3,
    transparent: true, opacity: 0.6
  });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2
  });
  const navLightRed = new THREE.MeshStandardMaterial({
    color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1
  });
  const navLightGreen = new THREE.MeshStandardMaterial({
    color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 1
  });
  const navLightWhite = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1
  });

  // Fuselage
  const fuselageGeo = new THREE.CylinderGeometry(1.2, 0.8, 14, 12);
  const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
  fuselage.rotation.z = Math.PI / 2;
  fuselage.castShadow = true;
  airplane.add(fuselage);

  // Nose cone
  const noseGeo = new THREE.SphereGeometry(1.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, fuselageMat);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 7;
  nose.castShadow = true;
  airplane.add(nose);

  // Cockpit windows
  const cockpitGeo = new THREE.SphereGeometry(1.1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const cockpit = new THREE.Mesh(cockpitGeo, glassMat);
  cockpit.position.set(6.5, 0.5, 0);
  cockpit.scale.set(1.2, 0.8, 1);
  airplane.add(cockpit);

  // Cabin windows
  for (let i = 0; i < 8; i++) {
    const win = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.5, 0.1),
      glassMat.clone()
    );
    win.position.set(2 - i * 1.2, 0.8, 1.21);
    airplane.add(win);
    const win2 = win.clone();
    win2.position.z = -1.21;
    airplane.add(win2);
  }

  // Stripe
  const stripeGeo = new THREE.CylinderGeometry(1.25, 0.85, 12, 12, 1, true, -0.3, 0.6);
  const stripe = new THREE.Mesh(stripeGeo, accentMat);
  stripe.rotation.z = Math.PI / 2;
  airplane.add(stripe);

  // Tail cone
  const tailCone = new THREE.Mesh(
    new THREE.ConeGeometry(1.0, 4, 8),
    fuselageMat
  );
  tailCone.rotation.z = Math.PI / 2;
  tailCone.position.x = -9;
  tailCone.castShadow = true;
  airplane.add(tailCone);

  // Vertical stabilizer
  const vsGeo = new THREE.BufferGeometry();
  const vsVerts = new Float32Array([
    0, 0, 0, 0, 0, 1.5, 3, 3.5, 0, 3, 3.5, 1.5,
  ]);
  const vsIndices = [0, 2, 3, 0, 3, 1];
  vsGeo.setAttribute('position', new THREE.BufferAttribute(vsVerts, 3));
  vsGeo.setIndex(vsIndices);
  vsGeo.computeVertexNormals();
  const verticalStab = new THREE.Mesh(vsGeo, accentMat);
  verticalStab.position.set(-8, 1, 0);
  verticalStab.castShadow = true;
  airplane.add(verticalStab);

  // Horizontal stabilizer
  const hsGeo = new THREE.BoxGeometry(3, 0.15, 5);
  const horizontalStab = new THREE.Mesh(hsGeo, fuselageMat);
  horizontalStab.position.set(-9, 0.2, 0);
  horizontalStab.castShadow = true;
  airplane.add(horizontalStab);

  // Wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(2, 4.5);
  wingShape.lineTo(2, 5);
  wingShape.lineTo(0, 4.5);
  wingShape.lineTo(0, 0);

  const wingExtrudeSettings = { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 };
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
  const leftWing = new THREE.Mesh(wingGeo, fuselageMat);
  leftWing.position.set(1, -0.5, -0.1);
  leftWing.rotation.x = -Math.PI / 2;
  leftWing.castShadow = true;
  airplane.add(leftWing);

  const rightWing = leftWing.clone();
  rightWing.position.z = 0.2;
  rightWing.scale.z = -1;
  airplane.add(rightWing);

  // Wing tips
  const wingTipGeo = new THREE.SphereGeometry(0.3, 8, 6);
  const leftWingTip = new THREE.Mesh(wingTipGeo, navLightRed);
  leftWingTip.position.set(3, -0.5, -5);
  airplane.add(leftWingTip);

  const rightWingTip = new THREE.Mesh(wingTipGeo, navLightGreen);
  rightWingTip.position.set(3, -0.5, 5);
  airplane.add(rightWingTip);

  const centerTip = new THREE.Mesh(wingTipGeo, navLightWhite);
  centerTip.position.set(3, -0.5, 0);
  airplane.add(centerTip);

  // Engine nacelles
  const nacelleGeo = new THREE.CylinderGeometry(0.5, 0.4, 2.5, 10);
  const leftEngine = new THREE.Mesh(nacelleGeo, darkMat);
  leftEngine.position.set(1, -0.8, -2.5);
  leftEngine.rotation.z = Math.PI / 2;
  leftEngine.castShadow = true;
  airplane.add(leftEngine);

  const rightEngine = leftEngine.clone();
  rightEngine.position.z = 2.5;
  airplane.add(rightEngine);

  // Propeller
  const propeller = new THREE.Group();
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });

  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 3, 0.15),
      bladeMat
    );
    blade.rotation.z = (i / 3) * Math.PI * 2;
    propeller.add(blade);
  }

  const hub = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 8, 6),
    darkMat
  );
  propeller.add(hub);
  propeller.position.set(8.3, -0.5, 0);
  airplane.add(propeller);

  // Landing gear
  const gearMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.5 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });

  const noseGearStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 6), gearMat);
  noseGearStrut.position.set(4, -1.5, 0);
  airplane.add(noseGearStrut);

  const noseWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 10), wheelMat);
  noseWheel.position.set(4, -2.5, 0);
  noseWheel.rotation.z = Math.PI / 2;
  airplane.add(noseWheel);

  [-1.5, 1.5].forEach(z => {
    const mainStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5, 6), gearMat);
    mainStrut.position.set(-2, -1.8, z);
    airplane.add(mainStrut);

    const mainWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.25, 10), wheelMat);
    mainWheel.position.set(-2, -3, z);
    mainWheel.rotation.z = Math.PI / 2;
    airplane.add(mainWheel);
  });

  // Landing lights
  const landingLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 3 })
  );
  landingLight.position.set(8.3, -0.5, -3);
  airplane.add(landingLight);
  const landingLight2 = landingLight.clone();
  landingLight2.position.z = 3;
  airplane.add(landingLight2);

  scene.add(airplane);
  return { airplane, propeller };
}