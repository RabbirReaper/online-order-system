<template>
  <div class="cart-page">
    <div class="container-wrapper">
      <!-- Header -->
      <div class="cart-header p-3 d-flex align-items-center bg-white shadow-sm">
        <button class="btn btn-link text-dark p-0" @click="goBack">
          <i class="bi bi-arrow-left fs-4"></i>
        </button>
        <h5 class="mb-0 mx-auto">購物車</h5>
      </div>

      <div class="divider"></div>

      <!-- Empty Cart Message -->
      <div v-if="cartStore.items.length === 0" class="text-center p-5 text-muted">
        <i class="bi bi-cart-x fs-1"></i>
        <p class="mt-3">購物車是空的</p>
        <button class="btn btn-primary mt-3" @click="goBack">返回菜單</button>
      </div>

      <!-- Cart Content -->
      <div v-else class="cart-content p-3">
        <!-- Order Items -->
        <div class="order-items mb-4">
          <h6 class="mb-3 fw-bold">訂單內容</h6>
          <CartItem
            v-for="(item, index) in cartStore.items"
            :key="index"
            :index="index"
          />
        </div>

        <div class="divider"></div>

        <!-- Order Notes -->
        <div class="order-notes mb-4">
          <h6 class="mb-3 fw-bold">訂單備註</h6>
          <textarea
            class="form-control"
            rows="2"
            placeholder="有特殊需求嗎？請告訴我們"
            v-model="cartStore.orderRemarks"
          ></textarea>
        </div>

        <div class="divider"></div>

        <!-- 兌換券區塊 -->
        <div class="voucher-section mb-4" v-if="cartStore.matchedVouchers.length > 0">
          <h6 class="mb-3 fw-bold">
            <i class="bi bi-ticket-perforated me-2 text-warning"></i>
            可用兌換券
          </h6>
          <div class="voucher-cards">
            <VoucherCard
              v-for="voucher in cartStore.matchedVouchers"
              :key="voucher._id"
              :voucherId="voucher._id"
            />
          </div>
        </div>

        <!-- 折價券區塊 -->
        <div class="coupon-section mb-4" v-if="cartStore.usableCoupons.length > 0">
          <h6 class="mb-3 fw-bold">
            <i class="bi bi-percent me-2 text-primary"></i>
            可用折價券
          </h6>
          <div class="coupon-cards">
            <CouponCard
              v-for="coupon in cartStore.usableCoupons"
              :key="coupon._id"
              :couponId="coupon._id"
            />
          </div>
        </div>

        <!-- 如果用戶已登入但沒有可用券的提示 -->
        <div
          v-if="
            authStore.isLoggedIn && cartStore.matchedVouchers.length === 0 && cartStore.usableCoupons.length === 0
          "
          class="no-coupons mb-4"
        >
          <div class="text-center py-3 text-muted">
            <i class="bi bi-gift fs-4"></i>
            <p class="mt-2">目前沒有可用的優惠券</p>
            <small>購買套餐或參與活動可獲得優惠券</small>
          </div>
        </div>

        <!-- 如果用戶未登入的提示 -->
        <div v-if="!authStore.isLoggedIn" class="login-prompt mb-4">
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            <span>登入會員享有兌換券和折價券優惠！</span>
            <button class="btn btn-sm btn-outline-primary ms-2" @click="goToLogin">立即登入</button>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Order Type Selection -->
        <OrderTypeSelector />

        <div class="divider"></div>

        <!-- Customer Information -->
        <CustomerInfoForm ref="customerInfoFormRef" />

        <div class="divider"></div>

        <!-- Order Total -->
        <div class="order-total mb-4">
          <div class="d-flex justify-content-between mb-2">
            <span>小計</span>
            <span>${{ cartStore.subtotal }}</span>
          </div>

          <!-- 逐行顯示兌換券折扣 -->
          <div
            v-for="(voucher, voucherIndex) in cartStore.usedVouchers"
            :key="`voucher-${voucher.voucherId}-${voucherIndex}`"
            class="d-flex justify-content-between mb-2 text-success"
          >
            <span>
              <i class="bi bi-ticket-perforated me-1"></i>
              {{ voucher.dishName }} 兌換券
            </span>
            <span>-${{ voucher.savedAmount }}</span>
          </div>

          <!-- 逐行顯示折價券折扣 -->
          <div
            v-for="(coupon, couponIndex) in cartStore.appliedCoupons"
            :key="`coupon-${coupon.refId}-${couponIndex}`"
            class="d-flex justify-content-between mb-2 text-primary"
          >
            <span>
              <i class="bi bi-percent me-1"></i>
              折價券優惠
            </span>
            <span>-${{ coupon.amount }}</span>
          </div>

          <div class="d-flex justify-content-between mb-2" v-if="(cartStore.deliveryInfo?.deliveryFee || 0) > 0">
            <span>外送費</span>
            <span>${{ cartStore.deliveryInfo?.deliveryFee || 0 }}</span>
          </div>

          <div class="d-flex justify-content-between fw-bold fs-5">
            <span>總計</span>
            <span>${{ cartStore.total }}</span>
          </div>

          <!-- 點數預覽 -->
          <div
            v-if="estimatedPoints && !estimatedPoints.insufficientAmount"
            class="points-preview mt-3 pt-3 border-top"
          >
            <!-- 顯示可獲得的點數 -->
            <div class="d-flex align-items-center">
              <i class="bi bi-star-fill text-warning me-2"></i>
              <span class="text-muted">本次消費預計可獲得</span>
              <span class="fw-bold text-warning ms-2 fs-5">{{ estimatedPoints.points }}</span>
              <span class="text-muted ms-1">點</span>
            </div>
          </div>

          <!-- 未登入用戶的點數提示 -->
          <div
            v-if="!authStore.isLoggedIn && cartStore.activePointRules.length > 0 && cartStore.total > 0"
            class="points-login-hint border-top"
          >
            <div class="d-flex align-items-center">
              <i class="bi bi-star text-warning"></i>
              <small>登入會員享有點數回饋！</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message Display -->
      <div
        v-if="errorMsg"
        class="error-message-container position-fixed w-100 p-3"
        style="
          bottom: 80px;
          max-width: 540px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1050;
        "
      >
        <div class="alert alert-danger alert-dismissible fade show mb-0" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          {{ errorMsg }}
          <button type="button" class="btn-close" aria-label="Close" @click="clearError"></button>
        </div>
      </div>

      <!-- Success Message Display -->
      <div
        v-if="successMsg"
        class="success-message-container position-fixed w-100 p-3"
        style="
          bottom: 80px;
          max-width: 540px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1050;
        "
      >
        <div class="alert alert-success alert-dismissible fade show mb-0" role="alert">
          <i class="bi bi-check-circle-fill me-2"></i>
          {{ successMsg }}
          <button type="button" class="btn-close" aria-label="Close" @click="clearSuccess"></button>
        </div>
      </div>

      <!-- Fixed Bottom Button -->
      <div
        v-if="cartStore.items.length > 0"
        class="checkout-button position-fixed bottom-0 start-50 translate-middle-x w-100 bg-white p-3 shadow-lg d-flex justify-content-center"
        style="max-width: 540px"
      >
        <div class="container-button" style="max-width: 540px">
          <button class="btn w-100 py-2 checkout-btn" @click="checkout" :disabled="!isFormValid">
            前往結帳   ${{ cartStore.total }}
          </button>
        </div>
      </div>

      <!-- Modal Components -->
      <!-- 結帳確認框 -->
      <BModal
        v-model:show="showConfirmModal"
        :title="isRedirectingToPayment ? '正在跳轉付款頁面' : '確認訂單'"
        centered
        @ok="submitOrder"
        @cancel="showConfirmModal = false"
        :no-close-on-backdrop="isSubmitting || isRedirectingToPayment"
        :no-close-on-esc="isSubmitting || isRedirectingToPayment"
        :hide-header-close="isSubmitting || isRedirectingToPayment"
      >
        <!-- 跳轉到付款頁面的提示 -->
        <div v-if="isRedirectingToPayment" class="text-center py-4">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <h5 class="mb-3">訂單已建立成功！</h5>
          <p class="text-muted mb-2">正在為您跳轉到付款頁面...</p>
          <p class="text-muted small">請稍候，不要關閉此頁面</p>
        </div>

        <!-- 一般訂單確認內容 -->
        <div v-else>
          <p>請確認您的訂單資訊</p>
          <!-- 訂單摘要 -->
          <div class="order-summary">
            <h6>訂單項目：</h6>
            <ul class="list-unstyled">
              <li v-for="item in cartStore.items" :key="item.key" class="mb-1">
                {{ item.dishInstance?.name || item.bundleInstance?.name }} x{{ item.quantity }}
              </li>
            </ul>

            <div v-if="cartStore.usedVouchers.length > 0">
              <h6 class="text-success">使用的兌換券：</h6>
              <ul class="list-unstyled text-success">
                <li v-for="voucher in cartStore.usedVouchers" :key="voucher.voucherId">
                  {{ voucher.dishName }} (省下 ${{ voucher.savedAmount }})
                </li>
              </ul>
            </div>

            <div v-if="cartStore.appliedCoupons.length > 0">
              <h6 class="text-primary">使用的折價券：</h6>
              <ul class="list-unstyled text-primary">
                <li v-for="coupon in cartStore.appliedCoupons" :key="coupon.refId">
                  折價券優惠 (折抵 ${{ coupon.amount }})
                </li>
              </ul>
            </div>

            <hr />
            <div class="d-flex justify-content-between fw-bold">
              <span>總計：</span>
              <span>${{ cartStore.total }}</span>
            </div>
          </div>
        </div>

        <template #footer>
          <!-- 跳轉中不顯示按鈕 -->
          <div v-if="isRedirectingToPayment" class="w-100 text-center">
            <small class="text-muted">系統將自動跳轉...</small>
          </div>

          <!-- 一般確認按鈕 -->
          <template v-else>
            <button
              type="button"
              class="btn btn-secondary"
              @click="showConfirmModal = false"
              :disabled="isSubmitting"
            >
              返回修改
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="submitOrder"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-container">
                <i class="bi bi-arrow-repeat spinning-icon"></i>
                送出中...
              </span>
              <span v-else>確認送出</span>
            </button>
          </template>
        </template>
      </BModal>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BModal } from 'bootstrap-vue-next'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/customerAuth'
