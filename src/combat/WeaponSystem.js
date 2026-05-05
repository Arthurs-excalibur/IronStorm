import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { WeaponAnimator } from './WeaponAnimator.js';

export class WeaponSystem {
  constructor() {
    this.loader = new GLTFLoader();
    this.weaponCache = new Map();
    this.weaponRoot = null;
    this.weaponPivot = null;
    this.weaponTip = null;
    this.activeWeaponConfig = null;
    this.animator = new WeaponAnimator();
    this.worldTipPosition = new THREE.Vector3();
  }

  async equipWeapon(characterModel, weaponConfig) {
    this.detachWeapon();
    this.activeWeaponConfig = weaponConfig;

    if (!characterModel || !weaponConfig) {
      return;
    }

    const handBone = this.resolveHandBone(characterModel, weaponConfig.handBoneName);
    if (!handBone) {
      console.warn(
        `Weapon hand bone not found for "${weaponConfig.handBoneName}". Attaching to character root instead.`,
      );
    }

    const attachmentTarget = handBone ?? characterModel;
    const template = await this.loadWeaponModel(weaponConfig.modelUrl);
    this.weaponRoot = SkeletonUtils.clone(template);
    this.prepareModel(this.weaponRoot);

    this.weaponPivot = new THREE.Group();
    this.weaponPivot.position.fromArray(weaponConfig.gripPosition ?? [0, 0, 0]);
    this.weaponPivot.rotation.set(...weaponConfig.gripRotation);
    this.weaponPivot.scale.setScalar(weaponConfig.gripScale);
    attachmentTarget.add(this.weaponPivot);

    const weaponBounds = new THREE.Box3().setFromObject(this.weaponRoot);
    const weaponSize = weaponBounds.getSize(new THREE.Vector3());
    const gripAnchor = new THREE.Vector3().fromArray(weaponConfig.gripAnchor ?? [0.5, 0, 0.5]);
    const gripPoint = new THREE.Vector3(
      weaponBounds.min.x + weaponSize.x * gripAnchor.x,
      weaponBounds.min.y + weaponSize.y * gripAnchor.y,
      weaponBounds.min.z + weaponSize.z * gripAnchor.z,
    );
    this.weaponRoot.position.set(-gripPoint.x, -gripPoint.y, -gripPoint.z);
    this.weaponPivot.add(this.weaponRoot);

    const holdOffset = new THREE.Vector3().fromArray(weaponConfig.holdOffset ?? [0, 0, 0]);
    this.weaponRoot.position.add(holdOffset);

    this.weaponTip = new THREE.Object3D();
    this.weaponTip.position.fromArray(weaponConfig.tipPosition);
    this.weaponPivot.add(this.weaponTip);
    this.animator.setPivot(this.weaponPivot);
  }

  update(delta) {
    this.animator.update(delta);
  }

  getActiveWeapon() {
    return this.activeWeaponConfig;
  }

  getWeaponTipWorldPosition() {
    if (!this.weaponTip) {
      return this.worldTipPosition.set(0, 1, 0);
    }

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

    this.weaponRoot = null;
    this.weaponPivot = null;
    this.weaponTip = null;
    this.animator.setPivot(new THREE.Group());
    this.activeWeaponConfig = null;
  }

  resolveHandBone(characterModel, preferredBoneName) {
    if (!characterModel) return null;

    const bones = [];
    const others = [];
    
    characterModel.traverse((node) => {
      if (node.isBone) bones.push(node);
      else if (!node.isMesh) others.push(node);
    });

    const isMatch = (name) => {
      if (!name) return false;
      const n = name.toLowerCase();
      return n === 'handslot.r' || n === 'hand.r' || n === 'handslot_r' || n === 'hand_r' || 
             (n.includes('hand') && (n.endsWith('.r') || n.endsWith('_r') || n.includes('right')));
    };

    // 1. Check Bones first (highest priority)
    let found = bones.find(b => isMatch(b.name));
    if (found) return found;

    // 2. Check other non-mesh nodes (like Groups or Object3Ds)
    found = others.find(o => isMatch(o.name));
    if (found) return found;

    // 3. Last resort: any node that contains "hand" and "r"
    characterModel.traverse((node) => {
      if (found || !node.name) return;
      const n = node.name.toLowerCase();
      if (n.includes('hand') && n.includes('r')) {
        found = node;
      }
    });

    return found;
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
