import * as THREE from 'three';

export class PlayerController {
  constructor(playerRoot, animation) {
    this.playerRoot = playerRoot;
    this.animation = animation;
    this.velocity = new THREE.Vector3();
    this.moveDirection = new THREE.Vector3();
    this.mouseWorldPosition = new THREE.Vector3();
    this.speed = 5.75;
    this.rotationSharpness = 14;
    this.isMoving = false;
    this.isLocked = false;
    this.targetRotation = playerRoot.rotation.y;
  }

  lock() {
    this.isLocked = true;
  }

  unlock() {
    this.isLocked = false;
  }

  setAnimation(animation) {
    this.animation = animation;
  }

  update(delta, context) {
    if (this.isLocked) {
      this.isMoving = false;
      this.velocity.set(0, 0, 0);
      this.updateRotation(delta, context);
      this.updateAnimation(delta);
      return;
    }

    const movementInput = context.input.getMovementVector();
    this.updateMovement(delta, movementInput);
    this.updateRotation(delta, context);
    this.updateAnimation(delta);
  }

  updateMovement(delta, movementInput) {
    this.moveDirection.set(movementInput.x, 0, movementInput.y);
    this.isMoving = this.moveDirection.lengthSq() > 0;

    if (this.isMoving) {
      this.moveDirection.normalize();
      this.velocity.copy(this.moveDirection).multiplyScalar(this.speed);
      this.playerRoot.position.addScaledVector(this.velocity, delta);
      this.targetRotation = Math.atan2(this.moveDirection.x, this.moveDirection.z);
      return;
    }

    this.velocity.set(0, 0, 0);
  }

  updateRotation(delta, context) {
    if (!this.isMoving) {
      const hasMouseTarget = this.getMouseTarget(context);
      if (hasMouseTarget) {
        const toMouse = this.mouseWorldPosition.sub(this.playerRoot.position);
        toMouse.y = 0;

        if (toMouse.lengthSq() > 0.0001) {
          this.targetRotation = Math.atan2(toMouse.x, toMouse.z);
        }
      }
    }

    const rotationAlpha = 1 - Math.exp(-delta * this.rotationSharpness);
    this.playerRoot.rotation.y = THREE.MathUtils.euclideanModulo(
      this.playerRoot.rotation.y,
      Math.PI * 2,
    );
    this.targetRotation = THREE.MathUtils.euclideanModulo(this.targetRotation, Math.PI * 2);

    let angleDelta = this.targetRotation - this.playerRoot.rotation.y;
    if (angleDelta > Math.PI) {
      angleDelta -= Math.PI * 2;
    } else if (angleDelta < -Math.PI) {
      angleDelta += Math.PI * 2;
    }

    this.playerRoot.rotation.y += angleDelta * rotationAlpha;
  }

  getMouseTarget({ input, raycaster, camera, groundPlane }) {
    raycaster.setFromCamera(input.pointerNdc, camera);
    return raycaster.ray.intersectPlane(groundPlane, this.mouseWorldPosition) !== null;
  }

  updateAnimation(delta) {
    if (!this.animation) {
      return;
    }

    this.animation.play(this.isMoving ? 'run' : 'idle');
    this.animation.update(delta);
  }
}
