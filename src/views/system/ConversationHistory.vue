<template>
  <div class="conversation-history">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>对话历史</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="会话ID">
          <el-input v-model="searchForm.sessionId" placeholder="请输入会话ID" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="助手">
          <el-select v-model="searchForm.agentCode" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="a in agentList" :key="a.agentCode" :label="a.agentName" :value="a.agentCode" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadConversations">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="conversationList" style="width: 100%" v-loading="loading" @row-click="viewDetail">
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
        <el-table-column prop="inputTokens" label="输入Token" width="100">
          <template #default="{ row }">
            {{ row.inputTokens || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="outputTokens" label="输出Token" width="100">
          <template #default="{ row }">
            {{ row.outputTokens || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="costTime" label="耗时(秒)" width="100">
          <template #default="{ row }">
            {{ row.costTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click.stop="viewDetail(row)">详情</el-button>
            <el-button text type="danger" size="small" @click.stop="deleteConversation(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadConversations"
        @current-change="loadConversations"
        style="margin-top: 10px; justify-content: flex-start"
      />
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="对话详情" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="会话ID">{{ currentConversation.sessionId }}</el-descriptions-item>
        <el-descriptions-item label="助手">{{ getAgentName(currentConversation.agentCode) }}</el-descriptions-item>
        <el-descriptions-item label="使用模型">{{ currentConversation.modelName }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ currentConversation.role === 'user' ? '用户' : '助手' }}</el-descriptions-item>
        <el-descriptions-item label="意图">{{ currentConversation.intent }}</el-descriptions-item>
        <el-descriptions-item label="使用技能">{{ currentConversation.skillUsed }}</el-descriptions-item>
        <el-descriptions-item label="输入Token">{{ currentConversation.inputTokens }}</el-descriptions-item>
        <el-descriptions-item label="输出Token">{{ currentConversation.outputTokens }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ currentConversation.costTime }}秒</el-descriptions-item>
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

const loading = ref(false)
const detailDialogVisible = ref(false)
const currentConversation = ref({})

const conversationList = ref([])
const agentList = ref([])

const searchForm = reactive({
  sessionId: '',
  agentCode: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const loadAgents = async () => {
  try {
    const res = await axios.get('/flow-brain/agent/config/list')
    if (res.data.code === 200) {
      agentList.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载助手列表失败:', error)
  }
}

const loadConversations = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    const res = await axios.get('/flow-brain/agent/conversation/page', { params })
    if (res.data.code === 200) {
      conversationList.value = res.data.data.records || []
      pagination.total = res.data.data.total || 0
    } else {
      ElMessage.error(res.data.msg || '加载失败')
    }
  } catch (error) {
    console.error('加载对话列表失败:', error)
    ElMessage.error('加载对话列表失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.sessionId = ''
  searchForm.agentCode = ''
  loadConversations()
}

const getAgentName = (agentCode) => {
  const agent = agentList.value.find(a => a.agentCode === agentCode)
  return agent ? agent.agentName : agentCode || '-'
}

const viewDetail = (row) => {
  currentConversation.value = row
  detailDialogVisible.value = true
}

const formatContext = (context) => {
  try {
    const obj = JSON.parse(context)
    return JSON.stringify(obj, null, 2)
  } catch {
    return context
  }
}

const deleteConversation = (row) => {
  ElMessageBox.confirm('确定要删除该对话记录吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await axios.delete(`/flow-brain/agent/conversation/${row.id}`)
      if (res.data.code === 200) {
        ElMessage.success('删除成功')
        loadConversations()
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
  loadAgents()
  loadConversations()
})
</script>

<style scoped>
.conversation-history {
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

.conversation-history :deep(.el-card__body) {
  padding: 10px 15px;
}

.conversation-history :deep(.el-form-item) {
  margin-bottom: 10px;
}

.content-box, .context-box {
  background: var(--bg-secondary);
  padding: 15px;
  border-radius: 4px;
  max-height: 300px;
  overflow: auto;
}

.content-box pre, .context-box pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
}
</style>
