<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="logo">
        <img src="/favicon.svg" alt="Tia" class="logo-icon" />
        <span class="title">Tia</span>
      </div>
      <div class="header-center">
        <div class="quick-nav" v-if="!isShareUser">
          <el-tooltip content="应用管理" placement="bottom">
            <div class="nav-item" @click="goTo('/datasource/app')">
              <el-icon><Monitor /></el-icon>
              <span>应用</span>
            </div>
          </el-tooltip>
          <el-tooltip content="代码仓库" placement="bottom">
            <div class="nav-item" @click="goTo('/repo')">
              <el-icon><FolderAdd /></el-icon>
              <span>仓库</span>
            </div>
          </el-tooltip>
          <el-tooltip content="全域知识检索" placement="bottom">
            <div class="nav-item" @click="goTo('/knowledge/search')">
              <el-icon><Search /></el-icon>
              <span>搜索</span>
            </div>
          </el-tooltip>
          <el-divider direction="vertical" />
          <QuickLinkEntry />
        </div>
      </div>
      <div class="header-right" v-if="!isShareUser">
        <div class="daily-quote" v-if="featureSwitches.show_daily_quote">✨ {{ dailyQuote }} 💪</div>
        <div class="info-right">
          <div class="weather-info" v-if="featureSwitches.show_weather">
            <span class="weather-icon">{{ weatherIcon }}</span>
            <span class="weather-temp">{{ weather.temp }}°C</span>
            <span class="weather-desc">{{ weather.desc }}</span>
          </div>
          <div class="time-info" v-if="featureSwitches.show_time">
            <span class="current-time">{{ currentTime }}</span>
            <span class="current-date">{{ currentDate }}</span>
          </div>
        </div>
      </div>
      <div class="user-info">
        <ThemeSwitcher style="margin-right: 16px" />
        <el-dropdown>
          <span class="el-dropdown-link">
            <el-avatar :size="32" icon="UserFilled" />
            <span class="username">{{ userName }}</span>
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="goToUserCenter">个人中心</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    
    <el-container>
      <el-aside v-if="!isShareUser" width="220px" class="aside">
        <el-menu
          :default-active="activeMenu"
          class="menu"
          router
          :default-openeds="[]"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>首页（业务驾驶舱）</span>
          </el-menu-item>
          
          <el-sub-menu index="datasource">
            <template #title>
              <el-icon><FolderOpened /></el-icon>
              <span>数据源管理</span>
            </template>
            <el-menu-item index="/datasource/app">
              <el-icon><Monitor /></el-icon>
              <span>应用管理</span>
            </el-menu-item>
            <el-menu-item index="/repo">
              <el-icon><FolderAdd /></el-icon>
              <span>代码仓库</span>
            </el-menu-item>
            <el-menu-item index="/datasource/connection">
              <el-icon><Connection /></el-icon>
              <span>数据库连接</span>
            </el-menu-item>
            <el-menu-item index="/datasource/api">
              <el-icon><Link /></el-icon>
              <span>三方接口</span>
            </el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="knowledge">
            <template #title>
              <el-icon><Reading /></el-icon>
              <span>知识中心</span>
            </template>
            <el-menu-item index="/knowledge/domain">
              <el-icon><Grid /></el-icon>
              <span>业务域全景</span>
            </el-menu-item>
            <el-menu-item index="/knowledge/flow">
              <el-icon><Share /></el-icon>
              <span>流程可视化</span>
            </el-menu-item>
            <el-menu-item index="/knowledge/model">
              <el-icon><Coin /></el-icon>
              <span>数据模型</span>
            </el-menu-item>
            <el-menu-item index="/datasource/structure">
              <el-icon><Grid /></el-icon>
              <span>表结构查看</span>
            </el-menu-item>
            <el-menu-item index="/knowledge/search">
              <el-icon><Search /></el-icon>
              <span>全域知识检索</span>
            </el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="scheme">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>方案中心</span>
            </template>
            <el-menu-item index="/scheme/demand">
              <el-icon><Edit /></el-icon>
              <span>需求管理</span>
            </el-menu-item>
            <el-menu-item index="/scheme/generate">
              <el-icon><DocumentAdd /></el-icon>
              <span>方案生成管理</span>
            </el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="system">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </template>
            <el-menu-item index="/system/user">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="/system/model">
              <el-icon><Cpu /></el-icon>
              <span>模型管理</span>
            </el-menu-item>
            <el-menu-item index="/system/agent">
              <el-icon><Avatar /></el-icon>
              <span>助手管理</span>
            </el-menu-item>
            <el-menu-item index="/system/config">
              <el-icon><Tools /></el-icon>
              <span>基础配置</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
    
    <FloatingTia />
  </el-container>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import FloatingTia from '@/components/FloatingTia.vue'
import QuickLinkEntry from '@/components/QuickLinkEntry.vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const userName = ref('用户')

const isShareUser = computed(() => {
  return sessionStorage.getItem('tia-share-session') === 'true'
})

const activeMenu = computed(() => {
  return route.path
})

const currentTime = ref('')
const currentDate = ref('')
const weather = ref({ temp: '22', desc: '晴' })
const dailyQuote = ref('每一天都是新的开始')
const featureSwitches = reactive({
  show_daily_quote: true,
  show_weather: true,
  show_time: true
})

