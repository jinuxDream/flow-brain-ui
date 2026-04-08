<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div 
        v-for="(stat, index) in statsList" 
        :key="index"
        class="stat-card"
        :class="['stat-card-' + index]"
        @click="goTo(stat.path)"
        @mouseenter="onStatHover(index, true)"
        @mouseleave="onStatHover(index, false)"
      >
        <div class="stat-bg"></div>
        <div class="stat-glow"></div>
        <div class="stat-content">
          <div class="stat-icon-wrapper">
            <el-icon class="stat-icon" :size="36">
              <component :is="stat.icon" />
            </el-icon>
            <div class="icon-ring"></div>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              <span class="value-number">{{ stat.value }}</span>
              <span class="value-unit">{{ stat.unit }}</span>
            </div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
        <div class="stat-particles">
          <span v-for="i in 6" :key="i" class="particle"></span>
        </div>
      </div>
    </div>

    <div class="action-section">
      <h3 class="section-title">
        <el-icon><Lightning /></el-icon>
        快捷操作
      </h3>
      <div class="action-grid">
        <div 
          v-for="(action, index) in actions" 
          :key="index"
          class="action-card"
          @click="goTo(action.path)"
        >
          <div class="action-bg"></div>
          <div class="action-content">
            <div class="action-icon-wrapper">
              <el-icon :size="40">
                <component :is="action.icon" />
              </el-icon>
            </div>
            <div class="action-text">{{ action.text }}</div>
          </div>
          <div class="action-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <div class="data-section">
      <div class="section-left">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Clock /></el-icon>
                最近同步记录
              </span>
              <el-button text type="primary" @click="goTo('/repo/task')">
                查看全部
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          
          <div v-if="recentTasks.length > 0" class="task-list">
            <div 
              v-for="task in recentTasks" 
              :key="task.id" 
              class="task-item"
              @click="viewTaskDetail(task.id)"
            >
              <div class="task-status" :class="'status-' + task.status"></div>
              <div class="task-info">
                <div class="task-name">{{ task.repoName }}</div>
                <div class="task-time">{{ task.scanTime }}</div>
              </div>
              <el-tag 
                :type="task.status === 1 ? 'success' : task.status === 2 ? 'danger' : 'warning'" 
                size="small"
                effect="dark"
              >
                {{ task.status === 1 ? '成功' : task.status === 2 ? '失败' : '运行中' }}
              </el-tag>
            </div>
          </div>
          <el-empty v-else description="暂无同步记录" :image-size="80" />
        </el-card>
      </div>
      
      <div class="section-right">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><TrendCharts /></el-icon>
                最近变更
              </span>
            </div>
          </template>
          
          <div v-if="recentChanges.length > 0" class="change-list">
            <div 
              v-for="item in recentChanges" 
              :key="item.id" 
              class="change-item"
            >
              <div class="change-type" :class="'type-' + item.operationType?.toLowerCase()">
                {{ item.changeType }}
              </div>
              <div class="change-info">
                <div class="change-header">
                  <span class="change-name">{{ item.nodeName || item.recordId }}</span>
                  <el-tag 
                    :type="item.isFlow ? '' : 'info'" 
                    size="small"
                    effect="plain"
                  >
                    {{ item.isFlow ? '流程' : '节点' }}
                  </el-tag>
                </div>
                <div class="change-meta">
                  <span class="meta-item">
                    <el-icon><Folder /></el-icon>
                    {{ item.repoName || '-' }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Clock /></el-icon>
                    {{ item.changeTime }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无变更记录" :image-size="80" />
        </el-card>
      </div>
    </div>
    
    <ScanTaskDetailDialog v-model="detailDialogVisible" :task-id="currentTaskId" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import ScanTaskDetailDialog from '@/components/ScanTaskDetailDialog.vue'

const router = useRouter()

const stats = ref({
  repoCount: 0,
  flowCount: 0,
  nodeCount: 0,
  schemeCount: 0
})

const currentTime = ref('')
let timeInterval = null

const statsList = computed(() => [
  { 
    label: '已接入仓库', 
    value: stats.value.repoCount, 
    unit: '个',
    icon: 'FolderOpened',
    path: '/repo'
  },
  { 
    label: '已同步流程', 
    value: stats.value.flowCount, 
    unit: '个',
    icon: 'Share',
    path: '/knowledge/flow'
  },
  { 
    label: '业务节点', 
    value: stats.value.nodeCount, 
    unit: '个',
    icon: 'Document',
    path: '/knowledge/domain'
  },
  { 
    label: '已生成方案', 
    value: stats.value.schemeCount, 
    unit: '份',
    icon: 'Files',
    path: '/scheme/generate'
  }
])

const actions = [
  { text: '新增仓库', icon: 'FolderAdd', path: '/repo' },
  { text: '扫描任务', icon: 'Refresh', path: '/repo/task' },
  { text: '知识检索', icon: 'Search', path: '/knowledge/search' },
  { text: '流程可视化', icon: 'DataLine', path: '/knowledge/flow' }
]

const recentTasks = ref([])
const recentChanges = ref([])
const tasksLoading = ref(false)

const detailDialogVisible = ref(false)
const currentTaskId = ref(null)

const goTo = (path) => {
  if (path) router.push(path)
}

const viewTaskDetail = (taskId) => {
  currentTaskId.value = taskId
  detailDialogVisible.value = true
}

const onStatHover = (index, isHover) => {
  const cards = document.querySelectorAll('.stat-card')
  if (cards[index]) {
    cards[index].classList.toggle('is-hover', isHover)
  }
}

const updateTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  currentTime.value = `${hours}:${minutes}:${seconds}`
}

const loadStats = async () => {
  try {
    const res = await axios.get('/flow-brain/dashboard/stats')
    if (res.data.code === 200) {
      stats.value = res.data.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const loadRecentTasks = async () => {
  tasksLoading.value = true
  try {
    const res = await axios.get('/flow-brain/dashboard/recentTasks')
    if (res.data.code === 200) {
      recentTasks.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载最近任务失败:', error)
  } finally {
    tasksLoading.value = false
  }
}

const loadRecentChanges = async () => {
  try {
    const res = await axios.get('/flow-brain/dashboard/recentChanges')
    if (res.data.code === 200) {
      recentChanges.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载最近变更失败:', error)
  }
}

onMounted(() => {
  loadStats()
  loadRecentTasks()
  loadRecentChanges()
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<style scoped>
.dashboard {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  position: relative;
  padding: 24px;
  border-radius: 16px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--card-bg);
  border: 1px solid var(--border-default);
}

.stat-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.stat-card-0 .stat-bg { background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); }
.stat-card-1 .stat-bg { background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%); }
.stat-card-2 .stat-bg { background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 146, 60, 0.1) 100%); }
.stat-card-3 .stat-bg { background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(244, 114, 182, 0.1) 100%); }

.stat-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, var(--primary-color) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px var(--primary-200);
}

.stat-card:hover .stat-bg {
  opacity: 1;
}

.stat-card:hover .stat-glow {
  opacity: 0.15;
}

.stat-card-0:hover { box-shadow: 0 20px 40px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.3); }
.stat-card-1:hover { box-shadow: 0 20px 40px rgba(16, 185, 129, 0.2), 0 0 0 1px rgba(16, 185, 129, 0.3); }
.stat-card-2:hover { box-shadow: 0 20px 40px rgba(245, 158, 11, 0.2), 0 0 0 1px rgba(245, 158, 11, 0.3); }
.stat-card-3:hover { box-shadow: 0 20px 40px rgba(239, 68, 68, 0.2), 0 0 0 1px rgba(239, 68, 68, 0.3); }

