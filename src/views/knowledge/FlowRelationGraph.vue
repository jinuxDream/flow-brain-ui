<template>
  <div class="flow-relation-graph">
    <div class="toolbar">
      <el-select v-model="selectedApps" multiple placeholder="选择应用" collapse-tags filterable style="width: 280px" @change="handleAppChange">
        <el-option v-for="name in appNameList" :key="name" :label="name" :value="name" />
      </el-select>
      <el-button-group style="margin-left: 12px;">
        <el-button @click="zoomIn" :icon="ZoomIn" title="放大" />
        <el-button @click="zoomOut" :icon="ZoomOut" title="缩小" />
        <el-button @click="fitView" title="适应画布">适应</el-button>
        <el-button @click="exportImage" title="导出图片">导出</el-button>
      </el-button-group>
      <div class="legend">
        <div class="legend-item"><div class="legend-icon start"></div><span>开始</span></div>
        <div class="legend-item"><div class="legend-icon process"></div><span>流程</span></div>
        <div class="legend-item"><div class="legend-icon node"></div><span>节点</span></div>
        <div class="legend-item"><div class="legend-icon end"></div><span>结束</span></div>
      </div>
    </div>
    
    <div class="graph-wrapper">
      <div v-if="loading" class="loading-mask">
        <div class="loading-content">
          <el-icon class="is-loading" :size="40"><Loading /></el-icon>
          <p>正在生成流程图...</p>
        </div>
      </div>
      <div ref="graphContainer" class="graph-container"></div>
    </div>

    <el-drawer v-model="detailVisible" :title="detailTitle" size="450px" direction="rtl">
      <div class="detail-content">
        <div class="detail-header">
          <div class="detail-type-badge" :class="currentDetail?.type">
            {{ getDetailTypeName(currentDetail?.type) }}
          </div>
          <h3 class="detail-name">{{ currentDetail?.name }}</h3>
          <p class="detail-id">ID: {{ currentDetail?.id }}</p>
        </div>
        
        <el-divider />
        
        <div class="detail-section">
          <div class="info-row">
            <span class="info-label">所属应用</span>
            <span class="info-value">{{ currentDetail?.appName }}</span>
          </div>
          <div class="info-row" v-if="currentDetail?.description">
            <span class="info-label">描述</span>
            <span class="info-value">{{ currentDetail?.description }}</span>
          </div>
        </div>

        <div v-if="currentDetail?.type === 'flow'" class="detail-section">
          <h4>参数配置</h4>
          <div v-if="currentDetail?.inputs && parseJson(currentDetail.inputs).length > 0" class="param-group">
            <div class="param-label">输入参数</div>
            <div class="param-list">
              <div v-for="(param, idx) in parseJson(currentDetail.inputs)" :key="idx" class="param-tag input">
                {{ param }}
              </div>
            </div>
          </div>
          <div v-if="currentDetail?.outputs && parseJson(currentDetail.outputs).length > 0" class="param-group">
            <div class="param-label">输出参数</div>
            <div class="param-list">
              <div v-for="(param, idx) in parseJson(currentDetail.outputs)" :key="idx" class="param-tag output">
                {{ param }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentDetail?.type === 'node'" class="detail-section">
          <h4>节点配置</h4>
          <div class="info-row" v-if="currentDetail?.rule">
            <span class="info-label">执行规则</span>
            <span class="info-value code">{{ currentDetail.rule }}</span>
          </div>
          <div class="info-row" v-if="currentDetail?.codePath">
            <span class="info-label">代码路径</span>
            <span class="info-value code">{{ currentDetail.codePath }}</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ZoomIn, ZoomOut, Loading } from '@element-plus/icons-vue'
import axios from 'axios'
import { Graph } from '@antv/x6'
import dagre from 'dagre'

const props = defineProps({
  appNames: {
    type: Array,
    default: () => []
  }
})

const loading = ref(false)
const appNameList = ref([])
const selectedApps = ref([])
const graphContainer = ref(null)
const detailVisible = ref(false)
const currentDetail = ref(null)
const detailTitle = ref('')

