<template>
  <div class="login-container">
    <div class="login-bg">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>
    
    <div class="login-card">
      <div class="login-header">
        <img src="/favicon.svg" alt="Tia" class="login-logo" />
        <h1 class="login-title">Tia</h1>
        <p class="login-subtitle">业务流程智能中枢</p>
      </div>
      
      <el-form :model="loginForm" :rules="rules" ref="formRef" class="login-form">
        <el-form-item prop="userAccount">
          <el-input 
            v-model="loginForm.userAccount" 
            placeholder="请输入用户账号"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>默认账号: admin / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  userAccount: '',
  password: ''
})

const rules = {
  userAccount: [{ required: true, message: '请输入用户账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  
  loading.value = true
  try {
    const res = await axios.post('/flow-brain/system/user/login', loginForm)
    if (res.data.code === 200) {
      localStorage.setItem('tia-user', JSON.stringify(res.data.data))
      
      const isShareLogin = route.query.share === '1'
      if (isShareLogin) {
        sessionStorage.setItem('tia-share-session', 'true')
      } else {
        sessionStorage.removeItem('tia-share-session')
      }
      
      ElMessage.success('登录成功')
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } else {
      ElMessage.error(res.data.msg || '登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请检查网络')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.shape-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  right: -50px;
  animation-delay: 2s;
}

.shape-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  right: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

.login-card {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.login-title {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.login-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.login-form {
  margin-top: 20px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 10px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.login-footer p {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

@media screen and (max-width: 768px) {
  .login-container {
    padding: 16px;
  }
  
  .login-card {
    width: 100%;
    max-width: 400px;
    padding: 32px 24px;
    border-radius: 16px;
  }
  
  .login-logo {
    width: 56px;
    height: 56px;
    margin-bottom: 12px;
  }
  
  .login-title {
    font-size: 28px;
  }
  
  .login-subtitle {
    font-size: 13px;
  }
  
  .login-header {
    margin-bottom: 24px;
  }
  
  .login-form {
    margin-top: 16px;
  }
  
  .login-btn {
    height: 42px;
    font-size: 15px;
  }
  
  .login-footer {
    margin-top: 16px;
    padding-top: 16px;
  }
  
  .bg-shape.shape-1 {
    width: 250px;
    height: 250px;
    top: -80px;
    left: -80px;
  }
  
  .bg-shape.shape-2 {
    width: 180px;
    height: 180px;
    bottom: -40px;
    right: -40px;
  }
  
  .bg-shape.shape-3 {
    width: 120px;
    height: 120px;
  }
}

@media screen and (max-width: 480px) {
  .login-card {
    padding: 24px 20px;
    border-radius: 12px;
  }
  
  .login-logo {
    width: 48px;
    height: 48px;
  }
  
  .login-title {
    font-size: 24px;
  }
  
  .login-subtitle {
    font-size: 12px;
  }
  
  .login-btn {
    height: 40px;
    font-size: 14px;
  }
}
</style>
