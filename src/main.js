import './styles.css';
import * as THREE from 'three';
import { setupScene } from './scene/setupScene.js';
import { Input } from './systems/Input.js';
import { GameLoop } from './systems/GameLoop.js';
import { Player } from './player/Player.js';
import { FollowCamera } from './scene/camera.js';
import { buildEnvironment } from './scene/environment.js';
import { createCharacterSelector, getSavedCharacterId } from './ui/characterSelector.js';
import { AttackSystem } from './combat/AttackSystem.js';
import { createMockTargets } from './combat/createMockTargets.js';

const container = document.querySelector('#app');
const { scene, camera, renderer, clock, groundPlane } = setupScene(container);
const input = new Input(renderer.domElement);
const raycaster = new THREE.Raycaster();
const pointerIntersection = new THREE.Vector3();
const player = new Player();
const followCamera = new FollowCamera(camera);
const initialCharacterId = getSavedCharacterId();

scene.add(player.root);

await buildEnvironment(scene);
await player.load(initialCharacterId);
followCamera.snapTo(player.root.position);
const mockTargets = createMockTargets(scene);
const attackSystem = new AttackSystem({
  scene,
  player,
  weaponSystem: player.getWeaponSystem(),
  targets: mockTargets,
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
  });
  attackSystem.update(delta, {
    input,
    raycaster,
    camera,
    groundPlane,
  });

  followCamera.update(delta, player.root.position);
  renderer.render(scene, camera);
});

loop.start();
