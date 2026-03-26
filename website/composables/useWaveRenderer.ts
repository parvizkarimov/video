import * as THREE from "three";

interface WaveRendererOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  cameraDistance: number;
  waveWidthMultiplier: number;
  segments: number;
  amplitudes: [number, number, number];
}

interface WaveRendererResult {
  cleanup: () => void;
  handleResize: (newWidth: number, newHeight: number) => void;
}

const WAVE_COLOR = 0xc084fc;
const FIELD_OF_VIEW = 50;
const TIME_STEP = 0.015;

export const useWaveRenderer = (
  configuration: WaveRendererOptions,
): WaveRendererResult => {
  const {
    canvas,
    width,
    height,
    cameraDistance,
    waveWidthMultiplier,
    segments,
    amplitudes,
  } = configuration;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    FIELD_OF_VIEW,
    width / height,
    0.1,
    1000,
  );
  camera.position.z = cameraDistance;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const calculateWaveDimensions = (viewWidth: number, viewHeight: number) => {
    const visibleHeight =
      2 * Math.tan((FIELD_OF_VIEW * Math.PI) / 180 / 2) * cameraDistance;
    const visibleWidth = visibleHeight * (viewWidth / viewHeight);
    const waveWidth = visibleWidth * waveWidthMultiplier;
    return { waveWidth, halfWidth: waveWidth / 2 };
  };

  const { waveWidth, halfWidth } = calculateWaveDimensions(width, height);

  const createLineGeometry = () => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array((segments + 1) * 3);
    for (let i = 0; i <= segments; i++) {
      positions[i * 3] = (i / segments) * waveWidth - halfWidth;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  };

  const geometry = createLineGeometry();
  const mirrorGeometry = createLineGeometry();

  const material = new THREE.LineBasicMaterial({
    color: WAVE_COLOR,
    transparent: true,
    opacity: 1,
  });
  const mirrorMaterial = new THREE.LineBasicMaterial({
    color: WAVE_COLOR,
    transparent: true,
    opacity: 1,
  });

  scene.add(new THREE.Line(geometry, material));
  scene.add(new THREE.Line(mirrorGeometry, mirrorMaterial));

  let time = 0;
  let animationId: number;

  const animate = () => {
    animationId = requestAnimationFrame(animate);
    time += TIME_STEP;

    const positions = geometry.attributes.position.array as Float32Array;
    const mirrorPositions = mirrorGeometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const centerDistance = Math.abs(t - 0.5) * 2;
      const fade = 1 - centerDistance ** 2;

      const wave1 = Math.sin(t * Math.PI * 6 + time * 2) * amplitudes[0];
      const wave2 = Math.sin(t * Math.PI * 12 + time * 3) * amplitudes[1];
      const wave3 = Math.cos(t * Math.PI * 3 + time * 1.5) * amplitudes[2];

      const y = (wave1 + wave2 + wave3) * fade;
      positions[i * 3 + 1] = y;
      mirrorPositions[i * 3 + 1] = -y;
    }

    geometry.attributes.position.needsUpdate = true;
    mirrorGeometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  };

  animate();

  const cleanup = () => {
    cancelAnimationFrame(animationId);
    geometry.dispose();
    mirrorGeometry.dispose();
    material.dispose();
    mirrorMaterial.dispose();
    renderer.dispose();
  };

  const handleResize = (newWidth: number, newHeight: number) => {
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);

    const { waveWidth: resizedWaveWidth, halfWidth: resizedHalfWidth } =
      calculateWaveDimensions(newWidth, newHeight);
    const positions = geometry.attributes.position.array as Float32Array;
    const mirrorPositions = mirrorGeometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * resizedWaveWidth - resizedHalfWidth;
      positions[i * 3] = x;
      mirrorPositions[i * 3] = x;
    }

    geometry.attributes.position.needsUpdate = true;
    mirrorGeometry.attributes.position.needsUpdate = true;
  };

  return { cleanup, handleResize };
};
