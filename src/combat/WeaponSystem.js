import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { WeaponAnimator } from './WeaponAnimator.js';

export class WeaponSystem {
  constructor() {
    this.loader = new GLTFLoader();
    this.weaponCache = new Map();
    this.sockets = new Map(); // Cached bone/socket references
    this.activeWeapon = null;
    this.weaponPivot = null;
    this.weaponTip = null;
    this.activeWeaponConfig = null;
    this.animator = new WeaponAnimator();
    this.worldTipPosition = new THREE.Vector3();
  }

  /**
   * Scans the model for potential sockets and caches them.
   * Call this whenever a new character model is loaded.
   */
  registerSockets(characterModel) {
    this.sockets.clear();
    characterModel.traverse((node) => {
      // Prioritize explicit "slot" nodes or bones
      if (node.isBone || node.name.toLowerCase().includes('slot')) {
        this.sockets.set(node.name.toLowerCase(), node);
      }
    });
  }

  async equipWeapon(weaponConfig) {
    this.detachWeapon();
    this.activeWeaponConfig = weaponConfig;

    if (!weaponConfig || !weaponConfig.alignment) {
      return;
    }

    const { alignment } = weaponConfig;
    const attachmentTarget = this.resolveSocket(alignment.handBoneName);
    
    if (!attachmentTarget) {
      console.warn(`Weapon socket "${alignment.handBoneName}" not found. Weapon may not attach correctly.`);
      return;
    }

    const template = await this.loadWeaponModel(weaponConfig.modelUrl);
    this.activeWeapon = SkeletonUtils.clone(template);
    this.prepareModel(this.activeWeapon);

    // Create a pivot for alignment
    this.weaponPivot = new THREE.Group();
    this.weaponPivot.position.fromArray(alignment.gripPosition ?? [0, 0, 0]);
    this.weaponPivot.rotation.set(...alignment.gripRotation);
    this.weaponPivot.scale.setScalar(alignment.gripScale);
    attachmentTarget.add(this.weaponPivot);

    // Position the weapon so the grip anchor is at the pivot center
    const weaponBounds = new THREE.Box3().setFromObject(this.activeWeapon);
    const weaponSize = weaponBounds.getSize(new THREE.Vector3());
    const gripAnchor = new THREE.Vector3().fromArray(alignment.gripAnchor ?? [0.5, 0, 0.5]);
    const gripPoint = new THREE.Vector3(
      weaponBounds.min.x + weaponSize.x * gripAnchor.x,
      weaponBounds.min.y + weaponSize.y * gripAnchor.y,
      weaponBounds.min.z + weaponSize.z * gripAnchor.z,
    );
    this.activeWeapon.position.set(-gripPoint.x, -gripPoint.y, -gripPoint.z);
    
    const holdOffset = new THREE.Vector3().fromArray(alignment.holdOffset ?? [0, 0, 0]);
    this.activeWeapon.position.add(holdOffset);
    
    this.weaponPivot.add(this.activeWeapon);

    // Create the tip/muzzle point
    this.weaponTip = new THREE.Object3D();
    this.weaponTip.position.fromArray(alignment.tipPosition);
    this.weaponPivot.add(this.weaponTip);

    this.animator.setPivot(this.weaponPivot);
  }

  resolveSocket(name) {
    if (!name) return null;
    const n = name.toLowerCase().replace('_', '.'); // Normalize common separators
    
    // 1. Direct match
    if (this.sockets.has(n)) return this.sockets.get(n);
    
    // 2. Exact match with original name
    if (this.sockets.has(name.toLowerCase())) return this.sockets.get(name.toLowerCase());

    // 3. Fuzzy match (e.g. "hand.r" -> "handslot.r")
    for (const [key, socket] of this.sockets) {
      if (key.includes(n) || n.includes(key)) return socket;
    }

    // 4. Ultimate fallback: find any bone with "hand" and "r" or "l"
    const side = n.includes('.r') || n.includes('_r') || n.includes('right') ? 'r' : 'l';
    for (const [key, socket] of this.sockets) {
      if (key.includes('hand') && (key.includes('.' + side) || key.includes('_' + side) || key.endsWith(side))) {
        return socket;
      }
    }

    return null;
  }

  update(delta) {
    this.animator.update(delta);
  }

  getWeaponTipWorldPosition() {
    if (!this.weaponTip) {
      return this.worldTipPosition.set(0, 1.2, 0); // Default to chest height
    }
    // Ensure matrix is up to date before getting world position
    this.weaponTip.updateMatrixWorld(true);
    return this.weaponTip.getWorldPosition(this.worldTipPosition);
  }

  playMeleeAnimation() {
    this.animator.playMeleeSwing();
  }

  playProjectileAnimation() {
    this.animator.playProjectileCast();
  }

  detachWeapon() {
    if (this.weaponPivot?.parent) {
      this.weaponPivot.parent.remove(this.weaponPivot);
    }
    this.activeWeapon = null;
    this.weaponPivot = null;
    this.weaponTip = null;
    this.activeWeaponConfig = null;
    this.animator.setPivot(null);
  }

  async loadWeaponModel(modelUrl) {
    if (!this.weaponCache.has(modelUrl)) {
      const gltf = await this.loader.loadAsync(modelUrl);
      this.weaponCache.set(modelUrl, gltf.scene);
    }
    return this.weaponCache.get(modelUrl);
  }

  prepareModel(model) {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }
}
