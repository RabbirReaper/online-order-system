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
import { useRouter } from 'vue-router'
import { useLineParams } from '@/composables/useLineParams'
import { useCartStore } from '@/stores/cart'
import api from '@/api'
import liff from '@line/liff'

// 組合式 API
const router = useRouter()
const { getCleanParams } = useLineParams()
const cartStore = useCartStore()

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
    const liffId = '2007974797-rvmVYQB0'

    if (!liffId) {
      throw new Error('LIFF ID 未設定，請檢查環境變數 VITE_LIFF_ID')
    }

    await liff.init({ liffId })
    console.log('✅ LIFF 初始化成功')

    // 🔥 重要：在檢查登入狀態前先獲取並保存參數
    // 獲取 URL 參數（不包含 liffId，因為它是固定的）
    let params
    try {
      params = getCleanParams()
      console.log('📋 解析到的參數:', params)

      // 🔥 預先保存參數到 sessionStorage，避免登錄過程中遺失
      if (params.brandId && params.storeId) {
        sessionStorage.setItem('temp-brandId', params.brandId)
        sessionStorage.setItem('temp-storeId', params.storeId)
        console.log('💾 已預先保存參數到 sessionStorage')
      } else {
        console.warn('⚠️ 缺少必要參數 brandId 或 storeId:', params)
      }
    } catch (paramError) {
      console.warn('⚠️ 參數解析失敗，嘗試從 sessionStorage 恢復:', paramError.message)

      // 嘗試從 sessionStorage 恢復參數
      const tempBrandId = sessionStorage.getItem('temp-brandId')
      const tempStoreId = sessionStorage.getItem('temp-storeId')

      if (tempBrandId && tempStoreId) {
        params = {
          brandId: tempBrandId,
          storeId: tempStoreId,
          source: 'recovered',
          timestamp: Date.now(),
        }
        console.log('🔄 從 sessionStorage 恢復參數:', params)
      } else {
        throw new Error('無法獲取必要的店鋪參數，請確認連結正確')
      }
    }

    // 短暫延遲，讓用戶看到載入過程
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Step 2: 檢查登入狀態
    currentStep.value = 'auth'
    console.log('🔐 檢查登入狀態...')

    if (!liff.isLoggedIn()) {
      console.log('❌ 用戶未登入，跳轉到登入頁面')
      console.log('📝 參數已保存，登錄後將自動恢復')
      liff.login()
      return
    }

    console.log('✅ 用戶已登入')
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Step 3: 驗證參數完整性
    currentStep.value = 'params'
    console.log('📋 最終使用的參數:', params)
    console.log('🔧 使用的 LIFF ID:', liffId)

    // 短暫延遲，讓用戶看到載入過程
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Step 4: 設定購物車上下文
    currentStep.value = 'context'
    cartStore.setBrandAndStore(params.brandId, params.storeId)
    console.log('🛒 設定購物車上下文:', {
      brandId: params.brandId,
      storeId: params.storeId,
    })

    // 清理臨時保存的參數
    sessionStorage.removeItem('temp-brandId')
    sessionStorage.removeItem('temp-storeId')
    console.log('🧹 清理臨時參數')

    // Step 5: 準備跳轉
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
    console.error('❌ 錯誤詳細資訊:', {
      message: err.message,
      code: err.code,
      stack: err.stack,
      step: currentStep.value,
      url: window.location.href,
      userAgent: navigator.userAgent,
    })

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

    // 如果是參數相關錯誤，提供更具體的指導
    if (err.message && err.message.includes('參數')) {
      errorMessage +=
        '\n\n💡 這可能是因為：\n• 連結中缺少必要參數\n• 首次登錄時參數被清除\n• 請嘗試重新開啟連結'
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
  .home-btn {
    width: 100%;
  }
}
</style>
