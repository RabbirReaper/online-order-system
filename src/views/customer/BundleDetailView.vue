<template>
  <div class="bundle-detail-view">
    <div class="container-wrapper">
      <div
        v-if="isLoading"
        class="loading-container d-flex justify-content-center align-items-center"
      >
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else class="detail-container">
        <div
          class="header d-flex align-items-center p-3 position-absolute top-0 start-0 w-100 bg-transparent"
          style="z-index: 10"
        >
          <button
            class="btn btn-sm rounded-circle shadow"
            @click="goBack"
            style="
              background-color: rgba(255, 255, 255, 0.8);
              width: 46px;
              height: 46px;
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            <i class="bi bi-arrow-left fs-3"></i>
          </button>
          <h5 class="ms-3 mb-0 text-white" style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5)">
            {{ menuTypeText }}
          </h5>
        </div>

        <!-- Bundle Image -->
        <div class="image-container" style="height: 240px; overflow: hidden; position: relative">
          <img
            :src="bundleImage"
            :alt="bundle.name"
            class="w-100 h-100"
            style="object-fit: cover"
          />
        </div>

        <!-- Bundle Info -->
        <div class="p-3 border-bottom">
          <h3 class="mb-2">{{ bundle.name }}</h3>

          <!-- 價格顯示 - 根據菜單類型動態顯示 -->
          <div class="price-section mb-3">
            <!-- 現金價格 - 只在現金購買菜單顯示 -->
            <div v-if="shouldShowCashPrice && hasCashPrice" class="price-item">
              <div class="price-current text-danger fw-bold fs-4">
                <span>${{ currentCashPrice }}</span>
                <span v-if="hasOriginalCashPrice" class="original-price ms-2">
                  原價 ${{ bundle.cashPrice.original }}
                </span>
              </div>
              <small class="text-muted">現金購買價格</small>
            </div>

            <!-- 點數價格 - 只在點數兌換菜單顯示 -->
            <div v-if="shouldShowPointPrice && hasPointPrice" class="price-item mt-2">
              <div class="point-price text-primary fw-bold fs-5">
                <span>{{ currentPointPrice }} 點數</span>
                <span v-if="hasOriginalPointPrice" class="original-price ms-2">
                  原價 {{ bundle.pointPrice.original }} 點數
                </span>
              </div>
              <small class="text-muted">點數兌換價格</small>
            </div>
          </div>

          <p class="text-muted fs-5" style="white-space: pre-line">{{ bundle.description }}</p>

          <!-- 有效期限 -->
          <div v-if="bundle.voucherValidityDays" class="validity-section mt-3 p-2 bg-light rounded">
            <i class="bi bi-calendar-check text-success me-2"></i>
            <span class="text-success fw-bold"
              >有效期限：購買後 {{ bundle.voucherValidityDays }} 天內使用</span
            >
          </div>
        </div>

        <!-- Bundle Items -->
        <div class="bundle-items p-3">
          <h5 class="mb-3 fw-bold">購買內容</h5>

          <div v-if="bundle.bundleItems && bundle.bundleItems.length > 0" class="items-list">
            <div
              v-for="(bundleItem, index) in bundle.bundleItems"
              :key="index"
              class="bundle-item-card mb-3"
            >
              <div class="d-flex align-items-center">
                <div class="item-icon me-3">
                  <i class="bi bi-ticket-perforated-fill text-warning fs-4"></i>
                </div>

                <div class="item-info flex-grow-1">
                  <h6 class="mb-1 fw-bold">{{ bundleItem.voucherName }}</h6>
                  <div class="item-meta">
                    <span class="badge bg-warning text-dark"> 兌換券 </span>
                    <span class="ms-2 text-muted">x{{ bundleItem.quantity }}</span>
                  </div>

                  <!-- 兌換商品資訊 -->
                  <div
                    v-if="bundleItem.voucherTemplate?.exchangeDishTemplate"
                    class="exchange-info mt-2 p-2 bg-light rounded"
                  >
                    <small class="text-muted">可兌換：</small>
                    <div class="d-flex align-items-center mt-1">
                      <img
                        v-if="bundleItem.voucherTemplate.exchangeDishTemplate.image?.url"
                        :src="bundleItem.voucherTemplate.exchangeDishTemplate.image.url"
                        :alt="bundleItem.voucherTemplate.exchangeDishTemplate.name"
                        class="exchange-dish-image me-2"
                      />
                      <div>
                        <div class="fw-bold">
                          {{ bundleItem.voucherTemplate.exchangeDishTemplate.name }}
                        </div>
                        <small class="text-muted">{{
                          bundleItem.voucherTemplate.exchangeDishTemplate.description
                        }}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted py-4">
            <i class="bi bi-box-seam fs-1 opacity-50"></i>
            <p class="mt-2">此商品尚未設定內容</p>
          </div>
        </div>

        <!-- Action Buttons - 根據菜單類型和登入狀態動態顯示 -->
        <div class="action-section p-3 bg-light">
          <!-- 未登入且需要登入的提示 -->
          <div
            v-if="needsAuthButNotLoggedIn"
            class="auth-required-notice p-3 bg-warning bg-opacity-10 border border-warning rounded"
          >
            <div class="text-center">
              <i class="bi bi-person-lock text-warning fs-1 mb-2"></i>
              <h6 class="mb-2">需要登入才能購買</h6>
              <p class="text-muted small mb-3">{{ authRequiredMessage }}</p>
              <div class="d-grid gap-2">
                <button class="btn btn-warning" @click="goToLogin">
                  <span class="bi bi-box-arrow-in-right me-2"> 立即登入</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 購買按鈕區域 -->
          <div v-else class="row g-2">
            <!-- 現金購買按鈕 - 只在現金購買菜單顯示 -->
            <div v-if="shouldShowCashPrice" class="col">
              <button
                class="btn btn-outline-primary w-100"
                @click="addToCartCash"
                :disabled="!hasCashPrice || isAddingToCart"
              >
                <i class="bi bi-cash-stack me-2"></i>
                現金購買 ${{ currentCashPrice }}
              </button>
            </div>

            <!-- 點數兌換按鈕 - 只在點數兌換菜單顯示 -->
            <div v-if="shouldShowPointPrice" class="col">
              <button
                class="btn btn-primary w-100"
                @click="confirmPointsRedemption"
                :disabled="!hasPointPrice || isAddingToCart"
              >
                <i class="bi bi-star-fill me-2"></i>
                點數兌換 {{ currentPointPrice }}點
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 點數兌換確認 Modal -->
    <BModal
      v-model="pointsRedemptionModal.show"
      :title="pointsRedemptionModal.title"
      @ok="handleModalOk"
      @cancel="cancelPointsRedemption"
      :ok-disabled="pointsRedemptionModal.isProcessing || pointsRedemptionModal.showSuccess"
      :cancel-disabled="pointsRedemptionModal.isProcessing"
      :ok-title="pointsRedemptionModal.isProcessing ? '處理中...' : '確認兌換'"
      cancel-title="取消"
      size="md"
      centered
      :no-header-close="true"
      :hide-footer="
        pointsRedemptionModal.isProcessing ||
        pointsRedemptionModal.showSuccess ||
        pointsRedemptionModal.showError
      "
      :no-close-on-backdrop="pointsRedemptionModal.isProcessing"
      :no-close-on-esc="pointsRedemptionModal.isProcessing"
    >
      <!-- 確認內容 -->
      <div
        v-if="
          !pointsRedemptionModal.isProcessing &&
          !pointsRedemptionModal.showSuccess &&
          !pointsRedemptionModal.showError
        "
        class="redemption-confirm"
      >
        <div class="text-center mb-4">
          <i class="bi bi-star-fill text-warning fs-1 mb-3"></i>
          <h5 class="mb-3">確認點數兌換</h5>
        </div>

        <div class="redemption-details">
          <div class="row mb-3">
            <div class="col-4">
              <small class="text-muted">商品名稱：</small>
            </div>
            <div class="col-8">
              <strong>{{ bundle.name }}</strong>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-4">
              <small class="text-muted">所需點數：</small>
            </div>
            <div class="col-8">
              <span class="text-primary fw-bold">{{ currentPointPrice }} 點數</span>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-4">
              <small class="text-muted">有效期限：</small>
            </div>
            <div class="col-8">
              <span>購買後 {{ bundle.voucherValidityDays }} 天</span>
            </div>
          </div>

          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            <small>
              兌換後將立即從您的點數餘額中扣除 {{ currentPointPrice }} 點數，
              並發放相應的兌換券到您的帳戶中。
            </small>
          </div>
        </div>
      </div>

      <!-- 處理中動畫 -->
      <div
        v-else-if="pointsRedemptionModal.isProcessing"
        class="processing-animation text-center py-4"
      >
        <div class="spinner-container mb-3">
          <div class="spinner-border text-primary" style="width: 3rem; height: 3rem">
            <span class="visually-hidden">處理中...</span>
          </div>
        </div>
        <h6 class="mb-2">{{ pointsRedemptionModal.processingMessage }}</h6>
        <small class="text-muted">請稍候，正在為您處理兌換...</small>

        <!-- 進度指示器 -->
        <div class="progress mt-3" style="height: 6px">
          <div
            class="progress-bar progress-bar-striped progress-bar-animated bg-primary"
            :style="{ width: pointsRedemptionModal.progressPercent + '%' }"
          ></div>
        </div>
      </div>

      <!-- 錯誤畫面 -->
      <div v-else-if="pointsRedemptionModal.showError" class="error-animation text-center py-4">
        <div class="error-icon mb-3">
          <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 4rem"></i>
        </div>
        <h5 class="text-danger mb-2">兌換失敗</h5>
        <p class="text-muted mb-4">{{ pointsRedemptionModal.errorMessage }}</p>

        <!-- 錯誤後的操作按鈕 -->
        <div class="d-grid gap-2">
          <button class="btn btn-primary" @click="retryRedemption">
            <i class="bi bi-arrow-clockwise me-2"></i>
            重新嘗試
          </button>
          <button class="btn btn-outline-secondary" @click="closeModal">
            <i class="bi bi-x-lg me-2"></i>
            關閉
          </button>
        </div>
      </div>

      <!-- 成功動畫 -->
      <div v-else-if="pointsRedemptionModal.showSuccess" class="success-animation text-center py-4">
        <div class="success-icon mb-3">
          <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem"></i>
        </div>
        <h5 class="text-success mb-2">兌換成功！</h5>
        <p class="text-muted mb-4">您的兌換券已發放到帳戶中，可到「我的票券」查看使用。</p>

        <!-- 成功後的操作按鈕 -->
        <div class="d-grid gap-2">
          <button class="btn btn-primary" @click="goToMyVouchers">
            <i class="bi bi-ticket-perforated me-2"></i>
            查看我的票券
          </button>
          <button class="btn btn-outline-secondary" @click="continueExploring">
            <i class="bi bi-arrow-left me-2"></i>
            繼續瀏覽商品
          </button>
          <button class="btn btn-outline-danger btn-sm mt-2" @click="closeModal">
            <i class="bi bi-x-lg me-1"></i>
            關閉
          </button>
        </div>
      </div>
    </BModal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BModal } from 'bootstrap-vue-next'
