import * as THREE from 'three';

/**
 * Base configurations for all weapons in the game.
 * Each weapon defines its base attack stats and default hand alignment.
 */

export const WEAPON_CATALOG = {
  axe_1handed: {
    id: 'axe_1handed',
    modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Assets/gltf/axe_1handed.gltf',
    attack: {
      type: 'melee',
      damage: 22,
      cooldown: 0.45,
      melee: {
        coneAngle: THREE.MathUtils.degToRad(75), // Increased from 55
        range: 2.6, // Increased from 2.3
        impactTime: 0.45,
      },
    },
    alignment: {
      handBoneName: 'handslot.r',
      gripPosition: [0, 0, 0],
      gripRotation: [0, 0, Math.PI / 2],
      gripScale: 1.2,
      gripAnchor: [0.85, 0.08, 0.5],
      holdOffset: [0, 0.02, 0],
      tipPosition: [0.95, 0, 0],
    },
  },
  sword_1handed: {
    id: 'sword_1handed',
    modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Assets/gltf/sword_1handed.gltf',
    attack: {
      type: 'melee',
      damage: 18,
      cooldown: 0.35,
      melee: {
        coneAngle: THREE.MathUtils.degToRad(60), // Increased from 40
        range: 2.4, // Increased from 2.1
        impactTime: 0.45,
      },
    },
    alignment: {
      handBoneName: 'handslot.r',
      gripPosition: [0, 0, 0],
      gripRotation: [0, 0, Math.PI / 2],
      gripScale: 1.25,
      gripAnchor: [0.5, 0.06, 0.5],
      holdOffset: [0, 0.02, 0],
      tipPosition: [1.05, 0, 0],
    },
  },
  staff: {
    id: 'staff',
    modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Assets/gltf/staff.gltf',
    attack: {
      type: 'projectile',
      damage: 16,
      cooldown: 0.3,
      projectile: {
        speed: 10,
        lifetime: 1.6,
        radius: 0.6, 
        isStylizedOrb: true,
        color: '#ffffff', // Core color
        shellColor: '#4488ff', // Outer shell color
        impactTime: 0.4,
      },
    },
    alignment: {
      handBoneName: 'handslot.r',
      gripPosition: [0.08, 0, 0],
      gripRotation: [0, 0, Math.PI / 2],
      gripScale: 1.2,
      gripAnchor: [0.42, 0.18, 0.5],
      holdOffset: [0, 0.03, 0],
      tipPosition: [1.2, 0.8, 0], 
    },
  },
  bow: {
    id: 'bow',
    modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Assets/gltf/bow_withString.gltf',
    attack: {
      type: 'projectile',
      damage: 12,
      cooldown: 0.22,
      projectile: {
        speed: 25,
        lifetime: 3.0,
        radius: 0.15,
        modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Assets/gltf/arrow_bow.gltf',
        modelScale: 1.2,
        impactTime: 0.4,
      },
    },
    alignment: {
      handBoneName: 'handslot.r',
      gripPosition: [0.08, 0, 0],
      gripRotation: [0, 0, Math.PI / 2],
      gripScale: 1.15,
      gripAnchor: [0.58, 0.5, 0.5],
      holdOffset: [0, 0.04, 0],
      tipPosition: [0.85, 0.8, 0],
    },
  },
  dagger: {
    id: 'dagger',
    modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Assets/gltf/dagger.gltf',
    attack: {
      type: 'melee',
      damage: 14,
      cooldown: 0.24,
      melee: {
        coneAngle: THREE.MathUtils.degToRad(65), // Increased from 35
        range: 2.2, // Increased from 1.9
        impactTime: 0.45,
      },
    },
    alignment: {
      handBoneName: 'handslot.r',
      gripPosition: [0, 0, 0],
      gripRotation: [0, 0, Math.PI / 2],
      gripScale: 1.25,
      gripAnchor: [0.46, 0.08, 0.5],
      holdOffset: [0, 0.02, 0],
      tipPosition: [0.8, 0, 0],
    },
  },
  wand: {
    id: 'wand',
    modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Assets/gltf/wand.gltf',
    attack: {
      type: 'projectile',
      damage: 13,
      cooldown: 0.25,
      projectile: {
        speed: 14,
        lifetime: 1.5,
        radius: 0.18,
        impactTime: 0.4,
      },
    },
    alignment: {
      handBoneName: 'handslot.r',
      gripPosition: [0.02, 0, 0],
      gripRotation: [0, 0, Math.PI / 2],
      gripScale: 1.25,
      gripAnchor: [0.5, 0.1, 0.5],
      holdOffset: [0, 0.02, 0],
      tipPosition: [0.75, 0, 0],
    },
  },
  crossbow_2handed: {
    id: 'crossbow_2handed',
    modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Assets/gltf/crossbow_2handed.gltf',
    attack: {
      type: 'projectile',
      damage: 15,
      cooldown: 0.3,
      projectile: {
        speed: 30,
        lifetime: 3.0,
        radius: 0.15,
        modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Assets/gltf/arrow_crossbow.gltf',
        modelScale: 1.2,
        impactTime: 0.4,
      },
    },
    alignment: {
      handBoneName: 'handslot.r',
      gripPosition: [0, 0, 0],
      gripRotation: [Math.PI, -Math.PI / 2, 0],
      gripScale: 1.2,
      gripAnchor: [0.5, 0.1, 0.4],
      holdOffset: [0, 0.02, 0.1],
      tipPosition: [1.2, 0, 0],
    },
  },
  // --- Skeleton Weapons ---
  skeleton_axe: {
    id: 'skeleton_axe',
    modelUrl: '/models/KayKit_Skeletons_1.1_FREE/assets/gltf/Skeleton_Axe.gltf',
    attack: {
      type: 'melee',
      damage: 18,
      cooldown: 1.2,
      melee: {
        coneAngle: THREE.MathUtils.degToRad(60),
        range: 2.2,
        impactTime: 0.45,
      },
    },
    alignment: {
      handBoneName: 'handslot.r',
      gripPosition: [0, 0, 0],
      gripRotation: [0, 0, Math.PI / 2],
      gripScale: 1.2,
      gripAnchor: [0.35, 0.1, 0.5],
      holdOffset: [0, 0.05, 0],
      tipPosition: [0.9, 0, 0],
    },
  },
  skeleton_blade: {
    id: 'skeleton_blade',
    modelUrl: '/models/KayKit_Skeletons_1.1_FREE/assets/gltf/Skeleton_Blade.gltf',
    attack: {
      type: 'melee',
      damage: 12,
      cooldown: 0.8,
      melee: {
        coneAngle: THREE.MathUtils.degToRad(45),
        range: 1.8,
        impactTime: 0.4,
      },
    },
    alignment: {
      handBoneName: 'handslot.r',
      gripPosition: [0, 0, 0],
      gripRotation: [0, 0, Math.PI / 2],
      gripScale: 1.2,
      gripAnchor: [0.3, 0.1, 0.5],
      holdOffset: [0, 0.05, 0],
      tipPosition: [0.8, 0, 0],
    },
  },
  skeleton_staff: {
    id: 'skeleton_staff',
    modelUrl: '/models/KayKit_Skeletons_1.1_FREE/assets/gltf/Skeleton_Staff.gltf',
    attack: {
      type: 'projectile',
      damage: 20,
      cooldown: 3.0,
      projectile: {
        speed: 10,
        lifetime: 2.0,
        radius: 0.3,
        isStylizedOrb: true,
        color: '#ffffff',
        shellColor: '#ff0000',
        impactTime: 0.5,
      },
    },
    alignment: {
      handBoneName: 'handslot.r',
      gripPosition: [0, 0, 0],
      gripRotation: [0, 0, Math.PI / 2],
      gripScale: 1.2,
      gripAnchor: [0.5, 0.1, 0.5],
      holdOffset: [0, 0.05, 0],
      tipPosition: [1.3, 0.6, 0],
    },
  },
  skeleton_crossbow: {
    id: 'skeleton_crossbow',
    modelUrl: '/models/KayKit_Skeletons_1.1_FREE/assets/gltf/Skeleton_Crossbow.gltf',
    attack: {
      type: 'projectile',
      damage: 10,
      cooldown: 1.2,
      projectile: {
        speed: 25,
        lifetime: 3.0,
        radius: 0.15,
        modelUrl: '/models/KayKit_Skeletons_1.1_FREE/assets/gltf/Skeleton_Arrow.gltf',
        modelScale: 1.2,
        impactTime: 0.4,
      },
    },
    alignment: {
      handBoneName: 'handslot.r',
      gripPosition: [0, 0, 0],
      gripRotation: [Math.PI, -Math.PI / 2, 0],
      gripScale: 1.2,
      gripAnchor: [0.5, 0.1, 0.5],
      holdOffset: [0, 0.05, 0],
      tipPosition: [1.2, 0, 0],
    },
  },
  crossbow_1handed: {
    id: 'crossbow_1handed',
    modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Assets/gltf/crossbow_1handed.gltf',
    attack: {
      type: 'projectile',
      damage: 13,
      cooldown: 0.25,
      projectile: {
        speed: 28,
        lifetime: 3.0,
        radius: 0.15,
        modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Assets/gltf/arrow_crossbow.gltf',
        modelScale: 1.2,
        impactTime: 0.4,
      },
    },
    alignment: {
      handBoneName: 'handslot.r',
      gripPosition: [0, 0, 0],
      gripRotation: [Math.PI, -Math.PI / 2, 0],
      gripScale: 1.2,
      gripAnchor: [0.5, 0.1, 0.4],
      holdOffset: [0, 0.02, 0.1],
      tipPosition: [1.2, 0, 0],
    },
  },
};

/**
 * Utility to merge a base weapon config with character-specific overrides.
 */
export function resolveWeaponConfig(weaponId, overrides = {}) {
  const base = WEAPON_CATALOG[weaponId];
  if (!base) return null;

  // Simple deep merge for alignment and attack objects
  return {
    ...base,
    ...overrides,
    attack: {
      ...base.attack,
      ...(overrides.attack || {}),
      melee: base.attack.melee ? { ...base.attack.melee, ...(overrides.attack?.melee || {}) } : undefined,
      projectile: base.attack.projectile ? { ...base.attack.projectile, ...(overrides.attack?.projectile || {}) } : undefined,
    },
    alignment: {
      ...base.alignment,
      ...(overrides.alignment || {}),
    },
  };
}
