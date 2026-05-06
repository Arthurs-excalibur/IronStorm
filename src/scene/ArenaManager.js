import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';

export class ArenaManager {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.collisionSystem = new CollisionSystem();
    this.propCache = new Map();
    this.arenaSize = 25; // Half-width of the square arena
  }

  async build() {
    // 1. Structural Ground
    this.createGround();

    // 2. Build the Walls (Square Perimeter)
    await this.buildWalls();

    // 3. Clustered Decorations
    await this.placeClusteredDecorations();
  }

  createGround() {
    const dirtMaterial = new THREE.MeshStandardMaterial({
      color: '#43362a',
      roughness: 1.0,
    });

    // Central Clearing
    const centerDirt = new THREE.Mesh(new THREE.CircleGeometry(10, 32), dirtMaterial);
    centerDirt.rotation.x = -Math.PI / 2;
    centerDirt.position.set(0, 0.01, 0);
    centerDirt.receiveShadow = true;
    this.scene.add(centerDirt);

    // Radial dirt "paths"
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const path = new THREE.Mesh(new THREE.PlaneGeometry(20, 6), dirtMaterial);
      path.rotation.x = -Math.PI / 2;
      path.rotation.z = angle;
      path.position.set(Math.cos(angle) * 15, 0.01, Math.sin(angle) * 15);
      path.receiveShadow = true;
      this.scene.add(path);
    }
  }

  async buildWalls() {
    const wallAssets = [
      '/map/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_1_G_Color1.gltf',
      '/map/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_2_E_Color1.gltf',
      '/map/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_3_H_Color1.gltf',
    ];

    const treeAssets = [
      '/map/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_1_C_Color1.gltf',
      '/map/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_2_A_Color1.gltf',
      '/map/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_3_B_Color1.gltf',
    ];

    // Build 4 walls
    const wallPositions = [
      { start: [-this.arenaSize, -this.arenaSize], end: [this.arenaSize, -this.arenaSize] }, // Bottom
      { start: [this.arenaSize, -this.arenaSize], end: [this.arenaSize, this.arenaSize] },  // Right
      { start: [this.arenaSize, this.arenaSize], end: [-this.arenaSize, this.arenaSize] },  // Top
      { start: [-this.arenaSize, this.arenaSize], end: [-this.arenaSize, -this.arenaSize] }, // Left
    ];

    for (const wall of wallPositions) {
      const dx = wall.end[0] - wall.start[0];
      const dz = wall.end[1] - wall.start[1];
      const length = Math.sqrt(dx * dx + dz * dz);
      const segments = Math.ceil(length / 2.5); // One asset every 2.5 units

      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const x = wall.start[0] + dx * t;
        const z = wall.start[1] + dz * t;

        // Jitter for natural look
        const jX = x + (Math.random() - 0.5) * 1.5;
        const jZ = z + (Math.random() - 0.5) * 1.5;

        const isRock = Math.random() > 0.4;
        const modelUrl = isRock 
          ? wallAssets[Math.floor(Math.random() * wallAssets.length)]
          : treeAssets[Math.floor(Math.random() * treeAssets.length)];

        const scale = isRock ? 2.5 + Math.random() * 2.0 : 4.0 + Math.random() * 1.5;
        await this.spawnProp(modelUrl, new THREE.Vector3(jX, 0, jZ), Math.random() * Math.PI * 2, scale, isRock ? 'box' : 'circle');
      }
    }
  }

  async placeClusteredDecorations() {
    const bushAssets = [
      '/map/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Bush_1_F_Color1.gltf',
      '/map/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Bush_2_D_Color1.gltf',
    ];

    const grassAssets = [
      '/map/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Grass_1_C_Singlesided_Color1.gltf',
      '/map/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Grass_2_B_Singlesided_Color1.gltf',
    ];

    // Decorate near boundaries (clustering)
    for (const collider of this.collisionSystem.colliders) {
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 1.5 + Math.random() * 2.5;
        const x = collider.center.x + Math.cos(angle) * dist;
        const z = collider.center.z + Math.sin(angle) * dist;

        // Skip if too far from arena
        if (Math.abs(x) > this.arenaSize + 5 || Math.abs(z) > this.arenaSize + 5) continue;
        // Skip if too deep in center
        if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;

        const modelUrl = Math.random() > 0.5 
          ? bushAssets[Math.floor(Math.random() * bushAssets.length)]
          : grassAssets[Math.floor(Math.random() * grassAssets.length)];

        await this.spawnProp(modelUrl, new THREE.Vector3(x, 0, z), Math.random() * Math.PI * 2, 1.5 + Math.random() * 1.5, 'none');
      }
    }
  }

  async spawnProp(url, position, rotationY, scale, colliderType) {
    if (!this.propCache.has(url)) {
      const gltf = await this.loader.loadAsync(url);
      this.prepareTemplate(gltf.scene);
      this.propCache.set(url, gltf.scene);
    }

    const template = this.propCache.get(url);
    const instance = template.clone(true);
    instance.position.copy(position);
    instance.rotation.y = rotationY;
    instance.scale.setScalar(scale);
    this.scene.add(instance);

    if (colliderType !== 'none') {
      const box = new THREE.Box3().setFromObject(instance);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      center.y = 0;

      if (colliderType === 'circle') {
        this.collisionSystem.addCollider({
          type: 'circle',
          center,
          radius: Math.max(size.x, size.z) * 0.4,
        });
      } else {
        this.collisionSystem.addCollider({
          type: 'box',
          center,
          halfSize: new THREE.Vector3(size.x * 0.45, 0, size.z * 0.45),
        });
      }
    }
  }

  prepareTemplate(object) {
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  checkCollision(position, radius) {
    return this.collisionSystem.resolve(position, radius);
  }
}
