// ============================================================
// Sky Module
// ============================================================

export function createSky(scene) {
  const skyGeo = new THREE.SphereGeometry(8000, 32, 32);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x0044aa) },
      bottomColor: { value: new THREE.Color(0xc8ddf5) },
      sunPosition: { value: new THREE.Vector3() },
      sunColor: { value: new THREE.Color(0xffeedd) },
      fogColor: { value: new THREE.Color(0x87CEEB) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      varying vec3 vPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 sunPosition;
      uniform vec3 sunColor;
      uniform vec3 fogColor;
      varying vec3 vWorldPosition;
      varying vec3 vPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        float t = max(0.0, h);
        vec3 sky = mix(bottomColor, topColor, pow(t, 0.6));
        // Sun glow
        vec3 sunDir = normalize(sunPosition);
        vec3 viewDir = normalize(vWorldPosition);
        float sunDot = max(dot(viewDir, sunDir), 0.0);
        vec3 sunGlow = sunColor * pow(sunDot, 64.0) * 2.0;
        vec3 sunHalo = sunColor * pow(sunDot, 8.0) * 0.3;
        sky += sunGlow + sunHalo;
        // Horizon haze
        float horizonHaze = exp(-abs(h) * 4.0);
        sky = mix(sky, bottomColor, horizonHaze * 0.4);
        gl_FragColor = vec4(sky, 1.0);
      }`,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);
  return sky;
}

export function updateSky(sky, sunDirection) {
  if (!sky || !sunDirection) return;
  const uniforms = sky.material.uniforms;
  uniforms.sunPosition.value.copy(sunDirection);
}