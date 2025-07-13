<template>
  <div class="main-container">
    <!-- 頂部導航欄 -->
    <div class="nav-container">
      <div class="nav-wrapper">
        <nav class="navbar navbar-light">
          <div class="container-fluid px-3">
            <a class="navbar-brand" href="#" @click.prevent="goBack">
              <i class="bi bi-arrow-left me-2"></i>返回
            </a>
            <div class="navbar-title">我的訂單</div>
            <div class="nav-placeholder"></div>
          </div>
        </nav>
        <div class="nav-border"></div>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">載入中...</span>
        </div>
        <p class="mt-3">載入您的訂單資料中，請稍候...</p>
      </div>

      <div v-else-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
        <button class="btn btn-outline-danger btn-sm mt-2" @click="loadOrdersData">
          <i class="bi bi-arrow-clockwise me-1"></i>重新載入
        </button>
      </div>

      <div v-else class="orders-content">
        <!-- 訂單統計 -->
        <div class="orders-overview">
          <div class="overview-stats">
            <div class="stat-item">
              <div class="stat-number">{{ totalOrders }}</div>
              <div class="stat-label">總訂單數</div>
              <div class="stat-label">(最多顯示30筆)</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${{ totalAmount.toLocaleString() }}</div>
              <div class="stat-label">總消費金額</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ pendingOrders.length }}</div>
              <div class="stat-label">待處理訂單</div>
            </div>
          </div>
        </div>

        <!-- 狀態篩選 -->
        <div class="status-filter">
          <button
            class="filter-btn"
            :class="{ active: selectedStatus === 'all' }"
            @click="selectedStatus = 'all'"
          >
            全部 ({{ orders.length }})
          </button>
          <button
            class="filter-btn"
            :class="{ active: selectedStatus === 'unpaid' }"
            @click="selectedStatus = 'unpaid'"
          >
            待付款 ({{ unpaidOrders.length }})
          </button>
          <button
            class="filter-btn"
            :class="{ active: selectedStatus === 'paid' }"
            @click="selectedStatus = 'paid'"
          >
            已付款 ({{ paidOrders.length }})
          </button>
          <button
            class="filter-btn"
            :class="{ active: selectedStatus === 'cancelled' }"
            @click="selectedStatus = 'cancelled'"
          >
            已取消 ({{ cancelledOrders.length }})
          </button>
        </div>

        <!-- 訂單列表 -->
        <div class="orders-list">
          <div v-if="filteredOrders.length > 0">
            <div
              v-for="order in filteredOrders"
              :key="order._id"
              class="order-card"
              @click="showOrderDetail(order)"
            >
              <div class="order-header">
                <div class="order-info">
                  <h6 class="order-number">訂單編號：{{ generateOrderNumber(order) }}</h6>
                  <p class="order-date">{{ formatDateTime(order.createdAt) }}</p>
                </div>
                <div class="order-status">
                  <span :class="getStatusClass(order.status)">{{
                    formatStatus(order.status)
                  }}</span>
                </div>
              </div>

              <div class="order-content">
                <div class="order-store" v-if="order.store">
                  <i class="bi bi-shop me-1"></i>
                  {{ order.store.name || '店鋪資訊' }}
                </div>

                <div class="order-items">
                  <div v-for="(item, index) in order.items" :key="index" class="order-item">
                    <span class="item-name">{{ item.dishInstance?.name || '餐點' }}</span>
                    <span class="item-quantity">x{{ item.quantity }}</span>
                  </div>
                </div>

                <div class="order-summary">
                  <div class="payment-info">
                    <span class="payment-method">
                      <i class="bi bi-credit-card me-1"></i>
                      {{ formatPaymentMethod(order.paymentMethod) }}
                    </span>
                    <span class="order-type">
                      <i class="bi bi-bag me-1"></i>
                      {{ formatOrderType(order.orderType) }}
                    </span>
                  </div>
                  <div class="order-total">總計：${{ order.total.toLocaleString() }}</div>
                </div>
              </div>

              <div class="order-actions">
                <button class="btn btn-outline-primary btn-sm" @click.stop="showOrderDetail(order)">
                  查看詳情
                </button>
                <button
                  v-if="canReorder(order)"
                  class="btn btn-primary btn-sm ms-2"
                  @click.stop="reorder(order)"
                >
                  再次訂購
                </button>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <i class="bi bi-bag text-muted" style="font-size: 4rem"></i>
            <h5 class="mt-3 text-muted">
              {{
                selectedStatus === 'all'
                  ? '沒有訂單記錄'
                  : `沒有${getStatusLabel(selectedStatus)}的訂單`
              }}
            </h5>
            <p class="text-muted">
              {{ selectedStatus === 'all' ? '快去點餐吧！' : '切換到其他狀態查看訂單' }}
            </p>
          </div>
        </div>

        <!-- 載入更多按鈕 -->
        <div v-if="hasMoreOrders" class="load-more-section">
          <button
            class="btn btn-outline-secondary"
            @click="loadMoreOrders"
            :disabled="isLoadingMore"
          >
            <span
              v-if="isLoadingMore"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            載入更多訂單
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 訂單詳情模態框 -->
  <BModal id="orderDetailModal" title="訂單詳情" size="lg" ref="orderDetailModal">
    <div v-if="selectedOrder" class="order-detail">
      <div class="detail-header">
        <div class="detail-status">
          <span :class="getStatusClass(selectedOrder.status)">{{
            formatStatus(selectedOrder.status)
          }}</span>
        </div>
        <div class="detail-info">
          <h5>訂單編號：{{ generateOrderNumber(selectedOrder) }}</h5>
          <p class="text-muted">下單時間：{{ formatDateTime(selectedOrder.createdAt) }}</p>
          <p class="text-muted" v-if="selectedOrder.store">
            <i class="bi bi-shop me-1"></i>
            {{ selectedOrder.store.name }}
          </p>
        </div>
      </div>

      <div class="detail-content">
        <div class="detail-section">
          <h6>訂單項目</h6>
          <div class="items-list">
            <div v-for="(item, index) in selectedOrder.items" :key="index" class="item-detail">
              <div class="item-info">
                <div class="item-name">{{ item.dishInstance?.name || '餐點' }}</div>
                <div
                  v-if="item.dishInstance?.options && item.dishInstance.options.length > 0"
                  class="item-options"
                >
                  <span
                    v-for="(category, catIndex) in item.dishInstance.options"
                    :key="catIndex"
                    class="option-category"
                  >
                    <span
                      v-for="(selection, selIndex) in category.selections"
                      :key="selIndex"
                      class="option-tag"
                    >
                      {{ selection.optionName || selection.name }}
                    </span>
                  </span>
                </div>
                <div class="item-note" v-if="item.note">備註：{{ item.note }}</div>
              </div>
              <div class="item-pricing">
                <div class="item-quantity">x{{ item.quantity }}</div>
                <div class="item-price">${{ item.subtotal.toLocaleString() }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h6>配送資訊</h6>
          <div class="delivery-info">
            <div class="info-item">
              <strong>取餐方式：</strong>
              {{ formatOrderType(selectedOrder.orderType) }}
            </div>
            <div v-if="selectedOrder.customerInfo?.name" class="info-item">
              <strong>聯絡人：</strong>
              {{ selectedOrder.customerInfo.name }}
            </div>
            <div v-if="selectedOrder.customerInfo?.phone" class="info-item">
              <strong>聯絡電話：</strong>
              {{ selectedOrder.customerInfo.phone }}
            </div>
            <div v-if="selectedOrder.deliveryInfo?.address" class="info-item">
              <strong>配送地址：</strong>
              {{ selectedOrder.deliveryInfo.address }}
            </div>
            <div v-if="selectedOrder.dineInInfo?.tableNumber" class="info-item">
              <strong>桌號：</strong>
              {{ selectedOrder.dineInInfo.tableNumber }}
            </div>
            <div v-if="selectedOrder.estimatedPickupTime" class="info-item">
              <strong>預計取餐時間：</strong>
              {{ formatDateTime(selectedOrder.estimatedPickupTime) }}
            </div>
            <div v-if="selectedOrder.notes" class="info-item">
              <strong>訂單備註：</strong>
              {{ selectedOrder.notes }}
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h6>付款資訊</h6>
          <div class="payment-detail">
            <div class="payment-row">
              <span>小計</span>
              <span>${{ selectedOrder.subtotal.toLocaleString() || 0 }}</span>
            </div>
            <div v-if="selectedOrder.serviceCharge > 0" class="payment-row">
              <span>服務費</span>
              <span>${{ selectedOrder.serviceCharge }}</span>
            </div>
            <div v-if="selectedOrder.deliveryInfo?.deliveryFee > 0" class="payment-row">
              <span>外送費</span>
              <span>${{ selectedOrder.deliveryInfo.deliveryFee }}</span>
            </div>
            <div v-if="selectedOrder.totalDiscount > 0" class="payment-row text-success">
              <span>優惠折扣</span>
              <span>-${{ selectedOrder.totalDiscount }}</span>
            </div>
            <div
              v-if="selectedOrder.manualAdjustment && selectedOrder.manualAdjustment !== 0"
              class="payment-row"
            >
              <span>{{ selectedOrder.manualAdjustment > 0 ? '額外費用' : '額外折扣' }}</span>
              <span
                >{{ selectedOrder.manualAdjustment > 0 ? '+' : '' }}${{
                  selectedOrder.manualAdjustment
                }}</span
              >
            </div>
            <div class="payment-row total">
              <span>總計</span>
              <span>${{ selectedOrder.total.toLocaleString() }}</span>
            </div>
            <div class="payment-method">
              <strong>付款方式：</strong>
              {{ formatPaymentMethod(selectedOrder.paymentMethod) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer-actions">
        <BButton variant="secondary" @click="$refs.orderDetailModal.hide()"> 關閉 </BButton>
        <BButton
          v-if="selectedOrder && canReorder(selectedOrder)"
          variant="primary"
          @click="reorder(selectedOrder)"
        >
          再次訂購
        </BButton>
      </div>
    </template>
  </BModal>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/customerAuth'
import { BModal, BButton } from 'bootstrap-vue-next'
import api from '@/api'

// 路由
const router = useRouter()
const authStore = useAuthStore()

// 模態框參考
const orderDetailModal = ref(null)

// 狀態管理
const isLoading = ref(true)
const isLoadingMore = ref(false)
const errorMessage = ref('')
const selectedStatus = ref('all')
const selectedOrder = ref(null)

// 訂單資料
const orders = ref([])
const currentPage = ref(1)
const hasMoreOrders = ref(false)
const pageLimit = ref(30)

// 品牌ID計算屬性
const brandId = computed(() => {
  return sessionStorage.getItem('currentBrandId')
})

// 計算屬性
const totalOrders = computed(() => orders.value.length)

const totalAmount = computed(() => {
  return orders.value
    .filter((order) => order.status === 'paid')
    .reduce((sum, order) => sum + (order.total || 0), 0)
})

const unpaidOrders = computed(() => {
  return orders.value.filter((order) => order.status === 'unpaid')
})

const paidOrders = computed(() => {
  return orders.value.filter((order) => order.status === 'paid')
})

const pendingOrders = computed(() => {
  return unpaidOrders.value
})

const cancelledOrders = computed(() => {
  return orders.value.filter((order) => order.status === 'cancelled')
})

const filteredOrders = computed(() => {
  if (selectedStatus.value === 'all') {
    return orders.value
  }
  return orders.value.filter((order) => order.status === selectedStatus.value)
})

// 返回上一頁
const goBack = () => {
  router.push('/member')
}

// 生成訂單編號
const generateOrderNumber = (order) => {
  return `${order.orderDateCode}-${String(order.sequence).padStart(3, '0')}`
}

// 格式化狀態
const formatStatus = (status) => {
  const statusMap = {
    unpaid: '待付款',
    paid: '已付款',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}

// 獲取狀態樣式
const getStatusClass = (status) => {
  const statusClasses = {
    unpaid: 'badge bg-warning',
    paid: 'badge bg-success',
    cancelled: 'badge bg-danger',
  }
  return statusClasses[status] || 'badge bg-secondary'
}

// 獲取狀態標籤
const getStatusLabel = (status) => {
  const statusLabels = {
    unpaid: '待付款',
    paid: '已付款',
    cancelled: '已取消',
  }
  return statusLabels[status] || status
}

// 格式化支付方式
const formatPaymentMethod = (method) => {
  const methodMap = {
    credit_card: '信用卡',
    cash: '現金',
    line_pay: 'LINE Pay',
    apple_pay: 'Apple Pay',
    other: '其他',
  }
  return methodMap[method] || method || '未設定'
}

// 格式化訂單類型
const formatOrderType = (type) => {
  const typeMap = {
    dine_in: '內用',
    takeout: '外帶',
    delivery: '外送',
  }
  return typeMap[type] || type
}

// 格式化日期時間
const formatDateTime = (dateString) => {
  if (!dateString) return '未設定'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '無效日期'

  return date.toLocaleString('zh-TW')
}

// 判斷是否可以重新訂購
const canReorder = (order) => {
  return ['paid', 'cancelled'].includes(order.status)
}

// 顯示訂單詳情
const showOrderDetail = async (order) => {
  console.log('顯示訂單詳情:', order)
  selectedOrder.value = order
  if (orderDetailModal.value) {
    orderDetailModal.value.show()
  }
}

// 重新訂購
const reorder = (order) => {
  // TODO: 實作重新訂購邏輯
  console.log('重新訂購:', order)
  // 可以跳轉到購物車頁面，預填訂單項目
  // router.push('/cart');
}

// 載入更多訂單
const loadMoreOrders = async () => {
  if (!hasMoreOrders.value || isLoadingMore.value) {
    return
  }

  try {
    isLoadingMore.value = true

    const currentBrandId = brandId.value
    if (!currentBrandId) {
      throw new Error('無法獲取品牌資訊')
    }

    const nextPage = currentPage.value + 1
    const response = await api.orderCustomer.getUserOrders({
      brandId: currentBrandId,
      page: nextPage,
      limit: pageLimit.value,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })

    if (response.orders && response.orders.length > 0) {
      orders.value = [...orders.value, ...response.orders]
      currentPage.value = nextPage
      hasMoreOrders.value = response.pagination?.hasNextPage || false
    } else {
      hasMoreOrders.value = false
    }
  } catch (error) {
    console.error('載入更多訂單失敗:', error)
    errorMessage.value = '載入更多訂單失敗'
  } finally {
    isLoadingMore.value = false
  }
}

// 載入訂單資料
const loadOrdersData = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const currentBrandId = brandId.value
    if (!currentBrandId) {
      throw new Error('無法獲取品牌資訊')
    }

    // 檢查用戶是否已登入
    if (!authStore.isLoggedIn) {
      throw new Error('請先登入以查看訂單資料')
    }

    const response = await api.orderCustomer.getUserOrders({
      brandId: currentBrandId,
      page: 1,
      limit: pageLimit.value,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })

    if (response) {
      orders.value = response.orders || []
      currentPage.value = 1
      hasMoreOrders.value = response.pagination?.hasNextPage || false
    }
  } catch (error) {
    console.error('載入訂單資料失敗:', error)

    if (error.response) {
      if (error.response.status === 401) {
        errorMessage.value = '請先登入以查看訂單資料'
        // 可以考慮跳轉到登入頁面
        // router.push('/auth/login');
      } else if (error.response.data && error.response.data.message) {
        errorMessage.value = error.response.data.message
      } else {
        errorMessage.value = `載入失敗：${error.response.status}`
      }
    } else if (error.message) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '無法載入訂單資料，請稍後再試'
    }
  } finally {
    isLoading.value = false
  }
}

// 組件掛載後載入資料
onMounted(async () => {
  // 確保品牌ID存在
  if (brandId.value) {
    authStore.setBrandId(brandId.value)
  }

  // 先檢查登入狀態
  if (!authStore.isLoggedIn) {
    await authStore.checkAuthStatus()
  }

  // 然後載入訂單資料
  await loadOrdersData()
})
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* 導航欄樣式 */
.nav-container {
  position: fixed;
  top: 0;
  width: 100%;
  max-width: 736px;
  z-index: 1030;
  left: 50%;
  transform: translateX(-50%);
}

.nav-wrapper {
  width: 100%;
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.navbar {
  width: 100%;
  background-color: #ffffff;
  margin-bottom: 0;
  padding: 0.8rem 1rem;
}

.navbar-brand {
  color: #333;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.navbar-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 700;
  font-size: 1.1rem;
  color: #333;
}

.nav-placeholder {
  width: 30px;
}

.nav-border {
  height: 3px;
  background: linear-gradient(to right, #d35400, #e67e22);
  width: 100%;
}

/* 內容容器 */
.content-wrapper {
  width: 100%;
  max-width: 736px;
  margin: 0 auto;
  padding: 80px 15px 30px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.orders-content {
  margin-bottom: 2rem;
}

/* 訂單統計 */
.orders-overview {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #d35400;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #6c757d;
}

/* 狀態篩選 */
.status-filter {
  display: flex;
  background-color: white;
  border-radius: 12px;
  padding: 0.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
  gap: 0.25rem;
}

.filter-btn {
  flex: 1;
  min-width: 120px;
  padding: 0.75rem 1rem;
  border: none;
  background-color: transparent;
  border-radius: 8px;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-btn.active {
  background-color: #d35400;
  color: white;
}

.filter-btn:hover:not(.active) {
  background-color: #f8f9fa;
}

/* 訂單卡片 */
.orders-list {
  margin-bottom: 2rem;
}

.order-card {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.order-number {
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #333;
}

.order-date {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0;
}

.order-content {
  margin-bottom: 1rem;
}

.order-store {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.75rem;
}

.order-items {
  margin-bottom: 1rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.item-name {
  color: #333;
}

.item-quantity {
  color: #6c757d;
  font-size: 0.9rem;
}

.more-items {
  color: #6c757d;
  font-size: 0.85rem;
  font-style: italic;
}

.order-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f1f1;
}

.payment-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.payment-method,
.order-type {
  font-size: 0.85rem;
  color: #6c757d;
}

.order-total {
  font-weight: 600;
  font-size: 1.1rem;
  color: #d35400;
}

.order-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* 空狀態 */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 載入更多 */
.load-more-section {
  text-align: center;
  padding: 1rem;
}

/* 訂單詳情模態框 */
.order-detail {
  padding: 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.detail-status {
  margin-right: 1rem;
}

.detail-info {
  flex: 1;
}

.detail-info h5 {
  margin-bottom: 0.5rem;
}

.detail-content {
  margin: 0;
}

.detail-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f1f1;
}

.detail-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.detail-section h6 {
  color: #333;
  margin-bottom: 1rem;
  font-weight: 600;
}

.items-list {
  margin: 0;
}

.item-detail {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.item-detail:last-child {
  border-bottom: none;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.item-options {
  margin-bottom: 0.25rem;
}

.option-tag {
  display: inline-block;
  background-color: #f8f9fa;
  color: #6c757d;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
}

.item-note {
  font-size: 0.85rem;
  color: #6c757d;
}

.item-pricing {
  text-align: right;
  margin-left: 1rem;
}

.item-quantity {
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.item-price {
  font-weight: 500;
  color: #333;
}

.delivery-info,
.payment-detail {
  margin: 0;
}

.info-item {
  margin-bottom: 0.75rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.payment-row.total {
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
  padding-top: 0.5rem;
  border-top: 1px solid #dee2e6;
  margin-top: 0.5rem;
}

.payment-method {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f1f1;
}

.modal-footer-actions {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  justify-content: flex-end;
}

/* 按鈕樣式 */
.btn-primary {
  background-color: #d35400;
  border-color: #d35400;
}

.btn-primary:hover,
.btn-primary:focus {
  background-color: #e67e22;
  border-color: #e67e22;
}

/* 響應式設計 */
@media (max-width: 576px) {
  .content-wrapper {
    padding-top: 70px;
  }

  .overview-stats {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .status-filter {
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-btn {
    min-width: auto;
  }

  .order-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-status {
    margin-top: 0.5rem;
  }

  .order-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .order-actions {
    width: 100%;
  }

  .order-actions .btn {
    flex: 1;
  }

  .detail-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-status {
    margin-right: 0;
    margin-bottom: 1rem;
  }

  .item-detail {
    flex-direction: column;
    align-items: flex-start;
  }

  .item-pricing {
    margin-left: 0;
    margin-top: 0.5rem;
    text-align: left;
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .modal-footer-actions {
    flex-direction: column;
  }

  .modal-footer-actions .btn {
    width: 100%;
  }
}
</style>
