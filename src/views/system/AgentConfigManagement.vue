<template>
  <div class="agent-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon :size="24"><Avatar /></el-icon>
            <span>助手管理</span>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane name="config">
          <template #label>
            <span class="tab-label">
              <el-icon><Setting /></el-icon>
              助手配置
            </span>
          </template>
          <div class="tab-header">
            <el-button type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              新增助手
            </el-button>
          </div>

          <el-form :inline="true" :model="searchForm" class="search-form">
            <el-form-item label="助手名称">
              <el-input v-model="searchForm.agentName" placeholder="请输入助手名称" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item label="助手类型">
              <el-select v-model="searchForm.agentType" placeholder="全部" clearable style="width: 150px">
                <el-option label="知识问答" value="knowledge" />
                <el-option label="代码生成" value="code" />
                <el-option label="方案设计" value="scheme" />
                <el-option label="通用助手" value="general" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadAgents">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="agentList" style="width: 100%" v-loading="loading">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="agentName" label="助手名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="agentCode" label="助手编码" width="150" show-overflow-tooltip />
            <el-table-column prop="agentType" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="getTypeTagType(row.agentType)">{{ getTypeName(row.agentType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="modelName" label="使用模型" width="150" show-overflow-tooltip />
            <el-table-column prop="capabilities" label="能力" min-width="200" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" />
              </template>
            </el-table-column>
            <el-table-column prop="isDefault" label="默认" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.isDefault === 1" type="success" size="small">默认</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="160" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="editAgent(row)">编辑</el-button>
                <el-button text type="success" size="small" @click="setDefault(row)" :disabled="row.isDefault === 1">设为默认</el-button>
                <el-button text type="danger" size="small" @click="deleteAgent(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.size"
            :total="pagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="loadAgents"
            @current-change="loadAgents"
            style="margin-top: 10px; justify-content: flex-start"
          />
        </el-tab-pane>

        <el-tab-pane name="history">
          <template #label>
            <span class="tab-label">
              <el-icon><ChatLineSquare /></el-icon>
              对话历史
            </span>
          </template>
          <el-form :inline="true" :model="historySearchForm" class="search-form">
            <el-form-item label="会话ID">
              <el-input v-model="historySearchForm.sessionId" placeholder="请输入会话ID" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item label="助手">
              <el-select v-model="historySearchForm.agentCode" placeholder="全部" clearable style="width: 150px">
                <el-option v-for="a in agentList" :key="a.agentCode" :label="a.agentName" :value="a.agentCode" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadConversations">查询</el-button>
              <el-button @click="resetHistorySearch">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="conversationList" style="width: 100%" v-loading="historyLoading" @row-click="viewDetail">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="sessionId" label="会话ID" width="180" show-overflow-tooltip />
            <el-table-column prop="agentCode" label="助手" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ getAgentName(row.agentCode) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="modelName" label="模型" width="150" show-overflow-tooltip />
            <el-table-column prop="role" label="角色" width="80">
              <template #default="{ row }">
                <el-tag :type="row.role === 'user' ? 'primary' : 'success'" size="small">
                  {{ row.role === 'user' ? '用户' : '助手' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="intent" label="意图" width="120" show-overflow-tooltip />
            <el-table-column prop="skillUsed" label="使用技能" width="120" show-overflow-tooltip />
            <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
            <el-table-column prop="promptTokens" label="输入Token" width="100">
              <template #default="{ row }">
                {{ row.promptTokens || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="completionTokens" label="输出Token" width="100">
              <template #default="{ row }">
                {{ row.completionTokens || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="costTime" label="耗时(ms)" width="100">
              <template #default="{ row }">
                {{ row.costTime || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间" width="160" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click.stop="viewDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="historyPagination.page"
            v-model:page-size="historyPagination.size"
            :total="historyPagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="loadConversations"
            @current-change="loadConversations"
            style="margin-top: 10px; justify-content: flex-start"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form :model="agentForm" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="助手名称" prop="agentName">
              <el-input v-model="agentForm.agentName" placeholder="如：业务知识助手" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="助手编码" prop="agentCode">
              <el-input v-model="agentForm.agentCode" placeholder="如：knowledge-agent" :disabled="isEdit" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="助手类型" prop="agentType">
              <el-select v-model="agentForm.agentType" placeholder="请选择" style="width: 100%">
                <el-option label="知识问答" value="knowledge" />
                <el-option label="代码生成" value="code" />
                <el-option label="方案设计" value="scheme" />
                <el-option label="通用助手" value="general" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用模型" prop="modelId">
              <el-select v-model="agentForm.modelId" placeholder="请选择模型" style="width: 100%">
                <el-option v-for="m in modelList" :key="m.id" :label="m.modelName" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="agentForm.description" type="textarea" :rows="2" placeholder="助手功能描述" />
        </el-form-item>
        <el-form-item label="系统提示词" prop="systemPrompt">
          <el-input v-model="agentForm.systemPrompt" type="textarea" :rows="4" placeholder="定义助手的角色和行为规则" />
        </el-form-item>
        <el-form-item label="能力标签">
          <el-select v-model="agentForm.capabilityList" multiple placeholder="选择助手能力" style="width: 100%">
            <el-option label="知识检索" value="knowledge_search" />
            <el-option label="代码分析" value="code_analysis" />
            <el-option label="流程解析" value="flow_parse" />
            <el-option label="API调用" value="api_call" />
            <el-option label="数据库查询" value="db_query" />
            <el-option label="方案生成" value="scheme_gen" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="温度参数">
              <el-slider v-model="agentForm.temperature" :min="0" :max="2" :step="0.1" show-input />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大Token">
              <el-input-number v-model="agentForm.maxTokens" :min="1" :max="128000" :step="1000" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="agentForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="对话详情" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="会话ID">{{ currentConversation.sessionId }}</el-descriptions-item>
        <el-descriptions-item label="助手">{{ getAgentName(currentConversation.agentCode) }}</el-descriptions-item>
        <el-descriptions-item label="使用模型">{{ currentConversation.modelName }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ currentConversation.role === 'user' ? '用户' : '助手' }}</el-descriptions-item>
        <el-descriptions-item label="意图">{{ currentConversation.intent }}</el-descriptions-item>
        <el-descriptions-item label="使用技能">{{ currentConversation.skillUsed }}</el-descriptions-item>
        <el-descriptions-item label="输入Token">{{ currentConversation.promptTokens }}</el-descriptions-item>
        <el-descriptions-item label="输出Token">{{ currentConversation.completionTokens }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ currentConversation.costTime }}ms</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentConversation.createTime }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider content-position="left">对话内容</el-divider>
      <div class="content-box">
        <pre>{{ currentConversation.content }}</pre>
      </div>
      
      <el-divider content-position="left" v-if="currentConversation.context">上下文信息</el-divider>
      <div class="context-box" v-if="currentConversation.context">
        <pre>{{ formatContext(currentConversation.context) }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const activeTab = ref('config')
const loading = ref(false)
const historyLoading = ref(false)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('新增助手')
const isEdit = ref(false)
const formRef = ref(null)
const currentConversation = ref({})

const agentList = ref([])
const modelList = ref([])
const conversationList = ref([])

const searchForm = reactive({
  agentName: '',
  agentType: ''
})

const historySearchForm = reactive({
  sessionId: '',
  agentCode: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const historyPagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const agentForm = reactive({
  id: null,
  agentName: '',
  agentCode: '',
  agentType: '',
  description: '',
  systemPrompt: '',
  modelId: null,
  temperature: 0.7,
  maxTokens: 4096,
  capabilityList: [],
  remark: ''
})

const rules = {
  agentName: [{ required: true, message: '请输入助手名称', trigger: 'blur' }],
  agentCode: [{ required: true, message: '请输入助手编码', trigger: 'blur' }],
  agentType: [{ required: true, message: '请选择助手类型', trigger: 'change' }],
  systemPrompt: [{ required: true, message: '请输入系统提示词', trigger: 'blur' }]
}

const getTypeName = (type) => {
  const map = { knowledge: '知识问答', code: '代码生成', scheme: '方案设计', general: '通用助手' }
  return map[type] || type
}

const getTypeTagType = (type) => {
  const map = { knowledge: 'primary', code: 'success', scheme: 'warning', general: 'info' }
  return map[type] || ''
}

const getAgentName = (agentCode) => {
  const agent = agentList.value.find(a => a.agentCode === agentCode)
  return agent ? agent.agentName : agentCode || '-'
}

const formatContext = (context) => {
  try {
    const obj = JSON.parse(context)
    return JSON.stringify(obj, null, 2)
  } catch {
    return context
  }
}

const loadModels = async () => {
  try {
    const res = await axios.get('/flow-brain/system/model/list', { params: { page: 1, size: 100 } })
    if (res.data.code === 200) {
      modelList.value = res.data.data.records || []
    }
  } catch (error) {
    console.error('加载模型列表失败:', error)
  }
}

const loadAgents = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    const res = await axios.get('/flow-brain/agent/config/page', { params })
    if (res.data.code === 200) {
      agentList.value = res.data.data.records || []
      pagination.total = res.data.data.total || 0
    } else {
      ElMessage.error(res.data.msg || '加载失败')
    }
  } catch (error) {
    console.error('加载助手列表失败:', error)
    ElMessage.error('加载助手列表失败')
  } finally {
    loading.value = false
  }
}

const loadConversations = async () => {
  historyLoading.value = true
  try {
    const params = {
      page: historyPagination.page,
      size: historyPagination.size,
      ...historySearchForm
    }
    const res = await axios.get('/flow-brain/agent/conversation/page', { params })
    if (res.data.code === 200) {
      conversationList.value = res.data.data.records || []
      historyPagination.total = res.data.data.total || 0
    } else {
      ElMessage.error(res.data.msg || '加载失败')
    }
  } catch (error) {
    console.error('加载对话列表失败:', error)
    ElMessage.error('加载对话列表失败')
  } finally {
    historyLoading.value = false
  }
}

const resetSearch = () => {
  searchForm.agentName = ''
  searchForm.agentType = ''
  loadAgents()
}

const resetHistorySearch = () => {
  historySearchForm.sessionId = ''
  historySearchForm.agentCode = ''
  loadConversations()
}

const showAddDialog = () => {
  dialogTitle.value = '新增助手'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const editAgent = (row) => {
  dialogTitle.value = '编辑助手'
  isEdit.value = true
  Object.assign(agentForm, {
    id: row.id,
    agentName: row.agentName,
    agentCode: row.agentCode,
    agentType: row.agentType,
    description: row.description,
    systemPrompt: row.systemPrompt,
    modelId: row.modelId,
    temperature: row.temperature,
    maxTokens: row.maxTokens,
    capabilityList: row.capabilities ? row.capabilities.split(',') : [],
    remark: row.remark
  })
  dialogVisible.value = true
}

const resetForm = () => {
  agentForm.id = null
  agentForm.agentName = ''
  agentForm.agentCode = ''
  agentForm.agentType = ''
  agentForm.description = ''
  agentForm.systemPrompt = ''
  agentForm.modelId = null
  agentForm.temperature = 0.7
  agentForm.maxTokens = 4096
  agentForm.capabilityList = []
  agentForm.remark = ''
  formRef.value?.resetFields()
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const data = {
          ...agentForm,
          capabilities: agentForm.capabilityList.join(',')
        }
        const api = '/flow-brain/agent/config'
        const method = isEdit.value ? 'put' : 'post'
        const res = await axios[method](api, data)
        if (res.data.code === 200) {
          ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
          dialogVisible.value = false
          loadAgents()
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

const toggleStatus = async (row) => {
  try {
    const res = await axios.put(`/flow-brain/agent/config/${row.id}/status?status=${row.status}`)
    if (res.data.code === 200) {
      ElMessage.success('状态更新成功')
      loadAgents()
    } else {
      ElMessage.error(res.data.msg || '操作失败')
      row.status = row.status === 1 ? 0 : 1
    }
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    row.status = row.status === 1 ? 0 : 1
  }
}

const setDefault = async (row) => {
  try {
    const res = await axios.put(`/flow-brain/agent/config/${row.id}/default`)
    if (res.data.code === 200) {
      ElMessage.success('已设为默认助手')
      loadAgents()
    } else {
      ElMessage.error(res.data.msg || '操作失败')
    }
  } catch (error) {
    console.error('设置默认失败:', error)
    ElMessage.error('设置默认失败')
  }
}

const deleteAgent = (row) => {
  ElMessageBox.confirm('确定要删除该助手吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await axios.delete(`/flow-brain/agent/config/${row.id}`)
      if (res.data.code === 200) {
        ElMessage.success('删除成功')
        loadAgents()
      } else {
        ElMessage.error(res.data.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

const viewDetail = (row) => {
  currentConversation.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
  loadModels()
  loadAgents()
})
</script>

<style scoped>
.agent-management {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-header {
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 15px;
  padding: 15px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.agent-management :deep(.el-card__body) {
  padding: 15px 20px;
}

.agent-management :deep(.el-form-item) {
  margin-bottom: 10px;
}

.agent-management :deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

.agent-management :deep(.el-tag) {
  border-radius: 12px;
}

.content-box, .context-box {
  background: var(--el-fill-color-light);
  padding: 15px;
  border-radius: 8px;
  max-height: 300px;
  overflow: auto;
}

.content-box pre, .context-box pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 13px;
  line-height: 1.6;
}

.agent-management :deep(.el-dialog) {
  border-radius: 12px;
}

.agent-management :deep(.el-descriptions) {
  border-radius: 8px;
  overflow: hidden;
}

.agent-management :deep(.el-divider__text) {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 500;
}
</style>
