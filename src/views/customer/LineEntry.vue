<template>
  <div class="line-entry-page">
    <!-- 載入狀態 -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p class="loading-text">{{ loadingMessage }}</p>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>{{ error.includes('好友') ? '需要加入好友' : '連接失敗' }}</h3>
      <p class="error-message">{{ error }}</p>
      <div class="error-actions">
        <!-- 如果是好友相關錯誤，顯示加好友按鈕 -->
        <button v-if="error.includes('好友')" @click="openFriendshipPage" class="friendship-btn">
          📱 加入官方帳號
        </button>
        <button @click="retry" class="retry-btn">重新嘗試</button>
        <button @click="goHome" class="home-btn">返回首頁</button>
      </div>
    </div>

    <!-- 成功狀態（通常不會顯示，會直接跳轉） -->
    <div v-else-if="success" class="success-container">
      <div class="success-icon">✅</div>
      <p>處理成功，正在跳轉...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLineParams } from '@/composables/useLineParams'
import { useCartStore } from '@/stores/cart'
import { useApi } from '@/composables/useApi'
import liff from '@line/liff'

// 組合式 API
const router = useRouter()
const { getCleanParams } = useLineParams()
const cartStore = useCartStore()
const { api } = useApi()

// 響應式狀態
const isLoading = ref(true)
const error = ref(null)
const success = ref(false)
const currentStep = ref('init')

// 載入訊息
const loadingMessage = computed(() => {
  const messages = {
    init: '正在初始化...',
    liff: '正在連接 LINE...',
    auth: '正在驗證登入狀態...',
    friendship: '正在檢查好友狀態...',
    params: '正在解析參數...',
    context: '正在設定上下文...',
    redirect: '處理成功，準備跳轉...',
  }
  return messages[currentStep.value] || '處理中...'
})

// 主要處理邏輯
const processLineEntry = async () => {
  try {
    // Step 1: 初始化 LIFF
    currentStep.value = 'liff'
    console.log('🔗 開始初始化 LIFF...')

    // 獲取固定的 liffId 從環境變數
    const liffId = import.meta.env.VITE_LIFF_ID
    
    if (!liffId) {
      throw new Error('LIFF ID 未設定，請檢查環境變數 VITE_LIFF_ID')
    }

    await liff.init({ liffId })
    
    // 獲取 URL 參數（不包含 liffId，因為它是固定的）
    const params = getCleanParams()
    console.log('✅ LIFF 初始化成功')

    // 短暫延遲，讓用戶看到載入過程
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Step 2: 檢查登入狀態
    currentStep.value = 'auth'
    console.log('🔐 檢查登入狀態...')

    if (!liff.isLoggedIn()) {
      console.log('❌ 用戶未登入，跳轉到登入頁面')
      liff.login()
      return
    }

    console.log('✅ 用戶已登入')
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Step 3: 檢查好友狀態
    currentStep.value = 'friendship'
    console.log('👥 檢查好友狀態...')

    try {
      const friendship = await liff.getFriendship()

      if (!friendship.friendFlag) {
        console.log('❌ 用戶尚未加入好友')
        // 顯示提示訊息
        error.value = '請先加入官方帳號為好友，然後重新開啟此連結'
        isLoading.value = false
        return
      }

      console.log('✅ 用戶已是好友')
    } catch (friendshipError) {
      console.warn('⚠️ 無法檢查好友狀態，繼續處理:', friendshipError)
      // 如果無法檢查好友狀態，繼續處理（容錯機制）
    }

    await new Promise((resolve) => setTimeout(resolve, 300))

    // Step 4: 解析參數
    currentStep.value = 'params'
    console.log('📋 解析到的參數:', params)
    console.log('🔧 使用的 LIFF ID:', liffId)

    // 短暫延遲，讓用戶看到載入過程
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Step 5: 設定購物車上下文
    currentStep.value = 'context'
    cartStore.setBrandAndStore(params.brandId, params.storeId)
    console.log('🛒 設定購物車上下文:', {
      brandId: params.brandId,
      storeId: params.storeId,
    })

    // Step 6: 準備跳轉
    currentStep.value = 'redirect'
    success.value = true

    // 構建目標 URL
    const targetRoute = {
      name: 'menu',
      params: {
        brandId: params.brandId,
        storeId: params.storeId,
      },
      query: {
        fromLine: 'true',
        source: params.source,
        ...(params.tableNumber && { tableNumber: params.tableNumber }),
        ...(params.campaign && { campaign: params.campaign }),
        ...(params.promo && { promo: params.promo }),
        timestamp: Date.now(),
      },
    }

    console.log('🔄 準備跳轉到:', targetRoute)

    // 延遲跳轉，讓用戶看到成功訊息
    setTimeout(() => {
      router.replace(targetRoute)
    }, 800)
  } catch (err) {
    console.error('❌ LINE Entry 處理失敗:', err)

    // 針對 LIFF 特定錯誤提供更友善的錯誤訊息
    let errorMessage = '處理失敗，請重新嘗試'

    if (err.code) {
      switch (err.code) {
        case 'LIFF_INIT_ERROR':
          errorMessage = 'LINE 應用程式初始化失敗，請確認連結正確'
          break
        case 'FORBIDDEN':
          errorMessage = '無權限訪問此應用程式'
          break
        case 'UNAUTHORIZED':
          errorMessage = '請先登入 LINE 帳號'
          break
        default:
          errorMessage = `LINE 連接錯誤 (${err.code}): ${err.message || '請重新嘗試'}`
      }
    } else if (err.message) {
      errorMessage = err.message
    }

    error.value = errorMessage
    isLoading.value = false
  }
}

