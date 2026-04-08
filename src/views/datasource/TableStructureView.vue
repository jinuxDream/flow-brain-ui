<template>
  <div class="table-structure-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>表结构查看</span>
          <el-select v-model="selectedConnection" placeholder="选择数据库连接" style="width: 250px" @change="loadTables">
            <el-option v-for="conn in connections" :key="conn.id" :label="conn.name" :value="conn.id" />
          </el-select>
        </div>
      </template>

      <el-row :gutter="20" v-if="selectedConnection">
        <el-col :span="6">
          <div class="table-list">
            <el-input v-model="tableSearch" placeholder="搜索表名" clearable style="margin-bottom: 10px">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-menu :default-active="selectedTable" @select="onTableSelect">
              <el-menu-item v-for="table in filteredTables" :key="table.tableName" :index="table.tableName">
                <el-icon><Grid /></el-icon>
                <span>{{ table.tableName }}</span>
                <span class="table-comment" v-if="table.tableComment">{{ table.tableComment }}</span>
              </el-menu-item>
            </el-menu>
          </div>
        </el-col>
        <el-col :span="18">
          <div class="table-detail" v-if="selectedTable">
            <h3>{{ selectedTable }}</h3>
            <el-table :data="columns" style="width: 100%" v-loading="loadingColumns" border>
              <el-table-column type="index" label="序号" width="60" />
              <el-table-column prop="columnName" label="列名" width="180" />
              <el-table-column prop="columnType" label="类型" width="150" />
              <el-table-column prop="isNullable" label="可空" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.isNullable === 'YES' ? 'success' : 'danger'" size="small">
                    {{ row.isNullable === 'YES' ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="isPrimaryKey" label="主键" width="80">
                <template #default="{ row }">
                  <el-tag v-if="row.isPrimaryKey === 1" type="warning" size="small">主键</el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="defaultValue" label="默认值" width="120" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.defaultValue || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="columnComment" label="注释" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.columnComment || '-' }}
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-empty v-else description="请选择一个表查看结构" />
        </el-col>
      </el-row>
      <el-empty v-else description="请先选择一个数据库连接" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import datasourceApi from '@/api/datasource'

const connections = ref([])
const tables = ref([])
const columns = ref([])
const selectedConnection = ref(null)
const selectedTable = ref(null)
const tableSearch = ref('')
const loadingColumns = ref(false)

const filteredTables = computed(() => {
  if (!tableSearch.value) {
    return tables.value
  }
  return tables.value.filter(t => 
    t.tableName.toLowerCase().includes(tableSearch.value.toLowerCase()) ||
    (t.tableComment && t.tableComment.includes(tableSearch.value))
  )
})

const loadConnections = async () => {
  try {
    const res = await datasourceApi.listConnections({ page: 1, size: 100 })
    if (res.code === 200) {
      connections.value = res.data.records || []
    }
  } catch (error) {
    console.error('加载连接列表失败:', error)
  }
}

const loadTables = async () => {
  if (!selectedConnection.value) {
    tables.value = []
    selectedTable.value = null
    columns.value = []
    return
  }
  
  try {
    const res = await datasourceApi.getTableList(selectedConnection.value)
    if (res.code === 200) {
      tables.value = res.data || []
      if (tables.value.length > 0) {
        selectedTable.value = tables.value[0].tableName
        loadColumns()
      } else {
        selectedTable.value = null
        columns.value = []
      }
    }
  } catch (error) {
    console.error('加载表列表失败:', error)
    ElMessage.error('加载表列表失败')
  }
}

const loadColumns = async () => {
  if (!selectedConnection.value || !selectedTable.value) {
    columns.value = []
    return
  }
  
  loadingColumns.value = true
  try {
    const res = await datasourceApi.getTableColumns(selectedConnection.value, selectedTable.value)
    if (res.code === 200) {
      columns.value = res.data || []
    }
  } catch (error) {
    console.error('加载列信息失败:', error)
    ElMessage.error('加载列信息失败')
  } finally {
    loadingColumns.value = false
  }
}

const onTableSelect = (index) => {
  selectedTable.value = index
  loadColumns()
}

onMounted(() => {
  loadConnections()
})
</script>

<style scoped>
.table-structure-view {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-list {
  height: calc(100vh - 250px);
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 10px;
}

.table-list :deep(.el-menu) {
  border: none;
}

.table-list :deep(.el-menu-item) {
  height: 40px;
  line-height: 40px;
}

.table-comment {
  margin-left: 10px;
  font-size: 12px;
  color: var(--text-muted);
}

.table-detail h3 {
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.table-structure-view :deep(.el-card__body) {
  padding: 10px 15px;
}
</style>
