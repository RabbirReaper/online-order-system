<template>
  <div class="container-fluid p-0">
    <div class="component-header bg-secondary text-white p-3">
      <div class="d-flex justify-content-between align-items-center">
        <h4 class="mb-0">訂單管理 {{ counterStore.currentDate }}</h4>
        <BButton variant="info" size="sm" @click="showStatsModal = true">
          <i class="bi bi-bar-chart-fill me-1"></i>
          統計
        </BButton>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div v-if="errorMessage" class="alert alert-danger m-3" role="alert">
      {{ errorMessage }}
      <button class="btn btn-outline-danger btn-sm ms-2" @click="fetchTodayOrders">重試</button>
    </div>

    <!-- 訂單表格 -->
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>時間</th>
            <th>訂單號</th>
            <th>取餐方式</th>
            <th>金額</th>
            <th>狀態</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading && counterStore.todayOrders.length === 0">
            <td colspan="5" class="text-center py-4">
              <div class="spinner-border text-secondary" role="status">
                <span class="visually-hidden">載入中...</span>
              </div>
              <p class="mt-2">載入訂單資料中...</p>
            </td>
          </tr>
          <tr v-else-if="counterStore.todayOrders.length === 0">
            <td colspan="5" class="text-center py-4">
              <p class="text-muted">沒有訂單</p>
            </td>
          </tr>
          <tr
            v-for="order in sortedOrders"
            :key="order._id"
            :class="{
              'table-active':
                counterStore.selectedOrder && counterStore.selectedOrder._id === order._id,
              'table-loading': selectedOrderId === order._id && isSelectingOrder,
            }"
            @click="selectOrder(order)"
            class="order-row"
            :style="{
              cursor: isSelectingOrder ? 'wait' : 'pointer',
              pointerEvents: isSelectingOrder ? 'none' : 'auto',
            }"
          >
            <td>{{ counterStore.formatTime(order.createdAt) }}</td>
            <td v-if="order.platformOrderId" class="fs-5">{{ order.platformOrderId }}</td>
            <td v-else class="fs-5">{{ order.sequence }}</td>
            <td>
              <span :class="getOrderTypeClass(order.orderType)">
                {{ formatOrderType(order.orderType) }}
              </span>
              <span v-if="order.dineInInfo?.tableNumber" class="ms-1 badge bg-info">
                桌號: {{ order.dineInInfo.tableNumber }}
              </span>
              <span v-if="order.orderType === 'delivery'" class="ms-1 badge bg-info">
                {{ order.platformInfo.platform }}
              </span>
              <div
                v-if="selectedOrderId === order._id && isSelectingOrder"
                class="spinner-border spinner-border-sm ms-2 text-primary d-inline-block"
                role="status"
              >
                <span class="visually-hidden">載入中...</span>
              </div>
            </td>
            <td class="fs-5">${{ calculateOrderTotal(order) }}</td>
            <td>
              <span :class="counterStore.getStatusClass(order.status)">
                {{ counterStore.formatStatus(order.status) }}
              </span>
              <span v-if="order.status === 'paid'" class="ms-1 badge bg-secondary">
                {{ order.paymentMethod }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 統計 Modal -->
    <BModal v-model="showStatsModal" title="訂單統計" size="lg" centered no-footer>
      <div class="stats-content">
        <div class="row g-3">
          <!-- 現金付款 -->
          <div class="col-md-6">
            <div class="card border-success">
              <div class="card-body">
                <h6 class="card-title text-success">
                  <i class="bi bi-cash-stack me-2"></i>現金付款
                </h6>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">訂單數:</span>
                  <span class="fs-5 fw-bold">{{ orderStats.cashCount }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2">
                  <span class="text-muted">金額:</span>
                  <span class="fs-4 fw-bold text-success">
                    ${{ orderStats.cashTotal.toLocaleString() }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 線上付款 -->
          <div class="col-md-6">
            <div class="card border-primary">
              <div class="card-body">
                <h6 class="card-title text-primary">
                  <i class="bi bi-credit-card me-2"></i>線上付款
                </h6>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">訂單數:</span>
                  <span class="fs-5 fw-bold">{{ orderStats.onlineCount }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2">
                  <span class="text-muted">金額:</span>
                  <span class="fs-4 fw-bold text-primary">
                    ${{ orderStats.onlineTotal.toLocaleString() }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- foodpanda -->
          <div class="col-md-6">
            <div class="card border-warning">
              <div class="card-body">
                <h6 class="card-title text-warning"><i class="bi bi-bicycle me-2"></i>foodpanda</h6>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">訂單數:</span>
                  <span class="fs-5 fw-bold">{{ orderStats.foodpandaCount }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2">
                  <span class="text-muted">金額:</span>
                  <span class="fs-4 fw-bold text-warning">
                    ${{ orderStats.foodpandaTotal.toLocaleString() }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- ubereats -->
          <div class="col-md-6">
            <div class="card border-dark">
              <div class="card-body">
                <h6 class="card-title"><i class="bi bi-bicycle me-2"></i>UberEats</h6>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">訂單數:</span>
                  <span class="fs-5 fw-bold">{{ orderStats.ubereatsCount }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2">
                  <span class="text-muted">金額:</span>
                  <span class="fs-4 fw-bold">
                    ${{ orderStats.ubereatsTotal.toLocaleString() }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 未付款 -->
          <div class="col-md-6">
            <div class="card border-danger">
              <div class="card-body">
                <h6 class="card-title text-danger">
                  <i class="bi bi-exclamation-triangle me-2"></i>未付款
                </h6>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">訂單數:</span>
                  <span class="fs-5 fw-bold">{{ orderStats.unpaidCount }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2">
                  <span class="text-muted">金額:</span>
                  <span class="fs-4 fw-bold text-danger">
                    ${{ orderStats.unpaidTotal.toLocaleString() }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 總營業額 -->
          <div class="col-md-6">
            <div class="card border-info bg-info bg-opacity-10">
              <div class="card-body">
                <h6 class="card-title text-info"><i class="bi bi-graph-up me-2"></i>總營業額</h6>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">總訂單數:</span>
                  <span class="fs-5 fw-bold">{{ orderStats.totalCount }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2">
                  <span class="text-muted">總金額:</span>
                  <span class="fs-3 fw-bold text-info">
                    ${{ orderStats.totalRevenue.toLocaleString() }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 text-center">
          <BButton variant="secondary" @click="showStatsModal = false">關閉</BButton>
        </div>
      </div>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCounterStore } from '@/stores/counter'
import { BButton, BModal } from 'bootstrap-vue-next'
import api from '@/api'

const props = defineProps({
  brandId: {
    type: String,
    required: true,
  },
  storeId: {
    type: String,
    required: true,
  },
})

const counterStore = useCounterStore()

const isLoading = ref(false)
const errorMessage = ref('')
const isSelectingOrder = ref(false)
const selectedOrderId = ref(null)
const showStatsModal = ref(false)

const sortedOrders = computed(() => {
  return [...counterStore.todayOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const orderStats = computed(() => {
  // 獲取今天的日期（格式：YYYY-MM-DD）
  const today = new Date().toLocaleDateString('en-CA')

  // 過濾今天的訂單
  const todayOrders = counterStore.todayOrders.filter((order) => {
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-CA')
    return orderDate === today
  })
  const stats = {
    cashCount: 0,
    cashTotal: 0,
    onlineCount: 0,
    onlineTotal: 0,
    foodpandaCount: 0,
    foodpandaTotal: 0,
    ubereatsCount: 0,
    ubereatsTotal: 0,
    unpaidCount: 0,
    unpaidTotal: 0,
    totalCount: 0,
    totalRevenue: 0,
  }

  todayOrders.forEach((order) => {
    const total = order.total || 0

    // 現金付款
    if (order.status !== 'unpaid' && order.paymentMethod === 'cash') {
      stats.cashCount++
      stats.cashTotal += total
    }

    // 線上付款（排除 cash 和 other）
    if (
      order.status === 'paid' &&
      order.paymentMethod !== 'cash' &&
      order.paymentMethod !== 'other'
    ) {
      stats.onlineCount++
      stats.onlineTotal += total
    }

    // foodpanda
    if (order.deliveryPlatform === 'foodpanda') {
      stats.foodpandaCount++
      stats.foodpandaTotal += total
    }

    // ubereats
    if (order.deliveryPlatform === 'ubereats') {
      stats.ubereatsCount++
      stats.ubereatsTotal += total
    }

    // 未付款
    if (order.status === 'unpaid') {
      stats.unpaidCount++
      stats.unpaidTotal += total
    }

    // 總計（只計算已付款的訂單）
    if (order.status === 'paid') {
      stats.totalCount++
      stats.totalRevenue += total
    }
  })

  return stats
})

const fetchTodayOrders = async () => {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    await counterStore.fetchTodayOrders(props.brandId, props.storeId)
  } catch (error) {
    console.error('獲取訂單失敗:', error)
    errorMessage.value = error.message || '獲取訂單失敗'
  } finally {
    isLoading.value = false
  }
}

const selectOrder = async (order) => {
  if (isSelectingOrder.value) {
    return
  }

  selectedOrderId.value = order._id
  isSelectingOrder.value = true
  errorMessage.value = ''

  try {
    const response = await api.orderAdmin.getOrderById({
      brandId: props.brandId,
      storeId: props.storeId,
      orderId: order._id,
    })

    if (response.success) {
      counterStore.selectOrder(response.order)
    }
  } catch (error) {
    console.error('獲取訂單詳情失敗:', error)
    errorMessage.value = '獲取訂單詳情失敗'
    selectedOrderId.value = null
  } finally {
    isSelectingOrder.value = false
  }
}

const getOrderTypeClass = (orderType) => {
  const classMap = {
    dine_in: 'badge bg-primary',
    takeout: 'badge bg-success',
    delivery: 'badge bg-warning text-dark',
  }
  return classMap[orderType] || 'badge bg-secondary'
}

const formatOrderType = (orderType) => {
  const typeMap = {
    dine_in: '內用',
    takeout: '自取',
    delivery: '外送',
  }
  return typeMap[orderType] || orderType
}

const calculateOrderTotal = (order) => {
  if (!order.items) return 0
  return order.total
}

onMounted(() => {
  fetchTodayOrders()
})
</script>

<style scoped>
.component-header {
  position: sticky;
  top: 0;
  z-index: 100;
}

table {
  font-size: 0.9rem;
}

.order-row {
  height: 50px;
  vertical-align: middle;
  transition: all 0.3s ease;
}

.order-row:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.badge {
  font-size: 0.95rem;
}

.table-active {
  --bs-table-active-bg: rgba(83, 109, 254, 0.35) !important;
  --bs-table-active-color: #000 !important;
  --bs-table-hover-bg: var(--bs-table-active-bg) !important;
  --bs-table-hover-color: var(--bs-table-active-color) !important;
}

.table-loading {
  --bs-table-bg: rgba(13, 202, 240, 0.1) !important;
  background: linear-gradient(
    45deg,
    rgba(13, 202, 240, 0.05) 0%,
    rgba(13, 202, 240, 0.15) 50%,
    rgba(13, 202, 240, 0.05) 100%
  );
  animation: gentle-pulse 2s ease-in-out infinite;
}

@keyframes gentle-pulse {
  0%,
  100% {
    background: linear-gradient(
      45deg,
      rgba(13, 202, 240, 0.05) 0%,
      rgba(13, 202, 240, 0.15) 50%,
      rgba(13, 202, 240, 0.05) 100%
    );
  }

  50% {
    background: linear-gradient(
      45deg,
      rgba(13, 202, 240, 0.1) 0%,
      rgba(13, 202, 240, 0.2) 50%,
      rgba(13, 202, 240, 0.1) 100%
    );
  }
}

.stats-content .card {
  transition: all 0.3s ease;
}

.stats-content .card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
