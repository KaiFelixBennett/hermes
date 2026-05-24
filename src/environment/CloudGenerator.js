/**
 * CloudGenerator Module
 * Creates volumetric-looking clouds from grouped spheres for atmospheric depth.
 */

import * as THREE from 'three';

export class CloudGenerator {
  /**
   * @param {THREE.Scene} scene - The scene to add clouds to
   */
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
  }

  /**
   * Generate clouds in the scene with denser, more voluminous clouds
   * @param {number} count - Number of cloud groups to create
   * @returns {THREE.Group} The parent group containing all clouds
   */
  generate(count = 80) {
    const cloudGroup = new THREE.Group();

    // Create cloud clusters for more realistic distribution
    const clusters = 15 + Math.floor(Math.random() * 10);
    
    for (let c = 0; c < clusters; c++) {
      // Cluster center
      const centerX = (Math.random() - 0.5) * 4000;
      const centerZ = (Math.random() - 0.5) * 4000;
      const centerY = 250 + Math.random() * 250;
      
      // Clouds per cluster
      const cloudsPerCluster = 3 + Math.floor(Math.random() * 8);
      
      for (let i = 0; i < cloudsPerCluster; i++) {
        const cloud = this._createCloud();
        cloud.position.set(
          centerX + (Math.random() - 0.5) * 500,
          centerY + (Math.random() - 0.5) * 50,
          centerZ + (Math.random() - 0.5) * 500
        );
        cloudGroup.add(cloud);
        this.clouds.push(cloud);
      }
    }

    this.scene.add(cloudGroup);
    return cloudGroup;
  }

  /**
   * @private
   * Create a denser, more voluminous cloud from multiple sphere puffs
   * @returns {THREE.Group}
   */
  _createCloud() {
    const group = new THREE.Group();
    const puffs = 8 + Math.floor(Math.random() * 12);

    for (let i = 0; i < puffs; i++) {
      const radius = 20 + Math.random() * 40;
      const geometry = new THREE.SphereGeometry(radius, 10, 8);
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6 + Math.random() * 0.3,
        roughness: 1,
        depthWrite: false
      });
      const puff = new THREE.Mesh(geometry, material);
      puff.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 50
      );
      puff.scale.set(
        1 + Math.random() * 0.5,
        0.4 + Math.random() * 0.3,
        1 + Math.random() * 0.5
      );
      group.add(puff);
    }

    return group;
  }
}