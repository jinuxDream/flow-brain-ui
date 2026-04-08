<template>
  <div class="scheme-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>方案生成管理</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="方案名称">
          <el-input v-model="searchForm.schemeName" placeholder="请输入方案名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="草稿" :value="0" />
            <el-option label="已确认" :value="1" />
            <el-option label="已完成" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadSchemes">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="schemeList" style="width: 100%" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="schemeName" label="方案名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="demandTitle" label="关联需求" width="180" show-overflow-tooltip />
        <el-table-column prop="appNames" label="关联应用" width="150">
          <template #default="{ row }">
            <template v-if="row.appNames">
              <el-tag v-for="(name, idx) in parseAppNames(row.appNames)" :key="idx" size="small" style="margin-right: 4px;">
                {{ name }}
              </el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="viewDetail(row)">查看</el-button>
            <el-button text type="primary" size="small" @click="editScheme(row)">编辑</el-button>
            <el-button text type="danger" size="small" @click="deleteScheme(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadSchemes"
        @current-change="loadSchemes"
        style="margin-top: 10px; justify-content: flex-start"
      />
    </el-card>

    <el-dialog v-model="detailVisible" title="方案详情" width="90%" top="2vh" :fullscreen="isFullscreen">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>方案详情</span>
          <el-button @click="isFullscreen = !isFullscreen" circle size="small">
            <el-icon><FullScreen v-if="!isFullscreen" /><Close v-else /></el-icon>
          </el-button>
        </div>
      </template>
      <div class="detail-content" v-if="currentScheme">
        <div class="detail-section">
          <div class="section-header">
            <h3>基本信息</h3>
            <el-tag :type="getStatusTagType(currentScheme.status)" size="small">
              {{ getStatusName(currentScheme.status) }}
            </el-tag>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">方案名称：</span>
              <span class="value">{{ currentScheme.schemeName }}</span>
            </div>
            <div class="info-item">
              <span class="label">关联需求：</span>
              <span class="value">{{ currentScheme.demandTitle }}</span>
            </div>
            <div class="info-item">
              <span class="label">关联应用：</span>
              <div>
                <el-tag v-for="(name, idx) in parseAppNames(currentScheme.appNames)" :key="idx" size="small" style="margin-right: 4px;">
                  {{ name }}
                </el-tag>
              </div>
            </div>
            <div class="info-item">
              <span class="label">创建时间：</span>
              <span class="value">{{ currentScheme.createTime }}</span>
            </div>
          </div>
        </div>

        <el-tabs v-model="activeTab" class="detail-tabs">
          <el-tab-pane label="改动清单" name="changeList">
            <MdPreview :modelValue="currentScheme.changeList || '暂无内容'" />
          </el-tab-pane>
          <el-tab-pane label="实现步骤" name="implSteps">
            <MdPreview :modelValue="currentScheme.implSteps || '暂无内容'" />
          </el-tab-pane>
          <el-tab-pane label="代码示例" name="codeExamples">
            <MdPreview :modelValue="currentScheme.codeExamples || '暂无内容'" />
          </el-tab-pane>
          <el-tab-pane label="测试建议" name="testSuggestions">
            <MdPreview :modelValue="currentScheme.testSuggestions || '暂无内容'" />
          </el-tab-pane>
          <el-tab-pane label="风险提示" name="riskPoints">
            <MdPreview :modelValue="currentScheme.riskPoints || '暂无内容'" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <el-dialog v-model="editVisible" title="编辑方案" width="90%" top="2vh" :fullscreen="isEditFullscreen">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>编辑方案</span>
          <el-button @click="isEditFullscreen = !isEditFullscreen" circle size="small">
            <el-icon><FullScreen v-if="!isEditFullscreen" /><Close v-else /></el-icon>
          </el-button>
        </div>
      </template>
      <el-form :model="editForm" ref="editFormRef" label-width="80px">
        <el-form-item label="方案名称">
          <el-input v-model="editForm.schemeName" placeholder="请输入方案名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" style="width: 200px">
            <el-option label="草稿" :value="0" />
            <el-option label="已确认" :value="1" />
            <el-option label="已完成" :value="2" />
          </el-select>
        </el-form-item>
        <el-tabs v-model="editTab">
          <el-tab-pane label="改动清单" name="changeList">
            <MdEditor v-model="editForm.changeList" :style="{ height: isEditFullscreen ? 'calc(100vh - 350px)' : '300px' }" />
          </el-tab-pane>
          <el-tab-pane label="实现步骤" name="implSteps">
            <MdEditor v-model="editForm.implSteps" :style="{ height: isEditFullscreen ? 'calc(100vh - 350px)' : '300px' }" />
          </el-tab-pane>
          <el-tab-pane label="代码示例" name="codeExamples">
            <MdEditor v-model="editForm.codeExamples" :style="{ height: isEditFullscreen ? 'calc(100vh - 350px)' : '300px' }" />
          </el-tab-pane>
          <el-tab-pane label="测试建议" name="testSuggestions">
            <MdEditor v-model="editForm.testSuggestions" :style="{ height: isEditFullscreen ? 'calc(100vh - 350px)' : '300px' }" />
          </el-tab-pane>
          <el-tab-pane label="风险提示" name="riskPoints">
            <MdEditor v-model="editForm.riskPoints" :style="{ height: isEditFullscreen ? 'calc(100vh - 350px)' : '300px' }" />
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveScheme">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { MdEditor, MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

