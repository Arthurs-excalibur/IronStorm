import * as THREE from 'three';

export class PropManager {
  constructor(scene, vfx, lootSystem) {
    this.scene = scene;
    this.vfx = vfx;
    this.lootSystem = lootSystem;
    this.props = [];
    
    // Geometries for stylized props
    this.barrelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8);
    this.crateGeometry = new THREE.BoxGeometry(1, 1, 1);
    
    // Materials
    this.barrelMaterial = new THREE.MeshStandardMaterial({ color: '#5d4037', roughness: 0.8 });
    this.crateMaterial = new THREE.MeshStandardMaterial({ color: '#8d6e63', roughness: 0.9 });
  }

  spawn(type, position) {
    let mesh;
    if (type === 'barrel') {
      mesh = new THREE.Mesh(this.barrelGeometry, this.barrelMaterial);
    } else {
      mesh = new THREE.Mesh(this.crateGeometry, this.crateMaterial);
    }

    mesh.position.copy(position);
    mesh.position.y = type === 'barrel' ? 0.6 : 0.5;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    const prop = {
      mesh,
      type,
      health: 1,
      radius: 0.6,
      isAlive: () => prop.health > 0,
      position: mesh.position,
      applyDamage: (amount) => this.damageProp(prop, amount)
    };

    this.scene.add(mesh);
    this.props.push(prop);
    return prop;
  }

  damageProp(prop, amount) {
    if (prop.health <= 0) return;
    
    prop.health -= amount;
    
    if (prop.health <= 0) {
      this.breakProp(prop);
    } else {
      // Wiggle effect on hit
      prop.mesh.scale.set(1.2, 0.8, 1.2);
    }
  }

  breakProp(prop) {
    if (this.vfx) {
      this.vfx.spawnImpact(prop.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)), '#8d6e63', 15);
    }

    // 50% chance to spawn heal
    if (Math.random() > 0.5 && this.lootSystem) {
      this.lootSystem.spawnHeal(prop.mesh.position.clone());
    }

    this.scene.remove(prop.mesh);
    const index = this.props.indexOf(prop);
    if (index > -1) this.props.splice(index, 1);
  }

  update(delta) {
    for (const prop of this.props) {
      // Recover scale from wiggle
      prop.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 10);
    }
  }
}
