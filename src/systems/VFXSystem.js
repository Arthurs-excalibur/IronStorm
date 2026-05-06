import * as THREE from 'three';

export class VFXSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.sparkGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  }

  spawnImpact(position, color = '#ffffff', count = 6) {
    for (let i = 0; i < count; i++) {
      const material = new THREE.MeshBasicMaterial({ color });
      const particle = new THREE.Mesh(this.sparkGeometry, material);
      
      particle.position.copy(position);
      
      // Random velocity
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 6,
        (Math.random() - 0.5) * 8
      );

      this.particles.push({
        mesh: particle,
        velocity,
        life: 0.4 + Math.random() * 0.2,
        initialLife: 0.6
      });

      this.scene.add(particle);
    }
  }

  spawnMuzzleFlash(position, color = '#ffcc00') {
    const light = new THREE.PointLight(color, 15, 4);
    light.position.copy(position);
    this.scene.add(light);

    this.particles.push({
      light: light,
      life: 0.1,
      initialLife: 0.1,
      isLight: true
    });
  }

  spawnDust(position) {
    const material = new THREE.MeshBasicMaterial({ 
      color: '#d4c5a5', 
      transparent: true,
      opacity: 0.6
    });
    const particle = new THREE.Mesh(this.sparkGeometry, material);
    particle.position.copy(position);
    particle.position.y = 0.1;

    this.particles.push({
      mesh: particle,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 2, 1 + Math.random() * 1.5, (Math.random() - 0.5) * 2),
      life: 0.5,
      initialLife: 0.5
    });

    this.scene.add(particle);
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        if (p.isLight) {
          this.scene.remove(p.light);
        } else {
          this.scene.remove(p.mesh);
        }
        this.particles.splice(i, 1);
        continue;
      }

      if (!p.isLight) {
        // Update physics
        p.mesh.position.addScaledVector(p.velocity, delta);
        p.velocity.y -= 20 * delta; // Gravity
        
        // Scale down
        const scale = p.life / p.initialLife;
        p.mesh.scale.setScalar(scale);
      } else {
        p.light.intensity = (p.life / p.initialLife) * 15;
      }
    }
  }
}