import api from '@/api'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/customerAuth'
import { useMenuStore } from '@/stores/menu'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const menuStore = useMenuStore()

const brandId = computed(() => route.params.brandId)
const storeId = computed(() => route.params.storeId)
const bundleId = computed(() => route.params.bundleId)

// 從 route query 獲取菜單類型，如果沒有則使用 menuStore 的狀態
const menuType = computed(() => {
  return route.query.menuType || menuStore.currentMenuType || 'food'
})

const bundle = ref({})
const isLoading = ref(true)
const isAddingToCart = ref(false)

// 點數兌換 Modal 狀態 (修改版)
const pointsRedemptionModal = reactive({
  show: false,
  title: '點數兌換確認',
  isProcessing: false,
  showSuccess: false,
  showError: false,
  progressPercent: 0,
  processingMessage: '正在處理您的兌換請求...',
  errorMessage: '',
})

// 計算屬性 - 根據菜單類型決定顯示什麼
const shouldShowCashPrice = computed(() => {
  return menuType.value === 'cash_coupon' || menuType.value === 'food'
})

const shouldShowPointPrice = computed(() => {
  return menuType.value === 'point_exchange'
})

const menuTypeText = computed(() => {
  const typeMap = {
    food: '商品詳情',
    cash_coupon: '預購券詳情',
    point_exchange: '點數兌換詳情',
  }
  return typeMap[menuType.value] || '商品詳情'
})

