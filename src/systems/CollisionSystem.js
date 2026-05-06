import * as THREE from 'three';

/**
 * Dedicated 2D Collision System
 * Handles Box and Circle primitives with sliding resolution.
 */
export class CollisionSystem {
  constructor() {
    this.colliders = [];
  }

  /**
   * Adds a collider to the system.
   * @param {Object} collider { type: 'circle'|'box', center: Vector3, radius?: number, halfSize?: Vector3 }
   */
  addCollider(collider) {
    this.colliders.push(collider);
  }

  /**
   * Resolves a position against all colliders.
   * Modifies the position in-place and returns the total resolution vector.
   */
  resolve(position, radius) {
    const totalResolution = new THREE.Vector3(0, 0, 0);
    
    // Collision resolution passes (handles corners better)
    for (let pass = 0; pass < 2; pass++) {
      let anyResolved = false;
      
      for (const collider of this.colliders) {
        const res = this.checkCollision(position, radius, collider);
        if (res) {
          position.add(res);
          totalResolution.add(res);
          anyResolved = true;
        }
      }
      
      if (!anyResolved) break;
    }
    
    return totalResolution;
  }

  checkCollision(pos, radius, col) {
    if (col.type === 'circle') {
      const dist = pos.distanceTo(col.center);
      const minDist = radius + col.radius;
      if (dist < minDist) {
        const overlap = minDist - dist;
        return pos.clone().sub(col.center).normalize().multiplyScalar(overlap);
      }
    } else if (col.type === 'box') {
      const dx = pos.x - col.center.x;
      const dz = pos.z - col.center.z;
      const absX = Math.abs(dx);
      const absZ = Math.abs(dz);
      const limitX = col.halfSize.x + radius;
      const limitZ = col.halfSize.z + radius;

      if (absX < limitX && absZ < limitZ) {
        const overlapX = limitX - absX;
        const overlapZ = limitZ - absZ;

        // Push back on the axis of least penetration (sliding)
        if (overlapX < overlapZ) {
          return new THREE.Vector3(Math.sign(dx) * overlapX, 0, 0);
        } else {
          return new THREE.Vector3(0, 0, Math.sign(dz) * overlapZ);
        }
      }
    }
    return null;
  }

  clear() {
    this.colliders = [];
  }
}
