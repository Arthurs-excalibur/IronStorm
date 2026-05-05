import * as THREE from 'three';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Map();
    this.pointerNdc = new THREE.Vector2();
    this.primaryAttackQueued = false;

    window.addEventListener('keydown', (event) => {
      this.keys.set(event.code, true);
    });

    window.addEventListener('keyup', (event) => {
      this.keys.set(event.code, false);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
    });

    window.addEventListener('pointermove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    });

    window.addEventListener('pointerdown', (event) => {
      if (event.button === 0) {
        this.primaryAttackQueued = true;
      }
    });
  }

  getMovementVector() {
    const horizontal = (this.isPressed('KeyD') ? 1 : 0) - (this.isPressed('KeyA') ? 1 : 0);
    const vertical = (this.isPressed('KeyS') ? 1 : 0) - (this.isPressed('KeyW') ? 1 : 0);
    return new THREE.Vector2(horizontal, vertical);
  }

  isPressed(code) {
    return this.keys.get(code) === true;
  }

  consumePrimaryAttack() {
    const shouldAttack = this.primaryAttackQueued;
    this.primaryAttackQueued = false;
    return shouldAttack;
  }
}
