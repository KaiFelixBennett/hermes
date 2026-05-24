// ============================================================
// City Module
// ============================================================

export function createCity(scene) {
  const city = new THREE.Group();

  const buildingMats = [
    new THREE.MeshStandardMaterial({ color: 0x667788, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: 0x778899, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: 0x889999, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: 0x99aabb, roughness: 0.6 }),
  ];

  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xccddff, emissive: 0x6688aa, emissiveIntensity: 0.2
  });

  const buildingCount = 60;
  for (let i = 0; i < buildingCount; i++) {
    const w = 8 + Math.random() * 20;
    const h = 5 + Math.random() * 40;
    const d = 8 + Math.random() * 20;

    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = buildingMats[Math.floor(Math.random() * buildingMats.length)];
    const building = new THREE.Mesh(geo, mat);

    const angle = Math.random() * Math.PI * 2;
    const dist = 300 + Math.random() * 800;
    building.position.set(
      Math.cos(angle) * dist,
      h / 2 - 50,
      Math.sin(angle) * dist
    );
    building.castShadow = true;
    building.receiveShadow = true;
    city.add(building);

    if (h > 15) {
      const winRows = Math.floor(h / 4);
      const winCols = Math.floor(w / 3);
      for (let r = 0; r < winRows; r++) {
        for (let c = 0; c < winCols; c++) {
          if (Math.random() > 0.4) {
            const win = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 0.2), windowMat.clone());
            win.material.emissiveIntensity = Math.random() > 0.5 ? 0.3 : 0.05;
            win.position.set(
              building.position.x - w / 2 + 2 + c * 3,
              building.position.y - h / 2 + 3 + r * 4,
              building.position.z + d / 2 + 0.1
            );
            city.add(win);
          }
        }
      }
    }
  }

  // Roads
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.95 });
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI;
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.1, 1600),
      roadMat
    );
    road.position.set(
      Math.cos(angle) * 500,
      -0.4,
      Math.sin(angle) * 500
    );
    road.rotation.y = angle;
    road.receiveShadow = true;
    city.add(road);
  }

  scene.add(city);
  return city;
}