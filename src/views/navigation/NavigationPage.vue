<template>
  <div class="navigation-page">
    <div class="nav-header">
      <div class="header-title">
        <el-icon class="title-icon"><Compass /></el-icon>
        <span>快速导航</span>
      </div>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索链接..."
          prefix-icon="Search"
          clearable
          style="width: 200px"
        />
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加链接
        </el-button>
      </div>
    </div>

    <div class="nav-tabs">
      <div
        v-for="tab in envTabs"
        :key="tab.value"
        :class="['nav-tab', { active: activeEnv === tab.value }]"
        @click="activeEnv = tab.value"
      >
        <span class="tab-dot" :style="{ background: tab.color }"></span>
        {{ tab.label }}
        <span class="tab-count">{{ getLinkCount(tab.value) }}</span>
      </div>
    </div>

    <div class="nav-content">
      <div v-if="filteredLinks.length === 0" class="empty-state">
        <el-icon class="empty-icon"><Link /></el-icon>
        <p>暂无链接</p>
        <el-button type="primary" @click="showAddDialog">添加第一个链接</el-button>
      </div>

      <div v-else class="link-grid">
        <div
          v-for="item in filteredLinks"
          :key="item.link.id"
          class="link-card"
          @click="openLink(item.link)"
        >
          <div class="card-header">
            <div class="card-left">
              <div class="card-icon">
                <el-icon v-if="!item.link.linkIcon"><Link /></el-icon>
                <span v-else>{{ item.link.linkIcon }}</span>
              </div>
              <div class="card-info">
                <h3 class="link-name">{{ item.link.linkName }}</h3>
                <p class="link-url">{{ item.link.linkUrl }}</p>
              </div>
            </div>
            <div class="card-tags">
              <el-tag v-for="tagId in item.tagIds" :key="tagId" :style="{ background: getTagColor(tagId), borderColor: getTagColor(tagId), color: '#fff' }" size="small">
                {{ getTagName(tagId) }}
              </el-tag>
            </div>
            <el-button text size="small" class="edit-btn" @click.stop="editLink(item)">
              <el-icon><Edit /></el-icon>
            </el-button>
          </div>
          <div class="card-accounts" v-if="item.accounts && item.accounts.length > 0">
            <div v-for="(account, index) in item.accounts" :key="index" class="account-row">
              <span class="account-label">账号</span>
              <span class="account-value copyable" @click.stop="copyText(account.accountValue)">{{ account.accountValue }}</span>
              <span class="account-label">密码</span>
              <span class="account-value copyable" @click.stop="copyText(account.passwordValue)">{{ account.passwordValue }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form :model="linkForm" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="链接名称" prop="linkName">
              <el-input v-model="linkForm.linkName" placeholder="请输入链接名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签" prop="tagIds">
              <el-select v-model="linkForm.tagIds" multiple placeholder="请选择标签" style="width: 100%">
                <el-option v-for="tag in envTags" :key="tag.id" :label="tag.tagName" :value="tag.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="链接地址" prop="linkUrl">
          <el-input v-model="linkForm.linkUrl" placeholder="请输入链接地址" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="图标">
              <el-input v-model="linkForm.linkIcon" placeholder="图标名称或emoji" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="linkForm.sortOrder" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">关联账号</el-divider>
        
        <div class="accounts-section">
          <div v-for="(account, index) in linkForm.accounts" :key="index" class="account-item">
            <el-row :gutter="10">
              <el-col :span="6">
                <el-input v-model="account.accountName" placeholder="账号名称" />
              </el-col>
              <el-col :span="6">
                <el-input v-model="account.accountValue" placeholder="账号/用户名" />
              </el-col>
              <el-col :span="6">
                <el-input v-model="account.passwordValue" placeholder="密码" type="password" show-password />
              </el-col>
              <el-col :span="5">
                <el-input v-model="account.remark" placeholder="备注" />
              </el-col>
              <el-col :span="1">
                <el-button type="danger" circle size="small" @click="removeAccount(index)">
                  <el-icon><Minus /></el-icon>
                </el-button>
              </el-col>
            </el-row>
          </div>
          <el-button type="primary" plain size="small" @click="addAccount">
            <el-icon><Plus /></el-icon>
            添加账号
          </el-button>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="accountsDialogVisible" title="账号信息" width="500px">
      <div v-if="currentItem" class="accounts-list">
        <div v-for="(account, index) in currentItem.accounts" :key="index" class="account-row">
          <div class="account-info">
            <span class="account-name">{{ account.accountName }}</span>
            <span class="account-value">账号：{{ account.accountValue }}</span>
          </div>
          <div class="account-password">
            <span>密码：</span>
            <el-input v-model="account.passwordValue" type="password" show-password size="small" style="width: 150px" readonly />
            <el-button size="small" @click="copyPassword(account.passwordValue)">复制</el-button>
          </div>
          <div v-if="account.remark" class="account-remark">
            备注：{{ account.remark }}
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const searchKeyword = ref('')
const activeEnv = ref('all')
const loading = ref(false)
const dialogVisible = ref(false)
const accountsDialogVisible = ref(false)
const dialogTitle = ref('添加链接')
const isEdit = ref(false)
const formRef = ref(null)
const currentItem = ref(null)

const links = ref([])
const envTags = ref([])

const envTabs = computed(() => {
  const tabs = [{ label: '全部', value: 'all', color: '#6366f1' }]
  envTags.value.forEach(tag => {
    tabs.push({
      label: tag.tagName,
      value: tag.id,
      color: tag.tagColor
    })
  })
  return tabs
})

const linkForm = reactive({
  id: null,
  linkName: '',
  linkUrl: '',
  tagIds: [],
  linkIcon: '',
  sortOrder: 0,
  accounts: []
})

const rules = {
  linkName: [{ required: true, message: '请输入链接名称', trigger: 'blur' }],
  linkUrl: [{ required: true, message: '请输入链接地址', trigger: 'blur' }],
  tagIds: [{ required: true, message: '请选择标签', trigger: 'change', type: 'array' }]
}

const filteredLinks = computed(() => {
  let result = links.value
  if (activeEnv.value !== 'all') {
    result = result.filter(item => item.tagIds && item.tagIds.includes(activeEnv.value))
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => 
      item.link.linkName.toLowerCase().includes(keyword) ||
      item.link.linkUrl.toLowerCase().includes(keyword)
    )
  }
  return result
})

