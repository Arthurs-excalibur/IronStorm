import { Enemy } from './Enemy.js';
import { ENEMY_CONFIGS } from './EnemyConfig.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export class EnemyManager {
  constructor({ scene, vfx, damageNumbers, animationClips }) {
    this.scene = scene;
    this.vfx = vfx;
    this.damageNumbers = damageNumbers;
    this.animationClips = animationClips;
    this.enemies = [];
    this.projectiles = [];
    this.loader = new GLTFLoader();
    this.projectileTemplates = new Map();
  }

  spawn(type, position) {
    const config = ENEMY_CONFIGS[type];
    if (!config) {
      console.warn(`Enemy type ${type} not found in config.`);
      return;
    }

    const enemy = new Enemy({
      scene: this.scene,
      config,
      animationClips: this.animationClips,
      vfx: this.vfx,
      damageNumbers: this.damageNumbers
    });

    enemy.init(this.loader).then(() => {
      enemy.root.position.copy(position);
      enemy.enemyManager = this; // Give enemy reference to manager for spawning projectiles
    });

    this.enemies.push(enemy);
    return enemy;
  }

  async spawnEnemyProjectile(config, startPos, targetPos) {
    const direction = new THREE.Vector3().subVectors(targetPos, startPos);
    direction.y = 0;
    direction.normalize();

    let mesh;
    const pConfig = config.projectile;

    if (pConfig.isStylizedOrb) {
      // Magic Orb
      const group = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(pConfig.radius || 0.3, 16, 16),
        new THREE.MeshBasicMaterial({ color: pConfig.color || '#ffffff', side: THREE.DoubleSide })
      );
      group.add(core);

      const shell = new THREE.Mesh(
        new THREE.SphereGeometry((pConfig.radius || 0.3) * 1.5, 16, 16),
        new THREE.MeshBasicMaterial({ 
          color: pConfig.shellColor || '#ff0000',
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide
        })
      );
      group.add(shell);
      mesh = group;
    } else if (pConfig.modelUrl) {
      if (!this.projectileTemplates.has(pConfig.modelUrl)) {
        const gltf = await this.loader.loadAsync(pConfig.modelUrl);
        this.projectileTemplates.set(pConfig.modelUrl, gltf.scene);
      }
      mesh = SkeletonUtils.clone(this.projectileTemplates.get(pConfig.modelUrl));
      mesh.scale.setScalar(pConfig.modelScale || 1);
    } else {
      mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    }

    mesh.position.copy(startPos);
    const lookTarget = mesh.position.clone().add(direction);
    mesh.lookAt(lookTarget);
    if (pConfig.modelUrl) mesh.rotateY(Math.PI);

    this.scene.add(mesh);
    this.projectiles.push({
      mesh,
      direction,
      speed: pConfig.speed || 10,
      lifetime: pConfig.lifetime || 2,
      damage: config.damage || 5,
      radius: pConfig.radius || 0.3
    });
  }

  update(delta, player, camera) {
    const playerPosition = player.root.position;
    
    // Update Enemies
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (!enemy.isAlive()) {
        if (!enemy.root.parent) this.enemies.splice(i, 1);
        continue;
      }

      // --- Separation Force (Prevent Clumping) ---
      const separation = new THREE.Vector3();
      let neighbors = 0;
      for (let j = 0; j < this.enemies.length; j++) {
        if (i === j) continue;
        const other = this.enemies[j];
        const dist = enemy.root.position.distanceTo(other.root.position);
        if (dist < 1.5) { // Minimum comfortable distance
          const push = new THREE.Vector3().subVectors(enemy.root.position, other.root.position);
          push.normalize().divideScalar(dist); // Stronger push if closer
          separation.add(push);
          neighbors++;
        }
      }

      if (neighbors > 0) {
        const weight = enemy.config.behavior.separationWeight || 1.0;
        enemy.root.position.addScaledVector(separation, weight * delta);
      }

      enemy.setTarget(player);
      enemy.update(delta, playerPosition, camera);
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifetime -= delta;
      p.mesh.position.addScaledVector(p.direction, p.speed * delta);

      const distToPlayer = p.mesh.position.distanceTo(playerPosition);
      if (distToPlayer < p.radius + player.radius) {
        player.takeDamage(p.damage, p.mesh.position);
        if (this.vfx) this.vfx.spawnImpact(p.mesh.position.clone(), '#ff0000');
        p.lifetime = 0;
      }

      if (p.lifetime <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  getAliveEnemies() {
    return this.enemies.filter(e => e.state !== 'dead');
  }
}
