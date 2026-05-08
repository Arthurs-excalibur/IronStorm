import * as THREE from 'three';

export function createLighting(scene) {
  const ambientLight = new THREE.AmbientLight('#ffffff', 1.0); // Clean base
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight('#ffffff', '#43362a', 1.5); // Sky color vs Ground color
  scene.add(hemisphereLight);

  const directionalLight = new THREE.DirectionalLight('#fff8e1', 1.8); // Lowered from 3.2
  directionalLight.position.set(20, 30, 15);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.camera.left = -35;
  directionalLight.shadow.camera.right = 35;
  directionalLight.shadow.camera.top = 35;
  directionalLight.shadow.camera.bottom = -35;
  directionalLight.shadow.bias = -0.0005;
  scene.add(directionalLight);
}
