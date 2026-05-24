// ============================================================
// Terrain Module
// ============================================================

export function getTerrainHeight(x, z) {
  let h = 0;
  // Large scale features
  h += Math.sin(x * 0.0005) * Math.cos(z * 0.0005) * 300;
  h += Math.sin(x * 0.001 + 1) * Math.cos(z * 0.0008 + 2) * 150;
  // Medium scale
  h += Math.sin(x * 0.003) * Math.cos(z * 0.002) * 60;
  h += Math.sin(x * 0.005 + 3) * Math.sin(z * 0.004 + 1) * 30;
  // Small scale
  h += Math.sin(x * 0.01) * Math.cos(z * 0.008) * 10;
  h += Math.sin(x * 0.02 + 2) * Math.sin(z * 0.015 + 1) * 5;

  // Mountain range on one side
  const mountainDist = x + 2000;
  if (mountainDist > 0) {
    const mFactor = Math.exp(-mountainDist / 800);
    h += mFactor * 400 * (1 + Math.sin(z * 0.003) * 0.5);
  }

  // Coastal depression on far side
  if (x < -1500) {
    const coastalFactor = (x + 1500) / -2000;
    h *= (1 - coastalFactor * 0.5);
  }

  return Math.max(h, -20);
}

export function getTerrainColor(y, x, z) {
  let r, g, b;

  if (y < 2) {
    r = 0.76; g = 0.70; b = 0.52;
  } else if (y < 50) {
    const t = (y - 2) / 48;
    r = lerp(0.25, 0.76, t);
    g = lerp(0.45, 0.70, t);
    b = lerp(0.15, 0.52, t);
  } else if (y < 200) {
    const t = (y - 50) / 150;
    r = lerp(0.20, 0.35, t);
    g = lerp(0.35, 0.40, t);
    b = lerp(0.15, 0.30, t);
  } else if (y < 400) {
    const t = (y - 200) / 200;
    r = lerp(0.35, 0.45, t);
    g = lerp(0.40, 0.43, t);
    b = lerp(0.30, 0.42, t);
  } else {
    r = 0.9; g = 0.9; b = 0.92;
  }

  const variation = (Math.sin(x * 0.05) * Math.cos(z * 0.04) * 0.03);
  r += variation;
  g += variation;
  b += variation * 0.5;

  return { r: Math.max(0, Math.min(1, r)), g: Math.max(0, Math.min(1, g)), b: Math.max(0, Math.min(1, b)) };
}

export function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) { return a + (b - a) * t; }

export function createTerrain(scene) {
  const size = 8000;
  const segments = 256;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const positions = geo.attributes.position.array;
  const colors = new Float32Array(positions.length);

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    let y = getTerrainHeight(x, z);

    // Flatten airport area
    const dx = x, dz = z;
    const airportDist = Math.sqrt(dx * dx + dz * dz);
    if (airportDist < 400) {
      const flatten = smoothstep(300, 400, airportDist);
      y = y * (1 - flatten) + 0 * flatten;
    }

    positions[i + 1] = y;
    const color = getTerrainColor(y, x, z);
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: false,
  });

  const terrain = new THREE.Mesh(geo, mat);
  terrain.receiveShadow = true;
  scene.add(terrain);
  return terrain;
}