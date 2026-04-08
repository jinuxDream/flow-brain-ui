<template>
  <el-dialog v-model="visible" title="扫描任务详情" width="1000px" @close="handleClose">
    <div v-if="task" class="task-info-compact">
      <div class="info-row">
        <span class="info-item"><span class="info-label">任务编号:</span> {{ task.taskNo }}</span>
        <span class="info-item"><span class="info-label">仓库:</span> {{ task.repoName }}</span>
        <span class="info-item"><span class="info-label">操作人:</span> {{ task.operatorName }}</span>
        <span class="info-item"><span class="info-label">触发方式:</span> {{ task.triggerType === 1 ? '手动' : '自动' }}</span>
      </div>
      <div class="info-row">
        <span class="info-item"><span class="info-label">状态:</span> 
          <el-tag :type="task.scanStatus === 1 ? 'success' : task.scanStatus === 2 ? 'danger' : 'warning'" size="small">
            {{ task.scanStatus === 1 ? '成功' : task.scanStatus === 2 ? '失败' : '运行中' }}
          </el-tag>
        </span>
        <span class="info-item"><span class="info-label">耗时:</span> {{ task.costTime }}ms</span>
        <span class="info-item"><span class="info-label">创建时间:</span> {{ task.createTime }}</span>
        <span class="info-item"><span class="info-label">更新时间:</span> {{ task.updateTime }}</span>
      </div>
      <div v-if="task.errorMsg" class="error-row">
        <el-alert type="error" :closable="false" show-icon>{{ task.errorMsg }}</el-alert>
      </div>
      
      <div v-if="task.scanStatus === 1" class="stats-section">
        <div class="stats-group">
          <span class="stats-label">流程统计:</span>
          <el-tag type="success" size="small">新增 {{ task.newFlowCount || 0 }}</el-tag>
          <el-tag type="warning" size="small">更新 {{ task.updatedFlowCount || 0 }}</el-tag>
          <el-tag type="info" size="small">未变化 {{ task.unchangedFlowCount || 0 }}</el-tag>
          <el-tag type="danger" size="small">删除 {{ task.deletedFlowCount || 0 }}</el-tag>
          <el-tag size="small">总计 {{ task.flowCount || 0 }}</el-tag>
        </div>
        <div class="stats-group">
          <span class="stats-label">节点统计:</span>
          <el-tag type="success" size="small">新增 {{ task.newNodeCount || 0 }}</el-tag>
          <el-tag type="warning" size="small">更新 {{ task.updatedNodeCount || 0 }}</el-tag>
          <el-tag type="info" size="small">未变化 {{ task.unchangedNodeCount || 0 }}</el-tag>
          <el-tag type="danger" size="small">删除 {{ task.deletedNodeCount || 0 }}</el-tag>
          <el-tag size="small">总计 {{ task.nodeCount || 0 }}</el-tag>
        </div>
      </div>
    </div>
    
    <div v-if="task && task.scanStatus === 1" class="nodes-section">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="流程变化" name="flow">
          <div class="filter-row">
            <el-radio-group v-model="flowStatusFilter" size="default" class="filter-radio-group">
              <el-radio-button label="">全部 ({{ allFlows.length }})</el-radio-button>
              <el-radio-button label="INSERT" class="filter-insert">新增 ({{ allFlows.filter(f => f.changeStatus === 'INSERT').length }})</el-radio-button>
              <el-radio-button label="UPDATE" class="filter-update">更新 ({{ allFlows.filter(f => f.changeStatus === 'UPDATE').length }})</el-radio-button>
              <el-radio-button label="UNCHANGED" class="filter-unchanged">未变化 ({{ allFlows.filter(f => f.changeStatus === 'UNCHANGED').length }})</el-radio-button>
              <el-radio-button label="DELETE" class="filter-delete">删除 ({{ allFlows.filter(f => f.changeStatus === 'DELETE').length }})</el-radio-button>
            </el-radio-group>
          </div>
          
          <el-table :data="filteredFlows" style="width: 100%" height="350" v-loading="flowsLoading">
            <el-table-column prop="flowId" label="流程ID" width="220" show-overflow-tooltip />
            <el-table-column prop="flowName" label="流程名称" width="180" show-overflow-tooltip />
            <el-table-column prop="bindInterface" label="绑定接口" show-overflow-tooltip />
            <el-table-column label="状态" width="80" fixed="right">
              <template #default="{ row }">
                <el-tag 
                  v-if="row.changeStatus === 'INSERT'" 
                  type="success" 
                  size="small">
                  新增
                </el-tag>
                <el-tag 
                  v-else-if="row.changeStatus === 'UPDATE'" 
                  type="warning" 
                  size="small">
                  更新
                </el-tag>
                <el-tag 
                  v-else-if="row.changeStatus === 'DELETE'" 
                  type="danger" 
                  size="small">
                  删除
                </el-tag>
                <el-tag 
                  v-else 
                  type="info" 
                  size="small">
                  未变化
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="节点变化" name="node">
          <div class="filter-row">
            <el-radio-group v-model="nodeStatusFilter" size="default" class="filter-radio-group">
              <el-radio-button label="">全部 ({{ allNodes.length }})</el-radio-button>
              <el-radio-button label="INSERT" class="filter-insert">新增 ({{ allNodes.filter(n => n.changeStatus === 'INSERT').length }})</el-radio-button>
              <el-radio-button label="UPDATE" class="filter-update">更新 ({{ allNodes.filter(n => n.changeStatus === 'UPDATE').length }})</el-radio-button>
              <el-radio-button label="UNCHANGED" class="filter-unchanged">未变化 ({{ allNodes.filter(n => n.changeStatus === 'UNCHANGED').length }})</el-radio-button>
              <el-radio-button label="DELETE" class="filter-delete">删除 ({{ allNodes.filter(n => n.changeStatus === 'DELETE').length }})</el-radio-button>
            </el-radio-group>
          </div>
          
          <el-table :data="filteredNodes" style="width: 100%" height="350" v-loading="nodesLoading">
            <el-table-column prop="nodeId" label="节点ID" width="200" show-overflow-tooltip />
            <el-table-column prop="nodeName" label="节点名称" width="150" show-overflow-tooltip />
            <el-table-column prop="flowId" label="所属流程" width="200" show-overflow-tooltip />
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column label="状态" width="80" fixed="right">
              <template #default="{ row }">
                <el-tag 
                  v-if="row.changeStatus === 'INSERT'" 
                  type="success" 
                  size="small">
                  新增
                </el-tag>
                <el-tag 
                  v-else-if="row.changeStatus === 'UPDATE'" 
                  type="warning" 
                  size="small">
                  更新
                </el-tag>
                <el-tag 
                  v-else-if="row.changeStatus === 'DELETE'" 
                  type="danger" 
                  size="small">
                  删除
                </el-tag>
                <el-tag 
                  v-else 
                  type="info" 
                  size="small">
                  未变化
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  taskId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const task = ref(null)
const allFlows = ref([])
const allNodes = ref([])
const flowsLoading = ref(false)
const nodesLoading = ref(false)
const activeTab = ref('flow')
const flowStatusFilter = ref('')
const nodeStatusFilter = ref('')

