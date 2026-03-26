<template>
  <div
    ref="container"
    class="absolute inset-0 w-full h-full pointer-events-none"
    style="background: transparent;"
  >
    <canvas
      ref="canvas"
      class="w-full h-full"
      style="display: block; background: transparent;"
    />
  </div>
</template>

<script setup lang="ts">
const container = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);

onMounted(() => {
  if (!container.value || !canvas.value) return;

  const width = container.value.clientWidth || window.innerWidth;
  const height = container.value.clientHeight || window.innerHeight;

  const { cleanup, handleResize } = useWaveRenderer({
    canvas: canvas.value,
    width,
    height,
    cameraDistance: 40,
    waveWidthMultiplier: 1.1,
    segments: 80,
    amplitudes: [4, 2, 2.5],
  });

  const onResize = () => {
    if (!container.value) return;
    const newWidth = container.value.clientWidth || window.innerWidth;
    const newHeight = container.value.clientHeight || window.innerHeight;
    handleResize(newWidth, newHeight);
  };

  window.addEventListener("resize", onResize);

  onBeforeUnmount(() => {
    window.removeEventListener("resize", onResize);
    cleanup();
  });
});
</script>