const loading = ref(false)
const detailVisible = ref(false)
const editVisible = ref(false)
const isFullscreen = ref(false)
const isEditFullscreen = ref(false)
const activeTab = ref('changeList')
const editTab = ref('changeList')

const searchForm = reactive({
  schemeName: '',
  status: null
})

const schemeList = ref([])
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const currentScheme = ref(null)
const editForm = reactive({
  id: null,
  schemeName: '',
  status: 0,
  changeList: '',
  implSteps: '',
  codeExamples: '',
  testSuggestions: '',
  riskPoints: ''
})

const parseAppNames = (appNames) => {
  if (!appNames) return []
  try {
    return JSON.parse(appNames)
  } catch {
    return appNames.split(',').filter(n => n)
  }
}

const getStatusTagType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'success' }
  return map[status] || 'info'
}

const getStatusName = (status) => {
  const map = { 0: '草稿', 1: '已确认', 2: '已完成' }
  return map[status] || '草稿'
}

const loadSchemes = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    const res = await axios.get('/flow-brain/scheme/scheme/list', { params })
    if (res.data.code === 200) {
      schemeList.value = res.data.data.records || []
      pagination.total = res.data.data.total || 0
    } else {
      ElMessage.error(res.data.msg || '加载失败')
    }
  } catch (error) {
    console.error('加载方案列表失败:', error)
    ElMessage.error('加载方案列表失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.schemeName = ''
  searchForm.status = null
  loadSchemes()
}

const viewDetail = async (row) => {
  try {
    const res = await axios.get(`/flow-brain/scheme/scheme/detail/${row.id}`)
    if (res.data.code === 200) {
      currentScheme.value = res.data.data
      detailVisible.value = true
    } else {
      ElMessage.error(res.data.msg || '获取详情失败')
    }
  } catch (error) {
    console.error('获取详情失败:', error)
    ElMessage.error('获取详情失败')
  }
}

const editScheme = async (row) => {
  try {
    const res = await axios.get(`/flow-brain/scheme/scheme/detail/${row.id}`)
    if (res.data.code === 200) {
      const data = res.data.data
      editForm.id = data.id
      editForm.schemeName = data.schemeName
      editForm.status = data.status
      editForm.changeList = data.changeList || ''
      editForm.implSteps = data.implSteps || ''
      editForm.codeExamples = data.codeExamples || ''
      editForm.testSuggestions = data.testSuggestions || ''
      editForm.riskPoints = data.riskPoints || ''
      editVisible.value = true
    }
  } catch (error) {
    console.error('获取详情失败:', error)
    ElMessage.error('获取详情失败')
  }
}

const saveScheme = async () => {
  try {
    const res = await axios.post('/flow-brain/scheme/scheme/update', editForm)
    if (res.data.code === 200) {
      ElMessage.success('保存成功')
      editVisible.value = false
      loadSchemes()
    } else {
      ElMessage.error(res.data.msg || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

const deleteScheme = (row) => {
  ElMessageBox.confirm('确定要删除该方案吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await axios.post(`/flow-brain/scheme/scheme/delete/${row.id}`)
      if (res.data.code === 200) {
        ElMessage.success('删除成功')
        loadSchemes()
      } else {
        ElMessage.error(res.data.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

onMounted(() => {
  loadSchemes()
})
</script>

<style scoped>
.scheme-management {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 10px;
}

.scheme-management :deep(.el-card__body) {
  padding: 10px 15px;
}

.scheme-management :deep(.el-form-item) {
  margin-bottom: 10px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-section {
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-default);
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
}

.info-item .label {
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 80px;
  flex-shrink: 0;
}

.info-item .value {
  color: var(--text-primary);
}

.detail-tabs {
  margin-top: 16px;
}

.detail-tabs :deep(.el-tabs__content) {
  padding: 16px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
}
</style>