const filteredFlows = computed(() => {
  if (!flowStatusFilter.value) {
    return allFlows.value
  }
  return allFlows.value.filter(f => f.changeStatus === flowStatusFilter.value)
})

const filteredNodes = computed(() => {
  if (!nodeStatusFilter.value) {
    return allNodes.value
  }
  return allNodes.value.filter(n => n.changeStatus === nodeStatusFilter.value)
})

const loadTaskDetail = async () => {
  if (!props.taskId) return
  
  try {
    const res = await axios.get(`/flow-brain/scan/task/${props.taskId}`)
    if (res.data.code === 200) {
      task.value = res.data.data
      
      if (task.value.scanStatus === 1) {
        await loadAllFlows(task.value.repoId, task.value.id)
        await loadAllNodes(task.value.repoId, task.value.id)
      }
    }
  } catch (error) {
    console.error('加载任务详情失败:', error)
  }
}

const loadAllFlows = async (repoId, taskId) => {
  flowsLoading.value = true
  try {
    const res = await axios.get(`/flow-brain/knowledge/flow/listByRepoWithStatus?repoId=${repoId}&scanTaskId=${taskId}`)
    if (res.data.code === 200) {
      allFlows.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载流程列表失败:', error)
  } finally {
    flowsLoading.value = false
  }
}

const loadAllNodes = async (repoId, taskId) => {
  nodesLoading.value = true
  try {
    const res = await axios.get(`/flow-brain/knowledge/node/listByRepoWithStatus?repoId=${repoId}&scanTaskId=${taskId}`)
    if (res.data.code === 200) {
      allNodes.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载节点列表失败:', error)
  } finally {
    nodesLoading.value = false
  }
}

const handleClose = () => {
  flowStatusFilter.value = ''
  nodeStatusFilter.value = ''
  allFlows.value = []
  allNodes.value = []
  task.value = null
  activeTab.value = 'flow'
}

watch(() => props.modelValue, (val) => {
  if (val && props.taskId) {
    loadTaskDetail()
  }
})
</script>

<style scoped>
.task-info-compact {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.info-row {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
  font-size: 13px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-label {
  color: #909399;
}

.error-row {
  margin-top: 10px;
}

.stats-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ebeef5;
}

.stats-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.stats-group:last-child {
  margin-bottom: 0;
}

.stats-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
  min-width: 70px;
}

.nodes-section {
  margin-top: 0;
}

.filter-row {
  margin-bottom: 10px;
}

.filter-radio-group :deep(.el-radio-button__inner) {
  padding: 10px 20px;
  min-width: 100px;
}

:deep(.filter-insert .el-radio-button__inner) {
  background-color: #f0f9eb;
  border-color: #c2e7b0;
  color: #67c23a;
}

:deep(.filter-insert .el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #67c23a;
  border-color: #67c23a;
  color: #fff;
}

:deep(.filter-update .el-radio-button__inner) {
  background-color: #fdf6ec;
  border-color: #f5dab1;
  color: #e6a23c;
}

:deep(.filter-update .el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #e6a23c;
  border-color: #e6a23c;
  color: #fff;
}

:deep(.filter-unchanged .el-radio-button__inner) {
  background-color: #f4f4f5;
  border-color: #d3d4d6;
  color: #909399;
}

:deep(.filter-unchanged .el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #909399;
  border-color: #909399;
  color: #fff;
}

:deep(.filter-delete .el-radio-button__inner) {
  background-color: #fef0f0;
  border-color: #fbc4c4;
  color: #f56c6c;
}

:deep(.filter-delete .el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: #fff;
}
</style>
