/**
 * TerrainGenerator Module
 * Generates terrain heightmaps and creates colored mesh with vertex colors.
 * Uses multi-octave sine noise for realistic terrain formation.
 */

import * as THREE from 'three';

export class TerrainGenerator {
  /**
   * @param {number} size - Total terrain size in world units
   * @param {number} resolution - Number of segments
   */
  constructor(size, resolution) {
    this.size = size;
    this.resolution = resolution;
    this.cellSize = size / resolution;
    this.heightData = null;
    this.mesh = null;
  }

  /**
   * Generate the terrain heightmap
   * @returns {Float32Array} The height data array
   */
  generate() {
    this.heightData = this._generateHeightMap();
    return this.heightData;
  }

  /**
   * Get height at world position (x, z) using bilinear interpolation
   * @param {number} x - World X coordinate
   * @param {number} z - World Z coordinate
   * @returns {number} The interpolated height
   */
  getHeight(x, z) {
    if (!this.heightData) return 0;

    const ix = (x + this.size / 2) / this.cellSize;
    const iz = (z + this.size / 2) / this.cellSize;

    const ixMin = Math.floor(ix);
    const izMin = Math.floor(iz);
    const ixMax = ixMin + 1;
    const izMax = izMin + 1;
    const fx = ix - ixMin;
    const fz = iz - izMin;

    const size = this.resolution + 1;

    const h1 = this.heightData[ixMin * size + izMin] || 0;
    const h2 = this.heightData[ixMax * size + izMin] || 0;
    const h3 = this.heightData[ixMin * size + izMax] || 0;
    const h4 = this.heightData[ixMax * size + izMax] || 0;

    return h1 * (1 - fx) * (1 - fz) + h2 * fx * (1 - fz) + h3 * (1 - fx) * fz + h4 * fx * fz;
  }

  /**
   * Create a Three.js mesh from the height data
   * @param {THREE.Scene} scene - The scene to add the mesh to
   * @returns {THREE.Mesh} The created terrain mesh
   */
  createMesh(scene) {
    if (!this.heightData) this.generate();

    const geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.resolution,
      this.resolution
    );
    geometry.rotateX(-Math.PI / 2);

    const vertices = geometry.attributes.position.array;
    const colorArray = [];

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      const ix = Math.floor((x + this.size / 2) / this.cellSize);
      const iz = Math.floor((z + this.size / 2) / this.cellSize);
      const size = this.resolution + 1;
      const h = this.heightData[ix * size + iz] || 0;
      vertices[i + 1] = h;

      // Color based on height with position-based variation
      const color = this._getColorForHeight(h, x, z);
      colorArray.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorArray, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: false
    });

    this.mesh = new THREE.Mesh(geometry, material);
    scene.add(this.mesh);
    return this.mesh;
  }

  /**
   * @private
   * Generate heightmap using multi-octave sine noise
   * @returns {Float32Array}
   */
  _generateHeightMap() {
    const size = this.resolution + 1;
    const heightData = new Float32Array(size * size);

    for (let i = 0; i <= this.resolution; i++) {
      for (let j = 0; j <= this.resolution; j++) {
        const x = i * this.cellSize - this.size / 2;
        const z = j * this.cellSize - this.size / 2;
        heightData[i * size + j] = this._noise(x, z);
      }
    }
    return heightData;
  }

  /**
   * @private
   * Improved multi-octave noise function with more detail
   * @param {number} x
   * @param {number} z
   * @returns {number}
   */
  _noise(x, z) {
    let val = 0;
    
    // Base rolling hills
    val += Math.sin(x * 0.003 + z * 0.002) * 40;
    val += Math.sin(x * 0.005 - z * 0.003 + 1) * 25;
    
    // Medium detail
    val += Math.sin(x * 0.012 - z * 0.008 + 2) * 12;
    val += Math.sin(x * 0.018 + z * 0.015 + 0.5) * 8;
    
    // Fine detail
    val += Math.sin(x * 0.035 + z * 0.028 + 3) * 4;
    val += Math.sin(x * 0.07 - z * 0.055 + 1.5) * 2;
    val += Math.sin(x * 0.14 + z * 0.11 + 2.5) * 0.8;
    
    // Mountain ranges (radial)
    const dist = Math.sqrt(x * x + z * z);
    const mountainFactor = Math.max(0, 1 - dist / 2000);
    val += mountainFactor * mountainFactor * (
      Math.sin(x * 0.006 + z * 0.004) * 60 +
      Math.sin(x * 0.015 - z * 0.01 + 2) * 30 +
      Math.sin(x * 0.03 + z * 0.025 + 1) * 15
    );
    
    // Valley in center for runway area (flatter for takeoff)
    const valleyFactor = Math.max(0, 1 - dist / 800);
    val -= valleyFactor * valleyFactor * 8;
    
    // Ensure minimum height of 0 for the runway area
    const runwayFactor = Math.max(0, 1 - dist / 300);
    val += runwayFactor * 5;
    
    return val;
  }

  /**
   * @private
   * Get color based on terrain height with more variation
   * @param {number} height
   * @param {number} x
   * @param {number} z
   * @returns {{r: number, g: number, b: number}}
   */
  _getColorForHeight(height, x, z) {
    let r, g, b;
    
    // Add some noise to colors for variety
    const colorNoise = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.02;
    
    if (height < -3) {
      // Deep water - dark blue
      r = 0.05 + colorNoise;
      g = 0.15 + colorNoise;
      b = 0.4 + colorNoise;
    } else if (height < 0) {
      // Shallow water - teal/turquoise
      const t = (height + 3) / 3;
      r = 0.05 + t * 0.71;
      g = 0.15 + t * 0.55;
      b = 0.4 + t * 0.1;
    } else if (height < 1) {
      // Sandy beach
      r = 0.76;
      g = 0.7;
      b = 0.5;
    } else if (height < 20) {
      // Green grass with variation
      const t = (height - 1) / 19;
      r = 0.12 + t * 0.15 + colorNoise;
      g = 0.35 + t * 0.2 + colorNoise;
      b = 0.08 + t * 0.05 + colorNoise;
    } else if (height < 40) {
      // Grass to rock transition
      const t = (height - 20) / 20;
      r = 0.27 + t * 0.23 + colorNoise;
      g = 0.55 - t * 0.15 + colorNoise;
      b = 0.13 - t * 0.03 + colorNoise;
    } else if (height < 55) {
      // Rock to snow transition
      const t = (height - 40) / 15;
      r = 0.5 + t * 0.4;
      g = 0.4 + t * 0.5;
      b = 0.1 + t * 0.85;
    } else {
      // Snow caps
      r = 0.92 + colorNoise;
      g = 0.92 + colorNoise;
      b = 0.95 + colorNoise;
    }
    
    return { r: Math.max(0, Math.min(1, r)), g: Math.max(0, Math.min(1, g)), b: Math.max(0, Math.min(1, b)) };
  }
}