import CartItem from '@/components/customer/cart/CartItem.vue'
import OrderTypeSelector from '@/components/customer/cart/OrderTypeSelector.vue'
import CustomerInfoForm from '@/components/customer/cart/CustomerInfoForm.vue'
import VoucherCard from '@/components/customer/cart/VoucherCard.vue'
import CouponCard from '@/components/customer/cart/CouponCard.vue'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

// 訊息狀態
const errorMsg = ref('')
const successMsg = ref('')

// Modal 狀態
const showConfirmModal = ref(false)

// 提交狀態
const isSubmitting = ref(false)
const isRedirectingToPayment = ref(false)

// 計算屬性
const isFormValid = computed(() => {
  // 根據訂單類型從 store 檢查驗證
  if (cartStore.orderType === 'dine_in') {
    return cartStore.dineInInfo?.tableNumber && cartStore.dineInInfo.tableNumber.trim() !== ''
  }

  const name = cartStore.customerInfo?.name || ''
  const phone = cartStore.customerInfo?.phone || ''

  if (!name.trim() || !phone.trim()) {
    return false
  }

  if (cartStore.orderType === 'delivery') {
    if (!cartStore.deliveryInfo?.address || !cartStore.deliveryInfo.address.trim()) {
      return false
    }
  }

  if (cartStore.pickupInfo?.pickupTime === 'scheduled') {
    if (!cartStore.pickupInfo?.scheduledTime || !cartStore.pickupInfo.scheduledTime.trim()) {
      return false
    }
  }

  if (!cartStore.paymentType || cartStore.paymentType === '') return false

  return true
})

