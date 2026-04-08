<template>
  <div class="repo-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-radio-group v-model="activeTab" @change="onTabChange">
            <el-radio-button label="repo">代码仓库</el-radio-button>
            <el-radio-button label="task">扫描任务</el-radio-button>
          </el-radio-group>
          <div>
            <el-button v-if="activeTab === 'repo'" type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              新增仓库
            </el-button>
            <el-button v-else type="primary" @click="openAddTaskDialog">
              <el-icon><Plus /></el-icon>
              新增扫描任务
            </el-button>
          </div>
        </div>
      </template>

      <!-- 代码仓库列表 -->
      <template v-if="activeTab === 'repo'">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="仓库名称">
            <el-input v-model="searchForm.repoName" placeholder="请输入仓库名称" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item label="业务域">
            <el-select v-model="searchForm.businessDomain" placeholder="请选择业务域" clearable style="width: 150px">
              <el-option label="全部" value="" />
              <el-option v-for="domain in domains" :key="domain.domainCode" :label="domain.domainName" :value="domain.domainCode" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadRepos">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="repoList" style="width: 100%" v-loading="loading">
          <el-table-column type="index" label="序号" width="60" :index="(index) => (pagination.page - 1) * pagination.size + index + 1" />
          <el-table-column prop="repoName" label="仓库名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="appName" label="应用名称" min-width="120">
            <template #default="{ row }">
              <span>{{ getAppDisplayName(row.appName) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="businessDomain" label="业务域" min-width="90" />
          <el-table-column prop="gitPlatform" label="Git平台" min-width="90">
            <template #default="{ row }">
              <el-tag size="small">{{ row.gitPlatform?.toUpperCase() }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="gitUrl" label="Git地址" min-width="180" show-overflow-tooltip />
          <el-table-column prop="scanBranch" label="扫描分支" min-width="90" />
          <el-table-column prop="lastScanTime" label="最近扫描时间" min-width="150" />
          <el-table-column prop="status" label="状态" min-width="70">
            <template #default="{ row }">
              <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="updateStatus(row)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right" align="left">
            <template #default="{ row }">
              <div style="display: flex; justify-content: flex-start; gap: 2px;">
                <el-button text type="primary" size="small" @click="scanRepo(row)" style="padding: 0 4px;">扫描</el-button>
                <el-button text type="primary" size="small" @click="editRepo(row)" style="padding: 0 4px;">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteRepo(row)" style="padding: 0 4px;">删除</el-button>
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
          @size-change="loadRepos"
          @current-change="loadRepos"
          style="margin-top: 10px; justify-content: flex-start"
        />
      </template>

      <!-- 扫描任务列表 -->
      <template v-else>
        <el-form :inline="true" :model="taskSearchForm" class="search-form">
          <el-form-item label="仓库名称">
            <el-input v-model="taskSearchForm.repoName" placeholder="请输入仓库名称" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item label="扫描状态">
            <el-select v-model="taskSearchForm.status" placeholder="请选择状态" clearable style="width: 150px">
              <el-option label="全部" value="" />
              <el-option label="运行" :value="0" />
              <el-option label="成功" :value="1" />
              <el-option label="失败" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadTasks">查询</el-button>
            <el-button @click="resetTaskSearch">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="taskList" style="width: 100%" v-loading="taskLoading">
          <el-table-column type="index" label="序号" width="60" :index="(index) => (taskPagination.page - 1) * taskPagination.size + index + 1" />
          <el-table-column prop="repoName" label="仓库名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="operatorName" label="操作人" min-width="90" />
          <el-table-column prop="triggerType" label="触发方式" min-width="90">
            <template #default="{ row }">
              <el-tag :type="row.triggerType === 1 ? 'primary' : 'success'" size="small">
                {{ row.triggerType === 1 ? '手动' : '自动' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="scanStatus" label="状态" min-width="70">
            <template #default="{ row }">
              <el-tag :type="row.scanStatus === 1 ? 'success' : row.scanStatus === 2 ? 'danger' : 'warning'" size="small">
                {{ row.scanStatus === 1 ? '成功' : row.scanStatus === 2 ? '失败' : '运行' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="流程变化" min-width="140">
            <template #default="{ row }">
              <el-tooltip v-if="row.scanStatus === 1" placement="top" effect="light">
                <template #content>
                  <div style="line-height: 1.8">
                    <div><span style="font-weight: 500">总数：</span>流程总数</div>
                    <div><span style="color: #67c23a; font-weight: 500">新增：</span>本次扫描新增的流程</div>
                    <div><span style="color: #e6a23c; font-weight: 500">修改：</span>本次扫描修改的流程</div>
                    <div><span style="color: #909399; font-weight: 500">无变化：</span>本次扫描未变化的流程</div>
                    <div><span style="color: #f56c6c; font-weight: 500">删除：</span>本次扫描删除的流程</div>
                  </div>
                </template>
                <div style="cursor: pointer">
                  <span style="font-weight: 500">{{ row.flowCount || 0 }}</span>
                  <span style="color: #909399"> / </span>
                  <span style="color: #67c23a">{{ row.newFlowCount || 0 }}</span>
                  <span style="color: #909399"> / </span>
                  <span style="color: #e6a23c">{{ row.updatedFlowCount || 0 }}</span>
                  <span style="color: #909399"> / </span>
                  <span style="color: #909399">{{ row.unchangedFlowCount || 0 }}</span>
                  <span style="color: #909399"> / </span>
                  <span style="color: #f56c6c">{{ row.deletedFlowCount || 0 }}</span>
                </div>
              </el-tooltip>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="节点变化" min-width="140">
            <template #default="{ row }">
              <el-tooltip v-if="row.scanStatus === 1" placement="top" effect="light">
                <template #content>
                  <div style="line-height: 1.8">
                    <div><span style="font-weight: 500">总数：</span>节点总数</div>
                    <div><span style="color: #67c23a; font-weight: 500">新增：</span>本次扫描新增的节点</div>
                    <div><span style="color: #e6a23c; font-weight: 500">修改：</span>本次扫描修改的节点</div>
                    <div><span style="color: #909399; font-weight: 500">无变化：</span>本次扫描未变化的节点</div>
                    <div><span style="color: #f56c6c; font-weight: 500">删除：</span>本次扫描删除的节点</div>
                  </div>
                </template>
                <div style="cursor: pointer">
                  <span style="font-weight: 500">{{ row.nodeCount || 0 }}</span>
                  <span style="color: #909399"> / </span>
                  <span style="color: #67c23a">{{ row.newNodeCount || 0 }}</span>
                  <span style="color: #909399"> / </span>
                  <span style="color: #e6a23c">{{ row.updatedNodeCount || 0 }}</span>
                  <span style="color: #909399"> / </span>
                  <span style="color: #909399">{{ row.unchangedNodeCount || 0 }}</span>
                  <span style="color: #909399"> / </span>
                  <span style="color: #f56c6c">{{ row.deletedNodeCount || 0 }}</span>
                </div>
              </el-tooltip>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="costTime" label="耗时(ms)" min-width="80" />
          <el-table-column prop="createTime" label="创建时间" min-width="150" />
          <el-table-column label="操作" width="110" fixed="right" align="left">
            <template #default="{ row }">
              <div style="display: flex; justify-content: flex-start; gap: 2px;">
                <el-button text type="primary" size="small" @click="viewTaskDetail(row)" style="padding: 0 4px;">详情</el-button>
                <el-button text type="primary" size="small" @click="retryTask(row)" v-if="row.scanStatus === 2" style="padding: 0 4px;">重试</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="taskPagination.page"
          v-model:page-size="taskPagination.size"
          :total="taskPagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadTasks"
          @current-change="loadTasks"
          style="margin-top: 10px; justify-content: flex-start"
        />
      </template>
    </el-card>

    <!-- 新增/编辑仓库弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="repoForm" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="仓库名称" prop="repoName">
          <el-input v-model="repoForm.repoName" placeholder="请输入仓库名称" />
        </el-form-item>
        
        <el-form-item label="关联应用" prop="appId">
          <el-select 
            v-model="repoForm.appId" 
            placeholder="请选择应用" 
            filterable 
            style="width: 100%"
            @change="onAppChange"
          >
            <el-option 
              v-for="app in apps" 
              :key="app.id" 
              :label="app.appName" 
              :value="app.id"
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
          <el-button text type="primary" style="margin-left: 5px" @click="showQuickAddAppDialog">
            <el-icon><Plus /></el-icon>
            新增应用
          </el-button>
        </el-form-item>
        
        <el-form-item label="业务域" prop="businessDomain">
          <el-select v-model="repoForm.businessDomain" placeholder="请选择业务域" style="width: 100%">
            <el-option v-for="domain in domains" :key="domain.domainCode" :label="domain.domainName" :value="domain.domainCode" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Git平台" prop="gitPlatform">
          <el-select v-model="repoForm.gitPlatform" placeholder="请选择Git平台" style="width: 100%">
            <el-option label="GitLab" value="gitlab" />
            <el-option label="GitHub" value="github" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Git地址" prop="gitUrl">
          <el-input v-model="repoForm.gitUrl" placeholder="请输入Git仓库地址" />
        </el-form-item>
        
        <el-form-item label="认证方式" prop="authType">
          <el-radio-group v-model="repoForm.authType">
            <el-radio label="token">Token认证</el-radio>
            <el-radio label="password">用户名密码</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="repoForm.authType === 'token'" label="授权Token" prop="authToken">
          <el-input v-model="repoForm.authToken" type="password" placeholder="请输入授权Token" show-password />
        </el-form-item>
        
        <template v-else>
          <el-form-item label="用户名" prop="authUsername">
            <el-input v-model="repoForm.authUsername" placeholder="请输入Git用户名" />
          </el-form-item>
          <el-form-item label="密码" prop="authPassword">
            <el-input v-model="repoForm.authPassword" type="password" placeholder="请输入Git密码" show-password />
          </el-form-item>
        </template>
        
        <el-form-item label="扫描分支" prop="scanBranch">
          <el-input v-model="repoForm.scanBranch" placeholder="请输入扫描分支" />
        </el-form-item>
        
        <el-form-item label="扫描包路径" prop="scanPackage">
          <el-input v-model="repoForm.scanPackage" placeholder="请输入注解扫描包路径" />
        </el-form-item>
        
        <el-form-item label="仓库描述">
          <el-input v-model="repoForm.description" type="textarea" :rows="3" placeholder="请输入仓库描述" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 快速新增应用弹窗 -->
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

    <!-- 新增扫描任务弹窗 -->
    <el-dialog v-model="addTaskDialogVisible" title="新增扫描任务" width="500px">
      <el-form :model="addTaskForm" label-width="80px">
        <el-form-item label="选择仓库" required>
          <el-select 
            v-model="addTaskForm.repoId" 
            placeholder="请选择仓库" 
            style="width: 100%"
            filterable
            v-loading="repoLoading"
          >
            <el-option 
              v-for="repo in repoList" 
              :key="repo.id" 
              :label="repo.repoName" 
              :value="repo.id"
            >
              <span>{{ repo.repoName }}</span>
              <span style="color: #909399; font-size: 12px; margin-left: 8px;">{{ getAppDisplayName(repo.appName) }}</span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addTaskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="executeScan" :loading="scanLoading">执行扫描</el-button>
      </template>
    </el-dialog>

    <!-- 扫描任务详情弹窗 -->
    <ScanTaskDetailDialog v-model="detailDialogVisible" :task-id="currentTaskId" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import repoApi from '@/api/repo'
import knowledgeApi from '@/api/knowledge'
import appApi from '@/api/app'
import axios from 'axios'
import ScanTaskDetailDialog from '@/components/ScanTaskDetailDialog.vue'

const activeTab = ref('repo')
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增仓库')
const formRef = ref(null)

const quickAddAppVisible = ref(false)
const quickAppFormRef = ref(null)

const searchForm = reactive({
  repoName: '',
  businessDomain: '',
  status: ''
})

const repoList = ref([])
const domains = ref([])
const apps = ref([])
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const repoForm = reactive({
  id: null,
  repoName: '',
  appId: null,
  appName: '',
  businessDomain: '',
  gitPlatform: 'gitlab',
  gitUrl: '',
  authType: 'password',
  authToken: '',
  authUsername: '',
  authPassword: '',
  scanBranch: 'master',
  scanPackage: '',
  description: ''
})

const quickAppForm = reactive({
  appCode: '',
  appName: '',
  appType: 'self',
  owner: ''
})

const rules = {
  repoName: [{ required: true, message: '请输入仓库名称', trigger: 'blur' }],
  appId: [{ required: true, message: '请选择关联应用', trigger: 'change' }],
  businessDomain: [{ required: true, message: '请选择业务域', trigger: 'change' }],
  gitPlatform: [{ required: true, message: '请选择Git平台', trigger: 'change' }],
  gitUrl: [{ required: true, message: '请输入Git仓库地址', trigger: 'blur' }],
  scanBranch: [{ required: true, message: '请输入扫描分支', trigger: 'blur' }],
  scanPackage: [{ required: true, message: '请输入扫描包路径', trigger: 'blur' }]
}

const quickAppRules = {
  appCode: [
    { required: true, message: '请输入应用编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9-]*$/, message: '编码以字母开头，只能包含字母、数字、中划线', trigger: 'blur' }
  ],
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  appType: [{ required: true, message: '请选择应用类型', trigger: 'change' }]
}

// 扫描任务相关
const taskLoading = ref(false)
const taskList = ref([])
const taskSearchForm = reactive({
  repoName: '',
  status: ''
})
const taskPagination = reactive({
  page: 1,
  size: 10,
  total: 0
})
const addTaskDialogVisible = ref(false)
const repoLoading = ref(false)
const scanLoading = ref(false)
const addTaskForm = reactive({
  repoId: null
})
const detailDialogVisible = ref(false)
const currentTaskId = ref(null)

const onTabChange = (tab) => {
  if (tab === 'task') {
    loadTasks()
  }
}

const getAppDisplayName = (appCode) => {
  const app = apps.value.find(a => a.appCode === appCode)
  return app ? app.appName : appCode
}

const onAppChange = (appId) => {
  const app = apps.value.find(a => a.id === appId)
  if (app) {
    repoForm.appName = app.appCode
  }
}

const loadDomains = async () => {
  try {
    const res = await knowledgeApi.listDomains()
    if (res.code === 200) {
      domains.value = res.data || []
    }
  } catch (error) {
    console.error('加载业务域失败:', error)
  }
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

const loadRepos = async () => {
  loading.value = true
  try {
    const res = await repoApi.list()
    if (res.code === 200) {
      const allData = res.data || []
      pagination.total = allData.length
      
      const start = (pagination.page - 1) * pagination.size
      const end = start + pagination.size
      repoList.value = allData.slice(start, end)
    }
  } catch (error) {
    ElMessage.error('加载仓库列表失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.repoName = ''
  searchForm.businessDomain = ''
  searchForm.status = ''
  loadRepos()
}

const showAddDialog = () => {
  dialogTitle.value = '新增仓库'
  resetForm()
  dialogVisible.value = true
}

const editRepo = (row) => {
  dialogTitle.value = '编辑仓库'
  Object.assign(repoForm, {
    id: row.id,
    repoName: row.repoName,
    appId: row.appId,
    appName: row.appName,
    businessDomain: row.businessDomain,
    gitPlatform: row.gitPlatform,
    gitUrl: row.gitUrl,
    authType: row.authType || 'password',
    authToken: row.authToken || '',
    authUsername: row.authUsername || '',
    authPassword: row.authPassword || '',
    scanBranch: row.scanBranch,
    scanPackage: row.scanPackage,
    description: row.description
  })
  dialogVisible.value = true
}

const resetForm = () => {
  repoForm.id = null
  repoForm.repoName = ''
  repoForm.appId = null
  repoForm.appName = ''
  repoForm.businessDomain = ''
  repoForm.gitPlatform = 'gitlab'
  repoForm.gitUrl = ''
  repoForm.authType = 'password'
  repoForm.authToken = ''
  repoForm.authUsername = ''
  repoForm.authPassword = ''
  repoForm.scanBranch = 'master'
  repoForm.scanPackage = ''
  repoForm.description = ''
  formRef.value?.resetFields()
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const api = repoForm.id ? repoApi.update : repoApi.add
        const res = await api(repoForm)
        if (res.code === 200) {
          ElMessage.success(repoForm.id ? '更新成功' : '新增成功')
          dialogVisible.value = false
          loadRepos()
          loadApps()
        } else {
          ElMessage.error(res.msg || '操作失败')
        }
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }
  })
}

const updateStatus = async (row) => {
  try {
    const res = await repoApi.updateStatus(row.id, row.status)
    if (res.code === 200) {
      ElMessage.success('状态更新成功')
    } else {
      ElMessage.error(res.msg || '状态更新失败')
      row.status = row.status === 1 ? 0 : 1
    }
  } catch (error) {
    ElMessage.error('状态更新失败')
    row.status = row.status === 1 ? 0 : 1
  }
}

const scanRepo = async (row) => {
  try {
    const res = await repoApi.scan(row.id)
    if (res.code === 200) {
      ElMessage.success('扫描任务已创建')
      loadRepos()
    } else {
      ElMessage.error(res.msg || '扫描任务创建失败')
    }
  } catch (error) {
    ElMessage.error('扫描任务创建失败')
  }
}

const deleteRepo = (row) => {
  ElMessageBox.confirm('确定要删除该仓库吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await repoApi.delete(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        loadRepos()
        loadApps()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

const showQuickAddAppDialog = () => {
  quickAppForm.appCode = ''
  quickAppForm.appName = ''
  quickAppForm.appType = 'self'
  quickAppForm.owner = ''
  quickAddAppVisible.value = true
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
          const newApp = apps.value.find(a => a.appCode === quickAppForm.appCode)
          if (newApp) {
            repoForm.appId = newApp.id
            repoForm.appName = newApp.appCode
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

// 扫描任务相关方法
const loadTasks = async () => {
  taskLoading.value = true
  try {
    const params = {
      page: taskPagination.page,
      size: taskPagination.size
    }
    
    if (taskSearchForm.repoName) {
      params.repoName = taskSearchForm.repoName
    }
    
    if (taskSearchForm.status !== '') {
      params.scanStatus = taskSearchForm.status
    }
    
    const response = await axios.get('/flow-brain/scan/task/list', { params })
    
    if (response.data.code === 200) {
      taskList.value = response.data.data.records || []
      taskPagination.total = response.data.data.total || 0
    } else {
      ElMessage.error(response.data.msg || '加载任务列表失败')
    }
  } catch (error) {
    console.error('加载任务列表失败:', error)
    ElMessage.error('加载任务列表失败')
  } finally {
    taskLoading.value = false
  }
}

const resetTaskSearch = () => {
  taskSearchForm.repoName = ''
  taskSearchForm.status = ''
  loadTasks()
}

const viewTaskDetail = (row) => {
  currentTaskId.value = row.id
  detailDialogVisible.value = true
}

const retryTask = async (row) => {
  try {
    const res = await axios.post('/flow-brain/repo/scan', null, {
      params: { repoId: row.repoId }
    })
    if (res.data.code === 200) {
      ElMessage.success('重试任务已创建')
      loadTasks()
    } else {
      ElMessage.error(res.data.msg || '重试任务创建失败')
    }
  } catch (error) {
    console.error('重试任务创建失败:', error)
    ElMessage.error('重试任务创建失败')
  }
}

const openAddTaskDialog = () => {
  addTaskDialogVisible.value = true
  addTaskForm.repoId = null
}

const executeScan = async () => {
  if (!addTaskForm.repoId) {
    ElMessage.warning('请选择仓库')
    return
  }
  
  scanLoading.value = true
  try {
    const res = await axios.post('/flow-brain/repo/scan', null, {
      params: { repoId: addTaskForm.repoId }
    })
    if (res.data.code === 200) {
      ElMessage.success('扫描任务已创建')
      addTaskDialogVisible.value = false
      loadTasks()
    } else {
      ElMessage.error(res.data.msg || '扫描任务创建失败')
    }
  } catch (error) {
    console.error('扫描任务创建失败:', error)
    ElMessage.error('扫描任务创建失败')
  } finally {
    scanLoading.value = false
  }
}

onMounted(() => {
  loadDomains()
  loadApps()
  loadRepos()
})
</script>

<style scoped>
.repo-management {
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

.repo-management :deep(.el-card__body) {
  padding: 10px 15px;
}

.repo-management :deep(.el-form-item) {
  margin-bottom: 10px;
}
</style>
