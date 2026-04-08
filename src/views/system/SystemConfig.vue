<template>
  <div class="system-config">
    <el-card>
      <template #header>
        <span>基础配置</span>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="功能开关" name="feature">
          <div class="feature-switches">
            <div class="switch-item">
              <span class="switch-title">显示鼓励文案</span>
              <el-switch v-model="featureSwitches.show_daily_quote" size="small" @change="saveFeatureSwitch('show_daily_quote')" />
              <span class="switch-desc">控制顶部鼓励文案是否显示</span>
            </div>
            <div class="switch-item">
              <span class="switch-title">显示天气信息</span>
              <el-switch v-model="featureSwitches.show_weather" size="small" @change="saveFeatureSwitch('show_weather')" />
              <span class="switch-desc">控制顶部天气信息是否显示</span>
            </div>
            <div class="switch-item">
              <span class="switch-title">显示时间信息</span>
              <el-switch v-model="featureSwitches.show_time" size="small" @change="saveFeatureSwitch('show_time')" />
              <span class="switch-desc">控制顶部时间信息是否显示</span>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="氛围配置" name="atmosphere">
          <div class="tab-header">
            <el-input v-model="quoteSearch" placeholder="搜索文案" clearable style="width: 200px" @clear="loadQuotes" @keyup.enter="loadQuotes">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" size="small" @click="showAddQuoteDialog">
              <el-icon><Plus /></el-icon>
              新增文案
            </el-button>
          </div>
          
          <el-table :data="quoteList" size="small" v-loading="loading">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="configValue" label="文案内容" show-overflow-tooltip />
            <el-table-column prop="sortOrder" label="排序" width="80" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.status" :active-value="1" :inactive-value="0" size="small" @change="toggleQuoteStatus(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="editQuote(row)">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteQuote(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="quotePage.page"
            v-model:page-size="quotePage.size"
            :total="quotePage.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            small
            @size-change="loadQuotes"
            @current-change="loadQuotes"
          />
        </el-tab-pane>
        
        <el-tab-pane label="标签管理" name="tag">
          <div class="tab-header">
            <div class="filter-group">
              <el-select v-model="tagSearch.tagType" placeholder="标签类型" clearable style="width: 120px" @change="loadTags">
                <el-option label="环境标签" value="env" />
                <el-option label="资源标签" value="resource" />
                <el-option label="状态标签" value="status" />
                <el-option label="其他" value="other" />
              </el-select>
              <el-input v-model="tagSearch.keyword" placeholder="搜索标签" clearable style="width: 150px" @clear="loadTags" @keyup.enter="loadTags">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
            </div>
            <el-button type="primary" size="small" @click="showAddTagDialog">
              <el-icon><Plus /></el-icon>
              新增标签
            </el-button>
          </div>
          
          <el-table :data="tagList" size="small" v-loading="tagLoading">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="tagType" label="标签类型" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ getTagTypeName(row.tagType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="tagCode" label="标签代码" width="100" />
            <el-table-column prop="tagName" label="标签名称" />
            <el-table-column prop="tagColor" label="颜色" width="120">
              <template #default="{ row }">
                <div class="color-preview">
                  <span class="color-dot" :style="{ background: row.tagColor }"></span>
                  <span>{{ row.tagColor }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="sortOrder" label="排序" width="60" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="editTag(row)">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteTag(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="tagPage.page"
            v-model:page-size="tagPage.size"
            :total="tagPage.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            small
            @size-change="loadTags"
            @current-change="loadTags"
          />
        </el-tab-pane>
        
        <el-tab-pane label="常用链接" name="link">
          <div class="tab-header">
            <div class="filter-group">
              <el-select v-model="linkSearch.tagId" placeholder="选择标签" clearable style="width: 120px" @change="loadLinks">
                <el-option v-for="tag in allTags" :key="tag.id" :label="tag.tagName" :value="tag.id" />
              </el-select>
              <el-input v-model="linkSearch.keyword" placeholder="搜索链接" clearable style="width: 150px" @clear="loadLinks" @keyup.enter="loadLinks">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
            </div>
            <el-button type="primary" size="small" @click="showAddLinkDialog">
              <el-icon><Plus /></el-icon>
              新增链接
            </el-button>
          </div>
          
          <el-table :data="linkList" size="small" v-loading="linkLoading">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="linkName" label="链接名称" width="150" />
            <el-table-column prop="linkUrl" label="链接地址" show-overflow-tooltip />
            <el-table-column prop="tagIds" label="标签" width="180">
              <template #default="{ row }">
                <div class="tag-list">
                  <el-tag v-for="tagId in row.tagIds" :key="tagId" :style="{ background: getTagColor(tagId), borderColor: getTagColor(tagId), color: '#fff' }" size="small">
                    {{ getTagName(tagId) }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="sortOrder" label="排序" width="60" />
            <el-table-column prop="status" label="状态" width="70">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="editLink(row)">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteLink(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="linkPage.page"
            v-model:page-size="linkPage.size"
            :total="linkPage.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            small
            @size-change="loadLinks"
            @current-change="loadLinks"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 文案对话框 -->
    <el-dialog v-model="quoteDialogVisible" :title="quoteDialogTitle" width="500px">
      <el-form :model="quoteForm" :rules="quoteRules" ref="quoteFormRef" label-width="80px">
        <el-form-item label="文案内容" prop="configValue">
          <el-input v-model="quoteForm.configValue" type="textarea" :rows="3" placeholder="请输入鼓励文案" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="quoteForm.sortOrder" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quoteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQuoteForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 标签对话框 -->
    <el-dialog v-model="tagDialogVisible" :title="tagDialogTitle" width="500px">
      <el-form :model="tagForm" :rules="tagRules" ref="tagFormRef" label-width="80px">
        <el-form-item label="标签类型" prop="tagType">
          <el-select v-model="tagForm.tagType" placeholder="请选择标签类型" style="width: 100%">
            <el-option label="环境标签" value="env" />
            <el-option label="资源标签" value="resource" />
            <el-option label="状态标签" value="status" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签代码" prop="tagCode">
          <el-input v-model="tagForm.tagCode" placeholder="如：test05、stage、gray、prd" />
        </el-form-item>
        <el-form-item label="标签名称" prop="tagName">
          <el-input v-model="tagForm.tagName" placeholder="如：测试05环境、预发布环境" />
        </el-form-item>
        <el-form-item label="标签颜色" prop="tagColor">
          <el-color-picker v-model="tagForm.tagColor" show-alpha />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="tagForm.sortOrder" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTagForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 链接对话框 -->
    <el-dialog v-model="linkDialogVisible" :title="linkDialogTitle" width="600px">
      <el-form :model="linkForm" :rules="linkRules" ref="linkFormRef" label-width="80px">
        <el-form-item label="链接名称" prop="linkName">
          <el-input v-model="linkForm.linkName" placeholder="请输入链接名称" />
        </el-form-item>
        <el-form-item label="链接地址" prop="linkUrl">
          <el-input v-model="linkForm.linkUrl" placeholder="请输入链接地址" />
        </el-form-item>
        <el-form-item label="标签" prop="tagIds">
          <el-select v-model="linkForm.tagIds" multiple placeholder="请选择标签" style="width: 100%">
            <el-option v-for="tag in allTags" :key="tag.id" :label="tag.tagName" :value="tag.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="链接图标">
          <el-input v-model="linkForm.linkIcon" placeholder="可选，链接图标" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="linkForm.sortOrder" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="linkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitLinkForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const activeTab = ref('feature')
const loading = ref(false)
const tagLoading = ref(false)
const linkLoading = ref(false)

const featureSwitches = reactive({
  show_daily_quote: true,
  show_weather: true,
  show_time: true
})

const quoteList = ref([])
const tagList = ref([])
const linkList = ref([])
const allTags = ref([])

const quoteSearch = ref('')
const tagSearch = reactive({ tagType: '', keyword: '' })
const linkSearch = reactive({ tagId: '', keyword: '' })

const quotePage = reactive({ page: 1, size: 10, total: 0 })
const tagPage = reactive({ page: 1, size: 10, total: 0 })
const linkPage = reactive({ page: 1, size: 10, total: 0 })

const quoteDialogVisible = ref(false)
const tagDialogVisible = ref(false)
const linkDialogVisible = ref(false)

const quoteDialogTitle = ref('新增文案')
const tagDialogTitle = ref('新增标签')
const linkDialogTitle = ref('新增链接')

const quoteFormRef = ref(null)
const tagFormRef = ref(null)
const linkFormRef = ref(null)

const isEditQuote = ref(false)
const isEditTag = ref(false)
const isEditLink = ref(false)

const quoteForm = reactive({
  id: null,
  configType: 'daily_quote',
  configKey: '',
  configValue: '',
  sortOrder: 0
})

const tagForm = reactive({
  id: null,
  tagType: 'env',
  tagCode: '',
  tagName: '',
  tagColor: '#409eff',
  sortOrder: 0
})

const linkForm = reactive({
  id: null,
  linkName: '',
  linkUrl: '',
  tagIds: [],
  linkIcon: '',
  sortOrder: 0,
  status: 1
})

const quoteRules = {
  configValue: [{ required: true, message: '请输入文案内容', trigger: 'blur' }]
}

const tagRules = {
  tagType: [{ required: true, message: '请选择标签类型', trigger: 'change' }],
  tagCode: [{ required: true, message: '请输入标签代码', trigger: 'blur' }],
  tagName: [{ required: true, message: '请输入标签名称', trigger: 'blur' }]
}

const linkRules = {
  linkName: [{ required: true, message: '请输入链接名称', trigger: 'blur' }],
  linkUrl: [{ required: true, message: '请输入链接地址', trigger: 'blur' }]
}

const getTagTypeName = (type) => {
  const map = { env: '环境标签', resource: '资源标签', status: '状态标签', other: '其他' }
  return map[type] || type
}

const getTagColor = (tagId) => {
  const tag = allTags.value.find(t => t.id === tagId)
  return tag ? tag.tagColor : '#909399'
}

const getTagName = (tagId) => {
  const tag = allTags.value.find(t => t.id === tagId)
  return tag ? tag.tagName : '未知'
}

const loadFeatureSwitches = async () => {
  try {
    const res = await axios.get('/flow-brain/system/feature/switches')
    if (res.data && res.data.code === 200 && res.data.data) {
      Object.assign(featureSwitches, res.data.data)
    }
  } catch (e) {
    console.log('获取功能开关失败')
  }
}

const saveFeatureSwitch = async (featureCode) => {
  try {
    await axios.put(`/flow-brain/system/feature/${featureCode}/toggle?enabled=${featureSwitches[featureCode]}`)
    ElMessage.success('设置已保存')
  } catch (e) {
    console.log('保存功能开关失败')
  }
}

const loadQuotes = async () => {
  loading.value = true
  try {
    const params = {
      page: quotePage.page,
      size: quotePage.size,
      configType: 'daily_quote'
    }
    if (quoteSearch.value) {
      params.keyword = quoteSearch.value
    }
    const res = await axios.get('/flow-brain/system/atmosphere/page', { params })
    if (res.data && res.data.code === 200) {
      quoteList.value = res.data.data.records || []
      quotePage.total = res.data.data.total || 0
    }
  } catch (e) {
    console.log('获取文案列表失败')
  } finally {
    loading.value = false
  }
}

const loadAllTags = async () => {
  try {
    const res = await axios.get('/flow-brain/system/tag/list')
    if (res.data && res.data.code === 200) {
      allTags.value = res.data.data || []
    }
  } catch (e) {
    console.log('获取标签列表失败')
  }
}

const loadTags = async () => {
  tagLoading.value = true
  try {
    const params = {
      page: tagPage.page,
      size: tagPage.size
    }
    if (tagSearch.tagType) {
      params.tagType = tagSearch.tagType
    }
    if (tagSearch.keyword) {
      params.keyword = tagSearch.keyword
    }
    const res = await axios.get('/flow-brain/system/tag/page', { params })
    if (res.data && res.data.code === 200) {
      tagList.value = res.data.data.records || []
      tagPage.total = res.data.data.total || 0
    }
  } catch (e) {
    console.log('获取标签列表失败')
  } finally {
    tagLoading.value = false
  }
}

const loadLinks = async () => {
  linkLoading.value = true
  try {
    const params = {
      page: linkPage.page,
      size: linkPage.size
    }
    if (linkSearch.tagId) {
      params.tagId = linkSearch.tagId
    }
    if (linkSearch.keyword) {
      params.keyword = linkSearch.keyword
    }
    const res = await axios.get('/flow-brain/system/quickLink/page', { params })
    if (res.data && res.data.code === 200) {
      linkList.value = res.data.data.records || []
      linkPage.total = res.data.data.total || 0
    }
  } catch (e) {
    console.log('获取链接列表失败')
  } finally {
    linkLoading.value = false
  }
}

const showAddQuoteDialog = () => {
  quoteDialogTitle.value = '新增文案'
  isEditQuote.value = false
  quoteForm.id = null
  quoteForm.configKey = `quote_${Date.now()}`
  quoteForm.configValue = ''
  quoteForm.sortOrder = quotePage.total + 1
  quoteDialogVisible.value = true
}

const editQuote = (row) => {
  quoteDialogTitle.value = '编辑文案'
  isEditQuote.value = true
  quoteForm.id = row.id
  quoteForm.configKey = row.configKey
  quoteForm.configValue = row.configValue
  quoteForm.sortOrder = row.sortOrder
  quoteDialogVisible.value = true
}

const submitQuoteForm = async () => {
  if (!quoteFormRef.value) return
  await quoteFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const api = '/flow-brain/system/atmosphere'
        const method = isEditQuote.value ? 'put' : 'post'
        const res = await axios[method](api, quoteForm)
        if (res.data.code === 200) {
          ElMessage.success(isEditQuote.value ? '更新成功' : '新增成功')
          quoteDialogVisible.value = false
          loadQuotes()
        }
      } catch (e) {
        ElMessage.error('操作失败')
      }
    }
  })
}

const toggleQuoteStatus = async (row) => {
  try {
    await axios.put('/flow-brain/system/atmosphere', { id: row.id, status: row.status })
    ElMessage.success('状态更新成功')
  } catch (e) {
    row.status = row.status === 1 ? 0 : 1
  }
}

const deleteQuote = (row) => {
  ElMessageBox.confirm('确定要删除该文案吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await axios.delete(`/flow-brain/system/atmosphere/${row.id}`)
      if (res.data.code === 200) {
        ElMessage.success('删除成功')
        loadQuotes()
      }
    } catch (e) {
      console.log('删除失败')
    }
  })
}

const showAddTagDialog = () => {
  tagDialogTitle.value = '新增标签'
  isEditTag.value = false
  tagForm.id = null
  tagForm.tagType = 'env'
  tagForm.tagCode = ''
  tagForm.tagName = ''
  tagForm.tagColor = '#409eff'
  tagForm.sortOrder = tagPage.total + 1
  tagDialogVisible.value = true
}

const editTag = (row) => {
  tagDialogTitle.value = '编辑标签'
  isEditTag.value = true
  tagForm.id = row.id
  tagForm.tagType = row.tagType || 'env'
  tagForm.tagCode = row.tagCode
  tagForm.tagName = row.tagName
  tagForm.tagColor = row.tagColor
  tagForm.sortOrder = row.sortOrder
  tagDialogVisible.value = true
}

const submitTagForm = async () => {
  if (!tagFormRef.value) return
  await tagFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const api = '/flow-brain/system/tag'
        const method = isEditTag.value ? 'put' : 'post'
        const res = await axios[method](api, tagForm)
        if (res.data.code === 200) {
          ElMessage.success(isEditTag.value ? '更新成功' : '新增成功')
          tagDialogVisible.value = false
          loadTags()
          loadAllTags()
        }
      } catch (e) {
        ElMessage.error('操作失败')
      }
    }
  })
}