const weatherIcon = computed(() => {
  const desc = weather.value.desc || ''
  if (desc.includes('雨')) return '🌧️'
  if (desc.includes('雪')) return '❄️'
  if (desc.includes('云') || desc.includes('阴')) return '☁️'
  if (desc.includes('晴')) return '☀️'
  if (desc.includes('雾') || desc.includes('霾')) return '🌫️'
  if (desc.includes('雷')) return '⛈️'
  return '🌤️'
})

const updateTime = () => {
  try {
    const now = new Date()
    currentTime.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    currentDate.value = `${now.getMonth() + 1}/${now.getDate()} ${weekDays[now.getDay()]}`
  } catch (e) {
    currentTime.value = '00:00:00'
    currentDate.value = '1/1 周一'
  }
}

const loadWeather = async () => {
  try {
    const res = await axios.get('/flow-brain/system/weather')
    if (res.data && res.data.code === 200 && res.data.data) {
      weather.value = res.data.data
    }
  } catch (error) {
    console.log('天气获取失败，使用默认数据')
  }
}

const loadDailyQuote = async () => {
  try {
    const res = await axios.get('/flow-brain/system/atmosphere/dailyQuote')
    if (res.data && res.data.code === 200 && res.data.data) {
      dailyQuote.value = res.data.data
    }
  } catch (e) {
    console.log('获取每日文案失败，使用默认文案')
  }
}

const loadFeatureSwitches = async () => {
  try {
    const res = await axios.get('/flow-brain/system/feature/switches')
    if (res.data && res.data.code === 200 && res.data.data) {
      Object.assign(featureSwitches, res.data.data)
    }
  } catch (e) {
    console.log('获取功能开关失败，使用默认配置')
  }
}

let timer = null

const goToUserCenter = () => {
  router.push('/system/user')
}

const goTo = (path) => {
  router.push(path)
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await axios.post('/flow-brain/system/user/logout')
    } catch (e) {
      console.error('logout error:', e)
    }
    localStorage.removeItem('tia-user')
    sessionStorage.removeItem('tia-share-session')
    ElMessage.success('已退出登录')
    router.push('/login')
  })
}

onMounted(() => {
  const savedUser = localStorage.getItem('tia-user')
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser)
      userName.value = user.userName || user.userAccount || '用户'
    } catch (e) {
      console.error('parse user error:', e)
    }
  }
  
  updateTime()
  timer = setInterval(updateTime, 1000)
  loadWeather()
  loadDailyQuote()
  loadFeatureSwitches()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  color: white;
  min-width: 100px;
}

.logo .title {
  font-size: 20px;
  font-weight: bold;
  margin-left: 12px;
}

.logo-icon {
  width: 32px;
  height: 32px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.quick-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 200px;
  justify-content: flex-end;
  height: 100%;
  margin-right: 20px;
}

.daily-quote {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  min-width: 280px;
  max-width: 400px;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3);
  animation: shine 2s ease-in-out infinite;
}

@keyframes shine {
  0%, 100% {
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3);
  }
  50% {
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3);
  }
}

.floating-thumb {
  position: fixed;
  font-size: 28px;
  pointer-events: none;
  z-index: 9999;
  animation: floatUp 1.5s ease-out forwards;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
}

@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translateY(-200px) scale(2) rotate(20deg);
  }
}

.info-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.weather-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  min-width: 140px;
  height: 24px;
}

.weather-icon {
  font-size: 13px;
}

.weather-temp {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}

.weather-desc {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.85);
}

.time-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  min-width: 140px;
  height: 24px;
}

.current-time {
  font-size: 11px;
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  color: #fff;
  letter-spacing: 0.5px;
}

.current-date {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.85);
}

.nav-item {
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

.nav-item:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.nav-item .el-icon {
  font-size: 18px;
}

.quick-nav .el-divider {
  margin: 0 8px;
  border-color: rgba(255, 255, 255, 0.2);
}

.user-info {
  color: white;
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: white;
}

.username {
  margin: 0 8px;
}

.aside {
  height: calc(100vh - 60px);
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;
  background: var(--menu-bg);
}

.menu {
  border-right: none;
  min-height: 100%;
  background: transparent;
}

.menu :deep(.el-menu-item),
.menu :deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  margin: 4px 8px;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.menu :deep(.el-menu-item:hover),
.menu :deep(.el-sub-menu__title:hover) {
  background: var(--menu-active-bg);
  color: var(--primary-color);
}

.menu :deep(.el-menu-item.is-active) {
  background: var(--menu-active-bg);
  color: var(--primary-color);
  position: relative;
}

.menu :deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: var(--primary-color);
  border-radius: 0 2px 2px 0;
}

.menu :deep(.el-sub-menu .el-menu-item) {
  height: 44px;
  line-height: 44px;
  padding-left: 52px !important;
  margin: 2px 8px;
}

.menu :deep(.el-sub-menu .el-menu-item:hover) {
  background: var(--menu-active-bg);
}

.menu :deep(.el-sub-menu .el-menu-item.is-active) {
  background: var(--menu-active-bg);
}

.menu :deep(.el-icon) {
  font-size: 18px;
  margin-right: 8px;
}

.main {
  padding: 20px;
  height: calc(100vh - 60px);
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
