import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { WeaponSystem } from '../combat/WeaponSystem.js';
import { resolveWeaponConfig } from '../combat/weaponCatalog.js';

export class Enemy {
  constructor({ scene, config, animationClips, vfx, damageNumbers }) {
    this.scene = scene;
    this.config = config;
    this.animationClips = animationClips;
    this.vfx = vfx;
    this.damageNumbers = damageNumbers;

    this.root = new THREE.Group();
    this.model = null;
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.weaponSystem = new WeaponSystem();

    this.health = config.health;
    this.state = 'idle'; // idle, chase, anticipation, attack, recovery, dead
    this.anticipationTimer = 0;
    this.recoveryTimer = 0;
    this.velocity = new THREE.Vector3();
    this.knockbackVelocity = new THREE.Vector3();
    this.radius = 0.6;
    
    this.target = null;
    this.isInitialized = false;

    this.scene.add(this.root);
    this.createHealthBar();
    this.createDebugHitbox();
  }

  createDebugHitbox() {
    this.debugRing = new THREE.Mesh(
      new THREE.RingGeometry(this.radius * 0.95, this.radius, 32),
      new THREE.MeshBasicMaterial({ color: '#00ff00', side: THREE.DoubleSide })
    );
    this.debugRing.rotation.x = -Math.PI / 2;
    this.debugRing.position.y = 0.05;
    this.root.add(this.debugRing);
  }