// 計算預估獲得的點數
const estimatedPoints = computed(() => {
  // 只有登入用戶才顯示點數預覽
  if (!authStore.isLoggedIn || cartStore.activePointRules.length === 0) {
    return null
  }

  // 找到消費金額類型的規則
  const purchaseRule = cartStore.activePointRules.find((rule) => rule.type === 'purchase_amount')

  if (!purchaseRule) {
    return null
  }

  // 計算實際付款金額（扣除優惠後）
  const finalAmount = cartStore.total

  // 檢查是否達到最低消費金額
  if (finalAmount < purchaseRule.minimumAmount) {
    return {
      points: 0,
      rule: purchaseRule,
      insufficientAmount: true,
      shortfall: purchaseRule.minimumAmount - finalAmount,
    }
  }

  // 計算點數（向下取整）
  const points = Math.floor(finalAmount / purchaseRule.conversionRate)

  return {
    points,
    rule: purchaseRule,
    insufficientAmount: false,
  }
})

// 方法
const clearError = () => {
  errorMsg.value = ''
}

const clearSuccess = () => {
  successMsg.value = ''
}

const showError = (message) => {
  errorMsg.value = message
  setTimeout(() => {
    if (errorMsg.value === message) {
      clearError()
    }
  }, 5000)
}

