<template>
  <Transition name="preloader-fade">
    <div
      v-if="visible"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0f]"
    >
      <canvas
        ref="canvas"
        class="w-64 h-32 md:w-80 md:h-40"
        style="display: block;"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
const visible = ref(true);
const canvas = ref<HTMLCanvasElement | null>(null);

onMounted(() => {
  if (!canvas.value) return;

  const width = canvas.value.clientWidth;
  const height = canvas.value.clientHeight;

  const { cleanup } = useWaveRenderer({
    canvas: canvas.value,
    width,
    height,
    cameraDistance: 20,
    waveWidthMultiplier: 0.9,
    segments: 60,
    amplitudes: [2, 1, 1.2],
  });

  const dismiss = () => {
    setTimeout(() => {
      visible.value = false;
      document.getElementById("app-content")?.classList.add("is-ready");
      setTimeout(cleanup, 600);
    }, 800);
  };

  if (document.readyState === "complete") {
    dismiss();
  } else {
    window.addEventListener("load", dismiss, { once: true });
  }

  onBeforeUnmount(cleanup);
});
</script>

<style>
.preloader-fade-leave-active {
  transition: opacity 0.5s ease-out;
}

.preloader-fade-leave-to {
  opacity: 0;
}
</style>