  createHealthBar() {
    this.healthBarGroup = new THREE.Group();
    this.healthBarGroup.position.y = 2.2;
    this.root.add(this.healthBarGroup);

    const barBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.12),
      new THREE.MeshBasicMaterial({ 
        color: '#222', 
        depthTest: false,
        depthWrite: false,
        transparent: true 
      }),
    );
    barBg.renderOrder = 999;
    this.healthBarGroup.add(barBg);

    this.healthBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.12),
      new THREE.MeshBasicMaterial({ 
        color: '#cb4848', 
        depthTest: false,
        depthWrite: false,
        transparent: true 
      }),
    );
    this.healthBarFill.renderOrder = 1000;
    this.healthBarFill.position.z = 0.01;
    this.healthBarGroup.add(this.healthBarFill);
  }

  updateHealthBar(camera) {
    if (camera) {
      this.healthBarGroup.quaternion.copy(camera.quaternion);
    }
    const healthRatio = Math.max(0, this.health / this.config.health);
    this.healthBarFill.scale.x = healthRatio;
    this.healthBarFill.position.x = -(1 - healthRatio) * 0.5;
  }

  get position() {
    return this.root.position;
  }

  isAlive() {
    return this.state !== 'dead';
  }

  applyDamage(amount, knockbackSource) {
    this.takeDamage(amount, knockbackSource);
  }

  async init(loader) {
    const gltf = await loader.loadAsync(this.config.modelUrl);
    this.model = SkeletonUtils.clone(gltf.scene);
    this.model.scale.setScalar(1.5);
    
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.root.add(this.model);
    this.setupAnimations();

    // Setup weapon
    if (this.config.weaponId) {
      this.weaponSystem.registerSockets(this.model);
      this.weaponConfig = resolveWeaponConfig(this.config.weaponId);
      await this.weaponSystem.equipWeapon(this.weaponConfig);
    }

    this.isInitialized = true;
  }

  setupAnimations() {
    this.mixer = new THREE.AnimationMixer(this.model);
    this.animationClips.forEach((clip) => {
      const action = this.mixer.clipAction(clip);
      const name = clip.name.toLowerCase();
      
      if (name.includes('idle')) this.actions.idle = action;
      if (name.includes('run')) this.actions.run = action;
      if (name.includes('attack')) this.actions.attack = action;
      if (name.includes('death')) this.actions.death = action;
      if (name.includes('hit') || name.includes('impact')) this.actions.hit = action;
    });

    // Fallback aliases
    if (!this.actions.idle) this.actions.idle = this.mixer.clipAction(this.animationClips.find(c => c.name.toLowerCase().includes('idle_a')) || this.animationClips[0]);
    if (!this.actions.run) this.actions.run = this.mixer.clipAction(this.animationClips.find(c => c.name.toLowerCase().includes('running_a')) || this.animationClips[0]);
    if (!this.actions.attack) this.actions.attack = this.mixer.clipAction(this.animationClips.find(c => c.name.toLowerCase().includes('attack')) || this.animationClips[0]);
    if (!this.actions.death) this.actions.death = this.mixer.clipAction(this.animationClips.find(c => c.name.toLowerCase().includes('death_a')) || this.animationClips[0]);
    if (!this.actions.hit) this.actions.hit = this.mixer.clipAction(this.animationClips.find(c => c.name.toLowerCase().includes('hit_a')) || this.animationClips[0]);

    this.playAnimation('idle');
  }

  playAnimation(name, duration = 0.2) {
    const nextAction = this.actions[name];
    if (!nextAction || nextAction === this.currentAction) return;

    if (this.currentAction) {
      this.currentAction.fadeOut(duration);
    }

    nextAction.reset().fadeIn(duration).play();
    this.currentAction = nextAction;
  }

  setTarget(player) {
    this.target = player;
  }

  update(delta, playerPosition, camera) {
    if (!this.isInitialized || this.state === 'dead') return;

    if (this.mixer) this.mixer.update(delta);
    
    this.updateHealthBar(camera);

    // Apply knockback friction
    this.knockbackVelocity.multiplyScalar(0.9);
    this.root.position.addScaledVector(this.knockbackVelocity, delta);

    const distToPlayer = this.root.position.distanceTo(playerPosition);
    const behavior = this.config.behavior;
    const combat = this.config.combat;

    // AI Logic
    switch (this.state) {
      case 'idle':
        this.playAnimation('idle');
        if (distToPlayer < behavior.aggroRange) this.state = 'chase';
        break;

      case 'chase':
        this.playAnimation('run');
        if (distToPlayer < behavior.fleeRange) {
          this.moveAway(playerPosition, delta);
        } else if (distToPlayer > behavior.optimalRange[1]) {
          this.moveToward(playerPosition, delta);
        } else if (distToPlayer < behavior.optimalRange[0]) {
          this.moveAway(playerPosition, delta * 0.5);
        } else {
          this.state = 'anticipation';
          this.anticipationTimer = combat.anticipationTime;
        }
        break;

      case 'anticipation':
        this.playAnimation('idle');
        // Visual Telegraph: Vibration
        this.model.position.x = (Math.random() - 0.5) * 0.05;
        this.model.position.z = (Math.random() - 0.5) * 0.05;
        this.root.scale.setScalar(1 + Math.sin(Date.now() * 0.02) * 0.05);

        this.anticipationTimer -= delta;
        if (this.anticipationTimer <= 0) {
          this.model.position.set(0, 0, 0);
          this.root.scale.setScalar(1);
          this.performAttack(playerPosition);
          this.state = 'recovery';
          this.recoveryTimer = combat.recoveryTime;
        }
        break;

      case 'recovery':
        this.playAnimation('idle');
        this.recoveryTimer -= delta;
        if (this.recoveryTimer <= 0) {
          this.state = 'chase';
        }
        break;
    }

    // Face the player (only if not dead or in recovery/anticipation depending on feel)
    if (this.state !== 'dead') {
      const lookPos = playerPosition.clone();
      lookPos.y = this.root.position.y;
      this.root.lookAt(lookPos);
    }

    if (this.weaponSystem) {
      this.weaponSystem.update(delta);
    }
  }

  moveAway(targetPos, delta) {
    const direction = new THREE.Vector3().subVectors(this.root.position, targetPos);
    direction.y = 0;
    direction.normalize();
    this.root.position.addScaledVector(direction, this.config.speed * delta);
  }

  moveToward(targetPos, delta) {
    const direction = new THREE.Vector3().subVectors(targetPos, this.root.position);
    direction.y = 0;
    direction.normalize();
    
    this.root.position.addScaledVector(direction, this.config.speed * delta);
  }

  performAttack(playerPosition) {
    // Play attack animation
    const attackAction = this.actions.attack;
    if (attackAction) {
      attackAction.reset().setLoop(THREE.LoopOnce).play();
    }

    if (this.config.type === 'melee') {
      this.weaponSystem.playMeleeAnimation();
    } else {
      this.weaponSystem.playProjectileAnimation();
    }

    // Immediate damage or projectile since anticipation already happened
    if (this.config.type === 'melee') {
      const currentDist = this.root.position.distanceTo(playerPosition);
      if (currentDist <= this.config.attackRange * 1.3) {
        this.applyDamageToPlayer();
      }
    } else {
      this.spawnProjectile(playerPosition);
    }
  }

  spawnProjectile(targetPos) {
    const tipPos = this.weaponSystem.getWeaponTipWorldPosition();

    if (this.vfx) {
      const color = this.config.id === 'skeleton_mage' ? '#ff0000' : '#ffaa00';
      this.vfx.spawnMuzzleFlash(tipPos, color);
    }

    if (this.enemyManager && this.weaponConfig) {
      this.enemyManager.spawnEnemyProjectile(this.weaponConfig, tipPos, targetPos);
    }
  }

  applyDamageToPlayer() {
    if (this.target && typeof this.target.takeDamage === 'function') {
      this.target.takeDamage(this.config.damage);
    }

    if (this.vfx) {
      this.vfx.spawnImpact(this.target.root.position.clone().add(new THREE.Vector3(0, 1.2, 0)), '#ff0000');
    }
  }

  takeDamage(amount, knockbackSource) {
    if (this.state === 'dead') return;

    this.health -= amount;
    if (this.damageNumbers) {
      this.damageNumbers.spawn(this.root.position.clone(), amount, '#ffffff');
    }

    // Play hit animation
    if (this.actions.hit) {
      this.actions.hit.reset().setLoop(THREE.LoopOnce).play();
    }

    // Apply physical knockback
    if (knockbackSource) {
      const dir = new THREE.Vector3().subVectors(this.root.position, knockbackSource);
      dir.y = 0;
      dir.normalize();
      this.knockbackVelocity.addScaledVector(dir, 15); // Add impulse
    }

    if (this.health <= 0) {
      this.die();
    } else {
      // Small flinch squash/stretch
      this.root.scale.set(1.2, 0.8, 1.2);
      setTimeout(() => {
        if (this.state !== 'dead') this.root.scale.set(1, 1, 1);
      }, 100);
    }
  }

  die() {
    this.state = 'dead';
    this.playAnimation('death', 0.1);
    if (this.actions.death) {
      this.actions.death.clampWhenFinished = true;
      this.actions.death.setLoop(THREE.LoopOnce);
    }

    if (this.healthBarGroup) {
      this.healthBarGroup.visible = false;
    }

    // Fade out and remove after animation
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone(); // Clone to avoid affecting other instances
        child.material.transparent = true;
      }
    });

    let opacity = 1.0;
    const fade = () => {
      opacity -= 0.015;
      this.model.traverse((child) => {
        if (child.isMesh) child.material.opacity = opacity;
      });
      if (opacity > 0) {
        requestAnimationFrame(fade);
      } else {
        this.scene.remove(this.root);
      }
    };
    
    // Start fade after death animation has played for a bit
    setTimeout(fade, 1500);
  }
}
