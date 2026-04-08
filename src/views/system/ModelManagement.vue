<template>
  <div class="model-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>模型管理</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            新增模型
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="模型名称">
          <el-input v-model="searchForm.modelName" placeholder="请输入模型名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="提供商">
          <el-select v-model="searchForm.provider" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="p in providers" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadModels">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="modelList" style="width: 100%" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="modelName" label="模型名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="modelCode" label="模型编码" width="150" show-overflow-tooltip />
        <el-table-column prop="provider" label="提供商" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.provider }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="modelVersion" label="版本" width="120" />
        <el-table-column prop="maxTokens" label="最大Token" width="100" />
        <el-table-column prop="temperature" label="温度" width="80" />
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
            <el-button text type="primary" size="small" @click="editModel(row)">编辑</el-button>
            <el-button text type="success" size="small" @click="setDefault(row)" :disabled="row.isDefault === 1">设为默认</el-button>
            <el-button text type="danger" size="small" @click="deleteModel(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadModels"
        @current-change="loadModels"
        style="margin-top: 10px; justify-content: flex-start"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="modelForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="modelForm.modelName" placeholder="如：GPT-4、通义千问-Max" />
        </el-form-item>
        <el-form-item label="模型编码" prop="modelCode">
          <el-input v-model="modelForm.modelCode" placeholder="如：gpt-4、qwen-max" />
        </el-form-item>
        <el-form-item label="提供商" prop="provider">
          <el-select v-model="modelForm.provider" placeholder="请选择" style="width: 100%" @change="onProviderChange">
            <el-option v-for="p in providers" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="API Key" prop="apiKey">
          <el-input v-model="modelForm.apiKey" type="password" show-password placeholder="请输入API Key" />
        </el-form-item>
        <el-form-item label="API地址">
          <el-input v-model="modelForm.apiEndpoint" :placeholder="defaultEndpoint" />
          <div class="form-tip">留空使用默认地址</div>
        </el-form-item>
        <el-form-item label="模型版本">
          <el-input v-model="modelForm.modelVersion" placeholder="如：v1.0、2024-01" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最大Token">
              <el-input-number v-model="modelForm.maxTokens" :min="1" :max="128000" :step="1000" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="温度参数">
              <el-slider v-model="modelForm.temperature" :min="0" :max="2" :step="0.1" show-input />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="modelForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增模型')
const isEdit = ref(false)
const formRef = ref(null)

const providers = ref([])
const modelList = ref([])

const searchForm = reactive({
  modelName: '',
  provider: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const modelForm = reactive({
  id: null,
  modelName: '',
  modelCode: '',
  provider: '',
  apiKey: '',
  apiEndpoint: '',
  modelVersion: '',
  maxTokens: 4096,
  temperature: 0.7,
  remark: ''
})

const defaultEndpoints = {
  'OpenAI': 'https://api.openai.com/v1',
  'Azure OpenAI': '',
  '通义千问': 'https://dashscope.aliyuncs.com/api/v1',
  '文心一言': 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1',
  '智谱AI': 'https://open.bigmodel.cn/api/paas/v4',
  'Moonshot': 'https://api.moonshot.cn/v1',
  'DeepSeek': 'https://api.deepseek.com/v1',
  'Ollama': 'http://localhost:11434'
}

const defaultEndpoint = computed(() => {
  return defaultEndpoints[modelForm.provider] || ''
})

const rules = {
  modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  provider: [{ required: true, message: '请选择提供商', trigger: 'change' }],
  apiKey: [{ required: true, message: '请输入API Key', trigger: 'blur' }]
}

const onProviderChange = () => {
  if (!modelForm.apiEndpoint && defaultEndpoint.value) {
    modelForm.apiEndpoint = defaultEndpoint.value
  }
}

const loadProviders = async () => {
  try {
    const res = await axios.get('/flow-brain/system/model/providers')
    if (res.data.code === 200) {
      providers.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载提供商列表失败:', error)
  }
}

const loadModels = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    const res = await axios.get('/flow-brain/system/model/list', { params })
    if (res.data.code === 200) {
      modelList.value = res.data.data.records || []
      pagination.total = res.data.data.total || 0
    } else {
      ElMessage.error(res.data.msg || '加载失败')
    }
  } catch (error) {
    console.error('加载模型列表失败:', error)
    ElMessage.error('加载模型列表失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.modelName = ''
  searchForm.provider = ''
  loadModels()
}

const showAddDialog = () => {
  dialogTitle.value = '新增模型'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const editModel = (row) => {
  dialogTitle.value = '编辑模型'
  isEdit.value = true
  Object.assign(modelForm, {
    id: row.id,
    modelName: row.modelName,
    modelCode: row.modelCode,
    provider: row.provider,
    apiKey: '',
    apiEndpoint: row.apiEndpoint,
    modelVersion: row.modelVersion,
    maxTokens: row.maxTokens,
    temperature: row.temperature,
    remark: row.remark
  })
  dialogVisible.value = true
}

const resetForm = () => {
  modelForm.id = null
  modelForm.modelName = ''
  modelForm.modelCode = ''
  modelForm.provider = ''
  modelForm.apiKey = ''
  modelForm.apiEndpoint = ''
  modelForm.modelVersion = ''
  modelForm.maxTokens = 4096
  modelForm.temperature = 0.7
  modelForm.remark = ''
  formRef.value?.resetFields()
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const api = isEdit.value ? '/flow-brain/system/model/update' : '/flow-brain/system/model/add'
        const res = await axios.post(api, modelForm)
        if (res.data.code === 200) {
          ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
          dialogVisible.value = false
          loadModels()
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
    const res = await axios.post(`/flow-brain/system/model/toggleStatus/${row.id}`)
    if (res.data.code === 200) {
      ElMessage.success('状态更新成功')
      loadModels()
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
    const res = await axios.post(`/flow-brain/system/model/setDefault/${row.id}`)
    if (res.data.code === 200) {
      ElMessage.success('已设为默认模型')
      loadModels()
    } else {
      ElMessage.error(res.data.msg || '操作失败')
    }
  } catch (error) {
    console.error('设置默认失败:', error)
    ElMessage.error('设置默认失败')
  }
}

const deleteModel = (row) => {
  ElMessageBox.confirm('确定要删除该模型吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await axios.post(`/flow-brain/system/model/delete/${row.id}`)
      if (res.data.code === 200) {
        ElMessage.success('删除成功')
        loadModels()
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
  loadProviders()
  loadModels()
})
</script>

<style scoped>
.model-management {
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

.model-management :deep(.el-card__body) {
  padding: 10px 15px;
}

.model-management :deep(.el-form-item) {
  margin-bottom: 10px;
}

.form-tip {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}
</style>
