<template>
  <div class="order-confirm-view bg-light">
    <div class="container-wrapper">
      <div class="header bg-white p-3 shadow-sm">
        <div class="text-center">
          <h5 class="mb-0">訂單確認</h5>
        </div>
      </div>

      <div class="container py-4" v-if="!isLoading">
        <!-- 訂單成功卡片 -->
        <div class="order-success-card bg-white rounded-3 shadow-sm p-4 mb-4 text-center">
          <div
            class="success-icon rounded-circle bg-success d-inline-flex align-items-center justify-content-center mb-3"
          >
            <i class="bi bi-check-lg text-white fs-4"></i>
          </div>
          <h4 class="mb-3">訂單已成功送出！</h4>

          <!-- 優化的訂單編號顯示 -->
          <div class="order-number-section mb-2">
            <p class="text-muted mb-2 fs-6">您的訂單編號</p>
            <div
              class="order-number-display bg-light border rounded-3 p-3 mx-auto"
              style="max-width: 300px"
            >
              <span class="badge bg-primary fs-1 px-3 py-2">
                {{ orderDetails.sequence || 'TEMP' }}
              </span>
            </div>
            <small class="text-muted d-block mt-2">
              <i class="bi bi-info-circle me-1"></i>請保存此編號以便查詢訂單狀態
            </small>
          </div>
        </div>

        <!-- 進度條 -->
        <div class="progress-container bg-white rounded-3 shadow-sm p-4 mb-4">
          <div class="progress-header text-center mb-4">
            <h5 class="mb-0">訂單進度</h5>
          </div>

          <!-- 訂單已取消提示 -->
          <div v-if="orderDetails.status === 'cancelled'" class="cancelled-notice text-center py-4">
            <div class="cancelled-icon mb-3">
              <i class="bi bi-x-circle-fill text-danger fs-1"></i>
            </div>
            <h5 class="text-danger mb-2">訂單已取消</h5>
            <p class="text-muted mb-0">此訂單已被取消</p>
          </div>

          <!-- 正常進度條 -->
          <div v-else class="progress-steps">
            <!-- 進度線 -->
            <div class="progress-line">
              <div
                class="progress-fill"
                :style="{
                  width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                }"
              ></div>
            </div>

            <!-- 步驟項目 -->
            <div class="steps-wrapper">
              <div
                v-for="step in steps"
                :key="step.id"
                :class="['step-item', getStepStatus(step.id)]"
              >
                <div class="step-circle">
                  <span class="step-icon">
                    {{ getStepStatus(step.id) === 'completed' ? '✓' : step.icon }}
                  </span>
                </div>
                <div class="step-label">
                  <span class="step-title">{{ step.title }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 訂單詳情卡片 -->
        <div class="order-details-card bg-white rounded-3 shadow-sm p-4 mb-4">
          <h5 class="mb-3 border-bottom pb-2">訂單詳情</h5>

          <div class="order-info">
            <div class="row mb-2">
              <div class="col-5 text-muted">訂單時間：</div>
              <div class="col-7">{{ formatDateTime(orderDetails.createdAt) }}</div>
            </div>

            <div class="row mb-2">
              <div class="col-5 text-muted">取餐方式：</div>
              <div class="col-7">{{ formatOrderType(orderDetails.orderType) }}</div>
            </div>

            <div
              class="row mb-2"
              v-if="orderDetails.orderType === 'dine_in' && orderDetails.dineInInfo?.tableNumber"
            >
              <div class="col-5 text-muted">桌號：</div>
              <div class="col-7">{{ orderDetails.dineInInfo.tableNumber }}</div>
            </div>

            <div
              class="row mb-2"
              v-if="orderDetails.orderType === 'delivery' && orderDetails.deliveryInfo?.address"
            >
              <div class="col-5 text-muted">外送地址：</div>
              <div class="col-7">{{ orderDetails.deliveryInfo.address }}</div>
            </div>

            <div
              class="row mb-2"
              v-if="orderDetails.orderType === 'takeout' && orderDetails.estimatedPickupTime"
            >
              <div class="col-5 text-muted">取餐時間：</div>
              <div class="col-7">{{ formatPickupTime(orderDetails.estimatedPickupTime) }}</div>
            </div>

            <div class="row mb-2">
              <div class="col-5 text-muted">付款方式：</div>
              <div class="col-7">{{ formatPaymentMethod(orderDetails.paymentMethod) }}</div>
            </div>

            <div class="row mb-2" v-if="orderDetails.customerInfo?.name">
              <div class="col-5 text-muted">聯絡人：</div>
              <div class="col-7">{{ orderDetails.customerInfo.name }}</div>
            </div>

            <div class="row mb-2" v-if="orderDetails.customerInfo?.phone">
              <div class="col-5 text-muted">聯絡電話：</div>
              <div class="col-7">{{ orderDetails.customerInfo.phone }}</div>
            </div>

            <div class="row mb-2" v-if="orderDetails.notes">
              <div class="col-5 text-muted">訂單備註：</div>
              <div class="col-7">{{ orderDetails.notes }}</div>
            </div>
          </div>
        </div>

        <!-- 訂購項目卡片 -->
        <div class="order-items-card bg-white rounded-3 shadow-sm p-4 mb-4">
          <h5 class="mb-3 border-bottom pb-2">訂購項目</h5>

          <div
            v-for="(item, index) in orderDetails.items"
            :key="index"
            class="order-item mb-3 pb-3"
          >
            <div class="d-flex justify-content-between mb-2">
              <div class="flex-grow-1">
                <!-- 餐點名稱 -->
                <h6 class="mb-1">{{ getItemName(item) }}</h6>

                <!-- 餐點選項 - 只對餐點顯示 -->
                <div
                  v-if="item.itemType === 'dish' && item.dishInstance?.options?.length"
                  class="text-muted small mb-1"
                >
                  <div v-for="(option, optIdx) in item.dishInstance.options" :key="optIdx">
                    {{ option.optionCategoryName }}:
                    {{
                      option.selections
                        .map((s) => s.name + (s.price > 0 ? ` (+$${s.price})` : ''))
                        .join(', ')
                    }}
                  </div>
                </div>

                <!-- Bundle 內容 - 只對Bundle顯示 -->
                <div
                  v-if="item.itemType === 'bundle' && item.bundleInstance?.bundleItems?.length"
                  class="text-muted small mb-1"
                >
                  <div class="fw-semibold mb-1">套餐內容：</div>
                  <div
                    v-for="(bundleItem, bundleIdx) in item.bundleInstance.bundleItems"
                    :key="bundleIdx"
                    class="ms-2"
                  >
                    • {{ bundleItem.quantity }}x {{ bundleItem.voucherName }}
                  </div>
                </div>

                <!-- 餐點備註 -->
                <div v-if="item.note" class="text-muted small">備註: {{ item.note }}</div>
              </div>

              <div class="text-end ms-3">
                <div class="fw-bold">x{{ item.quantity }}</div>
                <div class="text-primary fw-bold">${{ item.subtotal || 0 }}</div>
              </div>
            </div>

            <hr v-if="index < orderDetails.items.length - 1" class="my-3" />
          </div>

          <!-- 金額明細 -->
          <div class="order-total mt-4 pt-3 border-top">
            <div class="d-flex justify-content-between mb-2">
              <span>小計</span>
              <span>${{ orderSubtotal }}</span>
            </div>

            <div class="d-flex justify-content-between mb-2" v-if="orderDetails.serviceCharge > 0">
              <span>服務費</span>
              <span>${{ orderDetails.serviceCharge }}</span>
            </div>

            <div
              class="d-flex justify-content-between mb-2"
              v-if="
                orderDetails.orderType === 'delivery' && orderDetails.deliveryInfo?.deliveryFee > 0
              "
            >
              <span>外送費</span>
              <span>${{ orderDetails.deliveryInfo.deliveryFee }}</span>
            </div>

            <div
              v-for="(discount, discountIndex) in orderDetails.discounts || []"
              :key="discountIndex"
              class="d-flex justify-content-between mb-2"
            >
              <span class="text-success">
                <i :class="getDiscountIcon(discount.discountModel)" class="me-1"></i>
                {{ formatDiscountType(discount.discountModel) }}
              </span>
              <span class="text-success">-${{ discount.amount || 0 }}</span>
            </div>

            <div
              class="d-flex justify-content-between mb-2"
              v-if="orderDetails.manualAdjustment && orderDetails.manualAdjustment !== 0"
            >
              <span>{{ orderDetails.manualAdjustment > 0 ? '額外費用' : '額外優惠' }}</span>
              <span :class="orderDetails.manualAdjustment > 0 ? 'text-danger' : 'text-success'">
                {{ orderDetails.manualAdjustment > 0 ? '+' : '-' }}${{
                  Math.abs(orderDetails.manualAdjustment)
                }}
              </span>
            </div>

            <div class="d-flex justify-content-between fw-bold fs-5 text-primary pt-2 border-top">
              <span>總計</span>
              <span>${{ orderDetails.total || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 點數獎勵提示 -->
        <div
          v-if="pointsEarned > 0"
          class="points-reward-card bg-warning bg-opacity-10 border border-warning rounded-3 p-3 mb-4"
        >
          <div class="d-flex align-items-center">
            <i class="bi bi-star-fill text-warning me-2"></i>
            <span
              >恭喜您獲得 <strong>{{ pointsEarned }}</strong> 點獎勵點數！</span
            >
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="d-grid gap-2">
          <button
            class="btn btn-outline-secondary py-2"
            @click="checkOrderStatus"
            :disabled="isRefreshing"
          >
            <span
              v-if="isRefreshing"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            {{ isRefreshing ? '更新中...' : '刷新頁面' }}
          </button>
        </div>
      </div>

      <!-- 載入中 -->
      <div v-else class="d-flex justify-content-center align-items-center" style="min-height: 50vh">
        <div class="text-center">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">載入中...</span>
          </div>
          <p>載入訂單資訊中...</p>
        </div>
      </div>

      <!-- 錯誤提示 -->
      <div v-if="errorMessage && !isLoading" class="alert alert-danger m-3" role="alert">
        <i class="bi bi-exclamation-triangle me-2"></i>
        {{ errorMessage }}
        <button class="btn btn-outline-danger btn-sm ms-2" @click="retryFetchOrder">重試</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/customerAuth'
import api from '@/api'

const route = useRoute()
const cartStore = useCartStore()
const authStore = useAuthStore()

// 訂單資訊
const orderDetails = ref({})
const pointsEarned = ref(0)
const isLoading = ref(true)
const isRefreshing = ref(false)
const errorMessage = ref('')

// 進度條配置
const steps = ref([
  { id: 1, title: '送出訂單', icon: '📄' },
  { id: 2, title: '待付款', icon: '⏳' },
  { id: 3, title: '已完成', icon: '✓' },
])

// 計算屬性
const currentStep = computed(() => {
  if (!orderDetails.value.status) return 1

  switch (orderDetails.value.status) {
    case 'unpaid':
      return 2
    case 'paid':
    case 'completed':
      return 3
    case 'cancelled':
      return 1
    default:
      return 1
  }
})

// 計算訂單小計
const orderSubtotal = computed(() => {
  if (!orderDetails.value.items) return 0
  return orderDetails.value.items.reduce((total, item) => total + (item.subtotal || 0), 0)
})

// 格式化折扣類型顯示文字
const formatDiscountType = (discountModel) => {
  const discountTypes = {
    VoucherInstance: '兌換券優惠',
    CouponInstance: '折價券優惠',
  }
  return discountTypes[discountModel] || '優惠折扣'
}

// 獲取折扣圖示
const getDiscountIcon = (discountModel) => {
  const discountIcons = {
    VoucherInstance: 'bi-ticket-perforated',
    CouponInstance: 'bi-percent',
  }
  return discountIcons[discountModel] || 'bi-tag'
}

// 獲取步驟狀態
const getStepStatus = (stepId) => {
  if (orderDetails.value.status === 'cancelled') {
    return stepId === 1 ? 'current' : 'pending'
  }

  if (stepId < currentStep.value || currentStep.value === 3) return 'completed'
  if (stepId === currentStep.value) return 'current'
  return 'pending'
}

// 獲取項目名稱
const getItemName = (item) => {
  if (item.itemType === 'dish') {
    return item.dishInstance?.name || item.itemName || '未知餐點'
  } else if (item.itemType === 'bundle') {
    return item.bundleInstance?.name || item.itemName || '未知套餐'
  }
  return item.itemName || '未知商品'
}

// 格式化訂單類型
const formatOrderType = (type) => {
  const types = {
    dine_in: '內用',
    takeout: '自取',
    delivery: '外送',
  }
  return types[type] || type
}

// 格式化付款方式
const formatPaymentMethod = (method) => {
  const methods = {
    cash: '現金',
    credit_card: '信用卡',
    line_pay: 'LINE Pay',
    other: '其他',
  }
  return methods[method] || method
}

// 格式化日期時間
const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  try {
    const date = new Date(dateTime)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    return dateTime
  }
}

// 格式化取餐時間
const formatPickupTime = (time) => {
  if (!time) return '盡快取餐'
  return formatDateTime(time)
}

// 查詢訂單狀態
const checkOrderStatus = async () => {
  isRefreshing.value = true
  try {
    await fetchOrderDetails()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    isRefreshing.value = false
  }
}

// 重試獲取訂單
const retryFetchOrder = () => {
  errorMessage.value = ''
  fetchOrderDetails()
}

// 獲取訂單詳情
const fetchOrderDetails = async () => {
  try {
    if (!isRefreshing.value) {
      isLoading.value = true
    }
    errorMessage.value = ''

    // 獲取訂單ID和品牌ID
    let orderId = route.params.orderId || sessionStorage.getItem('lastOrderId')
    let brandId =
      cartStore.currentBrandId ||
      authStore.currentBrandId ||
      sessionStorage.getItem('currentBrandId')

    console.log('獲取訂單詳情:', { orderId, brandId })

    if (!orderId) {
      throw new Error('缺少訂單ID')
    }

    if (!brandId) {
      throw new Error('缺少品牌資訊')
    }

    // 調用新的API獲取訂單詳情
    const response = await api.orderCustomer.getUserOrderById({
      brandId: brandId,
      orderId: orderId,
    })

    console.log('API回應:', response)

    if (response && response.success !== false) {
      // 處理API回應 - 可能直接是訂單數據，也可能包裝在response中
      const orderData = response.order || response
      orderDetails.value = orderData

      // 獲取點數獎勵資訊（如果有的話）
      if (orderDetails.value.pointsEarned) {
        pointsEarned.value = orderDetails.value.pointsEarned
      }

      console.log('訂單詳情載入成功:', orderDetails.value)
    } else {
      throw new Error(response?.message || '無法獲取訂單資訊')
    }
  } catch (error) {
    console.error('獲取訂單詳情失敗:', error)

    // 設置錯誤訊息
    if (error.response?.status === 404) {
      errorMessage.value = '找不到此訂單，可能已被刪除或不存在'
    } else if (error.response?.status === 403) {
      errorMessage.value = '無權查看此訂單'
    } else {
      errorMessage.value = error.message || '無法載入訂單資訊，請稍後再試'
    }

    // 如果是用戶未登入且有購物車資料，使用購物車資料作為備用
    if (!authStore.isLoggedIn && cartStore.items.length > 0) {
      console.log('使用購物車備用資料')
      orderDetails.value = {
        sequence: 'TEMP' + Date.now().toString().slice(-6),
        orderType: cartStore.orderType,
        paymentMethod: cartStore.paymentMethod,
        status: 'unpaid',
        createdAt: new Date().toISOString(),
        items: cartStore.items.map((item) => {
          if (item.dishInstance) {
            return {
              itemType: 'dish',
              dishInstance: {
                name: item.dishInstance.name,
                options: item.dishInstance.options || [],
              },
              quantity: item.quantity,
              subtotal: item.subtotal,
              note: item.note || '',
            }
          } else if (item.bundleInstance) {
            return {
              itemType: 'bundle',
              bundleInstance: {
                name: item.bundleInstance.name,
                bundleItems: item.bundleInstance.bundleItems || [],
              },
              quantity: item.quantity,
              subtotal: item.subtotal,
              note: item.note || '',
            }
          }
          return item
        }),
        total: cartStore.total,
        serviceCharge: cartStore.serviceCharge,
        notes: cartStore.notes,
        customerInfo: cartStore.customerInfo,
        dineInInfo: cartStore.dineInInfo,
        deliveryInfo: cartStore.deliveryInfo,
        estimatedPickupTime: cartStore.estimatedPickupTime,
        discounts: cartStore.appliedCoupons.map((coupon) => ({
          amount: coupon.amount || coupon.value || 0,
        })),
      }
      errorMessage.value = '' // 清除錯誤訊息
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  // ✅ 檢查是否從線上付款成功返回
  const urlParams = new URLSearchParams(window.location.search)
  const paymentSuccess = urlParams.get('payment_success') === 'true'

  // 獲取訂單詳情
  await fetchOrderDetails()

  // 如果是線上付款成功，清空暫存的購物車和正式購物車
  if (paymentSuccess && orderDetails.value.status === 'paid') {
    console.log('💳 線上付款成功，清空購物車和暫存資料')

    // 清空暫存的購物車資料
    cartStore.clearPendingCart()

    // 清空正式購物車
    cartStore.clearCart()
  }
})
</script>

<style scoped>
.order-confirm-view {
  min-height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
}

.container-wrapper {
  max-width: 540px;
  width: 100%;
  background-color: white;
  min-height: 100vh;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
}

.header {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.success-icon {
  width: 60px;
  height: 60px;
}

.order-item:last-child hr {
  display: none;
}

.points-reward-card {
  border: 1px solid #ffc107 !important;
}

/* 訂單已取消樣式 */
.cancelled-notice {
  padding: 2rem 0;
}

.cancelled-icon {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 進度條樣式 */
.progress-container {
  position: relative;
}

.progress-steps {
  position: relative;
  padding: 20px 0;
  margin: 20px 0;
}

.progress-line {
  position: absolute;
  top: 50%;
  left: 60px;
  right: 60px;
  height: 4px;
  background: linear-gradient(90deg, #e9ecef 0%, #f8f9fa 100%);
  border-radius: 2px;
  transform: translateY(-50%);
  z-index: 1;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0d6efd 0%, #0b5ed7 50%, #0a58ca 100%);
  border-radius: 2px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px rgba(13, 110, 253, 0.3);
}

.steps-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  max-width: 120px;
}

.step-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 12px;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.step-item.pending .step-circle {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 3px solid #dee2e6;
  color: #6c757d;
}

.step-item.current .step-circle {
  background: linear-gradient(135deg, #198754 0%, #20c997 100%);
  border: 3px solid #ffffff;
  color: white;
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(25, 135, 84, 0.4);
}

.step-item.completed .step-circle {
  background: linear-gradient(135deg, #0d6efd 0%, #6610f2 100%);
  border: 3px solid #ffffff;
  color: white;
  box-shadow: 0 4px 16px rgba(13, 110, 253, 0.3);
}

.step-icon {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-label {
  text-align: center;
  margin-top: 4px;
}

.step-title {
  font-size: 14px;
  font-weight: 500;
  transition: color 0.3s ease;
  display: block;
  line-height: 1.3;
}

.step-item.pending .step-title {
  color: #6c757d;
}

.step-item.current .step-title {
  color: #198754;
  font-weight: 600;
}

.step-item.completed .step-title {
  color: #0d6efd;
  font-weight: 600;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .progress-line {
    left: 40px;
    right: 40px;
  }

  .step-circle {
    width: 48px;
    height: 48px;
  }

  .step-icon {
    font-size: 16px;
  }

  .step-title {
    font-size: 12px;
  }

  .step-item {
    max-width: 80px;
  }
}

/* 動畫效果 */
.step-item.current .step-circle::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border-radius: 50%;
  background: linear-gradient(45deg, #198754, #20c997);
  z-index: -1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 576px) {
  .container-wrapper {
    max-width: 100%;
  }
}
</style>
