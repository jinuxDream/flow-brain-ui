<template>
  <div class="data-model">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据模型管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="syncModels" :loading="syncing">
              <el-icon><Refresh /></el-icon>
              从节点参数同步
            </el-button>
            <el-button @click="syncFromJavaCode" :loading="javaSyncing">
              <el-icon><Download /></el-icon>
              从Java代码同步
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="模型类型">
          <el-select v-model="searchForm.modelType" placeholder="全部类型" clearable style="width: 120px" @change="loadModels">
            <el-option label="DTO" value="DTO" />
            <el-option label="VO" value="VO" />
            <el-option label="Entity" value="Entity" />
            <el-option label="Param" value="Param" />
            <el-option label="Table" value="Table" />
            <el-option label="View" value="View" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属应用">
          <el-select v-model="searchForm.appName" placeholder="全部应用" clearable filterable style="width: 200px" @change="loadModels">
            <el-option v-for="name in appNameList" :key="name" :label="name" :value="name" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索模型名称/编码" clearable style="width: 200px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="pagedModelList" style="width: 100%" v-loading="loading" @row-click="showModelDetail">
        <el-table-column type="index" label="序号" width="60" :index="indexMethod" />
        <el-table-column prop="modelCode" label="模型编码" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary">{{ row.modelCode }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="modelName" label="模型名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="modelType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.modelType)" size="small">{{ row.modelType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="appName" label="所属应用" min-width="120" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="更新时间" width="160" />
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click.stop="showModelDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
        style="margin-top: 10px; justify-content: flex-start"
      />
    </el-card>

    <el-dialog v-model="detailVisible" :title="currentModel?.modelName || currentModel?.modelCode || ''" width="900px">
      <template #header>
        <span>{{ currentModel?.modelName || '' }} - {{ currentModel?.modelCode }}</span>
      </template>
      <div class="detail-content">
        <div class="detail-section info-section">
          <div class="detail-row">
            <span class="detail-label">模型编码:</span>
            <span class="detail-value code">{{ currentModel?.modelCode || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">模型类型:</span>
            <span class="detail-value">
              <el-tag :type="getTypeTag(currentModel?.modelType)" size="small">{{ currentModel?.modelType }}</el-tag>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">所属应用:</span>
            <span class="detail-value">{{ currentModel?.appName || '-' }}</span>
          </div>
          <div class="detail-row" v-if="currentModel?.packageName">
            <span class="detail-label">包路径:</span>
            <span class="detail-value code">{{ currentModel.packageName }}</span>
          </div>
          <div class="detail-row" v-if="currentModel?.tableName">
            <span class="detail-label">表名:</span>
            <span class="detail-value code">{{ currentModel.tableName }}</span>
          </div>
          <div class="detail-row" v-if="currentModel?.dbName">
            <span class="detail-label">数据库:</span>
            <span class="detail-value">{{ currentModel.dbName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">描述:</span>
            <span class="detail-value">{{ currentModel?.description || '-' }}</span>
          </div>
          <div class="detail-row" v-if="currentModel?.sourceFile">
            <span class="detail-label">源文件:</span>
            <span class="detail-value code">{{ currentModel.sourceFile }}</span>
          </div>
        </div>

        <div class="detail-section fields-section">
          <div class="section-title">
            <span class="section-icon">📋</span>
            <span class="section-text">字段列表 ({{ modelFields.length }})</span>
          </div>
          <el-table :data="modelFields" style="width: 100%" size="small" border>
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="fieldName" label="字段名" min-width="120">
              <template #default="{ row }">
                <span class="field-name">{{ row.fieldName }}</span>
                <el-tag v-if="row.isPrimaryKey === 1" type="danger" size="small" style="margin-left: 4px">PK</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="fieldType" label="类型" width="120">
              <template #default="{ row }">
                <el-tag type="info" size="small">{{ row.fieldType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="isRequired" label="必填" width="60" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.isRequired === 1" type="warning" size="small">是</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="defaultValue" label="默认值" width="100" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.defaultValue">{{ row.defaultValue }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search, Download } from '@element-plus/icons-vue'
import axios from 'axios'

const loading = ref(false)
const syncing = ref(false)
const javaSyncing = ref(false)
const detailVisible = ref(false)
const modelList = ref([])
const appNameList = ref([])
const currentModel = ref(null)
const modelFields = ref([])

const searchForm = reactive({
  modelType: '',
  appName: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const pagedModelList = computed(() => {
  const start = (pagination.page - 1) * pagination.size
  const end = start + pagination.size
  return modelList.value.slice(start, end)
})

const getTypeTag = (type) => {
  const map = {
    'DTO': 'primary',
    'VO': 'success',
    'Entity': 'warning',
    'Param': 'info',
    'Table': 'danger',
    'View': ''
  }
  return map[type] || ''
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

const loadModels = async () => {
  loading.value = true
  try {
    const res = await axios.get('/flow-brain/knowledge/model/list', {
      params: {
        appName: searchForm.appName,
        modelType: searchForm.modelType
      }
    })
    if (res.data.code === 200) {
      modelList.value = res.data.data || []
      pagination.total = modelList.value.length
    }
  } catch (error) {
    console.error('加载模型列表失败:', error)
    ElMessage.error('加载模型列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  if (!searchForm.keyword.trim()) {
    loadModels()
    return
  }
  
  loading.value = true
  try {
    const res = await axios.get('/flow-brain/knowledge/model/search', {
      params: {
        keyword: searchForm.keyword,
        modelType: searchForm.modelType,
        appName: searchForm.appName
      }
    })
    if (res.data.code === 200) {
      modelList.value = res.data.data || []
      pagination.total = modelList.value.length
    }
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

const showModelDetail = async (row) => {
  try {
    const res = await axios.get('/flow-brain/knowledge/model/detail', {
      params: { id: row.id }
    })
    if (res.data.code === 200) {
      currentModel.value = res.data.data.model
      modelFields.value = res.data.data.fields || []
      detailVisible.value = true
    }
  } catch (error) {
    console.error('加载模型详情失败:', error)
    ElMessage.error('加载模型详情失败')
  }
}

const resetSearch = () => {
  searchForm.modelType = ''
  searchForm.appName = ''
  searchForm.keyword = ''
  loadModels()
}

const syncModels = async () => {
  syncing.value = true
  try {
    const res = await axios.post('/flow-brain/knowledge/model/sync')
    if (res.data.code === 200) {
      ElMessage.success('同步成功')
      loadModels()
    } else {
      ElMessage.error(res.data.msg || '同步失败')
    }
  } catch (error) {
    console.error('同步失败:', error)
    ElMessage.error('同步失败')
  } finally {
    syncing.value = false
  }
}

const syncFromJavaCode = async () => {
  if (!searchForm.appName) {
    ElMessage.warning('请先选择应用')
    return
  }
  
  javaSyncing.value = true
  try {
    const res = await axios.post('/flow-brain/knowledge/model/sync-java', null, {
      params: { appName: searchForm.appName }
    })
    if (res.data.code === 200) {
      ElMessage.success('从Java代码同步成功')
      loadModels()
    } else {
      ElMessage.error(res.data.msg || '同步失败')
    }
  } catch (error) {
    console.error('同步失败:', error)
    ElMessage.error('同步失败')
  } finally {
    javaSyncing.value = false
  }
}

const handlePageChange = () => {
}

const handlePageSizeChange = () => {
  pagination.page = 1
}

const indexMethod = (index) => {
  return (pagination.page - 1) * pagination.size + index + 1
}

onMounted(() => {
  loadAppNames()
  loadModels()
})
</script>

<style scoped>
.data-model {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-form {
  margin-bottom: 10px;
}

.data-model :deep(.el-card__body) {
  padding: 10px 15px;
}

.data-model :deep(.el-form-item) {
  margin-bottom: 10px;
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

.fields-section {
  background-color: var(--card-bg);
}

.fields-section .section-title {
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

.detail-value.code {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  background: var(--bg-muted);
  padding: 2px 6px;
  border-radius: 3px;
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

.field-name {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: var(--text-primary);
}
</style>