.stat-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1;
}

.stat-icon-wrapper {
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card-0 .stat-icon { color: #6366f1; }
.stat-card-1 .stat-icon { color: #10b981; }
.stat-card-2 .stat-icon { color: #f59e0b; }
.stat-card-3 .stat-icon { color: #ef4444; }

.icon-ring {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  border: 2px solid currentColor;
  opacity: 0.2;
  animation: ring-pulse 2s ease-in-out infinite;
}

.stat-card-0 .icon-ring { color: #6366f1; }
.stat-card-1 .icon-ring { color: #10b981; }
.stat-card-2 .icon-ring { color: #f59e0b; }
.stat-card-3 .icon-ring { color: #ef4444; }

@keyframes ring-pulse {
  0%, 100% { transform: scale(1); opacity: 0.2; }
  50% { transform: scale(1.1); opacity: 0.4; }
}

.stat-info {
  flex: 1;
}

.stat-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.value-number {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.value-unit {
  font-size: 14px;
  color: var(--text-muted);
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.stat-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--primary-color);
  border-radius: 50%;
  opacity: 0;
}

.stat-card:hover .particle {
  animation: particle-float 1s ease-out forwards;
}

.stat-card-0 .particle { background: #6366f1; }
.stat-card-1 .particle { background: #10b981; }
.stat-card-2 .particle { background: #f59e0b; }
.stat-card-3 .particle { background: #ef4444; }

.particle:nth-child(1) { left: 10%; animation-delay: 0s; }
.particle:nth-child(2) { left: 30%; animation-delay: 0.1s; }
.particle:nth-child(3) { left: 50%; animation-delay: 0.2s; }
.particle:nth-child(4) { left: 70%; animation-delay: 0.3s; }
.particle:nth-child(5) { left: 20%; animation-delay: 0.15s; }
.particle:nth-child(6) { left: 80%; animation-delay: 0.25s; }

@keyframes particle-float {
  0% { transform: translateY(100px) scale(0); opacity: 0; }
  50% { opacity: 0.8; }
  100% { transform: translateY(-20px) scale(1); opacity: 0; }
}

.action-section {
  margin-bottom: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.section-title .el-icon {
  color: var(--primary-color);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-card {
  position: relative;
  padding: 24px;
  border-radius: 16px;
  cursor: pointer;
  overflow: hidden;
  background: var(--card-bg);
  border: 1px solid var(--border-default);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--primary-100) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow-hover);
  border-color: var(--primary-200);
}

.action-card:hover .action-bg {
  opacity: 1;
}

.action-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 1;
}

.action-icon-wrapper {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-50) 100%);
  border-radius: 16px;
  color: var(--primary-color);
  transition: all 0.3s ease;
}

.action-card:hover .action-icon-wrapper {
  transform: scale(1.1) rotate(5deg);
  background: linear-gradient(135deg, var(--primary-200) 0%, var(--primary-100) 100%);
}

.action-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.action-arrow {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%) translateX(-10px);
  opacity: 0;
  color: var(--primary-color);
  transition: all 0.3s ease;
}

.action-card:hover .action-arrow {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

.data-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.list-card {
  height: 420px;
  display: flex;
  flex-direction: column;
}

.list-card :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-title .el-icon {
  color: var(--primary-color);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-subtle);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-item:hover {
  background: var(--bg-muted);
  transform: translateX(4px);
}

.task-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-1 { background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.5); }
.status-2 { background: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.5); }
.status-0, .status-3 { background: #f59e0b; box-shadow: 0 0 8px rgba(245, 158, 11, 0.5); animation: blink 1s ease-in-out infinite; }

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.task-info {
  flex: 1;
}

.task-name {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.task-time {
  font-size: 12px;
  color: var(--text-muted);
}

.change-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.change-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-subtle);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.change-item:hover {
  background: var(--bg-muted);
}

.change-type {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.type_insert {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.type_update {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.type_delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.change-info {
  flex: 1;
  min-width: 0;
}

.change-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.change-name {
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.change-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

.meta-item .el-icon {
  font-size: 14px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .data-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
  
  .welcome-time {
    font-size: 32px;
  }
}
</style>
