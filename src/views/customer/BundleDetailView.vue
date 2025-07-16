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
                @click="addToCartPoints"
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
    console.log('載入商品詳情:', bundleId.value)

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

const addToCartPoints = async () => {
  // 檢查登入狀態
  if (needsAuth.value && !isLoggedIn.value) {
    goToLogin()
    return
  }

  if (isAddingToCart.value || !hasPointPrice.value) return

  isAddingToCart.value = true

  try {
    // 創建點數兌換套餐購物車項目
    const bundleCartItem = {
      bundleInstance: {
        templateId: bundle.value._id,
        name: `${bundle.value.name} (點數兌換)`,
        description: bundle.value.description,
        pointPrice: {
          original: bundle.value.pointPrice?.original || currentPointPrice.value,
          selling: bundle.value.pointPrice?.selling || currentPointPrice.value,
        },
        bundleItems: bundle.value.bundleItems || [],
        finalPrice: 0, // 點數兌換現金價格為0
        pointCost: currentPointPrice.value,
        voucherValidityDays: bundle.value.voucherValidityDays || 30,
        purchaseType: 'points',
      },
      quantity: 1,
      note: '點數兌換商品',
      subtotal: 0,
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

.member-info {
  border-left: 3px solid #0dcaf0;
}

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
}
</style>