// 價格相關計算屬性
const hasCashPrice = computed(() => {
  return (
    bundle.value.cashPrice &&
    (bundle.value.cashPrice.selling > 0 || bundle.value.cashPrice.original > 0)
  )
})

const hasPointPrice = computed(() => {
  return (
    bundle.value.pointPrice &&
    (bundle.value.pointPrice.selling >= 0 || bundle.value.pointPrice.original >= 0)
  )
})

const currentCashPrice = computed(() => {
  if (!bundle.value.cashPrice) return 0
  // 優先使用特價，如果沒有特價則使用原價
  return bundle.value.cashPrice.selling || bundle.value.cashPrice.original || 0
})

const currentPointPrice = computed(() => {
  if (!bundle.value.pointPrice) return 0
  // 優先使用特價，如果沒有特價則使用原價
  return bundle.value.pointPrice.selling !== undefined
    ? bundle.value.pointPrice.selling
    : bundle.value.pointPrice.original || 0
})

const hasOriginalCashPrice = computed(() => {
  return (
    bundle.value.cashPrice &&
    bundle.value.cashPrice.original > 0 &&
    bundle.value.cashPrice.selling > 0 &&
    bundle.value.cashPrice.original > bundle.value.cashPrice.selling
  )
})

const hasOriginalPointPrice = computed(() => {
  return (
    bundle.value.pointPrice &&
    bundle.value.pointPrice.original > 0 &&
    bundle.value.pointPrice.selling !== undefined &&
    bundle.value.pointPrice.original > bundle.value.pointPrice.selling
  )
})

