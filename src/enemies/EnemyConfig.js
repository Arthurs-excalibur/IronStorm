export const ENEMY_CONFIGS = {
  skeleton_warrior: {
    id: 'skeleton_warrior',
    name: 'Skeleton Warrior',
    modelUrl: '/models/KayKit_Skeletons_1.1_FREE/characters/gltf/Skeleton_Warrior.glb',
    weaponId: 'skeleton_axe',
    type: 'melee',
    health: 60,
    speed: 3.5,
    attackRange: 2.2,
    damage: 15,
    combat: {
      anticipationTime: 0.4, // Wind-up before strike
      recoveryTime: 0.8,     // Pause after strike
    },
    behavior: {
      aggroRange: 20,
      optimalRange: [0, 2.2],
      fleeRange: 0,
      separationWeight: 1.5,
    },
    animations: {
      idle: 'idle',
      run: 'run',
      attack: 'attack_melee_mid'
    }
  },
  skeleton_minion: {
    id: 'skeleton_minion',
    name: 'Skeleton Minion',
    modelUrl: '/models/KayKit_Skeletons_1.1_FREE/characters/gltf/Skeleton_Minion.glb',
    weaponId: 'skeleton_blade',
    type: 'melee',
    health: 25,
    speed: 4.8,
    attackRange: 1.6,
    damage: 6,
    combat: {
      anticipationTime: 0.25,
      recoveryTime: 0.4,
    },
    behavior: {
      aggroRange: 20,
      optimalRange: [0, 1.6],
      fleeRange: 0,
      separationWeight: 1.2,
    },
    animations: {
      idle: 'idle',
      run: 'run',
      attack: 'attack_melee_mid'
    }
  },
  skeleton_rogue: {
    id: 'skeleton_rogue',
    name: 'Skeleton Rogue',
    modelUrl: '/models/KayKit_Skeletons_1.1_FREE/characters/gltf/Skeleton_Rogue.glb',
    weaponId: 'skeleton_crossbow',
    type: 'ranged',
    health: 35,
    speed: 4.0,
    attackRange: 10.0,
    damage: 10,
    combat: {
      anticipationTime: 0.6,
      recoveryTime: 1.2,
    },
    behavior: {
      aggroRange: 25,
      optimalRange: [6.0, 10.0],
      fleeRange: 4.0,
      separationWeight: 2.0,
    },
    animations: {
      idle: 'idle',
      run: 'run',
      attack: 'attack_ranged_shoot'
    }
  },
  skeleton_mage: {
    id: 'skeleton_mage',
    name: 'Skeleton Mage',
    modelUrl: '/models/KayKit_Skeletons_1.1_FREE/characters/gltf/Skeleton_Mage.glb',
    weaponId: 'skeleton_staff',
    type: 'ranged',
    health: 40,
    speed: 2.2,
    attackRange: 8.0,
    damage: 20,
    combat: {
      anticipationTime: 0.8,
      recoveryTime: 1.5,
    },
    behavior: {
      aggroRange: 20,
      optimalRange: [5.0, 8.0],
      fleeRange: 3.5,
      separationWeight: 2.5,
    },
    animations: {
      idle: 'idle',
      run: 'run',
      attack: 'attack_ranged_shoot'
    }
  }
};
