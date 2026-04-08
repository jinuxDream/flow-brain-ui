<template>
  <div class="quick-link-entry" @click="goToNavigation">
    <el-icon><Compass /></el-icon>
    <span>快速导航</span>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToNavigation = () => {
  router.push('/navigation')
}
</script>

<style scoped>
.quick-link-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.85);
  transition: all 0.3s ease;
  font-size: 14px;
}

.quick-link-entry:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}
</style>
