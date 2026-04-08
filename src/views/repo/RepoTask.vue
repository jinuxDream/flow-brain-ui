<template>
  <div class="repo-task">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>扫描任务管理</span>
          <el-button type="primary" @click="openAddTaskDialog">
            <el-icon><Plus /></el-icon>
            新增扫描任务
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="仓库名称">
          <el-input v-model="searchForm.repoName" placeholder="请输入仓库名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="扫描状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="运行" :value="0" />
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadTasks">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="taskList" style="width: 100%" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" :index="(index) => (pagination.page - 1) * pagination.size + index + 1" />
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
              <el-button text type="primary" size="small" @click="viewDetail(row)" style="padding: 0 4px;">详情</el-button>
              <el-button text type="primary" size="small" @click="retryTask(row)" v-if="row.scanStatus === 2" style="padding: 0 4px;">重试</el-button>
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
        @size-change="loadTasks"
        @current-change="loadTasks"
        style="margin-top: 10px; justify-content: flex-start"
      />
    </el-card>

    <ScanTaskDetailDialog v-model="detailDialogVisible" :task-id="currentTaskId" />

    <el-dialog v-model="addTaskDialogVisible" title="新增扫描任务" width="500px">
      <el-form :model="addTaskForm" label-width="80px">
        <el-form-item label="选择应用" required>
          <el-select 
            v-model="addTaskForm.repoId" 
            placeholder="请选择应用（仓库）" 
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
              <span style="color: #909399; font-size: 12px; margin-left: 8px;">{{ repo.appName }}</span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addTaskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="executeScan" :loading="scanLoading">执行扫描</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import ScanTaskDetailDialog from '@/components/ScanTaskDetailDialog.vue'

const loading = ref(false)
const detailDialogVisible = ref(false)
const currentTaskId = ref(null)
const addTaskDialogVisible = ref(false)
const repoLoading = ref(false)
const scanLoading = ref(false)
const repoList = ref([])

const addTaskForm = reactive({
  repoId: null
})

const searchForm = reactive({
  repoName: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const taskList = ref([])

const loadTasks = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size
    }
    
    if (searchForm.repoName) {
      params.repoName = searchForm.repoName
    }
    
    if (searchForm.status !== '') {
      params.scanStatus = searchForm.status
    }
    
    const response = await axios.get('/flow-brain/scan/task/list', { params })
    
    if (response.data.code === 200) {
      taskList.value = response.data.data.records || []
      pagination.total = response.data.data.total || 0
    } else {
      ElMessage.error(response.data.msg || '加载任务列表失败')
    }
  } catch (error) {
    console.error('加载任务列表失败:', error)
    ElMessage.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.repoName = ''
  searchForm.status = ''
  loadTasks()
}

const viewDetail = (row) => {
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

const openAddTaskDialog = async () => {
  addTaskDialogVisible.value = true
  addTaskForm.repoId = null
  await loadRepoList()
}

const loadRepoList = async () => {
  repoLoading.value = true
  try {
    const res = await axios.get('/flow-brain/repo/list')
    if (res.data.code === 200) {
      repoList.value = res.data.data || []
    } else {
      ElMessage.error(res.data.msg || '加载仓库列表失败')
    }
  } catch (error) {
    console.error('加载仓库列表失败:', error)
    ElMessage.error('加载仓库列表失败')
  } finally {
    repoLoading.value = false
  }
}

const executeScan = async () => {
  if (!addTaskForm.repoId) {
    ElMessage.warning('请选择应用')
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
  loadTasks()
})
</script>

<style scoped>
.repo-task {
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

.repo-task :deep(.el-card__body) {
  padding: 10px 15px;
}

.repo-task :deep(.el-form-item) {
  margin-bottom: 10px;
}
</style>
