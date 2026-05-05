import * as THREE from 'three';

class MockTarget {
  constructor({ scene, position, color = '#cb5548' }) {
    this.scene = scene;
    this.position = position.clone();
    this.maxHealth = 60;
    this.health = this.maxHealth;
    this.radius = 0.65;
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
  }

  isAlive() {
    return this.health > 0;
  }

  applyDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    const healthRatio = this.health / this.maxHealth;

    if (this.health === 0) {
      this.mesh.visible = false;
      return;
    }

    this.mesh.scale.y = 0.75 + healthRatio * 0.25;
    this.mesh.material.color.setHSL(0.02, 0.55, 0.28 + healthRatio * 0.18);
  }
}

export function createMockTargets(scene) {
  return [
    new MockTarget({ scene, position: new THREE.Vector3(0, 0, -4.8) }),
    new MockTarget({ scene, position: new THREE.Vector3(4.5, 0, 2.5), color: '#b56244' }),
    new MockTarget({ scene, position: new THREE.Vector3(-4.5, 0, 3.4), color: '#9f6950' }),
  ];
}