const goBack = () => {
  router.go(-1)
}

const goToLogin = () => {
  const currentPath = router.currentRoute.value.fullPath
  router.push({
    path: '/auth/login',
    query: { redirect: currentPath },
  })
}

const checkout = () => {
  if (!isFormValid.value) {
    showError('請填寫所有必要資訊')
    return
  }

  clearError()
  showConfirmModal.value = true
}

// 提交訂單
const submitOrder = async () => {
  // 防抖機制：如果正在提交中，直接返回
  if (isSubmitting.value) {
    return
  }

  try {
    isSubmitting.value = true
    clearError()

    // 所有資料都已經在 store 中，直接提交訂單
    const result = await cartStore.submitOrder()

    if (result.success) {
      // 如果有付款表單，表示是線上付款，需要跳轉到 NewebPay
      if (result.payment && result.payment.formData) {
        console.log('💳 線上付款：準備跳轉到 NewebPay')

        // 設定跳轉狀態，Modal 會自動顯示跳轉提示
        isRedirectingToPayment.value = true

        // 延遲提交表單，讓用戶看到跳轉提示
        setTimeout(() => {
          // 創建並提交表單到 NewebPay
          const form = document.createElement('form')
          form.method = 'POST'
          form.action = result.payment.apiUrl

          // 添加表單欄位
          Object.keys(result.payment.formData).forEach((key) => {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = result.payment.formData[key]
            form.appendChild(input)
          })

          document.body.appendChild(form)
          console.log('🔄 提交表單到:', result.payment.apiUrl)
          form.submit()
        }, 1000) // 延遲 1 秒，讓用戶看到跳轉提示

        // 表單提交後不需要跳轉，因為會自動跳到 NewebPay
        return
      }

      // 現場付款：關閉 Modal 並跳轉到訂單詳情頁
      showConfirmModal.value = false
      router.push({
        name: 'order-confirm',
        params: {
          brandId: cartStore.currentBrand,
          storeId: cartStore.currentStore,
          orderId: result.orderId,
        },
      })
    } else {
      console.log('訂單提交失敗:', result)
      throw new Error(result.error || '訂單提交失敗')
    }
  } catch (error) {
    console.error('提交訂單失敗:', error)

    // 重置狀態並關閉 Modal
    showConfirmModal.value = false
    isRedirectingToPayment.value = false

    let errorMessage = '訂單提交失敗，請稍後再試'

    if (error.errors) {
      const errorMessages = Object.values(error.errors).join('\n')
      errorMessage = `請檢查以下資訊：\n${errorMessages}`
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error.message) {
      errorMessage = error.message
    }

    showError(errorMessage)
  } finally {
    // 重置提交狀態（注意：跳轉狀態在表單提交後仍保持，直到頁面跳轉）
    isSubmitting.value = false
  }
}

// 監聽用戶登入狀態變化
watch(
  () => authStore.isLoggedIn,
  async (newValue) => {
    if (newValue) {
      // 登入後從 store 獲取券和點數資料
      await cartStore.fetchUserVouchers(authStore.currentBrandId)
      await cartStore.fetchUserCoupons(authStore.currentBrandId)
    } else {
      // 登出時清空 store 中的券資料
      cartStore.clearPromotions()
    }
  },
)

