import * as THREE from 'three';
import { createLighting } from './lighting.js';

export function setupScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#87ceeb');
  scene.fog = new THREE.Fog('#87ceeb', 40, 90);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    200,
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const clock = new THREE.Clock();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({
      color: '#304f39',
      roughness: 0.95,
      metalness: 0.05,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(120, 120, '#87a78f', '#3f5d48');
  grid.material.opacity = 0.28;
  grid.material.transparent = true;
  scene.add(grid);

  createLighting(scene);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    scene,
    camera,
    renderer,
    clock,
    groundPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  };
}
