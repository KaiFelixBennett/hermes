// ============================================================
// Airport Module
// ============================================================

export function createAirport(scene) {
  const airport = new THREE.Group();

  const runwayMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.95 });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x333333 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0x331100 });

  // Main runway
  const runway = new THREE.Mesh(new THREE.BoxGeometry(60, 0.3, 1200), runwayMat);
  runway.position.y = 0.15;
  runway.receiveShadow = true;
  airport.add(runway);

  // Runway center line
  for (let i = -55; i <= 55; i++) {
    if (i % 3 === 0) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 15), lineMat);
      line.position.set(0, 0.35, i * 8);
      airport.add(line);
    }
  }

  // Runway edge lines
  [-28, 28].forEach(x => {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 1180), edgeMat);
    edge.position.set(x, 0.35, 0);
    airport.add(edge);
  });

  // Threshold markings
  for (let i = -4; i <= 4; i++) {
    if (i !== 0) {
      const mark = new THREE.Mesh(new THREE.BoxGeometry(2, 0.05, 8), lineMat);
      mark.position.set(i * 5, 0.35, -560);
      airport.add(mark);
      const mark2 = mark.clone();
      mark2.position.z = 560;
      airport.add(mark2);
    }
  }

  // Taxiway
  const taxiway = new THREE.Mesh(new THREE.BoxGeometry(200, 0.2, 20), runwayMat);
  taxiway.position.set(80, 0.1, 200);
  taxiway.rotation.y = 0.3;
  taxiway.receiveShadow = true;
  airport.add(taxiway);

  // Taxiway edge lights
  for (let i = -90; i <= 90; i += 10) {
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.1, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00aa00 })
    );
    light.position.set(80 + i * 0.2 + 10, 0.25, 200 + i * 0.2 - 10);
    airport.add(light);
  }

  // Control tower
  const towerBase = new THREE.Mesh(
    new THREE.BoxGeometry(12, 40, 12),
    new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.7 })
  );
  towerBase.position.set(-60, 20, 300);
  towerBase.castShadow = true;
  airport.add(towerBase);

  const towerTop = new THREE.Mesh(
    new THREE.BoxGeometry(20, 6, 20),
    new THREE.MeshStandardMaterial({ color: 0x667788, roughness: 0.5 })
  );
  towerTop.position.set(-60, 43, 300);
  towerTop.castShadow = true;
  airport.add(towerTop);

  // Tower windows
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff, emissive: 0x4488cc, emissiveIntensity: 0.5
  });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const win = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 0.5), windowMat);
    win.position.set(-60 + Math.cos(angle) * 10, 43, 300 + Math.sin(angle) * 10);
    win.rotation.y = angle;
    airport.add(win);
  }

  // Hangar
  const hangar = new THREE.Mesh(
    new THREE.BoxGeometry(40, 20, 30),
    new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.8 })
  );
  hangar.position.set(-120, 10, -100);
  hangar.castShadow = true;
  hangar.receiveShadow = true;
  airport.add(hangar);

  const domeGeo = new THREE.CylinderGeometry(20, 20, 40, 16, 1, false, 0, Math.PI);
  const dome = new THREE.Mesh(domeGeo, new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.8 }));
  dome.position.set(-120, 10, -100);
  dome.rotation.z = Math.PI / 2;
  dome.rotation.y = Math.PI / 2;
  dome.castShadow = true;
  airport.add(dome);

  // Terminal
  const terminal = new THREE.Mesh(
    new THREE.BoxGeometry(50, 12, 25),
    new THREE.MeshStandardMaterial({ color: 0x7788aa, roughness: 0.7 })
  );
  terminal.position.set(100, 6, 150);
  terminal.castShadow = true;
  terminal.receiveShadow = true;
  airport.add(terminal);

  const termWinMat = new THREE.MeshStandardMaterial({
    color: 0xaaddff, emissive: 0x446688, emissiveIntensity: 0.3
  });
  for (let i = 0; i < 10; i++) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.3), termWinMat);
    win.position.set(76, 8, 140 + i * 5);
    airport.add(win);
  }

  // Navigational lights
  const navLightPositions = [
    { x: -32, z: -580, color: 0xffffff },
    { x: 32, z: -580, color: 0xffffff },
    { x: -32, z: 580, color: 0x00ff00 },
    { x: 32, z: 580, color: 0x00ff00 },
  ];

  navLightPositions.forEach(pos => {
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.5, 1),
      new THREE.MeshStandardMaterial({ color: pos.color, emissive: pos.color, emissiveIntensity: 1 })
    );
    light.position.set(pos.x, 1, pos.z);
    airport.add(light);
  });

  // PAPI lights
  for (let i = 0; i < 4; i++) {
    const papi = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.MeshStandardMaterial({
        color: i < 2 ? 0xff0000 : 0xffffff,
        emissive: i < 2 ? 0xff0000 : 0xffffff,
        emissiveIntensity: 0.8
      })
    );
    papi.position.set(-40, 0.5, -200 + i * 30);
    airport.add(papi);
  }

  scene.add(airport);
  return airport;
}