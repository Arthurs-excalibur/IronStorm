import * as THREE from 'three';

export class FollowCamera {
  constructor(camera) {
    this.camera = camera;
    this.offset = new THREE.Vector3(0, 10, 10);
    this.positionTarget = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();
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

    this.camera.position.lerp(this.positionTarget, smoothing);
    this.camera.lookAt(this.lookTarget);
  }
}