let graph = null

const NODE_WIDTH = 140
const NODE_HEIGHT = 40
const START_END_SIZE = 50

const loadAppNames = async () => {
  try {
    const res = await axios.get('/flow-brain/knowledge/app/names')
    if (res.data.code === 200) {
      appNameList.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载应用列表失败:', error)
  }
}

const loadGraphData = async () => {
  if (selectedApps.value.length === 0) {
    ElMessage.warning('请选择至少一个应用')
    return
  }

  loading.value = true
  try {
    const [flowRes, nodeRes] = await Promise.all([
      axios.get('/flow-brain/knowledge/flow/list', { params: { appName: selectedApps.value.join(',') } }),
      axios.get('/flow-brain/knowledge/node/list', { params: { appName: selectedApps.value.join(',') } })
    ])

    const flows = flowRes.data.code === 200 ? (flowRes.data.data || []) : []
    const nodes = nodeRes.data.code === 200 ? (nodeRes.data.data || []) : []

    buildGraph(flows, nodes)
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const parseLiteFlowExpression = (config) => {
  if (!config) return null
  
  const parseExpression = (str) => {
    str = str.trim()
    
    if (str.startsWith('THEN(')) {
      const content = str.substring(5, str.length - 1)
      const items = splitByComma(content)
      return { type: 'THEN', items: items.map(parseExpression) }
    }
    
    if (str.startsWith('WHEN(')) {
      const content = str.substring(5, str.length - 1)
      const items = splitByComma(content)
      return { type: 'WHEN', items: items.map(parseExpression) }
    }
    
    return { type: 'NODE', nodeId: str.trim() }
  }
  
  return parseExpression(config.trim())
}

const splitByComma = (str) => {
  const result = []
  let depth = 0
  let current = ''
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    if (char === '(') depth++
    if (char === ')') depth--
    
    if (char === ',' && depth === 0) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  if (current.trim()) result.push(current.trim())
  return result
}

const buildGraph = (flows, nodes) => {
  if (!graphContainer.value) return

  if (graph) {
    graph.clearCells()
  } else {
    initGraph()
  }

  const parentFlows = flows.filter(f => f.bindInterface && f.bindInterface.trim() !== '')
  const subFlows = flows.filter(f => !f.bindInterface || f.bindInterface.trim() === '')
  const nodeMap = new Map(nodes.map(n => [n.nodeId, n]))
  const subFlowMap = new Map(subFlows.map(f => [f.flowId, f]))

  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: 'LR',
    nodesep: 60,
    ranksep: 120,
    edgesep: 30,
    marginx: 50,
    marginy: 50
  })
  g.setDefaultEdgeLabel(() => ({}))

  const allNodes = []
  const allEdges = []
  const flowStartEndMap = new Map()
  const nodeRankMap = new Map()
  let idCounter = 0

  const genId = () => `node-${++idCounter}`

  parentFlows.forEach((flow) => {
    const startId = genId()
    const endId = genId()
    
    flowStartEndMap.set(startId, endId)
    nodeRankMap.set(startId, 0)
    
    allNodes.push({
      id: startId,
      type: 'start',
      label: '开始',
      width: START_END_SIZE,
      height: START_END_SIZE,
      appName: flow.appName
    })

    const expression = parseLiteFlowExpression(flow.flowConfig)
    let lastNodeId = startId
    
    if (expression) {
      const result = processExpression(
        expression, 
        g,
        allNodes,
        allEdges,
        nodeMap,
        subFlowMap,
        genId,
        startId,
        nodeRankMap,
        1
      )
      lastNodeId = result.lastId
      nodeRankMap.set(endId, result.rank + 1)
    } else {
      nodeRankMap.set(endId, 1)
    }
    allNodes.push({
      id: endId,
      type: 'end',
      label: '结束',
      width: START_END_SIZE,
      height: START_END_SIZE,
      appName: flow.appName
    })
    
    allEdges.push({ source: lastNodeId, target: endId })
  })

  allNodes.forEach(node => {
    g.setNode(node.id, { 
      width: node.width || NODE_WIDTH, 
      height: node.height || NODE_HEIGHT,
      data: node
    })
  })

  allEdges.forEach(edge => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const rankNodes = new Map()
  g.nodes().forEach(nodeId => {
    const node = g.node(nodeId)
    if (node) {
      const rank = node.rank !== undefined ? node.rank : Math.round(node.x / 150)
      if (!rankNodes.has(rank)) {
        rankNodes.set(rank, [])
      }
      rankNodes.get(rank).push({ id: nodeId, x: node.x })
    }
  })

  rankNodes.forEach((nodes) => {
    if (nodes.length > 1) {
      const minX = Math.min(...nodes.map(n => n.x))
      nodes.forEach(n => {
        const node = g.node(n.id)
        if (node) {
          node.x = minX
        }
      })
    }
  })

  flowStartEndMap.forEach((endId, startId) => {
    const startNode = g.node(startId)
    const endNode = g.node(endId)
    if (startNode && endNode) {
      endNode.y = startNode.y
    }
  })

  g.nodes().forEach(nodeId => {
    const nodeData = g.node(nodeId)
    if (nodeData) {
      addNodeToGraph(nodeId, nodeData)
    }
  })

  g.edges().forEach(edgeObj => {
    addEdgeToGraph(edgeObj.v, edgeObj.w)
  })

  setTimeout(() => {
    graph.zoomToFit({ padding: 50, maxScale: 1 })
  }, 100)
}

const processExpression = (expr, g, nodes, edges, nodeMap, subFlowMap, genId, prevId, nodeRankMap, currentRank) => {
  if (!expr) return { lastId: prevId, rank: currentRank }

  if (expr.type === 'NODE') {
    const nodeId = expr.nodeId
    const nodeInfo = nodeMap.get(nodeId)
    const subFlowInfo = subFlowMap.get(nodeId)

    if (subFlowInfo && subFlowInfo.flowConfig) {
      const subExpr = parseLiteFlowExpression(subFlowInfo.flowConfig)
      if (subExpr) {
        const subFlowNodeId = genId()
        nodeRankMap.set(subFlowNodeId, currentRank)
        nodes.push({
          id: subFlowNodeId,
          type: 'flow',
          label: subFlowInfo.flowName || nodeId,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          appName: subFlowInfo.appName,
          description: subFlowInfo.description,
          inputs: subFlowInfo.inputParams,
          outputs: subFlowInfo.outputParams
        })
        edges.push({ source: prevId, target: subFlowNodeId })
        
        const result = processExpression(subExpr, g, nodes, edges, nodeMap, subFlowMap, genId, subFlowNodeId, nodeRankMap, currentRank + 1)
        return { lastId: result.lastId, rank: result.rank }
      }
    } else {
      const nodeDataId = genId()
      nodeRankMap.set(nodeDataId, currentRank)
      nodes.push({
        id: nodeDataId,
        type: 'node',
        label: nodeInfo?.nodeName || nodeId,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        appName: nodeInfo?.appName,
        description: nodeInfo?.description,
        rule: nodeInfo?.rule,
        codePath: nodeInfo?.codePath
      })
      edges.push({ source: prevId, target: nodeDataId })
      return { lastId: nodeDataId, rank: currentRank }
    }
  }

  if (expr.type === 'THEN') {
    let currentPrevId = prevId
    let maxRank = currentRank
    expr.items.forEach(item => {
      const result = processExpression(item, g, nodes, edges, nodeMap, subFlowMap, genId, currentPrevId, nodeRankMap, maxRank)
      currentPrevId = result.lastId
      maxRank = result.rank
    })
    return { lastId: currentPrevId, rank: maxRank }
  }

  if (expr.type === 'WHEN') {
    const forkId = genId()
    const joinId = genId()
    
    nodeRankMap.set(forkId, currentRank)
    
    nodes.push({
      id: forkId,
      type: 'fork',
      label: '并行',
      width: 70,
      height: 36
    })
    nodes.push({
      id: joinId,
      type: 'join',
      label: '汇聚',
      width: 70,
      height: 36
    })
    
    edges.push({ source: prevId, target: forkId })
    
    let maxBranchRank = currentRank
    expr.items.forEach(item => {
      const result = processExpression(item, g, nodes, edges, nodeMap, subFlowMap, genId, forkId, nodeRankMap, currentRank + 1)
      edges.push({ source: result.lastId, target: joinId })
      maxBranchRank = Math.max(maxBranchRank, result.rank)
    })
    
    nodeRankMap.set(joinId, maxBranchRank + 1)
    
    return { lastId: joinId, rank: maxBranchRank + 1 }
  }

  return { lastId: prevId, rank: currentRank }
}

const addNodeToGraph = (nodeId, nodeData) => {
  const { x, y, data } = nodeData
  const { type, label } = data
  
  if (type === 'start') {
    graph.addNode({
      id: nodeId,
      shape: 'circle',
      x: x - START_END_SIZE / 2,
      y: y - START_END_SIZE / 2,
      width: START_END_SIZE,
      height: START_END_SIZE,
      attrs: {
        body: { fill: '#E6F7FF', stroke: '#1890FF', strokeWidth: 2 },
        label: { text: label, fill: '#1890FF', fontSize: 12, fontWeight: '500' }
      }
    })
  } else if (type === 'end') {
    graph.addNode({
      id: nodeId,
      shape: 'circle',
      x: x - START_END_SIZE / 2,
      y: y - START_END_SIZE / 2,
      width: START_END_SIZE,
      height: START_END_SIZE,
      attrs: {
        body: { fill: '#FFF1F0', stroke: '#FF4D4F', strokeWidth: 2 },
        label: { text: label, fill: '#CF1322', fontSize: 12, fontWeight: '500' }
      }
    })
  } else if (type === 'flow') {
    const graphNode = graph.addNode({
      id: nodeId,
      shape: 'rect',
      x: x - NODE_WIDTH / 2,
      y: y - NODE_HEIGHT / 2,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      data: data,
      attrs: {
        body: { fill: '#F0F5FF', stroke: '#2F54EB', strokeWidth: 2, rx: 6, ry: 6 },
        label: { text: label, fill: '#1D39C4', fontSize: 13, fontWeight: '600' }
      }
    })
    graphNode.on('click', () => showDetail(data))
  } else if (type === 'node') {
    const graphNode = graph.addNode({
      id: nodeId,
      shape: 'rect',
      x: x - NODE_WIDTH / 2,
      y: y - NODE_HEIGHT / 2,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      data: data,
      attrs: {
        body: { fill: '#FFF7E6', stroke: '#FA8C16', strokeWidth: 2, rx: 6, ry: 6 },
        label: { text: label, fill: '#D46B08', fontSize: 13, fontWeight: '500' }
      }
    })
    graphNode.on('click', () => showDetail(data))
  } else if (type === 'fork' || type === 'join') {
    graph.addNode({
      id: nodeId,
      shape: 'rect',
      x: x - 35,
      y: y - 18,
      width: 70,
      height: 36,
      attrs: {
        body: { fill: '#F6FFED', stroke: '#52C41A', strokeWidth: 2, rx: 4, ry: 4 },
        label: { text: label, fill: '#389E0D', fontSize: 11, fontWeight: '500' }
      }
    })
  }
}

const addEdgeToGraph = (source, target) => {
  graph.addEdge({
    source,
    target,
    attrs: {
      line: {
        stroke: '#597EF7',
        strokeWidth: 2,
        targetMarker: { name: 'block', size: 6 }
      }
    },
    connector: { name: 'rounded' },
    router: { name: 'manhattan', padding: 10 }
  })
}

const initGraph = () => {
  if (!graphContainer.value) return

  const width = graphContainer.value.clientWidth
  const height = graphContainer.value.clientHeight

  graph = new Graph({
    container: graphContainer.value,
    width,
    height,
    background: { color: '#FAFAFA' },
    grid: {
      visible: true,
      type: 'dot',
      size: 20,
      args: { color: '#E0E0E0', thickness: 1 }
    },
    panning: { enabled: true },
    mousewheel: { enabled: true, minScale: 0.5, maxScale: 2 },
    interacting: { nodeMovable: true }
  })
}

const showDetail = (data) => {
  if (!data) return
  currentDetail.value = data
  detailTitle.value = getDetailTypeName(data.type)
  detailVisible.value = true
}

const getDetailTypeName = (type) => {
  const typeMap = {
    'start': '开始节点',
    'end': '结束节点',
    'flow': '流程节点',
    'node': '处理节点'
  }
  return typeMap[type] || type
}

const parseJson = (str) => {
  if (!str) return []
  try {
    const arr = JSON.parse(str)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

const handleAppChange = () => {
  if (selectedApps.value.length > 0) {
    loadGraphData()
  }
}

const zoomIn = () => {
  if (graph) graph.zoom(0.1)
}

const zoomOut = () => {
  if (graph) graph.zoom(-0.1)
}

const fitView = () => {
  if (graph) graph.zoomToFit({ padding: 50, maxScale: 1 })
}

const exportImage = () => {
  if (graph) {
    graph.toPNG((dataUri) => {
      const a = document.createElement('a')
      a.href = dataUri
      a.download = 'flow-relation-graph.png'
      a.click()
    })
    ElMessage.success('图片导出成功')
  }
}

const handleResize = () => {
  if (graph && graphContainer.value) {
    graph.resize(graphContainer.value.clientWidth, graphContainer.value.clientHeight)
  }
}

onMounted(async () => {
  await loadAppNames()
  if (props.appNames && props.appNames.length > 0) {
    selectedApps.value = props.appNames
    await loadGraphData()
  }
  window.addEventListener('resize', handleResize)
})

watch(() => props.appNames, async (newVal) => {
  if (newVal && newVal.length > 0) {
    selectedApps.value = newVal
    await loadGraphData()
  }
}, { deep: true })

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (graph) graph.dispose()
})
</script>

<style scoped>
.flow-relation-graph {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
}

.toolbar {
  padding: 16px 20px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--card-shadow);
}

.legend {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-left: auto;
  padding-left: 20px;
  border-left: 1px solid var(--border-default);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.legend-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.legend-icon.start {
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.1);
  border: 2px solid var(--primary-color);
}

.legend-icon.process {
  background: rgba(99, 102, 241, 0.1);
  border: 2px solid var(--primary-color);
  border-radius: 4px;
}

.legend-icon.node {
  background: rgba(245, 158, 11, 0.1);
  border: 2px solid #f59e0b;
  border-radius: 4px;
}

.legend-icon.end {
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid #ef4444;
}

.graph-wrapper {
  flex: 1;
  position: relative;
  background: var(--bg-subtle);
}

.graph-container {
  width: 100%;
  height: 100%;
}

.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg);
  z-index: 100;
}

.loading-content {
  text-align: center;
}

.loading-content p {
  margin-top: 16px;
  color: var(--text-muted);
  font-size: 14px;
}

.detail-content {
  padding: 0 24px;
}

.detail-header {
  text-align: center;
  padding: 20px 0;
}

.detail-type-badge {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 12px;
}

.detail-type-badge.flow {
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary-color);
}

.detail-type-badge.node {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.detail-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.detail-id {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

.detail-section {
  margin: 20px 0;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-default);
}

.info-row {
  display: flex;
  margin-bottom: 12px;
  font-size: 13px;
}

.info-label {
  width: 80px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.info-value {
  color: var(--text-primary);
  flex: 1;
}

.info-value.code {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  background: var(--bg-muted);
  padding: 4px 8px;
  border-radius: 4px;
}

.param-group {
  margin-bottom: 16px;
}

.param-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.param-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.param-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.param-tag.input {
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary-color);
}

.param-tag.output {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}
</style>