// 重試邏輯
const retry = () => {
  error.value = null
  success.value = false
  isLoading.value = true
  currentStep.value = 'init'
  processLineEntry()
}

// 返回首頁
const goHome = () => {
  router.replace({ name: 'landing-home' })
}

// 開啟加好友頁面
const openFriendshipPage = async () => {
  try {
    // 獲取當前的參數（包含店家資訊）
    const params = getCleanParams()
    
    if (!params.brandId || !params.storeId) {
      console.warn('⚠️ 缺少店家資訊，無法獲取 LINE Bot 資訊')
      error.value = '無法獲取店家資訊，請重新開啟連結'
      return
    }

    // 從 API 獲取店家的 LINE Bot 資訊
    const response = await api.store.getLineBotInfo({
      brandId: params.brandId,
      id: params.storeId
    })

    const lineBotId = response.data.lineBotInfo.lineBotId
    
    if (lineBotId) {
      console.log('🤖 使用店家專屬 LINE Bot:', lineBotId)
      window.open(`https://line.me/R/ti/p/@${lineBotId}`, '_blank')
    } else {
      console.warn('⚠️ 店家未設定 LINE Bot ID')
      error.value = '此店家尚未設定 LINE 官方帳號，請聯繫店家處理'
    }
  } catch (error) {
    console.error('❌ 獲取店家 LINE Bot 資訊失敗:', error)
    error.value = '無法獲取店家 LINE Bot 資訊，請稍後再試'
  }
}

// 生命週期
onMounted(() => {
  // 記錄來源資訊（用於除錯）
  const userAgent = navigator.userAgent
  const isInLineApp = userAgent.includes('Line/')

  console.log('📱 環境資訊:', {
    userAgent,
    isInLineApp,
    url: window.location.href,
  })

  if (!isInLineApp) {
    console.warn('⚠️ 不在 LINE App 環境中')
  }

  // 開始處理
  processLineEntry()
})

// 錯誤邊界處理
window.addEventListener('unhandledrejection', (event) => {
  console.error('未處理的 Promise 錯誤:', event.reason)
  if (isLoading.value) {
    error.value = '系統錯誤，請重新嘗試'
    isLoading.value = false
  }
})
</script>

<style scoped>
.line-entry-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00c851 0%, #007e33 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 20px;
}

.loading-container,
.error-container,
.success-container {
  text-align: center;
  max-width: 400px;
  width: 100%;
  padding: 40px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 載入動畫 */
.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #00c851;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #666;
  font-size: 16px;
  margin: 0;
}

/* 錯誤狀態 */
.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-container h3 {
  color: #e74c3c;
  margin: 0 0 12px 0;
  font-size: 20px;
}

.error-message {
  color: #666;
  margin-bottom: 24px;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.retry-btn,
.home-btn,
.friendship-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.friendship-btn {
  background: #00c851;
  color: white;
  font-weight: 600;
}

.friendship-btn:hover {
  background: #007e33;
  transform: translateY(-1px);
}

.retry-btn {
  background: #6c757d;
  color: white;
}

.retry-btn:hover {
  background: #5a6268;
}

.home-btn {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #dee2e6;
}

.home-btn:hover {
  background: #e9ecef;
}

/* 成功狀態 */
.success-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.success-container p {
  color: #00c851;
  font-size: 16px;
  margin: 0;
}

/* 響應式設計 */
@media (max-width: 480px) {
  .line-entry-page {
    padding: 16px;
  }

  .loading-container,
  .error-container,
  .success-container {
    padding: 32px 16px;
  }

  .error-actions {
    flex-direction: column;
  }

  .retry-btn,
  .home-btn,
  .friendship-btn {
    width: 100%;
  }
}
</style>