// 登入狀態相關計算屬性
const isLoggedIn = computed(() => {
  return authStore.isLoggedIn
})

// 檢查當前菜單類型是否需要登入
const needsAuth = computed(() => {
  return menuType.value === 'point_exchange' || menuType.value === 'cash_coupon'
})

// 需要登入但未登入
const needsAuthButNotLoggedIn = computed(() => {
  return needsAuth.value && !isLoggedIn.value
})

// 登入要求提示訊息
const authRequiredMessage = computed(() => {
  if (menuType.value === 'point_exchange') {
    return '點數兌換需要會員身份，請先登入您的帳號'
  } else if (menuType.value === 'cash_coupon') {
    return '購買預購券需要會員身份，以便管理您的票券'
  }
  return '此功能需要登入會員'
})

const bundleImage = computed(() => {
  return bundle.value?.image?.url || '/placeholder.jpg'
})

const loadBundleData = async () => {
  try {
    // console.log('載入商品詳情:', bundleId.value)

    // 使用真實 API 調用
    const response = await api.bundle.getBundleById({
      brandId: brandId.value,
      id: bundleId.value,
    })

    if (response.success) {
      bundle.value = response.bundle
    } else {
      throw new Error('無法載入商品詳情')
    }
  } catch (error) {
    console.error('無法載入商品詳情:', error)
    alert('載入商品詳情失敗，請稍後再試')
  } finally {
    isLoading.value = false
  }
}

const goBack = () => {
  // 返回時確保菜單類型狀態正確
  if (menuType.value !== menuStore.currentMenuType) {
    menuStore.setMenuType(menuType.value)
  }
  router.go(-1)
}

// 跳轉到登入頁面
const goToLogin = () => {
  // 保存當前頁面路徑，登入後可以回來
  const currentPath = route.fullPath
  router.push({
    name: 'customer-login',
    query: { redirect: currentPath },
  })
}

const addToCartCash = async () => {
  // 檢查登入狀態
  if (needsAuth.value && !isLoggedIn.value) {
    goToLogin()
    return
  }

  if (isAddingToCart.value || !hasCashPrice.value) return

  isAddingToCart.value = true

  try {
    // 創建符合 cartStore.addItem 期望格式的套餐購物車項目
    const bundleCartItem = {
      bundleInstance: {
        templateId: bundle.value._id, // 對應後端的 templateId
        name: bundle.value.name,
        description: bundle.value.description,
        cashPrice: {
          original: bundle.value.cashPrice?.original || currentCashPrice.value,
          selling: bundle.value.cashPrice?.selling || currentCashPrice.value,
        },
        bundleItems: bundle.value.bundleItems || [],
        finalPrice: currentCashPrice.value,
        voucherValidityDays: bundle.value.voucherValidityDays || 30,
        purchaseType: 'cash', // 標記購買類型
      },
      quantity: 1,
      note: '',
      subtotal: currentCashPrice.value,
    }

    cartStore.addItem(bundleCartItem)

    // 返回菜單頁面，確保菜單類型正確
    if (menuType.value !== menuStore.currentMenuType) {
      menuStore.setMenuType(menuType.value)
    }

    router.push({
      name: 'menu',
      params: {
        brandId: brandId.value,
        storeId: storeId.value,
      },
    })
  } catch (error) {
    console.error('加入購物車失敗:', error)
    alert('加入購物車失敗，請稍後再試')
  } finally {
    isAddingToCart.value = false
  }
}

