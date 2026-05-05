import * as THREE from 'three';

export function createLighting(scene) {
  const ambientLight = new THREE.AmbientLight('#d8ecff', 1.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight('#fff2d6', 2.2);
  directionalLight.position.set(10, 18, 8);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 60;
  directionalLight.shadow.camera.left = -18;
  directionalLight.shadow.camera.right = 18;
  directionalLight.shadow.camera.top = 18;
  directionalLight.shadow.camera.bottom = -18;
  scene.add(directionalLight);
}
