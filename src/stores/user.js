import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const isLoggedIn = ref(false)

  const setUser = (userData) => {
    user.value = userData
    isLoggedIn.value = true
    localStorage.setItem('tia-user', JSON.stringify(userData))
  }

  const logout = async () => {
    try {
      await axios.post('/flow-brain/system/user/logout')
    } catch (e) {
      console.error('logout error:', e)
    }
    user.value = null
    isLoggedIn.value = false
    localStorage.removeItem('tia-user')
  }

  const checkLogin = async () => {
    const savedUser = localStorage.getItem('tia-user')
    if (savedUser) {
      try {
        const res = await axios.get('/flow-brain/system/user/current')
        if (res.data.code === 200) {
          user.value = res.data.data
          isLoggedIn.value = true
        } else {
          user.value = null
          isLoggedIn.value = false
          localStorage.removeItem('tia-user')
        }
      } catch (e) {
        user.value = JSON.parse(savedUser)
        isLoggedIn.value = true
      }
    }
  }

  return {
    user,
    isLoggedIn,
    setUser,
    logout,
    checkLogin
  }
})
