// ============================================================
// Clouds Module
// ============================================================

export function createClouds(scene) {
  const clouds = new THREE.Group();

  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.7,
    roughness: 1,
    metalness: 0,
    depthWrite: false,
  });

  for (let layer = 0; layer < 3; layer++) {
    const baseY = 800 + layer * 600;
    const count = 25 + layer * 10;

    for (let i = 0; i < count; i++) {
      const size = 40 + Math.random() * 80;
      const geo = new THREE.SphereGeometry(size, 8, 6);

      const pos = geo.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        const x = pos.getX(j);
        const y = pos.getY(j);
        const z = pos.getZ(j);
        const noise = (Math.sin(x * 0.1) * Math.cos(z * 0.08) * 0.3 + 0.7);
        pos.setX(j, x * (1 + Math.random() * 0.3));
        pos.setY(j, y * 0.4 * noise);
        pos.setZ(j, z * (1 + Math.random() * 0.3));
      }
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, cloudMat.clone());
      mesh.position.set(
        (Math.random() - 0.5) * 6000,
        baseY + Math.random() * 100,
        (Math.random() - 0.5) * 6000
      );
      mesh.scale.set(
        1 + Math.random() * 0.5,
        0.5 + Math.random() * 0.3,
        1 + Math.random() * 0.5
      );
      mesh.material.opacity = 0.4 + Math.random() * 0.3;
      mesh.material.color.setHSL(0.55 + Math.random() * 0.05, 0.1, 0.85 + Math.random() * 0.1);
      clouds.add(mesh);
    }
  }

  scene.add(clouds);
  return clouds;
}

export function updateClouds(clouds, dt) {
  if (!clouds) return;
  clouds.children.forEach(mesh => {
    mesh.position.x += dt * 5;
    if (mesh.position.x > 3000) mesh.position.x = -3000;
  });
}