const getLinkCount = (tagId) => {
  if (tagId === 'all') return links.value.length
  return links.value.filter(item => item.tagIds && item.tagIds.includes(tagId)).length
}

const getTagColor = (tagId) => {
  const found = envTags.value.find(t => t.id === tagId)
  return found ? found.tagColor : '#909399'
}

const getTagName = (tagId) => {
  const found = envTags.value.find(t => t.id === tagId)
  return found ? found.tagName : '未知'
}

const loadEnvTags = async () => {
  try {
    const res = await axios.get('/flow-brain/system/tag/list?tagType=env')
    if (res.data.code === 200) {
      envTags.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载环境标签失败:', error)
  }
}

const loadLinks = async () => {
  loading.value = true
  try {
    const res = await axios.get('/flow-brain/system/quickLink/listWithAccounts')
    if (res.data.code === 200) {
      links.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载链接失败:', error)
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  dialogTitle.value = '添加链接'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const editLink = async (item) => {
  dialogTitle.value = '编辑链接'
  isEdit.value = true
  try {
    const res = await axios.get(`/flow-brain/system/quickLink/${item.link.id}`)
    if (res.data.code === 200) {
      const data = res.data.data
      Object.assign(linkForm, {
        id: data.link.id,
        linkName: data.link.linkName,
        linkUrl: data.link.linkUrl,
        tagIds: data.tagIds || [],
        linkIcon: data.link.linkIcon,
        sortOrder: data.link.sortOrder,
        accounts: data.accounts || []
      })
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('加载链接详情失败:', error)
  }
}

const resetForm = () => {
  linkForm.id = null
  linkForm.linkName = ''
  linkForm.linkUrl = ''
  linkForm.tagIds = []
  linkForm.linkIcon = ''
  linkForm.sortOrder = 0
  linkForm.accounts = []
  formRef.value?.resetFields()
}

const addAccount = () => {
  linkForm.accounts.push({
    accountName: '',
    accountValue: '',
    passwordValue: '',
    remark: ''
  })
}

const removeAccount = (index) => {
  linkForm.accounts.splice(index, 1)
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const api = '/flow-brain/system/quickLink'
        const method = isEdit.value ? 'put' : 'post'
        const res = await axios[method](api, linkForm)
        if (res.data.code === 200) {
          ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
          dialogVisible.value = false
          loadLinks()
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

const deleteLink = (item) => {
  ElMessageBox.confirm('确定要删除该链接吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await axios.delete(`/flow-brain/system/quickLink/${item.link.id}`)
      if (res.data.code === 200) {
        ElMessage.success('删除成功')
        loadLinks()
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

const openLink = (link) => {
  window.open(link.linkUrl, '_blank')
}

const showAccounts = (item) => {
  currentItem.value = item
  accountsDialogVisible.value = true
}

const copyPassword = (password) => {
  navigator.clipboard.writeText(password || '').then(() => {
    ElMessage.success('已复制到剪贴板')
  })
}

const copyText = (text) => {
  navigator.clipboard.writeText(text || '').then(() => {
    ElMessage.success('已复制')
  })
}

onMounted(() => {
  loadEnvTags()
  loadLinks()
})
</script>

<style scoped>
.navigation-page {
  min-height: calc(100vh - 140px);
  background: var(--el-bg-color-page);
  padding: 20px;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
}

.title-icon {
  font-size: 24px;
  color: var(--el-color-primary);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.nav-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 8px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.nav-tab:hover {
  background: var(--el-fill-color-light);
}

.nav-tab.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.tab-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.tab-count {
  font-size: 12px;
  padding: 2px 6px;
  background: var(--el-fill-color);
  border-radius: 10px;
}

.nav-content {
  min-height: 400px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--el-text-color-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 12px;
}

.link-card {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--el-border-color-light);
}

.link-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.card-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.card-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.link-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-url {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-tags {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.edit-btn {
  flex-shrink: 0;
  padding: 4px !important;
}

.card-accounts {
  padding-top: 4px;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-bottom: 2px;
}

.card-accounts::-webkit-scrollbar {
  width: 4px;
}

.card-accounts::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 2px;
}

.card-accounts::-webkit-scrollbar-track {
  background: transparent;
}

.card-accounts .account-row {
  display: grid;
  grid-template-columns: 45px 1fr 45px 1fr;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  font-size: 14px;
  line-height: 1.4;
  margin: 0;
}

.card-accounts .account-label {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  text-align: right;
}

.card-accounts .account-value {
  color: var(--el-text-color-primary);
  font-weight: 500;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-accounts .account-value.copyable:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.card-accounts .account-value.copyable:active {
  transform: scale(0.95);
}

.accounts-section {
  margin-top: 16px;
}

.account-item {
  margin-bottom: 12px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.accounts-list {
  max-height: 400px;
  overflow-y: auto;
}

.account-row {
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  margin-bottom: 12px;
}

.account-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.account-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.account-value {
  color: var(--el-text-color-secondary);
}

.account-password {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.account-remark {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media screen and (max-width: 768px) {
  .nav-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .header-actions {
    flex-direction: column;
  }
  
  .nav-tabs {
    flex-wrap: wrap;
  }
  
  .link-grid {
    grid-template-columns: 1fr;
  }
}
</style>
