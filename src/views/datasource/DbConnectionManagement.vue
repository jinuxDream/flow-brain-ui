<template>
  <div class="db-connection-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据库连接管理</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            新增连接
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="连接名称">
          <el-input v-model="searchForm.name" placeholder="请输入连接名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="数据库类型">
          <el-select v-model="searchForm.dbType" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="item in dbTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadConnections">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="connectionList" style="width: 100%" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="连接名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="dbType" label="数据库类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.dbType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="host" label="主机地址" width="150" show-overflow-tooltip />
        <el-table-column prop="port" label="端口" width="80" />
        <el-table-column prop="dbName" label="数据库名" width="120" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastSyncTime" label="最后同步时间" width="160" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="testConnection(row)">测试连接</el-button>
            <el-button text type="success" size="small" @click="syncStructure(row)">同步表结构</el-button>
            <el-button text type="primary" size="small" @click="editConnection(row)">编辑</el-button>
            <el-button text type="danger" size="small" @click="deleteConnection(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadConnections"
        @current-change="loadConnections"
        style="margin-top: 10px; justify-content: flex-start"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="connectionForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="连接名称" prop="name">
          <el-input v-model="connectionForm.name" placeholder="请输入连接名称" />
        </el-form-item>
        <el-form-item label="数据库类型" prop="dbType">
          <el-select v-model="connectionForm.dbType" placeholder="请选择" style="width: 100%" @change="onDbTypeChange">
            <el-option v-for="item in dbTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="主机地址" prop="host">
              <el-input v-model="connectionForm.host" placeholder="如：127.0.0.1" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="端口" prop="port">
              <el-input-number v-model="connectionForm.port" :min="1" :max="65535" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="数据库名" prop="dbName">
          <el-input v-model="connectionForm.dbName" placeholder="请输入数据库名" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="connectionForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="connectionForm.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="connectionForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import datasourceApi from '@/api/datasource'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增连接')
const isEdit = ref(false)
const formRef = ref(null)

const dbTypes = ref([])
const connectionList = ref([])

const searchForm = reactive({
  name: '',
  dbType: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const connectionForm = reactive({
  id: null,
  name: '',
  dbType: '',
  host: '',
  port: 3306,
  dbName: '',
  username: '',
  password: '',
  remark: ''
})

const rules = {
  name: [{ required: true, message: '请输入连接名称', trigger: 'blur' }],
  dbType: [{ required: true, message: '请选择数据库类型', trigger: 'change' }],
  host: [{ required: true, message: '请输入主机地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  dbName: [{ required: true, message: '请输入数据库名', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const onDbTypeChange = (value) => {
  const type = dbTypes.value.find(t => t.value === value)
  if (type && type.defaultPort) {
    connectionForm.port = type.defaultPort
  }
}

const loadDbTypes = async () => {
  try {
    const res = await datasourceApi.getDbTypes()
    if (res.code === 200) {
      dbTypes.value = res.data || []
    }
  } catch (error) {
    console.error('加载数据库类型失败:', error)
  }
}

const loadConnections = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    const res = await datasourceApi.listConnections(params)
    if (res.code === 200) {
      connectionList.value = res.data.records || []
      pagination.total = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '加载失败')
    }
  } catch (error) {
    console.error('加载连接列表失败:', error)
    ElMessage.error('加载连接列表失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.name = ''
  searchForm.dbType = ''
  loadConnections()
}

const showAddDialog = () => {
  dialogTitle.value = '新增连接'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const editConnection = (row) => {
  dialogTitle.value = '编辑连接'
  isEdit.value = true
  Object.assign(connectionForm, {
    id: row.id,
    name: row.name,
    dbType: row.dbType,
    host: row.host,
    port: row.port,
    dbName: row.dbName,
    username: row.username,
    password: '',
    remark: row.remark
  })
  dialogVisible.value = true
}

const resetForm = () => {
  connectionForm.id = null
  connectionForm.name = ''
  connectionForm.dbType = ''
  connectionForm.host = ''
  connectionForm.port = 3306
  connectionForm.dbName = ''
  connectionForm.username = ''
  connectionForm.password = ''
  connectionForm.remark = ''
  formRef.value?.resetFields()
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const api = isEdit.value ? datasourceApi.updateConnection : datasourceApi.addConnection
        const res = await api(connectionForm)
        if (res.code === 200) {
          ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
          dialogVisible.value = false
          loadConnections()
        } else {
          ElMessage.error(res.msg || '操作失败')
        }
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error('操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const testConnection = async (row) => {
  try {
    const res = await datasourceApi.testConnection(row.id)
    if (res.code === 200 && res.data) {
      ElMessage.success('连接成功')
    } else {
      ElMessage.error('连接失败')
    }
  } catch (error) {
    console.error('测试连接失败:', error)
    ElMessage.error('测试连接失败')
  }
}

const syncStructure = async (row) => {
  ElMessageBox.confirm('确定要同步该数据库的表结构吗？这将清除之前的同步数据。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      ElMessage.info('正在同步表结构，请稍候...')
      const res = await datasourceApi.syncTableStructure(row.id)
      if (res.code === 200) {
        ElMessage.success('同步成功')
        loadConnections()
      } else {
        ElMessage.error(res.msg || '同步失败')
      }
    } catch (error) {
      console.error('同步失败:', error)
      ElMessage.error('同步失败')
    }
  })
}

const deleteConnection = (row) => {
  ElMessageBox.confirm('确定要删除该连接吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await datasourceApi.deleteConnection(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        loadConnections()
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
  loadDbTypes()
  loadConnections()
})
</script>

<style scoped>
.db-connection-management {
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

.db-connection-management :deep(.el-card__body) {
  padding: 10px 15px;
}

.db-connection-management :deep(.el-form-item) {
  margin-bottom: 10px;
}
</style>
