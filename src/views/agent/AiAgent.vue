<template>
  <div class="ai-agent" :class="{ 'fullscreen': isFullscreen }">
    <div class="chat-container">
      <div class="chat-header">
        <div class="header-left">
          <TiaIcon :size="isFullscreen ? 56 : 48" glow />
          <div class="header-info">
            <span class="title">Tia</span>
            <span class="subtitle">业务知识中枢</span>
          </div>
        </div>
        <div class="header-actions">
          <el-tooltip :content="isFullscreen ? '退出全屏' : '全屏'" placement="bottom">
            <el-button text class="action-btn" @click="toggleFullscreen">
              <el-icon><FullScreen v-if="!isFullscreen" /><Close v-else /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="分享对话" placement="bottom">
            <el-button text class="action-btn" @click="shareChat">
              <el-icon><Share /></el-icon>
            </el-button>
          </el-tooltip>
          <el-button text class="action-btn" @click="clearChat">
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
        </div>
      </div>
      
      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-tia">
            <TiaIcon :size="160" glow animated />
          </div>
          <h3>您好！我是 <span class="highlight">Tia</span></h3>
          <p class="welcome-desc">我已连接业务知识中枢，随时为您服务</p>
          <div class="capabilities">
            <div class="capability-item">
              <div class="capability-icon">🔮</div>
              <span>系统洞察</span>
            </div>
            <div class="capability-item">
              <div class="capability-icon">📊</div>
              <span>数据分析</span>
            </div>
            <div class="capability-item">
              <div class="capability-icon">⚡</div>
              <span>风险评估</span>
            </div>
            <div class="capability-item">
              <div class="capability-icon">💡</div>
              <span>方案建议</span>
            </div>
          </div>
          <div class="quick-actions">
            <el-button v-for="action in quickActions" :key="action" class="action-btn" @click="sendQuickAction(action)">
              {{ action }}
            </el-button>
          </div>
        </div>
        
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
          <div class="message-avatar">
            <el-icon v-if="msg.role === 'user'"><User /></el-icon>
            <TiaIcon v-else :size="40" />
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(msg.content)"></div>
            <div v-if="msg.role === 'assistant'" class="message-meta">
              <span v-if="msg.intent" class="meta-tag">{{ getIntentName(msg.intent) }}</span>
              <span v-if="msg.costTime" class="meta-time">耗时 {{ msg.costTime }}ms</span>
            </div>
          </div>
        </div>
        
        <div v-if="loading" class="message assistant">
          <div class="message-avatar">
            <TiaIcon :size="40" />
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="chat-input">
        <div class="input-wrapper">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="2"
            placeholder="向 Tia 提问...（Enter发送，Shift+Enter换行）"
            @keydown.enter.exact.prevent="sendMessage"
            :disabled="loading"
            class="message-input"
          />
          <el-button type="primary" class="send-btn" @click="sendMessage" :loading="loading" :disabled="!inputMessage.trim()">
            <el-icon><Position /></el-icon>
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import agentApi from '@/api/agent'
import TiaIcon from '@/components/TiaIcon.vue'

const route = useRoute()
const messagesRef = ref(null)
const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const sessionId = ref('')
const isFullscreen = ref(false)

const quickActions = [
  '系统有哪些应用？',
  '订单系统有哪些流程？',
  '系统有哪些接口？'
]

const intentMap = {
  'query_overview': '系统概览',
  'query_table': '表结构查询',
  'query_api': '接口查询',
  'query_code': '代码查询',
  'analyze_impact': '影响分析',
  'generate_solution': '方案生成',
  'general_chat': '智能对话'
}

const getIntentName = (intent) => {
  return intentMap[intent] || intent
}

onMounted(() => {
  const shareCode = route.params.shareCode
  if (shareCode) {
    loadSharedConversation(shareCode)
  } else {
    sessionId.value = generateSessionId()
  }
  
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('keydown', handleKeydown)
})

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