// 監聽品牌變化，重新獲取點數規則和店鋪資訊
watch(
  () => authStore.currentBrandId,
  async (newValue) => {
    if (newValue && cartStore.currentStore) {
      await cartStore.fetchActivePointRules(newValue)
      await cartStore.fetchStoreInfo(newValue, cartStore.currentStore)
    }
  },
)

// 生命週期
onMounted(async () => {
  window.scrollTo(0, 0)

  // ✅ 檢查是否從付款失敗返回，並恢復購物車
  const urlParams = new URLSearchParams(window.location.search)
  const paymentFailed = urlParams.get('payment_failed') === 'true'
  const paymentError = urlParams.get('payment_error') === 'true'
  const shouldRestore = urlParams.get('restore') === 'true'

  if ((paymentFailed || paymentError) && shouldRestore) {
    // 靜默恢復購物車（用戶不需要知道恢復這件事）
    const restored = cartStore.restorePendingCart()

    if (restored) {
      // ✅ 恢復成功：只提示付款失敗，不提及恢復
      if (paymentFailed) {
        showError('付款未完成。您可以修改訂單內容或重新提交。')
      } else if (paymentError) {
        showError('付款處理發生錯誤，請稍後再試或選擇其他付款方式。')
      }
    } else {
      // ❌ 恢復失敗（資料已過期或不存在）：才告知用戶需要重新選購
      if (paymentFailed || paymentError) {
        showError('付款未完成。您的購物車已清空，請重新選購商品。')
      }
    }
  }

  // 初始化預約時間（如果還沒有設定）
  if (!cartStore.pickupInfo?.scheduledTime) {
    const date = new Date()
    date.setMinutes(date.getMinutes() + 30)
    cartStore.setPickupInfo({
      ...cartStore.pickupInfo,
      scheduledTime: date.toISOString().slice(0, 16)
    })
  }

  // 如果用戶已登入，獲取券資料
  if (authStore.isLoggedIn && authStore.currentBrandId) {
    await cartStore.fetchUserVouchers(authStore.currentBrandId)
    await cartStore.fetchUserCoupons(authStore.currentBrandId)
  }

  // 獲取點數規則（不論是否登入都獲取，用於顯示提示）
  if (authStore.currentBrandId) {
    await cartStore.fetchActivePointRules(authStore.currentBrandId)
  }

  // 獲取店家資訊
  if (cartStore.currentBrand && cartStore.currentStore) {
    await cartStore.fetchStoreInfo(cartStore.currentBrand, cartStore.currentStore)
  }
})
</script>

<style scoped>
.cart-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 80px;
  display: flex;
  justify-content: center;
}

.container-wrapper {
  max-width: 540px;
  width: 100%;
  background-color: white;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  min-height: 100vh;
  position: relative;
}

.cart-header {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.divider {
  height: 8px;
  background-color: #f0f0f0;
  margin-bottom: 15px;
  width: 100%;
}

.checkout-btn {
  border-radius: 8px;
  background-color: #7a5b0c;
  color: white;
  transition: background-color 0.3s;
}

.checkout-btn:hover:not(:disabled) {
  background-color: #4a7dde;
}

.checkout-btn:disabled {
  background-color: #b9cdf2;
  color: #ffffff;
}

.container-button {
  width: 100%;
  padding: 0 15px;
}

.error-message-container,
.success-message-container {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.no-coupons {
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}

.login-prompt .alert {
  border-radius: 8px;
}

input[type='datetime-local'] {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.points-preview {
  background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
}

.points-preview i.bi-star-fill {
  font-size: 1.2rem;
}

.points-login-hint {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
  margin-top: 12px;
}

.points-login-hint i.bi-star {
  font-size: 1.1rem;
}

/* 旋轉動畫 */
.spinning-icon {
  display: inline-block;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner-container {
  display: inline-flex;
  align-items: center;
}

.btn-primary:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

@media (max-width: 576px) {
  .container-wrapper {
    max-width: 100%;
  }

  .error-message-container,
  .success-message-container {
    left: 0 !important;
    right: 0;
    transform: none !important;
    max-width: 100% !important;
  }
}
</style>
