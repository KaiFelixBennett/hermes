/**
 * TreeGenerator Module
 * Creates and places trees on terrain based on height conditions.
 */

import * as THREE from 'three';

export class TreeGenerator {
  /**
   * @param {THREE.Scene} scene - The scene to add trees to
   */
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Generate trees across the terrain
   * @param {TerrainGenerator} terrain - The terrain generator for height lookups
   * @param {number} count - Number of trees to place
   * @returns {THREE.Group[]} Array of created tree groups
   */
  generate(terrain, count = 300) {
    const trees = [];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 3500;
      const z = (Math.random() - 0.5) * 3500;
      const y = terrain.getHeight(x, z);

      // Only place trees on grass areas
      if (y > 0 && y < 25) {
        const tree = this._createTree();
        tree.position.set(x, y, z);
        const scale = 0.8 + Math.random() * 0.8;
        tree.scale.set(scale, scale, scale);
        this.scene.add(tree);
        trees.push(tree);
      }
    }
    return trees;
  }

  /**
   * @private
   * Create a single pine tree model
   * @returns {THREE.Group}
   */
  _createTree() {
    const group = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 8, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 4;
    group.add(trunk);

    // Foliage layers
    const foliageColors = [0x228B22, 0x2D8B2D, 0x1B7A1B];
    for (let i = 0; i < 3; i++) {
      const radius = 4 - i * 1;
      const height = 4;
      const foliageGeo = new THREE.ConeGeometry(radius, height, 7);
      const foliageMat = new THREE.MeshStandardMaterial({
        color: foliageColors[i % foliageColors.length],
        roughness: 0.8
      });
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.y = 8 + i * 3;
      group.add(foliage);
    }

    return group;
  }
}