const handleKeydown = (e) => {
  if (e.key === 'Escape' && isFullscreen.value) {
    document.exitFullscreen()
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

const loadSharedConversation = async (shareCode) => {
  try {
    const res = await agentApi.getSharedConversation(shareCode)
    if (res.code === 200 && res.data) {
      messages.value = res.data.map(item => ({
        role: item.role,
        content: item.content,
        intent: item.intent,
        costTime: item.costTime
      }))
    }
  } catch (error) {
    console.error('加载分享对话失败:', error)
  }
}

const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || loading.value) return
  
  messages.value.push({
    role: 'user',
    content: message
  })
  
  inputMessage.value = ''
  loading.value = true
  scrollToBottom()
  
  try {
    const res = await agentApi.chat({
      sessionId: sessionId.value,
      message: message
    })
    
    if (res.code === 200) {
      messages.value.push({
        role: 'assistant',
        content: res.data.content,
        intent: res.data.intent,
        skillUsed: res.data.skillUsed,
        costTime: res.data.costTime
      })
    } else {
      messages.value.push({
        role: 'assistant',
        content: '抱歉，处理您的问题时出现错误：' + (res.msg || '未知错误')
      })
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    messages.value.push({
      role: 'assistant',
      content: '抱歉，网络连接出现问题，请稍后重试。'
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

const sendQuickAction = (action) => {
  inputMessage.value = action
  sendMessage()
}

const clearChat = () => {
  messages.value = []
  sessionId.value = generateSessionId()
  shareUrl.value = ''
  ElMessage.success('对话已清空')
}

const shareChat = async () => {
  try {
    const baseUrl = window.location.origin
    let url = ''
    
    const res = await agentApi.shareConversation(sessionId.value)
    if (res.code === 200) {
      url = `${baseUrl}/share/${res.data.shareCode}`
    } else {
      ElMessage.error(res.msg || '生成失败')
      return
    }
    
    await navigator.clipboard.writeText(url)
    ElMessage.success('分享链接已复制到剪贴板')
  } catch (error) {
    console.error('分享失败:', error)
    ElMessage.error('分享失败')
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
.ai-agent {
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.ai-agent.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100vh;
  z-index: 9999;
  background: var(--el-bg-color-page);
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.fullscreen .chat-container {
  border-radius: 0;
  border: none;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-info {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  color: var(--el-text-color-regular);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--el-bg-color-page);
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
}

.welcome-tia {
  width: 160px;
  height: 160px;
  margin: 0 auto 24px;
}

.welcome-message h3 {
  font-size: 24px;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
}

.welcome-message .highlight {
  color: var(--el-color-primary);
}

.welcome-desc {
  color: var(--el-text-color-secondary);
  margin-bottom: 32px;
}

.capabilities {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
}

.capability-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.capability-icon {
  width: 48px;
  height: 48px;
  background: var(--el-fill-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border: 1px solid var(--el-border-color-light);
}

.capability-item span {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.action-btn {
  border-radius: 20px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.message {
  display: flex;
  margin-bottom: 24px;
  gap: 12px;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
}

.message.user .message-avatar {
  background: var(--el-color-primary);
  color: #fff;
}

.message.assistant .message-avatar {
  background: transparent;
}

.message-content {
  max-width: 70%;
  padding: 16px 20px;
  border-radius: 16px;
  line-height: 1.7;
}

.message.user .message-content {
  background: var(--el-color-primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-content {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  color: var(--el-text-color-primary);
  border-bottom-left-radius: 4px;
}

.message-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.message-text :deep(code) {
  background: var(--el-fill-color);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 13px;
}

.message-text :deep(.highlight-text) {
  color: var(--el-color-primary);
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.meta-tag {
  font-size: 11px;
  padding: 2px 10px;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 10px;
  color: var(--el-color-primary);
}

.meta-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.typing-indicator {
  display: flex;
  gap: 6px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: var(--el-color-primary);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

.chat-input {
  padding: 20px 24px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
}

.message-input :deep(.el-textarea__inner) {
  border-radius: 12px;
  resize: none;
}

.send-btn {
  border-radius: 12px;
  padding: 12px 24px;
  height: auto;
  font-weight: 500;
  transition: all 0.3s ease;
}

.send-btn:hover {
  transform: translateY(-2px);
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-dark);
}

@media screen and (max-width: 768px) {
  .ai-agent {
    height: 100vh;
    margin: 0;
  }
  
  .chat-container {
    border-radius: 0;
    border: none;
  }
  
  .chat-header {
    padding: 12px 16px;
  }
  
  .header-left {
    gap: 12px;
  }
  
  .title {
    font-size: 18px;
  }
  
  .subtitle {
    display: none;
  }
  
  .header-actions {
    gap: 4px;
  }
  
  .action-btn {
    padding: 8px;
  }
  
  .action-btn span {
    display: none;
  }
  
  .chat-messages {
    padding: 16px;
  }
  
  .welcome-message {
    padding: 24px 16px;
  }
  
  .welcome-tia {
    width: 100px;
    height: 100px;
  }
  
  .welcome-message h3 {
    font-size: 18px;
  }
  
  .welcome-desc {
    font-size: 14px;
    margin-bottom: 24px;
  }
  
  .capabilities {
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .capability-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .capability-item span {
    font-size: 12px;
  }
  
  .quick-actions {
    gap: 8px;
  }
  
  .action-btn {
    font-size: 13px;
    padding: 8px 16px;
  }
  
  .message {
    margin-bottom: 16px;
    gap: 8px;
  }
  
  .message-avatar {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  
  .message-content {
    max-width: 85%;
    padding: 12px 14px;
    font-size: 14px;
  }
  
  .message-meta {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .chat-input {
    padding: 12px 16px;
  }
  
  .input-wrapper {
    gap: 8px;
  }
  
  .send-btn {
    padding: 10px 16px;
  }
}
</style>
