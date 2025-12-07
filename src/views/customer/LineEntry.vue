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
      <h3>連接失敗</h3>
      <p class="error-message">{{ error }}</p>
      <div class="error-actions">
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
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import api from '@/api'
import liff from '@line/liff'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()

const isLoading = ref(true)
const error = ref(null)
const success = ref(false)
const currentStep = ref('init')

const loadingMessage = computed(() => {
  const messages = {
    init: '正在初始化...',
    params: '正在獲取店家資訊...',
    liff: '正在連接 LINE...',
    auth: '正在驗證登入狀態...',
    context: '正在設定上下文...',
    redirect: '處理成功，準備跳轉...',
  }
  return messages[currentStep.value] || '處理中...'
})

const getQueryParams = () => {
  const query = route.query

  const params = {
    brandId: query.brandId,
    storeId: query.storeId,
    tableNumber: query.tableNumber,
    campaign: query.campaign,
    promo: query.promo,
    source: query.source || 'line',
    timestamp: Date.now(),
  }

  console.log('📋 從 query 解析的參數:', params)
  return params
}

const processLineEntry = async () => {
  try {
    const params = getQueryParams()

    // 從 URL 或 sessionStorage 獲取參數
    let brandId = params.brandId || sessionStorage.getItem('temp-brandId')
    let storeId = params.storeId || sessionStorage.getItem('temp-storeId')

    // 檢查必要參數
    if (!brandId || !storeId) {
      throw new Error('缺少必要參數 brandId 或 storeId，請確認連結正確')
    }

    // 如果從 URL 獲取到參數，保存到 sessionStorage（供登入後恢復使用）
    if (params.brandId && params.storeId) {
      sessionStorage.setItem('temp-brandId', brandId)
      sessionStorage.setItem('temp-storeId', storeId)
      console.log('💾 已保存參數到 sessionStorage')
    } else {
      console.log('🔄 從 sessionStorage 恢復參數')
    }

    console.log('📋 使用的參數:', { brandId, storeId })

    currentStep.value = 'params'
    console.log('🔍 正在獲取店家 LINE Bot 資訊...')

    // 呼叫 API 獲取店家專屬的 LIFF ID
    const lineBotInfoResponse = await api.store.getLineBotInfo({
      brandId,
      id: storeId,
    })

    // 注意：axios 攔截器已經將 response.data 解包，所以這裡直接使用 lineBotInfoResponse
    const { liffId, lineBotId, enableLineOrdering, storeName } = lineBotInfoResponse.lineBotInfo

    console.log('📋 店家 LINE Bot 資訊:', {
      storeName,
      liffId,
      lineBotId,
      enableLineOrdering,
    })

    if (!liffId) {
      throw new Error('此店家尚未設定 LIFF ID，無法使用 LINE 點餐功能')
    }

    if (!enableLineOrdering) {
      throw new Error('此店家尚未啟用 LINE 點餐功能')
    }

    currentStep.value = 'liff'
    console.log('🔗 開始初始化 LIFF...')

    await liff.init({ liffId })
    console.log('✅ LIFF 初始化成功')

    await new Promise((resolve) => setTimeout(resolve, 300))

    currentStep.value = 'auth'
    console.log('🔐 檢查登入狀態...')

    if (!liff.isLoggedIn()) {
      console.log('❌ 用戶未登入，跳轉到登入頁面')
      console.log('📝 參數已保存，登錄後將自動恢復')
      liff.login()
      return
    }

    console.log('✅ 用戶已登入')
    try {
      console.log('👤 正在獲取用戶資訊...')

      const profile = await liff.getProfile()
      const userId = profile.userId
      const displayName = profile.displayName
      const pictureUrl = profile.pictureUrl
      const statusMessage = profile.statusMessage

      console.log('📋 用戶資訊:', {
        userId,
        displayName,
        pictureUrl,
        statusMessage,
      })

      const idToken = liff.getIDToken()
      console.log('🎫 ID Token:', idToken)

      cartStore.setLineUserInfo({
        userId,
        displayName,
        pictureUrl,
      })

      console.log('✅ LINE 用戶資訊已保存到購物車')

      localStorage.setItem('lineUserId', userId)
      localStorage.setItem('lineDisplayName', displayName)
    } catch (userError) {
      console.error('❌ 獲取用戶資訊失敗:', userError)
    }
    await new Promise((resolve) => setTimeout(resolve, 300))

    currentStep.value = 'context'

    cartStore.setBrandAndStore(brandId, storeId)
    console.log('🛒 設定購物車上下文:', {
      brandId,
      storeId,
    })

    sessionStorage.removeItem('temp-brandId')
    sessionStorage.removeItem('temp-storeId')
    console.log('🧹 清理臨時參數')

    currentStep.value = 'redirect'
    success.value = true

    const targetRoute = {
      name: 'menu',
      params: {
        brandId,
        storeId,
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

    setTimeout(() => {
      router.replace(targetRoute)
    }, 800)
  } catch (err) {
    console.error('❌ LINE Entry 處理失敗:', err)
    console.error('❌ 錯誤詳細資訊:', {
      message: err.message,
      code: err.code,
      stack: err.stack,
      step: currentStep.value,
      url: window.location.href,
      userAgent: navigator.userAgent,
    })

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

    if (err.message && err.message.includes('參數')) {
      errorMessage +=
        '\n\n💡 這可能是因為：\n• 連結中缺少必要參數\n• 首次登錄時參數被清除\n• 請嘗試重新開啟連結'
    }

    error.value = errorMessage
    isLoading.value = false
  }
}

const retry = () => {
  error.value = null
  success.value = false
  isLoading.value = true
  currentStep.value = 'init'
  processLineEntry()
}

const goHome = () => {
  router.replace({ name: 'landing-home' })
}

onMounted(() => {
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

  processLineEntry()
})

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
.home-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
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

.success-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.success-container p {
  color: #00c851;
  font-size: 16px;
  margin: 0;
}

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
  .home-btn {
    width: 100%;
  }
}
</style>
