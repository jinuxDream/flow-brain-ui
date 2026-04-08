<template>
  <div class="share-agent">
    <div class="share-header">
      <TiaIcon :size="36" glow />
      <span class="share-title">Tia</span>
      <span class="share-badge">分享对话</span>
    </div>
    
    <div class="share-messages" ref="messagesRef">
      <div v-if="loading" class="loading-container">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      
      <div v-else-if="messages.length === 0" class="empty-message">
        <TiaIcon :size="80" glow animated />
        <h3>您好！我是 <span class="highlight">Tia</span></h3>
        <p>我已连接业务知识中枢，随时为您服务</p>
      </div>
      
      <template v-else>
        <div v-for="(msg, index) in messages" :key="index" :class="['share-message', msg.role]">
          <div class="share-avatar">
            <el-icon v-if="msg.role === 'user'"><User /></el-icon>
            <TiaIcon v-else :size="28" />
          </div>
          <div class="share-content">
            <div class="share-text" v-html="formatMessage(msg.content)"></div>
            <div v-if="msg.role === 'assistant'" class="share-meta">
              <span v-if="msg.intent" class="meta-tag">{{ getIntentName(msg.intent) }}</span>
              <span v-if="msg.costTime" class="meta-time">{{ msg.costTime }}ms</span>
            </div>
          </div>
        </div>
      </template>
      
      <div v-if="chatting && chatMessages.length > 0" class="chat-divider">
        <span>继续对话</span>
      </div>
      
      <div v-for="(msg, index) in chatMessages" :key="'chat-' + index" :class="['share-message', msg.role]">
        <div class="share-avatar">
          <el-icon v-if="msg.role === 'user'"><User /></el-icon>
          <TiaIcon v-else :size="28" />
        </div>
        <div class="share-content">
          <div class="share-text" v-html="formatMessage(msg.content)"></div>
          <div v-if="msg.role === 'assistant'" class="share-meta">
            <span v-if="msg.intent" class="meta-tag">{{ getIntentName(msg.intent) }}</span>
            <span v-if="msg.costTime" class="meta-time">{{ msg.costTime }}ms</span>
          </div>
        </div>
      </div>
      
      <div v-if="sending" class="share-message assistant">
        <div class="share-avatar">
          <TiaIcon :size="28" />
        </div>
        <div class="share-content">
          <div class="typing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="share-input">
      <el-input
        v-model="inputMessage"
        type="textarea"
        :rows="1"
        :autosize="{ minRows: 1, maxRows: 4 }"
        placeholder="向Tia提问...（Enter发送，Shift+Enter换行）"
        @keydown.enter.exact.prevent="sendMessage"
      />
      <el-button type="primary" circle @click="sendMessage" :loading="sending" :disabled="!inputMessage.trim()">
        <el-icon><Position /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import agentApi from '@/api/agent'
import TiaIcon from '@/components/TiaIcon.vue'

const route = useRoute()
const router = useRouter()
const messagesRef = ref(null)
const messages = ref([])
const chatMessages = ref([])
const inputMessage = ref('')
const loading = ref(true)
const sending = ref(false)
const chatting = ref(false)
const sessionId = ref('')

const intentMap = {
  'query_overview': '系统概览',
  'query_table': '表结构查询',
  'query_api': '接口查询',
  'query_code': '代码查询',
  'analyze_impact': '影响分析',
  'generate_solution': '方案生成',
  'general_chat': '智能对话'
}

const getIntentName = (intent) => intentMap[intent] || intent

onMounted(async () => {
  const shareCode = route.params.shareCode
  if (!shareCode) {
    ElMessage.error('无效的分享链接')
    router.push('/login')
    return
  }
  
  sessionId.value = 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
  await loadSharedConversation(shareCode)
})

const loadSharedConversation = async (shareCode) => {
  loading.value = true
  try {
    const res = await agentApi.getSharedConversation(shareCode)
    if (res.code === 200 && res.data) {
      messages.value = res.data.map(item => ({
        role: item.role,
        content: item.content,
        intent: item.intent,
        costTime: item.costTime
      }))
      scrollToBottom()
    }
  } catch (error) {
    console.error('加载分享对话失败:', error)
  } finally {
    loading.value = false
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || sending.value) return
  
  chatting.value = true
  chatMessages.value.push({ role: 'user', content: message })
  inputMessage.value = ''
  sending.value = true
  scrollToBottom()
  
  try {
    const res = await agentApi.chat({
      sessionId: sessionId.value,
      message: message
    })
    
    if (res.code === 200) {
      chatMessages.value.push({
        role: 'assistant',
        content: res.data.content,
        intent: res.data.intent,
        costTime: res.data.costTime
      })
    } else {
      chatMessages.value.push({
        role: 'assistant',
        content: '抱歉，处理您的问题时出现错误：' + (res.msg || '未知错误')
      })
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    chatMessages.value.push({
      role: 'assistant',
      content: '抱歉，网络连接出现问题，请稍后重试。'
    })
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

const formatMessage = (content) => {
  if (!content) return ''
  return content
    .replace(/\n/g, '<br>')
    .replace(/【(.+?)】/g, '<strong class="highlight-text">【$1】</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}
</script>

<style scoped>
.share-agent {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}

.share-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  position: sticky;
  top: 0;
  z-index: 10;
}

.share-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.share-badge {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--el-color-primary-light-9);
  border-radius: 10px;
  color: var(--el-color-primary);
}

.share-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--el-text-color-secondary);
  gap: 12px;
}

.loading-icon {
  font-size: 32px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-message h3 {
  font-size: 20px;
  margin: 16px 0 8px;
  color: var(--el-text-color-primary);
}

.empty-message .highlight {
  color: var(--el-color-primary);
}

.empty-message p {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.chat-divider {
  text-align: center;
  margin: 24px 0;
  position: relative;
}

.chat-divider::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--el-border-color-light);
}

.chat-divider span {
  background: var(--el-bg-color-page);
  padding: 0 16px;
  position: relative;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.share-message {
  display: flex;
  margin-bottom: 20px;
  gap: 12px;
}

.share-message.user {
  flex-direction: row-reverse;
}

.share-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

.share-message.user .share-avatar {
  background: var(--el-color-primary);
  color: #fff;
}

.share-message.assistant .share-avatar {
  background: transparent;
}

.share-content {
  max-width: 75%;
  padding: 14px 18px;
  border-radius: 16px;
  line-height: 1.7;
}

.share-message.user .share-content {
  background: var(--el-color-primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.share-message.assistant .share-content {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  color: var(--el-text-color-primary);
  border-bottom-left-radius: 4px;
}

.share-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.share-text :deep(code) {
  background: rgba(0,0,0,0.1);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 13px;
}

.share-text :deep(.highlight-text) {
  color: var(--el-color-primary);
}

.share-meta {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.meta-tag {
  font-size: 11px;
  padding: 1px 8px;
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  color: var(--el-color-primary);
}

.meta-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.typing-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: var(--el-color-primary);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

.share-input {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
  position: sticky;
  bottom: 0;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.share-input :deep(.el-textarea__inner) {
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
}

.share-input :deep(.el-button.is-circle) {
  width: 40px;
  height: 40px;
}

@media screen and (max-width: 768px) {
  .share-header {
    padding: 12px 16px;
  }
  
  .share-messages {
    padding: 16px;
  }
  
  .share-content {
    max-width: 85%;
    padding: 12px 14px;
    font-size: 14px;
  }
  
  .share-avatar {
    width: 32px;
    height: 32px;
  }
  
  .share-input {
    padding: 12px 16px;
  }
}
</style>
