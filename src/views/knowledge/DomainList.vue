<template>
  <div class="domain-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>业务域全景</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            新增业务域
          </el-button>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="6" v-for="domain in domainList" :key="domain.id">
          <el-card class="domain-card" shadow="hover" @click="viewDomain(domain)">
            <div class="domain-content">
              <el-icon class="domain-icon" :size="48" color="#409EFF"><Folder /></el-icon>
              <div class="domain-info">
                <h3>{{ domain.domainName }}</h3>
                <p>{{ domain.description }}</p>
                <div class="domain-stats">
                  <span>流程: {{ domain.flowCount || 0 }}</span>
                  <span>节点: {{ domain.nodeCount || 0 }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增业务域" width="500px">
      <el-form :model="domainForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="业务域编码" prop="domainCode">
          <el-input v-model="domainForm.domainCode" placeholder="请输入业务域编码" />
        </el-form-item>
        <el-form-item label="业务域名称" prop="domainName">
          <el-input v-model="domainForm.domainName" placeholder="请输入业务域名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="domainForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import knowledgeApi from '@/api/knowledge'

const router = useRouter()
const dialogVisible = ref(false)
const formRef = ref(null)

const domainList = ref([])

const domainForm = reactive({
  domainCode: '',
  domainName: '',
  description: ''
})

const rules = {
  domainCode: [{ required: true, message: '请输入业务域编码', trigger: 'blur' }],
  domainName: [{ required: true, message: '请输入业务域名称', trigger: 'blur' }]
}

const loadDomains = async () => {
  try {
    const res = await knowledgeApi.listDomains()
    if (res.code === 200) {
      domainList.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('加载业务域失败')
  }
}

const showAddDialog = () => {
  domainForm.domainCode = ''
  domainForm.domainName = ''
  domainForm.description = ''
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      ElMessage.success('新增成功')
      dialogVisible.value = false
      loadDomains()
    }
  })
}

const viewDomain = (domain) => {
  router.push({
    path: '/knowledge/flow',
    query: { domainCode: domain.domainCode }
  })
}

onMounted(() => {
  loadDomains()
})
</script>

<style scoped>
.domain-list {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.domain-card {
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 20px;
}

.domain-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--card-shadow-hover);
}

.domain-content {
  text-align: center;
  padding: 15px;
}

.domain-icon {
  margin-bottom: 15px;
}

.domain-info h3 {
  font-size: 18px;
  margin: 10px 0;
  color: var(--text-primary);
}

.domain-info p {
  font-size: 14px;
  color: var(--text-muted);
  margin: 10px 0;
  min-height: 40px;
}

.domain-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--border-default);
}

.domain-stats span {
  font-size: 14px;
  color: var(--text-secondary);
}

.domain-list :deep(.el-card__body) {
  padding: 10px 15px;
}
</style>
