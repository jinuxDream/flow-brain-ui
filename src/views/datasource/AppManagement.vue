<template>
  <div class="app-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>应用管理</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            新增应用
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="应用名称">
          <el-input v-model="searchForm.appName" placeholder="请输入应用名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="应用类型">
          <el-select v-model="searchForm.appType" placeholder="全部" clearable style="width: 120px">
            <el-option label="自研系统" value="self" />
            <el-option label="三方系统" value="third" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadApps">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="appList" style="width: 100%" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="appCode" label="应用编码" width="150" show-overflow-tooltip />
        <el-table-column prop="appName" label="应用名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="appType" label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="row.appType === 'self' ? 'primary' : 'info'" size="small">
              {{ row.appType === 'self' ? '自研系统' : '三方系统' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="代码仓库" width="120">
          <template #default="{ row }">
            <span v-if="getRepoInfo(row.repoId)">{{ getRepoInfo(row.repoId).repoName }}</span>
            <el-tag v-else type="info" size="small">未关联</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="负责人" width="90" />
        <el-table-column prop="apiCount" label="接口数" width="70" />
        <el-table-column prop="status" label="状态" width="70">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="editApp(row)">编辑</el-button>
            <el-button text type="danger" size="small" @click="deleteApp(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadApps"
        @current-change="loadApps"
        style="margin-top: 10px; justify-content: flex-start"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="appForm" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="应用编码" prop="appCode">
              <el-input v-model="appForm.appCode" placeholder="如：mall-order" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="应用名称" prop="appName">
              <el-input v-model="appForm.appName" placeholder="如：订单系统" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="应用类型" prop="appType">
          <el-radio-group v-model="appForm.appType">
            <el-radio label="self">自研系统</el-radio>
            <el-radio label="third">三方系统</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-input v-model="appForm.owner" placeholder="负责人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系方式">
              <el-input v-model="appForm.contact" placeholder="联系方式" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="应用描述">
          <el-input v-model="appForm.description" type="textarea" :rows="3" placeholder="应用功能描述" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="appForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import appApi from '@/api/app'
import repoApi from '@/api/repo'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增应用')
const isEdit = ref(false)
const formRef = ref(null)

const appList = ref([])
const repoList = ref([])

const searchForm = reactive({
  appName: '',
  appType: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const appForm = reactive({
  id: null,
  appCode: '',
  appName: '',
  appType: 'third',
  description: '',
  owner: '',
  contact: '',
  remark: ''
})

const rules = {
  appCode: [
    { required: true, message: '请输入应用编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9-]*$/, message: '编码以字母开头，只能包含字母、数字、中划线', trigger: 'blur' }
  ],
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  appType: [{ required: true, message: '请选择应用类型', trigger: 'change' }]
}

const getRepoInfo = (repoId) => {
  if (!repoId) return null
  return repoList.value.find(r => r.id === repoId)
}

const loadRepos = async () => {
  try {
    const res = await repoApi.list()
    if (res.code === 200) {
      repoList.value = res.data || []
    }
  } catch (error) {
    console.error('加载仓库列表失败:', error)
  }
}

const loadApps = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    const res = await appApi.listApps(params)
    if (res.code === 200) {
      appList.value = res.data.records || []
      pagination.total = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '加载失败')
    }
  } catch (error) {
    console.error('加载应用列表失败:', error)
    ElMessage.error('加载应用列表失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.appName = ''
  searchForm.appType = ''
  loadApps()
}

const showAddDialog = () => {
  dialogTitle.value = '新增应用'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const editApp = (row) => {
  dialogTitle.value = '编辑应用'
  isEdit.value = true
  Object.assign(appForm, {
    id: row.id,
    appCode: row.appCode,
    appName: row.appName,
    appType: row.appType,
    description: row.description,
    owner: row.owner,
    contact: row.contact,
    remark: row.remark
  })
  dialogVisible.value = true
}

const resetForm = () => {
  appForm.id = null
  appForm.appCode = ''
  appForm.appName = ''
  appForm.appType = 'third'
  appForm.description = ''
  appForm.owner = ''
  appForm.contact = ''
  appForm.remark = ''
  formRef.value?.resetFields()
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const api = isEdit.value ? appApi.updateApp : appApi.addApp
        const res = await api(appForm)
        if (res.code === 200) {
          ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
          dialogVisible.value = false
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

const deleteApp = (row) => {
  ElMessageBox.confirm('确定要删除该应用吗？删除后该应用下的接口数据仍保留。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await appApi.deleteApp(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
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

onMounted(() => {
  loadRepos()
  loadApps()
})
</script>

<style scoped>
.app-management {
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

.app-management :deep(.el-card__body) {
  padding: 10px 15px;
}

.app-management :deep(.el-form-item) {
  margin-bottom: 10px;
}
</style>
