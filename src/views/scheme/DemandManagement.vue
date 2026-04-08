<template>
  <div class="demand-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>需求管理</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            新增需求
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="需求标题">
          <el-input v-model="searchForm.demandTitle" placeholder="请输入需求标题" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="需求类型">
          <el-select v-model="searchForm.demandType" placeholder="全部类型" clearable style="width: 120px">
            <el-option label="新功能" value="feature" />
            <el-option label="优化" value="optimize" />
            <el-option label="缺陷" value="bug" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="待分析" :value="0" />
            <el-option label="分析中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="已关闭" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadDemands">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="demandList" style="width: 100%" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="demandTitle" label="需求标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="demandType" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.demandType)" size="small">
              {{ getTypeName(row.demandType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority)" size="small">
              {{ getPriorityName(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="appNames" label="关联应用" width="150">
          <template #default="{ row }">
            <template v-if="row.appNames">
              <el-tag v-for="(name, idx) in parseAppNames(row.appNames)" :key="idx" size="small" style="margin-right: 4px;">
                {{ name }}
              </el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="viewDetail(row)">查看</el-button>
            <el-button text type="success" size="small" @click="generateScheme(row)">生成方案</el-button>
            <el-button text type="primary" size="small" @click="editDemand(row)">编辑</el-button>
            <el-button text type="danger" size="small" @click="deleteDemand(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadDemands"
        @current-change="loadDemands"
        style="margin-top: 10px; justify-content: flex-start"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="900px" top="5vh">
      <el-form :model="demandForm" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="需求标题" prop="demandTitle">
          <el-input v-model="demandForm.demandTitle" placeholder="请输入需求标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="需求类型" prop="demandType">
              <el-select v-model="demandForm.demandType" placeholder="请选择需求类型" style="width: 100%">
                <el-option label="新功能" value="feature" />
                <el-option label="优化" value="optimize" />
                <el-option label="缺陷" value="bug" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="demandForm.priority" placeholder="请选择优先级" style="width: 100%">
                <el-option label="低" :value="0" />
                <el-option label="中" :value="1" />
                <el-option label="高" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="关联应用">
          <el-select v-model="demandForm.appNames" multiple filterable placeholder="请选择关联应用（可多选）" style="width: 100%">
            <el-option v-for="name in appNameList" :key="name" :label="name" :value="name" />
          </el-select>
        </el-form-item>
        <el-form-item label="需求内容" prop="demandContent">
          <MdEditor v-model="demandForm.demandContent" :toolbars="editorToolbars" placeholder="请输入需求内容，支持Markdown格式" style="height: 300px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="需求详情" width="95%" top="2vh" :fullscreen="isFullscreen">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>需求详情</span>
          <el-button @click="isFullscreen = !isFullscreen" circle size="small">
            <el-icon><FullScreen v-if="!isFullscreen" /><Close v-else /></el-icon>
          </el-button>
        </div>
      </template>
      <div class="detail-content" v-if="currentDemand">
        <div class="detail-section">
          <div class="section-header">
            <h3>基本信息</h3>
            <el-tag :type="getStatusTagType(currentDemand.status)" size="small">
              {{ getStatusName(currentDemand.status) }}
            </el-tag>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">需求标题：</span>
              <span class="value">{{ currentDemand.demandTitle }}</span>
            </div>
            <div class="info-item">
              <span class="label">需求类型：</span>
              <el-tag :type="getTypeTagType(currentDemand.demandType)" size="small">
                {{ getTypeName(currentDemand.demandType) }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">优先级：</span>
              <el-tag :type="getPriorityTagType(currentDemand.priority)" size="small">
                {{ getPriorityName(currentDemand.priority) }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">关联应用：</span>
              <div>
                <el-tag v-for="(name, idx) in parseAppNames(currentDemand.appNames)" :key="idx" size="small" style="margin-right: 4px;">
                  {{ name }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-header">
            <h3>需求内容</h3>
          </div>
          <MdPreview :modelValue="currentDemand.demandContent || '暂无内容'" />
        </div>

        <div class="detail-section">
          <div class="section-header">
            <h3>方案列表</h3>
            <el-button type="primary" size="small" @click="generateScheme(currentDemand)">
              <el-icon><Plus /></el-icon>
              生成新方案
            </el-button>
          </div>
          
          <div v-if="schemeList.length === 0" class="empty-scheme">
            <el-empty description="暂无方案，点击上方按钮生成" :image-size="80" />
          </div>
          
          <div v-else class="scheme-list">
            <div v-for="scheme in schemeList" :key="scheme.id" class="scheme-item" :class="{ 'is-latest': scheme.isLatest === 1 }">
              <div class="scheme-header">
                <span class="scheme-name">{{ scheme.schemeName }}</span>
                <div class="scheme-tags">
                  <el-tag v-if="scheme.isLatest === 1" type="success" size="small">最新</el-tag>
                  <el-tag :type="scheme.conclusion === 1 ? 'success' : 'danger'" size="small">
                    {{ scheme.conclusion === 1 ? '✅ 能做' : '❌ 不能做' }}
                  </el-tag>
                  <el-tag :type="getSchemeStatusTagType(scheme.status)" size="small">
                    {{ getSchemeStatusName(scheme.status) }}
                  </el-tag>
                </div>
              </div>
              <div class="scheme-actions">
                <el-button text type="primary" size="small" @click="viewScheme(scheme)">查看详情</el-button>
                <el-button text type="primary" size="small" @click="editScheme(scheme)">编辑</el-button>
                <el-button v-if="scheme.isLatest !== 1" text type="warning" size="small" @click="setLatest(scheme)">设为最新</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="schemeDetailVisible" title="方案详情" width="95%" top="2vh" :fullscreen="isSchemeFullscreen">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>{{ currentScheme?.schemeName }}</span>
          <el-button @click="isSchemeFullscreen = !isSchemeFullscreen" circle size="small">
            <el-icon><FullScreen v-if="!isSchemeFullscreen" /><Close v-else /></el-icon>
          </el-button>
        </div>
      </template>
      <div class="scheme-detail" v-if="currentScheme">
        <div class="conclusion-banner" :class="currentScheme.conclusion === 1 ? 'can-do' : 'cannot-do'">
          <span class="conclusion-icon">{{ currentScheme.conclusion === 1 ? '✅' : '❌' }}</span>
          <span class="conclusion-text">{{ currentScheme.conclusion === 1 ? '能做' : '不能做' }}</span>
        </div>

        <div v-if="currentScheme.conclusion === 0 && currentScheme.rejectReason" class="reject-section">
          <h3>不能做原因</h3>
          <MdPreview :modelValue="currentScheme.rejectReason" />
        </div>

        <el-tabs v-model="schemeTab" v-if="currentScheme.conclusion === 1">
          <el-tab-pane label="影响范围" name="impactScope">
            <MdPreview :modelValue="currentScheme.impactScope || '暂无内容'" />
          </el-tab-pane>
          <el-tab-pane label="核心机制" name="coreMechanism">
            <MdPreview :modelValue="currentScheme.coreMechanism || '暂无内容'" />
          </el-tab-pane>
          <el-tab-pane label="业务流程" name="businessFlow">
            <MdPreview :modelValue="currentScheme.businessFlow || '暂无内容'" />
          </el-tab-pane>
          <el-tab-pane label="改动清单" name="changeList">
            <MdPreview :modelValue="currentScheme.changeList || '暂无内容'" />
          </el-tab-pane>
          <el-tab-pane label="测试用例" name="testCases">
            <MdPreview :modelValue="currentScheme.testCases || '暂无内容'" />
          </el-tab-pane>
          <el-tab-pane label="风险提示" name="riskPoints">
            <MdPreview :modelValue="currentScheme.riskPoints || '暂无内容'" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <el-dialog v-model="schemeEditVisible" title="编辑方案" width="95%" top="2vh" :fullscreen="isEditFullscreen">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>编辑方案</span>
          <el-button @click="isEditFullscreen = !isEditFullscreen" circle size="small">
            <el-icon><FullScreen v-if="!isEditFullscreen" /><Close v-else /></el-icon>
          </el-button>
        </div>
      </template>
      <el-form :model="schemeForm" ref="schemeFormRef" label-width="100px">
        <el-form-item label="方案名称">
          <el-input v-model="schemeForm.schemeName" placeholder="请输入方案名称" />
        </el-form-item>
        <el-form-item label="结论">
          <el-radio-group v-model="schemeForm.conclusion">
            <el-radio :label="1">✅ 能做</el-radio>
            <el-radio :label="0">❌ 不能做</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="不能做原因" v-if="schemeForm.conclusion === 0">
          <MdEditor v-model="schemeForm.rejectReason" :style="{ height: isEditFullscreen ? 'calc(100vh - 400px)' : '200px' }" />
        </el-form-item>
        <template v-if="schemeForm.conclusion === 1">
          <el-form-item label="影响范围">
            <MdEditor v-model="schemeForm.impactScope" :style="{ height: isEditFullscreen ? 'calc(100vh - 500px)' : '200px' }" />
          </el-form-item>
          <el-form-item label="核心机制">
            <MdEditor v-model="schemeForm.coreMechanism" :style="{ height: isEditFullscreen ? 'calc(100vh - 500px)' : '200px' }" />
          </el-form-item>
          <el-form-item label="业务流程">
            <MdEditor v-model="schemeForm.businessFlow" :style="{ height: isEditFullscreen ? 'calc(100vh - 500px)' : '200px' }" />
          </el-form-item>
          <el-form-item label="改动清单">
            <MdEditor v-model="schemeForm.changeList" :style="{ height: isEditFullscreen ? 'calc(100vh - 500px)' : '200px' }" />
          </el-form-item>
          <el-form-item label="测试用例">
            <MdEditor v-model="schemeForm.testCases" :style="{ height: isEditFullscreen ? 'calc(100vh - 500px)' : '200px' }" />
          </el-form-item>
          <el-form-item label="风险提示">
            <MdEditor v-model="schemeForm.riskPoints" :style="{ height: isEditFullscreen ? 'calc(100vh - 500px)' : '150px' }" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="schemeEditVisible = false">取消</el-button>
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
const dialogVisible = ref(false)
const detailVisible = ref(false)
const schemeDetailVisible = ref(false)
const schemeEditVisible = ref(false)
const isFullscreen = ref(false)
const isSchemeFullscreen = ref(false)
const isEditFullscreen = ref(false)
const dialogTitle = ref('新增需求')
const isEdit = ref(false)
const formRef = ref(null)
const schemeFormRef = ref(null)
const schemeTab = ref('impactScope')

const editorToolbars = [
  'bold', 'underline', 'italic', 'strikeThrough',
  '-', 'title', 'sub', 'sup', 'quote',
  '-', 'unorderedList', 'orderedList', 'task',
  '-', 'codeRow', 'code',
  '-', 'link', 'image', 'table',
  '-', 'revoke', 'next',
  '=', 'pageFullscreen', 'fullscreen', 'preview'
]

const searchForm = reactive({
  demandTitle: '',
  demandType: '',
  status: null
})

const demandList = ref([])
const appNameList = ref([])
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const demandForm = reactive({
  id: null,
  demandTitle: '',
  demandContent: '',
  demandType: 'feature',
  priority: 1,
  appNames: []
})

const currentDemand = ref(null)
const schemeList = ref([])
const currentScheme = ref(null)

const schemeForm = reactive({
  id: null,
  schemeName: '',
  conclusion: 1,
  rejectReason: '',
  impactScope: '',
  coreMechanism: '',
  businessFlow: '',
  changeList: '',
  testCases: '',
  riskPoints: ''
})

const rules = {
  demandTitle: [{ required: true, message: '请输入需求标题', trigger: 'blur' }],
  demandType: [{ required: true, message: '请选择需求类型', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }]
}

const parseAppNames = (appNames) => {
  if (!appNames) return []
  try {
    return JSON.parse(appNames)
  } catch {
    return appNames.split(',').filter(n => n)
  }
}

const getTypeTagType = (type) => {
  const map = { feature: 'primary', optimize: 'warning', bug: 'danger' }
  return map[type] || 'info'
}

const getTypeName = (type) => {
  const map = { feature: '新功能', optimize: '优化', bug: '缺陷' }
  return map[type] || type
}

const getPriorityTagType = (priority) => {
  const map = { 0: 'info', 1: 'warning', 2: 'danger' }
  return map[priority] || 'info'
}

const getPriorityName = (priority) => {
  const map = { 0: '低', 1: '中', 2: '高' }
  return map[priority] || '中'
}

const getStatusTagType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }
  return map[status] || 'info'
}

const getStatusName = (status) => {
  const map = { 0: '待分析', 1: '分析中', 2: '已完成', 3: '已关闭' }
  return map[status] || '待分析'
}

const getSchemeStatusTagType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'success' }
  return map[status] || 'info'
}

const getSchemeStatusName = (status) => {
  const map = { 0: '草稿', 1: '已确认', 2: '已完成' }
  return map[status] || '草稿'
}

const loadDemands = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    const res = await axios.get('/flow-brain/scheme/demand/list', { params })
    if (res.data.code === 200) {
      demandList.value = res.data.data.records || []
      pagination.total = res.data.data.total || 0
    } else {
      ElMessage.error(res.data.msg || '加载失败')
    }
  } catch (error) {
    console.error('加载需求列表失败:', error)
    ElMessage.error('加载需求列表失败')
  } finally {
    loading.value = false
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

const loadSchemes = async (demandId) => {
  try {
    const res = await axios.get(`/flow-brain/scheme/scheme/listByDemand/${demandId}`)
    if (res.data.code === 200) {
      schemeList.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载方案列表失败:', error)
  }
}

const resetSearch = () => {
  searchForm.demandTitle = ''
  searchForm.demandType = ''
  searchForm.status = null
  loadDemands()
}

const showAddDialog = () => {
  dialogTitle.value = '新增需求'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const editDemand = (row) => {
  dialogTitle.value = '编辑需求'
  isEdit.value = true
  Object.assign(demandForm, {
    id: row.id,
    demandTitle: row.demandTitle,
    demandContent: row.demandContent,
    demandType: row.demandType,
    priority: row.priority,
    appNames: parseAppNames(row.appNames)
  })
  dialogVisible.value = true
}

const resetForm = () => {
  demandForm.id = null
  demandForm.demandTitle = ''
  demandForm.demandContent = ''
  demandForm.demandType = 'feature'
  demandForm.priority = 1
  demandForm.appNames = []
  formRef.value?.resetFields()
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const submitData = {
          ...demandForm,
          appNames: JSON.stringify(demandForm.appNames)
        }
        const api = isEdit.value ? '/flow-brain/scheme/demand/update' : '/flow-brain/scheme/demand/add'
        const res = await axios.post(api, submitData)
        if (res.data.code === 200) {
          ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
          dialogVisible.value = false
          loadDemands()
        } else {
          ElMessage.error(res.data.msg || '操作失败')
        }
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error('操作失败')
      }
    }
  })
}

const viewDetail = async (row) => {
  try {
    const res = await axios.get(`/flow-brain/scheme/demand/detail/${row.id}`)
    if (res.data.code === 200) {
      currentDemand.value = res.data.data
      loadSchemes(row.id)
      detailVisible.value = true
    } else {
      ElMessage.error(res.data.msg || '获取详情失败')
    }
  } catch (error) {
    console.error('获取详情失败:', error)
    ElMessage.error('获取详情失败')
  }
}

const generateScheme = async (row) => {
  ElMessageBox.confirm('确定要为该需求生成方案吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      const res = await axios.post(`/flow-brain/scheme/scheme/generate/${row.id || currentDemand.value.id}`)
      if (res.data.code === 200) {
        ElMessage.success('方案生成成功')
        if (currentDemand.value) {
          loadSchemes(currentDemand.value.id)
        }
        loadDemands()
      } else {
        ElMessage.error(res.data.msg || '生成失败')
      }
    } catch (error) {
      console.error('生成方案失败:', error)
      ElMessage.error('生成方案失败')
    }
  })
}