// 確認點數兌換 - 顯示 Modal
const confirmPointsRedemption = () => {
  // 檢查登入狀態
  if (needsAuth.value && !isLoggedIn.value) {
    goToLogin()
    return
  }

  if (!hasPointPrice.value) return

  // 重置 modal 狀態
  pointsRedemptionModal.isProcessing = false
  pointsRedemptionModal.showSuccess = false
  pointsRedemptionModal.showError = false
  pointsRedemptionModal.progressPercent = 0
  pointsRedemptionModal.errorMessage = ''
  pointsRedemptionModal.title = '點數兌換確認'
  pointsRedemptionModal.show = true
}

// 處理Modal確認按鈕點擊 (新增)
const handleModalOk = (event) => {
  // 阻止modal的預設關閉行為
  event.preventDefault()

  // 只有在確認狀態時才執行兌換
  if (
    !pointsRedemptionModal.isProcessing &&
    !pointsRedemptionModal.showSuccess &&
    !pointsRedemptionModal.showError
  ) {
    processPointsRedemption()
  }
}

// 處理點數兌換 (修改版)
const processPointsRedemption = async () => {
  pointsRedemptionModal.isProcessing = true
  pointsRedemptionModal.title = '正在處理兌換'
  pointsRedemptionModal.progressPercent = 10
  pointsRedemptionModal.processingMessage = '正在驗證您的點數餘額...'

  try {
    // 調用點數兌換 API
    // console.log('開始點數兌換:', {
    //   brandId: brandId.value,
    //   bundleId: bundleId.value,
    //   pointsRequired: currentPointPrice.value,
    // })

    // 模擬處理步驟與進度更新
    await new Promise((resolve) => setTimeout(resolve, 1000))
    pointsRedemptionModal.progressPercent = 40
    pointsRedemptionModal.processingMessage = '正在生成您的兌換券...'

    const response = await api.bundle.redeemBundleWithPoints({
      brandId: brandId.value,
      bundleId: bundleId.value,
    })

    await new Promise((resolve) => setTimeout(resolve, 800))
    pointsRedemptionModal.progressPercent = 80
    pointsRedemptionModal.processingMessage = '兌換完成，正在更新您的帳戶...'

    if (response.success) {
      // console.log('點數兌換成功:', response)

      // 完成進度條
      pointsRedemptionModal.progressPercent = 100
      await new Promise((resolve) => setTimeout(resolve, 500))

      // 顯示成功畫面
      pointsRedemptionModal.isProcessing = false
      pointsRedemptionModal.showSuccess = true
      pointsRedemptionModal.title = '兌換完成'
    } else {
      throw new Error(response.message || '兌換失敗')
    }
  } catch (error) {
    console.error('點數兌換失敗:', error)

    // 顯示錯誤但不關閉modal
    pointsRedemptionModal.isProcessing = false
    pointsRedemptionModal.showError = true
    pointsRedemptionModal.title = '兌換失敗'

    // 設定錯誤訊息
    let errorMessage = '兌換失敗，請稍後再試'
    if (error.response) {
      errorMessage = error.response.data?.message || `錯誤: ${error.response.status}`
    } else if (error.message) {
      errorMessage = error.message
    }

    pointsRedemptionModal.errorMessage = errorMessage
  }
}

// 取消點數兌換
const cancelPointsRedemption = (event) => {
  // 只有在非處理中狀態才能取消
  if (!pointsRedemptionModal.isProcessing) {
    closeModal()
  } else {
    // 如果正在處理中，阻止關閉
    if (event) {
      event.preventDefault()
    }
  }
}

