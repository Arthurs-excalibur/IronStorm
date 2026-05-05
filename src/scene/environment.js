import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FOREST_PROP_LAYOUT } from './environmentCatalog.js';

const loader = new GLTFLoader();
const propCache = new Map();

export async function buildEnvironment(scene) {
  const props = await Promise.all(
    FOREST_PROP_LAYOUT.map(async (entry) => {
      const template = await loadProp(entry.modelUrl);
      const instance = template.clone(true);
      instance.position.set(...entry.position);
      instance.rotation.y = entry.rotationY;
      instance.scale.setScalar(entry.scale);
      prepareProp(instance);
      return instance;
    }),
  );

  for (const prop of props) {
    scene.add(prop);
  }

  const playAreaRing = new THREE.Mesh(
    new THREE.RingGeometry(6.75, 7.2, 80),
    new THREE.MeshBasicMaterial({
      color: '#d6dfb0',
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
    }),
  );
  playAreaRing.rotation.x = -Math.PI / 2;
  playAreaRing.position.y = 0.02;
  scene.add(playAreaRing);
}

async function loadProp(modelUrl) {
  if (!propCache.has(modelUrl)) {
    const gltf = await loader.loadAsync(modelUrl);
    propCache.set(modelUrl, gltf.scene);
  }

  return propCache.get(modelUrl);
}

function prepareProp(object) {
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}
