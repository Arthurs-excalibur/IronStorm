import * as THREE from 'three';

export class LootSystem {
  constructor(scene, vfx) {
    this.scene = scene;
    this.vfx = vfx;
    this.pickups = [];
    
    // Simple heart/plus geometry for heal
    this.healGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    this.healMaterial = new THREE.MeshBasicMaterial({ color: '#ff3366' });
  }

  spawnHeal(position) {
    const mesh = new THREE.Mesh(this.healGeometry, this.healMaterial);
    mesh.position.copy(position);
    mesh.position.y = 0.5;
    
    // Add a light for glow (Post-processing will pick this up)
    const light = new THREE.PointLight('#ff3366', 5, 2);
    mesh.add(light);
    
    this.scene.add(mesh);
    this.pickups.push({
      mesh,
      type: 'heal',
      amount: 25,
      time: 0
    });
  }

  update(delta, player) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.time += delta;
      
      // Floating animation
      p.mesh.position.y = 0.5 + Math.sin(p.time * 3) * 0.2;
      p.mesh.rotation.y += delta * 2;

      // Distance check for pickup
      const dist = p.mesh.position.distanceTo(player.root.position);
      if (dist < 1.2) {
        this.collect(i, player);
      }
    }
  }

  collect(index, player) {
    const p = this.pickups[index];
    
    if (p.type === 'heal') {
      player.health.heal(p.amount);
      if (this.vfx) {
        this.vfx.spawnImpact(p.mesh.position.clone(), '#ff3366', 12);
      }
    }

    this.scene.remove(p.mesh);
    this.pickups.splice(index, 1);
  }
}
