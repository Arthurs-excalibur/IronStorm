import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export class AttackSystem {
  constructor({ scene, player, weaponSystem, targets, vfx, damageNumbers, camera }) {
    this.scene = scene;
    this.player = player;
    this.weaponSystem = weaponSystem;
    this.targets = targets;
    this.vfx = vfx;
    this.damageNumbers = damageNumbers;
    this.camera = camera;
    this.onHit = arguments[0].onHit;
    this.props = arguments[0].props || []; 
    this.projectiles = [];
    this.pendingMeleeHits = [];
    this.pendingProjectiles = [];
    this.cooldownRemaining = 0;
    this.mouseWorldPosition = new THREE.Vector3();
    this.forwardDirection = new THREE.Vector3();
    this.targetOffset = new THREE.Vector3();
    this.projectileGeometry = new THREE.SphereGeometry(1, 10, 10);
    this.loader = new GLTFLoader();
    this.projectileCache = new Map();
  }

  update(delta, context) {
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining - delta);

    if (context.input.consumePrimaryAttack()) {
      const attackConfig = this.player.getAttackConfig();
      this.performAttack(attackConfig, context);
    }

    this.updatePendingMeleeHits(delta);
    this.updatePendingProjectiles(delta);
    this.updateProjectiles(delta);
  }

  performAttack(config, context) {
    if (!config || this.cooldownRemaining > 0) {
      return;
    }

    this.cooldownRemaining = config.cooldown;
    this.player.attack();

    // Muzzle Flash
    if (this.vfx) {
      this.vfx.spawnMuzzleFlash(this.weaponSystem.getWeaponTipWorldPosition());
    }

    const animationDuration = this.player.animation.getCurrentActionDuration();
    
    if (config.type === 'melee') {
      const impactTime = config.melee.impactTime ?? 0.45;
      const delay = animationDuration * impactTime;
      this.doMeleeAttack(config, delay);
      return;
    }

    if (config.type === 'projectile') {
      const impactTime = config.projectile.impactTime ?? 0.4;
      const delay = animationDuration * impactTime;
      this.queueProjectile(config, context, delay);
    }
  }

  doMeleeAttack(config, delay) {
    this.weaponSystem.playMeleeAnimation();

    this.pendingMeleeHits.push({
      damage: config.damage,
      range: config.melee.range,
      coneAngle: config.melee.coneAngle,
      delayRemaining: delay,
    });
  }

  updatePendingMeleeHits(delta) {
    for (let i = this.pendingMeleeHits.length - 1; i >= 0; i--) {
      const hit = this.pendingMeleeHits[i];
      hit.delayRemaining -= delta;

      if (hit.delayRemaining <= 0) {
        // --- IMPROVED: Capture current player state for the hit ---
        const currentOrigin = this.player.root.position.clone();
        const currentFacing = new THREE.Vector3(
          Math.sin(this.player.root.rotation.y),
          0,
          Math.cos(this.player.root.rotation.y),
        );

        this.resolveMeleeHit(hit, currentOrigin, currentFacing);
        this.pendingMeleeHits.splice(i, 1);
      }
    }
  }

  resolveMeleeHit(hit, origin, facing) {
    this.showDebugHitbox(origin, facing, hit.range, hit.coneAngle);
    
    let hitAny = false;
    this.targets.forEach((target) => {
      if (!target.isAlive()) return;

      this.targetOffset.subVectors(target.position, origin);
      this.targetOffset.y = 0;
      const distance = this.targetOffset.length();

      if (distance <= hit.range + target.radius) {
        this.targetOffset.normalize();
        const dot = this.targetOffset.dot(facing);

        if (dot >= Math.cos(hit.coneAngle / 2)) {
          target.applyDamage(hit.damage, this.player.root.position);
          hitAny = true;
          
          if (this.damageNumbers) {
            this.damageNumbers.spawn(target.position.clone(), hit.damage, '#ffcc00');
          }
          
          if (this.vfx) {
            this.vfx.spawnImpact(target.position.clone().add(new THREE.Vector3(0, 1, 0)), '#ff4400');
          }
        }
      }
    });

    // --- Prop Collision ---
    this.props.forEach((prop) => {
      if (!prop.isAlive()) return;
      this.targetOffset.subVectors(prop.position, origin);
      this.targetOffset.y = 0;
      const distance = this.targetOffset.length();
      if (distance <= hit.range + prop.radius) {
        this.targetOffset.normalize();
        const dot = this.targetOffset.dot(facing);
        if (dot >= Math.cos(hit.coneAngle / 2)) {
          prop.applyDamage(hit.damage);
          hitAny = true;
          if (this.vfx) this.vfx.spawnImpact(prop.position.clone().add(new THREE.Vector3(0, 0.5, 0)), '#8d6e63');
        }
      }
    });

    if (hitAny) {
      if (this.camera) this.camera.shake(1.2, 0.25); // Significantly boosted (was 0.4, 0.15)
      if (this.onHit) this.onHit(0.1); // 100ms hitstop
    }
  }

  queueProjectile(config, context, delay) {
    this.weaponSystem.playProjectileAnimation();
    const direction = this.getProjectileDirection(context);
    
    this.pendingProjectiles.push({
      config,
      direction,
      delayRemaining: delay,
    });
  }

  updatePendingProjectiles(delta) {
    for (let i = this.pendingProjectiles.length - 1; i >= 0; i--) {
      const pending = this.pendingProjectiles[i];
      pending.delayRemaining -= delta;

      if (pending.delayRemaining <= 0) {
        this.createProjectile(pending.config, pending.direction);
        this.pendingProjectiles.splice(i, 1);
      }
    }
  }

  async createProjectile(config, direction) {
    let projectile;

    if (config.projectile.modelUrl) {
      const template = await this.loadProjectileModel(config.projectile.modelUrl);
      projectile = SkeletonUtils.clone(template);
      projectile.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
        }
      });
      projectile.scale.setScalar(config.projectile.modelScale || 1.0);
    } else if (config.projectile.isStylizedOrb) {
      const coreColor = config.projectile.color || '#ffffff';
      const shellColor = config.projectile.shellColor || '#4488ff';

      const coreMaterial = new THREE.MeshBasicMaterial({ color: coreColor });
      const shellMaterial = new THREE.MeshBasicMaterial({
        color: shellColor,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
      });

      projectile = new THREE.Group();
      const core = new THREE.Mesh(this.projectileGeometry, coreMaterial);
      core.scale.setScalar(0.5);

      const shell = new THREE.Mesh(this.projectileGeometry, shellMaterial);
      shell.scale.setScalar(1.0);

      projectile.add(core);
      projectile.add(shell);
    } else {
      projectile = new THREE.Mesh(
        this.projectileGeometry,
        new THREE.MeshStandardMaterial({
          color: config.projectile.color || '#ffd67a',
          emissive: config.projectile.color || '#8a5e10',
          emissiveIntensity: 0.8,
        }),
      );
      projectile.scale.setScalar(config.projectile.radius || 0.2);
    }

    const tipPos = this.weaponSystem.getWeaponTipWorldPosition();
    projectile.position.copy(tipPos);

    if (direction.lengthSq() > 0) {
      const targetPos = projectile.position.clone().add(direction);
      projectile.lookAt(targetPos);
    }

    this.scene.add(projectile);

    this.projectiles.push({
      mesh: projectile,
      direction: direction.clone().normalize(),
      speed: config.projectile.speed,
      lifetime: config.projectile.lifetime,
      damage: config.damage,
      radius: config.projectile.radius || 0.2,
      config: config.projectile,
      timeAlive: 0
    });
  }

  async loadProjectileModel(url) {
    if (!this.projectileCache.has(url)) {
      const gltf = await this.loader.loadAsync(url);
      this.projectileCache.set(url, gltf.scene);
    }
    return this.projectileCache.get(url);
  }

  getProjectileDirection({ input, raycaster, camera, groundPlane }) {
    raycaster.setFromCamera(input.pointerNdc, camera);

    if (raycaster.ray.intersectPlane(groundPlane, this.mouseWorldPosition)) {
      const direction = this.mouseWorldPosition.sub(this.player.root.position);
      direction.y = 0;
      if (direction.lengthSq() > 0.0001) {
        return direction.normalize().clone();
      }
    }

    return new THREE.Vector3(
      Math.sin(this.player.root.rotation.y),
      0,
      Math.cos(this.player.root.rotation.y),
    );
  }

  updateProjectiles(delta) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifetime -= delta;
      p.timeAlive += delta;

      if (p.lifetime <= 0) {
        this.removeProjectile(i);
        continue;
      }

      p.mesh.position.addScaledVector(p.direction, p.speed * delta);

      // Stylized pulse effect
      if (p.config.isStylizedOrb) {
        const pulse = 1.0 + Math.sin(p.timeAlive * 15) * 0.15;
        p.mesh.scale.setScalar(pulse);
      }

      // Collision Check
      let hit = false;
      this.targets.forEach((target) => {
        if (!target.isAlive() || hit) return;

        const distance = p.mesh.position.distanceTo(target.position.clone().add(new THREE.Vector3(0, 0.8, 0)));
        if (distance < p.radius + target.radius) {
          target.applyDamage(p.damage, this.player.root.position);
          
          if (this.damageNumbers) {
            this.damageNumbers.spawn(p.mesh.position.clone(), p.damage, '#ffdd44');
          }

          if (this.vfx) {
            const impactColor = p.config.shellColor || p.config.color || '#fff000';
            this.vfx.spawnImpact(p.mesh.position, impactColor, 8);
          }
          if (this.camera) {
            this.camera.shake(0.8, 0.2); // Boosted (was 0.3, 0.12)
          }
          if (this.onHit) {
            this.onHit(0.06); // 60ms hitstop
          }
          
          hit = true;
        }
      });

      // Check Props
      this.props.forEach((prop) => {
        if (!prop.isAlive() || hit) return;
        const distance = p.mesh.position.distanceTo(prop.position.clone().add(new THREE.Vector3(0, 0.5, 0)));
        if (distance < p.radius + prop.radius) {
          prop.applyDamage(p.damage);
          if (this.vfx) this.vfx.spawnImpact(p.mesh.position, '#8d6e63', 8);
          if (this.camera) this.camera.shake(0.8, 0.2);
          if (this.onHit) this.onHit(0.06);
          hit = true;
        }
      });

      if (hit) {
        this.removeProjectile(i);
      }
    }
  }

  showDebugHitbox(origin, facing, range, coneAngle) {
    const geometry = new THREE.CircleGeometry(range, 20, -coneAngle / 2, coneAngle);
    const material = new THREE.MeshBasicMaterial({ 
      color: '#ff0000', 
      transparent: true, 
      opacity: 0.3, 
      side: THREE.DoubleSide 
    });
    const debugMesh = new THREE.Mesh(geometry, material);
    
    debugMesh.position.copy(origin);
    debugMesh.position.y = 0.5; // Slightly above ground
    debugMesh.rotation.x = -Math.PI / 2;
    
    // Rotate to match facing
    const rotationY = Math.atan2(facing.x, facing.z);
    debugMesh.rotation.z = -rotationY + Math.PI / 2; // Adjust for CircleGeometry orientation
    
    this.scene.add(debugMesh);
    
    // Remove after a short duration
    setTimeout(() => {
      this.scene.remove(debugMesh);
      geometry.dispose();
      material.dispose();
    }, 200);
  }

  removeProjectile(index) {
    const p = this.projectiles[index];
    this.scene.remove(p.mesh);
    this.projectiles.splice(index, 1);
  }
}
