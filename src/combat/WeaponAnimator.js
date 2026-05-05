import * as THREE from 'three';

export class WeaponAnimator {
  constructor() {
    this.pivot = null;
    this.defaultPosition = new THREE.Vector3();
    this.defaultRotation = new THREE.Euler();
    this.activeMotion = null;
  }

  setPivot(pivot) {
    this.pivot = pivot;
    this.defaultPosition.copy(pivot.position);
    this.defaultRotation.copy(pivot.rotation);
    this.activeMotion = null;
  }

  playMeleeSwing() {
    this.activeMotion = {
      type: 'melee',
      elapsed: 0,
      duration: 0.2,
    };
  }

  playProjectileCast() {
    this.activeMotion = {
      type: 'projectile',
      elapsed: 0,
      duration: 0.16,
    };
  }

  update(delta) {
    if (!this.pivot) {
      return;
    }

    if (!this.activeMotion) {
      this.restoreDefault(1);
      return;
    }

    this.activeMotion.elapsed += delta;
    const progress = Math.min(this.activeMotion.elapsed / this.activeMotion.duration, 1);
    this.restoreDefault(1);

    if (this.activeMotion.type === 'melee') {
      const swingCurve = Math.sin(progress * Math.PI);
      this.pivot.rotation.z = this.defaultRotation.z + swingCurve * 1.05;
      this.pivot.rotation.x = this.defaultRotation.x - swingCurve * 0.25;
    } else if (this.activeMotion.type === 'projectile') {
      const recoilCurve = Math.sin(progress * Math.PI);
      this.pivot.position.x = this.defaultPosition.x - recoilCurve * 0.14;
      this.pivot.rotation.y = this.defaultRotation.y + recoilCurve * 0.18;
    }

    if (progress >= 1) {
      this.activeMotion = null;
      this.restoreDefault(1);
    }
  }

  restoreDefault(alpha) {
    this.pivot.position.lerp(this.defaultPosition, alpha);
    this.pivot.rotation.x = THREE.MathUtils.lerp(this.pivot.rotation.x, this.defaultRotation.x, alpha);
    this.pivot.rotation.y = THREE.MathUtils.lerp(this.pivot.rotation.y, this.defaultRotation.y, alpha);
    this.pivot.rotation.z = THREE.MathUtils.lerp(this.pivot.rotation.z, this.defaultRotation.z, alpha);
  }
}
