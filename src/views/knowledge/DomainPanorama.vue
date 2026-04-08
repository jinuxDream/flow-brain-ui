<template>
  <div class="domain-panorama">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>业务域全景</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="业务域">
          <el-select v-model="searchForm.domainCode" placeholder="请选择业务域" clearable style="width: 180px">
            <el-option label="全部" value="" />
            <el-option 
              v-for="domain in domainList" 
              :key="domain.domainCode" 
              :label="domain.domainName" 
              :value="domain.domainCode" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="应用名">
          <el-select v-model="searchForm.appName" placeholder="请选择应用" clearable filterable style="width: 200px">
            <el-option label="全部" value="" />
            <el-option 
              v-for="name in appNameList" 
              :key="name" 
              :label="name" 
              :value="name" 
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadApps">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table 
        :data="appList" 
        style="width: 100%" 
        v-loading="loading"
        row-key="appName"
        :expand-row-keys="expandedAppKeys"
        @expand-change="handleAppExpand"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <div class="expand-header">
                <span class="expand-title">{{ row.appName }} - 接口清单</span>
                <span class="expand-count">共 {{ getParentFlows(row.appName).length }} 个接口</span>
              </div>
              
              <el-table 
                :data="getParentFlows(row.appName)" 
                style="width: 100%" 
                v-loading="flowsLoadingMap[row.appName]"
                row-key="flowId"
                :expand-row-keys="expandedParentFlowKeys[row.appName] || []"
                @expand-change="(props, expanded) => handleParentFlowExpand(row.appName, props, expanded)"
                size="small"
                border
                :row-class-name="getParentFlowRowClass"
              >
                <el-table-column type="expand">
                  <template #default="{ row: parentFlow }">
                    <div class="expand-content-inner">
                      <div class="expand-header-inner">
                        <span class="expand-title">{{ parentFlow.flowName || parentFlow.flowId }} - 子流程</span>
                        <span class="expand-count">共 {{ getSubFlows(parentFlow).length }} 个子流程</span>
                      </div>
                      
                      <el-table 
                        :data="getSubFlowDetails(row.appName, parentFlow)" 
                        style="width: 100%" 
                        row-key="flowId"
                        :expand-row-keys="expandedSubFlowKeys[parentFlow.flowId] || []"
                        @expand-change="(props, expanded) => handleSubFlowExpand(parentFlow.flowId, props, expanded)"
                        size="small"
                        border
                        :row-class-name="getSubFlowRowClass"
                      >
                        <el-table-column type="expand">
                          <template #default="{ row: subFlow }">
                            <div class="expand-content-deep">
                              <div class="expand-header-deep">
                                <span class="expand-title">{{ subFlow.flowName || subFlow.flowId }} - 节点列表</span>
                                <span class="expand-count">共 {{ getFlowNodeCount(subFlow.flowId) }} 个节点</span>
                              </div>
                              <el-table 
                                :data="flowNodesMap[subFlow.flowId] || []" 
                                style="width: 100%" 
                                v-loading="nodesLoadingMap[subFlow.flowId]"
                                size="small"
                                :row-class-name="getNodeRowClass"
                              >
                                <el-table-column prop="nodeId" label="节点ID" min-width="180" show-overflow-tooltip />
                                <el-table-column prop="nodeName" label="节点名称" min-width="120" show-overflow-tooltip />
                                <el-table-column prop="description" label="描述" show-overflow-tooltip />
                                <el-table-column prop="dependNodes" label="依赖" min-width="250" show-overflow-tooltip>
                                  <template #default="{ row: nodeRow }">
                                    <span v-if="nodeRow.dependNodes">{{ formatDeps(nodeRow.dependNodes) }}</span>
                                    <span v-else>-</span>
                                  </template>
                                </el-table-column>
                                <el-table-column prop="codePath" label="代码路径" min-width="200" show-overflow-tooltip />
                                <el-table-column label="操作" width="70" align="center">
                                  <template #default="{ row: nodeRow }">
                                    <el-button text type="primary" size="small" @click="showNodeDetail(nodeRow)">详情</el-button>
                                  </template>
                                </el-table-column>
                              </el-table>
                            </div>
                          </template>
                        </el-table-column>
                        <el-table-column prop="flowId" label="子流程ID" min-width="180" show-overflow-tooltip />
                        <el-table-column prop="flowName" label="子流程名称" min-width="150" show-overflow-tooltip />
                        <el-table-column prop="description" label="描述" show-overflow-tooltip />
                        <el-table-column label="节点数" width="80" align="center">
                          <template #default="{ row: subFlow }">
                            <el-tag type="info" size="small">{{ getFlowNodeCount(subFlow.flowId) }}</el-tag>
                          </template>
                        </el-table-column>
                        <el-table-column label="操作" width="90" align="center">
                          <template #default="{ row: subFlow }">
                            <el-button text type="primary" size="small" @click="showSubFlowDetail(subFlow)">查看流程</el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="flowId" label="流程ID" min-width="180" show-overflow-tooltip />
                <el-table-column prop="flowName" label="流程名称" min-width="150" show-overflow-tooltip />
                <el-table-column prop="bindInterface" label="绑定接口" min-width="250" show-overflow-tooltip />
                <el-table-column prop="description" label="描述" show-overflow-tooltip />
                <el-table-column label="子流程数" width="90" align="center">
                  <template #default="{ row: flowRow }">
                    <el-tag type="primary" size="small">{{ getSubFlows(flowRow).length }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" align="center">
                  <template #default="{ row: flowRow }">
                    <el-button text type="primary" size="small" @click="showFlowDetail(flowRow)">详情</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column type="index" label="序号" width="60" :index="(index) => (pagination.page - 1) * pagination.size + index + 1" />
        <el-table-column prop="businessDomain" label="业务域名称" min-width="100">
          <template #default="{ row }">
            {{ getDomainName(row.businessDomain) }}
          </template>
        </el-table-column>
        <el-table-column prop="appName" label="应用名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="flowCount" label="流程数量" width="90" align="center">
          <template #default="{ row }">
            <el-tag type="success" size="small">{{ row.flowCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="nodeCount" label="节点数量" width="90" align="center">
          <template #default="{ row }">
            <el-tag type="warning" size="small">{{ row.nodeCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="gitUrl" label="仓库地址" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link :href="row.gitUrl" target="_blank" type="primary" v-if="row.gitUrl">
              {{ row.gitUrl }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="最近更新时间" width="160" />
        <el-table-column label="操作" width="70" align="center" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="showAppDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
        style="margin-top: 10px; justify-content: flex-start"
      />
    </el-card>

    <el-dialog v-model="flowDetailVisible" :title="currentFlowDetail?.flowName || ''" width="900px">
      <template #header>
        <span>{{ currentFlowDetail?.flowName || '' }} - {{ currentFlowDetail?.flowId }}{{ currentFlowDetail?.bindInterface ? ' - ' + currentFlowDetail.bindInterface : '' }}</span>
      </template>
      <div class="flow-detail-content">
        <div class="detail-section info-section">
          <div class="detail-row">
            <span class="detail-label">描述:</span>
            <span class="detail-value">{{ currentFlowDetail?.description || '-' }}</span>
          </div>
        </div>

        <div v-if="getSubFlows(currentFlowDetail).length > 0 || currentFlowDetail?.inputs || currentFlowDetail?.outputs" class="detail-section params-section">
          <div class="section-title">
            <span class="section-icon">⚙</span>
            <span class="section-text">参数</span>
          </div>
          
          <div v-if="currentFlowDetail?.inputs" class="subsection">
            <div class="subsection-title">输入参数 ({{ parseJsonArray(currentFlowDetail.inputs).length }})</div>
            <div class="params-list">
              <div v-for="(input, index) in parseJsonArray(currentFlowDetail.inputs)" :key="index" class="param-item">
                <span class="param-type input">输入</span>
                <span class="param-name">{{ parseParam(input).name }}</span>
                <span class="param-type-tag">{{ parseParam(input).type }}</span>
                <span :class="['param-optional', parseParam(input).required === '必填' ? 'required' : '']">{{ parseParam(input).required }}</span>
                <span class="param-desc">{{ parseParam(input).desc }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="currentFlowDetail?.outputs" class="subsection">
            <div class="subsection-title">输出参数 ({{ parseJsonArray(currentFlowDetail.outputs).length }})</div>
            <div class="params-list">
              <div v-for="(output, index) in parseJsonArray(currentFlowDetail.outputs)" :key="index" class="param-item">
                <span class="param-type output">输出</span>
                <span class="param-name">{{ parseParam(output).name }}</span>
                <span class="param-type-tag">{{ parseParam(output).type }}</span>
                <span :class="['param-optional', parseParam(output).required === '必填' ? 'required' : '']">{{ parseParam(output).required }}</span>
                <span class="param-desc">{{ parseParam(output).desc }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="getSubFlows(currentFlowDetail).length > 0" class="detail-section subflows-section">
          <div class="section-title">
            <span class="section-icon">📋</span>
            <span class="section-text">子流程 ({{ getSubFlows(currentFlowDetail).length }})</span>
          </div>
          <div class="subflows-list">
            <el-tag v-for="(subFlow, index) in getSubFlows(currentFlowDetail)" :key="index" type="warning" style="margin-right: 8px; margin-bottom: 8px;">
              {{ subFlow }}
            </el-tag>
          </div>
        </div>

        <div class="detail-section code-section">
          <div class="detail-row full-width">
            <span class="detail-label">代码路径:</span>
            <span class="detail-value">{{ currentFlowDetail?.codePath || '-' }}</span>
          </div>
        </div>

        <div class="detail-section config-section">
          <div class="section-title">
            <span class="section-icon">📄</span>
            <span class="section-text">流程配置</span>
          </div>
          <pre class="config-pre">{{ currentFlowDetail?.flowConfig || '-' }}</pre>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="subFlowDetailVisible" :title="currentSubFlowDetail?.flowName || currentSubFlowDetail?.flowId || ''" width="800px">
      <template #header>
        <span>{{ currentSubFlowDetail?.flowName || '' }} - {{ currentSubFlowDetail?.flowId }}</span>
      </template>
      <div class="flow-detail-content">
        <div class="detail-section config-section">
          <div class="section-title">
            <span class="section-icon">📄</span>
            <span class="section-text">流程配置</span>
          </div>
          <pre class="config-pre">{{ currentSubFlowDetail?.flowConfig || '-' }}</pre>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="nodeDetailVisible" :title="currentNodeDetail?.nodeName || currentNodeDetail?.nodeId || ''" width="900px">
      <template #header>
        <span>{{ currentNodeDetail?.nodeName || '' }} - {{ currentNodeDetail?.nodeId }}</span>
      </template>
      <div class="flow-detail-content">
        <div class="detail-section info-section">
          <div class="detail-row">
            <span class="detail-label">描述:</span>
            <span class="detail-value">{{ currentNodeDetail?.description || '-' }}</span>
          </div>
        </div>

        <div v-if="currentNodeDetail?.inputParams || currentNodeDetail?.outputParams" class="detail-section params-section">
          <div class="section-title">
            <span class="section-icon">⚙</span>
            <span class="section-text">参数</span>
          </div>
          
          <div v-if="currentNodeDetail?.inputParams && parseJsonArray(currentNodeDetail.inputParams).length > 0" class="subsection">
            <div class="subsection-title">输入参数 ({{ parseJsonArray(currentNodeDetail.inputParams).length }})</div>
            <div class="params-list">
              <div v-for="(input, index) in parseJsonArray(currentNodeDetail.inputParams)" :key="index" class="param-item">
                <span class="param-type input">输入</span>
                <span class="param-name">{{ parseParam(input).name }}</span>
                <span class="param-type-tag">{{ parseParam(input).type }}</span>
                <span :class="['param-optional', parseParam(input).required === '必填' ? 'required' : '']">{{ parseParam(input).required }}</span>
                <span class="param-desc">{{ parseParam(input).desc }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="currentNodeDetail?.outputParams && parseJsonArray(currentNodeDetail.outputParams).length > 0" class="subsection">
            <div class="subsection-title">输出参数 ({{ parseJsonArray(currentNodeDetail.outputParams).length }})</div>
            <div class="params-list">
              <div v-for="(output, index) in parseJsonArray(currentNodeDetail.outputParams)" :key="index" class="param-item">
                <span class="param-type output">输出</span>
                <span class="param-name">{{ parseParam(output).name }}</span>
                <span class="param-type-tag">{{ parseParam(output).type }}</span>
                <span :class="['param-optional', parseParam(output).required === '必填' ? 'required' : '']">{{ parseParam(output).required }}</span>
                <span class="param-desc">{{ parseParam(output).desc }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentNodeDetail?.rule" class="detail-section config-section">
          <div class="section-title">
            <span class="section-icon">📐</span>
            <span class="section-text">规则</span>
          </div>
          <pre class="config-pre">{{ currentNodeDetail?.rule || '-' }}</pre>
        </div>

        <div v-if="currentNodeDetail?.logicSteps && parseJsonArray(currentNodeDetail.logicSteps).length > 0" class="detail-section subflows-section">
          <div class="section-title">
            <span class="section-icon">📋</span>
            <span class="section-text">执行步骤 ({{ parseJsonArray(currentNodeDetail.logicSteps).length }})</span>
          </div>
          <div class="steps-list">
            <div v-for="(step, index) in parseJsonArray(currentNodeDetail.logicSteps)" :key="index" class="step-item">
              <span class="step-index">{{ index + 1 }}.</span>
              <span class="step-content">{{ step }}</span>
            </div>
          </div>
        </div>

        <div v-if="currentNodeDetail?.dependNodes && parseJsonArray(currentNodeDetail.dependNodes).length > 0" class="detail-section subflows-section">
          <div class="section-title">
            <span class="section-icon">🔗</span>
            <span class="section-text">依赖节点 ({{ parseJsonArray(currentNodeDetail.dependNodes).length }})</span>
          </div>
          <div class="subflows-list">
            <el-tag v-for="(dep, index) in parseJsonArray(currentNodeDetail.dependNodes)" :key="index" type="warning" style="margin-right: 8px; margin-bottom: 8px;">
              {{ dep }}
            </el-tag>
          </div>
        </div>

        <div class="detail-section code-section">
          <div class="detail-row full-width">
            <span class="detail-label">代码路径:</span>
            <span class="detail-value">{{ currentNodeDetail?.codePath || '-' }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="appDetailVisible" :title="currentAppDetail?.appName || ''" width="700px">
      <template #header>
        <span>{{ currentAppDetail?.appName || '' }} - 应用详情</span>
      </template>
      <div class="flow-detail-content">
        <div class="detail-section info-section">
          <div class="detail-row">
            <span class="detail-label">应用名称:</span>
            <span class="detail-value">{{ currentAppDetail?.appName || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">业务域:</span>
            <span class="detail-value">{{ getDomainName(currentAppDetail?.businessDomain) || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">描述:</span>
            <span class="detail-value">{{ currentAppDetail?.description || '-' }}</span>
          </div>
        </div>

        <div class="detail-section params-section">
          <div class="section-title">
            <span class="section-icon">📦</span>
            <span class="section-text">仓库信息</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">仓库名称:</span>
            <span class="detail-value">{{ currentAppDetail?.repoName || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Git平台:</span>
            <span class="detail-value">{{ currentAppDetail?.gitPlatform || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">仓库地址:</span>
            <span class="detail-value">
              <el-link v-if="currentAppDetail?.gitUrl" :href="currentAppDetail.gitUrl" target="_blank" type="primary">
                {{ currentAppDetail.gitUrl }}
              </el-link>
              <span v-else>-</span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">扫描分支:</span>
            <span class="detail-value">{{ currentAppDetail?.scanBranch || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">扫描包:</span>
            <span class="detail-value">{{ currentAppDetail?.scanPackage || '-' }}</span>
          </div>
        </div>

        <div class="detail-section subflows-section">
          <div class="section-title">
            <span class="section-icon">⚙</span>
            <span class="section-text">扫描配置</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">自动扫描:</span>
            <span class="detail-value">
              <el-tag :type="currentAppDetail?.autoScan === 1 ? 'success' : 'info'" size="small">
                {{ currentAppDetail?.autoScan === 1 ? '开启' : '关闭' }}
              </el-tag>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">状态:</span>
            <span class="detail-value">
              <el-tag :type="currentAppDetail?.status === 1 ? 'success' : 'danger'" size="small">
                {{ currentAppDetail?.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">最近扫描:</span>
            <span class="detail-value">{{ currentAppDetail?.lastScanTime || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">扫描状态:</span>
            <span class="detail-value">
              <el-tag v-if="currentAppDetail?.lastScanStatus === 1" type="success" size="small">成功</el-tag>
              <el-tag v-else-if="currentAppDetail?.lastScanStatus === 0" type="danger" size="small">失败</el-tag>
              <span v-else>-</span>
            </span>
          </div>
        </div>

        <div class="detail-section code-section">
          <div class="detail-row">
            <span class="detail-label">流程数量:</span>
            <span class="detail-value">
              <el-tag type="success" size="small">{{ currentAppDetail?.flowCount || 0 }}</el-tag>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">节点数量:</span>
            <span class="detail-value">
              <el-tag type="warning" size="small">{{ currentAppDetail?.nodeCount || 0 }}</el-tag>
            </span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const expandedAppKeys = ref([])
const expandedParentFlowKeys = ref({})
const expandedSubFlowKeys = ref({})
const appFlowsMap = ref({})
const appNodesMap = ref({})
const flowNodesMap = ref({})
const flowsLoadingMap = ref({})
const nodesLoadingMap = ref({})
const flowDetailVisible = ref(false)
const currentFlowDetail = ref(null)
const nodeDetailVisible = ref(false)
const currentNodeDetail = ref(null)
const appDetailVisible = ref(false)
const currentAppDetail = ref(null)
const subFlowDetailVisible = ref(false)
const currentSubFlowDetail = ref(null)

const searchForm = reactive({
  domainCode: '',
  appName: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const domainList = ref([])
const appNameList = ref([])
const appList = ref([])
const allApps = ref([])

const filteredApps = computed(() => {
  let result = allApps.value
  if (searchForm.domainCode) {
    result = result.filter(app => app.businessDomain === searchForm.domainCode)
  }
  if (searchForm.appName) {
    result = result.filter(app => app.appName === searchForm.appName)
  }
  return result
})

const loadDomains = async () => {
  try {
    const res = await axios.get('/flow-brain/knowledge/domain/list')
    if (res.data.code === 200) {
      domainList.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载业务域失败:', error)
  }
}

const loadAppNames = async () => {
  try {
    const res = await axios.get('/flow-brain/knowledge/app/names')
    if (res.data.code === 200) {
      appNameList.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载应用名列表失败:', error)
  }
}

const loadApps = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.domainCode) {
      params.domainCode = searchForm.domainCode
    }
    if (searchForm.appName) {
      params.appName = searchForm.appName
    }
    
    const res = await axios.get('/flow-brain/knowledge/app/list', { params })
    if (res.data.code === 200) {
      allApps.value = res.data.data || []
      pagination.total = allApps.value.length
      updatePageData()
    } else {
      ElMessage.error(res.data.msg || '加载应用列表失败')
    }
  } catch (error) {
    console.error('加载应用列表失败:', error)
    ElMessage.error('加载应用列表失败')
  } finally {
    loading.value = false
  }
}

const updatePageData = () => {
  const start = (pagination.page - 1) * pagination.size
  const end = start + pagination.size
  appList.value = filteredApps.value.slice(start, end)
  pagination.total = filteredApps.value.length
}

const handlePageChange = () => {
  updatePageData()
}

const handlePageSizeChange = () => {
  pagination.page = 1
  updatePageData()
}

const resetSearch = () => {
  searchForm.domainCode = ''
  searchForm.appName = ''
  pagination.page = 1
  loadApps()
}

const getDomainName = (domainCode) => {
  if (!domainCode) return '-'
  const domain = domainList.value.find(d => d.domainCode === domainCode)
  return domain ? domain.domainName : domainCode
}

const handleAppExpand = async (row, expandedRows) => {
  if (expandedRows.find(r => r.appName === row.appName)) {
    await loadFlowsAndNodes(row)
    
    const parentFlows = getParentFlows(row.appName)
    expandedParentFlowKeys.value[row.appName] = parentFlows.map(f => f.flowId)
    
    for (const parentFlow of parentFlows) {
      const subFlows = getSubFlowDetails(row.appName, parentFlow)
      expandedSubFlowKeys.value[parentFlow.flowId] = subFlows.map(s => s.flowId)
    }
  }
}

const loadFlowsAndNodes = async (row) => {
  if (appFlowsMap.value[row.appName]) return
  
  flowsLoadingMap.value[row.appName] = true
  try {
    const [flowRes, nodeRes] = await Promise.all([
      axios.get('/flow-brain/knowledge/flow/list', {
        params: { domainCode: row.businessDomain }
      }),
      axios.get('/flow-brain/knowledge/node/listByAppName', {
        params: { appName: row.appName }
      })
    ])
    
    if (flowRes.data.code === 200) {
      appFlowsMap.value[row.appName] = (flowRes.data.data || [])
        .filter(f => f.appName === row.appName)
        .map(f => ({ ...f, appName: row.appName }))
    }
    
    if (nodeRes.data.code === 200) {
      const nodes = nodeRes.data.data || []
      appNodesMap.value[row.appName] = nodes
      
      const flowNodeMap = {}
      for (const node of nodes) {
        const flowIds = (node.flowId || '').split(',').filter(id => id)
        for (const flowId of flowIds) {
          if (!flowNodeMap[flowId]) {
            flowNodeMap[flowId] = []
          }
          flowNodeMap[flowId].push(node)
        }
      }
      
      for (const flowId of Object.keys(flowNodeMap)) {
        flowNodesMap.value[flowId] = flowNodeMap[flowId]
      }
    }
  } catch (error) {
    console.error('加载流程和节点失败:', error)
  } finally {
    flowsLoadingMap.value[row.appName] = false
  }
}

const getParentFlows = (appName) => {
  const flows = appFlowsMap.value[appName] || []
  return flows.filter(f => f.bindInterface && f.bindInterface.trim() !== '')
}

const getSubFlows = (flow) => {
  if (!flow.subFlows) return []
  try {
    const arr = JSON.parse(flow.subFlows)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

const getSubFlowDetails = (appName, parentFlow) => {
  const subFlowIds = getSubFlows(parentFlow)
  const allFlows = appFlowsMap.value[appName] || []
  return subFlowIds.map(flowId => {
    const flow = allFlows.find(f => f.flowId === flowId)
    return flow || { flowId, flowName: flowId, description: '-' }
  })
}

const handleParentFlowExpand = async (appName, flowRow, expanded) => {
  if (!expandedParentFlowKeys.value[appName]) {
    expandedParentFlowKeys.value[appName] = []
  }
  
  if (expanded) {
    if (!expandedParentFlowKeys.value[appName].includes(flowRow.flowId)) {
      expandedParentFlowKeys.value[appName].push(flowRow.flowId)
    }
  } else {
    expandedParentFlowKeys.value[appName] = expandedParentFlowKeys.value[appName].filter(id => id !== flowRow.flowId)
  }
}

const handleSubFlowExpand = async (parentFlowId, subFlowRow, expanded) => {
  if (!expandedSubFlowKeys.value[parentFlowId]) {
    expandedSubFlowKeys.value[parentFlowId] = []
  }
  
  if (expanded) {
    if (!expandedSubFlowKeys.value[parentFlowId].includes(subFlowRow.flowId)) {
      expandedSubFlowKeys.value[parentFlowId].push(subFlowRow.flowId)
    }
  } else {
    expandedSubFlowKeys.value[parentFlowId] = expandedSubFlowKeys.value[parentFlowId].filter(id => id !== subFlowRow.flowId)
  }
}

const getFlowNodeCount = (flowId) => {
  const nodes = flowNodesMap.value[flowId] || []
  return nodes.length
}

const showFlowDetail = (flow) => {
  currentFlowDetail.value = flow
  flowDetailVisible.value = true
}

const showSubFlowDetail = (subFlow) => {
  currentSubFlowDetail.value = subFlow
  subFlowDetailVisible.value = true
}

const showNodeDetail = (node) => {
  currentNodeDetail.value = node
  nodeDetailVisible.value = true
}

const showAppDetail = (app) => {
  currentAppDetail.value = app
  appDetailVisible.value = true
}

const getNodeRowClass = () => 'node-row'

const getParentFlowRowClass = () => 'parent-flow-row'

const getSubFlowRowClass = () => 'sub-flow-row'

const parseJsonArray = (jsonStr) => {
  if (!jsonStr) return []
  try {
    const arr = JSON.parse(jsonStr)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

const formatRequired = (value) => {
  if (value === null || value === undefined || value === '') return '可选'
  const str = String(value).trim().toLowerCase()
  if (str === 'true') return '必填'
  if (str === 'false') return '可选'
  return '可选'
}

const parseParam = (param) => {
  if (!param) return { name: '', type: '', required: '可选', desc: '' }
  const parts = param.split(':')
  return {
    name: parts[0] || '',
    type: parts[1] || '',
    desc: parts[2] || '',
    required: formatRequired(parts[3])
  }
}

const formatDeps = (deps) => {
  try {
    const arr = JSON.parse(deps)
    if (Array.isArray(arr)) {
      return arr.join(', ')
    }
    return deps
  } catch {
    return deps
  }
}

onMounted(() => {
  loadDomains()
  loadAppNames()
  loadApps()
})
</script>

<style scoped>
.domain-panorama {
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

.domain-panorama :deep(.el-card__body) {
  padding: 10px 15px;
}

.domain-panorama :deep(.el-form-item) {
  margin-bottom: 10px;
}

.expand-content {
  padding: 10px 20px;
  background-color: var(--bg-muted);
}

.expand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.expand-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.expand-count {
  font-size: 12px;
  color: var(--text-muted);
}

.expand-content-inner {
  padding: 10px 15px;
  background-color: var(--card-bg);
}

.expand-header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.expand-header-inner .expand-title {
  font-size: 13px;
  color: var(--text-secondary);
}

.expand-content-deep {
  padding: 10px 15px;
  background-color: var(--bg-subtle);
}

.expand-header-deep {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.expand-header-deep .expand-title {
  font-size: 12px;
  color: var(--text-muted);
}

:deep(.parent-flow-row) {
  background-color: rgba(16, 185, 129, 0.1) !important;
}

:deep(.parent-flow-row:hover) {
  background-color: rgba(16, 185, 129, 0.2) !important;
}

:deep(.sub-flow-row) {
  background-color: rgba(245, 158, 11, 0.1) !important;
}

:deep(.sub-flow-row:hover) {
  background-color: rgba(245, 158, 11, 0.2) !important;
}

:deep(.node-row) {
  background-color: rgba(99, 102, 241, 0.1) !important;
}

:deep(.node-row:hover) {
  background-color: rgba(99, 102, 241, 0.2) !important;
}

.flow-detail-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-section {
  border: 1px solid var(--border-default);
  border-radius: 8px;
  overflow: hidden;
}

.info-section {
  background-color: var(--card-bg);
}

.params-section {
  background-color: var(--card-bg);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  overflow: hidden;
}

.params-section .section-title {
  background: var(--bg-muted);
  border-bottom: 1px solid var(--border-muted);
}

.subflows-section {
  background-color: var(--card-bg);
}

.subflows-section .section-title {
  background-color: var(--bg-muted);
}

.code-section {
  background-color: var(--card-bg);
}

.config-section {
  background-color: var(--card-bg);
}

.config-section .section-title {
  background-color: var(--bg-muted);
}

.detail-row {
  display: flex;
  align-items: center;
  padding: 2px 12px;
  border-bottom: 1px solid var(--border-muted);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row.full-width {
  flex-direction: column;
  align-items: flex-start;
}

.detail-row.full-width .detail-label {
  margin-bottom: 1px;
}

.detail-label {
  font-weight: 600;
  color: var(--text-primary);
  min-width: 70px;
  white-space: nowrap;
}

.detail-value {
  color: var(--text-secondary);
  word-break: break-all;
}

.section-title {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-icon {
  margin-right: 6px;
}

.section-text {
  font-size: 14px;
}

.subsection {
  padding: 0 12px 4px 12px;
}

.subsection-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 6px 12px;
  background-color: var(--bg-muted);
  margin: 0 -12px 8px -12px;
  border-left: 3px solid var(--primary-color);
}

.params-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.param-item {
  display: flex;
  align-items: center;
  padding: 3px 8px;
  background-color: var(--card-bg);
  border-radius: 3px;
}

.param-type {
  font-size: 11px;
  padding: 1px 4px;
  border-radius: 2px;
  margin-right: 6px;
  font-weight: 500;
}

.param-type.input {
  background-color: rgba(99, 102, 241, 0.1);
  color: var(--primary-color);
  border: 1px solid var(--primary-200);
}

.param-type.output {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.param-name {
  color: var(--text-primary);
  font-family: monospace;
  font-size: 13px;
  margin-right: 10px;
  min-width: 120px;
}

.param-type-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 2px;
  background-color: rgba(6, 182, 212, 0.1);
  color: var(--accent-color);
  border: 1px solid rgba(6, 182, 212, 0.3);
  margin-right: 6px;
  font-family: monospace;
}

.param-optional {
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 2px;
  background-color: var(--bg-muted);
  color: var(--text-muted);
  border: 1px solid var(--border-default);
  margin-right: 6px;
}

.param-optional.required {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.param-desc {
  color: var(--text-secondary);
  font-size: 12px;
  margin-left: 8px;
  flex: 1;
}

.steps-list {
  padding: 8px 12px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
  border-bottom: 1px dashed var(--border-default);
}

.step-item:last-child {
  border-bottom: none;
}

.step-index {
  color: var(--primary-color);
  font-weight: 600;
  min-width: 24px;
  font-size: 13px;
}

.step-content {
  color: var(--text-primary);
  font-size: 13px;
  flex: 1;
}

.subflows-list {
  padding: 6px 12px;
}

.config-pre {
  margin: 0;
  padding: 6px 12px;
  background-color: var(--bg-muted);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  color: var(--text-primary);
}
</style>
