import * as THREE from 'three';

export class FollowCamera {
  constructor(camera) {
    this.camera = camera;
    this.offset = new THREE.Vector3(0, 10, 10);
    this.positionTarget = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();
    
    // Juice: Screen Shake
    this.shakeAmount = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeOffset = new THREE.Vector3();
  }

  shake(intensity = 0.35, duration = 0.18) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeAmount = duration;
  }

  snapTo(playerPosition) {
    this.positionTarget.copy(playerPosition).add(this.offset);
    this.lookTarget.copy(playerPosition);
    this.lookTarget.y += 1.4;
    this.camera.position.copy(this.positionTarget);
    this.camera.lookAt(this.lookTarget);
  }

  update(delta, playerPosition) {
    const smoothing = 1 - Math.exp(-delta * 7.5);
    this.positionTarget.copy(playerPosition).add(this.offset);
    this.lookTarget.copy(playerPosition);
    this.lookTarget.y += 1.4;

    // Apply Shake
    this.shakeOffset.set(0, 0, 0);
    if (this.shakeAmount > 0) {
      this.shakeAmount -= delta;
      const progress = this.shakeAmount / this.shakeDuration;
      const power = this.shakeIntensity * progress;
      this.shakeOffset.set(
        (Math.random() - 0.5) * 2 * power,
        (Math.random() - 0.5) * 2 * power,
        (Math.random() - 0.5) * 2 * power
      );
    }

    this.camera.position.lerp(this.positionTarget, smoothing).add(this.shakeOffset);
    this.camera.lookAt(this.lookTarget.clone().add(this.shakeOffset.multiplyScalar(0.3)));
  }
}
