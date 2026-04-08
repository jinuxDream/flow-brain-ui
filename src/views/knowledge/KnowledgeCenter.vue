<template>
  <div class="knowledge-center">
    <el-container>
      <el-aside width="300px" class="domain-aside">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>业务域</span>
              <el-button text type="primary" size="small">
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>
          </template>
          
          <el-tree
            :data="domainTree"
            :props="treeProps"
            node-key="id"
            :default-expand-all="true"
            :highlight-current="true"
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <span class="tree-node">
                <el-icon v-if="data.type === 'domain'"><Folder /></el-icon>
                <el-icon v-else><Document /></el-icon>
                <span>{{ node.label }}</span>
                <span class="node-count" v-if="data.type === 'domain'">({{ data.flowCount || 0 }})</span>
              </span>
            </template>
          </el-tree>
        </el-card>
      </el-aside>
      
      <el-main class="content-main">
        <el-card v-if="!selectedNode">
          <el-empty description="请选择业务域或流程" />
        </el-card>
        
        <div v-else-if="selectedNode.type === 'domain'" class="domain-detail">
          <el-card>
            <template #header>
              <span>{{ selectedNode.label }} - 流程列表</span>
            </template>
            
            <el-table :data="flowList" style="width: 100%">
              <el-table-column prop="flowName" label="流程名称" width="200" />
              <el-table-column prop="flowId" label="流程ID" width="200" />
              <el-table-column prop="description" label="描述" show-overflow-tooltip />
              <el-table-column prop="updateTime" label="更新时间" width="180" />
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button text type="primary" size="small" @click="viewFlow(row)">查看</el-button>
                  <el-button text type="primary" size="small" @click="viewFlowGraph(row)">流程图</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
        
        <div v-else class="flow-detail">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>{{ selectedNode.label }}</span>
                <el-button text type="primary" @click="viewFlowGraph(selectedNode)">
                  <el-icon><Share /></el-icon>
                  查看流程图
                </el-button>
              </div>
            </template>
            
            <el-tabs v-model="activeTab">
              <el-tab-pane label="基础信息" name="basic">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="流程ID">{{ flowDetail.flowId }}</el-descriptions-item>
                  <el-descriptions-item label="流程名称">{{ flowDetail.flowName }}</el-descriptions-item>
                  <el-descriptions-item label="绑定接口">{{ flowDetail.bindInterface }}</el-descriptions-item>
                  <el-descriptions-item label="版本">{{ flowDetail.version }}</el-descriptions-item>
                  <el-descriptions-item label="描述" :span="2">{{ flowDetail.description }}</el-descriptions-item>
                  <el-descriptions-item label="代码路径" :span="2">{{ flowDetail.codePath }}</el-descriptions-item>
                </el-descriptions>
              </el-tab-pane>
              
              <el-tab-pane label="节点列表" name="nodes">
                <el-table :data="nodeList" style="width: 100%">
                  <el-table-column prop="nodeName" label="节点名称" width="180" />
                  <el-table-column prop="nodeId" label="节点ID" width="180" />
                  <el-table-column prop="description" label="描述" show-overflow-tooltip />
                  <el-table-column label="操作" width="100">
                    <template #default="{ row }">
                      <el-button text type="primary" size="small" @click="viewNode(row)">详情</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
              
              <el-tab-pane label="依赖清单" name="dependencies">
                <el-empty description="暂无依赖信息" />
              </el-tab-pane>
              
              <el-tab-pane label="变更历史" name="history">
                <el-empty description="暂无变更历史" />
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </div>
      </el-main>
    </el-container>
    
    <el-dialog v-model="nodeDialogVisible" title="节点详情" width="800px">
      <el-descriptions :column="2" border v-if="nodeDetail">
        <el-descriptions-item label="节点ID">{{ nodeDetail.nodeId }}</el-descriptions-item>
        <el-descriptions-item label="节点名称">{{ nodeDetail.nodeName }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ nodeDetail.description }}</el-descriptions-item>
        <el-descriptions-item label="代码路径" :span="2">{{ nodeDetail.codePath }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider />
      
      <h4>输入参数</h4>
      <el-table :data="inputParams" style="width: 100%" size="small">
        <el-table-column prop="name" label="参数名" />
        <el-table-column prop="type" label="类型" />
        <el-table-column prop="desc" label="描述" />
      </el-table>
      
      <el-divider />
      
      <h4>输出参数</h4>
      <el-table :data="outputParams" style="width: 100%" size="small">
        <el-table-column prop="name" label="参数名" />
        <el-table-column prop="type" label="类型" />
        <el-table-column prop="desc" label="描述" />
      </el-table>
      
      <el-divider />
      
      <h4>执行步骤</h4>
      <el-steps direction="vertical" :active="logicSteps.length">
        <el-step v-for="(step, index) in logicSteps" :key="index" :title="`步骤${index + 1}`" :description="step" />
      </el-steps>
    </el-dialog>
    
    <el-dialog v-model="flowGraphVisible" title="流程关系图" width="95%" top="2vh" :fullscreen="true">
      <FlowRelationGraph v-if="flowGraphVisible" :app-names="flowGraphApps" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import knowledgeApi from '@/api/knowledge'
import FlowRelationGraph from './FlowRelationGraph.vue'

const domainTree = ref([])
const flowList = ref([])
const nodeList = ref([])
const selectedNode = ref(null)
const activeTab = ref('basic')
const nodeDialogVisible = ref(false)
const flowGraphVisible = ref(false)
const flowGraphApps = ref([])

const flowDetail = ref({})
const nodeDetail = ref({})

const treeProps = {
  children: 'children',
  label: 'label'
}

const inputParams = computed(() => {
  if (!nodeDetail.value.inputParams) return []
  try {
    return JSON.parse(nodeDetail.value.inputParams).map(param => {
      const parts = param.split(':')
      return { name: parts[0], type: parts[1], desc: parts[2] || '' }
    })
  } catch {
    return []
  }
})

const outputParams = computed(() => {
  if (!nodeDetail.value.outputParams) return []
  try {
    return JSON.parse(nodeDetail.value.outputParams).map(param => {
      const parts = param.split(':')
      return { name: parts[0], type: parts[1], desc: parts[2] || '' }
    })
  } catch {
    return []
  }
})

const logicSteps = computed(() => {
  if (!nodeDetail.value.logicSteps) return []
  try {
    return JSON.parse(nodeDetail.value.logicSteps)
  } catch {
    return []
  }
})

const loadDomains = async () => {
  try {
    const res = await knowledgeApi.listDomains()
    if (res.code === 200) {
      domainTree.value = res.data.map(domain => ({
        id: domain.id,
        label: domain.domainName,
        type: 'domain',
        domainCode: domain.domainCode,
        flowCount: 0,
        children: []
      }))
    }
  } catch (error) {
    ElMessage.error('加载业务域失败')
  }
}

const handleNodeClick = async (data) => {
  selectedNode.value = data
  
  if (data.type === 'domain') {
    await loadFlows(data.domainCode)
  } else {
    await loadFlowDetail(data.flowId)
  }
}

const loadFlows = async (domainCode) => {
  try {
    const res = await knowledgeApi.listFlows(domainCode)
    if (res.code === 200) {
      flowList.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('加载流程列表失败')
  }
}

const loadFlowDetail = async (flowId) => {
  try {
    const res = await knowledgeApi.getFlow(flowId)
    if (res.code === 200) {
      flowDetail.value = res.data
      await loadNodes(flowId)
    }
  } catch (error) {
    ElMessage.error('加载流程详情失败')
  }
}

const loadNodes = async (flowId) => {
  try {
    const res = await knowledgeApi.listNodes(flowId)
    if (res.code === 200) {
      nodeList.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('加载节点列表失败')
  }
}

const viewFlow = (row) => {
  selectedNode.value = {
    id: row.id,
    label: row.flowName,
    type: 'flow',
    flowId: row.flowId
  }
  loadFlowDetail(row.flowId)
}

const viewFlowGraph = (row) => {
  flowGraphApps.value = [row.appName]
  flowGraphVisible.value = true
}

const viewNode = async (row) => {
  try {
    const res = await knowledgeApi.getNode(row.nodeId)
    if (res.code === 200) {
      nodeDetail.value = res.data
      nodeDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('加载节点详情失败')
  }
}

onMounted(() => {
  loadDomains()
})
</script>

<style scoped>
.knowledge-center {
  height: calc(100vh - 120px);
}

.domain-aside {
  background: var(--card-bg);
  border-right: 1px solid var(--border-default);
  overflow-y: auto;
}

.content-main {
  background: var(--bg-subtle);
  padding: 10px 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tree-node {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.tree-node .el-icon {
  margin-right: 8px;
}

.node-count {
  margin-left: 8px;
  color: var(--text-muted);
  font-size: 12px;
}

.domain-detail,
.flow-detail {
  height: 100%;
}

.flow-graph-container {
  height: 70vh;
  background: var(--bg-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
}

h4 {
  margin: 10px 0;
  font-size: 14px;
  font-weight: bold;
  color: var(--text-primary);
}
</style>
