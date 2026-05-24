// ============================================================
// Mountains Module
// ============================================================

export function createMountains(scene) {
  const mountains = new THREE.Group();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x3a4a3a,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
  });

  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xe8e8e8,
    roughness: 0.8,
    metalness: 0.0,
    flatShading: true,
  });

  for (let i = 0; i < 30; i++) {
    const x = -3000 + Math.random() * 6000;
    const z = 3000 + Math.random() * 2000;
    const height = 300 + Math.random() * 500;
    const width = 100 + Math.random() * 200;

    const geo = new THREE.ConeGeometry(width, height, 6 + Math.floor(Math.random() * 4), 3);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, height / 2 - 50, z);
    mesh.rotation.y = Math.random() * Math.PI;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mountains.add(mesh);

    if (height > 400) {
      const snowGeo = new THREE.ConeGeometry(width * 0.3, height * 0.2, 6, 1);
      const snowMesh = new THREE.Mesh(snowGeo, snowMat);
      snowMesh.position.set(x, height - 50 - height * 0.1, z);
      mountains.add(snowMesh);
    }
  }

  scene.add(mountains);
  return mountains;
}