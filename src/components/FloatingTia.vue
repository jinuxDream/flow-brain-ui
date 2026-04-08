<template>
  <Transition name="float-fade">
    <div v-if="visible" class="floating-tia" @click="goToAgent" @mouseenter="isHover = true" @mouseleave="isHover = false">
      <div class="tia-container">
        <div class="orbit-ring"></div>
        <div class="orbit-ring ring-2"></div>
        <div class="orbit-ring ring-3"></div>
        <div class="tia-core" :class="{ 'pulse': isHover }">
          <TiaIcon :size="36" glow />
        </div>
        <div class="particles">
          <span v-for="i in 6" :key="i" class="particle" :style="{ '--i': i }"></span>
        </div>
      </div>
      <div class="tooltip" :class="{ 'show': isHover }">
        <span>与 Tia 对话</span>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import TiaIcon from '@/components/TiaIcon.vue'

const router = useRouter()
const route = useRoute()
const isHover = ref(false)

const visible = computed(() => {
  const isShareSession = sessionStorage.getItem('tia-share-session') === 'true'
  return route.path !== '/agent' && !route.path.startsWith('/agent/') && !isShareSession
})

const goToAgent = () => {
  router.push('/agent')
}
</script>

<style scoped>
.floating-tia {
  position: fixed;
  right: 24px;
  bottom: 80px;
  z-index: 1000;
  cursor: pointer;
  user-select: none;
}

.tia-container {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orbit-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #6366f1;
  border-right-color: #8b5cf6;
  animation: orbit 3s linear infinite;
}

.ring-2 {
  width: 80%;
  height: 80%;
  border-top-color: #06b6d4;
  border-right-color: #22d3ee;
  animation-duration: 2.5s;
  animation-direction: reverse;
}

.ring-3 {
  width: 60%;
  height: 60%;
  border-top-color: #f472b6;
  border-right-color: #ec4899;
  animation-duration: 2s;
}

@keyframes orbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.tia-core {
  position: relative;
  z-index: 2;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
  border-radius: 50%;
  transition: all 0.3s ease;
}

.tia-core.pulse {
  transform: scale(1.1);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 50%;
  animation: float-particle 3s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.5s);
  left: 50%;
  top: 50%;
}

.particle:nth-child(1) { --angle: 0deg; }
.particle:nth-child(2) { --angle: 60deg; }
.particle:nth-child(3) { --angle: 120deg; }
.particle:nth-child(4) { --angle: 180deg; }
.particle:nth-child(5) { --angle: 240deg; }
.particle:nth-child(6) { --angle: 300deg; }

@keyframes float-particle {
  0%, 100% {
    transform: rotate(var(--angle)) translateX(40px) scale(0.5);
    opacity: 0.3;
  }
  50% {
    transform: rotate(var(--angle)) translateX(50px) scale(1);
    opacity: 1;
  }
}

.tooltip {
  position: absolute;
  right: 80px;
  top: 50%;
  transform: translateY(-50%) translateX(10px);
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.tooltip::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-left-color: #8b5cf6;
}

.tooltip.show {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

.float-fade-enter-active,
.float-fade-leave-active {
  transition: all 0.3s ease;
}

.float-fade-enter-from,
.float-fade-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

@media screen and (max-width: 768px) {
  .floating-tia {
    right: 16px;
    bottom: 70px;
  }
  
  .tia-container {
    width: 56px;
    height: 56px;
  }
  
  .tia-core {
    width: 40px;
    height: 40px;
  }
  
  .tooltip {
    display: none;
  }
}
</style>
