<template>
  <div class="api-definition-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>三方接口管理</span>
          <div>
            <el-dropdown style="margin-right: 10px">
              <el-button type="success">
                <el-icon><Upload /></el-icon>
                智能导入
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="showImportDialog('openapi')">OpenAPI/Swagger</el-dropdown-item>
                  <el-dropdown-item @click="showImportDialog('postman')">Postman Collection</el-dropdown-item>
                  <el-dropdown-item @click="showImportDialog('ai')">AI智能解析</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              新增接口
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="所属应用">
          <el-select 
            v-model="searchForm.appName" 
            placeholder="全部应用" 
            clearable 
            filterable
            style="width: 200px"
          >
            <el-option 
              v-for="app in apps" 
              :key="app.appCode" 
              :label="app.appName" 
              :value="app.appCode"
            >
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%">
                <span>{{ app.appName }}</span>
                <span style="color: var(--el-text-color-secondary); font-size: 12px">
                  <el-tag 
                    :type="app.appType === 'self' ? 'primary' : 'info'" 
                    size="small"
                    style="margin-right: 5px"
                  >{{ app.appType === 'self' ? '自研' : '三方' }}</el-tag>
                  {{ app.apiCount || 0 }}接口
                </span>
              </div>
            </el-option>
          </el-select>
          <el-button text type="primary" style="margin-left: 5px" @click="showQuickAddAppDialog">
            <el-icon><Plus /></el-icon>
            新增应用
          </el-button>
        </el-form-item>
        <el-form-item label="接口名称">
          <el-input v-model="searchForm.apiName" placeholder="请输入接口名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="请求方法">
          <el-select v-model="searchForm.apiMethod" placeholder="全部" clearable style="width: 100px">
            <el-option v-for="m in methods" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadApis">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="apiList" style="width: 100%" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="appName" label="所属应用" width="140">
          <template #default="{ row }">
            <div style="display: flex; align-items: center">
              <span>{{ getAppDisplayName(row.appName) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="apiName" label="接口名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="apiMethod" label="方法" width="80">
          <template #default="{ row }">
            <el-tag :type="getMethodTagType(row.apiMethod)" size="small">{{ row.apiMethod }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="apiPath" label="接口路径" min-width="200" show-overflow-tooltip />
        <el-table-column prop="apiGroup" label="分组" width="100" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="isDeprecated" label="状态" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isDeprecated === 1" type="info" size="small">已废弃</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="editApi(row)">编辑</el-button>
            <el-button text type="danger" size="small" @click="deleteApi(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadApis"
        @current-change="loadApis"
        style="margin-top: 10px; justify-content: flex-start"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" top="5vh">
      <el-form :model="apiForm" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属应用" prop="appName">
              <el-select 
                v-model="apiForm.appName" 
                placeholder="请选择应用" 
                filterable 
                style="width: 100%"
              >
                <el-option 
                  v-for="app in apps" 
                  :key="app.appCode" 
                  :label="app.appName" 
                  :value="app.appCode"
                >
                  <div style="display: flex; justify-content: space-between; align-items: center; width: 100%">
                    <span>{{ app.appName }}</span>
                    <el-tag 
                      :type="app.appType === 'self' ? 'primary' : 'info'" 
                      size="small"
                    >{{ app.appType === 'self' ? '自研' : '三方' }}</el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="接口分组">
              <el-input v-model="apiForm.apiGroup" placeholder="如：用户模块、订单模块" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="接口名称" prop="apiName">
              <el-input v-model="apiForm.apiName" placeholder="如：获取用户信息" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="请求方法" prop="apiMethod">
              <el-select v-model="apiForm.apiMethod" placeholder="请选择" style="width: 100%">
                <el-option v-for="m in methods" :key="m" :label="m" :value="m" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="接口路径" prop="apiPath">
          <el-input v-model="apiForm.apiPath" placeholder="如：/api/user/info" />
        </el-form-item>
        <el-form-item label="接口描述">
          <el-input v-model="apiForm.description" type="textarea" :rows="2" placeholder="接口功能描述" />
        </el-form-item>
        <el-form-item label="请求参数">
          <el-input v-model="apiForm.requestParams" type="textarea" :rows="4" placeholder="JSON格式的请求参数定义" />
        </el-form-item>
        <el-form-item label="响应参数">
          <el-input v-model="apiForm.responseParams" type="textarea" :rows="4" placeholder="JSON格式的响应参数定义" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="认证方式">
              <el-select v-model="apiForm.authType" placeholder="请选择" style="width: 100%" clearable>
                <el-option label="无" value="none" />
                <el-option label="Token" value="token" />
                <el-option label="OAuth2" value="oauth2" />
                <el-option label="API Key" value="apikey" />
                <el-option label="签名认证" value="signature" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否废弃">
              <el-switch v-model="apiForm.isDeprecated" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="apiForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="importDialogVisible" :title="importDialogTitle" width="700px">
      <el-form :model="importForm" label-width="100px">
        <el-form-item label="所属应用">
          <el-select 
            v-model="importForm.appName" 
            placeholder="请选择应用" 
            filterable 
            style="width: 100%"
          >
            <el-option 
              v-for="app in apps" 
              :key="app.appCode" 
              :label="app.appName" 
              :value="app.appCode"
            >
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%">
                <span>{{ app.appName }}</span>
                <el-tag 
                  :type="app.appType === 'self' ? 'primary' : 'info'" 
                  size="small"
                >{{ app.appType === 'self' ? '自研' : '三方' }}</el-tag>
              </div>
            </el-option>
          </el-select>
          <el-button text type="primary" style="margin-left: 5px" @click="showQuickAddAppDialogInImport">
            <el-icon><Plus /></el-icon>
            新增应用
          </el-button>
        </el-form-item>
        <el-form-item v-if="importType === 'openapi-url'" label="文档URL">
          <el-input v-model="importForm.url" placeholder="请输入OpenAPI文档URL地址" />
        </el-form-item>
        <el-form-item v-else label="文档内容">
          <el-input 
            v-model="importForm.content" 
            type="textarea" 
            :rows="15" 
            :placeholder="getImportPlaceholder()" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="executeImport" :loading="importing">开始导入</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="importResultVisible" title="导入结果" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="总计">{{ importResult.totalCount }}</el-descriptions-item>
        <el-descriptions-item label="成功">{{ importResult.successCount }}</el-descriptions-item>
        <el-descriptions-item label="失败">{{ importResult.failCount }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="importResult.errors && importResult.errors.length > 0" style="margin-top: 10px">
        <el-alert type="error" v-for="(error, index) in importResult.errors" :key="index" :title="error" style="margin-bottom: 5px" />
      </div>
      <template #footer>
        <el-button type="primary" @click="importResultVisible = false">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="quickAddAppVisible" title="快速新增应用" width="500px">
      <el-form :model="quickAppForm" :rules="quickAppRules" ref="quickAppFormRef" label-width="100px">
        <el-form-item label="应用编码" prop="appCode">
          <el-input v-model="quickAppForm.appCode" placeholder="如：mall-order" />
        </el-form-item>
        <el-form-item label="应用名称" prop="appName">
          <el-input v-model="quickAppForm.appName" placeholder="如：订单系统" />
        </el-form-item>
        <el-form-item label="应用类型" prop="appType">
          <el-radio-group v-model="quickAppForm.appType">
            <el-radio label="self">自研系统</el-radio>
            <el-radio label="third">三方系统</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="quickAppForm.owner" placeholder="负责人姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quickAddAppVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQuickAddApp">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import apiDefinitionApi from '@/api/apiDefinition'
import appApi from '@/api/app'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增接口')
const isEdit = ref(false)
const formRef = ref(null)

const importDialogVisible = ref(false)
const importDialogTitle = ref('')
const importType = ref('')
const importing = ref(false)
const importResultVisible = ref(false)
const importResult = ref({})

const quickAddAppVisible = ref(false)
const quickAppFormRef = ref(null)
const isImportContext = ref(false)

const apps = ref([])
const methods = ref(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
const apiList = ref([])

const importForm = reactive({
  appName: '',
  url: '',
  content: ''
})

const searchForm = reactive({
  appName: '',
  apiName: '',
  apiMethod: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const apiForm = reactive({
  id: null,
  appName: '',
  apiName: '',
  apiPath: '',
  apiMethod: '',
  apiGroup: '',
  description: '',
  requestParams: '',
  responseParams: '',
  requestExample: '',
  responseExample: '',
  authType: '',
  isDeprecated: 0,
  remark: ''
})

const quickAppForm = reactive({
  appCode: '',
  appName: '',
  appType: 'third',
  owner: ''
})

const rules = {
  appName: [{ required: true, message: '请选择所属应用', trigger: 'change' }],
  apiName: [{ required: true, message: '请输入接口名称', trigger: 'blur' }],
  apiPath: [{ required: true, message: '请输入接口路径', trigger: 'blur' }],
  apiMethod: [{ required: true, message: '请选择请求方法', trigger: 'change' }]
}

const quickAppRules = {
  appCode: [
    { required: true, message: '请输入应用编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9-]*$/, message: '编码以字母开头，只能包含字母、数字、中划线', trigger: 'blur' }
  ],
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  appType: [{ required: true, message: '请选择应用类型', trigger: 'change' }]
}

const getMethodTagType = (method) => {
  const types = {
    'GET': 'success',
    'POST': 'primary',
    'PUT': 'warning',
    'DELETE': 'danger',
    'PATCH': 'info'
  }
  return types[method] || 'info'
}

const getAppDisplayName = (appCode) => {
  const app = apps.value.find(a => a.appCode === appCode)
  return app ? app.appName : appCode
}

const loadApps = async () => {
  try {
    const res = await appApi.listAllApps()
    if (res.code === 200) {
      apps.value = res.data || []
    }
  } catch (error) {
    console.error('加载应用列表失败:', error)
  }
}

const loadApis = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    const res = await apiDefinitionApi.listApis(params)
    if (res.code === 200) {
      apiList.value = res.data.records || []
      pagination.total = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '加载失败')
    }
  } catch (error) {
    console.error('加载接口列表失败:', error)
    ElMessage.error('加载接口列表失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.appName = ''
  searchForm.apiName = ''
  searchForm.apiMethod = ''
  loadApis()
}

const showAddDialog = () => {
  dialogTitle.value = '新增接口'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const editApi = (row) => {
  dialogTitle.value = '编辑接口'
  isEdit.value = true
  Object.assign(apiForm, {
    id: row.id,
    appName: row.appName,
    apiName: row.apiName,
    apiPath: row.apiPath,
    apiMethod: row.apiMethod,
    apiGroup: row.apiGroup,
    description: row.description,
    requestParams: row.requestParams,
    responseParams: row.responseParams,
    requestExample: row.requestExample,
    responseExample: row.responseExample,
    authType: row.authType,
    isDeprecated: row.isDeprecated,
    remark: row.remark
  })
  dialogVisible.value = true
}

const resetForm = () => {
  apiForm.id = null
  apiForm.appName = ''
  apiForm.apiName = ''
  apiForm.apiPath = ''
  apiForm.apiMethod = ''
  apiForm.apiGroup = ''
  apiForm.description = ''
  apiForm.requestParams = ''
  apiForm.responseParams = ''
  apiForm.requestExample = ''
  apiForm.responseExample = ''
  apiForm.authType = ''
  apiForm.isDeprecated = 0
  apiForm.remark = ''
  formRef.value?.resetFields()
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const api = isEdit.value ? apiDefinitionApi.updateApi : apiDefinitionApi.addApi
        const res = await api(apiForm)
        if (res.code === 200) {
          ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
          dialogVisible.value = false
          loadApis()
          loadApps()
        } else {
          ElMessage.error(res.msg || '操作失败')
        }
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error('操作失败')
      }
    }
  })
}

const deleteApi = (row) => {
  ElMessageBox.confirm('确定要删除该接口吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await apiDefinitionApi.deleteApi(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        loadApis()
        loadApps()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

const showImportDialog = (type) => {
  importType.value = type
  importForm.appName = searchForm.appName || ''
  importForm.url = ''
  importForm.content = ''
  
  const titles = {
    'openapi': '导入 OpenAPI/Swagger 文档',
    'openapi-url': '从URL导入 OpenAPI',
    'postman': '导入 Postman Collection',
    'ai': 'AI智能解析'
  }
  importDialogTitle.value = titles[type] || '导入'
  importDialogVisible.value = true
}

const getImportPlaceholder = () => {
  const placeholders = {
    'openapi': '请粘贴 OpenAPI 3.0 或 Swagger 2.0 格式的JSON/YAML文档内容...',
    'postman': '请粘贴 Postman Collection 导出的JSON内容...',
    'ai': '请粘贴接口文档内容（支持Markdown、Word导出的文本、纯文本格式），AI将自动识别并提取接口信息...'
  }
  return placeholders[importType.value] || '请输入文档内容'
}

const executeImport = async () => {
  if (!importForm.appName) {
    ElMessage.warning('请选择所属应用')
    return
  }
  
  importing.value = true
  try {
    let res
    if (importType.value === 'openapi-url') {
      res = await apiDefinitionApi.importFromOpenApiUrl(importForm.appName, importForm.url)
    } else if (importType.value === 'openapi') {
      res = await apiDefinitionApi.importFromOpenApi(importForm.appName, importForm.content)
    } else if (importType.value === 'postman') {
      res = await apiDefinitionApi.importFromPostman(importForm.appName, importForm.content)
    } else if (importType.value === 'ai') {
      res = await apiDefinitionApi.importByAi(importForm.appName, importForm.content)
    }
    
    if (res.code === 200) {
      importResult.value = res.data
      importDialogVisible.value = false
      importResultVisible.value = true
      loadApis()
      loadApps()
    } else {
      ElMessage.error(res.msg || '导入失败')
    }
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

const showQuickAddAppDialog = () => {
  isImportContext.value = false
  resetQuickAppForm()
  quickAddAppVisible.value = true
}

const showQuickAddAppDialogInImport = () => {
  isImportContext.value = true
  resetQuickAppForm()
  quickAddAppVisible.value = true
}

const resetQuickAppForm = () => {
  quickAppForm.appCode = ''
  quickAppForm.appName = ''
  quickAppForm.appType = 'third'
  quickAppForm.owner = ''
  quickAppFormRef.value?.resetFields()
}

const submitQuickAddApp = async () => {
  if (!quickAppFormRef.value) return
  
  await quickAppFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const res = await appApi.addApp(quickAppForm)
        if (res.code === 200) {
          ElMessage.success('新增应用成功')
          quickAddAppVisible.value = false
          await loadApps()
          if (isImportContext.value) {
            importForm.appName = quickAppForm.appCode
          } else {
            searchForm.appName = quickAppForm.appCode
          }
        } else {
          ElMessage.error(res.msg || '新增失败')
        }
      } catch (error) {
        console.error('新增应用失败:', error)
        ElMessage.error('新增应用失败')
      }
    }
  })
}

onMounted(() => {
  loadApps()
  loadApis()
})
</script>

<style scoped>
.api-definition-management {
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

.api-definition-management :deep(.el-card__body) {
  padding: 10px 15px;
}

.api-definition-management :deep(.el-form-item) {
  margin-bottom: 10px;
}
</style>