const deleteTag = (row) => {
  ElMessageBox.confirm('确定要删除该标签吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await axios.delete(`/flow-brain/system/tag/${row.id}`)
      if (res.data.code === 200) {
        ElMessage.success('删除成功')
        loadTags()
        loadAllTags()
      }
    } catch (e) {
      console.log('删除失败')
    }
  })
}

const showAddLinkDialog = () => {
  linkDialogTitle.value = '新增链接'
  isEditLink.value = false
  linkForm.id = null
  linkForm.linkName = ''
  linkForm.linkUrl = ''
  linkForm.tagIds = []
  linkForm.linkIcon = ''
  linkForm.sortOrder = linkPage.total + 1
  linkForm.status = 1
  linkDialogVisible.value = true
}

const editLink = async (row) => {
  linkDialogTitle.value = '编辑链接'
  isEditLink.value = true
  try {
    const res = await axios.get(`/flow-brain/system/quickLink/${row.id}`)
    if (res.data.code === 200) {
      const data = res.data.data
      linkForm.id = data.link.id
      linkForm.linkName = data.link.linkName
      linkForm.linkUrl = data.link.linkUrl
      linkForm.tagIds = data.tagIds || []
      linkForm.linkIcon = data.link.linkIcon
      linkForm.sortOrder = data.link.sortOrder
      linkForm.status = data.link.status
      linkDialogVisible.value = true
    }
  } catch (e) {
    console.log('获取链接详情失败')
  }
}

