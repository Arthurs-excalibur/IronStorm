import * as THREE from 'three';

export class DamageNumbers {
  constructor(scene) {
    this.scene = scene;
    this.popups = [];
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 128;
    this.canvas.height = 128;
  }

  spawn(position, amount, color = '#ffffff') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 64;

    // Draw text
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(amount.toString(), 64, 32);
    ctx.fillText(amount.toString(), 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    sprite.position.copy(position);
    sprite.position.y += 1.0;
    sprite.scale.set(1.5, 0.75, 1);
    
    this.scene.add(sprite);

    this.popups.push({
      sprite,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 1.5, 3 + Math.random() * 2, (Math.random() - 0.5) * 1.5),
      life: 0.8,
      initialLife: 0.8
    });
  }

  update(delta, camera) {
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.scene.remove(p.sprite);
        p.sprite.material.map.dispose();
        p.sprite.material.dispose();
        this.popups.splice(i, 1);
        continue;
      }

      // Physics
      p.sprite.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 8 * delta; // Gravity

      // Animation
      const progress = p.life / p.initialLife;
      p.sprite.material.opacity = progress;
      p.sprite.scale.setScalar(0.5 + progress * 1.0);
    }
  }
}
