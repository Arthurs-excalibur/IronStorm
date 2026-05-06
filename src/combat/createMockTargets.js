import * as THREE from 'three';

class MockTarget {
  constructor({ scene, position, color = '#cb5548' }) {
    this.scene = scene;
    this.position = position.clone();
    this.maxHealth = 60;
    this.health = this.maxHealth;
    this.radius = 0.65;
    this.respawnTimer = 0;
    this.respawnDelay = 3.0;
    this.velocity = new THREE.Vector3(); // For knockback
    this.friction = 8.0;
    
    this.mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.72, 1.6, 10),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.9,
        metalness: 0.08,
      }),
    );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.copy(this.position);
    this.mesh.position.y = 0.8;
    scene.add(this.mesh);

    // Health Bar UI
    this.healthBarGroup = new THREE.Group();
    this.healthBarGroup.position.copy(this.mesh.position);
    this.healthBarGroup.position.y += 1.2;
    scene.add(this.healthBarGroup);

    const barBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.12),
      new THREE.MeshBasicMaterial({ color: '#222', side: THREE.DoubleSide }),
    );
    this.healthBarGroup.add(barBg);

    this.healthBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.12),
      new THREE.MeshBasicMaterial({ color: '#48cb64', side: THREE.DoubleSide }),
    );
    this.healthBarFill.position.z = 0.01;
    this.healthBarGroup.add(this.healthBarFill);
  }

  isAlive() {
    return this.health > 0;
  }

  update(delta, camera) {
    if (this.health <= 0) {
      this.respawnTimer += delta;
      if (this.respawnTimer >= this.respawnDelay) {
        this.respawn();
      }
      return;
    }

    // Apply knockback velocity
    if (this.velocity.lengthSq() > 0.001) {
      this.position.addScaledVector(this.velocity, delta);
      this.velocity.addScaledVector(this.velocity, -this.friction * delta);
      this.mesh.position.copy(this.position);
      this.mesh.position.y = 0.8;
      this.healthBarGroup.position.copy(this.mesh.position);
      this.healthBarGroup.position.y += 1.2;
    }

    // Billboard health bar
    if (camera) {
      this.healthBarGroup.quaternion.copy(camera.quaternion);
    }

    // Smoothly return to base scale (flinch recovery)
    this.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 1 - Math.exp(-delta * 10));
  }

  respawn() {
    this.health = this.maxHealth;
    this.respawnTimer = 0;
    this.velocity.set(0, 0, 0);
    this.mesh.visible = true;
    this.healthBarGroup.visible = true;
    this.mesh.scale.set(1, 1, 1);
    this.mesh.material.color.setHSL(0.02, 0.55, 0.46);
    this.healthBarFill.scale.x = 1;
    this.healthBarFill.position.x = 0;
  }

  applyDamage(amount, knockbackSource = null) {
    if (this.health <= 0) return;

    this.health = Math.max(0, this.health - amount);
    const healthRatio = this.health / this.maxHealth;

    // Knockback
    if (knockbackSource) {
      const dir = this.position.clone().sub(knockbackSource).normalize();
      dir.y = 0;
      this.velocity.addScaledVector(dir, 8);
    }

    // Flinch effect (squash)
    this.mesh.scale.set(1.3, 0.7, 1.3);

    if (this.health === 0) {
      this.mesh.visible = false;
      this.healthBarGroup.visible = false;
      this.respawnTimer = 0;
      return;
    }

    this.mesh.material.color.setHSL(0.02, 0.55, 0.28 + healthRatio * 0.18);

    // Update Health Bar
    this.healthBarFill.scale.x = healthRatio;
    this.healthBarFill.position.x = -(1 - healthRatio) * 0.5;
  }
}

export function createMockTargets(scene) {
  return [
    new MockTarget({ scene, position: new THREE.Vector3(0, 0, -4.8) }),
    new MockTarget({ scene, position: new THREE.Vector3(4.5, 0, 2.5), color: '#b56244' }),
    new MockTarget({ scene, position: new THREE.Vector3(-4.5, 0, 3.4), color: '#9f6950' }),
  ];
}
