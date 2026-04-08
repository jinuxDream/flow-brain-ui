<template>
  <div class="knowledge-search">
    <el-card class="search-card">
      <div class="search-header">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索流程、节点、应用..."
          size="large"
          clearable
          @keyup.enter="handleSearch"
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button type="primary" @click="handleSearch" :loading="loading">
              搜索
            </el-button>
          </template>
        </el-input>
        
        <div class="search-filters">
          <el-select v-model="searchForm.type" placeholder="类型" style="width: 120px" @change="handleSearch">
            <el-option label="全部" value="all" />
            <el-option label="流程" value="flow" />
            <el-option label="节点" value="node" />
            <el-option label="应用" value="app" />
          </el-select>
          
          <el-select v-model="searchForm.appName" placeholder="应用筛选" clearable style="width: 200px" @change="handleSearch">
            <el-option v-for="name in appNameList" :key="name" :label="name" :value="name" />
          </el-select>
        </div>
      </div>
    </el-card>
    
    <el-card class="result-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all">
          <template #label>
            <span>全部 ({{ totalCount }})</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="流程" name="flow">
          <template #label>
            <span>流程 ({{ flows.length }})</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="节点" name="node">
          <template #label>
            <span>节点 ({{ nodes.length }})</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="应用" name="app">
          <template #label>
            <span>应用 ({{ apps.length }})</span>
          </template>
        </el-tab-pane>
      </el-tabs>
      
      <el-empty v-if="currentResults.length === 0 && hasSearched" description="未找到相关结果" />
      <el-empty v-else-if="currentResults.length === 0" description="请输入关键词进行搜索" />
      
      <div v-else class="result-list">
        <div 
          v-for="item in currentResults" 
          :key="`${item.type}-${item.id}`" 
          class="result-item"
          @click="handleItemClick(item)"
        >
          <div class="item-header">
            <el-tag :type="getTypeTag(item.type)" size="small">{{ getTypeName(item.type) }}</el-tag>
            <span class="item-name">{{ item.name }}</span>
            <span class="item-code">{{ item.code }}</span>
          </div>
          <div class="item-desc" v-if="item.description">{{ item.description }}</div>
          <div class="item-meta">
            <span v-if="item.appName">
              <el-icon><Folder /></el-icon>
              {{ item.appName }}
            </span>
            <span v-if="item.businessDomain">
              <el-icon><Collection /></el-icon>
              {{ item.businessDomain }}
            </span>
            <span v-if="item.codePath">
              <el-icon><Document /></el-icon>
              {{ item.codePath }}
            </span>
            <span v-if="item.rule">
              <el-icon><List /></el-icon>
              {{ item.rule }}
            </span>
            <span v-if="item.logicSteps">
              <el-icon><Tickets /></el-icon>
              {{ item.logicSteps }}
            </span>
            <span v-if="item.updateTime">
              <el-icon><Clock /></el-icon>
              {{ item.updateTime }}
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="nodeDetailVisible" :title="currentNodeDetail?.nodeName || currentNodeDetail?.code || ''" width="900px">
      <template #header>
        <span>{{ currentNodeDetail?.name || '' }} - {{ currentNodeDetail?.code }}</span>
      </template>
      <div class="detail-content">
        <div class="detail-section info-section">
          <div class="detail-row">
            <span class="detail-label">描述:</span>
            <span class="detail-value">{{ currentNodeDetail?.description || '-' }}</span>
          </div>
        </div>

        <div v-if="currentNodeDetail?.rule" class="detail-section config-section">
          <div class="section-title">
            <span class="section-icon">📐</span>
            <span class="section-text">规则</span>
          </div>
          <pre class="config-pre">{{ currentNodeDetail?.rule || '-' }}</pre>
        </div>

        <div v-if="currentNodeDetail?.logicSteps && parseJsonArray(currentNodeDetail.logicSteps).length > 0" class="detail-section subflows-section">
          <div class="section-title">
            <span class="section-icon">📋</span>
            <span class="section-text">执行步骤 ({{ parseJsonArray(currentNodeDetail.logicSteps).length }})</span>
          </div>
          <div class="steps-list">
            <div v-for="(step, index) in parseJsonArray(currentNodeDetail.logicSteps)" :key="index" class="step-item">
              <span class="step-index">{{ index + 1 }}.</span>
              <span class="step-content">{{ step }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section code-section">
          <div class="detail-row full-width">
            <span class="detail-label">代码路径:</span>
            <span class="detail-value">{{ currentNodeDetail?.codePath || '-' }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="flowDetailVisible" :title="currentFlowDetail?.name || currentFlowDetail?.code || ''" width="900px">
      <template #header>
        <span>{{ currentFlowDetail?.name || '' }} - {{ currentFlowDetail?.code }}</span>
      </template>
      <div class="detail-content">
        <div class="detail-section info-section">
          <div class="detail-row">
            <span class="detail-label">描述:</span>
            <span class="detail-value">{{ currentFlowDetail?.description || '-' }}</span>
          </div>
        </div>

        <div v-if="currentFlowDetail?.subFlows && parseJsonArray(currentFlowDetail.subFlows).length > 0" class="detail-section subflows-section">
          <div class="section-title">
            <span class="section-icon">📋</span>
            <span class="section-text">子流程 ({{ parseJsonArray(currentFlowDetail.subFlows).length }})</span>
          </div>
          <div class="subflows-list">
            <el-tag v-for="(subFlow, index) in parseJsonArray(currentFlowDetail.subFlows)" :key="index" type="warning" style="margin-right: 8px; margin-bottom: 8px;">
              {{ subFlow }}
            </el-tag>
          </div>
        </div>

        <div class="detail-section code-section">
          <div class="detail-row full-width">
            <span class="detail-label">代码路径:</span>
            <span class="detail-value">{{ currentFlowDetail?.codePath || '-' }}</span>
          </div>
        </div>

        <div v-if="currentFlowDetail?.flowConfig" class="detail-section config-section">
          <div class="section-title">
            <span class="section-icon">📄</span>
            <span class="section-text">流程配置</span>
          </div>
          <pre class="config-pre">{{ currentFlowDetail?.flowConfig || '-' }}</pre>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="appDetailVisible" :title="currentAppDetail?.name || currentAppDetail?.code || ''" width="700px">
      <template #header>
        <span>{{ currentAppDetail?.name || '' }} - 应用详情</span>
      </template>
      <div class="detail-content">
        <div class="detail-section info-section">
          <div class="detail-row">
            <span class="detail-label">应用名称:</span>
            <span class="detail-value">{{ currentAppDetail?.code || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">描述:</span>
            <span class="detail-value">{{ currentAppDetail?.description || '-' }}</span>
          </div>
        </div>

        <div class="detail-section params-section">
          <div class="section-title">
            <span class="section-icon">📦</span>
            <span class="section-text">仓库信息</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">仓库名称:</span>
            <span class="detail-value">{{ currentAppDetail?.name || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">仓库地址:</span>
            <span class="detail-value">
              <el-link v-if="currentAppDetail?.gitUrl" :href="currentAppDetail.gitUrl" target="_blank" type="primary">
                {{ currentAppDetail.gitUrl }}
              </el-link>
              <span v-else>-</span>
            </span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Folder, Collection, Document, Clock, List, Tickets } from '@element-plus/icons-vue'
import axios from 'axios'

const loading = ref(false)
const hasSearched = ref(false)
const appNameList = ref([])

const searchForm = reactive({
  keyword: '',
  type: 'all',
  appName: ''
})

const activeTab = ref('all')
const flows = ref([])
const nodes = ref([])
const apps = ref([])

const nodeDetailVisible = ref(false)
const currentNodeDetail = ref(null)
const flowDetailVisible = ref(false)
const currentFlowDetail = ref(null)
const appDetailVisible = ref(false)
const currentAppDetail = ref(null)

const totalCount = computed(() => flows.value.length + nodes.value.length + apps.value.length)

const currentResults = computed(() => {
  if (activeTab.value === 'all') {
    return [...flows.value, ...nodes.value, ...apps.value]
  } else if (activeTab.value === 'flow') {
    return flows.value
  } else if (activeTab.value === 'node') {
    return nodes.value
  } else if (activeTab.value === 'app') {
    return apps.value
  }
  return []
})

const getTypeTag = (type) => {
  const map = { flow: 'primary', node: 'success', app: 'warning' }
  return map[type] || ''
}

const getTypeName = (type) => {
  const map = { flow: '流程', node: '节点', app: '应用' }
  return map[type] || type
}

const parseJsonArray = (jsonStr) => {
  if (!jsonStr) return []
  try {
    const arr = JSON.parse(jsonStr)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

const loadAppNames = async () => {
  try {
    const res = await axios.get('/flow-brain/knowledge/app/names')
    if (res.data.code === 200) {
      appNameList.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载应用列表失败:', error)
  }
}

const handleSearch = async () => {
  if (!searchForm.keyword.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  loading.value = true
  try {
    const params = {
      keyword: searchForm.keyword,
      type: searchForm.type
    }
    if (searchForm.appName) {
      params.appName = searchForm.appName
    }
    
    const res = await axios.get('/flow-brain/knowledge/search', { params })
    if (res.data.code === 200) {
      const data = res.data.data || {}
      flows.value = data.flows || []
      nodes.value = data.nodes || []
      apps.value = data.apps || []
      hasSearched.value = true
      
      if (totalCount.value === 0) {
        ElMessage.info('未找到相关结果')
      } else {
        ElMessage.success(`找到 ${totalCount.value} 条结果`)
      }
    } else {
      ElMessage.error(res.data.message || '搜索失败')
    }
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
}

const handleItemClick = async (item) => {
  if (item.type === 'flow') {
    try {
      const res = await axios.get('/flow-brain/knowledge/flow/list', {
        params: { appName: item.appName }
      })
      if (res.data.code === 200) {
        const flow = (res.data.data || []).find(f => f.flowId === item.code)
        if (flow) {
          currentFlowDetail.value = {
            ...item,
            flowConfig: flow.flowConfig,
            subFlows: flow.subFlows,
            codePath: flow.codePath
          }
        } else {
          currentFlowDetail.value = item
        }
        flowDetailVisible.value = true
      }
    } catch (error) {
      currentFlowDetail.value = item
      flowDetailVisible.value = true
    }
  } else if (item.type === 'node') {
    currentNodeDetail.value = item
    nodeDetailVisible.value = true
  } else if (item.type === 'app') {
    currentAppDetail.value = item
    appDetailVisible.value = true
  }
}

onMounted(() => {
  loadAppNames()
})
</script>

<style scoped>
.knowledge-search {
  padding: 0;
}

.search-card {
  margin-bottom: 20px;
}

.search-header {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.search-input {
  width: 100%;
}

.search-filters {
  display: flex;
  gap: 15px;
}

.result-card {
  min-height: 400px;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  padding: 16px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: var(--card-bg);
}

.result-item:hover {
  border-color: var(--primary-color);
  box-shadow: var(--card-shadow-hover);
  transform: translateX(4px);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.item-code {
  font-size: 12px;
  color: var(--text-muted);
  font-family: 'Monaco', 'Menlo', monospace;
}

.item-desc {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
}

.item-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.knowledge-search :deep(.el-card__body) {
  padding: 20px;
}

.knowledge-search :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-section {
  border: 1px solid var(--border-default);
  border-radius: 8px;
  overflow: hidden;
}

.info-section {
  background-color: var(--card-bg);
}

.params-section {
  background-color: var(--card-bg);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  overflow: hidden;
}

.params-section .section-title {
  background: var(--bg-muted);
  border-bottom: 1px solid var(--border-muted);
}

.subflows-section {
  background-color: var(--card-bg);
}

.subflows-section .section-title {
  background-color: var(--bg-muted);
}

.code-section {
  background-color: var(--card-bg);
}

.config-section {
  background-color: var(--card-bg);
}

.config-section .section-title {
  background-color: var(--bg-muted);
}

.detail-row {
  display: flex;
  align-items: center;
  padding: 2px 12px;
  border-bottom: 1px solid var(--border-muted);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row.full-width {
  flex-direction: column;
  align-items: flex-start;
}

.detail-row.full-width .detail-label {
  margin-bottom: 1px;
}

.detail-label {
  font-weight: 600;
  color: var(--text-primary);
  min-width: 70px;
  white-space: nowrap;
}

.detail-value {
  color: var(--text-secondary);
  word-break: break-all;
}

.section-title {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-icon {
  margin-right: 6px;
}

.section-text {
  font-size: 14px;
}

.steps-list {
  padding: 8px 12px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
  border-bottom: 1px dashed var(--border-default);
}

.step-item:last-child {
  border-bottom: none;
}

.step-index {
  color: var(--primary-color);
  font-weight: 600;
  min-width: 24px;
  font-size: 13px;
}

.step-content {
  color: var(--text-primary);
  font-size: 13px;
  flex: 1;
}

.subflows-list {
  padding: 6px 12px;
}

.config-pre {
  margin: 0;
  padding: 6px 12px;
  background-color: var(--bg-muted);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  color: var(--text-primary);
}
</style>
