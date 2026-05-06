import './styles.css';
import * as THREE from 'three';
import { setupScene } from './scene/setupScene.js';
import { Input } from './systems/Input.js';
import { GameLoop } from './systems/GameLoop.js';
import { Player } from './player/Player.js';
import { FollowCamera } from './scene/camera.js';
import { createCharacterSelector, getSavedCharacterId } from './ui/characterSelector.js';
import { AttackSystem } from './combat/AttackSystem.js';
import { createMockTargets } from './combat/createMockTargets.js';
import { ArenaManager } from './scene/ArenaManager.js';
import { VFXSystem } from './systems/VFXSystem.js';
import { DamageNumbers } from './systems/DamageNumbers.js';
import { EnemyManager } from './enemies/EnemyManager.js';

const container = document.querySelector('#app');
const { scene, camera, renderer, clock, groundPlane } = setupScene(container);
const input = new Input(renderer.domElement);
const raycaster = new THREE.Raycaster();
const pointerIntersection = new THREE.Vector3();
const player = new Player();
const followCamera = new FollowCamera(camera);
const vfx = new VFXSystem(scene);
const damageNumbers = new DamageNumbers(scene);
const arenaManager = new ArenaManager(scene);

const initialCharacterId = getSavedCharacterId();

scene.add(player.root);

await arenaManager.build();
player.setCollisionCallback((pos, radius) => arenaManager.checkCollision(pos, radius));

await player.load(initialCharacterId);
followCamera.snapTo(player.root.position);

// --- Enemy System ---
const enemyManager = new EnemyManager({
  scene,
  vfx,
  damageNumbers,
  animationClips: player.animationClips // Re-use player's loaded clips since they share Rig_Medium
});

// Spawn initial skeletons
enemyManager.spawn('skeleton_warrior', new THREE.Vector3(5, 0, -5));
enemyManager.spawn('skeleton_mage', new THREE.Vector3(-6, 0, -8));
enemyManager.spawn('skeleton_rogue', new THREE.Vector3(10, 0, -5));
enemyManager.spawn('skeleton_minion', new THREE.Vector3(0, 0, -10));
enemyManager.spawn('skeleton_minion', new THREE.Vector3(8, 0, 2));

const attackSystem = new AttackSystem({
  scene,
  player,
  weaponSystem: player.getWeaponSystem(),
  targets: enemyManager.enemies, // AttackSystem now targets real enemies
  vfx,
  damageNumbers,
  camera: followCamera,
});

const selector = createCharacterSelector(initialCharacterId, async (characterId) => {
  await player.setCharacter(characterId);
});
container.appendChild(selector.root);

const loop = new GameLoop(clock, (delta) => {
  player.update(delta, {
    input,
    raycaster,
    camera,
    groundPlane,
    pointerIntersection,
    vfx,
  });
  attackSystem.update(delta, {
    input,
    raycaster,
    camera,
    groundPlane,
  });

  vfx.update(delta);
  damageNumbers.update(delta);
  enemyManager.update(delta, player, camera);

  followCamera.update(delta, player.root.position);
  renderer.render(scene, camera);
});

loop.start();
