import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

/**
 * Custom Color Grading Shader
 */
const ColorGradingShader = {
  uniforms: {
    tDiffuse: { value: null },
    brightness: { value: 0.0 },
    contrast: { value: 1.1 },
    saturation: { value: 1.2 },
    colorTint: { value: new THREE.Color(1.0, 1.0, 1.0) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float brightness;
    uniform float contrast;
    uniform float saturation;
    uniform vec3 colorTint;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;

      // Brightness
      color += brightness;

      // Contrast
      color = (color - 0.5) * contrast + 0.5;

      // Saturation
      float grey = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(vec3(grey), color, saturation);

      // Tint
      color *= colorTint;

      gl_FragColor = vec4(color, texel.a);
    }
  `
};

export class PostProcessingSystem {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    const size = new THREE.Vector2();
    renderer.getSize(size);

    // 1. Setup Composer
    this.composer = new EffectComposer(renderer);

    // 2. Render Pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // 3. Bloom Pass (The "Magical Glow")
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      0.35, // Reduced strength (was 0.6)
      0.15, // Slightly tighter radius
      0.85  // Higher threshold (was 0.4) - only the brightest highlights glow
    );
    this.composer.addPass(this.bloomPass);

    // 4. Color Grading Pass
    this.colorGradingPass = new ShaderPass(ColorGradingShader);
    this.composer.addPass(this.colorGradingPass);

    // 5. Output Pass (Handles SRGB conversion)
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);

    this.setupResizeListener();
  }

  setupResizeListener() {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.composer.setSize(width, height);
    });
  }

  render() {
    this.composer.render();
  }

  setBloom(strength, radius, threshold) {
    this.bloomPass.strength = strength;
    this.bloomPass.radius = radius;
    this.bloomPass.threshold = threshold;
  }

  setColorGrading(config) {
    if (config.brightness !== undefined) this.colorGradingPass.uniforms.brightness.value = config.brightness;
    if (config.contrast !== undefined) this.colorGradingPass.uniforms.contrast.value = config.contrast;
    if (config.saturation !== undefined) this.colorGradingPass.uniforms.saturation.value = config.saturation;
    if (config.colorTint !== undefined) this.colorGradingPass.uniforms.colorTint.value = config.colorTint;
  }
}
