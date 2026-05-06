/**
 * Catalog of characters available in the game.
 * Each character references a weapon from the weaponCatalog and can provide optional overrides.
 */

export const CHARACTER_OPTIONS = [
  {
    id: 'barbarian',
    label: 'Barbarian',
    modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Characters/gltf/Barbarian.glb',
    weaponId: 'axe_1handed',
    weaponOverrides: {
      alignment: {
        gripScale: 1.3, // Barbarian holds it slightly larger
      },
    },
  },
  {
    id: 'knight',
    label: 'Knight',
    modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Characters/gltf/Knight.glb',
    weaponId: 'sword_1handed',
  },
  {
    id: 'mage',
    label: 'Mage',
    modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Characters/gltf/Mage.glb',
    weaponId: 'staff',
    weaponOverrides: {
      alignment: {
        holdOffset: [0, 0.05, 0], // Adjusted for Mage's hand position
      },
    },
  },
  {
    id: 'ranger',
    label: 'Ranger',
    modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Characters/gltf/Ranger.glb',
    weaponId: 'bow',
    weaponOverrides: {
      alignment: {
        handBoneName: 'handslot.l',
        gripPosition: [0.1, 0, 0], // Custom grip for Ranger
      },
    },
  },
  {
    id: 'rogue',
    label: 'Rogue',
    modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue.glb',
    weaponId: 'dagger',
  },
  {
    id: 'rogue-hooded',
    label: 'Rogue Hooded',
    modelUrl: '/models/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue_Hooded.glb',
    weaponId: 'crossbow_1handed',
  },
];

export function getCharacterById(characterId) {
  return CHARACTER_OPTIONS.find((option) => option.id === characterId) ?? CHARACTER_OPTIONS[0];
}