const submitLinkForm = async () => {
  if (!linkFormRef.value) return
  await linkFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const api = '/flow-brain/system/quickLink'
        const method = isEditLink.value ? 'put' : 'post'
        const res = await axios[method](api, linkForm)
        if (res.data.code === 200) {
          ElMessage.success(isEditLink.value ? '更新成功' : '新增成功')
          linkDialogVisible.value = false
          loadLinks()
        }
      } catch (e) {
        ElMessage.error('操作失败')
      }
    }
  })
}

const deleteLink = (row) => {
  ElMessageBox.confirm('确定要删除该链接吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await axios.delete(`/flow-brain/system/quickLink/${row.id}`)
      if (res.data.code === 200) {
        ElMessage.success('删除成功')
        loadLinks()
      }
    } catch (e) {
      console.log('删除失败')
    }
  })
}

onMounted(() => {
  loadFeatureSwitches()
  loadAllTags()
  loadQuotes()
  loadTags()
  loadLinks()
})
</script>

<style scoped>
.system-config {
  padding: 0;
}

.system-config :deep(.el-card__body) {
  padding: 10px 15px;
}

.feature-switches {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.switch-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--card-bg);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  gap: 8px;
}

.switch-item:hover {
  border-color: var(--primary-color);
  background: var(--hover-bg);
}

.switch-title {
  font-size: 13px;
  color: var(--text-primary);
}

.switch-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 8px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.filter-group {
  display: flex;
  gap: 8px;
}

.color-preview {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.el-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
