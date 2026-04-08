<template>
  <el-button circle @click="toggleTheme" size="small">
    <el-icon :size="18"><Sunny v-if="isDark" /><Moon v-else /></el-icon>
  </el-button>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const currentTheme = ref('light')

const isDark = computed(() => currentTheme.value === 'tech-dark')

const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'tech-dark' ? 'light' : 'tech-dark'
  document.documentElement.setAttribute('data-theme', currentTheme.value)
  localStorage.setItem('tia-theme', currentTheme.value)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('tia-theme') || 'light'
  currentTheme.value = savedTheme
  document.documentElement.setAttribute('data-theme', savedTheme)
})
</script>

<style scoped>
</style>
