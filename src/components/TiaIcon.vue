<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" :width="size" :height="size" class="tia-icon">
    <defs>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#6366f1"/>
        <stop offset="100%" style="stop-color:#8b5cf6"/>
      </linearGradient>
      <filter v-if="glow" :id="glowId">
        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <polygon points="32,8 52,20 52,40 32,52 12,40 12,20" :fill="`url(#${gradientId})`" :filter="glow ? `url(#${glowId})` : ''"/>
    
    <rect x="20" y="22" width="24" height="5" rx="1" fill="white"/>
    <rect x="29" y="27" width="6" height="18" rx="1" fill="white"/>
    
    <ellipse v-if="animated" cx="32" cy="28" rx="24" ry="10" fill="none" stroke="#06b6d4" stroke-width="2" opacity="0.5" transform="rotate(-20, 32, 28)">
      <animateTransform attributeName="transform" type="rotate" from="-20 32 28" to="340 32 28" dur="10s" repeatCount="indefinite"/>
    </ellipse>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: [Number, String],
    default: 40
  },
  glow: {
    type: Boolean,
    default: false
  },
  animated: {
    type: Boolean,
    default: false
  }
})

const uniqueId = Math.random().toString(36).substr(2, 9)
const gradientId = computed(() => `tiaGradient-${uniqueId}`)
const glowId = computed(() => `tiaGlow-${uniqueId}`)
</script>

<style scoped>
.tia-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>
