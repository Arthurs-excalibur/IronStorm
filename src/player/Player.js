import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { PlayerAnimation } from './PlayerAnimation.js';
import { PlayerController } from './PlayerController.js';
import { CHARACTER_OPTIONS, getCharacterById } from './characterCatalog.js';
import { WeaponSystem } from '../combat/WeaponSystem.js';
import { ANIMATION_PACK_URLS, ATTACK_ANIMATIONS_BY_CHARACTER } from './animationCatalog.js';
import { resolveWeaponConfig } from '../combat/weaponCatalog.js';

export class Player {
  constructor() {
    this.root = new THREE.Group();
    this.root.position.set(0, 0, 0);
    this.loader = new GLTFLoader();
    this.characterCache = new Map();
    this.animationClips = null;
    this.model = null;
    this.animation = null;
    this.controller = new PlayerController(this.root, null);
    this.weaponSystem = new WeaponSystem();
    this.selectedCharacterId = CHARACTER_OPTIONS[0].id;
    this.currentAttackAnimationName = null;
    this.activeWeaponConfig = null;
  }

  async load(characterId = CHARACTER_OPTIONS[0].id) {
    this.animationClips = await this.loadAnimationClips();
    await this.setCharacter(characterId);
  }

  async setCharacter(characterId) {
    const selectedCharacter = getCharacterById(characterId);
    const gltf = await this.loadCharacterGltf(selectedCharacter);

    // 1. Cleanup old model
    this.disposeCurrentCharacter();

    // 2. Clone and setup new model
    this.model = SkeletonUtils.clone(gltf.scene);
    this.model.scale.setScalar(1.5);
    this.model.position.y = 0;
    this.prepareModel(this.model);
    this.root.add(this.model);
    this.model.updateMatrixWorld(true);

    // 3. Register sockets for weapon system
    this.weaponSystem.registerSockets(this.model);

    // 4. Setup Animation
    const mixer = new THREE.AnimationMixer(this.model);
    this.animation = new PlayerAnimation(mixer, this.animationClips);
    this.controller.setAnimation(this.animation);
    this.animation.play('idle');

    // 5. Setup Combat Data
    this.currentAttackAnimationName = ATTACK_ANIMATIONS_BY_CHARACTER[selectedCharacter.id] ?? null;
    this.activeWeaponConfig = resolveWeaponConfig(
      selectedCharacter.weaponId,
      selectedCharacter.weaponOverrides,
    );
    
    // 6. Equip weapon (now using cached sockets)
    await this.weaponSystem.equipWeapon(this.activeWeaponConfig);

    this.selectedCharacterId = selectedCharacter.id;
  }

  disposeCurrentCharacter() {
    if (this.animation?.mixer) {
      this.animation.mixer.stopAllAction();
    }

    if (this.model) {
      this.weaponSystem.detachWeapon();
      this.root.remove(this.model);
      
      // Deep dispose to prevent memory leaks
      this.model.traverse((node) => {
        if (node.isMesh) {
          node.geometry.dispose();
          if (Array.isArray(node.material)) {
            node.material.forEach(m => m.dispose());
          } else {
            node.material.dispose();
          }
        }
      });
      this.model = null;
    }
  }

  async loadCharacterGltf(character) {
    if (!this.characterCache.has(character.id)) {
      const gltf = await this.loader.loadAsync(character.modelUrl);
      this.characterCache.set(character.id, gltf);
    }

    return this.characterCache.get(character.id);
  }

  async loadAnimationClips() {
    const loadedPacks = await Promise.all(
      Object.values(ANIMATION_PACK_URLS).map((url) => this.loader.loadAsync(url)),
    );
    const allClips = loadedPacks.flatMap((pack) => pack.animations);

    const idleClip = allClips.find((clip) => clip.name === 'Idle_A');
    const runClip = allClips.find((clip) => clip.name === 'Running_A');

    if (!idleClip || !runClip) {
      throw new Error('KayKit animation pack is missing Idle_A or Running_A.');
    }

    const clipMap = new Map();
    for (const clip of allClips) {
      if (!clipMap.has(clip.name.toLowerCase())) {
        clipMap.set(clip.name.toLowerCase(), clip);
      }
    }

    const idleAlias = idleClip.clone();
    idleAlias.name = 'idle';
    clipMap.set(idleAlias.name, idleAlias);

    const runAlias = runClip.clone();
    runAlias.name = 'run';
    clipMap.set(runAlias.name, runAlias);

    return [...clipMap.values()];
  }

  attack(onComplete) {
    if (this.animation && this.currentAttackAnimationName) {
      this.controller.lock();
      this.animation.playOnce(this.currentAttackAnimationName, () => {
        this.controller.unlock();
        if (onComplete) onComplete();
      });
    }
  }

  prepareModel(model) {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  update(delta, context) {
    this.controller.update(delta, context);
    this.weaponSystem.update(delta);
  }

  setCollisionCallback(callback) {
    this.controller.setCollisionCallback(callback);
  }

  getAttackConfig() {
    return this.activeWeaponConfig?.attack;
  }

  getWeaponSystem() {
    return this.weaponSystem;
  }
}
