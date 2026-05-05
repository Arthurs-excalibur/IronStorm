import * as THREE from 'three';

const MELEE_CONE_HALF_ANGLE = THREE.MathUtils.degToRad(40);
const MELEE_HIT_DELAY = 0.1;
const PROJECTILE_LIFETIME = 1.6;
const PROJECTILE_RADIUS = 0.18;

export class AttackSystem {
  constructor({ scene, player, weaponSystem, targets }) {
    this.scene = scene;
    this.player = player;
    this.weaponSystem = weaponSystem;
    this.targets = targets;
    this.projectiles = [];
    this.pendingMeleeHits = [];
    this.cooldownRemaining = 0;
    this.mouseWorldPosition = new THREE.Vector3();
    this.forwardDirection = new THREE.Vector3();
    this.targetOffset = new THREE.Vector3();
    this.projectileGeometry = new THREE.SphereGeometry(PROJECTILE_RADIUS, 10, 10);
    this.projectileMaterial = new THREE.MeshStandardMaterial({
      color: '#ffd67a',
      emissive: '#8a5e10',
      emissiveIntensity: 0.5,
    });
  }

  update(delta, context) {
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining - delta);

    if (context.input.consumePrimaryAttack()) {
      const attackConfig = this.player.getAttackConfig();
      this.performAttack(attackConfig, context);
    }

    this.updatePendingMeleeHits(delta);
    this.updateProjectiles(delta);
  }

  performAttack(config, context) {
    if (!config || this.cooldownRemaining > 0) {
      return;
    }

    this.cooldownRemaining = config.cooldown;
    this.player.attack();

    if (config.type === 'melee') {
      this.doMeleeAttack(config);
      return;
    }

    if (config.type === 'projectile') {
      this.shootProjectile(config, context);
    }
  }

  doMeleeAttack(config) {
    this.weaponSystem.playMeleeAnimation();

    const origin = this.player.root.position.clone();
    const facing = new THREE.Vector3(
      Math.sin(this.player.root.rotation.y),
      0,
      Math.cos(this.player.root.rotation.y),
    );

    this.pendingMeleeHits.push({
      damage: config.damage,
      range: config.range,
      origin,
      facing,
      delayRemaining: MELEE_HIT_DELAY,
    });
  }

  shootProjectile(config, context) {
    const direction = this.getProjectileDirection(context);
    if (direction.lengthSq() === 0) {
      return;
    }

    this.weaponSystem.playProjectileAnimation();

    const projectile = new THREE.Mesh(this.projectileGeometry, this.projectileMaterial);
    projectile.castShadow = true;
    projectile.position.copy(this.weaponSystem.getWeaponTipWorldPosition());
    this.scene.add(projectile);

    this.projectiles.push({
      mesh: projectile,
      direction,
      speed: config.speed,
      damage: config.damage,
      lifeRemaining: PROJECTILE_LIFETIME,
    });
  }

  updatePendingMeleeHits(delta) {
    for (let index = this.pendingMeleeHits.length - 1; index >= 0; index -= 1) {
      const pendingHit = this.pendingMeleeHits[index];
      pendingHit.delayRemaining -= delta;

      if (pendingHit.delayRemaining > 0) {
        continue;
      }

      this.applyMeleeHit(pendingHit);
      this.pendingMeleeHits.splice(index, 1);
    }
  }

  applyMeleeHit({ damage, range, origin, facing }) {
    for (const target of this.targets) {
      if (!target.isAlive()) {
        continue;
      }

      this.targetOffset.copy(target.position).sub(origin);
      this.targetOffset.y = 0;

      const distance = this.targetOffset.length();
      if (distance > range + target.radius) {
        continue;
      }

      this.targetOffset.normalize();
      const angleToTarget = facing.angleTo(this.targetOffset);
      if (angleToTarget <= MELEE_CONE_HALF_ANGLE) {
        target.applyDamage(damage);
      }
    }
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
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];
      projectile.mesh.position.addScaledVector(projectile.direction, projectile.speed * delta);
      projectile.lifeRemaining -= delta;

      const hitTarget = this.targets.find((target) => {
        if (!target.isAlive()) {
          return false;
        }

        const hitDistance = target.position.distanceTo(projectile.mesh.position);
        return hitDistance <= target.radius + PROJECTILE_RADIUS;
      });

      if (hitTarget) {
        hitTarget.applyDamage(projectile.damage);
        this.destroyProjectile(index);
        continue;
      }

      if (projectile.lifeRemaining <= 0) {
        this.destroyProjectile(index);
      }
    }
  }

  destroyProjectile(index) {
    const [projectile] = this.projectiles.splice(index, 1);
    this.scene.remove(projectile.mesh);
  }
}
