/**
 * SceneBuilder Module
 * Orchestrates creation of the 3D scene - lighting, terrain, clouds, trees.
 * Follows Single Responsibility Principle by handling only scene setup.
 */

import * as THREE from 'three';
import { TerrainGenerator } from '../environment/TerrainGenerator.js';
import { CloudGenerator } from '../environment/CloudGenerator.js';
import { TreeGenerator } from '../objects/TreeGenerator.js';

export class SceneBuilder {
  /**
   * Create a complete flight simulator scene
   * @returns {{scene: THREE.Scene, terrain: TerrainGenerator, clouds: CloudGenerator, sunLight: THREE.DirectionalLight}}
   */
  static build() {
    const scene = new THREE.Scene();

    // Sky gradient - blue gradient from bottom to top
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 512, 0, 0);
    gradient.addColorStop(0, '#87CEEB');       // Light blue at horizon
    gradient.addColorStop(0.4, '#4A90D9');     // Medium blue
    gradient.addColorStop(0.7, '#1E5FAA');     // Darker blue
    gradient.addColorStop(1, '#0A2A6E');       // Deep blue at top
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);
    const skyTexture = new THREE.CanvasTexture(canvas);
    scene.background = skyTexture;

    // Fog matching the horizon color
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.00025);

    // Lighting
    const sunLight = this._createSunLight(scene);
    this._createAmbientLight(scene);
    this._createHemisphereLight(scene);
    this._createSunVisual(scene);

    // Terrain
    const terrain = new TerrainGenerator(5000, 150);
    terrain.generate();
    terrain.createMesh(scene);

    // Clouds
    const clouds = new CloudGenerator(scene);
    clouds.generate(60);

    // Water plane - at y=0 so it's not visible below terrain
    this._createWaterPlane(scene);

    // Trees
    const treeGen = new TreeGenerator(scene);
    treeGen.generate(terrain, 300);

    return { scene, terrain, clouds, sunLight };
  }

  /**
   * @private
   * Create a water plane for realistic water surfaces
   * Water is at y=0 to match the average terrain level
   */
  static _createWaterPlane(scene) {
    const waterGeo = new THREE.PlaneGeometry(8000, 8000, 100, 100);
    waterGeo.rotateX(-Math.PI / 2);
    
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1a5276,
      transparent: true,
      opacity: 0.75,
      roughness: 0.2,
      metalness: 0.3
    });
    
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = 0;
    scene.add(water);
  }

  /**
   * @private
   * Create directional sun light with shadows
   */
  static _createSunLight(scene) {
    const sunLight = new THREE.DirectionalLight(0xfff4e0, 1.5);
    sunLight.position.set(500, 800, 300);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 3000;
    sunLight.shadow.camera.left = -500;
    sunLight.shadow.camera.right = 500;
    sunLight.shadow.camera.top = 500;
    sunLight.shadow.camera.bottom = -500;
    scene.add(sunLight);
    return sunLight;
  }

  /**
   * @private
   * Create ambient light
   */
  static _createAmbientLight(scene) {
    const ambientLight = new THREE.AmbientLight(0x6688aa, 0.6);
    scene.add(ambientLight);
  }

  /**
   * @private
   * Create hemisphere light for natural sky/ground colors
   */
  static _createHemisphereLight(scene) {
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3a7d3a, 0.4);
    scene.add(hemiLight);
  }

  /**
   * @private
   * Create visible sun sphere
   */
  static _createSunVisual(scene) {
    const sunGeo = new THREE.SphereGeometry(30, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(500, 800, 300);
    scene.add(sun);
  }
}