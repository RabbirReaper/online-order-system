import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useAuthStore = defineStore('auth', () => {
  // 狀態 (ref)
  const user = ref(null)
  const isLoggedIn = ref(false)
  const loadingAuth = ref(false)
  const error = ref(null)
  const brandId = ref(null)

  // 計算屬性 (computed) - 統一命名，移除冗餘
  const userName = computed(() => {
    return user.value?.name || '訪客'
  })

  const userId = computed(() => {
    return user.value?._id || null
  })

  const currentBrandId = computed(() => {
    return brandId.value
  })

  // 統一用戶資料結構
  const normalizeUserData = (userData) => {
    // 處理不同API返回的用戶資料結構
    if (userData.profile) {
      return userData.profile
    }
    if (userData.user) {
      return userData.user
    }
    return userData
  }

  // 統一錯誤處理
  const handleError = (err, defaultMessage) => {
    const errorMessage = err.response?.data?.message || err.message || defaultMessage
    error.value = errorMessage
    console.error('Auth Error:', errorMessage)
    return errorMessage
  }

  // 清除認證狀態
  const clearAuthState = () => {
    user.value = null
    isLoggedIn.value = false
    error.value = null
  }

  // 設置品牌ID並同步到sessionStorage
  function setBrandId(newBrandId) {
    brandId.value = newBrandId
    if (newBrandId) {
      sessionStorage.setItem('currentBrandId', newBrandId)
    } else {
      sessionStorage.removeItem('currentBrandId')
    }
  }

  // 初始化品牌ID（從sessionStorage恢復）
  function initializeBrandId() {
    const storedBrandId = sessionStorage.getItem('currentBrandId')
    if (storedBrandId && !brandId.value) {
      brandId.value = storedBrandId
    }
  }

  // 註冊用戶
  async function register(userData, code) {
    loadingAuth.value = true
    error.value = null

    try {
      if (!brandId.value) {
        throw new Error('無法獲取品牌資訊')
      }

      const response = await api.userAuth.register({
        brandId: brandId.value,
        userData: {
          ...userData,
          brand: brandId.value,
        },
        code,
      })

      return response
    } catch (err) {
      handleError(err, '註冊失敗，請稍後再試')
      throw err
    } finally {
      loadingAuth.value = false
    }
  }

  // 用戶登入
  async function login(credentials) {
    loadingAuth.value = true
    error.value = null

    try {
      if (!brandId.value) {
        throw new Error('無法獲取品牌資訊')
      }

      const response = await api.userAuth.login({
        brandId: brandId.value,
        credentials,
      })

      // 統一用戶資料結構
      user.value = normalizeUserData(response)
      isLoggedIn.value = true

      return response
    } catch (err) {
      clearAuthState()
      handleError(err, '登入失敗，請檢查您的手機號碼和密碼')
      throw err
    } finally {
      loadingAuth.value = false
    }
  }

  // 用戶登出
  async function logout() {
    loadingAuth.value = true
    error.value = null

    try {
      if (brandId.value) {
        await api.userAuth.logout(brandId.value)
      }

      clearAuthState()
      return { success: true }
    } catch (err) {
      handleError(err, '登出失敗，請稍後再試')
      throw err
    } finally {
      loadingAuth.value = false
    }
  }

  // 檢查用戶登入狀態 - 簡化邏輯，減少API調用
  async function checkAuthStatus() {
    if (!brandId.value) {
      clearAuthState()
      return { loggedIn: false }
    }

    try {
      // 假設後端checkStatus API已經返回完整用戶資料
      const response = await api.userAuth.checkStatus(brandId.value)

      isLoggedIn.value = response.loggedIn

      if (response.loggedIn && response.user) {
        user.value = normalizeUserData(response)
      } else if (response.loggedIn) {
        // 如果checkStatus沒有返回用戶資料，才額外調用getUserProfile
        try {
          const userProfile = await api.user.getUserProfile(brandId.value)
          user.value = normalizeUserData(userProfile)
        } catch (profileErr) {
          console.warn('獲取用戶資料失敗，但保持登入狀態')
          user.value = { name: '用戶' } // 基本用戶物件
        }
      } else {
        clearAuthState()
      }

      return response
    } catch (err) {
      console.error('檢查用戶狀態失敗:', err)
      clearAuthState()
      return { loggedIn: false }
    }
  }

  // 重設密碼
  async function resetPassword(resetData) {
    loadingAuth.value = true
    error.value = null

    try {
      if (!brandId.value) {
        throw new Error('無法獲取品牌資訊')
      }

      const response = await api.userAuth.resetPassword({
        brandId: brandId.value,
        ...resetData,
      })

      return response
    } catch (err) {
      handleError(err, '重設密碼失敗，請稍後再試')
      throw err
    } finally {
      loadingAuth.value = false
    }
  }

  // 修改密碼
  async function changePassword(passwordData) {
    loadingAuth.value = true
    error.value = null

    try {
      if (!brandId.value) {
        throw new Error('無法獲取品牌資訊')
      }

      const response = await api.userAuth.changePassword({
        brandId: brandId.value,
        ...passwordData,
      })

      return response
    } catch (err) {
      handleError(err, '修改密碼失敗，請稍後再試')
      throw err
    } finally {
      loadingAuth.value = false
    }
  }

  // 獲取用戶完整資料（用於自動填入）
  async function getUserProfile() {
    if (!brandId.value || !isLoggedIn.value) {
      return null
    }

    try {
      const response = await api.user.getUserProfile(brandId.value)
      const userData = normalizeUserData(response)

      // 更新store中的用戶資料
      if (userData) {
        user.value = { ...user.value, ...userData }
      }

      return userData
    } catch (err) {
      console.error('獲取用戶資料失敗:', err)
      return null
    }
  }

  // 初始化認證狀態（應用啟動時調用）
  async function initialize() {
    initializeBrandId()
    if (brandId.value) {
      await checkAuthStatus()
    }
  }

  return {
    // 狀態
    user,
    isLoggedIn,
    loadingAuth,
    error,
    brandId,

    // 計算屬性 - 移除冗餘的 userIsLoggedIn
    userName,
    userId,
    currentBrandId,

    // 方法
    setBrandId,
    initializeBrandId,
    register,
    login,
    logout,
    checkAuthStatus,
    resetPassword,
    changePassword,
    getUserProfile,
    initialize,
    clearAuthState,
  }
})