const viewScheme = async (scheme) => {
  currentScheme.value = scheme
  schemeTab.value = 'impactScope'
  schemeDetailVisible.value = true
}

const editScheme = async (scheme) => {
  try {
    const res = await axios.get(`/flow-brain/scheme/scheme/detail/${scheme.id}`)
    if (res.data.code === 200) {
      const data = res.data.data
      schemeForm.id = data.id
      schemeForm.schemeName = data.schemeName
      schemeForm.conclusion = data.conclusion ?? 1
      schemeForm.rejectReason = data.rejectReason || ''
      schemeForm.impactScope = data.impactScope || ''
      schemeForm.coreMechanism = data.coreMechanism || ''
      schemeForm.businessFlow = data.businessFlow || ''
      schemeForm.changeList = data.changeList || ''
      schemeForm.testCases = data.testCases || ''
      schemeForm.riskPoints = data.riskPoints || ''
      schemeEditVisible.value = true
    }
  } catch (error) {
    console.error('获取方案详情失败:', error)
    ElMessage.error('获取方案详情失败')
  }
}

const saveScheme = async () => {
  try {
    const res = await axios.post('/flow-brain/scheme/scheme/update', schemeForm)
    if (res.data.code === 200) {
      ElMessage.success('保存成功')
      schemeEditVisible.value = false
      if (currentDemand.value) {
        loadSchemes(currentDemand.value.id)
      }
    } else {
      ElMessage.error(res.data.msg || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

const setLatest = async (scheme) => {
  try {
    const res = await axios.post(`/flow-brain/scheme/scheme/setLatest/${scheme.id}`)
    if (res.data.code === 200) {
      ElMessage.success('已设为最新版本')
      if (currentDemand.value) {
        loadSchemes(currentDemand.value.id)
      }
    } else {
      ElMessage.error(res.data.msg || '操作失败')
    }
  } catch (error) {
    console.error('设置最新失败:', error)
    ElMessage.error('设置最新失败')
  }
}

const deleteDemand = (row) => {
  ElMessageBox.confirm('确定要删除该需求吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await axios.post(`/flow-brain/scheme/demand/delete/${row.id}`)
      if (res.data.code === 200) {
        ElMessage.success('删除成功')
        loadDemands()
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
  loadDemands()
  loadAppNames()
})
</script>

<style scoped>
.demand-management {
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

.demand-management :deep(.el-card__body) {
  padding: 10px 15px;
}

.demand-management :deep(.el-form-item) {
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

.empty-scheme {
  padding: 20px;
}

.scheme-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scheme-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  transition: all 0.3s;
}

.scheme-item:hover {
  border-color: var(--primary-300);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.scheme-item.is-latest {
  border-color: var(--primary-500);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
}

.scheme-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scheme-name {
  font-weight: 500;
  color: var(--text-primary);
}

.scheme-tags {
  display: flex;
  gap: 4px;
}

.scheme-actions {
  display: flex;
  gap: 4px;
}

.scheme-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.conclusion-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
}

.conclusion-banner.can-do {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(74, 222, 128, 0.1) 100%);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.conclusion-banner.cannot-do {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(248, 113, 113, 0.1) 100%);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.conclusion-icon {
  font-size: 24px;
  margin-right: 8px;
}

.reject-section {
  padding: 16px;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
}

.reject-section h3 {
  margin: 0 0 12px 0;
  color: #dc2626;
}
</style>
