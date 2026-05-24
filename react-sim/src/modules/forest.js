// ============================================================
// Forest Module
// ============================================================

export function createForest(scene, getTerrainHeight) {
  const forest = new THREE.Group();

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
  const leavesMats = [
    new THREE.MeshStandardMaterial({ color: 0x2a5a2a, roughness: 0.85, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x3a6a3a, roughness: 0.85, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x1a4a1a, roughness: 0.85, flatShading: true }),
  ];

  for (let i = 0; i < 300; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 500 + Math.random() * 1500;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    if (Math.sqrt(x * x + z * z) < 450) continue;

    const y = getTerrainHeight(x, z);
    if (y < 5) continue;

    const treeGroup = new THREE.Group();

    const trunkH = 3 + Math.random() * 4;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.5, trunkH, 5),
      trunkMat
    );
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const foliageH = 6 + Math.random() * 8;
    const foliageR = 2 + Math.random() * 3;
    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry(foliageR, foliageH, 6),
      leavesMats[Math.floor(Math.random() * leavesMats.length)]
    );
    foliage.position.y = trunkH + foliageH / 2 - 2;
    foliage.castShadow = true;
    treeGroup.add(foliage);

    const foliage2 = new THREE.Mesh(
      new THREE.ConeGeometry(foliageR * 0.7, foliageH * 0.7, 6),
      leavesMats[Math.floor(Math.random() * leavesMats.length)]
    );
    foliage2.position.y = trunkH + foliageH * 0.6 - 1;
    foliage2.castShadow = true;
    treeGroup.add(foliage2);

    treeGroup.position.set(x, y - 50, z);
    treeGroup.rotation.y = Math.random() * Math.PI;
    const s = 0.8 + Math.random() * 0.5;
    treeGroup.scale.set(s, s, s);
    forest.add(treeGroup);
  }

  scene.add(forest);
  return forest;
}