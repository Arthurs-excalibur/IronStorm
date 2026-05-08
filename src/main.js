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
import { HealthBarUI } from './ui/HealthBarUI.js';
import { PostProcessingSystem } from './systems/PostProcessingSystem.js';
import { PropManager } from './enemies/PropManager.js';
import { LootSystem } from './systems/LootSystem.js';

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
const postProcessing = new PostProcessingSystem(scene, camera, renderer);
const lootSystem = new LootSystem(scene, vfx);
const propManager = new PropManager(scene, vfx, lootSystem);

// Add a very subtle boost to colors
postProcessing.setColorGrading({
  saturation: 1.05, // Subtle boost
  contrast: 1.05,
  colorTint: new THREE.Color(1.0, 1.0, 1.0) // Neutral tint
});

let hitStopTimer = 0;
const triggerHitStop = (duration) => {
  hitStopTimer = duration;
};

const initialCharacterId = getSavedCharacterId();

scene.add(player.root);

await arenaManager.build();
player.setCollisionCallback((pos, radius) => arenaManager.checkCollision(pos, radius));

await player.load(initialCharacterId);
followCamera.snapTo(player.root.position);

// --- UI System ---
const healthBarUI = new HealthBarUI();
player.health.onHealthChange = (current, max) => {
  healthBarUI.update(current, max);
};
// Initial UI sync
healthBarUI.update(player.health.currentHealth, player.health.maxHealth);

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

// Spawn initial props randomly
const propCount = 15 + Math.floor(Math.random() * 10);
for (let i = 0; i < propCount; i++) {
  const type = Math.random() > 0.5 ? 'barrel' : 'crate';
  
  // Random position within arena (avoiding the exact center start)
  const angle = Math.random() * Math.PI * 2;
  const distance = 4 + Math.random() * 16;
  const x = Math.cos(angle) * distance;
  const z = Math.sin(angle) * distance;
  
  propManager.spawn(type, new THREE.Vector3(x, 0, z));
}

const attackSystem = new AttackSystem({
  scene,
  player,
  weaponSystem: player.getWeaponSystem(),
  targets: enemyManager.enemies, // AttackSystem now targets real enemies
  vfx,
  damageNumbers,
  camera: followCamera,
  onHit: triggerHitStop,
  props: propManager.props
});

const selector = createCharacterSelector(initialCharacterId, async (characterId) => {
  await player.setCharacter(characterId);
});
container.appendChild(selector.root);

const loop = new GameLoop(clock, (delta) => {
  // --- Hit Stop Logic ---
  if (hitStopTimer > 0) {
    hitStopTimer -= delta;
    // During hitstop, we still render but don't update physics/logic
    followCamera.update(delta, player.root.position);
    postProcessing.render();
    return;
  }

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
  propManager.update(delta);
  lootSystem.update(delta, player);

  followCamera.update(delta, player.root.position);
  postProcessing.render();
});

loop.start();