// 關閉modal (新增)
const closeModal = () => {
  pointsRedemptionModal.show = false
  pointsRedemptionModal.isProcessing = false
  pointsRedemptionModal.showSuccess = false
  pointsRedemptionModal.showError = false
  pointsRedemptionModal.progressPercent = 0
  pointsRedemptionModal.errorMessage = ''
}

// 重試兌換 (新增，用於錯誤狀態)
const retryRedemption = () => {
  pointsRedemptionModal.showError = false
  pointsRedemptionModal.errorMessage = ''
  pointsRedemptionModal.title = '點數兌換確認'
}

// 成功後跳轉到我的票券頁面 (修改版)
const goToMyVouchers = () => {
  closeModal()

  // 跳轉到我的票券頁面
  router.push({
    name: 'member-coupons',
  })
}

// 繼續瀏覽商品 (修改版)
const continueExploring = () => {
  closeModal()

  // 返回菜單頁面，確保菜單類型正確
  if (menuType.value !== menuStore.currentMenuType) {
    menuStore.setMenuType(menuType.value)
  }

  router.push({
    name: 'menu',
    params: {
      brandId: brandId.value,
      storeId: storeId.value,
    },
  })
}

onMounted(async () => {
  // 設置 authStore 的 brandId（如果需要的話）
  if (brandId.value) {
    authStore.setBrandId(brandId.value)

    // 檢查並更新登入狀態
    try {
      await authStore.checkAuthStatus()
    } catch (error) {
      console.error('檢查登入狀態失敗:', error)
    }
  }

  await loadBundleData()
})
</script>

<style scoped>
.bundle-detail-view {
  min-height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
}

.container-wrapper {
  max-width: 736px;
  width: 100%;
  background-color: white;
  min-height: 100vh;
  position: relative;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
}

.loading-container {
  min-height: 100vh;
}

.detail-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.bundle-type-overlay {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
}

.price-section {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
}

.price-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.price-current {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.point-price {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.point-price::before {
  content: '★';
  color: #ffc107;
}

.original-price {
  font-size: 0.85rem;
  text-decoration: line-through;
  color: #6c757d;
  font-weight: 500;
}

.validity-section {
  border-left: 4px solid #198754;
}

.bundle-items {
  flex-grow: 1;
}

.bundle-item-card {
  background-color: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.bundle-item-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 50%;
}

.item-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.exchange-info {
  border-left: 3px solid #ffc107;
}

.exchange-dish-image {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
}

.action-section {
  border-top: 1px solid #e9ecef;
  position: sticky;
  bottom: 0;
  background-color: #f8f9fa !important;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-required-notice {
  border-style: dashed !important;
}

.auth-required-notice i {
  display: block;
}

/* Modal 相關樣式 */
.redemption-confirm {
  max-width: 400px;
  margin: 0 auto;
}

.redemption-details {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.processing-animation {
  min-height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.spinner-container {
  position: relative;
}

.success-animation {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.success-icon {
  animation: successBounce 0.6s ease-out;
}

.success-animation .d-grid {
  max-width: 300px;
  margin: 0 auto;
}

/* 新增：錯誤動畫樣式 */
.error-animation {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.error-icon {
  animation: errorShake 0.6s ease-out;
}

.error-animation .d-grid {
  max-width: 300px;
  margin: 0 auto;
}

/* 進度條樣式增強 */
.progress {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  transition: width 0.3s ease;
}

/* 動畫效果 */
@keyframes successBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes errorShake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-5px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(5px);
  }
}

@keyframes pulse {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.6;
  }
}

/* 響應式調整 */
@media (max-width: 576px) {
  .container-wrapper {
    max-width: 100%;
  }

  .price-section {
    padding: 0.75rem;
  }

  .bundle-item-card {
    padding: 0.75rem;
  }

  .item-icon {
    width: 40px;
    height: 40px;
  }

  .exchange-dish-image {
    width: 32px;
    height: 32px;
  }

  .auth-required-notice {
    padding: 1rem !important;
  }

  .redemption-confirm,
  .success-animation .d-grid,
  .error-animation .d-grid {
    max-width: none;
  }

  .processing-animation,
  .success-animation,
  .error-animation {
    min-height: 220px;
  }
}
</style>
