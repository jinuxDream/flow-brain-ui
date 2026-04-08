<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户账号">
          <el-input v-model="searchForm.userAccount" placeholder="请输入用户账号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="用户名称">
          <el-input v-model="searchForm.userName" placeholder="请输入用户名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadUsers">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="userList" style="width: 100%" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" :index="(index) => (pagination.page - 1) * pagination.size + index + 1" />
        <el-table-column prop="userAccount" label="用户账号" min-width="120" show-overflow-tooltip />
        <el-table-column prop="userName" label="用户名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 1 ? 'danger' : 'primary'" size="small">
              {{ row.role === 1 ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="updateStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right" align="left">
          <template #default="{ row }">
            <div style="display: flex; justify-content: flex-start; gap: 2px;">
              <el-button text type="primary" size="small" @click="editUser(row)" style="padding: 0 4px;">编辑</el-button>
              <el-button text type="warning" size="small" @click="resetPassword(row)" style="padding: 0 4px;">重置密码</el-button>
              <el-button text type="danger" size="small" @click="deleteUser(row)" style="padding: 0 4px;">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadUsers"
        @current-change="loadUsers"
        style="margin-top: 10px; justify-content: flex-start"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="userForm" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户账号" prop="userAccount">
          <el-input v-model="userForm.userAccount" placeholder="请输入用户账号" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="用户名称" prop="userName">
          <el-input v-model="userForm.userName" placeholder="请输入用户名称" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码（默认123456）" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="普通用户" :value="0" />
            <el-option label="管理员" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="userForm.status" :active-value="1" :inactive-value="0" />
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
import axios from 'axios'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const isEdit = ref(false)
const formRef = ref(null)

const searchForm = reactive({
  userAccount: '',
  userName: ''
})

const userList = ref([])
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const userForm = reactive({
  id: null,
  userAccount: '',
  userName: '',
  password: '',
  role: 0,
  status: 1
})

const rules = {
  userAccount: [{ required: true, message: '请输入用户账号', trigger: 'blur' }],
  userName: [{ required: true, message: '请输入用户名称', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    
    const res = await axios.get('/flow-brain/system/user/list', { params })
    if (res.data.code === 200) {
      userList.value = res.data.data.records || []
      pagination.total = res.data.data.total || 0
    } else {
      ElMessage.error(res.data.msg || '加载用户列表失败')
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.userAccount = ''
  searchForm.userName = ''
  loadUsers()
}

const showAddDialog = () => {
  dialogTitle.value = '新增用户'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const editUser = (row) => {
  dialogTitle.value = '编辑用户'
  isEdit.value = true
  Object.assign(userForm, {
    id: row.id,
    userAccount: row.userAccount,
    userName: row.userName,
    role: row.role,
    status: row.status
  })
  dialogVisible.value = true
}

const resetForm = () => {
  userForm.id = null
  userForm.userAccount = ''
  userForm.userName = ''
  userForm.password = ''
  userForm.role = 0
  userForm.status = 1
  formRef.value?.resetFields()
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const api = isEdit.value ? '/flow-brain/system/user/update' : '/flow-brain/system/user/add'
        const res = await axios.post(api, userForm)
        if (res.data.code === 200) {
          ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
          dialogVisible.value = false
          loadUsers()
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

const updateStatus = async (row) => {
  try {
    const res = await axios.post('/flow-brain/system/user/update', {
      id: row.id,
      status: row.status
    })
    if (res.data.code === 200) {
      ElMessage.success('状态更新成功')
    } else {
      ElMessage.error(res.data.msg || '状态更新失败')
      row.status = row.status === 1 ? 0 : 1
    }
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    row.status = row.status === 1 ? 0 : 1
  }
}

const resetPassword = (row) => {
  ElMessageBox.confirm('确定要重置该用户的密码为123456吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await axios.post(`/flow-brain/system/user/resetPassword/${row.id}`)
      if (res.data.code === 200) {
        ElMessage.success('密码重置成功')
      } else {
        ElMessage.error(res.data.msg || '密码重置失败')
      }
    } catch (error) {
      console.error('密码重置失败:', error)
      ElMessage.error('密码重置失败')
    }
  })
}

const deleteUser = (row) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await axios.post(`/flow-brain/system/user/delete/${row.id}`)
      if (res.data.code === 200) {
        ElMessage.success('删除成功')
        loadUsers()
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
  loadUsers()
})
</script>

<style scoped>
.user-management {
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

.user-management :deep(.el-card__body) {
  padding: 10px 15px;
}

.user-management :deep(.el-form-item) {
  margin-bottom: 10px;
}
</style>
